import uuid
import hashlib
from typing import List, Dict, Any
from src.core.logger import logger

class TextBookChunker:
    @staticmethod
    def chunk_text(text: str, max_tokens: int = 500, overlap: int = 50) -> List[str]:
        """Splits Gujarati/English text into chunks using word-count approximations of tokens.
        
        In Gujarati, 1 word is roughly 2.5 - 3.5 BGE-M3 tokens. 
        So we target 120-150 words per chunk for a ~500 token limit.
        """
        if not text:
            return []
            
        words = text.split()
        if len(words) <= 150:
            return [text]
            
        chunks = []
        step = 150 - overlap // 3  # word step size
        for i in range(0, len(words), step):
            chunk_words = words[i:i + 150]
            if len(chunk_words) > 10:
                chunks.append(" ".join(chunk_words))
            if i + 150 >= len(words):
                break
        return chunks

    def process_kb_to_chunks(self, kb_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Processes a single AIKnowledgeBase document into structured multi-vector payload chunks."""
        chunks = []
        
        topic_id = kb_doc.get("topic_id", "unknown_topic")
        standard = str(kb_doc.get("standard_number", "10"))
        session = kb_doc.get("session", "2026-27")
        subject = kb_doc.get("subject_id", "Mathematics")
        chapter = kb_doc.get("chapter_id", "unknown_chapter")
        topic_title = kb_doc.get("title_gu", "")
        difficulty = kb_doc.get("difficulty_level", "medium")
        page_numbers = kb_doc.get("page_numbers", [1])
        page_number = page_numbers[0] if page_numbers else 1

        # Base metadata payload
        metadata_base = {
            "standard": standard,
            "session": session,
            "subject": subject,
            "chapter": chapter,
            "topic": topic_title,
            "language": "gu",
            "keywords": kb_doc.get("keywords", []),
            "pageNumber": page_number,
            "difficulty": difficulty,
            "isPremium": kb_doc.get("isPremium", False),
            "embeddingModel": "BAAI/bge-m3",
            "embeddingVersion": "v1.0.0"
        }

        # 1. Chunk Topic Content
        content_text = kb_doc.get("content_gu", "")
        if content_text:
            text_splits = self.chunk_text(content_text)
            for idx, split in enumerate(text_splits):
                chunks.append({
                    "chunk_id": f"chk_{topic_id}_content_{idx+1}",
                    "topicId": topic_id,
                    "field": "topic_content",
                    "text_chunk": split,
                    "metadata": metadata_base.copy()
                })

        # 2. Chapter Summary / Notes
        summary_text = "\n".join(kb_doc.get("revision_notes", []))
        if summary_text:
            text_splits = self.chunk_text(summary_text)
            for idx, split in enumerate(text_splits):
                chunks.append({
                    "chunk_id": f"chk_{topic_id}_summary_{idx+1}",
                    "topicId": topic_id,
                    "field": "chapter_summary",
                    "text_chunk": split,
                    "metadata": metadata_base.copy()
                })

        # 3. Learning Outcomes
        outcomes = kb_doc.get("learning_outcomes", [])
        if outcomes:
            chunks.append({
                "chunk_id": f"chk_{topic_id}_outcomes",
                "topicId": topic_id,
                "field": "learning_outcomes",
                "text_chunk": "\n".join(outcomes),
                "metadata": metadata_base.copy()
            })

        # 4. Question Bank
        questions = kb_doc.get("important_questions", [])
        if questions:
            q_strings = []
            for q in questions:
                q_strings.append(f"પ્રશ્ન: {q.get('question_gu')} | ઉત્તર: {q.get('answer_gu')}")
            
            q_text = "\n".join(q_strings)
            text_splits = self.chunk_text(q_text)
            for idx, split in enumerate(text_splits):
                chunks.append({
                    "chunk_id": f"chk_{topic_id}_qbank_{idx+1}",
                    "topicId": topic_id,
                    "field": "question_bank",
                    "text_chunk": split,
                    "metadata": metadata_base.copy()
                })

        # 5. Glossary
        glossary = kb_doc.get("glossary", [])
        if glossary:
            g_strings = []
            for g in glossary:
                g_strings.append(f"શબ્દ: {g.get('word_gu')} | વ્યાખ્યા: {g.get('definition_gu')}")
            
            g_text = "\n".join(g_strings)
            text_splits = self.chunk_text(g_text)
            for idx, split in enumerate(text_splits):
                chunks.append({
                    "chunk_id": f"chk_{topic_id}_glossary_{idx+1}",
                    "topicId": topic_id,
                    "field": "glossary",
                    "text_chunk": split,
                    "metadata": metadata_base.copy()
                })

        # Calculate md5 hash for each chunk content to avoid redundant re-embeddings
        for chunk in chunks:
            raw_text = chunk["text_chunk"]
            chunk["hash"] = hashlib.md5(raw_text.encode("utf-8")).hexdigest()

        return chunks
