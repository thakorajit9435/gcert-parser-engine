#!/usr/bin/env python3
"""
Builds complete, unified gita_val_v1_payload.json for Shrimad Bhagavad Gita Values and Principles Part 1 (Std 7).
Contains 10 Chapters, exact physical PDF page mappings (Ch1 start page 6, offset 5), Quizzes, Questions, Flashcards, and AI Knowledge Base.
Ensures zero duplicate IDs and full React Native Student App compatibility.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-6%20to%208%20%E0%AA%AD%E0%AA%97%E0%AA%B5%E0%AA%A6%E0%AB%8D%20%E0%AA%97%E0%AB%80%E0%AA%A4%E0%AA%BE%20%E0%AA%97%E0%AB%81%E0%AA%9C%E0%AA%B0%E0%AA%BE%E0%AA%A4%E0%AB%80%20%E0%AA%AE%E0%AA%BE%E0%AA%A7%E0%AB%8D%E0%AA%AF%E0%AA%AE.pdf?alt=media"
subject_id = "sub_gita_val_v1"
subject_id_alt = "sub_gita_v1"
standard_id = "std_7"
standard_number = 7
session = "1"

# All 10 Chapters for Shrimad Bhagavad Gita Part 1
raw_chapters_info = [
    {"num": 1, "id": "sub_gita_v1_ch1", "titleGu": "ધર્મક્ષેત્રે કુરુક્ષેત્રે", "titleEn": "Dharmakshetre Kurukshetre", "descGu": "આ એકમ શ્રીમદ્ ભગવદ્ગીતાનો પ્રાથમિક પરિચય કરાવે છે અને મહાભારતની પૃષ્ઠભૂમિ તથા વેદવ્યાસ વિશે માહિતી આપે છે.", "startPage": 6, "endPage": 15},
    {"num": 2, "id": "sub_gita_v1_ch2", "titleGu": "અંતિમ દીક્ષા", "titleEn": "Antim Diksha", "descGu": "જે મનુષ્યની ઇંદ્રિયો વશમાં છે અને જે પ્રભુપરાયણ છે તેની બુદ્ધિ પણ સ્થિર થાય છે તે અંગેની ઉપમન્યુની વાર્તા.", "startPage": 16, "endPage": 26},
    {"num": 3, "id": "sub_gita_v1_ch3", "titleGu": "આને કહેવાય વિદ્યાર્થી!", "titleEn": "Aane Kahevay Vidyarthi!", "descGu": "શ્રદ્ધા અને સંયમનો મહિમા દર્શાવતી ગુરુભક્ત શિષ્ય આરુણિની પ્રેરક વાર્તા.", "startPage": 27, "endPage": 32},
    {"num": 4, "id": "sub_gita_v1_ch4", "titleGu": "આપણી પરંપરા", "titleEn": "Aapni Parampara", "descGu": "શ્રેષ્ઠ લોકો જે કાર્ય કરે છે તેને જ લોકો અનુસરે છે તે સમજાવતી ભારતીય સંસ્કૃતિની પરંપરાઓની વાત.", "startPage": 33, "endPage": 40},
    {"num": 5, "id": "sub_gita_v1_ch5", "titleGu": "સંતુલિત જીવન", "titleEn": "Santulit Jivan", "descGu": "આહાર-વિહારમાં કાળજી અને જીવનમાં સંતુલિતતાનું મહત્ત્વ સમજાવતો બુદ્ધ અને રાજા પ્રસેનજિતનો પ્રસંગ.", "startPage": 41, "endPage": 46},
    {"num": 6, "id": "sub_gita_v1_ch6", "titleGu": "ચાણક્યની અલિપ્તતા", "titleEn": "Chanakya ni Aliptata", "descGu": "નિષ્કામ કર્મયોગીના લક્ષણો અને ચાણક્યના સાદા તથા અલિપ્ત જીવનની કથા.", "startPage": 47, "endPage": 52},
    {"num": 7, "id": "sub_gita_v1_ch7", "titleGu": "કર્મણ્યેવાધિકારસ્તે", "titleEn": "Karmanyevadhikaraste", "descGu": "મનુષ્યના નિયંત્રણમાં માત્ર કર્મ છે, ફળ નહીં તે સમજાવતી મધમાખીની વાર્તા.", "startPage": 53, "endPage": 61},
    {"num": 8, "id": "sub_gita_v1_ch8", "titleGu": "સહનશીલતા", "titleEn": "Sahanshilta", "descGu": "ઇંદ્રિયોના અનુભવોને સહન કરવામાં જ શાણપણ છે તે દર્શાવતી વલ્લભભાઈ પટેલના જીવનની વાત.", "startPage": 62, "endPage": 71},
    {"num": 9, "id": "sub_gita_v1_ch9", "titleGu": "મોજીલો કાગડો", "titleEn": "Mojilo Kagado", "descGu": "સુખ-દુઃખ જેવા દ્વંદ્વોની સ્થિતિમાં પણ જે એકસમાન ભાવે વર્તે છે તે જ ખરો મનુષ્ય છે.", "startPage": 72, "endPage": 77},
    {"num": 10, "id": "sub_gita_v1_ch10", "titleGu": "સ્થિતપ્રજ્ઞ કોને કહેવાય?", "titleEn": "Sthitapragya Kone Kahevay?", "descGu": "કોઈ પણ પરિસ્થિતિમાં પોતાની માનસિક સ્થિરતા ગુમાવતો નથી તે ખરા અર્થમાં સ્થિતપ્રજ્ઞ છે.", "startPage": 78, "endPage": 93}
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
            "name": "Shrimad Bhagavad Gita Part 1",
            "nameGu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "name_en": "Shrimad Bhagavad Gita Values Part 1",
            "name_gu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "title": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "titleGu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "title_gu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "icon": "🕉️",
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
            "name": "Shrimad Bhagavad Gita Part 1",
            "nameGu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "name_en": "Shrimad Bhagavad Gita Values Part 1",
            "name_gu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "title": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "titleGu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "title_gu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "icon": "🕉️",
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
            "title_gu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "titleGu": "શ્રીમદ્ ભગવદ્ગીતાનાં મૂલ્યો અને સિદ્ધાંતો (ભાગ-૧)",
            "title_en": "Shrimad Bhagavad Gita Values Part 1 Textbook",
            "titleEn": "Shrimad Bhagavad Gita Values Part 1 Textbook",
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
    1: {"q": "શ્રીમદ્ ભગવદ્ગીતા મહાભારતના કયા પર્વનો ભાગ છે?", "opts": ["આદિપર્વ", "સભાપર્વ", "ભીષ્મપર્વ", "વનપર્વ"], "ans": "C", "exp": "શ્રીમદ્ ભગવદ્ગીતા મહાભારતના ભીષ્મપર્વમાં આવેલા ૧૮ અધ્યાય અને ૭૦૦ શ્લોકોનો સમૂહ છે."},
    2: {"q": "ઉપમન્યુને આંખો સાજી કરવા કોનું સ્મરણ કરવા ગુરુએ કહ્યું?", "opts": ["અશ્વિનીકુમારોનું", "ઈન્દ્રદેવનું", "શ્રીકૃષ્ણનું", "સૂર્યદેવનું"], "ans": "A", "exp": "ગુરુ ધૌમ્યે ઉપમન્યુને દેવોના વૈદ્ય એવા અશ્વિનીકુમારોનું સ્મરણ કરવા સૂચવ્યું હતું."},
    3: {"q": "ગુરુભક્ત શિષ્ય આરુણિએ ખેતરની પાળ તૂટતી અટકાવવા શું કર્યું?", "opts": ["માટી નાખી", "પોતે જ પાળ પર સૂઈ ગયો", "ગુરુને બોલાવ્યા", "પથ્થરો મૂક્યા"], "ans": "B", "exp": "આરુણિએ પાણી વહી જતું રોકવા કોઈ ઉપાય ન જણાતાં પોતે જ પાળ પર સૂઈ ગયો હતો."},
    4: {"q": "ભારતીય સંસ્કૃતિમાં શ્રેષ્ઠ લોકોના આચરણને અન્ય લોકો શું કરે છે?", "opts": ["અનુસરે છે", "અવગણે છે", "વિરોધ કરે છે", "મજાક ઉડાવે છે"], "ans": "A", "exp": "ગીતા મુજબ શ્રેષ્ઠ લોકો જે આચરણ કરે છે તેને જ સમાજના અન્ય લોકો અનુસરે છે."},
    5: {"q": "બુદ્ધ ભગવાને રાજા પ્રસેનજિતને શાના પર નિયંત્રણ રાખવા સમજાવ્યું?", "opts": ["ક્રોધ પર", "આહાર-વિહાર પર", "ધન પર", "સૈન્ય પર"], "ans": "B", "exp": "બુદ્ધ ભગવાને સંતુલિત જીવન જીવવા માટે આહાર-વિહાર અને ખોરાક પર સંયમ રાખવા કહ્યું."},
    6: {"q": "ચાણક્યનું મૂળ નામ શું હતું?", "opts": ["વિષ્ણુગુપ્ત", "કૌટિલ્ય", "ચંદ્રગુપ્ત", "રાક્ષસ"], "ans": "A", "exp": "ચાણક્યનું મૂળ નામ વિષ્ણુગુપ્ત હતું અને તેઓ અલિપ્ત તથા સાદગીપૂર્ણ જીવન જીવતા હતા."},
    7: {"q": "ભગવદ્ગીતામાં 'કર્મણ્યેવાધિકારસ્તે' શ્લોક દ્વારા શાનો ઉપદેશ આપ્યો છે?", "opts": ["ફળની આશા વિના કર્મ કરવાનો", "કર્મ ન કરવાનો", "માત્ર ફળ ઇચ્છવાનો", "સુખ ભોગવવાનો"], "ans": "A", "exp": "મનુષ્યનો માત્ર કર્મ કરવાનો અધિકાર છે, તેના ફળ પર કોઈ અધિકાર નથી."},
    8: {"q": "સરદાર વલ્લભભાઈ પટેલે કયો ગુણ પોતાના જીવનમાં ચરિતાર્થ કર્યો હતો?", "opts": ["સહનશીલતા", "અહંકાર", "ચંચળતા", "આળસ"], "ans": "A", "exp": "સરદાર પટેલે પોતાના જીવનના કઠિન પ્રસંગોમાં અદભુત સહનશીલતા અને સ્થિરતા દર્શાવી હતી."},
    9: {"q": "'મોજીલો કાગડો' વાર્તા શાનો સંદેશ આપે છે?", "opts": ["સુખ-દુઃખમાં સમાન રહેવાનો", "દુઃખી થવાનો", "આળસુ બનવાનો", "ક્રોધ કરવાનો"], "ans": "A", "exp": "કાગડો રાજાની કોઈ પણ શિક્ષા કે પરિસ્થિતિમાં આનંદી અને સ્થિર ભાવે રહે છે."},
    10: {"q": "સ્થિતપ્રજ્ઞ મનુષ્યના મુખ્ય લક્ષણ કયા છે?", "opts": ["માનસિક સ્થિરતા અને સમભાવ", "અહંકાર અને ક્રોધ", "સુખમાં છલકાઈ જવું", "ચંચળ બુદ્ધિ"], "ans": "A", "exp": "કોઈ પણ પરિસ્થિતિમાં માનસિક સ્થિરતા અને સમભાવ જાળવી રાખે તે જ સ્થિતપ્રજ્ઞ કહેવાય."}
}

# Flashcards for each chapter
chapter_flashcard_data = {
    1: [("ખ્યાલ: ભગવદ્ગીતા", "મહાભારતના ભીષ્મપર્વનો ભાગ જેમાં ૭૦૦ શ્લોક અને ૧૮ અધ્યાય છે."), ("શબ્દાર્થ: કુરુક્ષેત્ર", "ધર્મ અને અધર્મ વચ્ચેના મહાયુદ્ધનું ક્ષેત્ર.")],
    2: [("શબ્દાર્થ: સ્થિર બુદ્ધિ", "ઇંદ્રિયો વશમાં હોય અને પ્રભુપરાયણ મન હોય તેવી સ્થિતિ."), ("કથા: ઉપમન્યુ", "ગુરુધૌમ્યના શિષ્યની ગુરુભક્તિ અને ધૈર્યની કથા.")],
    3: [("પ્રશ્ન: શ્રદ્ધાવાન મનુષ્યને શું પ્રાપ્ત થાય છે?", "શ્રદ્ધાવાન મનુષ્ય જ્ઞાન પ્રાપ્ત કરે છે અને જ્ઞાન પામીને તરત જ પરમ શાંતિને પામે છે."), ("કથા: આરુણિ", "ગુરુની આજ્ઞા પાળવા ખેતરની પાળ પર સૂઈ જનાર આદર્શ શિષ્ય.")],
    4: [("ખ્યાલ: પરંપરા", "ભારતીય સંસ્કૃતિની શ્રેષ્ઠ આચરણ અને સદાચારની સંસ્કૃતિ."), ("શ્રેષ્ઠ પુરુષ", "જે કાર્ય કરે છે તેનું સમાજ અનુકરણ કરે છે.")],
    5: [("ખ્યાલ: સંતુલિત જીવન", "આહાર અને વિહારમાં સંયમ જાળવીને જીવાતું સ્વસ્થ જીવન."), ("પ્રસંગ: પ્રસેનજિત", "મહાત્મા બુદ્ધ દ્વારા રાજાને આપલે બોધપ્રદ ઉપદેશ.")],
    6: [("પ્રશ્ન: ચાણક્યનું મૂળ નામ શું હતું?", "ચાણક્યનું મૂળ નામ વિષ્ણુગુપ્ત હતું."), ("ખ્યાલ: અલિપ્તતા", "અમાત્ય પદ હોવા છતાં સાદી ઝૂંપડીમાં રહેતા નિષ્કામ કર્મયોગી ચાણક્ય.")],
    7: [("શ્લોક: કર્મણ્યેવાધિકારસ્તે", "તારો અધિકાર માત્ર કર્મ કરવામાં છે, તેના ફળની આશા રાખવામાં નથી."), ("રૂપક: મધમાખી", "સતત કર્મ કરતી રહીને ફળની પરવા વગર પ્રવૃત્ત રહેવું.")],
    8: [("ખ્યાલ: સહનશીલતા", "ઇંદ્રિયોના અનુભવો અને જીવનના દુઃખોને શાંતિથી સહન કરવાનું શાણપણ."), ("વ્યક્તિત્વ: સરદાર પટેલ", "કોર્ટમાં કામ કરતી વખતે પત્નીના અવસાનની ચિઠ્ઠી મળતાં પણ ફરજ ચાલુ રાખનાર લોખંડી પુરુષ.")],
    9: [("ખ્યાલ: દ્વંદ્વ સમતા", "સુખ-દુઃખ, માન-અપમાનમાં એકસમાન આનંદી ભાવ રાખવો."), ("પાત્ર: મોજીલો કાગડો", "જે કોઈ પણ શિક્ષા કે દુઃખમાં આનંદમાં રહે છે.")],
    10: [("પ્રશ્ન: સ્થિતપ્રજ્ઞ એટલે શું?", "જે મનુષ્ય કોઈ પણ પરિસ્થિતિમાં (સુખ કે દુઃખમાં) પોતાની માનસિક સ્થિરતા ગુમાવતો નથી તેને સ્થિતપ્રજ્ઞ કહેવાય છે."), ("ખ્યાલ: ગીતાનો બોધ", "મનની ચંચળતા દૂર કરી ઇશ્વરમાં અચળ શ્રદ્ધા રાખવી.")]
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
    quiz_id = f"quiz_gita_v1_ch{c_num}"
    qz_q_id = f"qz_q_gita_v1_ch{c_num}_1"
    
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
        (f"શબ્દાર્થ: પાઠ {c_num}", item["titleGu"]),
        (f"મુખ્ય સંકલ્પના ({item['titleGu']})", item["descGu"])
    ])

    for fc_idx, (front_txt, back_txt) in enumerate(fc_pairs, 1):
        fc_id = f"fc_gita_v1_ch{c_num}_{fc_idx}"
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

output_file = PROJECT_ROOT / "outputs" / "gita_val_v1_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Gita Part 1 payload: {output_file}")
print(f"   Subjects:     {len(payload['subjects'])}")
print(f"   Textbooks:    {len(payload['textbooks'])}")
print(f"   Chapters:     {len(payload['chapters'])}")
print(f"   Quizzes:      {len(payload['quizzes'])}")
print(f"   Questions:    {len(payload['questions'])}")
print(f"   Flashcards:   {len(payload['flashcards'])}")
print(f"   AI KB Docs:   {len(payload['ai_knowledge_base'])}")
