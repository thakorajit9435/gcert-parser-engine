#!/usr/bin/env python3
"""
Builds complete, unified std7_gujarati_payload.json for GCERT Standard 7 Gujarati.
Combines Chapters, PDF Page Mappings, Quizzes, Questions, Flashcards, and AI Knowledge Base.
Contains all required camelCase & snake_case field aliases for React Native Student App.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-7%20Gujarati%20First%20Language.pdf?alt=media"
subject_id = "sub_gujarati_std7"
standard_id = "std_7"
standard_number = 7
session = "1"

raw_chapters_info = [
    {"num": 1, "titleGu": "પ્રાણીમાત્રને", "titleEn": "Pranimatrne", "descGu": "મુનિશ્રી સંતબાલ રચિત સર્વધર્મ સમભાવ અને પ્રાણીદયા દર્શાવતું કાવ્ય", "startPage": 12, "endPage": 15},
    {"num": 2, "titleGu": "ગુપ્તદાન", "titleEn": "Guptdan", "descGu": "પીતાંબર પટેલ લિખિત ગુપ્ત દાન અને માનવતાનો મહિમા દર્શાવતી પ્રેરક વાર્તા", "startPage": 16, "endPage": 22},
    {"num": 3, "titleGu": "અમારી કામધેનુ", "titleEn": "Amari Kamdhenu", "descGu": "ચંદ્રકાંત પંડ્યા લિખિત અબોલ પ્રાણી સાથેના મનુષ્યના સહજીવનનું નિરૂપણ", "startPage": 23, "endPage": 29},
    {"num": 4, "titleGu": "ચાલો, ચરણ ઉપાડો!", "titleEn": "Chalo, Charan Upado!", "descGu": "કવિ સુરેશ દલાલ રચિત રાષ્ટ્રસેવા માટે આહ્વાન કરતું કૂચગીત", "startPage": 30, "endPage": 34},
    {"num": 5, "titleGu": "તમે સાપથી ડરો છો કે?", "titleEn": "Tame Sapthi Daro Cho Ke?", "descGu": "જયંતભાઈ પટેલ લિખિત સાપ વિશેની રસપ્રદ માહિતી અને ગેરમાન્યતાઓ દૂર કરતો લેખ", "startPage": 35, "endPage": 41},
    {"num": 6, "titleGu": "અવિરામ યુદ્ધ", "titleEn": "Aviram Yuddh", "descGu": "ધૂમકેતુ લિખિત મનુષ્યના જીવનસંઘર્ષ અને નિર્ભયતાની કથા", "startPage": 42, "endPage": 49},
    {"num": 7, "titleGu": "હરિ, ઘરે આવોને!", "titleEn": "Hari, Ghare Aavo ne!", "descGu": "લોકગીત જેમાં મહેમાનના સ્વાગત માટેની તૈયારીનું સુંદર વર્ણન છે", "startPage": 50, "endPage": 52},
    {"num": 8, "titleGu": "સાહેબ, બધાં જોડાઈ ગયાં છે.", "titleEn": "Saheb, Badha Jodai Gaya Che", "descGu": "ઓનલાઈન શિક્ષણ અને સાચી કેળવણી અંગેનો સંવાદ", "startPage": 53, "endPage": 61},
    {"num": 9, "titleGu": "રત્નભોજન", "titleEn": "Ratnabhojan", "descGu": "મનુભાઈ પંચોળી 'દર્શક' લિખિત જીવનનું સત્ય સમજાવતી ઐતિહાસિક વાર્તા", "startPage": 62, "endPage": 68},
    {"num": 10, "titleGu": "ગુજરાતનાં ગરવાં લોકગાયિકા", "titleEn": "Gujaratna Garva Lokgayika", "descGu": "પન્ના ત્રિવેદી લિખિત પદ્મશ્રી દિવાળીબેન ભીલનો પરિચય આપતો ચરિત્ર-નિબંધ", "startPage": 69, "endPage": 75},
    {"num": 11, "titleGu": "વાગે છે રે વાગે છે", "titleEn": "Vage Che Re Vage Che", "descGu": "મીરાંબાઈ રચિત શ્રીકૃષ્ણની મોરલી અને ભક્તિનું પદ", "startPage": 79, "endPage": 83},
    {"num": 12, "titleGu": "સરહદની સફરે", "titleEn": "Sarhadni Safare", "descGu": "ડૉ. પૂર્ણિમા ભાડેસિયા લિખિત અરુણાચલ પ્રદેશની તવાંગયાત્રાની માહિતી", "startPage": 84, "endPage": 92},
    {"num": 13, "titleGu": "સમરથલાલ સૂરણવાળાનો સન્માનસમારંભ", "titleEn": "Samrathlal Suranvalano Sanmansamarambh", "descGu": "મધુસૂદન પારેખ લિખિત શાકભાજીના ઉલ્લેખ દ્વારા હાસ્ય નિષ્પન્ન કરતી કથા", "startPage": 93, "endPage": 100},
    {"num": 14, "titleGu": "રે પંખીડાં! સુખથી ચણજો", "titleEn": "Re Pankhida! Sukhthi Chanjo", "descGu": "કવિ કલાપી રચિત પક્ષીઓ પ્રત્યેની સંવેદના દર્શાવતું ઊર્મિકાવ્ય", "startPage": 101, "endPage": 104},
    {"num": 15, "titleGu": "દાદાજીનો પત્ર", "titleEn": "Dadajino Patra", "descGu": "દાદાએ પૌત્રને લખેલો પત્ર જેમાં પ્રવાસ અને અભ્યાસનું મહત્ત્વ સમજાવ્યું છે", "startPage": 105, "endPage": 111},
    {"num": 16, "titleGu": "આખરે ચૂલો ચેત્યો!", "titleEn": "Aakhare Chulo Chetyo!", "descGu": "જયભિખ્ખુ લિખિત માનવતા અને સેવાનો મહિમા રજૂ કરતી પ્રસંગકથા", "startPage": 112, "endPage": 120},
    {"num": 17, "titleGu": "સફળ યાત્રા", "titleEn": "Safal Yatra", "descGu": "પૂજાલાલ દલવાડી રચિત જીવદયા અને કરુણાનો સંદેશ આપતું પ્રસંગકાવ્ય", "startPage": 121, "endPage": 124},
    {"num": 18, "titleGu": "અંતિમ પ્રયાસ", "titleEn": "Antim Prayas", "descGu": "મહાભારતના પ્રસંગ દ્વારા શ્રીકૃષ્ણનો યુદ્ધ અટકાવવાનો વિષ્ટિ પ્રયાસ", "startPage": 126, "endPage": 133},
    {"num": 19, "titleGu": "ઘડવૈયા", "titleEn": "Ghadvaiya", "descGu": "બાલમુકુંદ દવે રચિત માતૃભૂમિનું ઋણ ચૂકવવા પ્રેરતું દેશભક્તિ ગીત", "startPage": 134, "endPage": 137},
    {"num": 20, "titleGu": "જાદુઈ થેલો", "titleEn": "Jadui Thelo", "descGu": "બાળકોને અપાતા રાષ્ટ્રીય બાલ પુરસ્કાર વિશેની પ્રેરક માહિતી", "startPage": 138, "endPage": 142},
    {"num": 21, "titleGu": "મોતીમાળા", "titleEn": "Motimala", "descGu": "દુહા, મુક્તક, હાઈકુ અને છપ્પાનો સંગ્રહ જે જીવનના મૂલ્યો સમજાવે છે", "startPage": 143, "endPage": 147}
]

# Computed PDF Front Matter offset
pdf_offset = 11

payload = {
    "subjects": [
        {
            "id": subject_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standardId": str(standard_number),
            "standard_id": str(standard_number),
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": str(standard_number),
            "session": session,
            "name": "Standard 7 Gujarati",
            "nameGu": "ગુજરાતી (પ્રથમ ભાષા) ધોરણ 7",
            "name_en": "Standard 7 Gujarati",
            "name_gu": "ગુજરાતી (પ્રથમ ભાષા) ધોરણ 7",
            "order": 1,
            "total_chapters": len(raw_chapters_info),
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
            "title_gu": "ગુજરાતી (પ્રથમ ભાષા) ધોરણ 7",
            "titleGu": "ગુજરાતી (પ્રથમ ભાષા) ધોરણ 7",
            "title_en": "Standard 7 Gujarati Textbook",
            "titleEn": "Standard 7 Gujarati Textbook",
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": str(standard_number),
            "standardId": str(standard_number),
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
            "standardId": str(standard_number),
            "standard_id": str(standard_number),
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

# Quiz & Question definitions per chapter
chapter_quiz_data = {
    1: {"q": "'સર્વધર્મ પ્રાર્થના'માં કોને 'ક્ષમાસિંધુ' કહેવામાં આવ્યા છે?", "opts": ["શ્રી બુદ્ધને", "શ્રી રામને", "ઈસુ ખ્રિસ્તને", "શ્રીકૃષ્ણને"], "ans": "C", "exp": "કાવ્યમાં ઉલ્લેખ છે: 'પ્રેમરૂપ પ્રભુ પુત્ર ઈસુ જે ક્ષમાસિંધુને વંદન હો'."},
    2: {"q": "ભીખાશેઠ ડોક્ટરના હાથમાં કેટલી રકમ મૂકી ગયા?", "opts": ["પચાસ રૂપિયા", "સો સો રૂપિયાની નોટો", "પાંચસો રૂપિયા", "એક હજાર રૂપિયા"], "ans": "B", "exp": "પાઠમાં ઉલ્લેખ છે કે તેમણે ડોક્ટરના હાથમાં સો સો રૂપિયાની નોટો મૂકી દીધી હતી."},
    3: {"q": "લેખકની ગાયનું નામ 'બોડી' કેમ પાડવામાં આવ્યું હતું?", "opts": ["તેનો રંગ સફેદ હતો એટલે", "તેણીને શિંગડાં નહોતાં એટલે", "તેણી ખૂબ નાની હતી એટલે", "તેણી ગરીબડી હતી એટલે"], "ans": "B", "exp": "ગાયને શિંગડાં નહોતાં એટલે ઘરમાં સૌએ એનું નામ 'બોડી' પાડેલું."},
    4: {"q": "'ચાલો, ચરણ ઉપાડો!' કાવ્યનો મુખ્ય સંદેશ શો છે?", "opts": ["ઘરમાં શાંતિથી બેસી રહેવું", "રાષ્ટ્રસેવા માટે કૂચ કરવી", "રમતગમતમાં ભાગ લેવો", "મુસાફરી કરવી"], "ans": "B", "exp": "આ કાવ્ય રાષ્ટ્રસેવા અને દેશદાઝ માટે કૂચ કરવાનું આહ્વાન કરે છે."},
    5: {"q": "નાગણ એક સાથે આશરે કેટલાં ઈંડાં આપે છે?", "opts": ["10-15", "20-25", "50-55", "100-120"], "ans": "C", "exp": "લેખ અનુસાર નાગણ 50-55 જેટલાં ઈંડાં એક સાથે આપે છે."},
    6: {"q": "દરિયાખેડુના છોકરાએ લેખકને શું પ્રશ્ન પૂછ્યો?", "opts": ["સાહેબ, તમે કેમ આવ્યા?", "સાહેબ, ભગવાને આ ધંધો સોંપ્યો છે, બીકના માર્યા છોડાય?", "તમે ક્યાં રહો છો?", "દરિયો કેવો છે?"], "ans": "B", "exp": "છોકરાએ નીડરતાથી કહ્યું કે ભગવાને સોંપેલો ધંધો બીકના માર્યા છોડી ન દેવાય."},
    7: {"q": "લોકગીત 'હરિ, ઘરે આવોને!' માં શાનું સુંદર વર્ણન છે?", "opts": ["મહેમાનના સ્વાગતની તૈયારીઓ", "તહેવારની માહિતી", "પ્રકૃતિની સુંદરતા", "ભક્તિ ભાવ"], "ans": "A", "exp": "આ લોકગીતમાં વાલમ/મહેમાનના સ્વાગત માટે શેરી વળાવવી, ઓરડા અને ભોજન તૈયાર કરવાનો ઉલ્લેખ છે."},
    8: {"q": "સાઈબર ક્રાઈમ હેલ્પલાઇન માટે કયો નંબર ડાયલ કરવો જોઈએ?", "opts": ["100", "108", "1930", "1100"], "ans": "C", "exp": "સાઈબર ક્રાઈમ બ્રાન્ચમાં ફરિયાદ કરવા માટે 1930 નંબર પર ફોન કરવો જોઈએ."},
    9: {"q": "મહર્ષિ ઐલે ગ્રીક સૈનિકોને ભોજનના થાળમાં શું પીરસાવ્યું?", "opts": ["મિષ્ટાન", "સુવર્ણ અને રજતના ટુકડા અને રત્નો", "રોટલી અને શાક", "ફળો"], "ans": "B", "exp": "જીવનનું સત્ય સમજાવવા તેમણે રત્નો અને સોના-ચાંદીના ટુકડા પીરસાવ્યા હતા."},
    10: {"q": "દિવાળીબેન ભીલને ભારત સરકાર દ્વારા કયો પુરસ્કાર મળ્યો હતો?", "opts": ["પદ્મવિભૂષણ", "પદ્મભૂષણ", "પદ્મશ્રી", "ભારત રત્ન"], "ans": "C", "exp": "દિવાળીબેન ભીલને ઈ.સ. 1990માં પદ્મશ્રી પુરસ્કાર એનાયત થયો હતો."},
    11: {"q": "મીરાંબાઈના પદમાં કોની મોરલી વાગવાનો ઉલ્લેખ છે?", "opts": ["શ્રીરામની", "શ્રીકૃષ્ણની", "ગણેશજીની", "શિવજીની"], "ans": "B", "exp": "મીરાંબાઈના પદમાં વૃંદાવનમાં શ્રીકૃષ્ણની મોરલી વાગવાનો ઉલ્લેખ છે."},
    12: {"q": "તવાંગયાત્રા દર વર્ષે કયા મહિનામાં નીકળે છે?", "opts": ["જાન્યુઆરી", "માર્ચ", "મે", "નવેમ્બર"], "ans": "D", "exp": "તવાંગયાત્રા દર વર્ષે નવેમ્બર માસમાં અસમના ગુવાહાટીથી નીકળે છે."},
    13: {"q": "સમરથલાલ શેઠે કયા શાકભાજીની સ્પર્ધામાં ઈનામ મેળવ્યું હતું?", "opts": ["બટાકા", "ગાજર", "સૂરણ", "ડુંગળી"], "ans": "B", "exp": "તેમણે સાડા ત્રણ હાથનું મોટું ગાજર વાવીને ઈનામ મેળવ્યું હતું."},
    14: {"q": "કવિ કલાપીએ પંખીઓને શું સંદેશ આપ્યો છે?", "opts": ["ઊડી જવાનો", "નિર્ભય થઈને સુખથી ચણવાનો", "માળો બનાવવાનો", "ચૂપ રહેવાનો"], "ans": "B", "exp": "કવિ પંખીઓને કહે છે કે મારાથી ડર્યા વગર અહીં સુખથી ચણો."},
    15: {"q": "દાદાજીના પત્રમાં કયા વિષયની પુસ્તકો મોકલવાની વાત છે?", "opts": ["ચિત્રકળા", "ગણિતના કોયડા અને ઉખાણાં", "ઇતિહાસ", "વિજ્ઞાન"], "ans": "B", "exp": "દાદાજીએ ગણિત વિષયમાં રુચિ વધારવા કોયડા અને ઉખાણાંની પુસ્તકો મોકલવાની વાત કરી છે."},
    16: {"q": "હજરત ઉમર સાહેબ કપડાંના બુતાનની જગ્યાએ શું વાપરતા?", "opts": ["પિત્તળની પટ્ટીઓ", "બાવળની શૂળો", "લોખંડના હૂક", "દોરી"], "ans": "B", "exp": "તેમની અતિશય સાદગીના કારણે તેઓ બાવળની શૂળો વાપરતા."},
    17: {"q": "યાત્રાળુએ રસ્તામાં તરસથી પીડાતા કયા પ્રાણીને ગંગાજળ પાયું?", "opts": ["ગાયને", "ગધેડાને", "કુતરાને", "ઘોડાને"], "ans": "B", "exp": "તેમણે દયા દાખવીને તરસથી પીડાતા ગધેડાને ગંગાજળ પીવડાવી જીવ બચાવ્યો."},
    18: {"q": "શ્રીકૃષ્ણ કૌરવોની સભામાં શા માટે ગયા હતા?", "opts": ["યુદ્ધની જાહેરાત કરવા", "શાંતિથી યુદ્ધ અટકાવવા (વિષ્ટિ કરવા)", "સંપત્તિ માગવા", "મિત્રોને મળવા"], "ans": "B", "exp": "શ્રીકૃષ્ણ મહાવિનાશક યુદ્ધ અટકાવવા અંતિમ પ્રયાસ રૂપે વિષ્ટિ કરવા ગયા હતા."},
    19: {"q": "'ઘડવૈયા' કાવ્ય કયા પ્રકારનું ગીત છે?", "opts": ["લોકગીત", "દેશભક્તિ ગીત", "પ્રાકૃતિક ગીત", "બાળગીત"], "ans": "B", "exp": "'ઘડવૈયા' માતૃભૂમિનું ઋણ ચૂકવવા પ્રેરતું દેશભક્તિ ગીત છે."},
    20: {"q": "પ્રધાનમંત્રી રાષ્ટ્રીય બાલ પુરસ્કાર કેટલા વયજૂથના બાળકોને આપવામાં આવે છે?", "opts": ["3 થી 15 વર્ષ", "5 થી 18 વર્ષ", "8 થી 20 વર્ષ", "10 થી 18 વર્ષ"], "ans": "B", "exp": "આ પુરસ્કાર 5 થી 18 વર્ષની વયજૂથનાં બાળકોને આપવામાં આવે છે."},
    21: {"q": "'મોતીમાળા' એકમમાં કયા સાહિત્યિક પ્રકારો સમાવિષ્ટ છે?", "opts": ["નવલકથા", "દુહા, મુક્તક, હાઈકુ અને છપ્પા", "નાટક", "ચરિત્ર"], "ans": "B", "exp": "તેમાં વિવિધ લઘુ રચનાઓ દુહા, મુક્તક, હાઈકુ અને છપ્પા સંગ્રહિત છે."}
}

for item in raw_chapters_info:
    c_num = item["num"]
    ch_id = f"{subject_id}_ch{c_num}"
    book_start = max(1, item["startPage"] - pdf_offset)
    initial_p = max(0, item["startPage"] - 1)
    
    # Chapter Document with comprehensive camelCase & snake_case aliases
    ch_doc = {
        "id": ch_id,
        "chapter_id": ch_id,
        "chapterId": ch_id,
        "textbook_id": f"tb_{subject_id}",
        "textbookId": f"tb_{subject_id}",
        "subjectId": subject_id,
        "subject_id": subject_id,
        "standardId": str(standard_number),
        "standard_id": str(standard_number),
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

    # Add default Topic and SubTopic
    tp_id = f"{ch_id}_tp1"
    payload["topics"].append({
        "topic_id": tp_id,
        "topicId": tp_id,
        "topic_number": 1,
        "chapter_id": ch_id,
        "chapterId": ch_id,
        "subject_id": subject_id,
        "subjectId": subject_id,
        "standard_id": str(standard_number),
        "standardId": str(standard_number),
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

    # Add Quiz & MCQ Questions (Fix toUpperCase() by ensuring string types for all string properties)
    qz_info = chapter_quiz_data.get(c_num, {
        "q": f"પાઠ {c_num} '{item['titleGu']}' નો મુખ્ય હેતુ શો છે?",
        "opts": ["મુખ્ય વિચાર અને સદગુણોની સમજ", "વિકલ્પ B", "વિકલ્પ C", "વિકલ્પ D"],
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
        "standardId": str(standard_number),
        "standard_id": str(standard_number),
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
        "standardId": str(standard_number),
        "standard_id": str(standard_number),
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
        "type": "mcq",
        "quizType": "mcq",
        "quiz_type": "mcq",
        "category": "chapter_mcq",
        "difficulty": "medium",
        "difficultyLevel": "medium",
        "difficulty_level": "medium",
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

    # Add 3 Flashcards per chapter (Ensures EVERY chapter from 1 to 21 has flashcards)
    flashcard_templates = [
        {
            "front": f"મુખ્ય સંકલ્પના: {item['titleGu']}",
            "back": item["descGu"],
            "type": "concept"
        },
        {
            "front": f"પાઠ {c_num} શબ્દાર્થ / પરિચય",
            "back": f"પ્રકરણ {c_num} ({item['titleGu']}) નું મૂલ્યાંકન અને મહત્વના મુદ્દા.",
            "type": "keyword"
        },
        {
            "front": f"મુખ્ય પ્રશ્ન ({item['titleGu']})",
            "back": qz_info["q"] + "\nજવાબ: " + qz_info["exp"],
            "type": "question"
        }
    ]

    for fc_idx, fc in enumerate(flashcard_templates, 1):
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
            "standard_id": str(standard_number),
            "standardId": str(standard_number),
            "standard_number": standard_number,
            "standardNumber": standard_number,
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
            "cardType": fc["type"],
            "card_type": fc["type"],
            "type": fc["type"],
            "order": fc_idx,
            "difficulty_level": "easy",
            "isActive": True,
            "is_active": True,
            "is_premium": False,
            "is_ai_generated": True,
            "isDeleted": False,
            "is_deleted": False
        })

    # Add AI Knowledge Base record for Gyan AI RAG chatbot indexing
    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_{tp_id}",
        "standard_id": str(standard_number),
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

output_file = PROJECT_ROOT / "outputs" / "std7_gujarati_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated enriched payload: {output_file}")
print(f"   Chapters:     {len(payload['chapters'])}")
print(f"   Quizzes:      {len(payload['quizzes'])}")
print(f"   Questions:    {len(payload['questions'])}")
print(f"   Flashcards:   {len(payload['flashcards'])}")
print(f"   AI KB Docs:   {len(payload['ai_knowledge_base'])}")
