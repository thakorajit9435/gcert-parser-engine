#!/usr/bin/env python3
"""
Builds complete, unified gita_val_v2_payload.json for Shrimad Bhagavad Gita Values and Principles Part 2 (Std 7).
Contains updated 10 Chapters info with NEW physical page ranges (Ch1 start page 7), Quizzes, Questions, Flashcards, and AI Knowledge Base.
Ensures zero duplicate IDs and full React Native Student App compatibility.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-6%20to%208%20%E0%AA%AD%E0%AA%97%E0%AA%B5%E0%AA%A6%E0%AB%8D%20%E0%AA%97%E0%AB%80%E0%AA%A4%E0%AA%BE%20%E0%AA%97%E0%AB%81%E0%AA%9C%E0%AA%B0%E0%AA%BE%E0%AA%A4%E0%AB%80%20%E0%AA%AE%E0%AA%BE%E0%AA%A7%E0%AB%8D%E0%AA%AF%E0%AA%AE.pdf?alt=media"
subject_id = "sub_gita_val_v2"
standard_id = "std_7"
standard_number = 7
session = "1"

# Updated 10 Chapters with user's NEW exact page numbers and descriptions
raw_chapters_info = [
    {"num": 1, "id": "sub_gita_v2_ch1", "titleGu": "જ્ઞાનનું સામર્થ્ય", "titleEn": "Gyan nu Samarthya", "descGu": "ઋષિ વરતંતુના શિષ્ય કૌત્સે પોતાના ગુરુને આપેલી ગુરુદક્ષિણાની વાત", "startPage": 7, "endPage": 15},
    {"num": 2, "id": "sub_gita_v2_ch2", "titleGu": "જડ અને દૃઢ!", "titleEn": "Jad ane Dradh!", "descGu": "નિરંતર ઈશ્વરનું ચિંતન કરનારા જડભરતની અવિચળ ભક્તિની કથા", "startPage": 16, "endPage": 25},
    {"num": 3, "id": "sub_gita_v2_ch3", "titleGu": "પ્રભુની મરજી", "titleEn": "Prabhu ni Marji", "descGu": "વેપારી કરસનભાઈની 'જેવી પ્રભુની મરજી' ભાવ સાથેની અટલ શ્રદ્ધા", "startPage": 26, "endPage": 37},
    {"num": 4, "id": "sub_gita_v2_ch4", "titleGu": "મને આત્મજ્ઞાન જ જોઈએ!", "titleEn": "Mane Atmagyan ja Joie!", "descGu": "ઋષિકુમાર નચિકેતાની આત્મજ્ઞાન મેળવવા માટેની દૃઢતા", "startPage": 38, "endPage": 50},
    {"num": 5, "id": "sub_gita_v2_ch5", "titleGu": "વાંચ્યા વગર સુવાય?", "titleEn": "Vanchya vagar Suvay?", "descGu": "વિજ્ઞાની ડૉ. સી. વી. રામનના જીવનમાં વાંચન અને જ્ઞાનનું મહત્ત્વ", "startPage": 51, "endPage": 59},
    {"num": 6, "id": "sub_gita_v2_ch6", "titleGu": "योगક્ષેમં વહામ્યહમ્", "titleEn": "Yogakshemam Vahamyaham", "descGu": "અર્જુનની અનન્ય ભક્તિ અને શ્રીકૃષ્ણ દ્વારા તેના યોગક્ષેમનું વહન", "startPage": 60, "endPage": 66},
    {"num": 7, "id": "sub_gita_v2_ch7", "titleGu": "અમે પણ વિભૂતિ!", "titleEn": "Ame pan Vibhuti!", "descGu": "નાનાજી અને બાળકો વચ્ચેનો ગીતાના વિભૂતિયોગ પરનો સંવાદ", "startPage": 67, "endPage": 73},
    {"num": 8, "id": "sub_gita_v2_ch8", "titleGu": "ભરતના રામ", "titleEn": "Bharat na Ram", "descGu": "ભરતની નિઃસ્વાર્થ ભક્તિ અને રામની પાદુકાનું સ્થાપન", "startPage": 74, "endPage": 86},
    {"num": 9, "id": "sub_gita_v2_ch9", "titleGu": "ક્ષમાની દેવી", "titleEn": "Kshama ni Devi", "descGu": "દ્રૌપદી દ્વારા અશ્વત્થામાને ક્ષમા આપીને દર્શાવેલી ઉદારતા", "startPage": 87, "endPage": 98},
    {"num": 10, "id": "sub_gita_v2_ch10", "titleGu": "ભક્તશિરોમણિ", "titleEn": "Bhaktashiromani", "descGu": "બાળભક્ત પ્રહ્લાદની નિષ્કામ ભક્તિ અને નરસિંહ અવતારની કથા", "startPage": 99, "endPage": 115}
]

# Physical PDF page offset (Chapter 1 physical start page is 7, book page is 1)
pdf_offset = 6

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
            "name": "Shrimad Bhagavad Gita Part 2",
            "nameGu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૨)",
            "name_en": "Shrimad Bhagavad Gita Values Part 2",
            "name_gu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૨)",
            "title": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૨)",
            "titleGu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૨)",
            "title_gu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૨)",
            "icon": "🕉️",
            "order": 3,
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
            "title_gu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૨)",
            "titleGu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૨)",
            "title_en": "Shrimad Bhagavad Gita Values Part 2 Textbook",
            "titleEn": "Shrimad Bhagavad Gita Values Part 2 Textbook",
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

# Detailed Quiz Questions for each chapter
chapter_quiz_data = {
    1: {"q": "ગુરુ વરતંતુએ કૌત્સ પાસે કેટલી સુવર્ણમુદ્રાની માંગણી કરી?", "opts": ["દસ કરોડ", "ચૌદ કરોડ", "પચ્ચીસ કરોડ", "એક પણ નહીં"], "ans": "B", "exp": "ગુરુએ કૌત્સને શીખવેલી ૧૪ વિદ્યાઓના બદલામાં ૧૪ કરોડ સુવર્ણમુદ્રા માંગી હતી."},
    2: {"q": "રાજા રહૂગણ કયા આશ્રમ તરફ જઈ રહ્યા હતા?", "opts": ["વરતંતુ આશ્રમ", "કપિલાશ્રમ", "સાંદિપનિ આશ્રમ", "ભારદ્વાજ આશ્રમ"], "ans": "B", "exp": "રાજા રહૂગણ પાલખીમાં બેસીને કપિલાશ્રમ જઈ રહ્યા હતા."},
    3: {"q": "કરસનભાઈ વેપારીનો કયો મંત્ર હતો?", "opts": ["હું જ સર્વેશ્વર છું", "જેવી પ્રભુની મરજી!", "મારું ઘર મારું રાજ્ય", "લાભ એ જ લક્ષ્ય"], "ans": "B", "exp": "કરસનભાઈ કોઈપણ સ્થિતિમાં 'જેવી પ્રભુની મરજી!' બોલીને ઈશ્વરમાં શ્રદ્ધા રાખતા."},
    4: {"q": "યમરાજે નચિકેતાને આપેલું બીજું વરદાન કઈ વિદ્યાનું હતું?", "opts": ["શસ્ત્રવિદ્યા", "અગ્નિવિદ્યા", "રાજવિદ્યા", "યોગવિદ્યા"], "ans": "B", "exp": "યમરાજે બીજું વરદાન અગ્નિવિદ્યાનું આપ્યું, જે 'નાચિકેત અગ્નિવિદ્યા' તરીકે ઓળખાય છે."},
    5: {"q": "ડૉ. સી. વી. રામનને કઈ શોધ માટે નોબેલ પારિતોષિક મળ્યું હતું?", "opts": ["ક્ષ-કિરણો", "રામન અસર (Raman Effect)", "ગુરુત્વાકર્ષણ", "વીજળીની શોધ"], "ans": "B", "exp": "તેમની વૈજ્ઞાનિક શોધ 'રામન અસર' માટે તેમને વિશ્વપ્રસિદ્ધ નોબેલ પારિતોષિક મળ્યું હતું."},
    6: {"q": "દુર્યોધને શ્રીકૃષ્ણ પાસેથી શું માંગ્યું?", "opts": ["માત્ર શ્રીકૃષ્ણને", "નારાયણી સેના", "સુવર્ણમુદ્રાઓ", "યુદ્ધ ન કરવાની સલાહ"], "ans": "B", "exp": "દુર્યોધને શ્રીકૃષ્ણનું સૈન્ય (નારાયણી સેના) માંગીને સંતોષ માન્યો હતો."},
    7: {"q": "શ્રીકૃષ્ણે વેદોમાં પોતાને કયો વેદ કહ્યો છે?", "opts": ["ઋગ્વેદ", "સામવેદ", "યજુર્વેદ", "અથર્વવેદ"], "ans": "B", "exp": "ગીતાના દસમા અધ્યાય મુજબ શ્રીકૃષ્ણે કહ્યું છે કે વેદોમાં હું સામવેદ છું."},
    8: {"q": "ભરતે રામની પાદુકાઓ ક્યાં સ્થાપિત કરી?", "opts": ["પોતાના ઘરમાં", "રાજસિંહાસન પર", "મંદિરમાં", "વનમાં"], "ans": "B", "exp": "ભરતે રામની પાદુકાઓને રાજસિંહાસન પર સ્થાપિત કરી રામના પ્રતિનિધિ તરીકે રાજ્ય સંભાળ્યું."},
    9: {"q": "દ્રૌપદીએ અશ્વત્થામાને કેમ છોડી દેવા કહ્યું?", "opts": ["તે ડરી ગયા હતા", "તે ગુરુપુત્ર હતા", "તેમના પુત્રો જીવતા હતા", "શ્રીકૃષ્ણની આજ્ઞા હતી"], "ans": "B", "exp": "દ્રૌપદીએ કહ્યું કે અશ્વત્થામા ગુરુપુત્ર હોવાને કારણે પૂજનીય છે અને તેમની માતા કૃપીને પુત્રવિયોગ ન થાય તે માટે ક્ષમા આપી."},
    10: {"q": "હિરણ્યકશિપુનો વધ કયા અવતારે કર્યો?", "opts": ["વરાહ અવતાર", "નરસિંહ અવતાર", "વામન અવતાર", "રામ અવતાર"], "ans": "B", "exp": "ભગવાન વિષ્ણુએ નરસિંહ અવતાર ધારણ કરી દૈત્યરાજ હિરણ્યકશિપુનો ઉંબરા પર વધ કર્યો."}
}

# Vocabulary & Concepts Flashcards for each chapter
chapter_flashcard_data = {
    1: ("શબ્દાર્થ: અનન્ય", "બીજું કોઈ નહીં એવું, અદ્વિતીય"),
    2: ("શબ્દાર્થ: દુર્નિગ્રહ", "વશ કરવું મુશ્કેલ હોય તેવું"),
    3: ("શબ્દાર્થ: સુલભ", "સહજ પ્રાપ્ત થાય તેવું"),
    4: ("શબ્દાર્થ: અવ્યય", "અક્ષય અથવા જેનો નાશ ન થાય તેવું"),
    5: ("ખ્યાલ: જ્ઞાનયજ્ઞ", "જ્ઞાન પ્રાપ્ત કરવાની નિરંતર સાધના કે ઉપાસના"),
    6: ("ખ્યાલ: યોગક્ષેમ", "અપ્રાપ્તની પ્રાપ્તિ અને પ્રાપ્તનું રક્ષણ"),
    7: ("શબ્દાર્થ: વિભૂતિ", "શ્રેષ્ઠતા અથવા દિવ્ય શક્તિનો અંશ"),
    8: ("શબ્દાર્થ: સંગવર્જિત", "આસક્તિરહિત અથવા મોહ વગરનું"),
    9: ("શબ્દાર્થ: ક્ષમી", "ક્ષમા આપનાર અથવા ઉદાર મનવાળું"),
    10: ("શબ્દાર્થ: અનપેક્ષ", "ઈચ્છા કે અપેક્ષા વગરનું")
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
    quiz_id = f"quiz_gita_v2_ch{c_num}"
    qz_q_id = f"qz_q_gita_v2_ch{c_num}_1"
    
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

    # 4. Flashcard Document
    fc_info = chapter_flashcard_data.get(c_num)
    front_txt, back_txt = fc_info
    fc_id = f"fc_{c_num}"
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
        "cardType": "keyword" if "શબ્દાર્થ" in front_txt else "concept",
        "card_type": "keyword" if "શબ્દાર્થ" in front_txt else "concept",
        "type": "keyword" if "શબ્દાર્થ" in front_txt else "concept",
        "order": 1,
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

output_file = PROJECT_ROOT / "outputs" / "gita_val_v2_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated updated Gita Part 2 payload: {output_file}")
print(f"   Chapters:     {len(payload['chapters'])}")
