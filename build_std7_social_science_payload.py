#!/usr/bin/env python3
"""
Builds complete, unified std7_social_science_payload.json for GCERT Standard 7 Social Science (સામાજિક વિજ્ઞાન ધોરણ 7).
Contains 19 Chapters, exact physical PDF page mappings (Ch1 start page 6, offset 5), Quizzes, Questions, Flashcards, and AI Knowledge Base.
Ensures full React Native Student App compatibility.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-7%20Social_Science%20GujaratiMedium.pdf?alt=media"
subject_id = "sub_social_science_std7"
subject_id_alt = "sub_ss_std7"
standard_id = "std_7"
standard_number = 7
session = "1"

# 19 Chapters provided by the user
raw_chapters_info = [
    {"num": 1, "id": "sub_ss_std7_ch1", "titleGu": "રાજપૂતયુગ ઃ નવાં શાસકો અને રાજ્યો", "titleEn": "Rajput Era: New Rulers and States", "descGu": "રાજપૂત રાજવીઓએ ઈ.સ. 700 થી ઈ.સ. 1200 વચ્ચેના 500 વર્ષના સમયગાળા દરમિયાન ઉત્તર અને દક્ષિણ ભારત પર વર્ચસ્વ જમાવ્યું.", "startPage": 6, "endPage": 12},
    {"num": 2, "id": "sub_ss_std7_ch2", "titleGu": "દિલ્લી સલ્તનત", "titleEn": "Delhi Sultanate", "descGu": "13મી સદીની શરૂઆતમાં દિલ્લી સલ્તનતની સ્થાપના થઈ, જેમાં તુર્ક અને અફઘાન મૂળના શાસકોએ શાસન કર્યું.", "startPage": 13, "endPage": 17},
    {"num": 3, "id": "sub_ss_std7_ch3", "titleGu": "મુઘલ સામ્રાજ્ય", "titleEn": "Mughal Empire", "descGu": "ભારતમાં મુઘલ સામ્રાજ્યની સ્થાપના ઈ.સ. 1526 માં બાબરે કરી હતી.", "startPage": 18, "endPage": 23},
    {"num": 4, "id": "sub_ss_std7_ch4", "titleGu": "મધ્યયુગીન સ્થાપત્યો, શહેરો, વેપારી અને કારીગરો", "titleEn": "Medieval Architecture, Cities, Merchants and Artisans", "descGu": "ભારતીય શિલ્પસ્થાપત્ય-કલાઓને અનોખો અને લાંબો ઐતિહાસિક વારસો છે.", "startPage": 24, "endPage": 31},
    {"num": 5, "id": "sub_ss_std7_ch5", "titleGu": "આદિવાસી (અનુસૂચિત જનજાતિઓ)", "titleEn": "Tribals (Scheduled Tribes)", "descGu": "ભારતની આગવી ઓળખ અને સંસ્કૃતિની જાળવણીમાં આદિવાસી સમૂહોએ મહત્ત્વપૂર્ણ ભૂમિકા ભજવી છે.", "startPage": 32, "endPage": 36},
    {"num": 6, "id": "sub_ss_std7_ch6", "titleGu": "વિચરતી અને વિમુક્ત જાતિઓ", "titleEn": "Nomadic and Denotified Tribes", "descGu": "વ્યવસાય તેમજ વિવિધ હેતુઓ માટે એક સ્થળેથી બીજે સ્થળે ભ્રમણ કરતી જાતિઓની જીવનશૈલીની સમજ.", "startPage": 37, "endPage": 40},
    {"num": 7, "id": "sub_ss_std7_ch7", "titleGu": "ભક્તિયુગ : ધાર્મિક સમુદાયો અને વિચારકો", "titleEn": "Bhakti Era: Religious Communities and Thinkers", "descGu": "મધ્યકાલીન ભારતમાં ભક્તિ અને સૂફી ચળવળ દ્વારા સામાજિક અને ધાર્મિક સુધારણાના પ્રયાસો.", "startPage": 41, "endPage": 45},
    {"num": 8, "id": "sub_ss_std7_ch8", "titleGu": "પ્રાદેશિક સંસ્કૃતિનું ઘડતર", "titleEn": "Formation of Regional Culture", "descGu": "વિભિન્ન સમુદાયોની ભાષા, રીતરિવાજ, ખાનપાન અને કલા દ્વારા પ્રાદેશિક ઓળખનું નિર્માણ.", "startPage": 46, "endPage": 54},
    {"num": 9, "id": "sub_ss_std7_ch9", "titleGu": "અઢારમી સદીના રાજકીય શાસકો", "titleEn": "Political Rulers of the 18th Century", "descGu": "ઔરંગઝેબના અવસાન પછી ભારતમાં ઉદ્ભવેલા વિવિધ પ્રાદેશિક રાજ્યો અને શાસકોની માહિતી.", "startPage": 55, "endPage": 57},
    {"num": 10, "id": "sub_ss_std7_ch10", "titleGu": "પૃથ્વીની આંતરિક રચના અને ભૂમિસ્વરૂપો", "titleEn": "Internal Structure of the Earth and Landforms", "descGu": "પૃથ્વીના આંતરિક ભાગોની રચના, ખડકોના પ્રકાર અને પૃથ્વી સપાટી પર પરિવર્તન લાવતા બળોની સમજ.", "startPage": 58, "endPage": 63},
    {"num": 11, "id": "sub_ss_std7_ch11", "titleGu": "પર્યાવરણનાં ઘટકો અને આંતરસંબંધો", "titleEn": "Components of Environment and Interrelationships", "descGu": "પૃથ્વી પરના મૃદાવરણ, જલાવરણ, વાતાવરણ અને જીવાવરણ વચ્ચેના સંબંધો અને પ્રદૂષણની અસરો.", "startPage": 64, "endPage": 70},
    {"num": 12, "id": "sub_ss_std7_ch12", "titleGu": "વાતાવરણની સજીવો પર અસરો", "titleEn": "Effects of Atmosphere on Living Beings", "descGu": "વાતાવરણની સ્તરરચના, વાયુઓનું પ્રમાણ અને હવામાન-આબોહવાની માનવ જીવન પર અસરો.", "startPage": 71, "endPage": 77},
    {"num": 13, "id": "sub_ss_std7_ch13", "titleGu": "આપત્તિ-વ્યવસ્થાપન", "titleEn": "Disaster Management", "descGu": "કુદરતી અને માનવસર્જિત આપત્તિઓ વખતે રાખવાની સાવચેતી અને વ્યવસ્થાપન.", "startPage": 78, "endPage": 87},
    {"num": 14, "id": "sub_ss_std7_ch14", "titleGu": "સંસાધનોનું જતન અને સંરક્ષણ", "titleEn": "Preservation and Conservation of Resources", "descGu": "કુદરતી સંસાધનો જેવા કે ભૂમિ, જળ, વનસ્પતિ અને ખનીજોનું મહત્ત્વ અને જાળવણી.", "startPage": 88, "endPage": 97},
    {"num": 15, "id": "sub_ss_std7_ch15", "titleGu": "લોકશાહીમાં સમાનતા", "titleEn": "Equality in Democracy", "descGu": "ભારતના બંધારણમાં આપવામાં આવેલ સમાનતાના અધિકાર અને મતાધિકારની સમજ.", "startPage": 98, "endPage": 101},
    {"num": 16, "id": "sub_ss_std7_ch16", "titleGu": "રાજ્ય સરકાર", "titleEn": "State Government", "descGu": "રાજ્ય સરકારનાં અંગો, કાર્યો અને લોકશાહીમાં તેની ભૂમિકા.", "startPage": 102, "endPage": 112},
    {"num": 17, "id": "sub_ss_std7_ch17", "titleGu": "જાતિગત ભિન્નતા", "titleEn": "Gender Variation", "descGu": "છોકરા-છોકરીઓના ઉછેરમાં જોવા મળતા ભેદભાવો અને મહિલા સશક્તીકરણના પ્રયાસો.", "startPage": 113, "endPage": 118},
    {"num": 18, "id": "sub_ss_std7_ch18", "titleGu": "સંચાર-માધ્યમ અને જાહેરાત", "titleEn": "Media and Advertising", "descGu": "માહિતીની આપલે માટેના સંચાર માધ્યમો અને આધુનિક યુગમાં જાહેરાતનું મહત્ત્વ.", "startPage": 119, "endPage": 125},
    {"num": 19, "id": "sub_ss_std7_ch19", "titleGu": "બજાર", "titleEn": "Market", "descGu": "બજારના વિવિધ પ્રકારો, ઓનલાઈન શોપિંગ અને ગ્રાહક સુરક્ષા અંગેની સમજ.", "startPage": 126, "endPage": 135}
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
            "name": "Social Science",
            "nameGu": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "name_en": "Standard 7 Social Science",
            "name_gu": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "title": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "titleGu": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "title_gu": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "icon": "🌍",
            "order": 4,
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
            "name": "Social Science",
            "nameGu": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "name_en": "Standard 7 Social Science",
            "name_gu": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "title": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "titleGu": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "title_gu": "સામાજિક વિજ્ઞાન ધોરણ 7",
            "icon": "🌍",
            "order": 4,
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
            "title_gu": "સામાજિક વિજ્ઞાન ધોરણ 7 પાઠ્યપુસ્તક",
            "titleGu": "સામાજિક વિજ્ઞાન ધોરણ 7 પાઠ્યપુસ્તક",
            "title_en": "Standard 7 Social Science Textbook",
            "titleEn": "Standard 7 Social Science Textbook",
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

# Chapter Quizzes Data
chapter_quiz_data = {
    1: {"q": "ગઢવાલ રાજ્યનો સ્થાપક કોણ હતો?", "opts": ["ચંદ્રદેવ", "મદનચંદ્ર", "ગોવિંદચંદ્ર", "યશોવર્મન"], "ans": "A", "exp": "ગઢવાલ રાજ્યનો સ્થાપક ચંદ્રદેવ હતો, જેણે કનોજ સિવાય કાશીને પણ બીજી રાજધાની બનાવી હતી."},
    2: {"q": "દિલ્લી સલ્તનતના ગુલામ વંશનો સાચો સ્થાપક કોને માનવામાં આવે છે?", "opts": ["કુતબુદ્દીન ઐબક", "ઇલ્તુત્મિશ", "રઝિયા સુલતાના", "બલબન"], "ans": "B", "exp": "ઇલ્તુત્મિશને ગુલામ વંશનો સાચો સ્થાપક માનવામાં આવે છે કારણ કે તેણે સલ્તનતને સ્વતંત્ર અસ્તિત્વ આપ્યું."},
    3: {"q": "પાણીપતનું પ્રથમ યુદ્ધ કોની વચ્ચે થયું હતું?", "opts": ["બાબર અને ઇબ્રાહિમ લોદી", "અકબર અને હેમુ", "હુમાયુ અને શેરશાહ", "શાહજહાં અને રાણા સંગા"], "ans": "A", "exp": "ઈ.સ. 1526 માં પાનીપતના પ્રથમ યુદ્ધમાં બાબરે ઇબ્રાહિમ લોદીને હરાવી મુઘલ સામ્રાજ્યની સ્થાપના કરી."},
    4: {"q": "કોણાર્કનું સૂર્યમંદિર કયા રાજ્યમાં આવેલું છે?", "opts": ["ગુજરાત", "ઓડિશા", "રાજસ્થાન", "મધ્ય પ્રદેશ"], "ans": "B", "exp": "ઓડિશા રાજ્યના પૂરી જિલ્લામાં જગન્નાથ પૂરી નજીક કોણાર્કનું સૂર્યમંદિર આવેલું છે."},
    5: {"q": "અહોમ રાજ્ય વર્તમાન ભારતના કયા રાજ્યમાં આવેલું હતું?", "opts": ["અસમ", "નાગાલેન્ડ", "મેઘાલય", "મણિપુર"], "ans": "A", "exp": "અહોમ જનજાતિના લોકોએ 13મી સદીમાં અસમના બ્રહ્મપુત્ર નદીના ખીણ પ્રદેશમાં રાજ્ય સ્થાપ્યું હતું."},
    6: {"q": "વનજારા જાતિના સમૂહને સામાન્ય રીતે શું કહેવામાં આવતું?", "opts": ["ટંડા", "પાલ", "ગોંડ", "મુક્કા"], "ans": "A", "exp": "વનજારાઓનો સમૂહ 'ટંડા' કહેવાતો, જેઓ વેપારી માલસામાનની હેરફેર માટે પ્રસિદ્ધ હતા."},
    7: {"q": "દક્ષિણ ભારતમાં ભક્તિ આંદોલનની શરૂઆત કરનાર આચાર્ય કોણ હતા?", "opts": ["રામાનુજાચાર્ય", "જ્ઞાનેશ્વર", "ચૈત્યન્ય મહાપ્રભુ", "કબીર"], "ans": "A", "exp": "દક્ષિણ ભારતમાં ભક્તિ આંદોલનની શક્તિશાળી શરૂઆત રામાનુજાચાર્ય દ્વારા કરવામાં આવી હતી."},
    8: {"q": "જગન્નાથ સંપ્રદાય કયા રાજ્યની પ્રાદેશિક ઓળખ સાથે જોડાયેલો છે?", "opts": ["ઓડિશા", "બંગાળ", "ગુજરાત", "તમિલનાડુ"], "ans": "A", "exp": "પૂરીના જગન્નાથજી સાથે ઓડિશાની ધાર્મિક અને પ્રાદેશિક સંસ્કૃતિ ગાઢ રીતે જોડાયેલી છે."},
    9: {"q": "સિખ ધર્મના દસમા અને અંતિમ ગુરુ કોણ હતા?", "opts": ["ગુરુ નાનક", "ગુરુ અર્જુનદેવ", "ગુરુ ગોવિંદસિંહ", "ગુરુ તેગબહાદુર"], "ans": "C", "exp": "ગુરુ ગોવિંદસિંહજી સિખ ધર્મના દસમા ગુરુ હતા જેમણે ખાલસા પંથની સ્થાપના કરી હતી."},
    10: {"q": "પૃથ્વીના સૌથી આંતરિક સ્તરને શું કહે છે?", "opts": ["સિયાલ", "સિમા", "ભૂગર્ભ (નિફે)", "મેન્ટલ"], "ans": "C", "exp": "પૃથ્વીના સૌથી આંતરિક સ્તરને ભૂગર્ભ અથવા 'નિફે' (નિકલ અને ફેરસ) કહેવામાં આવે છે."},
    11: {"q": "પૃથ્વી સપાટીનું પાણીથી ઘેરાયેલું આવરણ કયા નામે ઓળખાય છે?", "opts": ["મૃદાવરણ", "જલાવરણ", "વાતાવરણ", "જીવાવરણ"], "ans": "B", "exp": "પૃથ્વી સપાટી પરના પાણીના વિશાળ ભાગને જલાવરણ કહે છે જે આશરે 71% ભાગ રોકે છે."},
    12: {"q": "વાતાવરણમાં સૌથી વધુ પ્રમાણમાં કયો વાયુ આવેલો છે?", "opts": ["ઓક્સિજન", "નાઇટ્રોજન", "કાર્બન ડાયોક્સાઇડ", "ઓઝોન"], "ans": "B", "exp": "વાતાવરણમાં નાઇટ્રોજન વાયુ આશરે 78% જેટલા સૌથી વધુ પ્રમાણમાં આવેલો છે."},
    13: {"q": "નીચેનામાંથી કઈ આપત્તિ કુદરતી આપત્તિ છે?", "opts": ["આગ", "ઔદ્યોગિક અકસ્માત", "ધરતીકંપ", "કોમી હુલ્લડ"], "ans": "C", "exp": "ધરતીકંપ (ભૂકંપ) એ કુદરતી આપત્તિ છે, જ્યારે બાકીની માનવસર્જિત આપત્તિઓ છે."},
    14: {"q": "કાળી જમીન બીજા કયા નામે ઓળખાય છે?", "opts": ["રાતી જમીન", "રેગુર જમીન", "પડખાઉ જમીન", "કાંપની જમીન"], "ans": "B", "exp": "કાળી જમીન તેની ભેજધારણ શક્તિ માટે જાણીતી છે અને તેને 'રેગુર' પણ કહેવાય છે."},
    15: {"q": "ભારતના બંધારણમાં કેટલા વર્ષની ઉંમરના નાગરિકને મતાધિકાર આપવામાં આવ્યો છે?", "opts": ["15 વર્ષ", "18 વર્ષ", "21 વર્ષ", "25 વર્ષ"], "ans": "B", "exp": "ભારતમાં 18 વર્ષ કે તેથી વધુ વયના દરેક નાગરિકને સમાન મતાધિકાર (Universal Adult Suffrage) પ્રાપ્ત છે."},
    16: {"q": "રાજ્યની કારોબારીના વડા કોણ હોય છે?", "opts": ["મુખ્યમંત્રી", "રાજ્યપાલ (ગવર્નર)", "વિધાનસભા અધ્યક્ષ", "ગૃહમંત્રી"], "ans": "B", "exp": "રાજ્યપાલ (Governor) એ રાજ્યના બંધારણીય અને કારોબારીના વડા હોય છે."},
    17: {"q": "ગુજરાતમાં મહિલાઓ માટે સ્થાનિક સ્વરાજ્યની સંસ્થાઓમાં કેટલા ટકા અનામત છે?", "opts": ["33%", "50%", "25%", "40%"], "ans": "B", "exp": "ગુજરાતમાં સ્થાનિક સ્વરાજ્યની ચૂંટણીઓમાં મહિલાઓ માટે 50% બેઠકો અનામત રાખવામાં આવી છે."},
    18: {"q": "માહિતીની આપલે માટેના સાધનોને શું કહેવાય?", "opts": ["સંચાર માધ્યમ", "પરિવહન માધ્યમ", "ઉદ્યોગ", "વેપાર"], "ans": "A", "exp": "એક સ્થળેથી બીજા સ્થળે માહિતી કે સંદેશાની આપ-લે માટે સંચાર માધ્યમો (Media) વપરાય છે."},
    19: {"q": "ગ્રાહક સુરક્ષા અધિનિયમ ભારતમાં કયા વર્ષમાં અમલમાં આવ્યો?", "opts": ["1986", "1995", "2005", "2010"], "ans": "A", "exp": "ગ્રાહકોના હિતોના રક્ષણ માટે ભારત સરકારે 1986 માં ગ્રાહક સુરક્ષા અધિનિયમ બનાવ્યો હતો."}
}

# Flashcards Data (Sample for chapters)
chapter_flashcard_data = {
    1: [("શબ્દાર્થ: પગી", "પગલાંની છાપના આધારે પગેરું શોધવામાં પારંગત વ્યક્તિ."), ("ખ્યાલ: રાજપૂત", "રાજપુત્ર અથવા વીર શૌર્યવાન ક્ષત્રિય યોદ્ધા.")],
    2: [("શબ્દાર્થ: સલ્તનત", "સુલતાન દ્વારા શાસિત રાજ્ય કે સામ્રાજ્ય."), ("ખ્યાલ: ચહલગામી", "ઇલ્તુત્મિશે સ્થાપેલી 40 તુર્ક સરદારોની મંડળી.")],
    3: [("શબ્દાર્થ: મનસબદારી", "મુઘલ કાળમાં અધિકારીઓનો હોદ્દો અને મનસબ આપવાની પદ્ધતિ."), ("ખ્યાલ: દાસતાન-એ-અમીર હમ્ઝા", "અકબરના સમયનું વિખ્યાત ચિત્રપટલ.")],
    4: [("શબ્દાર્થ: ગોપુરમ", "દક્ષિણ ભારતના મંદિરોનું ભવ્ય અને કલાત્મક પ્રવેશદ્વાર."), ("ખ્યાલ: સ્થાપત્ય", "મંદિરો, કિલ્લાઓ અને વાવ-તળાવોનું બાંધકામ.")],
    5: [("શબ્દાર્થ: ગોંડ", "ભારતની પ્રાચીન આદિવાસી જનજાતિ પૈકીની એક."), ("ખ્યાલ: સ્થાનાંતરિત ખેતી", "જંગલો કાપીને કે સળગાવીને કરાતી ફેરબદલી વાળી ખેતી (ઝૂમ ખેતી).")],
    6: [("શબ્દાર્થ: વનજારા", "ભારતની સૌથી અગત્યની વિચરતી જાતિ જે વેપારી પરિવહન કરતી."), ("ખ્યાલ: માલધારી", "પશુપાલન પર નભતી વિચરતી જાતિ.")],
    7: [("શબ્દાર્થ: સગુણ ભક્તિ", "ઈશ્વરના સાકાર રૂપની પૂજા-આરાધના કરવી તે."), ("ખ્યાલ: ખાનકાહ", "સૂફી સંતોનો રહેણાંક અને ઉપદેશ આપવાનો આશ્રમ.")],
    8: [("શબ્દાર્થ: કથક", "ઉત્તર ભારતનું પ્રસિદ્ધ શાસ્ત્રીય નૃત્ય."), ("ખ્યાલ: મિનીએચર શૈલી", "કાગળ કે કાપડ પર કરાતું નાના કદનું કલાત્મક ચિત્રકામ.")],
    9: [("શબ્દાર્થ: પેશ્વા", "મરાઠા સામ્રાજ્યના વડાપ્રધાન કે મુખ્ય પ્રધાન."), ("ખ્યાલ: ચૌથ", "મરાઠાઓ દ્વારા પડોશી રાજ્યોમાંથી ઉઘરાવાતો કર.")],
    10: [("શબ્દાર્થ: સિયાલ (SiAl)", "પૃથ્વીના ભૂકવચનું ઉપરનું પડ જે સિલિકા અને એલ્યુમિના જેવા ખનીજોથી બનેલું છે."), ("ખ્યાલ: નિફે (NiFe)", "પૃથ્વીનું સૌથી આંતરિક સ્તર જે નિકલ અને ફેરસથી બનેલું છે.")],
    11: [("શબ્દાર્થ: મૃદાવરણ", "પૃથ્વી સપાટી પરનો માટી અને ખડકોનો બનેલો ઘન પોપડો."), ("ખ્યાલ: પ્રદૂષણ", "પર્યાવરણના ઘટકોમાં થતો અસહ્ય અને નુકસાનકારક ફેરફાર.")],
    12: [("શબ્દાર્થ: હવામાન", "કોઈપણ સ્થળની ટૂંકા ગાળાની વાતાવરણીય પરિસ્થિતિ."), ("ખ્યાલ: ક્ષોભ આવરણ", "પૃથ્વીની સપાટીથી સૌથી નજીક આવેલું વાતાવરણનું પ્રથમ સ્તર.")],
    13: [("શબ્દાર્થ: સુનામી", "સમુદ્રના તળિયે થતા ભૂકંપથી ઉદ્ભવતા વિનાશક મોજાં."), ("ખ્યાલ: દાવાનળ", "જંગલોમાં કુદરતી કે માનવસર્જિત કારણોસર લાગતી ભયાનક આગ.")],
    14: [("શબ્દાર્થ: સંસાધન", "માનવીની જરૂરિયાતો પૂર્ણ કરતા કુદરતી કે માનવસર્જિત સાધનો."), ("ખ્યાલ: જળપ્લાવિત ક્ષેત્ર", "નદી કે તળાવનો સમગ્ર પાણિનિષ્કાસ વિસ્તાર.")],
    15: [("શબ્દાર્થ: લોકશાહી", "લોકોનું, લોકો વડે અને લોકો માટે ચાલતું શાસન."), ("ખ્યાલ: સમાનતા", "બધા નાગરિકોને ભેદભાવ વગર સમાન તક અને અધિકાર મળવા તે.")],
    16: [("શબ્દાર્થ: વિધાનસભા", "રાજ્ય સરકારનું ધારાસભાનું નીચલું ગૃહ."), ("ખ્યાલ: રાજ્યપાલ", "રાજ્યના બંધારણીય વડા જેઓની નિમણૂક રાષ્ટ્રપતિ કરે છે.")],
    17: [("શબ્દાર્થ: મહિલા સશક્તીકરણ", "મહિલાઓને આર્થિક, સામાજિક અને રાજકીય રીતે સક્ષમ બનાવવાની પ્રક્રિયા."), ("ખ્યાલ: જાતિગત ભિન્નતા", "સમાજમાં પુરુષ અને સ્ત્રી વચ્ચેના દૃષ્ટિકોણ અને કાર્યોનો તફાવત.")],
    18: [("શબ્દાર્થ: જાહેરાત (Advertising)", "ઉત્પાદન કે સેવાના વેચાણ વધારવા માટેનું પ્રચાર માધ્યમ."), ("ખ્યાલ: પબ્લિક રિલેશન્સ", "સંસ્થા અને જનતા વચ્ચે સુમેળભર્યા સંબંધો જાળવવાની કળા.")],
    19: [("શબ્દાર્થ: બજાર", "જ્યાં ખરીદનાર અને વેચનાર ભેગા થતાં હોય તેવું સ્થળ."), ("ખ્યાલ: ગ્રાહક સુવિધાઓ", "ખરીદી વખતે ગ્રાહકના અધિકારો અને ગુણવત્તાની ખાતરી.")]
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
    quiz_id = f"quiz_sub_ss_std7_ch{c_num}_mcq"
    qz_q_id = f"qz_q_ss_std7_ch{c_num}_1"
    
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
        fc_id = f"fc_ss_{c_num}_{fc_idx}"
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

output_file = PROJECT_ROOT / "outputs" / "std7_social_science_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Social Science Std 7 payload: {output_file}")
print(f"   Subjects:     {len(payload['subjects'])}")
print(f"   Textbooks:    {len(payload['textbooks'])}")
print(f"   Chapters:     {len(payload['chapters'])}")
print(f"   Quizzes:      {len(payload['quizzes'])}")
print(f"   Questions:    {len(payload['questions'])}")
print(f"   Flashcards:   {len(payload['flashcards'])}")
print(f"   AI KB Docs:   {len(payload['ai_knowledge_base'])}")
