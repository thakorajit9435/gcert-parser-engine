import json
from typing import Any, Dict, List, Optional
from src.core.logger import logger
from src.core.exceptions import FileValidationError
from src.models.topic import Topic
from src.models.sub_topic import SubTopic
from src.models.learning_outcome import LearningOutcome
from src.models.question import Question
from src.models.mcq import MCQ
from src.models.activity import Activity
from src.models.keyword import Keyword
from src.models.glossary import Glossary
from src.models.chapter_summary import ChapterSummary
from src.models.ai_knowledge_base import AIKnowledgeBase
from config.settings import settings

class Step07Generator:
    def run(self, context: dict) -> None:
        logger.info(f"[%s] Pipeline Step 7: Structuring & validating Firestore-ready JSON...", context["job_id"])
        
        job_id = context["job_id"]
        
        def _safe_dict(val: Any) -> dict:
            if isinstance(val, dict):
                return val
            if isinstance(val, str):
                try:
                    res = json.loads(val)
                    if isinstance(res, dict):
                        return res
                except Exception:
                    pass
            return {}

        def _ensure_str(val: Any, fallback: str = "") -> str:
            """Coerce a value to str. If the LLM returns a list of strings, join them."""
            if isinstance(val, str):
                return val
            if isinstance(val, list):
                return " ".join(str(item) for item in val if item)
            if val is None:
                return fallback
            return str(val)

        hierarchy = _safe_dict(context.get("extracted_hierarchy"))
        features = _safe_dict(context.get("extracted_features"))
        questions = _safe_dict(context.get("extracted_questions"))
        
        subject_id = context["subject_id"]
        standard_id = context["standard_id"]
        standard_number = context["standard_number"]

        # Filter out any extracted chapters that are actually Table of Contents, Preface, or Forewords
        ignored_keywords = [
            "અનોક્રમણિકા", "અનુક્રમણિકા", "પ્રસ્તાવના", "બે શબ્દો", "આભાર",
            "પ્રતિજ્ઞાપત્ર", "મૂળભૂત ફરજો", "અધ્યયન નિષ્પત્તિઓ", "અધ્યાયન નિષ્પત્તિઓ",
            "આટલું કરો", "આટલું ન કરો", "પાઠ્યપુસ્તકની સફળતા", "સંપાદકીય", "સલાહકાર",
            "index", "table of contents", "preface", "foreword", "contents", "acknowledgment", "pledge"
        ]
        raw_chapters = hierarchy.get("chapters", [])
        if not isinstance(raw_chapters, list):
            raw_chapters = []

        filtered_chapters = []
        for ch in raw_chapters:
            if isinstance(ch, str):
                ch = {"title_gu": ch, "chapter_title_gu": ch}
            elif not isinstance(ch, dict):
                continue

            title_gu = (ch.get("title_gu") or ch.get("chapter_title_gu") or "").lower()
            title_en = (ch.get("title_en") or "").lower()
            
            is_ignored = False
            for kw in ignored_keywords:
                if kw in title_gu or kw in title_en:
                    is_ignored = True
                    break
            
            if not is_ignored:
                filtered_chapters.append(ch)
            else:
                logger.info(f"[%s] Skipping non-chapter front matter: {ch.get('chapter_title_gu') or ch.get('title_gu') or 'Unnamed'}", job_id)
        
        final_payload = {
            "subjects": [],
            "chapters": [],
            "textbooks": [],
            "topics": [],
            "sub_topics": [],
            "learning_outcomes": [],
            "chapter_summaries": [],
            "question_bank": [],
            "mcq_bank": [],
            "mcqs": [],
            "quizzes": [],
            "questions": [],
            "flashcards": [],
            "activities": [],
            "keywords": [],
            "glossary": [],
            "ai_knowledge_base": [],
            "sessions": []
        }
        
        # Populate textbook document
        storage_pdf_url = context.get("storage_pdf_url", "")
        if not storage_pdf_url:
            import urllib.parse
            encoded_name = urllib.parse.quote_plus(f"textbooks/{job_id}.pdf")
            storage_pdf_url = f"https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/{encoded_name}?alt=media"

        textbook_id = f"tb_{subject_id}"
        textbook_doc = {
            "textbook_id": textbook_id,
            "title_gu": f"ધોરણ {standard_number} પાઠ્યપુસ્તક",
            "title_en": f"Standard {standard_number} Textbook",
            "subject_id": subject_id,
            "standard_id": standard_id,
            "standard_number": int(standard_number),
            "pdf_url": storage_pdf_url,
            "is_active": True,
            "isDeleted": False,
            "publisher": "GSSTB",
            "edition_year": "2024",
            "is_downloadable": True,
            "total_chapters": len(filtered_chapters)
        }
        final_payload["textbooks"].append(textbook_doc)

        # Resolve session value early (needed by subject and session documents below)
        session = str(context.get("session") or "1")

        # Populate subject document (required for student app navigation: Standard → Subject → Chapters)
        subject_doc = {
            "id": subject_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standardId": str(standard_number),
            "standard_id": standard_id,
            "standard_number": int(standard_number),
            "standard": str(standard_number),
            "session": session,
            "name": textbook_doc["title_en"],
            "nameGu": textbook_doc["title_gu"],
            "name_en": textbook_doc["title_en"],
            "name_gu": textbook_doc["title_gu"],
            "icon": "",
            "order": 1,
            "total_chapters": len(filtered_chapters),
            "isDeleted": False,
            "is_deleted": False,
            "isActive": True,
            "is_active": True,
        }
        final_payload["subjects"].append(subject_doc)

        # Upsert a Session document so Sessions Screen always shows this standard
        session_id = f"session_{standard_id}_sem{session}"
        session_doc = {
            "session_id": session_id,
            "standardId": str(standard_number),
            "session": session,
            "title": f"સેમેસ્ટર {session}" if session == "2" else "પ્રથમ સત્ર",
            "type": "textbook",
            "order": int(session) if session.isdigit() else 1,
            "isDeleted": False
        }
        final_payload["sessions"].append(session_doc)
        
        try:
            import fitz
            import os
            total_pdf_pages = 0
            file_path = context.get("file_path")
            if file_path and os.path.exists(file_path):
                try:
                    with fitz.open(file_path) as doc:
                        total_pdf_pages = len(doc)
                    logger.info(f"[%s] Determined total PDF pages: {total_pdf_pages}", job_id)
                except Exception as e:
                    logger.error(f"[%s] Failed to read PDF page count: {str(e)}", job_id)

            # If start_page was missing or imprecise, scan raw text for exact chapter marker
            raw_text = context.get("extracted_raw_text", "")
            page_blocks = []
            if raw_text:
                import re
                pages_split = re.split(r'--- PAGE (\d+) ---', raw_text)
                if len(pages_split) >= 3:
                    for p_idx in range(1, len(pages_split), 2):
                        p_num = int(pages_split[p_idx])
                        p_txt = pages_split[p_idx + 1] if (p_idx + 1) < len(pages_split) else ""
                        page_blocks.append((p_num, p_txt))

            # Preprocess and estimate page ranges
            for i, chapter in enumerate(filtered_chapters):
                if not isinstance(chapter, dict):
                    continue
                start_p = chapter.get('start_page') or chapter.get('startPage')
                title_gu = chapter.get('title_gu') or chapter.get('chapter_title_gu') or ""
                
                # Attempt OCR page search if raw_text is available
                matched_page = None
                if page_blocks and title_gu:
                    ch_number_str = str(chapter.get('chapter_number') or (i + 1))
                    for p_num, p_txt in page_blocks:
                        if (f"પ્રકરણ {ch_number_str}" in p_txt or f"પાઠ {ch_number_str}" in p_txt or f"પ્રકરણ-{ch_number_str}" in p_txt or (len(title_gu) > 4 and title_gu.lower() in p_txt.lower())):
                            matched_page = p_num
                            break
                            
                if matched_page is not None:
                    start_p = matched_page
                elif start_p is None:
                    if i == 0:
                        start_p = 1
                    else:
                        prev_ch = filtered_chapters[i-1] if isinstance(filtered_chapters[i-1], dict) else {}
                        prev_end = prev_ch.get('end_page') or prev_ch.get('endPage')
                        start_p = (int(prev_end) + 1) if prev_end is not None else (i * 15 + 1)
                
                try:
                    chapter['start_page'] = max(1, int(start_p))
                except (ValueError, TypeError):
                    chapter['start_page'] = i * 15 + 1
                    
                end_p = chapter.get('end_page') or chapter.get('endPage')
                if end_p is None:
                    if i < len(filtered_chapters) - 1:
                        next_ch = filtered_chapters[i+1] if isinstance(filtered_chapters[i+1], dict) else {}
                        next_start = next_ch.get('start_page') or next_ch.get('startPage')
                        if next_start is not None:
                            try:
                                end_p = int(next_start) - 1
                            except (ValueError, TypeError):
                                pass
                    if end_p is None:
                        if total_pdf_pages > 0:
                            end_p = total_pdf_pages
                        else:
                            end_p = chapter['start_page'] + 14
                
                try:
                    chapter['end_page'] = max(chapter['start_page'], int(end_p))
                except (ValueError, TypeError):
                    chapter['end_page'] = chapter['start_page'] + 14

            # Determine front-matter page offset based on Chapter 1 start page
            pdf_offset = 0
            if filtered_chapters and isinstance(filtered_chapters[0], dict):
                first_ch_start = filtered_chapters[0].get('start_page', 1)
                pdf_offset = max(0, first_ch_start - 1)
            logger.info(f"[%s] Computed PDF front-matter offset: {pdf_offset} pages", job_id)

            # Map chapter hierarchical elements
            for ch_idx, chapter in enumerate(filtered_chapters):
                if not isinstance(chapter, dict):
                    continue
                chapter_num = ch_idx + 1
                chapter_id = f"{subject_id}_ch{chapter_num}"

                start_page = chapter.get('start_page', 1)
                end_page = chapter.get('end_page', start_page + 14)
                book_start_page = max(1, start_page - pdf_offset)
                initial_page = max(0, start_page - 1)

                # Map chapter document with comprehensive camelCase & snake_case aliases
                chapter_doc = {
                    "id": chapter_id,
                    "chapter_id": chapter_id,
                    "chapterId": chapter_id,
                    "subjectId": subject_id,
                    "subject_id": subject_id,
                    "standardId": str(standard_number),
                    "standard_id": str(standard_number),
                    "standard": str(standard_number),
                    "standardNumber": int(standard_number),
                    "standard_number": int(standard_number),
                    "session": session,
                    "title": chapter.get("title_en") or f"Chapter {chapter_num}",
                    "titleGu": chapter.get("title_gu") or chapter.get("chapter_title_gu") or f"પ્રકરણ {chapter_num}",
                    "title_gu": chapter.get("title_gu") or chapter.get("chapter_title_gu") or f"પ્રકરણ {chapter_num}",
                    "title_en": chapter.get("title_en") or f"Chapter {chapter_num}",
                    "description": _ensure_str(chapter.get("description"), ""),
                    "descriptionGu": _ensure_str(chapter.get("description_gu"), ""),
                    "description_gu": _ensure_str(chapter.get("description_gu"), ""),
                    "textbook_id": f"tb_{subject_id}",
                    "textbookId": f"tb_{subject_id}",
                    "pdfUrl": storage_pdf_url,
                    "pdf_url": storage_pdf_url,
                    "file_url": storage_pdf_url,
                    "url": storage_pdf_url,
                    "swadhyayPdfUrl": storage_pdf_url,
                    "swadhyay_pdf_url": storage_pdf_url,
                    "hasSwadhyay": True,
                    "has_swadhyay": True,
                    "hasMcq": True,
                    "has_mcq": True,
                    "hasMixedQuiz": True,
                    "has_mixed_quiz": True,
                    "order": chapter_num,
                    "chapterNumber": chapter_num,
                    "chapter_number": chapter_num,
                    "isDeleted": False,
                    "is_deleted": False,
                    "isActive": True,
                    "is_active": True,
                    "isPremium": False,
                    "is_premium": False,
                    "startPage": start_page,
                    "start_page": start_page,
                    "endPage": end_page,
                    "end_page": end_page,
                    "bookStartPage": book_start_page,
                    "book_start_page": book_start_page,
                    "pageNumber": start_page,
                    "page_number": start_page,
                    "pageNo": start_page,
                    "page_no": start_page,
                    "page": start_page,
                    "initialPage": initial_page,
                    "initial_page": initial_page,
                    "pageIndex": initial_page,
                    "page_index": initial_page,
                    "pdfPageOffset": pdf_offset,
                    "pdf_page_offset": pdf_offset
                }
                final_payload["chapters"].append(chapter_doc)
                
                # Map chapter summary safely handling string or dict items
                key_points = []
                raw_kp = features.get("key_points", [])
                if isinstance(raw_kp, list):
                    for kp in raw_kp:
                        if isinstance(kp, str):
                            key_points.append({"text_gu": kp, "text_en": None})
                        elif isinstance(kp, dict):
                            key_points.append({"text_gu": _ensure_str(kp.get("text_gu"), "મુખ્ય મુદ્દો"), "text_en": kp.get("text_en")})

                formulas = []
                raw_form = features.get("formulas", [])
                if isinstance(raw_form, list):
                    for f in raw_form:
                        if isinstance(f, str):
                            formulas.append({"formula": f, "description_gu": None})
                        elif isinstance(f, dict):
                            formulas.append({"formula": _ensure_str(f.get("formula"), "N/A"), "description_gu": f.get("description_gu")})

                raw_rev = features.get("revision_notes_gu", [])
                revision_notes_list = []
                if isinstance(raw_rev, list):
                    for r in raw_rev:
                        if isinstance(r, str):
                            revision_notes_list.append(r)
                        elif isinstance(r, dict):
                            revision_notes_list.append(r.get("text_gu") or r.get("note") or str(r))

                summary_data = {
                    "summary_id": f"sum_{chapter_id}",
                    "chapter_id": chapter_id,
                    "standard_id": standard_id,
                    "subject_id": subject_id,
                    "summary_gu": _ensure_str(chapter.get("summary_gu"), "સારાંશ માહિતી"),
                    "key_points": key_points,
                    "important_formulas": formulas,
                    "revision_notes_gu": "\n".join(revision_notes_list)
                }
                final_payload["chapter_summaries"].append(ChapterSummary(**summary_data).model_dump())
                
                # We need at least one topic to bind other features to
                fallback_topic_id = f"{chapter_id}_tp1"
                
                # Map topics and sub-topics
                raw_topics = chapter.get("topics", [])
                if not isinstance(raw_topics, list):
                    raw_topics = []

                for t_idx, topic in enumerate(raw_topics):
                    if isinstance(topic, str):
                        topic = {"title_gu": topic}
                    elif not isinstance(topic, dict):
                        continue

                    topic_num = topic.get('topic_number', t_idx + 1)
                    if not isinstance(topic_num, int):
                        try:
                            topic_num = int(topic_num)
                        except (ValueError, TypeError):
                            topic_num = t_idx + 1

                    topic_id = f"{chapter_id}_tp{topic_num}"
                    if t_idx == 0:
                        fallback_topic_id = topic_id

                    # Extract keywords list safely
                    kw_strings = []
                    raw_kw_list = features.get("keywords_list", [])
                    if isinstance(raw_kw_list, list):
                        for kw in raw_kw_list:
                            if isinstance(kw, str):
                                kw_strings.append(kw)
                            elif isinstance(kw, dict) and kw.get("keyword_gu"):
                                kw_strings.append(kw.get("keyword_gu"))
                    
                    topic_obj = Topic(
                        topic_id=topic_id,
                        topic_number=topic_num,
                        chapter_id=chapter_id,
                        subject_id=subject_id,
                        standard_id=standard_id,
                        standard_number=standard_number,
                        title_gu=_ensure_str(topic.get("title_gu"), "વિષય"),
                        title_en=topic.get("title_en"),
                        content_gu=_ensure_str(topic.get("content_gu"), ""),
                        display_order=t_idx + 1,
                        keywords=kw_strings
                    )
                    final_payload["topics"].append(topic_obj.model_dump())
                    
                    # Map sub-topics
                    raw_subs = topic.get("sub_topics", [])
                    if isinstance(raw_subs, list):
                        for s_idx, sub in enumerate(raw_subs):
                            if isinstance(sub, str):
                                sub = {"title_gu": sub}
                            elif not isinstance(sub, dict):
                                continue

                            sub_topic_id = f"{topic_id}_sub{s_idx + 1}"
                            sub_obj = SubTopic(
                                sub_topic_id=sub_topic_id,
                                topic_id=topic_id,
                                title_gu=_ensure_str(sub.get("title_gu"), "ઉપ-વિષય"),
                                title_en=sub.get("title_en"),
                                display_order=s_idx + 1
                            )
                            final_payload["sub_topics"].append(sub_obj.model_dump())

                # Map Learning Outcomes
                raw_outcomes = features.get("learning_outcomes", [])
                if isinstance(raw_outcomes, list):
                    for o_idx, outcome in enumerate(raw_outcomes):
                        if isinstance(outcome, str):
                            outcome = {"outcome_text_gu": outcome}
                        elif not isinstance(outcome, dict):
                            continue

                        outcome_id = f"lo_{subject_id}_ch{chapter_num}_{o_idx + 1}"
                        outcome_obj = LearningOutcome(
                            outcome_id=outcome_id,
                            topic_id=fallback_topic_id,
                            chapter_id=chapter_id,
                            subject_id=subject_id,
                            standard_id=standard_id,
                            outcome_text_gu=_ensure_str(outcome.get("outcome_text_gu"), "અધ્યયન નિષ્પત્તિ"),
                            bloom_level=_ensure_str(outcome.get("bloom_level"), "understand"),
                            measurable_verb_gu=_ensure_str(outcome.get("measurable_verb_gu"), "સમજે છે"),
                            display_order=o_idx + 1
                        )
                        final_payload["learning_outcomes"].append(outcome_obj.model_dump())

                # Map Keywords
                raw_keywords = features.get("keywords_list", [])
                if isinstance(raw_keywords, list):
                    for k_idx, kw in enumerate(raw_keywords):
                        if isinstance(kw, str):
                            kw = {"keyword_gu": kw}
                        elif not isinstance(kw, dict):
                            continue

                        kw_id = f"kw_{subject_id}_ch{chapter_num}_{k_idx + 1}"
                        kw_obj = Keyword(
                            keyword_id=kw_id,
                            topic_id=fallback_topic_id,
                            chapter_id=chapter_id,
                            subject_id=subject_id,
                            standard_id=standard_id,
                            keyword_gu=_ensure_str(kw.get("keyword_gu"), "મુખ્ય શબ્દ"),
                            keyword_en=kw.get("keyword_en"),
                            meaning_gu=_ensure_str(kw.get("meaning_gu") or kw.get("keyword_gu"), "શબ્દનો અર્થ"),
                            meaning_en=kw.get("meaning_en")
                        )
                        final_payload["keywords"].append(kw_obj.model_dump())

                # Map Glossary & Difficult Words
                glossary_list = []
                raw_gl = features.get("glossary", [])
                if isinstance(raw_gl, list):
                    for gl in raw_gl:
                        if isinstance(gl, str):
                            glossary_list.append({"word_gu": gl, "definition_gu": ""})
                        elif isinstance(gl, dict):
                            glossary_list.append(gl)

                raw_dw = features.get("difficult_words", [])
                if isinstance(raw_dw, list):
                    for diff_word in raw_dw:
                        if isinstance(diff_word, str):
                            glossary_list.append({"word_gu": diff_word, "definition_gu": ""})
                        elif isinstance(diff_word, dict):
                            glossary_list.append({
                                "word_gu": diff_word.get("word_gu"),
                                "definition_gu": diff_word.get("meaning_gu") or diff_word.get("definition_gu")
                            })
                    
                for g_idx, gl in enumerate(glossary_list):
                    if isinstance(gl, str):
                        gl = {"word_gu": gl, "definition_gu": ""}
                    elif not isinstance(gl, dict):
                        continue

                    gl_id = f"gl_{subject_id}_ch{chapter_num}_{g_idx + 1}"
                    gl_obj = Glossary(
                        glossary_id=gl_id,
                        subject_id=subject_id,
                        topic_id=fallback_topic_id,
                        standard_id=standard_id,
                        standard_number=standard_number,
                        subject_code=subject_id.upper()[:5],
                        word_gu=_ensure_str(gl.get("word_gu"), "શબ્દ"),
                        word_en=gl.get("word_en"),
                        definition_gu=_ensure_str(gl.get("definition_gu") or gl.get("meaning_gu"), "વ્યાખ્યા")
                    )
                    final_payload["glossary"].append(gl_obj.model_dump())

                # Map Activities
                raw_activities = features.get("activities", [])
                if isinstance(raw_activities, list):
                    for a_idx, act in enumerate(raw_activities):
                        if isinstance(act, str):
                            act = {"title_gu": act, "instructions_gu": act}
                        elif not isinstance(act, dict):
                            continue

                        act_id = f"act_{subject_id}_ch{chapter_num}_{a_idx + 1}"
                        act_obj = Activity(
                            activity_id=act_id,
                            topic_id=fallback_topic_id,
                            chapter_id=chapter_id,
                            subject_id=subject_id,
                            standard_id=standard_id,
                            title_gu=_ensure_str(act.get("title_gu"), "પ્રવૃત્તિ"),
                            instructions_gu=_ensure_str(act.get("instructions_gu") or act.get("title_gu"), "પ્રવૃત્તિ વિગતો"),
                            materials_needed=act.get("materials_needed", []) if isinstance(act.get("materials_needed"), list) else [],
                            duration_minutes=act.get("duration_minutes"),
                            activity_type=act.get("activity_type") or "experiment"
                        )
                        final_payload["activities"].append(act_obj.model_dump())

                # Map Questions
                raw_questions = questions.get("questions", [])
                if isinstance(raw_questions, list):
                    for q_idx, q in enumerate(raw_questions):
                        if isinstance(q, str):
                            q = {"question_text_gu": q, "answer_gu": ""}
                        elif not isinstance(q, dict):
                            continue

                        q_id = f"q_{subject_id}_ch{chapter_num}_{q_idx + 1}"
                        q_obj = Question(
                            question_id=q_id,
                            topic_id=fallback_topic_id,
                            chapter_id=chapter_id,
                            subject_id=subject_id,
                            standard_id=standard_id,
                            standard_number=standard_number,
                            question_text_gu=_ensure_str(q.get("question_text_gu"), "પ્રશ્ન"),
                            question_type=_ensure_str(q.get("question_type"), "short_answer"),
                            answer_gu=_ensure_str(q.get("answer_gu"), "જવાબ"),
                            bloom_level=_ensure_str(q.get("bloom_level"), "understand"),
                            difficulty_level=_ensure_str(q.get("difficulty_level"), "medium"),
                            marks=q.get("marks") if isinstance(q.get("marks"), int) else 2,
                            is_hots=bool(q.get("is_hots", False)),
                            is_previous_year_pattern=bool(q.get("is_previous_year_pattern", False))
                        )
                        final_payload["question_bank"].append(q_obj.model_dump())

                # Map MCQs & Ensure at least 5 MCQs per chapter
                chapter_title_gu = chapter.get("title_gu") or chapter.get("chapter_title_gu") or f"પ્રકરણ {chapter_num}"
                chapter_title_en = chapter.get("title_en") or f"Chapter {chapter_num}"
                
                raw_mcqs = questions.get("mcqs", [])
                mcq_list = []
                if isinstance(raw_mcqs, list):
                    for item in raw_mcqs:
                        if isinstance(item, str):
                            mcq_list.append({
                                "question_text_gu": item,
                                "options": [],
                                "correct_option_id": "A",
                                "explanation_gu": "",
                                "bloom_level": "remember",
                                "difficulty_level": "easy",
                                "marks": 1
                            })
                        elif isinstance(item, dict):
                            mcq_list.append(item)
                
                if len(mcq_list) < 5:
                    needed = 5 - len(mcq_list)
                    topic_titles = [t.get("title_gu") if isinstance(t, dict) else str(t) for t in raw_topics if (isinstance(t, dict) and t.get("title_gu")) or isinstance(t, str)]
                    key_points_text = [kp.get("text_gu") if isinstance(kp, dict) else str(kp) for kp in (raw_kp if isinstance(raw_kp, list) else []) if (isinstance(kp, dict) and kp.get("text_gu")) or isinstance(kp, str)]
                    
                    for idx in range(needed):
                        mcq_num = len(mcq_list) + 1
                        if key_points_text and idx < len(key_points_text):
                            kp_text = key_points_text[idx]
                            q_text = f"અગત્યનો પ્રશ્ન #{mcq_num}: {chapter_title_gu} સંબંધિત નીચેનામાંથી કયું વિધાન યોગ્ય છે?"
                            correct_ans = kp_text
                            opt_b = "આપેલ તમામ વિધાનો ખોટા છે."
                            opt_c = "ઉપરોક્ત એકપણ નહિ."
                            opt_d = "માહિતી અસંગત છે."
                        elif topic_titles and idx < len(topic_titles):
                            tp_title = topic_titles[idx]
                            q_text = f"મુખ્ય વિષય '{tp_title}' અંગે કઈ બાબત મહત્વની છે?"
                            correct_ans = f"{tp_title} એ {chapter_title_gu} નો મહત્વનો વિભાગ છે."
                            opt_b = "આ વિષય પાઠ્યપુસ્તકમાં નથી."
                            opt_c = "ઉપરોક્ત કોઈ નહિ."
                            opt_d = "માહિતી અપૂર્ણ છે."
                        else:
                            q_text = f"{chapter_title_gu}: સ્વાધ્યાય આધારિત પ્રશ્ન #{mcq_num}"
                            correct_ans = f"{chapter_title_gu} નો મુખ્ય સિદ્ધાંત અને મુખ્યાશય"
                            opt_b = "વિકલ્પ B"
                            opt_c = "વિકલ્પ C"
                            opt_d = "વિકલ્પ D"
                            
                        mcq_list.append({
                            "question_text_gu": q_text,
                            "options": [
                                {"id": "A", "text_gu": correct_ans},
                                {"id": "B", "text_gu": opt_b},
                                {"id": "C", "text_gu": opt_c},
                                {"id": "D", "text_gu": opt_d}
                            ],
                            "correct_option_id": "A",
                            "explanation_gu": f"{chapter_title_gu} ના મહત્વના મુદ્દા આધારિત સ્વાધ્યાય પ્રશ્ન.",
                            "bloom_level": "remember",
                            "difficulty_level": "easy",
                            "marks": 1
                        })

                for m_idx, mcq in enumerate(mcq_list):
                    if not isinstance(mcq, dict):
                        continue

                    mcq_id = f"mcq_{subject_id}_ch{chapter_num}_{m_idx + 1}"
                    raw_opts = mcq.get("options", [])
                    cleaned_opts = []
                    if isinstance(raw_opts, list):
                        for opt_idx, opt in enumerate(raw_opts):
                            if isinstance(opt, str):
                                opt_letter = chr(65 + opt_idx) if opt_idx < 4 else f"O{opt_idx+1}"
                                cleaned_opts.append({"id": opt_letter, "text": opt, "text_gu": opt, "textGu": opt})
                            elif isinstance(opt, dict):
                                cleaned_opts.append({
                                    "id": opt.get("id"),
                                    "text": opt.get("text_gu") or opt.get("text") or "",
                                    "text_gu": opt.get("text_gu") or opt.get("text") or "",
                                    "textGu": opt.get("text_gu") or opt.get("text") or ""
                                })

                    mcq_doc = {
                        "id": mcq_id,
                        "mcq_id": mcq_id,
                        "topic_id": fallback_topic_id,
                        "topicId": fallback_topic_id,
                        "chapter_id": chapter_id,
                        "chapterId": chapter_id,
                        "subject_id": subject_id,
                        "subjectId": subject_id,
                        "standard_id": str(standard_number),
                        "standardId": str(standard_number),
                        "standard": str(standard_number),
                        "standard_number": int(standard_number),
                        "session": session,
                        "question_text_gu": mcq.get("question_text_gu"),
                        "questionText": mcq.get("question_text_gu"),
                        "questionTextGu": mcq.get("question_text_gu"),
                        "options": cleaned_opts,
                        "correct_option_id": mcq.get("correct_option_id", "A"),
                        "correctOptionId": mcq.get("correct_option_id", "A"),
                        "explanation_gu": mcq.get("explanation_gu", ""),
                        "explanation": mcq.get("explanation_gu", ""),
                        "bloom_level": mcq.get("bloom_level", "remember"),
                        "difficulty_level": mcq.get("difficulty_level", "easy"),
                        "marks": mcq.get("marks", 1),
                        "is_active": True,
                        "isActive": True,
                        "isDeleted": False
                    }
                    final_payload["mcq_bank"].append(mcq_doc)
                    final_payload["mcqs"].append(mcq_doc)

                # Map Quiz & Questions for Quiz Taking Screen
                quiz_id = f"quiz_{chapter_id}_mcq"
                
                quiz_q_docs_list = []
                for m_idx, mcq in enumerate(mcq_list):
                    if not isinstance(mcq, dict):
                        continue

                    quiz_q_id = f"qz_q_{chapter_id}_{m_idx + 1}"
                    raw_opts = mcq.get("options", [])
                    opts_dict = {}
                    quiz_opts = []
                    if isinstance(raw_opts, list):
                        for opt_idx, opt in enumerate(raw_opts):
                            if isinstance(opt, str):
                                opt_letter = chr(65 + opt_idx) if opt_idx < 4 else f"O{opt_idx+1}"
                                opts_dict[opt_letter] = opt
                                quiz_opts.append({"id": opt_letter, "text": opt, "textGu": opt, "text_gu": opt})
                            elif isinstance(opt, dict):
                                opt_id = opt.get("id") or (chr(65 + opt_idx) if opt_idx < 4 else f"O{opt_idx+1}")
                                opt_txt = opt.get("text_gu") or opt.get("text") or ""
                                opts_dict[opt_id] = opt_txt
                                quiz_opts.append({"id": opt_id, "text": opt_txt, "textGu": opt_txt, "text_gu": opt_txt})

                    quiz_q_doc = {
                        "id": quiz_q_id,
                        "question_id": quiz_q_id,
                        "questionId": quiz_q_id,
                        "quizId": quiz_id,
                        "quiz_id": quiz_id,
                        "chapterId": chapter_id,
                        "chapter_id": chapter_id,
                        "topicId": fallback_topic_id,
                        "topic_id": fallback_topic_id,
                        "subjectId": subject_id,
                        "subject_id": subject_id,
                        "standardId": str(standard_number),
                        "standard_id": str(standard_number),
                        "standard": str(standard_number),
                        "standardNumber": int(standard_number),
                        "standard_number": int(standard_number),
                        "questionText": mcq.get("question_text_gu") or "પ્રશ્ન માહિતી",
                        "questionTextGu": mcq.get("question_text_gu") or "પ્રશ્ન માહિતી",
                        "question_text_gu": mcq.get("question_text_gu") or "પ્રશ્ન માહિતી",
                        "question_text": mcq.get("question_text_gu") or "પ્રશ્ન માહિતી",
                        "question": mcq.get("question_text_gu") or "પ્રશ્ન માહિતી",
                        "options": quiz_opts,
                        "optionA": opts_dict.get("A", ""),
                        "optionB": opts_dict.get("B", ""),
                        "optionC": opts_dict.get("C", ""),
                        "optionD": opts_dict.get("D", ""),
                        "option_a": opts_dict.get("A", ""),
                        "option_b": opts_dict.get("B", ""),
                        "option_c": opts_dict.get("C", ""),
                        "option_d": opts_dict.get("D", ""),
                        "correctOptionId": mcq.get("correct_option_id", "A"),
                        "correct_option_id": mcq.get("correct_option_id", "A"),
                        "correctOption": mcq.get("correct_option_id", "A"),
                        "correct_option": mcq.get("correct_option_id", "A"),
                        "answer": mcq.get("correct_option_id", "A"),
                        "correctAnswer": mcq.get("correct_option_id", "A"),
                        "explanation": mcq.get("explanation_gu", ""),
                        "explanationGu": mcq.get("explanation_gu", ""),
                        "explanation_gu": mcq.get("explanation_gu", ""),
                        "points": 1,
                        "marks": 1,
                        "order": m_idx + 1,
                        "isActive": True,
                        "is_active": True,
                        "isDeleted": False,
                        "is_deleted": False
                    }
                    quiz_q_docs_list.append(quiz_q_doc)
                    final_payload["questions"].append(quiz_q_doc)

                quiz_doc = {
                    "id": quiz_id,
                    "quiz_id": quiz_id,
                    "quizId": quiz_id,
                    "chapterId": chapter_id,
                    "chapter_id": chapter_id,
                    "subjectId": subject_id,
                    "subject_id": subject_id,
                    "standardId": str(standard_number),
                    "standard_id": str(standard_number),
                    "standard": str(standard_number),
                    "standardNumber": int(standard_number),
                    "standard_number": int(standard_number),
                    "session": session,
                    "title": f"MCQ Quiz - {chapter_title_en}",
                    "titleGu": f"MCQ ક્વિઝ - {chapter_title_gu}",
                    "title_gu": f"MCQ ક્વિઝ - {chapter_title_gu}",
                    "title_en": f"MCQ Quiz - {chapter_title_en}",
                    "description": f"{chapter_title_gu} ના MCQ બહુ-વિકલ્પ પ્રશ્નોની પ્રેક્ટિસ",
                    "descriptionGu": f"{chapter_title_gu} ના MCQ બહુ-વિકલ્પ પ્રશ્નોની પ્રેક્ટિસ",
                    "description_gu": f"{chapter_title_gu} ના MCQ બહુ-વિકલ્પ પ્રશ્નોની પ્રેક્ટિસ",
                    "difficulty": "medium",
                    "difficultyLevel": "medium",
                    "difficulty_level": "medium",
                    "timeLimitSeconds": 600,
                    "time_limit_seconds": 600,
                    "timeLimit": 600,
                    "passingScore": 60,
                    "passing_score": 60,
                    "totalMarks": len(mcq_list),
                    "total_marks": len(mcq_list),
                    "totalQuestions": len(mcq_list),
                    "total_questions": len(mcq_list),
                    "isDailyQuiz": False,
                    "is_daily_quiz": False,
                    "isActive": True,
                    "is_active": True,
                    "isMixed": False,
                    "is_mixed": False,
                    "type": "mcq",
                    "quizType": "mcq",
                    "quiz_type": "mcq",
                    "category": "chapter_mcq",
                    "order": chapter_num,
                    "isDeleted": False,
                    "is_deleted": False,
                    "isPremium": False,
                    "is_premium": False,
                    "questions": quiz_q_docs_list,
                    "questionIds": [q["id"] for q in quiz_q_docs_list],
                    "mcqs": quiz_q_docs_list,
                    "mcqIds": [q["id"] for q in quiz_q_docs_list]
                }
                final_payload["quizzes"].append(quiz_doc)

                # Map Flashcards for Student Flashcards Screen (Ensure min 5-10 per chapter)
                flashcard_items = []
                for kp in (raw_kp if isinstance(raw_kp, list) else []):
                    txt = kp.get("text_gu") if isinstance(kp, dict) else (kp if isinstance(kp, str) else None)
                    if txt:
                        flashcard_items.append({
                            "front": f"મુખ્ય મુદ્દો ({chapter_title_gu})",
                            "back": _ensure_str(txt),
                            "type": "concept"
                        })
                for kw in (raw_kw_list if isinstance(raw_kw_list, list) else []):
                    if isinstance(kw, dict) and kw.get("keyword_gu") and kw.get("meaning_gu"):
                        flashcard_items.append({
                            "front": f"શબ્દાર્થ: {kw.get('keyword_gu')}",
                            "back": _ensure_str(kw.get("meaning_gu")),
                            "type": "keyword"
                        })
                    elif isinstance(kw, str) and kw:
                        flashcard_items.append({
                            "front": "શબ્દાર્થ",
                            "back": kw,
                            "type": "keyword"
                        })
                for gl in glossary_list:
                    if isinstance(gl, dict):
                        w = gl.get("word_gu")
                        m = gl.get("definition_gu") or gl.get("meaning_gu")
                        if w and m:
                            flashcard_items.append({
                                "front": f"અર્થ: {_ensure_str(w)}",
                                "back": _ensure_str(m),
                                "type": "glossary"
                            })
                    elif isinstance(gl, str) and gl:
                        flashcard_items.append({
                            "front": "અર્થ",
                            "back": gl,
                            "type": "glossary"
                        })
                for form in (raw_form if isinstance(raw_form, list) else []):
                    if isinstance(form, dict) and form.get("formula"):
                        flashcard_items.append({
                            "front": f"સૂત્ર: {_ensure_str(form.get('formula'))}",
                            "back": _ensure_str(form.get("description_gu")) or f"પ્રકરણ {chapter_num} અગત્યનું સૂત્ર",
                            "type": "formula"
                        })
                    elif isinstance(form, str) and form:
                        flashcard_items.append({
                            "front": "સૂત્ર",
                            "back": form,
                            "type": "formula"
                        })
                for topic in raw_topics:
                    if isinstance(topic, dict):
                        t_title = _ensure_str(topic.get("title_gu"))
                        t_content = _ensure_str(topic.get("content_gu"))
                        if t_title and t_content:
                            flashcard_items.append({
                                "front": f"સંકલ્પના: {t_title}",
                                "back": t_content[:250] + ("..." if len(t_content) > 250 else ""),
                                "type": "concept"
                            })
                    elif isinstance(topic, str) and topic:
                        flashcard_items.append({
                            "front": "સંકલ્પના",
                            "back": topic,
                            "type": "concept"
                        })

                if len(flashcard_items) < 5:
                    needed = 5 - len(flashcard_items)
                    for idx in range(needed):
                        flashcard_items.append({
                            "front": f"{chapter_title_gu}: સંકલ્પનાત્મક મુદ્દો #{idx + 1}",
                            "back": f"{chapter_title_gu} ના મુખ્ય પરિભાવો અને સિદ્ધાંતોનું પુનરાવર્તન.",
                            "type": "concept"
                        })

                for fc_idx, fc in enumerate(flashcard_items):
                    fc_id = f"fc_{chapter_id}_{fc_idx + 1}"
                    fc_doc = {
                        "id": fc_id,
                        "flashcard_id": fc_id,
                        "flashcardId": fc_id,
                        "chapter_id": chapter_id,
                        "chapterId": chapter_id,
                        "topic_id": fallback_topic_id,
                        "topicId": fallback_topic_id,
                        "subject_id": subject_id,
                        "subjectId": subject_id,
                        "standard_id": str(standard_number),
                        "standardId": str(standard_number),
                        "standard_number": int(standard_number),
                        "standardNumber": int(standard_number),
                        "front": fc["front"],
                        "frontGu": fc["front"],
                        "front_gu": fc["front"],
                        "front_text_gu": fc["front"],
                        "question_gu": fc["front"],
                        "question": fc["front"],
                        "back": fc["back"],
                        "backGu": fc["back"],
                        "back_gu": fc["back"],
                        "back_text_gu": fc["back"],
                        "answer_gu": fc["back"],
                        "answer": fc["back"],
                        "cardType": fc.get("type", "concept"),
                        "card_type": fc.get("type", "concept"),
                        "type": fc.get("type", "concept"),
                        "order": fc_idx + 1,
                        "difficulty_level": "easy",
                        "is_active": True,
                        "isActive": True,
                        "is_premium": False,
                        "is_ai_generated": True,
                        "isDeleted": False,
                        "is_deleted": False
                    }
                    final_payload["flashcards"].append(fc_doc)

                # Generate AI Knowledge Base document for each topic in this chapter
                for t_idx, topic in enumerate(raw_topics):
                    if isinstance(topic, str):
                        topic = {"title_gu": topic}
                    elif not isinstance(topic, dict):
                        continue

                    topic_num = topic.get('topic_number', t_idx + 1)
                    if not isinstance(topic_num, int):
                        try:
                            topic_num = int(topic_num)
                        except (ValueError, TypeError):
                            topic_num = t_idx + 1
                    topic_id = f"{chapter_id}_tp{topic_num}"
                    
                    # Gather related outcomes, questions, activities, keywords safely
                    topic_outcomes = [
                        lo.get("outcome_text_gu", "") if isinstance(lo, dict) else str(lo)
                        for lo in final_payload["learning_outcomes"]
                        if isinstance(lo, dict) and lo.get("topic_id") == topic_id
                    ]
                    topic_questions = [
                        {
                            "question_gu": _ensure_str(q.get("question_text_gu"), "પ્રશ્ન"),
                            "answer_gu": _ensure_str(q.get("answer_gu"), "ઉત્તર"),
                            "marks": q.get("marks") if isinstance(q.get("marks"), int) else 2,
                            "is_hots": bool(q.get("is_hots", False))
                        }
                        for q in final_payload["question_bank"]
                        if isinstance(q, dict) and q.get("topic_id") == topic_id
                    ]
                    topic_glossary = [
                        {
                            "word_gu": _ensure_str(g.get("word_gu"), "શબ્દ"),
                            "word_en": g.get("word_en"),
                            "definition_gu": _ensure_str(g.get("definition_gu") or g.get("meaning_gu"), "વ્યાખ્યા")
                        }
                        for g in final_payload["glossary"]
                        if isinstance(g, dict) and g.get("topic_id") == topic_id
                    ]
                    topic_formulas = [
                        {
                            "name_gu": _ensure_str(f.get("description_gu"), "સૂત્ર"),
                            "latex_formula": _ensure_str(f.get("formula"), "N/A"),
                            "explanation_gu": _ensure_str(f.get("description_gu"), "")
                        }
                        for f in formulas
                        if isinstance(f, dict)
                    ]
                    topic_activities = [
                        {
                            "title_gu": _ensure_str(a.get("title_gu"), "પ્રવૃત્તિ"),
                            "objective_gu": _ensure_str(a.get("instructions_gu"), ""),
                            "procedure_gu": _ensure_str(a.get("instructions_gu"), "")
                        }
                        for a in final_payload["activities"]
                        if isinstance(a, dict) and a.get("topic_id") == topic_id
                    ]
                    topic_keywords = [
                        kw.get("keyword_gu") if isinstance(kw, dict) else str(kw)
                        for kw in final_payload["keywords"]
                        if isinstance(kw, dict) and kw.get("topic_id") == topic_id and kw.get("keyword_gu")
                    ]
                    
                    kb_doc = AIKnowledgeBase(
                        kb_id=f"kb_{topic_id}",
                        standard_id=standard_id,
                        standard_number=standard_number,
                        session="2026-27",
                        subject_id=subject_id,
                        chapter_id=chapter_id,
                        topic_id=topic_id,
                        topic_number=topic_num,
                        title_gu=_ensure_str(topic.get("title_gu"), "વિષય"),
                        title_en=topic.get("title_en"),
                        content_gu=_ensure_str(topic.get("content_gu"), ""),
                        keywords=topic_keywords,
                        learning_outcomes=topic_outcomes,
                        important_questions=topic_questions,
                        glossary=topic_glossary,
                        formulas=topic_formulas,
                        activities=topic_activities,
                        revision_notes=revision_notes_list,
                        difficulty_level="medium",
                        page_numbers=[start_page + t_idx],
                        related_topics=[]
                    )
                    final_payload["ai_knowledge_base"].append(kb_doc.model_dump())
            
            # Save validated JSON locally for audit trail backup
            output_file = settings.OUTPUT_DIR / f"{job_id}_firestore_payload.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(final_payload, f, ensure_ascii=False, indent=2)
                
            logger.info(f"[%s] JSON serialization complete. Output file written to: {output_file}", job_id)
            context["final_json_payload"] = final_payload
            
        except Exception as e:
            raise FileValidationError(f"Payload structuring validation failed against schemas: {str(e)}")
