#!/usr/bin/env python3
"""
Builds complete, unified std7_science_payload.json for GCERT Standard 7 Science (વિજ્ઞાન ધોરણ 7).
Contains 13 Chapters, exact physical PDF page mappings (Ch1 start page 18, offset 17), Quizzes, Questions, Flashcards, and AI Knowledge Base.
Ensures zero duplicate IDs and full React Native Student App compatibility.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd%207%20Science_Gujarati%20Medium.pdf?alt=media"
subject_id = "sub_science_std7"
standard_id = "std_7"
standard_number = 7
session = "1"

# 13 Chapters provided by the user
raw_chapters_info = [
    {"num": 1, "id": "sub_science_std7_ch1", "titleGu": "વનસ્પતિમાં પોષણ", "titleEn": "Nutrition in Plants", "descGu": "વનસ્પતિમાં પોષણના પ્રકારો અને પ્રકાશસંશ્લેષણની પ્રક્રિયાની સમજૂતી", "startPage": 18, "endPage": 27},
    {"num": 2, "id": "sub_science_std7_ch2", "titleGu": "પ્રાણીઓમાં પોષણ", "titleEn": "Nutrition in Animals", "descGu": "મનુષ્યમાં પાચનતંત્ર, ખોરાક ગ્રહણ કરવાની પદ્ધતિઓ અને જટિલ ઘટકોનું પાચન", "startPage": 28, "endPage": 40},
    {"num": 3, "id": "sub_science_std7_ch3", "titleGu": "ઉષ્મા", "titleEn": "Heat", "descGu": "તાપમાનનું માપન, થરમૉમીટરના પ્રકારો અને ઉષ્માના પ્રસરણની રીતો", "startPage": 41, "endPage": 54},
    {"num": 4, "id": "sub_science_std7_ch4", "titleGu": "એસિડ, બેઈઝ અને ક્ષાર", "titleEn": "Acids, Bases and Salts", "descGu": "એસિડ અને બેઈઝના ગુણધર્મો, કુદરતી સૂચકો અને તટસ્થીકરણની પ્રક્રિયા", "startPage": 55, "endPage": 63},
    {"num": 5, "id": "sub_science_std7_ch5", "titleGu": "ભૌતિક અને રાસાયણિક ફેરફારો", "titleEn": "Physical and Chemical Changes", "descGu": "આપણી આસપાસ થતા ભૌતિક ફેરફારો અને રાસાયણિક પ્રક્રિયાઓનું નિરૂપણ", "startPage": 64, "endPage": 73},
    {"num": 6, "id": "sub_science_std7_ch6", "titleGu": "સજીવોમાં શ્વસન", "titleEn": "Respiration in Organisms", "descGu": "કોષીય શ્વસન, જારક અને અજારક શ્વસન તથા શ્વાસોચ્છ્વાસની ક્રિયાવિધિ", "startPage": 74, "endPage": 86},
    {"num": 7, "id": "sub_science_std7_ch7", "titleGu": "પ્રાણીઓ અને વનસ્પતિઓમાં વહન", "titleEn": "Transportation in Animals and Plants", "descGu": "રુધિરાભિસરણતંત્ર, ઉત્સર્જનતંત્ર અને વનસ્પતિમાં ઘટકોનું વહન", "startPage": 87, "endPage": 98},
    {"num": 8, "id": "sub_science_std7_ch8", "titleGu": "વનસ્પતિમાં પ્રજનન", "titleEn": "Reproduction in Plants", "descGu": "અલિંગી અને લિંગી પ્રજનનના પ્રકારો તેમજ બીજ વિકિરણની પદ્ધતિઓ", "startPage": 99, "endPage": 108},
    {"num": 9, "id": "sub_science_std7_ch9", "titleGu": "ગતિ અને સમય", "titleEn": "Motion and Time", "descGu": "ઝડપનું માપન, સમયના એકમો અને અંતર-સમયના આલેખની સમજૂતી", "startPage": 109, "endPage": 125},
    {"num": 10, "id": "sub_science_std7_ch10", "titleGu": "વિદ્યુતપ્રવાહ અને તેની અસરો", "titleEn": "Electric Current and its Effects", "descGu": "વિદ્યુત સંજ્ઞાઓ, વિદ્યુતપ્રવાહની ઉષ્મીય અને ચુંબકીય અસરો", "startPage": 126, "endPage": 139},
    {"num": 11, "id": "sub_science_std7_ch11", "titleGu": "પ્રકાશ", "titleEn": "Light", "descGu": "પ્રકાશનું પરાવર્તન, અરીસા અને લેન્સ વડે રચાતા પ્રતિબિંબોની સમજ", "startPage": 140, "endPage": 158},
    {"num": 12, "id": "sub_science_std7_ch12", "titleGu": "જંગલો : આપણી જીવાદોરી", "titleEn": "Forests: Our Lifeline", "descGu": "જંગલનું પર્યાવરણીય મહત્ત્વ અને જંગલમાં જોવા મળતી આહાર શૃંખલા", "startPage": 159, "endPage": 172},
    {"num": 13, "id": "sub_science_std7_ch13", "titleGu": "દૂષિત પાણીની વાર્તા", "titleEn": "Wastewater Story", "descGu": "પાણીનું શુદ્ધિકરણ, સુએઝ ટ્રીટમેન્ટ અને સ્વચ્છતાનું મહત્ત્વ", "startPage": 173, "endPage": 185}
]

# Physical PDF page offset (Chapter 1 physical start page is 18, book page is 1)
pdf_offset = 17

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
            "name": "Science",
            "nameGu": "વિજ્ઞાન ધોરણ 7",
            "name_en": "Standard 7 Science",
            "name_gu": "વિજ્ઞાન ધોરણ 7",
            "title": "વિજ્ઞાન ધોરણ 7",
            "titleGu": "વિજ્ઞાન ધોરણ 7",
            "title_gu": "વિજ્ઞાન ધોરણ 7",
            "icon": "🔬",
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
            "title_gu": "વિજ્ઞાન ધોરણ 7 પાઠ્યપુસ્તક",
            "titleGu": "વિજ્ઞાન ધોરણ 7 પાઠ્યપુસ્તક",
            "title_en": "Standard 7 Science Textbook",
            "titleEn": "Standard 7 Science Textbook",
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
    1: {"q": "જે પોષણ પ્રક્રિયામાં સજીવો પોતાનો ખોરાક જાતે બનાવે છે તેને શું કહેવાય?", "opts": ["પરાવલંબી", "સ્વાવલંબી", "મૃતોપજીવી", "કીટાહારી"], "ans": "B", "exp": "જે સજીવો સરળ પદાર્થોમાંથી પોતાનો ખોરાક જાતે બનાવે છે તેને સ્વાવલંબી (autotrophic) પોષણ કહે છે."},
    2: {"q": "મનુષ્યમાં ખોરાકના જટિલ ઘટકોનું સરળ ઘટકોમાં રૂપાંતરણ થવાની ક્રિયાને શું કહે છે?", "opts": ["પાચન", "શ્વસન", "ઉત્સર્જન", "રુધિરાભિસરણ"], "ans": "A", "exp": "જટિલ ખોરાકનું સરળ અને દ્રાવ્ય ઘટકોમાં વિઘટન થવાની ક્રિયા પાચન કહેવાય છે."},
    3: {"q": "ક્લિનીકલ થરમૉમીટર કેટલા તાપમાન સુધીનું માપન કરી શકે છે?", "opts": ["0 °C થી 100 °C", "35 °C થી 42 °C", "-10 °C થી 110 °C", "30 °C થી 50 °C"], "ans": "B", "exp": "ક્લિનીકલ થરમૉમીટર માનવ શરીરનું તાપમાન માપવા માટે વપરાય છે, તેની રેન્જ 35 °C થી 42 °C હોય છે."},
    4: {"q": "એસિડ અને બેઈઝ વચ્ચે થતી રાસાયણિક પ્રક્રિયાને શું કહેવાય?", "opts": ["ઓક્સિડેશન", "તટસ્થીકરણ", "બાષ્પીભવન", "ઘનીભવન"], "ans": "B", "exp": "એસિડ અને બેઈઝ વચ્ચે પ્રક્રિયા થઈ ક્ષાર અને પાણી બને તેને તટસ્થીકરણ કહે છે."},
    5: {"q": "લોખંડનું કટાાવવું એ કયા પ્રકારનો ફેરફાર છે?", "opts": ["ભૌતિક ફેરફાર", "રાસાયણિક ફેરફાર", "ઊલટાવી શકાય તેવો ફેરફાર", "કુદરતી ભૌતિક ફેરફાર"], "ans": "B", "exp": "લોખંડ કટાવાથી નવો પદાર્થ (આયર્ન ઓક્સાઈડ) બને છે, જે રાસાયણિક ફેરફાર છે."},
    6: {"q": "કોષમાં ઓક્સિજનની હાજરીમાં ગ્લુકોઝનું વિઘટન થઈ શક્તિ મુક્ત થવાની ક્રિયાને શું કહેવાય?", "opts": ["જારક શ્વસન", "અજારક શ્વસન", "પ્રકાશસંશ્લેષણ", "ઉત્સર્જન"], "ans": "A", "exp": "ઓક્સિજનની મદદથી થતા કોષીય શ્વસનને જારક શ્વસન કહેવાય છે."},
    7: {"q": "મનુષ્યમાં નાડી દર (pulse rate) પ્રતિ મિનિટ આશરે કેટલો હોય છે?", "opts": ["50 થી 60", "72 થી 80", "90 થી 100", "100 થી 120"], "ans": "B", "exp": "આરામદાયી સ્થિતિમાં તંદુરસ્ત પુખ્ત વ્યક્તિમાં નાડી દર 72 થી 80 જેટલો હોય છે."},
    8: {"q": "ઈસ્ટમાં કયા પ્રકારનું અલિંગી પ્રજનન જોવા મળે છે?", "opts": ["કલિકાસર્જન", "ખંડન", "બીજાણુસર્જન", "વાનસ્પતિક પ્રજનન"], "ans": "A", "exp": "ઈસ્ટ એકકોષીય સજીવ છે જેમાં કલિકાસર્જન (Budding) દ્વારા પ્રજનન થાય છે."},
    9: {"q": "ઝડપનો મૂળભૂત એકમ કયો છે?", "opts": ["km/h", "m/min", "m/s", "km/s"], "ans": "C", "exp": "અંતરનો એકમ મીટર અને સમયનો એકમ સેકન્ડ હોવાથી ઝડપનો SI એકમ મીટર/સેકન્ડ (m/s) છે."},
    10: {"q": "વિદ્યુતપ્રવાહની ઉષ્મીય અસર પર આધારિત ઉપકરણ કયું છે?", "opts": ["ઇલેક્ટ્રિક ઇસ્ત્રી", "ઇલેક્ટ્રિક ઘંટડી", "ચુંબકીય સોય", "ડાયનેમો"], "ans": "A", "exp": "ઇલેક્ટ્રિક ઇસ્ત્રી, ગીઝર અને હીટરમાં વિદ્યુત ઊર્જાનું ઉષ્મા ઊર્જામાં રૂપાંતર થાય છે."},
    11: {"q": "કયો અરીસો વસ્તુનું હંમેશાં આભાસી અને નાના પરિમાણનું પ્રતિબિંબ રચે છે?", "opts": ["અંતર્ગોળ અરીસો", "બહિર્ગોળ અરીસો", "સમતલ અરીસો", "ગોળાકાર અરીસો"], "ans": "B", "exp": "બહિર્ગોળ અરીસા વડે રચાતું પ્રતિબિંબ ચત્તું, આભાસી અને વસ્તુના પરિમાણ કરતા નાનું હોય છે."},
    12: {"q": "જંગલોમાં મૃત વનસ્પતિ અને પ્રાણીઓનું વિઘટન કરી સેન્દ્રિય પદાર્થો બનાવતા સૂક્ષ્મજીવોને શું કહે છે?", "opts": ["ઉત્પાદકો", "ઉપભોગીઓ", "વિઘટકો", "પરપોષીઓ"], "ans": "C", "exp": "મૃત અવશેષોનું સેન્દ્રિય પદાર્થોમાં વિઘટન કરતા જીવોને વિઘટકો (Decomposers) કહે છે."},
    13: {"q": "દૂષિત પાણીને શુદ્ધ કરવાની પ્રક્રિયાને સામાન્ય રીતે શું કહેવાય?", "opts": ["સુએઝ ટ્રીટમેન્ટ", "બાષ્પીભવન", "ગાળણ ક્રિયા", "ક્લોરીનેશન"], "ans": "A", "exp": "ઘરો અને કારખાનાના ગંદા પાણીને શુદ્ધ કરી પુનઃઉપયોગી બનાવવાની પ્રક્રિયાને સુએઝ ટ્રીટમેન્ટ કહે છે."}
}

# Flashcards for each chapter
chapter_flashcard_data = {
    1: [("શબ્દાર્થ: પોષકતત્ત્વો (Nutrients)", "કાર્બોદિત, પ્રોટીન, ચરબી, વિટામિન અને ખનીજતત્ત્વો જે આપણા શરીર માટે જરૂરી છે."), ("ખ્યાલ: પ્રકાશસંશ્લેષણ", "સૂર્યપ્રકાશ અને હરિતદ્રવ્યની હાજરીમાં વનસ્પતિ દ્વારા ખોરાક બનાવવાની ક્રિયા.")],
    2: [("શબ્દાર્થ: નાના આંતરડાની લંબાઈ", "મનુષ્યમાં નાનું આંતરડું આશરે 7.5 મીટર લાંબુ અને અત્યંત ગૂંચળાદાર હોય છે."), ("ખ્યાલ: જઠર", "યુ (U) આકારની જાડી દીવાલ વાળી સ્નાયુમય કોથળી જે ખોરાકનું અંશતઃ પાચન કરે છે.")],
    3: [("શબ્દાર્થ: તાપમાન", "પદાર્થની ગરમી કે ઠંડકની માત્રા દર્શાવતા માપને તાપમાન કહે છે."), ("ખ્યાલ: ઉષ્માવહન", "ઘન પદાર્થોમાં ઉષ્માનું ગરમ છેડાથી ઠંડા છેડા તરફ પ્રસરણ થવાની રીત.")],
    4: [("ખ્યાલ: તટસ્થીકરણ", "એસિડ અને બેઈઝ વચ્ચે થતી પ્રક્રિયા જેમાં ક્ષાર અને પાણી ઉત્પન્ન થાય છે."), ("શબ્દાર્થ: લિટમસ પત્ર", "લાઇકેનમાંથી મેળવાતું કુદરતી સૂચક જે એસિડમાં લાલ અને બેઈઝમાં ભૂરૂં બને છે.")],
    5: [("શબ્દાર્થ: ભૌતિક ફેરફાર", "પદાર્થના માત્ર આકાર, માપ કે ભૌતિક સ્થિતિમાં થતો ફેરફાર જેમાં નવો પદાર્થ બનતો નથી."), ("ખ્યાલ: ગૅલ્વેનાઇઝેશન", "લોખંડને કાટ લાગતો અટકાવવા તેના પર જસત (ઝિંક)નું સ્તર ચડાવવાની ક્રિયા.")],
    6: [("શબ્દાર્થ: કોષીય શ્વસન", "કોષમાં ખોરાકના કણને તોડીને શક્તિ મુક્ત કરવાની પ્રક્રિયા."), ("ખ્યાલ: ઉરોદરપટલ", "ઉરસગુહાના તળિયે આવેલો મોટી સ્નાયુમય પડદો જે શ્વાસોચ્છ્વાસમાં મદદ કરે છે.")],
    7: [("શબ્દાર્થ: રુધિરરસ (Plasma)", "રુધિરનો પ્રવાહી ભાગ જેમાં રક્તકણો, શ્વેતકણો અને ત્રાકકણો તરતા હોય છે."), ("ખ્યાલ: ઉત્સર્જન", "કોષોમાં ઉત્પન્ન થતા નકામા અને વિષારી પદાર્થોને શરીરમાંથી બહાર નિકાલ કરવાની ક્રિયા.")],
    8: [("શબ્દાર્થ: પરાગનયન", "પુષ્પના પરાગાશયમાંથી પરાગરજનું પરાગાસન પર સ્થાનાંતર થવાની ક્રિયા."), ("ખ્યાલ: ફલન", "નરજન્યુ અને માદાજન્યુના સંયોજનથી યુગ્મનજ (Zygote) બનવાની ક્રિયા.")],
    9: [("ખ્યાલ: ઝડપ (Speed)", "પદાર્થે એકમ સમયગાળામાં કાપેલું કુલ અંતર."), ("શબ્દાર્થ: સાદું લોલક", "દ્રઢ સ્ટેન્ડ પરથી દોરી વડે લટકાવેલ ધાતુના નાના ગોળાની ગતિનું ઉદાહરણ.")],
    10: [("ઉપકરણ: વિદ્યુત ચુંબક", "લોખંડના ટુકડા પર અલગ કરેલા તારનું ગૂંચળું જેમાં વિદ્યુતપ્રવાહ વહેતા તે ચુંબકની જેમ વર્તે છે."), ("શબ્દાર્થ: ફ્યુઝ", "વિદ્યુત પરિપથમાં અનિચ્છનીય ભારે વિદ્યુતપ્રવાહ સામે રક્ષણ આપતી સુરક્ષા રચના.")],
    11: [("શબ્દાર્થ: પ્રકાશનું પરાવર્તન", "પ્રકાશની લીસી કે ચળકતી સપાટી પરથી અથડાઈને પાછા ફરવાની ઘટના."), ("ખ્યાલ: સમતલ અરીસો", "વસ્તુના જેવડા જ પરિમાણનું અને આભાસી પ્રતિબિંબ રચતો સમતલ અરીસો.")],
    12: [("શબ્દાર્થ: વિઘટકો (Decomposers)", "સૂક્ષ્મજીવો જે મૃત વનસ્પતિ અને પ્રાણીઓને સેન્દ્રિય પદાર્થોમાં ફેરવે છે."), ("ખ્યાલ: આહાર શૃંખલા", "એક સજીવ બીજા સજીવને ખોરાક તરીકે ઉપયોગ કરે તેવી શૃંખલા.")],
    13: [("શબ્દાર્થ: સુએઝ (Sewage)", "ઘરો, ઉદ્યોગો અને હોસ્પિટલોમાંથી વહી જતું પ્રવાહી કચરાયુક્ત દૂષિત પાણી."), ("ખ્યાલ: સીવેજ ટ્રીટમેન્ટ પ્લાન્ટ", "દૂષિત પાણીને ભૌતિક, રાસાયણિક અને જૈવિક ક્રિયાઓ વડે શુદ્ધ કરવાનો પ્લાન્ટ.")]
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
    quiz_id = f"quiz_science_std7_ch{c_num}"
    qz_q_id = f"qz_q_science_std7_ch{c_num}_1"
    
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
        fc_id = f"fc_science_{c_num}_{fc_idx}"
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

output_file = PROJECT_ROOT / "outputs" / "std7_science_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Science Std 7 payload: {output_file}")
print(f"   Subjects:     {len(payload['subjects'])}")
print(f"   Textbooks:    {len(payload['textbooks'])}")
print(f"   Chapters:     {len(payload['chapters'])}")
print(f"   Quizzes:      {len(payload['quizzes'])}")
print(f"   Questions:    {len(payload['questions'])}")
print(f"   Flashcards:   {len(payload['flashcards'])}")
print(f"   AI KB Docs:   {len(payload['ai_knowledge_base'])}")
