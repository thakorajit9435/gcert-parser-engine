import os
import re
import json
import time
import random
import threading
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# Use new google-genai SDK (replaces deprecated google.generativeai)
try:
    from google import genai as google_genai
    from google.genai import types as genai_types
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False
    google_genai = None
    genai_types = None

from jinja2 import Template
from config.settings import settings
from src.core.logger import logger
from src.core.exceptions import LLMProcessingError


# --- Global Gemini Rate Limiter ---
# Prevents 429 errors by enforcing minimum delay between consecutive API calls
# and providing centralized throttling across all pipeline steps.

class GeminiRateLimiter:
    """Thread-safe rate limiter for Gemini API calls.
    
    Enforces a minimum gap between consecutive API calls to stay within
    Gemini's RPM (Requests Per Minute) limits. For gemini-2.0-flash free tier,
    the limit is typically 10 RPM, so we default to ~6 seconds between calls.
    """
    
    def __init__(self, min_delay_seconds: float = 6.0):
        self._min_delay = min_delay_seconds
        self._last_call_time = 0.0
        self._lock = threading.Lock()
        self._consecutive_429_count = 0
    
    def wait_if_needed(self):
        """Blocks until enough time has passed since the last API call."""
        with self._lock:
            now = time.time()
            elapsed = now - self._last_call_time
            
            # Add extra delay if we've been hitting 429s recently
            effective_delay = self._min_delay
            if self._consecutive_429_count > 0:
                # Progressive backoff: double the delay for each consecutive 429
                effective_delay = self._min_delay * (2 ** min(self._consecutive_429_count, 4))
                logger.info(f"Rate limiter: Using extended delay of {effective_delay:.1f}s due to {self._consecutive_429_count} recent 429 errors.")
            
            if elapsed < effective_delay:
                wait_time = effective_delay - elapsed
                logger.debug(f"Rate limiter: Waiting {wait_time:.2f}s before next Gemini API call...")
                time.sleep(wait_time)
            
            self._last_call_time = time.time()
    
    def record_success(self):
        """Records a successful API call, resetting the 429 counter."""
        with self._lock:
            self._consecutive_429_count = 0
    
    def record_rate_limit(self):
        """Records a 429 rate limit error."""
        with self._lock:
            self._consecutive_429_count += 1


# Global singleton rate limiter shared across all LLMClient instances
_gemini_rate_limiter = GeminiRateLimiter(min_delay_seconds=1.0)

# --- Pydantic Schema Definitions for Structured Gemini Responses ---

class SubTopicExtract(BaseModel):
    title_gu: str
    title_en: Optional[str] = None

class ExampleExtract(BaseModel):
    title_gu: str
    description_gu: str

class TopicExtract(BaseModel):
    topic_number: int
    title_gu: str
    title_en: Optional[str] = None
    content_gu: str
    sub_topics: List[SubTopicExtract] = []
    examples: List[ExampleExtract] = []

class ChapterExtract(BaseModel):
    chapter_number: int
    chapter_title_gu: str
    title_gu: Optional[str] = None
    title_en: Optional[str] = None
    description: Optional[str] = None
    description_gu: Optional[str] = None
    summary_gu: str
    summary_en: Optional[str] = None
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    topics: List[TopicExtract] = []

class HierarchyResponse(BaseModel):
    chapters: List[ChapterExtract]

class TOCObject(BaseModel):
    chapter_number: int
    title_gu: str

class TOCResponse(BaseModel):
    chapters: List[TOCObject]



class KeyPointExtract(BaseModel):
    text_gu: str
    text_en: Optional[str] = None

class FormulaExtract(BaseModel):
    formula: str
    description_gu: Optional[str] = None
    description_en: Optional[str] = None

class ActivityExtract(BaseModel):
    title_gu: str
    instructions_gu: str
    materials_needed: List[str] = []
    duration_minutes: Optional[int] = None
    activity_type: str = "experiment"

class KeywordExtract(BaseModel):
    keyword_gu: str
    keyword_en: Optional[str] = None
    meaning_gu: str
    meaning_en: Optional[str] = None

class DifficultWordExtract(BaseModel):
    word_gu: str
    meaning_gu: str

