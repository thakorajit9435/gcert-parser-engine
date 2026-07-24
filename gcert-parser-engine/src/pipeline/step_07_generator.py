import json
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
        hierarchy = context["extracted_hierarchy"]
        features = context["extracted_features"]
        questions = context["extracted_questions"]
        
        subject_id = context["subject_id"]
        standard_id = context["standard_id"]
        standard_number = context["standard_number"]

        # Filter out any extracted chapters that are actually Table of Contents, Preface, or Forewords
        ignored_keywords = [
            "અנוક્રમણિકા", "અનુક્રમણિકા", "પ્રસ્તાવના", "બે શબ્દો", "આભાર",
            "index", "table of contents", "preface", "foreword", "contents", "acknowledgment"
        ]
        filtered_chapters = []
        for ch in hierarchy.get("chapters", []):
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

        # Upsert a Session document so Sessions Screen always shows this standard
        session = context.get("session") or "1"
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
                        prev_end = filtered_chapters[i-1].get('end_page') or filtered_chapters[i-1].get('endPage')
                        start_p = (int(prev_end) + 1) if prev_end is not None else (i * 15 + 1)
                
                try:
                    chapter['start_page'] = max(1, int(start_p))
                except ValueError:
                    chapter['start_page'] = i * 15 + 1
                    
                end_p = chapter.get('end_page') or chapter.get('endPage')
                if end_p is None:
                    if i < len(filtered_chapters) - 1:
                        next_ch = filtered_chapters[i+1]
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
                except ValueError:
                    chapter['end_page'] = chapter['start_page'] + 14

            # Determine front-matter page offset based on Chapter 1 start page
            pdf_offset = 0
            if filtered_chapters:
                first_ch_start = filtered_chapters[0]['start_page']
                pdf_offset = max(0, first_ch_start - 1)
            logger.info(f"[%s] Computed PDF front-matter offset: {pdf_offset} pages", job_id)

            # Map chapter hierarchical elements
            for ch_idx, chapter in enumerate(filtered_chapters):
                chapter_num = ch_idx + 1
                chapter_id = f"{subject_id}_ch{chapter_num}"

                start_page = chapter['start_page']
                end_page = chapter['end_page']
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
                    "description": chapter.get("description", ""),
                    "descriptionGu": chapter.get("description_gu", ""),
                    "description_gu": chapter.get("description_gu", ""),
                    "pdfUrl": storage_pdf_url,
                    "pdf_url": storage_pdf_url,
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
                
                # Map chapter summary
                key_points = [{"text_gu": kp.get("text_gu"), "text_en": kp.get("text_en")} for kp in features.get("key_points", [])]
                formulas = [{"formula": f.get("formula"), "description_gu": f.get("description_gu")} for f in features.get("formulas", [])]
                
                summary_data = {
                    "summary_id": f"sum_{chapter_id}",
                    "chapter_id": chapter_id,
                    "standard_id": standard_id,
                    "subject_id": subject_id,
                    "summary_gu": chapter.get("summary_gu", "સારાંશ માહિતી"),
                    "key_points": key_points,
                    "important_formulas": formulas,
                    "revision_notes_gu": "\n".join(features.get("revision_notes_gu", []))
                }
                final_payload["chapter_summaries"].append(ChapterSummary(**summary_data).model_dump())
                
                # We need at least one topic to bind other features to
                fallback_topic_id = f"{chapter_id}_tp1"
                
                # Map topics and sub-topics
                for t_idx, topic in enumerate(chapter.get("topics", [])):
                    topic_num = topic.get('topic_number', t_idx + 1)
                    topic_id = f"{chapter_id}_tp{topic_num}"
                    if t_idx == 0:
                        fallback_topic_id = topic_id
                    
                    topic_obj = Topic(
                        topic_id=topic_id,
                        topic_number=topic_num,
                        chapter_id=chapter_id,
                        subject_id=subject_id,
                        standard_id=standard_id,
                        standard_number=standard_number,
                        title_gu=topic.get("title_gu", ""),
                        title_en=topic.get("title_en"),
                        content_gu=topic.get("content_gu", ""),
                        display_order=t_idx + 1,
                        keywords=[kw.get("keyword_gu") for kw in features.get("keywords_list", [])]
                    )
                    final_payload["topics"].append(topic_obj.model_dump())
                    
                    # Map sub-topics
                    for s_idx, sub in enumerate(topic.get("sub_topics", [])):
                        sub_topic_id = f"{topic_id}_sub{s_idx + 1}"
                        sub_obj = SubTopic(
                            sub_topic_id=sub_topic_id,
                            topic_id=topic_id,
                            title_gu=sub.get("title_gu"),
                            title_en=sub.get("title_en"),
                            display_order=s_idx + 1
                        )
                        final_payload["sub_topics"].append(sub_obj.model_dump())

                # Map Learning Outcomes
                for o_idx, outcome in enumerate(features.get("learning_outcomes", [])):
                    outcome_id = f"lo_{subject_id}_ch{chapter_num}_{o_idx + 1}"
                    outcome_obj = LearningOutcome(
                        outcome_id=outcome_id,
                        topic_id=fallback_topic_id,
                        chapter_id=chapter_id,
                        subject_id=subject_id,
                        standard_id=standard_id,
                        outcome_text_gu=outcome.get("outcome_text_gu", ""),
                        bloom_level=outcome.get("bloom_level", "understand"),
                        measurable_verb_gu=outcome.get("measurable_verb_gu", ""),
                        display_order=o_idx + 1
                    )
                    final_payload["learning_outcomes"].append(outcome_obj.model_dump())

                # Map Keywords
                for k_idx, kw in enumerate(features.get("keywords_list", [])):
                    kw_id = f"kw_{subject_id}_ch{chapter_num}_{k_idx + 1}"
                    kw_obj = Keyword(
                        keyword_id=kw_id,
                        topic_id=fallback_topic_id,
                        chapter_id=chapter_id,
                        subject_id=subject_id,
                        standard_id=standard_id,
                        keyword_gu=kw.get("keyword_gu"),
                        keyword_en=kw.get("keyword_en"),
                        meaning_gu=kw.get("meaning_gu"),
                        meaning_en=kw.get("meaning_en")
                    )
                    final_payload["keywords"].append(kw_obj.model_dump())

                # Map Glossary & Difficult Words
                glossary_list = features.get("glossary", [])
                for diff_word in features.get("difficult_words", []):
                    # Standardize difficult words into the glossary collection format
                    glossary_list.append({
                        "word_gu": diff_word.get("word_gu"),
                        "definition_gu": diff_word.get("meaning_gu")
                    })
                    
                for g_idx, gl in enumerate(glossary_list):
                    gl_id = f"gl_{subject_id}_ch{chapter_num}_{g_idx + 1}"
                    gl_obj = Glossary(
                        glossary_id=gl_id,
                        subject_id=subject_id,
                        topic_id=fallback_topic_id,
                        standard_id=standard_id,
                        standard_number=standard_number,
                        subject_code=subject_id.upper()[:5],
                        word_gu=gl.get("word_gu"),
                        word_en=gl.get("word_en"),
                        definition_gu=gl.get("definition_gu")
                    )
                    final_payload["glossary"].append(gl_obj.model_dump())

                # Map Activities
                for a_idx, act in enumerate(features.get("activities", [])):
                    act_id = f"act_{subject_id}_ch{chapter_num}_{a_idx + 1}"
                    act_obj = Activity(
                        activity_id=act_id,
                        topic_id=fallback_topic_id,
                        chapter_id=chapter_id,
                        subject_id=subject_id,
                        standard_id=standard_id,
                        title_gu=act.get("title_gu"),
                        instructions_gu=act.get("instructions_gu"),
                        materials_needed=act.get("materials_needed", []),
                        duration_minutes=act.get("duration_minutes"),
                        activity_type=act.get("activity_type", "experiment")
                    )
                    final_payload["activities"].append(act_obj.model_dump())

                # Map Questions
                for q_idx, q in enumerate(questions.get("questions", [])):
                    q_id = f"q_{subject_id}_ch{chapter_num}_{q_idx + 1}"
                    q_obj = Question(
                        question_id=q_id,
                        topic_id=fallback_topic_id,
                        chapter_id=chapter_id,
                        subject_id=subject_id,
                        standard_id=standard_id,
                        standard_number=standard_number,
                        question_text_gu=q.get("question_text_gu"),
                        question_type=q.get("question_type", "short_answer"),
                        answer_gu=q.get("answer_gu"),
                        bloom_level=q.get("bloom_level", "understand"),
                        difficulty_level=q.get("difficulty_level", "medium"),
                        marks=q.get("marks", 2),
                        is_hots=q.get("is_hots", False),
                        is_previous_year_pattern=q.get("is_previous_year_pattern", False)
                    )
                    final_payload["question_bank"].append(q_obj.model_dump())

                # Map MCQs & Ensure at least 5 MCQs per chapter
                chapter_title_gu = chapter.get("title_gu") or chapter.get("chapter_title_gu") or f"પ્રકરણ {chapter_num}"
                chapter_title_en = chapter.get("title_en") or f"Chapter {chapter_num}"
                
                mcq_list = list(questions.get("mcqs", []))
                
                if len(mcq_list) < 5:
                    needed = 5 - len(mcq_list)
                    topic_titles = [t.get("title_gu") for t in chapter.get("topics", []) if t.get("title_gu")]
                    key_points_text = [kp.get("text_gu") for kp in features.get("key_points", []) if kp.get("text_gu")]
                    
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
                    mcq_id = f"mcq_{subject_id}_ch{chapter_num}_{m_idx + 1}"
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
                        "options": [
                            {"id": opt.get("id"), "text": opt.get("text_gu", ""), "text_gu": opt.get("text_gu", ""), "textGu": opt.get("text_gu", "")}
                            for opt in mcq.get("options", [])
                        ],
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
                    quiz_q_id = f"qz_q_{chapter_id}_{m_idx + 1}"
                    opts_dict = {opt.get("id"): opt.get("text_gu", "") for opt in mcq.get("options", [])}
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
                        "options": [
                            {
                                "id": opt.get("id"),
                                "text": opt.get("text_gu", ""),
                                "textGu": opt.get("text_gu", ""),
                                "text_gu": opt.get("text_gu", "")
                            }
                            for opt in mcq.get("options", [])
                        ],
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
                for kp in features.get("key_points", []):
                    if kp.get("text_gu"):
                        flashcard_items.append({
                            "front": f"મુખ્ય મુદ્દો ({chapter_title_gu})",
                            "back": kp.get("text_gu"),
                            "type": "concept"
                        })
                for kw in features.get("keywords_list", []):
                    if kw.get("keyword_gu") and kw.get("meaning_gu"):
                        flashcard_items.append({
                            "front": f"શબ્દાર્થ: {kw.get('keyword_gu')}",
                            "back": kw.get("meaning_gu"),
                            "type": "keyword"
                        })
                for gl in features.get("glossary", []) + features.get("difficult_words", []):
                    w = gl.get("word_gu")
                    m = gl.get("definition_gu") or gl.get("meaning_gu")
                    if w and m:
                        flashcard_items.append({
                            "front": f"અર્થ: {w}",
                            "back": m,
                            "type": "glossary"
                        })
                for form in features.get("formulas", []):
                    if form.get("formula"):
                        flashcard_items.append({
                            "front": f"સૂત્ર: {form.get('formula')}",
                            "back": form.get("description_gu") or f"પ્રકરણ {chapter_num} અગત્યનું સૂત્ર",
                            "type": "formula"
                        })
                for topic in chapter.get("topics", []):
                    t_title = topic.get("title_gu")
                    t_content = topic.get("content_gu")
                    if t_title and t_content:
                        flashcard_items.append({
                            "front": f"સંકલ્પના: {t_title}",
                            "back": t_content[:250] + ("..." if len(t_content) > 250 else ""),
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
                        "chapter_id": chapter_id,
                        "chapterId": chapter_id,
                        "topic_id": fallback_topic_id,
                        "topicId": fallback_topic_id,
                        "subject_id": subject_id,
                        "subjectId": subject_id,
                        "standard_id": str(standard_number),
                        "standardId": str(standard_number),
                        "front_text_gu": fc["front"],
                        "question_gu": fc["front"],
                        "back_text_gu": fc["back"],
                        "answer_gu": fc["back"],
                        "card_type": fc.get("type", "concept"),
                        "difficulty_level": "easy",
                        "is_active": True,
                        "isActive": True,
                        "is_premium": False,
                        "is_ai_generated": True,
                        "isDeleted": False
                    }
                    final_payload["flashcards"].append(fc_doc)

                # Generate AI Knowledge Base document for each topic in this chapter
                for t_idx, topic in enumerate(chapter.get("topics", [])):
                    topic_num = topic.get('topic_number', t_idx + 1)
                    topic_id = f"{chapter_id}_tp{topic_num}"
                    
                    # Gather related outcomes, questions, activities, keywords
                    topic_outcomes = [lo.get("outcome_text_gu") for lo in final_payload["learning_outcomes"] if lo["topic_id"] == topic_id]
                    topic_questions = [
                        {"question_gu": q["question_text_gu"], "answer_gu": q["answer_gu"], "marks": q["marks"], "is_hots": q.get("is_hots", False)}
                        for q in final_payload["question_bank"] if q["topic_id"] == topic_id
                    ]
                    topic_glossary = [
                        {"word_gu": g["word_gu"], "word_en": g.get("word_en"), "definition_gu": g["definition_gu"]}
                        for g in final_payload["glossary"] if g["topic_id"] == topic_id
                    ]
                    topic_formulas = [
                        {"formula": f["formula"], "description_gu": f.get("description_gu")}
                        for f in formulas
                    ]
                    topic_activities = [
                        {"title_gu": a["title_gu"], "instructions_gu": a["instructions_gu"]}
                        for a in final_payload["activities"] if a["topic_id"] == topic_id
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
                        title_gu=topic.get("title_gu", ""),
                        title_en=topic.get("title_en"),
                        content_gu=topic.get("content_gu", ""),
                        keywords=[kw["keyword_gu"] for kw in final_payload["keywords"] if kw["topic_id"] == topic_id],
                        learning_outcomes=topic_outcomes,
                        important_questions=topic_questions,
                        glossary=topic_glossary,
                        formulas=topic_formulas,
                        activities=topic_activities,
                        revision_notes=features.get("revision_notes_gu", []),
                        difficulty_level="medium",
                        page_numbers=[chapter['start_page'] + t_idx],
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
