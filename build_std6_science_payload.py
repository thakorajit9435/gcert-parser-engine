#!/usr/bin/env python3
"""
Builds complete std6_science_payload.json for GCERT Standard 6 Science (વિજ્ઞાન ધોરણ 6 - કુતૂહલ).
Ingests into Cloud Firestore and Qdrant Vector Database via import_json.py.
"""

import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd%206%20Science%20Kutuhal.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std 6 Science Kutuhal.pdf"
storage_path = "textbooks/Std 6 Science Kutuhal.pdf"

subject_id = "sub_science_std6"
subject_id_alt1 = "sub_science_std_6"

standard_id = "std_6"
standard_number = 6
session = "1"  # Science Standard 6 Kutuhal is a single full-year book, session "1" is standard

def main():
    # Load raw inputs from scratch directory
    chapters_file = PROJECT_ROOT / "scratch" / "science_std6_chapters.json"
    content_file = PROJECT_ROOT / "scratch" / "science_std6_content.json"
    
    if not chapters_file.exists() or not content_file.exists():
        print("❌ Error: Scratch input files not found. Make sure they are written to scratch/ first.")
        sys.exit(1)
        
    with open(chapters_file, "r", encoding="utf-8") as f:
        chapters_data = json.load(f)
        
    with open(content_file, "r", encoding="utf-8") as f:
        content_data = json.load(f)
        
    raw_chapters_info = chapters_data["chapters"]
    chapters_content = content_data["chapters_content"]
    
    # Create content map by chapter number for quick lookup
    content_map = {ch["chapterNumber"]: ch for ch in chapters_content}
    
    payload = {
        "subjects": [
            {
                "id": subject_id,
                "subject_id": subject_id,
                "subjectId": subject_id,
                "standardId": "6",
                "standard_id": "6",
                "standard_number": standard_number,
                "standardNumber": standard_number,
                "standard": "6",
                "session": session,
                "name": "Science",
                "nameGu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "name_en": "Standard 6 Science",
                "name_gu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "title": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "titleGu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "title_gu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "icon": "🔬",
                "order": 5,
                "total_chapters": len(raw_chapters_info),
                "totalChapters": len(raw_chapters_info),
                "isDeleted": False,
                "is_deleted": False,
                "isActive": True,
                "is_active": True
            },
            {
                "id": subject_id_alt1,
                "subject_id": subject_id_alt1,
                "subjectId": subject_id_alt1,
                "standardId": "6",
                "standard_id": "6",
                "standard_number": standard_number,
                "standardNumber": standard_number,
                "standard": "6",
                "session": session,
                "name": "Science",
                "nameGu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "name_en": "Standard 6 Science",
                "name_gu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "title": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "titleGu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "title_gu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6",
                "icon": "🔬",
                "order": 5,
                "total_chapters": len(raw_chapters_info),
                "totalChapters": len(raw_chapters_info),
                "isDeleted": False,
                "is_deleted": False,
                "isActive": True,
                "is_active": True
            }
        ],
        "textbooks": [
            {
                "id": f"tb_{subject_id}",
                "textbook_id": f"tb_{subject_id}",
                "textbookId": f"tb_{subject_id}",
                "title_gu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6 પાઠ્યપુસ્તક",
                "titleGu": "વિજ્ઞાન (કુતૂહલ) ધોરણ 6 પાઠ્યપુસ્તક",
                "title_en": "Standard 6 Science Textbook (Kutuhal)",
                "titleEn": "Standard 6 Science Textbook (Kutuhal)",
                "subject_id": subject_id,
                "subjectId": subject_id,
                "standard_id": "6",
                "standardId": "6",
                "standard_number": standard_number,
                "standardNumber": standard_number,
                "pdf_url": pdf_url,
                "pdfUrl": pdf_url,
                "file_url": pdf_url,
                "url": pdf_url,
                "gs_url": gs_url,
                "gsUrl": gs_url,
                "storage_path": storage_path,
                "storagePath": storage_path,
                "is_active": True,
                "isActive": True,
                "isDeleted": False,
                "is_deleted": False,
                "publisher": "GSSTB",
                "edition_year": "2024",
                "total_chapters": len(raw_chapters_info)
            }
        ],
        "sessions": [
            {
                "session_id": f"session_{standard_id}_sem{session}",
                "standardId": "6",
                "standard_id": "6",
                "session": session,
                "title": "વાર્ષિક પુસ્તક",
                "type": "textbook",
                "order": 1,
                "isDeleted": False,
                "is_deleted": False
            }
        ],
        "chapters": [],
        "topics": [],
        "sub_topics": [],
        "quizzes": [],
        "questions": [],
        "mcq_bank": [],
        "mcqs": [],
        "flashcards": [],
        "ai_knowledge_base": []
    }

    quiz_map = {}
    fc_by_chapter = {}

    for ch_info in raw_chapters_info:
        c_num = ch_info["chapterNumber"]
        ch_id = f"sub_science_std6_ch{c_num}"
        title_gu = ch_info["titleGu"]
        title_en = ch_info["title_en"]
        desc_gu = ch_info["descriptionGu"]
        start_page = ch_info["start_page"]
        end_page = ch_info["end_page"]
        offset = ch_info["pdfPageOffset"]
        page_idx = ch_info["pageIndex"]
        tp_id = f"{ch_id}_tp1"
        stp_id = f"{ch_id}_tp1_stp1"

        ch_doc = {
            "id": ch_id,
            "chapter_id": ch_id,
            "chapterId": ch_id,
            "textbook_id": f"tb_{subject_id}",
            "textbookId": f"tb_{subject_id}",
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "6",
            "standardId": "6",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": str(standard_number),
            "chapter_number": c_num,
            "chapterNumber": c_num,
            "order": c_num,
            "titleGu": title_gu,
            "title_gu": title_gu,
            "title": title_gu,
            "titleEn": title_en,
            "title_en": title_en,
            "descriptionGu": desc_gu,
            "description_gu": desc_gu,
            "description": desc_gu,
            "summary": desc_gu,
            "start_page": start_page,
            "startPage": start_page,
            "end_page": end_page,
            "endPage": end_page,
            "pdfPageOffset": offset,
            "pdf_page_offset": offset,
            "pageIndex": page_idx,
            "page_index": page_idx,
            "book_start_page": max(1, start_page - offset),
            "bookStartPage": max(1, start_page - offset),
            "pageNumber": start_page,
            "page_number": start_page,
            "initialPage": max(0, start_page - 1),
            "initial_page": max(0, start_page - 1),
            "verified": True,
            "pdf_url": pdf_url,
            "pdfUrl": pdf_url,
            "file_url": pdf_url,
            "url": pdf_url,
            "gs_url": gs_url,
            "gsUrl": gs_url,
            "storage_path": storage_path,
            "storagePath": storage_path,
            "swadhyayPdfUrl": pdf_url,
            "swadhyay_pdf_url": pdf_url,
            "hasSwadhyay": True,
            "has_swadhyay": True,
            "hasMcq": True,
            "has_mcq": True,
            "hasMixedQuiz": True,
            "has_mixed_quiz": True,
            "session": session,
            "is_active": True,
            "isActive": True,
            "isDeleted": False,
            "is_deleted": False
        }
        payload["chapters"].append(ch_doc)

        tp_doc = {
            "id": tp_id,
            "topic_id": tp_id,
            "topicId": tp_id,
            "topic_number": 1,
            "chapter_id": ch_id,
            "chapterId": ch_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "6",
            "standardId": "6",
            "standard_number": standard_number,
            "titleGu": title_gu,
            "title_gu": title_gu,
            "title_en": title_en,
            "title": title_gu,
            "topicNumber": 1,
            "order": 1,
            "display_order": 1,
            "content_gu": desc_gu,
            "keywords": [title_gu, title_en],
            "is_active": True,
            "isActive": True,
            "isDeleted": False,
            "is_deleted": False
        }
        payload["topics"].append(tp_doc)

        stp_doc = {
            "id": stp_id,
            "sub_topic_id": stp_id,
            "subTopicId": stp_id,
            "topic_id": tp_id,
            "topicId": tp_id,
            "chapter_id": ch_id,
            "chapterId": ch_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "6",
            "standardId": "6",
            "titleGu": title_gu,
            "title_gu": title_gu,
            "title_en": title_en,
            "title": title_gu,
            "subTopicNumber": 1,
            "sub_topic_number": 1,
            "order": 1,
            "display_order": 1,
            "is_active": True,
            "isActive": True,
            "isDeleted": False,
            "is_deleted": False
        }
        payload["sub_topics"].append(stp_doc)

        # Look up quizzes and flashcards for this chapter
        ch_content = content_map.get(c_num, {})
        
        # Process Quizzes & MCQ Questions
        q_list = ch_content.get("quizzes", [])
        if q_list:
            quiz_id = f"quiz_std6_science_{ch_id}"
            question_docs = []
            question_ids = []

            for q_idx, q in enumerate(q_list):
                q_text = q["questionTextGu"]
                raw_opts = q["options"]
                correct_ans = q["correctOptionId"]
                explanation = q.get("explanationGu", "")
                qz_q_id = f"q_std6_science_{ch_id}_{q_idx+1}"

                option_map = {opt["id"]: opt["textGu"] for opt in raw_opts}

                # Construct option docs conforming to standard shape
                opts_formatted = []
                for opt in raw_opts:
                    opt_letter = opt["id"]
                    opt_text = opt["textGu"]
                    opts_formatted.append({
                        "id": opt_letter, "optionId": opt_letter, "option_id": opt_letter,
                        "key": opt_letter, "value": opt_letter, "label": opt_letter, "code": opt_letter,
                        "text": opt_text, "textGu": opt_text, "text_gu": opt_text,
                        "textEn": opt_text, "text_en": opt_text, "content": opt_text, "title": opt_text
                    })

                qz_q_doc = {
                    "id": qz_q_id,
                    "question_id": qz_q_id,
                    "questionId": qz_q_id,
                    "quiz_id": quiz_id,
                    "quizId": quiz_id,
                    "chapter_id": ch_id,
                    "chapterId": ch_id,
                    "topic_id": tp_id,
                    "topicId": tp_id,
                    "sub_topic_id": stp_id,
                    "subTopicId": stp_id,
                    "subject_id": subject_id,
                    "subjectId": subject_id,
                    "standard_id": "6",
                    "standardId": "6",
                    "standardNumber": standard_number,
                    "standard_number": standard_number,
                    "standard": str(standard_number),
                    "questionText": q_text,
                    "questionTextGu": q_text,
                    "question_text_gu": q_text,
                    "question_text": q_text,
                    "question": q_text,
                    "title": q_text,
                    "options": opts_formatted,
                    "optionA": option_map.get("A", ""),
                    "optionB": option_map.get("B", ""),
                    "optionC": option_map.get("C", ""),
                    "optionD": option_map.get("D", ""),
                    "option_a": option_map.get("A", ""),
                    "option_b": option_map.get("B", ""),
                    "option_c": option_map.get("C", ""),
                    "option_d": option_map.get("D", ""),
                    "correctOptionId": correct_ans,
                    "correct_option_id": correct_ans,
                    "correctOption": correct_ans,
                    "correct_option": correct_ans,
                    "correctAnswer": correct_ans,
                    "correct_answer": correct_ans,
                    "correct_ans": correct_ans,
                    "correctAns": correct_ans,
                    "answer": correct_ans,
                    "ans": correct_ans,
                    "type": "MCQ",
                    "quizType": "MCQ",
                    "quiz_type": "MCQ",
                    "questionType": "MCQ",
                    "question_type": "MCQ",
                    "category": "MCQ",
                    "difficulty": "MEDIUM",
                    "difficultyLevel": "MEDIUM",
                    "difficulty_level": "MEDIUM",
                    "bloomLevel": "REMEMBER",
                    "bloom_level": "REMEMBER",
                    "status": "ACTIVE",
                    "explanation": explanation,
                    "explanationGu": explanation,
                    "explanation_gu": explanation,
                    "points": 1,
                    "marks": 1,
                    "order": q_idx + 1,
                    "isActive": True,
                    "is_active": True,
                    "isDeleted": False,
                    "is_deleted": False
                }

                payload["questions"].append(qz_q_doc)
                payload["mcqs"].append(qz_q_doc)
                payload["mcq_bank"].append(qz_q_doc)

                question_docs.append(qz_q_doc)
                question_ids.append(qz_q_id)

            if question_docs:
                quiz_doc = {
                    "id": quiz_id,
                    "quiz_id": quiz_id,
                    "quizId": quiz_id,
                    "chapterId": ch_id,
                    "chapter_id": ch_id,
                    "subjectId": subject_id,
                    "subject_id": subject_id,
                    "standardId": "6",
                    "standard_id": "6",
                    "standard": str(standard_number),
                    "standardNumber": standard_number,
                    "standard_number": standard_number,
                    "session": session,
                    "titleGu": f"MCQ ક્વિઝ - {title_gu}",
                    "title_gu": f"MCQ ક્વિઝ - {title_gu}",
                    "title_en": f"MCQ Quiz - {title_en}",
                    "title": f"MCQ Quiz - {title_en}",
                    "descriptionGu": f"પાઠ {c_num} '{title_gu}' ના MCQ પ્રશ્નોની પ્રેક્ટિસ ટેસ્ટ",
                    "description_gu": f"પાઠ {c_num} '{title_gu}' ના MCQ પ્રશ્નોની પ્રેક્ટિસ ટેસ્ટ",
                    "totalQuestions": len(question_docs),
                    "total_questions": len(question_docs),
                    "totalMarks": len(question_docs),
                    "total_marks": len(question_docs),
                    "timeLimitSeconds": 600,
                    "passingScore": 60,
                    "type": "MCQ",
                    "quizType": "MCQ",
                    "quiz_type": "MCQ",
                    "category": "chapter_mcq",
                    "difficulty": "MEDIUM",
                    "difficultyLevel": "MEDIUM",
                    "difficulty_level": "MEDIUM",
                    "order": c_num,
                    "isActive": True,
                    "is_active": True,
                    "isDeleted": False,
                    "is_deleted": False,
                    "questions": question_docs,
                    "questionIds": question_ids,
                    "mcqs": question_docs,
                    "mcqIds": question_ids
                }
                payload["quizzes"].append(quiz_doc)
            quiz_map[ch_id] = question_docs

        # Process Flashcards
        fc_list = ch_content.get("flashcards", [])
        if fc_list:
            for idx, fc in enumerate(fc_list):
                front_gu = fc["frontGu"]
                back_gu = fc.get("backGu") or ""
                fc_id = f"fc_std6_science_{ch_id}_{idx+1}"

                fc_by_chapter.setdefault(ch_id, []).append((front_gu, back_gu))

                fc_doc = {
                    "id": fc_id,
                    "flashcard_id": fc_id,
                    "flashcardId": fc_id,
                    "chapter_id": ch_id,
                    "chapterId": ch_id,
                    "topic_id": tp_id,
                    "topicId": tp_id,
                    "subject_id": subject_id,
                    "subjectId": subject_id,
                    "standard_id": "6",
                    "standardId": "6",
                    "standard_number": standard_number,
                    "standardNumber": standard_number,
                    "front": front_gu,
                    "frontGu": front_gu,
                    "front_gu": front_gu,
                    "front_text_gu": front_gu,
                    "question_gu": front_gu,
                    "question": front_gu,
                    "back": back_gu,
                    "backGu": back_gu,
                    "back_gu": back_gu,
                    "back_text_gu": back_gu,
                    "answer_gu": back_gu,
                    "answer": back_gu,
                    "cardType": "keyword",
                    "card_type": "keyword",
                    "type": "keyword",
                    "order": idx + 1,
                    "difficulty_level": "easy",
                    "isActive": True,
                    "is_active": True,
                    "is_premium": False,
                    "is_ai_generated": True,
                    "isDeleted": False,
                    "is_deleted": False
                }
                payload["flashcards"].append(fc_doc)

        # Build AI Knowledge Base Documents for Qdrant
        q_docs = quiz_map.get(ch_id, [])
        q_summary = "\n".join([f"પ્રશ્ન: {q['questionTextGu']} | જવાબ: {q['correctOptionId']} | સમજૂતી: {q['explanationGu']}" for q in q_docs])
        fcs = fc_by_chapter.get(ch_id, [])
        fc_summary = "\n".join([f"શબ્દાર્થ: {f[0]} -> {f[1]}" for f in fcs])

        content = f"વિષય: વિજ્ઞાન (કુતૂહલ) ધોરણ 6\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
        if q_summary:
            content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
        if fc_summary:
            content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

        payload["ai_knowledge_base"].append({
            "kb_id": f"kb_std6_science_{ch_id}",
            "standard_id": "6",
            "standard_number": standard_number,
            "session": session,
            "subject_id": subject_id,
            "chapter_id": ch_id,
            "topic_id": tp_id,
            "topic_number": 1,
            "title_gu": title_gu,
            "content_gu": content,
            "keywords": [title_gu, title_en, "વિજ્ઞાન", "ધોરણ 6", "science", "કુતૂહલ"],
            "learning_outcomes": [desc_gu],
            "revision_notes": [desc_gu],
            "difficulty_level": "medium",
            "page_numbers": [start_page],
            "is_active": True,
            "isDeleted": False
        })

    output_file = PROJECT_ROOT / "outputs" / "std6_science_payload.json"
    os.makedirs(output_file.parent, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"✅ Generated Standard 6 Science payload: {output_file}")
    print(f"   Subjects:          {len(payload['subjects'])}")
    print(f"   Textbooks:         {len(payload['textbooks'])}")
    print(f"   Chapters:          {len(payload['chapters'])}")
    print(f"   Quizzes:           {len(payload['quizzes'])}")
    print(f"   Questions:         {len(payload['questions'])}")
    print(f"   Flashcards:        {len(payload['flashcards'])}")
    print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")

if __name__ == "__main__":
    main()