class GlossaryExtract(BaseModel):
    word_gu: str
    word_en: Optional[str] = None
    definition_gu: str

class LearningOutcomeExtract(BaseModel):
    outcome_text_gu: str
    bloom_level: str
    measurable_verb_gu: str

class FeaturesResponse(BaseModel):
    learning_outcomes: List[LearningOutcomeExtract] = []
    key_points: List[KeyPointExtract] = []
    formulas: List[FormulaExtract] = []
    activities: List[ActivityExtract] = []
    keywords_list: List[KeywordExtract] = []
    difficult_words: List[DifficultWordExtract] = []
    glossary: List[GlossaryExtract] = []
    revision_notes_gu: List[str] = []


class MCQOptionExtract(BaseModel):
    id: str  # A, B, C, D
    text_gu: str

class MCQExtract(BaseModel):
    question_text_gu: str
    options: List[MCQOptionExtract]
    correct_option_id: str
    explanation_gu: Optional[str] = None
    bloom_level: str
    difficulty_level: str
    marks: int = 1

class QuestionExtract(BaseModel):
    question_text_gu: str
    question_type: str  # short_answer, long_answer, fill_in_blanks, true_false
    answer_gu: str
    bloom_level: str
    difficulty_level: str
    marks: int
    is_hots: bool = False
    is_previous_year_pattern: bool = False

class QuestionsResponse(BaseModel):
    questions: List[QuestionExtract] = []
    mcqs: List[MCQExtract] = []


def to_gemini_schema(pydantic_model: type[BaseModel]) -> Dict[str, Any]:
    """Converts a Pydantic model to a flat, dereferenced OpenAPI schema compatible with Gemini."""
    raw_schema = pydantic_model.model_json_schema()
    defs = raw_schema.get("$defs", {})
    
    def resolve_refs(node: Any) -> Any:
        if isinstance(node, dict):
            # 1. Resolve $ref
            if "$ref" in node:
                ref_key = node["$ref"].split("/")[-1]
                resolved = resolve_refs(defs[ref_key])
                for k, v in node.items():
                    if k not in ("$ref", "default", "title"):
                        resolved[k] = resolve_refs(v)
                return resolved
                
            # 2. Simplify anyOf (often generated for Optional fields in Pydantic v2)
            if "anyOf" in node:
                non_null_subnodes = [sub for sub in node["anyOf"] if sub.get("type") != "null" and "$ref" not in sub]
                if not non_null_subnodes:
                    non_null_subnodes = [sub for sub in node["anyOf"] if sub.get("type") != "null"]
                if non_null_subnodes:
                    first_subnode = resolve_refs(non_null_subnodes[0])
                    for k, v in node.items():
                        if k not in ("anyOf", "default", "title"):
                            first_subnode[k] = resolve_refs(v)
                    return first_subnode
                    
            # 3. Simplify list types like ["string", "null"] to just "string"
            if "type" in node and isinstance(node["type"], list):
                non_null_types = [t for t in node["type"] if t != "null"]
                if non_null_types:
                    node["type"] = non_null_types[0]
                    
            # 4. Filter out 'default' and 'title' keys and recursively process children
            return {k: resolve_refs(v) for k, v in node.items() if k not in ("default", "title")}
            
        elif isinstance(node, list):
            return [resolve_refs(item) for item in node]
        return node

    clean_schema = resolve_refs(raw_schema)
    if "$defs" in clean_schema:
        del clean_schema["$defs"]
    return clean_schema


# --- LLM Client Class Implementation ---

