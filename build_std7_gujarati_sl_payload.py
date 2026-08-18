#!/usr/bin/env python3
"""
Builds complete, unified std7_gujarati_sl_payload.json for GCERT Standard 7 Gujarati (Second Language).
Contains updated 15 Chapters info, physical PDF page mapping (Ch1 start page 14), Quizzes, Questions, Flashcards, and AI Knowledge Base.
Ensures zero duplicate IDs and full React Native Student App compatibility.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-7%20Gujarati%20Second%20Language.pdf?alt=media"
subject_id = "sub_gujarati_sl_std7"
standard_id = "std_7"
standard_number = 7
session = "1"

# Updated 15 Chapters with exact user provided titles, descriptions, and physical page numbers
raw_chapters_info = [
    {"num": 1, "titleGu": "સુંદર સુંદર", "titleEn": "Sundar Sundar", "descGu": "ધર્મેન્દ્ર માસ્તર 'મધુરમ્' રચિત પ્રકૃતિના સૌંદર્યનું ગીત", "startPage": 14, "endPage": 17},
    {"num": 2, "titleGu": "ત્રણ સવાલ", "titleEn": "Tran Saval", "descGu": "હરીશ નાયક લિખિત રાજા ભોજ અને કવિબાળાની ચાતુર્યકથા", "startPage": 18, "endPage": 23},
    {"num": 3, "titleGu": "ચક્રવ્યૂહ તૂટ્યો પણ...", "titleEn": "Chakravyuh Tutyo Pan...", "descGu": "અભિમન્યુના પરાક્રમ અને સાહસની વીરરસભરી પૌરાણિક કથા", "startPage": 24, "endPage": 31},
    {"num": 4, "titleGu": "ટીપાંની સફર", "titleEn": "Tipanni Safar", "descGu": "જલચક્રની પ્રક્રિયાને હળવી શૈલીમાં રજૂ કરતી સંકલિત વાર્તા", "startPage": 32, "endPage": 37},
    {"num": 5, "titleGu": "આપણે ભરોસે", "titleEn": "Aapne Bharose", "descGu": "પ્રહ્લાદ પારેખ રચિત આત્મબળ અને આત્મનિર્ભરતાનું પ્રેરણા ગીત", "startPage": 38, "endPage": 42},
    {"num": 6, "titleGu": "જો કરી જાંબુએ", "titleEn": "Jo Kari Jambue", "descGu": "જયંતી ધોકાઈ લિખિત રોજબરોજના જીવનનો એક રમૂજી પ્રસંગ", "startPage": 43, "endPage": 49},
    {"num": 7, "titleGu": "એક માણસનું સૈન્ય", "titleEn": "Ek Manasnu Sainyya", "descGu": "ડૉ. રવજી ગાબાણી લિખિત રણછોડ પગીની સાહસકથા અને દેશદાઝ", "startPage": 50, "endPage": 57},
    {"num": 8, "titleGu": "સાદ વરત્યો", "titleEn": "Saad Varatyo", "descGu": "ઝવેરચંદ મેઘાણી રચિત શૌર્ય અને સ્વાર્પણની લોકકથા", "startPage": 58, "endPage": 62},
    {"num": 9, "titleGu": "અલ્લક દલ્લક", "titleEn": "Allak Dallak", "descGu": "બાલમુકુન્દ દવે રચિત રાધા-કૃષ્ણની રાસલીલાનું ઊર્મિગીત", "startPage": 70, "endPage": 75},
    {"num": 10, "titleGu": "ભાઈબંધી", "titleEn": "Bhaibandhi", "descGu": "માણસ અને પ્રાણી વચ્ચેના સ્નેહસંબંધની પ્રેરક વાર્તા", "startPage": 76, "endPage": 83},
    {"num": 11, "titleGu": "અંધેરી નગરી", "titleEn": "Andheri Nagari", "descGu": "દલપતરામ રચિત રમૂજી અને બોધપ્રદ કથાકાવ્ય", "startPage": 84, "endPage": 89},
    {"num": 12, "titleGu": "બે રૂપિયા", "titleEn": "Be Rupiya", "descGu": "વિનોિદની નીલકંઠ લિખિત દીકરીની પ્રામાણિકતાની વાર્તા", "startPage": 90, "endPage": 97},
    {"num": 13, "titleGu": "ટૅક્સીને ફૂટી પાંખો !", "titleEn": "Taxine Futi Pankho!", "descGu": "ભવિષ્યની દુનિયાની વિજ્ઞાન આધારિત કલ્પનાની સંકલિત કથા", "startPage": 98, "endPage": 105},
    {"num": 14, "titleGu": "વીર ભામાશા", "titleEn": "Veer Bhamasha", "descGu": "દુર્ગેશ શુક્લ રચિત દાનવીર ભામાશાના વતનપ્રેમનું નાટક", "startPage": 106, "endPage": 111},
    {"num": 15, "titleGu": "સોનાનો કિલ્લો", "titleEn": "Sonano Killo", "descGu": "અભિજિત વ્યાસ લિખિત જેસલમેરનું પ્રવાસવર્ણન", "startPage": 112, "endPage": 118}
]

# Computed PDF Front Matter offset (Chapter 1 physical start page is 14, book page is 1)
pdf_offset = 13

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
            "name": "Gujarati Second Language",
            "nameGu": "ગુજરાતી (દ્વિતીય ભાષા)",
            "name_en": "Standard 7 Gujarati (Second Language)",
            "name_gu": "ગુજરાતી (દ્વિતીય ભાષા)",
            "title": "ગુજરાતી (દ્વિતીય ભાષા)",
            "titleGu": "ગુજરાતી (દ્વિતીય ભાષા)",
            "title_gu": "ગુજરાતી (દ્વિતીય ભાષા)",
            "icon": "📘",
            "order": 2,
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
            "title_gu": "ગુજરાતી (દ્વિતીય ભાષા) ધોરણ 7 પાઠ્યપુસ્તક",
            "titleGu": "ગુજરાતી (દ્વિતીય ભાષા) ધોરણ 7 પાઠ્યપુસ્તક",
            "title_en": "Standard 7 Gujarati (Second Language) Textbook",
            "titleEn": "Standard 7 Gujarati (Second Language) Textbook",
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

# Detailed Quiz Questions per chapter with user's specific text & choices
chapter_quiz_data = {
    1: {"q": "કવિતામાં 'વિભુ' શબ્દ કોના માટે વપરાયો છે?", "opts": ["સૂરજ", "ભગવાન", "પવન", "માનવ"], "ans": "B", "exp": "કાવ્યમાં 'વિભુ' એટલે ઈશ્વર અથવા ભગવાન એવો અર્થ થાય છે."},
    2: {"q": "રાજા ભોજે કવિને કેટલા પ્રશ્નો પૂછ્યા હતા?", "opts": ["એક", "બે", "ત્રણ", "ચાર"], "ans": "C", "exp": "રાજા ભોજે ભગવાન વિશે ત્રણ ચોક્કસ પ્રશ્નો પૂછ્યા હતા."},
    3: {"q": "ચક્રવ્યૂહ ભેદવાની વિદ્યા અભિમન્યુ ઉપરાંત કોણ જાણતું હતું?", "opts": ["ભીમ", "અર્જુન", "યુધિષ્ઠિર", "નકુલ"], "ans": "B", "exp": "કૌરવોની સેનાના ચક્રવ્યૂહને ભેદવાની કળા માત્ર અર્જુન અને અભિમન્યુ જાણતા હતા."},
    4: {"q": "આકાશમાંથી પડતા કુદરતી બરફના કકડાને શું કહેવાય?", "opts": ["ફોરાં", "કરા", "ઝરમર", "હેલી"], "ans": "B", "exp": "કરા એટલે આકાશમાંથી પડતા કુદરતી બરફના કકડા."},
    5: {"q": "'આપણે ભરોસે' કાવ્યમાં કોના પર ભરોસો રાખવાની વાત છે?", "opts": ["બીજા પર", "પોતાના આત્મબળ પર", "ભાગ્ય પર", "સરકાર પર"], "ans": "B", "exp": "આ કાવ્ય પોતાના આત્મબળ અને પુરુષાર્થ પર ભરોસો રાખી આગળ વધવા પ્રેરણા આપે છે."},
    6: {"q": "'જો કરી જાંબુએ' પ્રસંગના લેખક કોણ છે?", "opts": ["જયંતી ધોકાઈ", "મનુભાઈ", "ગુલાબદાસ", "હરીશ નાયક"], "ans": "A", "exp": "આ રમૂજી પ્રસંગના લેખક જયંતી ધોકાઈ છે."},
    7: {"q": "રણછોડ પગીને 'રણનું એક માણસનું સૈન્ય' કોણે કહ્યા હતા?", "opts": ["ગાંધીજીએ", "સરદારે", "જનરલ માણેકશાએ", "નેહરુજીએ"], "ans": "C", "exp": "જનરલ માણેકશાએ રણછોડ પગીના પરાક્રમો જોઈને તેમને આ બિરુદ આપ્યું હતું."},
    8: {"q": "'સાદ વરત્યો' લોકકથાના સંગ્રહકર્તા કોણ છે?", "opts": ["ઝવેરચંદ મેઘાણી", "કલાપી", "ઉમાશંકર", "દલપતરામ"], "ans": "A", "exp": "આ લોકકથા ઝવેરચંદ મેઘાણી દ્વારા સંકલિત છે."},
    9: {"q": "'અલ્લક દલ્લક' કાવ્ય કોની રાસલીલાનું ઊર્મિગીત છે?", "opts": ["રામ-સીતા", "રાધા-કૃષ્ણ", "શિવ-પાર્વતી", "ગણેશજી"], "ans": "B", "exp": "આ કાવ્ય બાલમુકુન્દ દવે રચિત રાધા-કૃષ્ણની રાસલીલા દર્શાવે છે."},
    10: {"q": "'ભાઈબંધી' વાર્તામાં કોના વચ્ચેના સ્નેહસંબંધની વાત છે?", "opts": ["બે મિત્રો વચ્ચે", "માણસ અને પ્રાણી વચ્ચે", "ભાઈ-બહેન વચ્ચે", "શિક્ષક-શિષ્ય વચ્ચે"], "ans": "B", "exp": "આ વાર્તામાં મનુષ્ય અને પ્રાણી વચ્ચેના અતુટ સ્નેહ સંબંધનું નિરૂપણ છે."},
    11: {"q": "'અંધેરી નગરી' કથાકાવ્યના રચયિતા કોણ છે?", "opts": ["દલપતરામ", "નર્મદ", "કલાપી", "મેઘાણી"], "ans": "A", "exp": "'અંધેરી નગરી ને ગંડુ રાજા' રમૂજી કાવ્યના રચયિતા કવિ દલપતરામ છે."},
    12: {"q": "'બે રૂપિયા' વાર્તા કોની પ્રામાણિકતા રજૂ કરે છે?", "opts": ["રાજાની", "દીકરીની", "વેપારીની", "નોકરની"], "ans": "B", "exp": "વિનોદિની નીલકંઠ લિખિત આ વાર્તા દીકરીની અદભુત પ્રામાણિકતા દર્શાવે છે."},
    13: {"q": "'ટૅક્સીને ફૂટી પાંખો !' કયા પ્રકારની વાર્તા છે?", "opts": ["પૌરાણિક", "વિજ્ઞાન આધારિત કલ્પના કથા", "ઐતિહાસિક", "લોકકથા"], "ans": "B", "exp": "આ વાર્તા ભવિષ્યની દુનિયાની વિજ્ઞાન આધારિત કલ્પના રજૂ કરે છે."},
    14: {"q": "ભામાશાએ અર્પણ કરેલા ધનથી કેટલા યોદ્ધાઓને બાર વર્ષ પોષી શકાય તેમ હતું?", "opts": ["પાંચ હજાર", "દસ હજાર", "પચીસ હજાર", "પચાસ હજાર"], "ans": "C", "exp": "ભામાશા પાસે બાર વર્ષ સુધી ૨૫,૦૦૦ યોદ્ધાઓને પોષી શકાય તેટલું અઢળક ધન હતું."},
    15: {"q": "'સોનાનો કિલ્લો' એકમમાં કયા શહેરનું પ્રવાસવર્ણન છે?", "opts": ["જેસલમેર", "જયપુર", "ઉદયપુર", "જોધપુર"], "ans": "A", "exp": "અભિજિત વ્યાસ લિખિત આ લેખમાં જેસલમેરના સોનાના કિલ્લાનું સુંદર વર્ણન છે."}
}

# Vocabulary & Concepts Flashcards per chapter
chapter_flashcard_data = {
    1: [("શબ્દાર્થ: સરિતા", "નદી"), ("શબ્દાર્થ: નિશા", "રાત")],
    2: [("શબ્દાર્થ: સ્તબ્ધ", "આશ્ચર્યચકિત"), ("ખ્યાલ: ત્રણ સવાલ", "ભોજ રાજાએ કવિને પૂછેલા ચાતુર્યપૂર્ણ પ્રશ્નો")],
    3: [("શબ્દાર્થ: પિતામહ", "દાદા"), ("ખ્યાલ: ચક્રવ્યૂહ", "સૈન્યની વિશિષ્ટ ગોળાકાર રચના")],
    4: [("શબ્દાર્થ: પ્રાણવાયુ", "ઓક્સિજન"), ("ખ્યાલ: કરા", "આકાશમાંથી પડતા કુદરતી બરફના કકડા")],
    5: [("શબ્દાર્થ: પુરુષાર્થ", "મહેનત કે પરિશ્રમ"), ("ખ્યાલ: આત્મબળ", "પોતાની અંદર રહેલી શક્તિ")],
    6: [("શબ્દાર્થ: રમૂજી", "હસાવે તેવું"), ("ખ્યાલ: જો કરી જાંબુએ", "રોજબરોજના જીવનનો હાસ્ય પ્રસંગ")],
    7: [("ખ્યાલ: પગી", "પગલાંની છાપના આધારે પગેરું શોધવામાં પારંગત વ્યક્તિ"), ("શબ્દાર્થ: શૌર્ય", "વીરતા")],
    8: [("શબ્દાર્થ: સ્વાર્પણ", "પોતાનું બલિદાન આપવું તે"), ("ખ્યાલ: સાદ વરત્યો", "શૌર્ય અને બલિદાનની લોકકથા")],
    9: [("શબ્દાર્થ: રાસલીલા", "શ્રીકૃષ્ણ અને ગોપીઓનો નૃત્યરાસ"), ("ખ્યાલ: અલ્લક દલ્લક", "બાળકાવ્ય અને ઊર્મિગીત")],
    10: [("શબ્દાર્થ: સ્નેહસંબંધ", "પ્રેમનો સંબંધ"), ("ખ્યાલ: ભાઈબંધી", "માણસ અને પ્રાણી વચ્ચેની મિત્રતા")],
    11: [("શબ્દાર્થ: બોધપ્રદ", "શિખામણ આપે તેવું"), ("ખ્યાલ: અંધેરી નગરી", "અવિચારી અને ગંડુ ન્યાય")],
    12: [("શબ્દાર્થ: પ્રામાણિકતા", "ઇમાનદારી"), ("ખ્યાલ: બે રૂપિયા", "પ્રામાણિક દીકરીની વાર્તા")],
    13: [("શબ્દાર્થ: કલ્પના", "વિચાર શક્તિ"), ("ખ્યાલ: વિજ્ઞાન કથા", "ભવિષ્યની દુનિયાની વિજ્ઞાન આધારિત વાર્તા")],
    14: [("શબ્દાર્થ: લખલૂટ", "અઢળક, પુષ્કળ"), ("ખ્યાલ: વતનપ્રેમ", "દેશ માટે સર્વસ્વ ત્યાગ કરનાર દાનવીર ભામાશા")],
    15: [("શબ્દાર્થ: પ્રવાસવર્ણન", "સ્થળના અનુભવનું આલેખન"), ("ખ્યાલ: સોનાનો કિલ્લો", "જેસલમેરનો પીળા પત્થરોનો પ્રસિદ્ધ કિલ્લો")]
}

for item in raw_chapters_info:
    c_num = item["num"]
    ch_id = f"{subject_id}_ch{c_num}"
    book_start = max(1, item["startPage"] - pdf_offset)
    initial_p = max(0, item["startPage"] - 1)
    
    # 1. Unified Chapter Document with user provided title, description & physical page numbers
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
    qz_info = chapter_quiz_data.get(c_num, {
        "q": f"પાઠ {c_num} '{item['titleGu']}' નો મુખ્ય વિષય શો છે?",
        "opts": ["સંસ્કાર અને મૂલ્યો", "વિકલ્પ B", "વિકલ્પ C", "વિકલ્પ D"],
        "ans": "A",
        "exp": "આ પાઠ વિદ્યાર્થીઓમાં યોગ્ય સંસ્કાર અને જીવન મૂલ્યો કેળવે છે."
    })
    
    quiz_id = f"quiz_{ch_id}_mcq"
    qz_q_id = f"qz_q_{ch_id}_1"
    
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

    # 4. Flashcard Documents (2 Unique Flashcards per chapter)
    fc_pairs = chapter_flashcard_data.get(c_num, [
        (f"શબ્દાર્થ: પાઠ {c_num}", item["titleGu"]),
        (f"મુખ્ય સંકલ્પના ({item['titleGu']})", item["descGu"])
    ])

    for fc_idx, (front_txt, back_txt) in enumerate(fc_pairs, 1):
        fc_id = f"fc_{ch_id}_{fc_idx}"
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

output_file = PROJECT_ROOT / "outputs" / "std7_gujarati_sl_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated updated complete payload: {output_file}")
print(f"   Subjects:     {len(payload['subjects'])}")
print(f"   Textbooks:    {len(payload['textbooks'])}")
print(f"   Chapters:     {len(payload['chapters'])}")
print(f"   Quizzes:      {len(payload['quizzes'])}")
print(f"   Questions:    {len(payload['questions'])}")
print(f"   Flashcards:   {len(payload['flashcards'])}")
print(f"   AI KB Docs:   {len(payload['ai_knowledge_base'])}")
