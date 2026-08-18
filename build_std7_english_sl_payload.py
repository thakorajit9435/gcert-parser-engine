#!/usr/bin/env python3
"""
Builds complete, unified std7_english_sl_payload.json for GCERT Standard 7 English Second Language (અંગ્રેજી દ્વિતીય ભાષા ધોરણ 7).
Contains 10 Chapters, exact physical PDF page mappings (Ch1 start page 12, offset 11), Quizzes, Questions, Flashcards, and AI Knowledge Base.
Ensures zero duplicate IDs and full React Native Student App compatibility.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FSTD_7_English_SL.pdf?alt=media"
subject_id = "sub_english_sl_std7"
subject_id_alt = "sub_eng_std7"
standard_id = "std_7"
standard_number = 7
session = "1"

# 10 Chapters provided by the user
raw_chapters_info = [
    {"num": 1, "id": "sub_eng_std7_ch1", "titleGu": "WATER", "titleEn": "WATER", "descGu": "આ એકમ દ્વારા વિદ્યાર્થીઓ વાર્તાઓ અને પ્રવૃત્તિઓ દ્વારા પાણીનું મહત્વ સમજશે અને જળ સંરક્ષણ માટે પ્રોત્સાહિત થશે.", "startPage": 12, "endPage": 23},
    {"num": 2, "id": "sub_eng_std7_ch2", "titleGu": "FAIRS AND FESTIVALS", "titleEn": "FAIRS AND FESTIVALS", "descGu": "ગુજરાતના રંગબેરંગી મેળાઓ અને સાંસ્કૃતિક તહેવારો દ્વારા ભારતીય પરંપરાઓનો પરિચય કરાવતો એકમ.", "startPage": 24, "endPage": 35},
    {"num": 3, "id": "sub_eng_std7_ch3", "titleGu": "THE GUARDIANS OF THE GREEN", "titleEn": "THE GUARDIANS OF THE GREEN", "descGu": "પર્યાવરણની જાળવણી, પ્રકૃતિનું સૌંદર્ય અને જળચક્ર વિશેની પાયાની સમજ આપતો પાઠ.", "startPage": 36, "endPage": 50},
    {"num": 4, "id": "sub_eng_std7_ch4", "titleGu": "SUCCESS", "titleEn": "SUCCESS", "descGu": "સફળતા મેળવવા માટેના અવિરત પ્રયત્નો અને લૂઈ બ્રેઈલના પ્રેરણાદાયી જીવનનો પરિચય.", "startPage": 51, "endPage": 61},
    {"num": 5, "id": "sub_eng_std7_ch5", "titleGu": "NATION FIRST", "titleEn": "NATION FIRST", "descGu": "દેશદાઝ, શહીદ જવાનોનું બલિદાન અને ભારતના નાગરિક તરીકેની આપણી મૂળભૂત ફરજોની સમજ.", "startPage": 62, "endPage": 75},
    {"num": 6, "id": "sub_eng_std7_ch6", "titleGu": "VALUE THE VALUES", "titleEn": "VALUE THE VALUES", "descGu": "જીવનમાં પ્રામાણિકતા, સત્ય અને નૈતિક મૂલ્યોનું મહત્વ સમજાવતો બોધપ્રદ એકમ.", "startPage": 76, "endPage": 90},
    {"num": 7, "id": "sub_eng_std7_ch7", "titleGu": "TEAMWORK", "titleEn": "TEAMWORK", "descGu": "સાથે મળીને કામ કરવાથી કેવી રીતે મોટા લક્ષ્યો પ્રાપ્ત કરી શકાય છે તેનું સુંદર નિરૂપણ.", "startPage": 91, "endPage": 102},
    {"num": 8, "id": "sub_eng_std7_ch8", "titleGu": "EXPRESS YOURSELF", "titleEn": "EXPRESS YOURSELF", "descGu": "વાતચીત અને અભિવ્યક્તિના વિવિધ માધ્યમો તથા અશાબ્દિક સંવાદના મહત્વની જાણકારી.", "startPage": 103, "endPage": 120},
    {"num": 9, "id": "sub_eng_std7_ch9", "titleGu": "FEEL IT, LIVE IT", "titleEn": "FEEL IT, LIVE IT", "descGu": "માનવીય લાગણીઓને ઓળખવી અને શસ્ત્રક્રિયાના પિતા ગણાતા સુશ્રુત વિશેની માહિતી.", "startPage": 121, "endPage": 135},
    {"num": 10, "id": "sub_eng_std7_ch10", "titleGu": "LIFE SKILLS", "titleEn": "LIFE SKILLS", "descGu": "૨૧મી સદીના જીવન કૌશલ્યો, ડિજિટલ સેફ્ટી અને સમયનું મહત્વ સમજાવતો એકમ.", "startPage": 136, "endPage": 147}
]

# Physical PDF page offset (Chapter 1 physical start page is 12, book page is 1)
pdf_offset = 11

payload = {
    "subjects": [
        {
            "id": subject_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standardId": "7",
            "standard_id": "7",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "7",
            "session": session,
            "name": "English Second Language",
            "nameGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "name_en": "Standard 7 English (Second Language)",
            "name_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "title": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "icon": "🔤",
            "order": 5,
            "total_chapters": len(raw_chapters_info),
            "totalChapters": len(raw_chapters_info),
            "isDeleted": False,
            "is_deleted": False,
            "isActive": True,
            "is_active": True
        },
        {
            "id": subject_id_alt,
            "subject_id": subject_id_alt,
            "subjectId": subject_id_alt,
            "standardId": "7",
            "standard_id": "7",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "7",
            "session": session,
            "name": "English Second Language",
            "nameGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "name_en": "Standard 7 English (Second Language)",
            "name_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "title": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7",
            "icon": "🔤",
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
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7 પાઠ્યપુસ્તક",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 7 પાઠ્યપુસ્તક",
            "title_en": "Standard 7 English (Second Language) Textbook",
            "titleEn": "Standard 7 English (Second Language) Textbook",
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "7",
            "standardId": "7",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "pdf_url": pdf_url,
            "pdfUrl": pdf_url,
            "file_url": pdf_url,
            "url": pdf_url,
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
            "standardId": "7",
            "standard_id": "7",
            "session": session,
            "title": "પ્રથમ સત્ર",
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

# Detailed Quiz Questions per chapter
chapter_quiz_data = {
    1: {"q": "પર્વતભાઈએ તેમના ખેતરમાં પાણી સંગ્રહવા માટે શું બનાવ્યું હતું?", "opts": ["ડેમ", "ખેત તલાવડી (Khet Talavdi)", "નહેર", "ટ્યુબવેલ"], "ans": "B", "exp": "વાર્તા મુજબ પર્વતભાઈએ વરસાદી પાણીના સંગ્રહ માટે ખેતરમાં 'Khet Talavdi' બનાવી હતી."},
    2: {"q": "વિદ્યાર્થીઓએ મેળાઓ અને તહેવારો દ્વારા શેનો પરિચય મેળવ્યો?", "opts": ["સાંસ્કૃતિક પરંપરાઓનો", "ટેકનોલોજીનો", "રમતગમતનો", "વિજ્ઞાનનો"], "ans": "A", "exp": "ગુજરાતના મેળાઓ અને તહેવારો ભારતીય સંસ્કૃતિ અને પરંપરાઓનો પરિચય કરાવે છે."},
    3: {"q": "'The Guardians of the Green' પાઠમાં શેની જાળવણીનો સંદેશ છે?", "opts": ["પર્યાવરણ અને પ્રકૃતિની", "યંત્રોની", "મકાનોની", "રોડની"], "ans": "A", "exp": "આ પાઠમાં વૃક્ષો, પર્યાવરણ અને જળચક્રના રક્ષણનો મહત્વપૂર્ણ સંદેશ આપેલો છે."},
    4: {"q": "દ્રષ્ટિહીન લોકો માટે બ્રેઈલ લિપિની શોધો કોણે કરી હતી?", "opts": ["લૂઈ બ્રેઈલ", "થોમસ એડિશન", "ગેલિલિયો", "ન્યૂટન"], "ans": "A", "exp": "લૂઈ બ્રેઈલે દ્રષ્ટિહીન લોકોના વાંચન-લેખન માટે છ બિંદુઓવાળી પદ્ધતિ બ્રેઈલ લિપિ શોધી હતી."},
    5: {"q": "કાર્ગિલના યુદ્ધ દરમિયાન કેપ્ટન વિક્રમ બત્રાનું કોડ નેમ (Code name) શું હતું?", "opts": ["ચાણક્ય", "શેરશાહ", "ટાઈગર", "કેપ્ટન"], "ans": "B", "exp": "કેપ્ટન વિક્રમ બત્રાને તેમની બહાદુરી માટે 'શેરશાહ' કોડ નેમ આપવામાં આવ્યું હતું."},
    6: {"q": "'Value the Values' પાઠ જીવનમાં શાનું મહત્વ સમજાવે છે?", "opts": ["નૈતિક મૂલ્યો અને પ્રામાણિકતાનું", "નાણાનું", "અહંકારનું", "આળસનું"], "ans": "A", "exp": "આ એકમ જીવનમાં પ્રામાણિકતા, સત્ય અને નૈતિક મૂલ્યો સ્વીકારવા પ્રોત્સાહિત કરે છે."},
    7: {"q": "'Teamwork' કાવ્ય/પાઠમાં કઈ ક્ષમતાનો વિકાસ દર્શાવ્યો છે?", "opts": ["સમૂહમાં કામ કરવાની ક્ષમતા", "એકલા કામ કરવાની", "ઝઘડવાની", "સ્પર્ધા કરવાની"], "ans": "A", "exp": "ટીમવર્કથી મોટામાં મોટા લક્ષ્યો સરળતાથી હાંસલ કરી શકાય છે."},
    8: {"q": "'Express Yourself' માં વિચારોની રજૂઆત માટે શાનો ઉપયોગ થાય છે?", "opts": ["સંવાદ અને વાણીનો", "મૌન રહેવાનો", "નિષ્ક્રિય રહેવાનો", "સુવાનો"], "ans": "A", "exp": "પોતાના વિચારો અને ભાવનાઓ યોગ્ય રીતે રજૂ કરવા સંવાદ અને વાણી માધ્યમ છે."},
    9: {"q": "તબીબી વિજ્ઞાનમાં 'ફાધર ઓફ સર્જરી' (Father of Surgery) તરીકે કોણ જાણીતું છે?", "opts": ["ચરક", "સુશ્રુત", "આર્યભટ્ટ", "શાલીહોત્ર"], "ans": "B", "exp": "સુશ્રુતને તેમની શસ્ત્રક્રિયાની નિપુણતા માટે 'ફાધર ઓફ સર્જરી' કહેવામાં આવે છે."},
    10: {"q": "૨૧મી સદીના મહત્વના જીવન કૌશલ્યમાં શાનો સમાવેશ થાય છે?", "opts": ["ડિજિટલ સેફ્ટી અને સમયનું મહત્ત્વ", "સોશિયલ મીડિયા પર સમય બગાડવો", "આળસ કરવી", "ટીવી જોવું"], "ans": "A", "exp": "આજના આધુનિક યુગમાં ડિજિટલ સાક્ષરતા અને સમયનું આયોજન જરૂરી જીવન કૌશલ્યો છે."}
}

# Flashcards Data
chapter_flashcard_data = {
    1: [("Rainwater Harvesting", "વરસાદી પાણીનો સંગ્રહ કરવાની પદ્ધતિ."), ("Khet Talavdi", "ખેતરમાં વરસાદી પાણી સંગ્રહવા માટે બનાવાતો નાનો તળાવડો.")],
    2: [("Fairs & Festivals", "રંગબેરંગી મેળાઓ અને સાંસ્કૃતિક તહેવારો."), ("Tradition", "વારસાગત ચાલતી આવતી સાંસ્કૃતિક પરંપરા.")],
    3: [("Guardians of Green", "પ્રકૃતિ અને પર્યાવરણના રક્ષકો."), ("Water Cycle", "જળચક્રની કુદરતી પ્રક્રિયા.")],
    4: [("Braille Script", "દ્રષ્ટિહીન લોકો માટે વાંચન અને લેખન માટેની છ બિંદુઓવાળી લિપિ."), ("Louis Braille", "બ્રેઈલ લિપિના શોધક અને પ્રેરણાદાયી વ્યક્તિત્વ.")],
    5: [("Nation First", "રાષ્ટ્રહિત અને દેશદાઝ સર્વોપરી ગણવી."), ("Captain Vikram Batra", "કાર્ગિલ યુદ્ધના પરમવીર ચક્ર વિજેતા શહીદ જવાન.")],
    6: [("Moral Values", "નૈતિક મૂલ્યો અને પ્રામાણિકતા."), ("Honesty", "જીવનમાં સાચું બોલવાની અને ઇમાનદારી ગુણ.")],
    7: [("Teamwork", "સાથે મળીને એક લક્ષ્ય માટે કામ કરવું."), ("Cooperation", "પરસ્પર સહકાર અને સમૂહ ભાવના.")],
    8: [("Expression", "પોતાના વિચારો અને લાગણીઓ વ્યક્ત કરવા."), ("Non-verbal Communication", "અશાબ્દિક સંકેતો દ્વારા થતો સંવાદ.")],
    9: [("Father of Surgery", "પ્રાચીન શસ્ત્રક્રિયાના પિતા મહર્ષિ સુશ્રુત."), ("Sushruta Samhita", "શસ્ત્રક્રિયા વિશેનો મહાન પ્રાચીન ગ્રંથ.")],
    10: [("Critical Thinking", "કોઈપણ સમસ્યાના ઉકેલ માટે તર્કબદ્ધ અને ગહન વિચાર કરવાની ક્ષમતા."), ("Life Skills", "જીવન જીવવા માટે જરૂરી ૨૧મી સદીના કૌશલ્યો.")]
}

for item in raw_chapters_info:
    c_num = item["num"]
    ch_id = item["id"]
    book_start = max(1, item["startPage"] - pdf_offset)
    initial_p = max(0, item["startPage"] - 1)
    
    # 1. Chapter Document
    ch_doc = {
        "id": ch_id,
        "chapter_id": ch_id,
        "chapterId": ch_id,
        "textbook_id": f"tb_{subject_id}",
        "textbookId": f"tb_{subject_id}",
        "subjectId": subject_id,
        "subject_id": subject_id,
        "standardId": "7",
        "standard_id": "7",
        "standard": str(standard_number),
        "standardNumber": standard_number,
        "standard_number": standard_number,
        "session": session,
        "title": item["titleEn"],
        "titleGu": item["titleGu"],
        "title_gu": item["titleGu"],
        "title_en": item["titleEn"],
        "descriptionGu": item["descGu"],
        "description_gu": item["descGu"],
        "pdfUrl": pdf_url,
        "pdf_url": pdf_url,
        "file_url": pdf_url,
        "url": pdf_url,
        "swadhyayPdfUrl": pdf_url,
        "swadhyay_pdf_url": pdf_url,
        "hasSwadhyay": True,
        "has_swadhyay": True,
        "hasMcq": True,
        "has_mcq": True,
        "hasMixedQuiz": True,
        "has_mixed_quiz": True,
        "order": c_num,
        "chapterNumber": c_num,
        "chapter_number": c_num,
        "startPage": item["startPage"],
        "start_page": item["startPage"],
        "endPage": item["endPage"],
        "end_page": item["endPage"],
        "bookStartPage": book_start,
        "book_start_page": book_start,
        "pageNumber": item["startPage"],
        "page_number": item["startPage"],
        "initialPage": initial_p,
        "initial_page": initial_p,
        "pageIndex": initial_p,
        "page_index": initial_p,
        "pdfPageOffset": pdf_offset,
        "pdf_page_offset": pdf_offset,
        "isActive": True,
        "is_active": True,
        "isDeleted": False,
        "is_deleted": False
    }
    payload["chapters"].append(ch_doc)

    # 2. Topic & SubTopic Documents
    tp_id = f"{ch_id}_tp1"
    payload["topics"].append({
        "topic_id": tp_id,
        "topicId": tp_id,
        "topic_number": 1,
        "chapter_id": ch_id,
        "chapterId": ch_id,
        "subject_id": subject_id,
        "subjectId": subject_id,
        "standard_id": "7",
        "standardId": "7",
        "standard_number": standard_number,
        "title_gu": item["titleGu"],
        "titleGu": item["titleGu"],
        "content_gu": item["descGu"],
        "display_order": 1,
        "keywords": [item["titleGu"]]
    })
    payload["sub_topics"].append({
        "sub_topic_id": f"{tp_id}_sub1",
        "subTopicId": f"{tp_id}_sub1",
        "topic_id": tp_id,
        "topicId": tp_id,
        "title_gu": "મુખ્ય વિષય અને સમજૂતી",
        "titleGu": "મુખ્ય વિષય અને સમજૂતી",
        "display_order": 1
    })

    # 3. Quiz & Question Documents
    qz_info = chapter_quiz_data.get(c_num)
    quiz_id = f"quiz_eng_std7_ch{c_num}"
    qz_q_id = f"qz_q_eng_std7_ch{c_num}_1"
    
    opts = qz_info["opts"]
    opts_list = [
        {"id": "A", "optionId": "A", "option_id": "A", "key": "A", "value": "A", "label": "A", "code": "A", "text": opts[0], "textGu": opts[0], "text_gu": opts[0], "textEn": opts[0], "text_en": opts[0], "content": opts[0], "title": opts[0]},
        {"id": "B", "optionId": "B", "option_id": "B", "key": "B", "value": "B", "label": "B", "code": "B", "text": opts[1], "textGu": opts[1], "text_gu": opts[1], "textEn": opts[1], "text_en": opts[1], "content": opts[1], "title": opts[1]},
        {"id": "C", "optionId": "C", "option_id": "C", "key": "C", "value": "C", "label": "C", "code": "C", "text": opts[2], "textGu": opts[2], "text_gu": opts[2], "textEn": opts[2], "text_en": opts[2], "content": opts[2], "title": opts[2]},
        {"id": "D", "optionId": "D", "option_id": "D", "key": "D", "value": "D", "label": "D", "code": "D", "text": opts[3], "textGu": opts[3], "text_gu": opts[3], "textEn": opts[3], "text_en": opts[3], "content": opts[3], "title": opts[3]}
    ]

    correct_ans_str = str(qz_info["ans"]).upper()

    qz_q_doc = {
        "id": qz_q_id,
        "question_id": qz_q_id,
        "questionId": qz_q_id,
        "quizId": quiz_id,
        "quiz_id": quiz_id,
        "chapterId": ch_id,
        "chapter_id": ch_id,
        "topicId": tp_id,
        "topic_id": tp_id,
        "subjectId": subject_id,
        "subject_id": subject_id,
        "standardId": "7",
        "standard_id": "7",
        "standard": str(standard_number),
        "standardNumber": standard_number,
        "standard_number": standard_number,
        "questionText": qz_info["q"],
        "questionTextGu": qz_info["q"],
        "question_text_gu": qz_info["q"],
        "question_text": qz_info["q"],
        "question": qz_info["q"],
        "title": qz_info["q"],
        "options": opts_list,
        "optionA": opts[0],
        "optionB": opts[1],
        "optionC": opts[2],
        "optionD": opts[3],
        "option_a": opts[0],
        "option_b": opts[1],
        "option_c": opts[2],
        "option_d": opts[3],
        "correctOptionId": correct_ans_str,
        "correct_option_id": correct_ans_str,
        "correctOption": correct_ans_str,
        "correct_option": correct_ans_str,
        "correctAnswer": correct_ans_str,
        "correct_answer": correct_ans_str,
        "correct_ans": correct_ans_str,
        "correctAns": correct_ans_str,
        "answer": correct_ans_str,
        "ans": correct_ans_str,
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
        "explanation": qz_info["exp"],
        "explanationGu": qz_info["exp"],
        "explanation_gu": qz_info["exp"],
        "points": 1,
        "marks": 1,
        "order": 1,
        "isActive": True,
        "is_active": True,
        "isDeleted": False,
        "is_deleted": False
    }

    payload["questions"].append(qz_q_doc)
    payload["mcqs"].append(qz_q_doc)
    payload["mcq_bank"].append(qz_q_doc)

    payload["quizzes"].append({
        "id": quiz_id,
        "quiz_id": quiz_id,
        "quizId": quiz_id,
        "chapterId": ch_id,
        "chapter_id": ch_id,
        "subjectId": subject_id,
        "subject_id": subject_id,
        "standardId": "7",
        "standard_id": "7",
        "standard": str(standard_number),
        "standardNumber": standard_number,
        "standard_number": standard_number,
        "session": session,
        "titleGu": f"MCQ ક્વિઝ - {item['titleGu']}",
        "title_gu": f"MCQ ક્વિઝ - {item['titleGu']}",
        "title_en": f"MCQ Quiz - {item['titleEn']}",
        "title": f"MCQ Quiz - {item['titleEn']}",
        "descriptionGu": f"પાઠ {c_num} '{item['titleGu']}' ના MCQ પ્રશ્નોની પ્રેક્ટિસ ટેસ્ટ",
        "description_gu": f"પાઠ {c_num} '{item['titleGu']}' ના MCQ પ્રશ્નોની પ્રેક્ટિસ ટેસ્ટ",
        "totalQuestions": 1,
        "total_questions": 1,
        "totalMarks": 1,
        "total_marks": 1,
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
        "questions": [qz_q_doc],
        "questionIds": [qz_q_id],
        "mcqs": [qz_q_doc],
        "mcqIds": [qz_q_id]
    })

    # 4. Flashcard Documents (2 per chapter)
    fc_pairs = chapter_flashcard_data.get(c_num, [
        (f"Word Meaning: Ch {c_num}", item["titleGu"]),
        (f"Main Concept ({item['titleGu']})", item["descGu"])
    ])

    for fc_idx, (front_txt, back_txt) in enumerate(fc_pairs, 1):
        fc_id = f"fc_eng_std7_ch{c_num}_{fc_idx}"
        payload["flashcards"].append({
            "id": fc_id,
            "flashcard_id": fc_id,
            "flashcardId": fc_id,
            "chapter_id": ch_id,
            "chapterId": ch_id,
            "topic_id": tp_id,
            "topicId": tp_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "7",
            "standardId": "7",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "front": front_txt,
            "frontGu": front_txt,
            "front_gu": front_txt,
            "front_text_gu": front_txt,
            "question_gu": front_txt,
            "question": front_txt,
            "back": back_txt,
            "backGu": back_txt,
            "back_gu": back_txt,
            "back_text_gu": back_txt,
            "answer_gu": back_txt,
            "answer": back_txt,
            "cardType": "keyword" if "Script" in front_txt or "Harvesting" in front_txt else "concept",
            "card_type": "keyword" if "Script" in front_txt or "Harvesting" in front_txt else "concept",
            "type": "keyword" if "Script" in front_txt or "Harvesting" in front_txt else "concept",
            "order": fc_idx,
            "difficulty_level": "easy",
            "isActive": True,
            "is_active": True,
            "is_premium": False,
            "is_ai_generated": True,
            "isDeleted": False,
            "is_deleted": False
        })

    # 5. AI Knowledge Base Document
    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_{tp_id}",
        "standard_id": "7",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": item["titleGu"],
        "content_gu": f"પ્રકરણ {c_num}: {item['titleGu']}.\nપરિચય: {item['descGu']}.\nમહત્વના પ્રશ્નો અને ઉત્તરો:\nપ્રશ્ન: {qz_info['q']}\nજવાબ: {qz_info['ans']}\nસ્પષ્ટતા: {qz_info['exp']}",
        "keywords": [item["titleGu"], item["titleEn"]],
        "learning_outcomes": [item["descGu"]],
        "revision_notes": [item["descGu"]],
        "difficulty_level": "medium",
        "page_numbers": [item["startPage"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std7_english_sl_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated English Std 7 payload: {output_file}")
print(f"   Subjects:     {len(payload['subjects'])}")
print(f"   Textbooks:    {len(payload['textbooks'])}")
print(f"   Chapters:     {len(payload['chapters'])}")
print(f"   Quizzes:      {len(payload['quizzes'])}")
print(f"   Questions:    {len(payload['questions'])}")
print(f"   Flashcards:   {len(payload['flashcards'])}")
print(f"   AI KB Docs:   {len(payload['ai_knowledge_base'])}")
