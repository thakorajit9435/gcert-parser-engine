#!/usr/bin/env python3
"""
Builds complete, unified std7_hindi_sl_payload.json for GCERT Standard 7 Hindi Second Language Sem 1 (હિન્દી દ્વિતીય ભાષા ધોરણ 7 પ્રથમ સત્ર).
Contains 8 Chapters, exact physical PDF page mappings (Ch1 start page 6, offset 5), Quizzes, Questions, Flashcards, and AI Knowledge Base.
Ensures zero duplicate IDs and full React Native Student App compatibility.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-7%20Hindi%20Second%20language%20First%20Sem.pdf?alt=media"
subject_id = "sub_hindi_sl_std7_sem1"
subject_id_alt1 = "sub_hindi_std7"
subject_id_alt2 = "sub_hindi_sl_std7"
standard_id = "std_7"
standard_number = 7
session = "1"

# 8 Chapters provided by the user
raw_chapters_info = [
    {"num": 1, "id": "sub_hindi_std7_ch1", "titleGu": "चित्र के संग-संग (चित्रपाठ)", "titleEn": "Chitra Ke Sang-Sang", "descGu": "આ ચિત્રપાઠમાં ચિત્રનું અવલોકન કરીને વિવિધ ક્રિયાઓ અને ઘટનાઓ (જેમ કે ટાયર ફટવું) ને સમજવાની પ્રવૃત્તિ છે.", "startPage": 6, "endPage": 8},
    {"num": 2, "id": "sub_hindi_std7_ch2", "titleGu": "तब याद तुम्हारी आती है !", "titleEn": "Tab Yaad Tumhari Aati Hai !", "descGu": "રામનરેશ ત્રિપાઠી રચિત આ કવિતામાં પ્રકૃતિના મનોહર તત્વો દ્વારા સૃષ્ટિના સર્જનહાર ઈશ્વરની સ્મૃતિનું વર્ણન છે.", "startPage": 9, "endPage": 13},
    {"num": 3, "id": "sub_hindi_std7_ch3", "titleGu": "कुत्ते की वफ़ादारी", "titleEn": "Kutte Ki Wafadari", "descGu": "લલ્લુભાઈ રબારીની આ વાર્તા પ્રાણીની વફાદારી અને ઉતાવળમાં લીધેલા નિર્ણયના પરિણામે થતા પસ્તાવાની હૃદયસ્પર્શી કથા છે.", "startPage": 14, "endPage": 23},
    {"num": 4, "id": "sub_hindi_std7_ch4", "titleGu": "कथनी और करनी", "titleEn": "Kathni Aur Karni", "descGu": "મનુષ્યના બોલવા અને કરવા (કથની અને કરની) વચ્ચેના તફાવતને વિવિધ પ્રસંગો દ્વારા સમજાવતો નિબંધ.", "startPage": 24, "endPage": 32},
    {"num": 5, "id": "sub_hindi_std7_ch5", "titleGu": "हिन्द देश के निवासी", "titleEn": "Hind Desh Ke Niwasi", "descGu": "ભારત દેશની વિવિધતામાં એકતા અને તેની ભવ્યતાનું ગાન કરતું પ્રેરણાદાયી કાવ્ય.", "startPage": 34, "endPage": 38},
    {"num": 6, "id": "sub_hindi_std7_ch6", "titleGu": "डॉ. विक्रम साराभाई", "titleEn": "Dr. Vikram Sarabhai", "descGu": "મહાન ભારતીય વૈજ્ઞાનિક ડો. વિક્રમ સારાભાઈના જીવન, સંઘર્ષ અને વિજ્ઞાન ક્ષેત્રે તેમના અમૂલ્ય પ્રદાનનું ચરિત્ર.", "startPage": 39, "endPage": 43},
    {"num": 7, "id": "sub_hindi_std7_ch7", "titleGu": "ढूँढ़ते रह जाओगे", "titleEn": "Dhundhte Reh Jaoge", "descGu": "વિદ્યાર્થીઓની તર્કશક્તિ અને કલ્પનાશક્તિ ખીલવતી કેટલીક રસપ્રદ અને મનોરંજક પહેલીઓ.", "startPage": 44, "endPage": 47},
    {"num": 8, "id": "sub_hindi_std7_ch8", "titleGu": "दोहा अष्टक", "titleEn": "Doha Ashtak", "descGu": "સંત કબીર, તુલસીદાસ અને રહીમના દૂહાઓ દ્વારા જીવનના નૈતિક મૂલ્યો અને વ્યવહારુ જ્ઞાનની સમજ.", "startPage": 48, "endPage": 52}
]

# Physical PDF page offset (Chapter 1 physical start page is 6, book page is 1)
pdf_offset = 5

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
            "name": "Hindi Second Language",
            "nameGu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7 (પ્રથમ સત્ર)",
            "name_en": "Standard 7 Hindi (Second Language)",
            "name_gu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7 (પ્રથમ સત્ર)",
            "title": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7 (પ્રથમ સત્ર)",
            "titleGu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7 (પ્રથમ સત્ર)",
            "title_gu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7 (પ્રથમ સત્ર)",
            "icon": "📙",
            "order": 6,
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
            "standardId": "7",
            "standard_id": "7",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "7",
            "session": session,
            "name": "Hindi Second Language",
            "nameGu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "name_en": "Standard 7 Hindi (Second Language)",
            "name_gu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "title": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "titleGu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "title_gu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "icon": "📙",
            "order": 6,
            "total_chapters": len(raw_chapters_info),
            "totalChapters": len(raw_chapters_info),
            "isDeleted": False,
            "is_deleted": False,
            "isActive": True,
            "is_active": True
        },
        {
            "id": subject_id_alt2,
            "subject_id": subject_id_alt2,
            "subjectId": subject_id_alt2,
            "standardId": "7",
            "standard_id": "7",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "7",
            "session": session,
            "name": "Hindi Second Language",
            "nameGu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "name_en": "Standard 7 Hindi (Second Language)",
            "name_gu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "title": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "titleGu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "title_gu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7",
            "icon": "📙",
            "order": 6,
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
            "title_gu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7 પાઠ્યપુસ્તક",
            "titleGu": "હિન્દી (દ્વિતીય ભાષા) ધોરણ 7 પાઠ્યપુસ્તક",
            "title_en": "Standard 7 Hindi (Second Language) Textbook",
            "titleEn": "Standard 7 Hindi (Second Language) Textbook",
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
    1: {"q": "ચિત્રમાં કયો પ્રાણી મોઢું લટકાવીને સૂઈ ગયો છે?", "opts": ["ગાય", "ઘોડો", "કૂતરો", "બિલાડી"], "ans": "C", "exp": "ચિત્રપાઠના અવલોકન મુજબ, કૂતરો મોઢું લટકાવીને જમીન પર સૂતો છે."},
    2: {"q": "કવિતામાં 'સિરજનહાર' (सिरजनहार) શબ્દ કોના માટે વપરાયો છે?", "opts": ["માતા", "પ્રભુ / ઈશ્વર", "સૂર્ય", "કવિ"], "ans": "B", "exp": "કવિ રામનરેશ ત્રિપાઠી સૃષ્ટિના સર્જક એવા પ્રભુને 'જગ કે સિરજનહાર' કહીને યાદ કરે છે."},
    3: {"q": "રાધનપુરના શેઠે વણઝારા પાસેથી જામીન તરીકે શું રાખ્યું?", "opts": ["ઊંટ", "લાખો રૂપિયા", "વફાદાર કૂતરો", "માલ-સામાન"], "ans": "C", "exp": "લાખા વણઝારા પાસે પૈસા ન હોવાથી, શેઠે તેના વફાદાર કૂતરાને જામીન તરીકે રાખવાની શરત મૂકી હતી."},
    4: {"q": "બગીચામાં 'ફૂલ તોડવા મના છે' તેવી તખ્તી કોણે લગાવી હતી?", "opts": ["સરકારે", "એક સજ્જને", "બાળકોએ", "માળીએ"], "ans": "B", "exp": "એક સજ્જને બગીચામાં ફૂલો ઉછેર્યા હતા અને લોકો ફૂલ ન તોડે તે માટે તખ્તી લગાવી હતી."},
    5: {"q": "કવિતામાં કયા પક્ષીનો અવાજ 'ન્યારો' (અલગ) ગણાવ્યો છે?", "opts": ["પોપટ", "બુલબુલ", "કોયલ", "મોર"], "ans": "C", "exp": "કાવ્યમાં ઉલ્લેખ છે કે 'કોયલ કી કૂક ન્યારી' એટલે કે કોયલનો ટહુકો અલગ અને મીઠો હોય છે."},
    6: {"q": "ડો. વિક્રમ સારાભાઈનો જન્મ કયા શહેરમાં થયો હતો?", "opts": ["મુંબઈ", "અમદાવાદ", "ભાવનગર", "રાજકોટ"], "ans": "B", "exp": "ડો. વિક્રમ સારાભાઈનો જન્મ ૧૨ ઓગસ્ટ, ૧૯૧૯ના રોજ અમદાવાદમાં એક પ્રતિષ્ઠિત ઉદ્યોગપતિ પરિવારમાં થયો હતો."},
    7: {"q": "પહેલી મુજબ 'સોનાની વસ્તુ છે પણ સોની તેને વેચતો નથી' તે શું છે?", "opts": ["પલંગ", "ઘરેણું", "ખાટલો (ચારપાઈ)", "કબાટ"], "ans": "C", "exp": "હિન્દી પહેલી મુજબ 'ચારપાઈ' (ખાટલો) સોના (ઊંઘવા) ની વસ્તુ છે પણ તે સોની વેચતો નથી."},
    8: {"q": "કબીરના દૂહા મુજબ 'સાધુ' કેવા હોવા જોઈએ?", "opts": ["ઝાડ જેવા", "સૂપડા જેવા (સૂપ)", "પાણી જેવા", "પથ્થર જેવા"], "ans": "B", "exp": "કબીર કહે છે કે સાધુ પુરુષ સૂપડા (સૂપ) જેવા હોવા જોઈએ જે સારતત્વ (અનાજ) રાખે અને નકામો કચરો ઉડાડી દે."}
}

# Flashcards Data provided by user
user_flashcards = [
    ("fc_std7_hindi_ch1_1", 1, "कुँजड़िन (કુંજડિન)", "શાકભાજી વેચનારી સ્ત્રી"),
    ("fc_std7_hindi_ch2_1", 2, "सिरजनहार (સિરજનહાર)", "સૃષ્ટિની રચના કરનાર, પ્રભુ અથવા ઈશ્વર"),
    ("fc_std7_hindi_ch3_1", 3, "मुग्ध (મુગ્ધ)", "આસક્ત અથવા મોહિત થઈ જવું"),
    ("fc_std7_hindi_ch3_2", 3, "नौ-दो ग्यारह होना", "ભાગી જવું (મુહાવરો)"),
    ("fc_std7_hindi_ch4_1", 4, "कथनी (કથની)", "જે કહેવામાં આવે છે તે, બોલવું"),
    ("fc_std7_hindi_ch4_2", 4, "करनी (કરની)", "જે કરવામાં આવે છે તે, આચરણ અથવા કર્મ"),
    ("fc_std7_hindi_ch5_1", 5, "तराना (તરાના)", "ગીત અથવા ગાન"),
    ("fc_std7_hindi_ch6_1", 6, "अनुसंधान (અનુસંધાન)", "આવિષ્કાર, શોધ અથવા સંશોધન"),
    ("fc_std7_hindi_ch7_1", 7, "पहेली (પહેલી)", "બુદ્ધિની કસોટી કરે તેવી રહસ્યમયી સમસ્યા અથવા ઉખાણું"),
    ("fc_std7_hindi_ch8_1", 8, "सुजानि (સુજાની)", "ચતુર અથવા સમજદાર વ્યક્તિ")
]

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
    quiz_id = f"quiz_std7_hindi_ch{c_num}"
    qz_q_id = f"qz_q_std7_hindi_ch{c_num}_1"
    
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

# Add user provided Flashcards
for fc_id, c_num, front_txt, back_txt in user_flashcards:
    ch_id = f"sub_hindi_std7_ch{c_num}"
    tp_id = f"{ch_id}_tp1"
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
        "cardType": "keyword",
        "card_type": "keyword",
        "type": "keyword",
        "order": 1,
        "difficulty_level": "easy",
        "isActive": True,
        "is_active": True,
        "is_premium": False,
        "is_ai_generated": True,
        "isDeleted": False,
        "is_deleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std7_hindi_sl_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Hindi Std 7 payload: {output_file}")
print(f"   Subjects:     {len(payload['subjects'])}")
print(f"   Textbooks:    {len(payload['textbooks'])}")
print(f"   Chapters:     {len(payload['chapters'])}")
print(f"   Quizzes:      {len(payload['quizzes'])}")
print(f"   Questions:    {len(payload['questions'])}")
print(f"   Flashcards:   {len(payload['flashcards'])}")
print(f"   AI KB Docs:   {len(payload['ai_knowledge_base'])}")
