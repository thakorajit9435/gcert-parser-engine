import os
import re
import json
import time
import random
import threading
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
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
    Gemini's RPM (Requests Per Minute) limits. For gemini-3.1-flash-lite free tier,
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
_gemini_rate_limiter = GeminiRateLimiter(min_delay_seconds=6.0)

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
        
        if self.provider == "ollama":
            api_key = "ollama"
            base_url = settings.OLLAMA_BASE_URL or "http://localhost:11434/v1"
            self.model_name = settings.OLLAMA_MODEL or "qwen2.5:3b"
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=api_key, base_url=base_url)
                self.client = self.openai_client
                logger.info(f"Initialized Ollama client for model '{self.model_name}' at '{base_url}'")
            except Exception as e:
                logger.warning(f"Failed to initialize Ollama client: {str(e)}")
                self.openai_client = None
                self.client = None
        elif self.provider == "openai_compatible":
            api_key = settings.OPENAI_API_KEY or "ollama"
            base_url = settings.OPENAI_BASE_URL or "https://api.groq.com/openai/v1"
            self.model_name = settings.OPENAI_MODEL or "llama-3.3-70b-versatile"
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=api_key, base_url=base_url)
                self.client = self.openai_client
                logger.info(f"Initialized OpenAI-compatible client for model '{self.model_name}' at '{base_url}'")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI-compatible client: {str(e)}")
                self.openai_client = None
                self.client = None
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model_name = settings.GEMINI_MODEL
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
        """Calls the configured LLM API (Ollama, Gemini or OpenAI-compatible) with JSON output."""
        if self.provider in ["openai_compatible", "ollama"]:
            return self._call_openai_structured(prompt, schema)
        else:
            return self._call_gemini_structured(prompt, schema)

    def _call_openai_structured(self, prompt: str, schema: Any) -> Dict[str, Any]:
        """Calls OpenAI-compatible / Ollama API with JSON schema constraint."""
        import time
        import random
        from openai import OpenAI

        client = getattr(self, 'client', None)
        model_name = getattr(self, 'model_name', None) or settings.OLLAMA_MODEL or "qwen2.5:3b"

        if not client:
            if self.provider == "ollama":
                api_key = "ollama"
                base_url = settings.OLLAMA_BASE_URL or "http://localhost:11434/v1"
            else:
                api_key = settings.OPENAI_API_KEY or "ollama"
                base_url = settings.OPENAI_BASE_URL or "https://api.groq.com/openai/v1"
            client = OpenAI(api_key=api_key, base_url=base_url)
            self.client = client

        max_retries = 3
        base_delay = 2.0

        safe_prompt = prompt
        if len(safe_prompt) > 8000 and self.provider != "ollama":
            safe_prompt = safe_prompt[:8000] + "\n...[truncated for token limit]..."

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

        system_msg = "You are an educational curriculum parser that outputs ONLY strict valid JSON matching the requested structure. Do not include any intro, markdown code block wrappers, or text outside the raw JSON."
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
                    if self.provider == "ollama" and ("404" in err_msg or "model_not_found" in err_msg or "connection" in err_msg or "refused" in err_msg):
                        logger.warning(f"Ollama model '{model_name}' not ready or server offline ({str(e)}). Falling back to Groq/Gemini...")
                        if settings.OPENAI_API_KEY:
                            return self._call_fallback_groq_structured(prompt, schema)
                        elif settings.GEMINI_API_KEY:
                            return self._call_gemini_structured(prompt, schema)
                        raise e

                    if any(x in err_msg for x in ["429", "413", "quota", "rate limit", "too many requests", "tpm"]):
                        if attempt == max_retries - 1:
                            logger.error(f"Structured call failed after {max_retries} attempts: {str(e)}")
                            raise e
                        
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        logger.warning(f"Rate/token limit hit. Retrying in {delay:.2f} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                    else:
                        logger.error(f"Structured call failed: {str(e)}")
                        raise e
            return {}
        except Exception as e:
            if self.provider == "ollama" and settings.OPENAI_API_KEY:
                logger.warning(f"Ollama call failed ({str(e)}). Falling back to Groq...")
                return self._call_fallback_groq_structured(prompt, schema)
            logger.error(f"Structured call failed: {str(e)}")
            raise LLMProcessingError(f"LLM API request error: {str(e)}")

    def _call_fallback_groq_structured(self, prompt: str, schema: Any) -> Dict[str, Any]:
        """Fallback to Groq API using OPENAI_API_KEY and OPENAI_MODEL when local Ollama is not ready."""
        from openai import OpenAI
        groq_client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL or "https://api.groq.com/openai/v1")
        model_name = settings.OPENAI_MODEL or "llama-3.3-70b-versatile"
        
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

        system_msg = "You are an educational curriculum parser that outputs ONLY strict valid JSON matching the requested structure."
        if schema_json_str:
            system_msg += f"\n\nJSON SCHEMA:\n{schema_json_str}"

        safe_prompt = prompt[:8000] if len(prompt) > 8000 else prompt
        response = groq_client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": safe_prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content or "{}"
        content_str = content.strip().strip("```json").strip("```").strip()
        return json.loads(content_str)

    def _call_gemini_structured(self, prompt: str, schema: Any) -> Dict[str, Any]:
        """Calls Gemini API with enforced JSON schema constraint with automatic fallback to Groq on 429."""
        if not settings.GEMINI_API_KEY:
            if settings.OPENAI_API_KEY:
                logger.warning("GEMINI_API_KEY is not configured in settings. Falling back to Groq...")
                return self._call_openai_structured(prompt, schema)
            logger.warning("Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured. Returning empty JSON structure.")
            return {}

        max_retries = 3
        base_delay = 2.0  # seconds

        try:
            model = genai.GenerativeModel(self.model_name)
            
            # Convert Pydantic model to a Gemini-compatible clean dict schema
            from pydantic import BaseModel
            if isinstance(schema, type) and issubclass(schema, BaseModel):
                api_schema = to_gemini_schema(schema)
            else:
                api_schema = schema
                
            for attempt in range(max_retries):
                try:
                    # Enforce rate limiting before each API call
                    _gemini_rate_limiter.wait_if_needed()
                    
                    response = model.generate_content(
                        prompt,
                        generation_config=genai.GenerationConfig(
                            response_mime_type="application/json",
                            response_schema=api_schema
                        )
                    )
                    _gemini_rate_limiter.record_success()
                    return json.loads(response.text)
                except Exception as e:
                    err_msg = str(e).lower()
                    if "429" in err_msg or "quota" in err_msg or "rate limit" in err_msg or "resourceexhausted" in err_msg:
                        _gemini_rate_limiter.record_rate_limit()
                        
                        if settings.OPENAI_API_KEY:
                            logger.warning(f"Gemini Rate Limit (429) hit. Switching immediately to Groq ({settings.OPENAI_MODEL})...")
                            try:
                                return self._call_openai_structured(prompt, schema)
                            except Exception as groq_err:
                                logger.error(f"Groq fallback error: {str(groq_err)}")

                        if attempt == max_retries - 1:
                            logger.error(f"Gemini API structured call failed after {max_retries} attempts: {str(e)}")
                            raise e
                        
                        delay = base_delay * (2 ** attempt) + random.uniform(1, 2)
                        logger.warning(f"Gemini API rate limit (429) hit. Retrying in {delay:.2f} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                    else:
                        logger.error(f"Gemini API structured call failed: {str(e)}")
                        raise e
            return {}
        except LLMProcessingError:
            raise
        except Exception as e:
            if settings.OPENAI_API_KEY:
                logger.warning(f"Gemini call failed ({str(e)}). Switching to Groq ({settings.OPENAI_MODEL})...")
                return self._call_openai_structured(prompt, schema)
            logger.error(f"Gemini API structured call failed: {str(e)}")
            raise LLMProcessingError(f"LLM API request error: {str(e)}")

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
        """Splits text into chunks of chunk_size with overlap to fit within LLM token limits (e.g. Groq 12k TPM)."""
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

    def _extract_official_toc(self, raw_text: str) -> List[Dict[str, Any]]:
        """Extracts the official list of chapters from the Table of Contents (Index) page."""
        # Table of Contents usually appears in the first 25000 characters
        toc_chunk = raw_text[:25000]
        
        prompt = f"""
        You are an educational curriculum parser. Analyze the following OCR text from a textbook's introductory pages and extract the official list of chapters from the Table of Contents (અનુક્રમણિકા / Index).
        
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
            chapters = response.get("chapters", [])
            logger.info(f"Successfully extracted {len(chapters)} official chapters from TOC.")
            for ch in chapters:
                logger.info(f"  - Chapter {ch.get('chapter_number')}: {ch.get('title_gu')}")
            return chapters
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
            return self._call_structured(prompt, HierarchyResponse)

        logger.info(f"Raw text is large ({len(raw_text)} chars). Splitting into chunks for hierarchy segmentation...")
        chunks = self._chunk_text(raw_text, chunk_size=7000, overlap=700)
        
        # Group chapters by their official chapter number to merge chunks correctly
        chapters_map = {}
        
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
                        # Identify the chapter number
                        num = ch.get("chapter_number") or ch.get("order")
                        if not num:
                            continue
                        
                        # Validate chapter number against official TOC if TOC was successfully parsed
                        if official_chapters:
                            official_nums = [o.get("chapter_number") for o in official_chapters]
                            if num not in official_nums:
                                logger.warning(f"Skipping parsed chapter {num} ({ch.get('chapter_title_gu') or ch.get('title_gu')}) not in official TOC.")
                                continue
                        
                        # Merge content if chapter already exists, otherwise add it
                        if num not in chapters_map:
                            chapters_map[num] = ch
                            if "topics" not in chapters_map[num]:
                                chapters_map[num]["topics"] = []
                        else:
                            existing_ch = chapters_map[num]
                            
                            # Merge topics
                            new_topics = ch.get("topics", [])
                            if new_topics:
                                if "topics" not in existing_ch:
                                    existing_ch["topics"] = []
                                # De-duplicate topics by title
                                existing_topic_titles = {t.get("title_gu") for t in existing_ch["topics"] if t.get("title_gu")}
                                for t in new_topics:
                                    if t.get("title_gu") not in existing_topic_titles:
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
        
        # Enforce official titles if we have TOC
        if official_chapters:
            for num, ch in chapters_map.items():
                matching_official = next((o for o in official_chapters if o.get("chapter_number") == num), None)
                if matching_official:
                    ch["chapter_title_gu"] = matching_official.get("title_gu")
                    ch["title_gu"] = matching_official.get("title_gu")
                    # Clean title field to match expected keys
                    if "chapter_title_gu" in ch and not ch.get("chapter_title_gu"):
                        ch["chapter_title_gu"] = matching_official.get("title_gu")

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
        if self.provider in ["openai_compatible", "ollama"]:
            return self._generate_openai_rag_response(system_instruction, prompt)
        else:
            return self._generate_gemini_rag_response(system_instruction, prompt)

    def _generate_openai_rag_response(self, system_instruction: str, prompt: str) -> str:
        """Generates a text answer from OpenAI-compatible / Ollama model under a strict system instruction."""
        client = getattr(self, 'client', None)
        model_name = getattr(self, 'model_name', None) or settings.OLLAMA_MODEL or "qwen2.5:3b"

        if not client:
            import time
            import random
            from openai import OpenAI
            if self.provider == "ollama":
                api_key = "ollama"
                base_url = settings.OLLAMA_BASE_URL or "http://localhost:11434/v1"
            else:
                api_key = settings.OPENAI_API_KEY or "ollama"
                base_url = settings.OPENAI_BASE_URL or "https://api.groq.com/openai/v1"
            client = OpenAI(api_key=api_key, base_url=base_url)

        max_retries = 3
        base_delay = 2.0

        try:
            for attempt in range(max_retries):
                try:
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_instruction},
                            {"role": "user", "content": prompt}
                        ]
                    )
                    return response.choices[0].message.content.strip()
                except Exception as e:
                    err_msg = str(e).lower()
                    if self.provider == "ollama" and ("404" in err_msg or "model_not_found" in err_msg or "connection" in err_msg or "refused" in err_msg):
                        logger.warning(f"Ollama model '{model_name}' not ready or server offline ({str(e)}). Falling back to Groq/Gemini RAG...")
                        if settings.OPENAI_API_KEY:
                            return self._generate_fallback_groq_rag(system_instruction, prompt)
                        elif settings.GEMINI_API_KEY:
                            return self._generate_gemini_rag_response(system_instruction, prompt)
                        raise e

                    if any(x in err_msg for x in ["429", "quota", "rate limit", "too many requests"]):
                        if attempt == max_retries - 1:
                            logger.error(f"OpenAI-compatible RAG generation failed after {max_retries} attempts: {str(e)}")
                            raise e
                        
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        logger.warning(f"OpenAI-compatible RAG rate limit (429) hit. Retrying in {delay:.2f} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                    else:
                        raise e
            return "માફ કરશો, AI જવાબ મેળવવામાં સમય લાગી રહ્યો છે. કૃપા કરીને ફરીથી પ્રયત્ન કરો."
        except Exception as e:
            if self.provider == "ollama" and settings.OPENAI_API_KEY:
                logger.warning(f"Ollama RAG failed ({str(e)}). Falling back to Groq RAG...")
                return self._generate_fallback_groq_rag(system_instruction, prompt)
            logger.error("OpenAI-compatible RAG generation failed: %s", str(e))
            return "માફ કરશો, AI ઉત્તર મેળવવામાં સમસ્યા આવી છે. કૃપા કરીને ફરીથી પ્રયત્ન કરો."

    def _generate_fallback_groq_rag(self, system_instruction: str, prompt: str) -> str:
        """Fallback to Groq RAG generation when local Ollama model is not active."""
        from openai import OpenAI
        groq_client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL or "https://api.groq.com/openai/v1")
        model_name = settings.OPENAI_MODEL or "llama-3.3-70b-versatile"
        
        response = groq_client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    def _generate_gemini_rag_response(self, system_instruction: str, prompt: str) -> str:
        """Generates a text answer from Gemini under a strict system instruction with automatic fallback to Groq on 429."""
        if not settings.GEMINI_API_KEY:
            if settings.OPENAI_API_KEY:
                logger.warning("GEMINI_API_KEY not configured. Falling back to Groq RAG...")
                return self._generate_openai_rag_response(system_instruction, prompt)
            return "માફ કરશો, AI API Key કન્ફિગર થયેલ નથી."

        max_retries = 3
        base_delay = 2.0  # seconds

        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            for attempt in range(max_retries):
                try:
                    # Enforce rate limiting before each API call
                    _gemini_rate_limiter.wait_if_needed()
                    
                    response = model.generate_content(prompt)
                    _gemini_rate_limiter.record_success()
                    return response.text.strip()
                except Exception as e:
                    err_msg = str(e).lower()
                    if "429" in err_msg or "quota" in err_msg or "rate limit" in err_msg or "resourceexhausted" in err_msg:
                        _gemini_rate_limiter.record_rate_limit()
                        
                        if settings.OPENAI_API_KEY:
                            logger.warning(f"Gemini RAG Rate Limit (429) hit. Switching immediately to Groq ({settings.OPENAI_MODEL})...")
                            try:
                                return self._generate_openai_rag_response(system_instruction, prompt)
                            except Exception as groq_err:
                                logger.error(f"Groq RAG fallback error: {str(groq_err)}")

                        if attempt == max_retries - 1:
                            logger.error(f"Gemini RAG generation failed after {max_retries} attempts: {str(e)}")
                            raise e
                        
                        delay = base_delay * (2 ** attempt) + random.uniform(1, 2)
                        logger.warning(f"Gemini RAG rate limit (429) hit. Retrying in {delay:.2f} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                    else:
                        raise e
            return "માફ કરશો, AI જવાબ મેળવવામાં સમય લાગી રહ્યો છે. કૃપા કરીને ફરીથી પ્રયત્ન કરો."
        except Exception as e:
            if settings.OPENAI_API_KEY:
                logger.warning(f"Gemini RAG failed ({str(e)}). Switching to Groq ({settings.OPENAI_MODEL})...")
                return self._generate_openai_rag_response(system_instruction, prompt)
            logger.error("Gemini RAG generation failed: %s", str(e))
            return "માફ કરશો, AI ઉત્તર મેળવવામાં સમસ્યા આવી છે. કૃપા કરીને ફરીથી પ્રયત્ન કરો."