class LLMClient:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.gemini_model_name = settings.GEMINI_MODEL or "gemini-3.6-flash"
        self.ollama_model_name = settings.OLLAMA_MODEL or "qwen2.5:1.5b"

        # Initialize new google.genai client
        self._genai_client = None
        if settings.GEMINI_API_KEY and _GENAI_AVAILABLE:
            try:
                self._genai_client = google_genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Initialized google.genai client for Gemini API.")
            except Exception as ge:
                logger.warning(f"Failed to initialize google.genai client: {str(ge)}")
        
        if self.provider == "ollama":
            api_key = "ollama"
            base_url = settings.OLLAMA_BASE_URL or "http://localhost:11434/v1"
            self.model_name = self.ollama_model_name
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=api_key, base_url=base_url)
                self.client = self.openai_client
                logger.info(f"Initialized Ollama client for model '{self.model_name}' at '{base_url}'")
            except Exception as e:
                logger.warning(f"Failed to initialize Ollama client: {str(e)}")
                self.openai_client = None
                self.client = None
        else:
            self.provider = "gemini"
            self.model_name = self.gemini_model_name
            self.openai_client = None
            self.client = None

    def _render_prompt(self, template_name: str, context: dict) -> str:
        """Renders prompts dynamically using Jinja2 templates."""
        template_path = settings.BASE_DIR / "config" / "prompt_templates" / template_name
        if not os.path.exists(template_path):
            raise LLMProcessingError(f"Prompt template file not found at: {template_path}")
            
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
        return Template(content).render(context)

    def _call_structured(self, prompt: str, schema: Any) -> Dict[str, Any]:
        """Calls the configured LLM API (Ollama or Gemini) with JSON output."""
        if self.provider == "ollama":
            return self._call_ollama_structured(prompt, schema)
        else:
            return self._call_gemini_structured(prompt, schema)

    def _call_ollama_structured(self, prompt: str, schema: Any) -> Dict[str, Any]:
        """Calls Ollama API with JSON schema constraint, fallback to Gemini if Ollama is unavailable."""
        import time
        import random
        from openai import OpenAI

        # Quick check if Ollama is listening locally
        if not getattr(self, '_ollama_checked', False):
            import socket
            try:
                sock = socket.create_connection(("localhost", 11434), timeout=1.0)
                sock.close()
                self._ollama_available = True
            except Exception:
                self._ollama_available = False
            self._ollama_checked = True

        if not getattr(self, '_ollama_available', False):
            if settings.GEMINI_API_KEY:
                logger.info("Ollama is not running locally. Fallback to Gemini API...")
                return self._call_gemini_structured(prompt, schema)
            else:
                logger.warning("Ollama is not running locally and GEMINI_API_KEY is not configured.")

        client = getattr(self, 'client', None)
        model_name = getattr(self, 'model_name', None) or settings.OLLAMA_MODEL or "qwen2.5:1.5b"
        if not client:
            client = OpenAI(api_key="ollama", base_url=settings.OLLAMA_BASE_URL or "http://localhost:11434/v1", timeout=5.0)
            self.client = client

        max_retries = 3
        base_delay = 2.0

        safe_prompt = prompt

        schema_json_str = ""
        if schema:
            try:
                from pydantic import BaseModel
                if isinstance(schema, type) and issubclass(schema, BaseModel):
                    schema_json_str = json.dumps(schema.model_json_schema(), indent=2, ensure_ascii=False)
                elif isinstance(schema, dict):
                    schema_json_str = json.dumps(schema, indent=2, ensure_ascii=False)
            except Exception:
                pass

        system_msg = "You are an educational curriculum parser that outputs ONLY strict valid json matching the requested structure. Respond in valid json format. Do not include any intro, markdown code block wrappers, or text outside the raw JSON."
        if schema_json_str:
            system_msg += f"\n\nJSON SCHEMA:\n{schema_json_str}"

        try:
            for attempt in range(max_retries):
                try:
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_msg},
                            {"role": "user", "content": safe_prompt}
                        ],
                        response_format={"type": "json_object"}
                    )
                    content = response.choices[0].message.content
                    if not content:
                        return {}
                    
                    content_str = content.strip()
                    if content_str.startswith("```json"):
                        content_str = content_str[7:]
                    if content_str.startswith("```"):
                        content_str = content_str[3:]
                    if content_str.endswith("```"):
                        content_str = content_str[:-3]
                    content_str = content_str.strip()
                    
                    return json.loads(content_str)
                except Exception as e:
                    err_msg = str(e).lower()
                    if "404" in err_msg or "model_not_found" in err_msg or "connection" in err_msg or "refused" in err_msg:
                        logger.warning(f"Ollama model '{model_name}' not ready or server offline ({str(e)}).")
                        if settings.GEMINI_API_KEY:
                            logger.info("Falling back to Gemini...")
                            return self._call_gemini_structured(prompt, schema)
                        raise e

                    if any(x in err_msg for x in ["429", "413", "quota", "rate limit", "too many requests", "tpm"]):
                        if attempt == max_retries - 1:
                            logger.error(f"Ollama call failed after {max_retries} attempts: {str(e)}")
                            if settings.GEMINI_API_KEY:
                                return self._call_gemini_structured(prompt, schema)
                            raise e
                        
                        delay = 2.0 + base_delay * (2 ** attempt)
                        logger.warning(f"Rate/token limit hit. Retrying in {delay:.2f} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                    else:
                        logger.error(f"Ollama call failed: {str(e)}")
                        if settings.GEMINI_API_KEY:
                            return self._call_gemini_structured(prompt, schema)
                        raise e
            return {}
        except Exception as e:
            if settings.GEMINI_API_KEY:
                logger.warning(f"Ollama call failed ({str(e)}). Falling back to Gemini...")
                return self._call_gemini_structured(prompt, schema)
            logger.error(f"Structured call failed: {str(e)}")
            raise LLMProcessingError(f"LLM API request error: {str(e)}")

    def _call_gemini_structured(self, prompt: str, schema: Any) -> Dict[str, Any]:
        """Calls Gemini API with enforced JSON schema constraint using new google.genai SDK."""
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is not configured in settings. Returning empty JSON structure.")
            return {}

        if not _GENAI_AVAILABLE:
            logger.error("google-genai SDK not installed. Cannot call Gemini structured API.")
            return {}

        client = getattr(self, '_genai_client', None)
        if not client:
            try:
                client = google_genai.Client(api_key=settings.GEMINI_API_KEY)
                self._genai_client = client
            except Exception as e:
                logger.error("Failed to create google.genai client: %s", str(e))
                return {}

        target_model = getattr(self, 'gemini_model_name', None) or settings.GEMINI_MODEL or "gemini-3.6-flash"
        if any(x in target_model.lower() for x in ["qwen", "ollama", "llama", "gemini-2.0", "gemini-1.5"]):
            target_model = "gemini-3.6-flash"

        models_to_try = [target_model] + [
            m for m in ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-flash-latest"]
            if m != target_model
        ]

        # Convert Pydantic model to a flat, dereferenced schema
        from pydantic import BaseModel
        if isinstance(schema, type) and issubclass(schema, BaseModel):
            api_schema = to_gemini_schema(schema)
        else:
            api_schema = schema

        for m_name in models_to_try:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    _gemini_rate_limiter.wait_if_needed()

                    response = client.models.generate_content(
                        model=m_name,
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=api_schema,
                        )
                    )
                    _gemini_rate_limiter.record_success()
                    return json.loads(response.text)

                except Exception as e:
                    err_msg = str(e).lower()
                    if any(k in err_msg for k in ["404", "not found", "no longer available", "not_found"]):
                        logger.warning(f"Gemini model '{m_name}' not available. Trying next fallback...")
                        break  # Try next model
                    if any(k in err_msg for k in ["429", "quota", "rate limit", "resource_exhausted", "resourceexhausted"]):
                        _gemini_rate_limiter.record_rate_limit()
                        if attempt == max_retries - 1:
                            logger.error(f"Gemini structured call failed after {max_retries} attempts on {m_name}: {str(e)}")
                            break
                        delay = 2.0 * (2 ** attempt) + random.uniform(1, 2)
                        logger.warning(f"Gemini rate limit hit on {m_name}. Retrying in {delay:.1f}s...")
                        time.sleep(delay)
                    else:
                        logger.error(f"Gemini structured call failed on {m_name}: {str(e)}")
                        break  # Non-recoverable error, try next model

        return {}


    @staticmethod
    def _parse_retry_after(error_message: str) -> float:
        """Attempts to extract Retry-After seconds from a Gemini error message."""
        try:
            # Look for patterns like "retry after 30s" or "Retry-After: 30"
            match = re.search(r'retry[- ]after[:\s]*(\d+)', error_message, re.IGNORECASE)
            if match:
                return float(match.group(1))
            # Look for "try again in X seconds"
            match = re.search(r'try again in (\d+)', error_message, re.IGNORECASE)
            if match:
                return float(match.group(1))
        except Exception:
            pass
        return 0.0

    def _chunk_text(self, text: str, chunk_size: int = 7000, overlap: int = 700) -> List[str]:
        """Splits text into chunks of chunk_size with overlap to fit within LLM token limits."""
        chunks = []
        start = 0
        n = len(text)
        while start < n:
            end = min(start + chunk_size, n)
            chunks.append(text[start:end])
            if end == n:
                break
            start += chunk_size - overlap
        return chunks

    @staticmethod
    def _clean_int(val: Any) -> Optional[int]:
        if val is None:
            return None
        if isinstance(val, int):
            return val
        s = str(val).strip()
        guj_to_asc = str.maketrans("૦૧૨૩૪૫૬૭૮૯", "0123456789")
        s = s.translate(guj_to_asc)
        import re
        m = re.search(r'\d+', s)
        if m:
            try:
                res = int(m.group(0))
                return res if res > 0 else None
            except ValueError:
                pass
        return None

    def _extract_official_toc(self, raw_text: str) -> List[Dict[str, Any]]:
        """Extracts the official list of chapters from the Table of Contents (Index) page."""
        # Table of Contents usually appears in the first 7000 characters
        toc_chunk = raw_text[:7000]
        
        prompt = f"""
        You are an educational curriculum parser. Analyze the following OCR text from a textbook's introductory pages and extract the official list of chapters from the Table of Contents (અનુક્રમણિકા / Index). Output strictly valid json.
        
        OCR TEXT:
        ---
        {toc_chunk}
        ---
        
        Instructions:
        1. Identify the Table of Contents / Index (અનુક્રમણિકા).
        2. Extract each chapter's official number and its Gujarati title.
        3. Do NOT include preface, foreword, front matter, or the index page itself.
        4. Do NOT include chapter prefixes like "પ્રકરણ" or chapter number inside the title_gu field. Keep only the core title name.
        5. Return the list of chapters matching the output JSON schema.
        """
        
        try:
            logger.info("Extracting official Table of Contents from introductory pages...")
            response = self._call_structured(prompt, TOCResponse)
            raw_chapters = response.get("chapters", [])
            valid_chapters = []
            for ch in raw_chapters:
                if not isinstance(ch, dict):
                    continue
                num = self._clean_int(ch.get("chapter_number"))
                if num is not None and ch.get("title_gu"):
                    ch["chapter_number"] = num
                    valid_chapters.append(ch)
            logger.info(f"Successfully extracted {len(valid_chapters)} official chapters from TOC.")
            for ch in valid_chapters:
                logger.info(f"  - Chapter {ch.get('chapter_number')}: {ch.get('title_gu')}")
            return valid_chapters
        except Exception as e:
            logger.error(f"Failed to extract Table of Contents: {str(e)}")
            return []

    def segment_hierarchy(self, raw_text: str) -> Dict[str, Any]:
        """Extracts Chapter, Topic, and Subtopic structures with Gujarati text preserved."""
        # 1. Extract official Table of Contents first to guide the segmenter
        official_chapters = self._extract_official_toc(raw_text)

        if len(raw_text) <= 7000:
            prompt = self._render_prompt("chapter_segmenter.txt", {"ocr_text": raw_text, "official_chapters": official_chapters})
            logger.info("Requesting LLM to segment document hierarchy...")
            res = self._call_structured(prompt, HierarchyResponse)
            if "chapters" in res and isinstance(res["chapters"], list):
                for ch in res["chapters"]:
                    num = self._clean_int(ch.get("chapter_number") or ch.get("order"))
                    if num is not None:
                        ch["chapter_number"] = num
            return res

        logger.info(f"Raw text is large ({len(raw_text)} chars). Splitting into chunks for hierarchy segmentation...")
        chunks = self._chunk_text(raw_text, chunk_size=7000, overlap=700)
        
        ignored_kw = [
            "અનુક્રમણિકા", "અનોક્રમણિકા", "પ્રસ્તાવના", "બે શબ્દો", "આભાર",
            "પ્રતિજ્ઞાપત્ર", "મૂળભૂત ફરજો", "અધ્યયન નિષ્પત્તિઓ", "અધ્યાયન નિષ્પત્તિઓ",
            "આટલું કરો", "આટલું ન કરો", "પાઠ્યપુસ્તકની સફળતા", "સંપાદકીય", "સલાહકાર",
            "index", "preface", "table of contents", "foreword", "contents", "acknowledgment", "pledge"
        ]
        
        for idx, chunk in enumerate(chunks):
            # Throttle between chunks to avoid hitting Gemini rate limits
            if idx > 0:
                inter_chunk_delay = 3.0 + random.uniform(0, 2)
                logger.info(f"Waiting {inter_chunk_delay:.1f}s before processing next hierarchy chunk...")
                time.sleep(inter_chunk_delay)
            
            logger.info(f"Processing hierarchy chunk {idx+1}/{len(chunks)}...")
            prompt = self._render_prompt("chapter_segmenter.txt", {"ocr_text": chunk, "official_chapters": official_chapters})
            try:
                res = self._call_structured(prompt, HierarchyResponse)
                if "chapters" in res and isinstance(res["chapters"], list):
                    for ch in res["chapters"]:
                        if not isinstance(ch, dict):
                            continue
                        # Identify the chapter number
                        raw_num = ch.get("chapter_number") or ch.get("order")
                        num = self._clean_int(raw_num)

                        title_gu = (ch.get("chapter_title_gu") or ch.get("title_gu") or "").lower()
                        title_en = (ch.get("title_en") or "").lower()

                        # Skip front-matter chapters right away
                        if any(kw in title_gu or kw in title_en for kw in ignored_kw):
                            logger.info(f"Skipping front-matter entry: {ch.get('chapter_title_gu') or ch.get('title_gu')}")
                            continue

                        if num is None:
                            continue

                        ch["chapter_number"] = num
                        
                        # Merge content if chapter already exists, otherwise add it
                        if num not in chapters_map:
                            chapters_map[num] = ch
                            if "topics" not in chapters_map[num]:
                                chapters_map[num]["topics"] = []
                        else:
                            existing_ch = chapters_map[num]
                            
                            # Update title if existing one is generic/missing
                            if not existing_ch.get("title_gu") and ch.get("title_gu"):
                                existing_ch["title_gu"] = ch.get("title_gu")
                            if not existing_ch.get("chapter_title_gu") and ch.get("chapter_title_gu"):
                                existing_ch["chapter_title_gu"] = ch.get("chapter_title_gu")

                            # Merge topics
                            new_topics = ch.get("topics", [])
                            if new_topics:
                                if "topics" not in existing_ch:
                                    existing_ch["topics"] = []
                                existing_topic_titles = {
                                    t.get("title_gu") if isinstance(t, dict) else str(t)
                                    for t in existing_ch["topics"]
                                    if (isinstance(t, dict) and t.get("title_gu")) or isinstance(t, str)
                                }
                                for t in new_topics:
                                    t_title = t.get("title_gu") if isinstance(t, dict) else str(t)
                                    if t_title not in existing_topic_titles:
                                        existing_ch["topics"].append(t)
                            
                            # Merge page ranges
                            if ch.get("start_page") is not None:
                                if existing_ch.get("start_page") is None or ch["start_page"] < existing_ch["start_page"]:
                                    existing_ch["start_page"] = ch["start_page"]
                            if ch.get("end_page") is not None:
                                if existing_ch.get("end_page") is None or ch["end_page"] > existing_ch["end_page"]:
                                    existing_ch["end_page"] = ch["end_page"]
                                    
            except Exception as e:
                logger.error(f"Failed to segment hierarchy for chunk {idx+1}: {str(e)}")
        
        # Enforce official titles & ensure ALL official chapters from TOC exist
        if official_chapters:
            for o in official_chapters:
                num = o.get("chapter_number")
                title_gu = o.get("title_gu")
                if num is not None and title_gu:
                    if num not in chapters_map:
                        logger.info(f"Adding missing chapter {num} from official TOC: {title_gu}")
                        chapters_map[num] = {
                            "chapter_number": num,
                            "chapter_title_gu": title_gu,
                            "title_gu": title_gu,
                            "topics": []
                        }
                    else:
                        chapters_map[num]["chapter_title_gu"] = title_gu
                        chapters_map[num]["title_gu"] = title_gu

        # Sort the merged chapters by chapter number
        sorted_chapters = [chapters_map[k] for k in sorted(chapters_map.keys())]
        return {"chapters": sorted_chapters}

    def extract_features(self, raw_text: str) -> Dict[str, Any]:
        """Harvests Learning Outcomes, Formulas, Activities, Keywords, and Revision Notes."""
        if len(raw_text) <= 7000:
            prompt = self._render_prompt("exercise_extractor.txt", {"ocr_text": raw_text})
            logger.info("Requesting LLM to extract semantic features...")
            return self._call_structured(prompt, FeaturesResponse)

        logger.info(f"Raw text is large ({len(raw_text)} chars). Splitting into chunks for features extraction...")
        chunks = self._chunk_text(raw_text, chunk_size=7000, overlap=700)
        
        merged_features = {
            "learning_outcomes": [],
            "key_points": [],
            "formulas": [],
            "activities": [],
            "keywords_list": [],
            "difficult_words": [],
            "glossary": [],
            "revision_notes_gu": []
        }
        
        for idx, chunk in enumerate(chunks):
            # Throttle between chunks to avoid hitting Gemini rate limits
            if idx > 0:
                inter_chunk_delay = 3.0 + random.uniform(0, 2)
                logger.info(f"Waiting {inter_chunk_delay:.1f}s before processing next features chunk...")
                time.sleep(inter_chunk_delay)
            
            logger.info(f"Processing features chunk {idx+1}/{len(chunks)}...")
            prompt = self._render_prompt("exercise_extractor.txt", {"ocr_text": chunk})
            try:
                res = self._call_structured(prompt, FeaturesResponse)
                for k in merged_features.keys():
                    if k in res and isinstance(res[k], list):
                        merged_features[k].extend(res[k])
            except Exception as e:
                logger.error(f"Failed to extract features for chunk {idx+1}: {str(e)}")
                
        return merged_features

    def extract_questions(self, raw_text: str) -> Dict[str, Any]:
        """Extracts exercises, MCQs, HOTS questions, and exam patterns."""
        if len(raw_text) <= 7000:
            prompt = self._render_prompt("qa_generator.txt", {"ocr_text": raw_text})
            logger.info("Requesting LLM to extract questions and MCQs...")
            return self._call_structured(prompt, QuestionsResponse)

        logger.info(f"Raw text is large ({len(raw_text)} chars). Splitting into chunks for QA extraction...")
        chunks = self._chunk_text(raw_text, chunk_size=7000, overlap=700)
        
        merged_qa = {
            "questions": [],
            "mcqs": []
        }
        
        for idx, chunk in enumerate(chunks):
            # Throttle between chunks to avoid hitting Gemini rate limits
            if idx > 0:
                inter_chunk_delay = 3.0 + random.uniform(0, 2)
                logger.info(f"Waiting {inter_chunk_delay:.1f}s before processing next QA chunk...")
                time.sleep(inter_chunk_delay)
            
            logger.info(f"Processing QA chunk {idx+1}/{len(chunks)}...")
            prompt = self._render_prompt("qa_generator.txt", {"ocr_text": chunk})
            try:
                res = self._call_structured(prompt, QuestionsResponse)
                if "questions" in res and isinstance(res["questions"], list):
                    merged_qa["questions"].extend(res["questions"])
                if "mcqs" in res and isinstance(res["mcqs"], list):
                    merged_qa["mcqs"].extend(res["mcqs"])
            except Exception as e:
                logger.error(f"Failed to extract QA for chunk {idx+1}: {str(e)}")
                
        return merged_qa

    def generate_rag_response(self, system_instruction: str, prompt: str) -> str:
        """Generates a text answer from the configured LLM under a strict system instruction."""
        if self.provider == "ollama":
            return self._generate_ollama_rag_response(system_instruction, prompt)
        else:
            return self._generate_gemini_rag_response(system_instruction, prompt)

    def _generate_ollama_rag_response(self, system_instruction: str, prompt: str) -> str:
        """Generates a text answer from Ollama model under a strict system instruction."""
        import socket

        # Fast socket pre-check — skip Ollama entirely if server is unreachable
        try:
            sock = socket.create_connection(("localhost", 11434), timeout=1.0)
            sock.close()
        except Exception:
            logger.info("Ollama server not reachable. Switching directly to Gemini RAG...")
            if settings.GEMINI_API_KEY:
                return self._generate_gemini_rag_response(system_instruction, prompt)
            return "માફ કરશો, AI API Key કન્ફિગર થયેલ નથી."

        from openai import OpenAI

        client = getattr(self, 'client', None)
        model_name = getattr(self, 'ollama_model_name', None) or settings.OLLAMA_MODEL or "qwen2.5:1.5b"
        if not client:
            client = OpenAI(api_key="ollama", base_url=settings.OLLAMA_BASE_URL or "http://localhost:11434/v1", timeout=15.0)

        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=512,
                timeout=15.0,
            )
            answer = response.choices[0].message.content.strip()
            if not answer:
                raise ValueError("Empty response from Ollama")
            return answer
        except Exception as e:
            err_msg = str(e).lower()
            logger.warning(f"Ollama RAG call failed ({str(e)}). Falling back to Gemini RAG...")
            if settings.GEMINI_API_KEY:
                return self._generate_gemini_rag_response(system_instruction, prompt)
            logger.error("Ollama RAG generation failed and no Gemini key: %s", str(e))
            return "માફ કરશો, AI ઉત્તર મેળવવામાં સમસ્યા આવી છે. કૃપા કરીને ફરીથી પ્રયત્ન કરો."


    def _generate_gemini_rag_response(self, system_instruction: str, prompt: str) -> str:
        """Generates a text answer from Gemini under a strict system instruction using google.genai SDK."""
        if not settings.GEMINI_API_KEY:
            return "માફ કરશો, AI API Key કન્ફિગર થયેલ નથી."

        if not _GENAI_AVAILABLE:
            return "માફ કરશો, Gemini SDK ઇન્સ્ટોલ નથી. `pip install google-genai` ચલાવો."

        client = getattr(self, '_genai_client', None)
        if not client:
            try:
                client = google_genai.Client(api_key=settings.GEMINI_API_KEY)
                self._genai_client = client
            except Exception as e:
                logger.error("Failed to create google.genai client: %s", str(e))
                return "માફ કરશો, AI ઉત્તર મેળવવામાં સમસ્યા આવી છે. કૃપા કરીને ફરીથી પ્રયત્ન કરો."

        target_model = getattr(self, 'gemini_model_name', None) or settings.GEMINI_MODEL or "gemini-3.6-flash"
        # Filter out any non-Gemini or legacy model names
        if any(x in target_model.lower() for x in ["qwen", "ollama", "llama", "gemini-2.0", "gemini-1.5"]):
            target_model = "gemini-3.6-flash"

        models_to_try = [target_model] + [
            m for m in ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-flash-latest"]
            if m != target_model
        ]

        for m_name in models_to_try:
            try:
                _gemini_rate_limiter.wait_if_needed()

                response = client.models.generate_content(
                    model=m_name,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        max_output_tokens=800,
                    )
                )
                _gemini_rate_limiter.record_success()
                answer = response.text.strip() if response.text else ""
                if not answer:
                    raise ValueError(f"Empty response from Gemini model {m_name}")
                logger.info(f"Gemini RAG response generated using model: {m_name}")
                return answer

            except Exception as e:
                err_msg = str(e).lower()
                if any(k in err_msg for k in ["404", "not found", "no longer available", "not_found"]):
                    logger.warning(f"Gemini model '{m_name}' unavailable. Trying next fallback...")
                    continue
                if any(k in err_msg for k in ["429", "quota", "rate limit", "resource_exhausted", "resourceexhausted"]):
                    _gemini_rate_limiter.record_rate_limit()
                    delay = 3.0 + random.uniform(1, 2)
                    logger.warning(f"Gemini rate limit hit on {m_name}. Waiting {delay:.1f}s...")
                    time.sleep(delay)
                    continue
                logger.error("Gemini RAG generation failed for model %s: %s", m_name, str(e))
                continue

        return "માફ કરશો, AI ઉત્તર મેળવવામાં સમસ્યા આવી છે. કૃપા કરીને ફરીથી પ્રયત્ન કરો."
