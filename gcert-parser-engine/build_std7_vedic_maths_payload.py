#!/usr/bin/env python3
"""
Builds complete, unified std7_vedic_maths_payload.json for GCERT Standard 7 Vedic Mathematics (વૈદિક ગણિત ધોરણ 7).
Contains 9 Chapters, exact physical PDF page mappings (Ch0 start page 5, offset 4), Quizzes, Questions, Flashcards, and AI Knowledge Base.
Ensures zero duplicate IDs and full React Native Student App compatibility.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-7_%E0%AA%B5%E0%AB%88%E0%AA%A6%E0%AA%BF%E0%AA%95%20%E0%AA%97%E0%AA%A3%E0%AA%BF%E0%AA%A4.pdf?alt=media"
subject_id = "sub_vedic_maths_std7"
subject_id_alt = "sub_vedic_std7"
standard_id = "std_7"
standard_number = 7
session = "1"

# 9 Chapters provided by the user
raw_chapters_info = [
    {"num": 0, "id": "sub_vedic_std7_ch0", "titleGu": "વૈદિક ગણિત-પરિચય", "titleEn": "Introduction to Vedic Mathematics", "descGu": "વેદો સમગ્ર જ્ઞાનનો સ્રોત છે. જગદ્ગુરુ સ્વામી શ્રી ભારતીકૃષ્ણ તીર્થજી મહારાજે વૈદિક ગણિતના ૧૬ સૂત્રો અને ૧૩ ઉપસૂત્રોનો આવિષ્કાર કર્યો છે.", "startPage": 5, "endPage": 5},
    {"num": 1, "id": "sub_vedic_std7_ch1", "titleGu": "1. उर्ध्वતિર્યગ્ભ્યામ્ સૂત્ર દ્વારા ગુણાકાર", "titleEn": "Multiplication by Urdhva-Tiryak Sutra", "descGu": "આ અધ્યાયમાં ત્રણ અંકો સુધીની સંખ્યાઓના ઊભા અને ત્રાંસા ગુણાકાર કરવાની પદ્ધતિ સમજાવવામાં આવી છે.", "startPage": 6, "endPage": 10},
    {"num": 2, "id": "sub_vedic_std7_ch2", "titleGu": "2. નિખિલં સૂત્રથી ગુણાકાર", "titleEn": "Multiplication by Nikhilam Sutra", "descGu": "આધારથી નજીકની સંખ્યાઓનો વિચલનાંકના આધારે સરળતાથી ગુણાકાર કરવાની રીત.", "startPage": 11, "endPage": 14},
    {"num": 3, "id": "sub_vedic_std7_ch3", "titleGu": "3. એકન્યૂનેન પૂર્વેણ સૂત્રની રીતે ગુણાકાર", "titleEn": "Multiplication by Ekanyunena Purvena Sutra", "descGu": "જ્યારે ગુણ્ય કે ગુણક સંખ્યા 9, 99, 999... પ્રકારની હોય ત્યારે ગુણાકાર કરવાની વિશિષ્ટ રીત.", "startPage": 15, "endPage": 19},
    {"num": 4, "id": "sub_vedic_std7_ch4", "titleGu": "4. સંખ્યાઓનો વર્ગ", "titleEn": "Squaring of Numbers", "descGu": "એકમનો અંક 5 હોય તેવી પંચાન્ત સંખ્યાઓનો વર્ગ અને યાવદૂનમ્ સૂત્ર દ્વારા વર્ગ કરવાની પદ્ધતિ.", "startPage": 20, "endPage": 24},
    {"num": 5, "id": "sub_vedic_std7_ch5", "titleGu": "5. વિભાજ્યતા", "titleEn": "Divisibility", "descGu": "આશ્લેષક વિધિ દ્વારા 7 અને 13 જેવી સંખ્યાઓની વિભાજ્યતા ચકાસવાની પદ્ધતિ.", "startPage": 25, "endPage": 31},
    {"num": 6, "id": "sub_vedic_std7_ch6", "titleGu": "6. ઋણાંકથી ઘડિયાની રચના", "titleEn": "Construction of Tables using Vinculum", "descGu": "ઋણાંક (વિનકુલમ) પદ્ધતિના ઉપયોગ દ્વારા 5 થી મોટા અંકો ધરાવતી સંખ્યાઓના ઘડિયા સરળતાથી બનાવવાની રીત.", "startPage": 32, "endPage": 35},
    {"num": 7, "id": "sub_vedic_std7_ch7", "titleGu": "જગદ્ગુરુ સ્વામીશ્રી ભારતીકૃષ્ણતીર્થજીનો પરિચય", "titleEn": "Introduction to Jagadguru Swami Bharati Krishna Tirtha", "descGu": "વૈદિક ગણિતના પ્રણેતા અને ગોવર્ધન મઠ, પુરીના જગદ્ગુરુ શંકરાચાર્યનો જીવન પરિચય.", "startPage": 36, "endPage": 37},
    {"num": 8, "id": "sub_vedic_std7_ch8", "titleGu": "પરિશિષ્ટ", "titleEn": "Appendix", "descGu": "વૈદિક ગણિતના ૧૬ સૂત્રો અને ૧૩ ઉપસૂત્રોના અર્થ અને તેમની ઉપયોગિતાની માહિતી.", "startPage": 38, "endPage": 40}
]

# Physical PDF page offset (Chapter 1 physical start page is 5, book page is 1)
pdf_offset = 4

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
            "name": "Vedic Mathematics",
            "nameGu": "વૈદિક ગણિત ધોરણ 7",
            "name_en": "Standard 7 Vedic Mathematics",
            "name_gu": "વૈદિક ગણિત ધોરણ 7",
            "title": "વૈદિક ગણિત ધોરણ 7",
            "titleGu": "વૈદિક ગણિત ધોરણ 7",
            "title_gu": "વૈદિક ગણિત ધોરણ 7",
            "icon": "🔢",
            "order": 7,
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
            "name": "Vedic Mathematics",
            "nameGu": "વૈદિક ગણિત ધોરણ 7",
            "name_en": "Standard 7 Vedic Mathematics",
            "name_gu": "વૈદિક ગણિત ધોરણ 7",
            "title": "વૈદિક ગણિત ધોરણ 7",
            "titleGu": "વૈદિક ગણિત ધોરણ 7",
            "title_gu": "વૈદિક ગણિત ધોરણ 7",
            "icon": "🔢",
            "order": 7,
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
            "title_gu": "વૈદિક ગણિત ધોરણ 7 પાઠ્યપુસ્તક",
            "titleGu": "વૈદિક ગણિત ધોરણ 7 પાઠ્યપુસ્તક",
            "title_en": "Standard 7 Vedic Mathematics Textbook",
            "titleEn": "Standard 7 Vedic Mathematics Textbook",
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

# Detailed Quiz Questions mapping
chapter_quiz_list = {
    0: [
        {"q": "વૈદિક ગણિતના પ્રણેતા કોણ હતા?", "opts": ["આર્યભટ્ટ", "સ્વામી શ્રી ભારતીકૃષ્ણ તીર્થજી", "રામાનુજન", "ભાસ્કરાચાર્ય"], "ans": "B", "exp": "ગોવર્ધન મઠ પુરીના જગદ્ગુરુ સ્વામી શ્રી ભારતીકૃષ્ણ તીર્થજી મહારાજે વૈદિક ગણિતના સૂત્રોની શોધ કરી હતી."},
        {"q": "વૈદિક ગણિતમાં મુખ્ય કેટલા સૂત્રો છે?", "opts": ["૧૨", "૧૬", "૨૦", "૨૪"], "ans": "B", "exp": "વૈદિક ગણિતમાં ૧૬ મુખ્ય સૂત્રો અને ૧૩ ઉપસૂત્રો આવેલા છે."}
    ],
    1: [
        {"q": "'ઉર્ધ્વ' શબ્દનો અર્થ શું થાય છે?", "opts": ["ત્રાંસું", "ઊભું", "આડું", "ગોળ"], "ans": "B", "exp": "સૂત્ર મુજબ ઉર્ધ્વ એટલે ઊભા (ઉપર-નીચે) ગુણાકાર કરવા."},
        {"q": "બે અંકોની સંખ્યાના ગુણાકારમાં આ સૂત્ર મુજબ કેટલા વિભાગ થાય છે?", "opts": ["બે", "ત્રણ", "ચાર", "પાંચ"], "ans": "B", "exp": "બે અંકોની સંખ્યાઓના ગુણાકારમાં ત્રણ વિભાગ અને ત્રણ અંકોમાં પાંચ વિભાગ થાય છે."},
        {"q": "'તિર્યક' શબ્દનો અર્થ શું થાય છે?", "opts": ["સીધું", "ઊભું", "ત્રાંસું", "ઝડપી"], "ans": "C", "exp": "તિર્યક એટલે ત્રાંસા ગુણાકાર કરવાની પદ્ધતિ."},
        {"q": "ત્રણ અંકોની સંખ્યાના ગુણાકારમાં કેટલા વિભાગ થાય છે?", "opts": ["૩", "૪", "૫", "૬"], "ans": "C", "exp": "વૈદિક ગણિત મુજબ ત્રણ અંકોના ગુણાકારમાં પાંચ વિભાગમાં ગણતરી થાય છે."},
        {"q": "જો ગુણ્ય અને ગુણક સંખ્યાના અંકો સમાન ન હોય તો શું કરવું જોઈએ?", "opts": ["શૂન્ય પાછળ મૂકવું", "શૂન્ય આગળ મૂકવું", "સંખ્યા બદલવી", "ગણતરી ન કરવી"], "ans": "B", "exp": "અંકો સમાન કરવા માટે જરૂરી શૂન્યો સંખ્યાની આગળ મૂકીને ગુણાકાર કરવામાં આવે છે."}
    ],
    2: [
        {"q": "'નિખિલં નવતશ્ચરમં દશતઃ' સૂત્રનો અર્થ શું છે?", "opts": ["બધા દસમાંથી", "અંતિમ દસ અને બાકીના નવમાંથી", "બધા નવમાંથી", "પહેલા કરતા એક વધારે"], "ans": "B", "exp": "આ સૂત્રનો અર્થ અંતિમ અંકને ૧૦ માંથી અને બાકીનાને ૯ માંથી બાદ કરવા તેવો થાય છે."},
        {"q": "આધાર ૧૦૦ માટે ૯૬ નો વિચલનાંક કેટલો થશે?", "opts": ["+૦૪", "-૦૪", "+૪", "-૪"], "ans": "B", "exp": "સંખ્યા ૯૬ એ ૧૦૦ થી ૪ ઓછી હોવાથી તેનો વિચલનાંક -૦૪ થાય."},
        {"q": "આધાર ૧૦૦૦ માટે ૧૦૦૭ નો વિચલનાંક શું થશે?", "opts": ["+૭", "+૦૭", "+૦૦૭", "-૦૦૭"], "ans": "C", "exp": "સંખ્યા ૧૦૦૭ એ ૧૦૦૦ થી ૭ વધારે છે, આધારમાં ૩ શૂન્ય હોવાથી વિચલનાંક +૦૦૭ લખાશે."},
        {"q": "જો સંખ્યા આધારથી મોટી હોય તો વિચલનાંક કેવો હોય છે?", "opts": ["ઋણાત્મક", "શૂન્ય", "ધનાત્મક", "તટસ્થ"], "ans": "C", "exp": "આધારથી મોટી સંખ્યા માટે વિચલનાંક હંમેશા ધનાત્મક (Positive) હોય છે."},
        {"q": "આધાર ૧૦ માટે ૧૭ નો વિચલનાંક કેટલો મળે?", "opts": ["-૭", "+૭", "+૦૭", "-૦૭"], "ans": "B", "exp": "૧૭ એ ૧૦ થી ૭ વધુ હોવાથી વિચલનાંક +૭ મળે."}
    ],
    3: [
        {"q": "'એકન્યૂનેન પૂર્વેણ' સૂત્રનો અર્થ શું થાય છે?", "opts": ["એક વધારે દ્વારા", "એક ઓછા દ્વારા", "બમણા દ્વારા", "અડધા દ્વારા"], "ans": "B", "exp": "એકન્યૂનેન એટલે પૂર્વ (પહેલાની) સંખ્યા કરતા એક ઓછું કરવું."},
        {"q": "આ સૂત્રના ઉપયોગ માટે કઈ શરત જરૂરી છે?", "opts": ["બધા અંકો ૧ હોય", "બધા અંકો ૫ હોય", "એક સંખ્યાના બધા અંકો ૯ હોય", "બધી સંખ્યા બે અંકી હોય"], "ans": "C", "exp": "જ્યારે ગુણ્ય કે ગુણકમાંથી કોઈ એક સંખ્યા ૯, ૯૯, ૯૯૯... પ્રકારની હોય ત્યારે આ સૂત્ર વપરાય છે."},
        {"q": "૪૬ x ૯૯ માં જવાબનો ડાબો ભાગ (Left Part) શું આવશે?", "opts": ["૪૬", "૪૭", "૪૫", "૪૪"], "ans": "C", "exp": "પૂર્વ સંખ્યા ૪૬ માંથી ૧ બાદ કરતા ૪૫ મળે."},
        {"q": "૯ થી બનેલી સંખ્યાનો બીજાંક (Digit Sum) હંમેશા શું થાય છે?", "opts": ["૧", "૫", "૯ અથવા ૦", "૭"], "ans": "C", "exp": "માત્ર ૯ થી બનેલી સંખ્યાઓનો બીજાંક હંમેશા ૯ અથવા ૦ થાય છે."},
        {"q": "૪૮૧ x ૯૯૯ માં જવાબનો જમણો ભાગ કયા સૂત્રથી મળે છે?", "opts": ["એકાધિકેન", "નિખિલં", "ઉર્ધ્વ", "યાવદૂનમ્"], "ans": "B", "exp": "જમણો ભાગ નિખિલં સૂત્ર મુજબ ૪૮૧ ના અંકોને ૯ અને ૧૦ માંથી બાદ કરતા મળે છે."}
    ],
    4: [
        {"q": "જે સંખ્યાનો એકમનો અંક ૫ હોય તેને શું કહેવાય?", "opts": ["પૂર્ણાંક", "પંચાન્ત", "દશાંશ", "અયુગ્મ"], "ans": "B", "exp": "એકમમાં ૫ ધરાવતી સંખ્યાઓને પંચાન્ત સંખ્યાઓ કહે છે."},
        {"q": "૩૫ નો વર્ગ એકાધિકેન સૂત્રથી કરતા ડાબી બાજુ શું આવશે?", "opts": ["૯", "૧૨", "૧૫", "૨૦"], "ans": "B", "exp": "૩ પછીની સંખ્યા ૪ હોવાથી ૩ x ૪ = ૧૨ ડાબી બાજુ આવશે."},
        {"q": "'યાવદૂનમ્' સૂત્રનો અર્થ શું છે?", "opts": ["જેટલું વધારે", "જેટલું ઓછું", "સરખું", "બમણું"], "ans": "B", "exp": "યાવદૂનમ્ એટલે 'જેટલું ઓછું હોય તેટલું'."},
        {"q": "૯૭ નો વર્ગ યાવદૂનમ્ સૂત્રથી કરતા વિચલનાંક કેટલો લેવાશે?", "opts": ["૧", "૨", "૩", "૪"], "ans": "C", "exp": "૯૭ એ ૧૦૦ થી ૩ ઓછી હોવાથી વિચલનાંક ૩ લેવાય."},
        {"q": "આધારથી મોટી સંખ્યા ૧૨ નો વર્ગ કરવા ડાબી બાજુ શું કરવું પડે?", "opts": ["૧૨ - ૨", "૧૨ + ૨", "૧૨ x ૨", "૧૨ / ૨"], "ans": "B", "exp": "આધારથી મોટી સંખ્યા માટે સંખ્યામાં વિચલનાંક ઉમેરવો પડે (૧૨ + ૨ = ૧૪)."}
    ],
    5: [
        {"q": "વૈદિક ગણિતમાં વિભાજ્યતા પરીક્ષણની રીતને શું કહે છે?", "opts": ["નિખિલં વિધિ", "આશ્લેષક વિધિ", "વર્ગ વિધિ", "ગુણાકાર વિધિ"], "ans": "B", "exp": "વિભાજ્યતા ચકાસવાની પદ્ધતિને આશ્લેષક (Osculator) વિધિ કહેવાય છે."},
        {"q": "૭ માટે ધન આશ્લેષક કયો છે?", "opts": ["૨", "૩", "૪", "૫"], "ans": "D", "exp": "૭ ને ૭ વડે ગુણતા ૪૯ મળે, જેના પરથી ધન આશ્લેષક ૫ મળે છે."},
        {"q": "૧૩ માટે ધન આશ્લેષક કયો છે?", "opts": ["૧", "૨", "૩", "૪"], "ans": "D", "exp": "૧૩ ને ૩ વડે ગુણતા ૩૯ મળે, જેના પરથી ધન આશ્લેષક ૪ મળે છે."},
        {"q": "૭ માટે ઋણ આશ્લેષક કયો મળે?", "opts": ["૧", "૨", "૩", "૪"], "ans": "B", "exp": "૭ ને ૩ વડે ગુણતા ૨૧ મળે, જેના પરથી ઋણ આશ્લેષક ૨ મળે છે."},
        {"q": "શૂન્યાંત સંખ્યામાંથી શૂન્ય હટાવતા બચતી સંખ્યાને શું કહે છે?", "opts": ["શેષ", "ભાજક", "આશ્લેષક", "ગુણક"], "ans": "C", "exp": "શૂન્યાંત સંખ્યાનો શૂન્ય હટાવતા જે સંખ્યા વધે તેને આશ્લેષક કહેવાય."}
    ],
    6: [
        {"q": "ઋણાંક (વિનકુલમ) પદ્ધતિમાં કયા અંકોનો ઉપયોગ થાય છે?", "opts": ["૦ થી ૯", "૦ થી ૫", "૧ થી ૧૦", "માત્ર ઋણ"], "ans": "B", "exp": "આ પદ્ધતિમાં ૫ થી મોટા અંકોને ૦ થી ૫ વચ્ચેના અંકોમાં ફેરવવામાં આવે છે."},
        {"q": "૧૭ ને ઋણાંક પદ્ધતિથી કેવી રીતે લખાય?", "opts": ["૧૩", "૨૩ (૨ વિનકુલમ ૩)", "૨૭", "૧૭"], "ans": "B", "exp": "૧૭ એટલે ૨૦ - ૩, જેને ૨૩ (૨ ઋણાંક ૩) તરીકે લખાય."},
        {"q": "અંક પર રહેલું '*' (Asterisk) નું ચિહ્ન શું દર્શાવે છે?", "opts": ["એકાધિક", "એકન્યૂન", "ગુણાકાર", "ભાગાકાર"], "ans": "B", "exp": "અંક પર રહેલું '*' ચિહ્ન તેનાથી એક ઓછી કિંમત (એકન્યૂન) દર્શાવે છે."},
        {"q": "૮* (૮ એકન્યૂન) ની કિંમત કેટલી થાય?", "opts": ["૯", "૮", "૭", "૬"], "ans": "C", "exp": "એકન્યૂન એટલે એક ઓછું, તેથી ૮ - ૧ = ૭."},
        {"q": "ઋણાંક પદ્ધતિનો મુખ્ય ફાયદો શું છે?", "opts": ["મોટી સંખ્યા બને", "ગણતરી જટિલ બને", "ગાણિતિક ક્રિયાઓ સરળ બને", "કોઈ ફાયદો નથી"], "ans": "C", "exp": "મોટા અંકો ન હોવાથી સરવાળા, બાદબાકી અને ઘડિયા સરળ બને છે."}
    ],
    7: [
        {"q": "જગદ્ગુરુ સ્વામીશ્રી ભારતીકૃષ્ણતીર્થજી કયા મઠના શંકરાચાર્ય હતા?", "opts": ["ગોવર્ધન મઠ પુરી", "શૃંગેરી મઠ", "દ્વારકા મઠ", "જ્યોતિર્મઠ"], "ans": "A", "exp": "તેઓ જગન્નાથ પુરીના ગોવર્ધન મઠના પીઠાધીશ્વર શંકરાચાર્ય હતા."},
        {"q": "તેમણે વૈદિક ગણિતના કેટલા સૂત્રોની શોધો કરી?", "opts": ["૧૬", "૨૦", "૩૦", "૫૦"], "ans": "A", "exp": "તેમણે વેદોના તર્કસંગત મંથન દ્વારા ૧૬ ગણિતીય સૂત્રોનો આવિષ્કાર કર્યો હતો."}
    ],
    8: [
        {"q": "વૈદિક ગણિતના ઉપસૂત્રોની સંખ્યા કેટલી છે?", "opts": ["૧૦", "૧૩", "૧૬", "૧૮"], "ans": "B", "exp": "વૈદિક ગણિતમાં ૧૬ મુખ્ય સૂત્રો અને ૧૩ ઉપસૂત્રો (Subsutras) આપેલા છે."},
        {"q": "પરિશિષ્ટમાં શાની માહિતી આપેલ છે?", "opts": ["સૂત્રો અને ઉપસૂત્રોની યાદી", "માત્ર ઘડિયા", "ચિત્રો", "કવિતાઓ"], "ans": "A", "exp": "પરિશિષ્ટ ભાગમાં ૧૬ સૂત્રો અને ૧૩ ઉપસૂત્રોનું વર્ગીકરણ આપેલું છે."}
    ]
}

# User provided flashcards
user_flashcards = [
    (1, "ઉર્ધ્વતિર્યગ્ભ્યામ્", "ઊભા અને ત્રાંસા ગુણાકાર કરવાની રીત."),
    (1, "ઉર્ધ્વ", "ઊભા (ઉપર-નીચે)."),
    (1, "તિર્યક", "ત્રાંસું."),
    (1, "૨ અંકોના ગુણાકારના વિભાગ", "૩ વિભાગ."),
    (1, "૩ અંકોના ગુણાકારના વિભાગ", "૫ વિભાગ."),
    (2, "આધાર (Base)", "૧૦ અથવા ૧૦ ની કોઈ પણ ઘાત (૧૦, ૧૦૦, ૧૦૦૦...)."),
    (2, "વિચલનાંક", "સંખ્યા આધારથી કેટલી ઓછી કે વધારે છે તે દર્શાવતો અંક."),
    (2, "ધનાત્મક વિચલનાંક", "જ્યારે સંખ્યા આધાર કરતા મોટી હોય."),
    (2, "ઋણાત્મક વિચલનાંક", "જ્યારે સંખ્યા આધાર કરતા નાની હોય."),
    (2, "૯૭ નો વિચલનાંક (આધાર ૧૦૦)", "-૦૩."),
    (3, "એકન્યૂનેન પૂર્વેણ", "પહેલાં કરતા એક ઓછા દ્વારા."),
    (3, "ગુણક શરત", "સંખ્યાના બધા જ અંકો ૯ હોવા જોઈએ."),
    (3, "જવાબનો ડાબો ભાગ", "સંખ્યામાંથી ૧ બાદ કરતા મળતો અંક."),
    (3, "જવાબનો જમણો ભાગ", "ડાબા ભાગને ૯ માંથી બાદ કરતા મળતા અંકો."),
    (3, "૪૬ x ૯૯", "૪૫૫૪."),
    (4, "વર્ગ (Square)", "સંખ્યાને તે જ સંખ્યા વડે ગુણવાથી મળતું ફળ."),
    (4, "એકાધિકેન પૂર્વેણ", "પહેલા કરતા એક વધારે દ્વારા."),
    (4, "પંચાન્ત સંખ્યા", "જેનો એકમનો અંક ૫ હોય."),
    (4, "યાવદૂનમ્", "જેટલું ઓછું હોય તેટલું."),
    (4, "૧૫ નો વર્ગ", "૨૨૫."),
    (5, "આશ્લેષક (Osculator)", "વિભાજ્યતા ચકાસવા માટે વપરાતો શૂન્યાંત અંક."),
    (5, "૭ નો ધન આશ્લેષક", "૫."),
    (5, "૭ નો ઋણ આશ્લેષક", "૨."),
    (5, "૧૩ નો ધન આશ્લેષક", "૪."),
    (5, "૧૩ નો ઋણ આશ્લેષક", "૯."),
    (6, "ઋણાંક (Vinculum)", "મોટા અંકોને નાના અંકોમાં લખવાની વિશિષ્ટ પદ્ધતિ."),
    (6, "એકન્યૂન સંકેત", "અંક પર '*' નું ચિહ્ન (જેમ કે ૫* = ૪)."),
    (6, "૧૮ નો ઋણાંક", "૨૨ (૨ વિનકુલમ ૨)."),
    (6, "ઋણાંકનો ઉપયોગ", "૫ થી મોટા અંકોના ઘડિયા સરળ બનાવવા."),
    (6, "૪૮ નો ઋણાંક", "૫૨ (૫ વિનકુલમ ૨).")
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
    q_list = chapter_quiz_list.get(c_num, [])
    quiz_id = f"quiz_std7_vedic_ch{c_num}"
    
    quiz_q_ids = []
    quiz_q_docs = []

    for q_idx, qz_info in enumerate(q_list, 1):
        qz_q_id = f"qz_q_std7_vedic_ch{c_num}_{q_idx}"
        quiz_q_ids.append(qz_q_id)

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
            "order": q_idx,
            "isActive": True,
            "is_active": True,
            "isDeleted": False,
            "is_deleted": False
        }

        payload["questions"].append(qz_q_doc)
        payload["mcqs"].append(qz_q_doc)
        payload["mcq_bank"].append(qz_q_doc)
        quiz_q_docs.append(qz_q_doc)

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
        "totalQuestions": len(quiz_q_docs),
        "total_questions": len(quiz_q_docs),
        "totalMarks": len(quiz_q_docs),
        "total_marks": len(quiz_q_docs),
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
        "questions": quiz_q_docs,
        "questionIds": quiz_q_ids,
        "mcqs": quiz_q_docs,
        "mcqIds": quiz_q_ids
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
        "content_gu": f"પ્રકરણ {c_num}: {item['titleGu']}.\nપરિચય: {item['descGu']}.",
        "keywords": [item["titleGu"], item["titleEn"]],
        "learning_outcomes": [item["descGu"]],
        "revision_notes": [item["descGu"]],
        "difficulty_level": "medium",
        "page_numbers": [item["startPage"]],
        "is_active": True,
        "isDeleted": False
    })

# Add user provided Flashcards
for fc_idx, (c_num, front_txt, back_txt) in enumerate(user_flashcards, 1):
    ch_id = f"sub_vedic_std7_ch{c_num}"
    tp_id = f"{ch_id}_tp1"
    fc_id = f"fc_vedic_std7_{fc_idx}"
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
        "order": fc_idx,
        "difficulty_level": "easy",
        "isActive": True,
        "is_active": True,
        "is_premium": False,
        "is_ai_generated": True,
        "isDeleted": False,
        "is_deleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std7_vedic_maths_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Vedic Maths Std 7 payload: {output_file}")
print(f"   Subjects:     {len(payload['subjects'])}")
print(f"   Textbooks:    {len(payload['textbooks'])}")
print(f"   Chapters:     {len(payload['chapters'])}")
print(f"   Quizzes:      {len(payload['quizzes'])}")
print(f"   Questions:    {len(payload['questions'])}")
print(f"   Flashcards:   {len(payload['flashcards'])}")
print(f"   AI KB Docs:   {len(payload['ai_knowledge_base'])}")
