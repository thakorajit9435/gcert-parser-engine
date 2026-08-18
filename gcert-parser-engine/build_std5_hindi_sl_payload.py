#!/usr/bin/env python3
"""
Builds complete std5_hindi_sl_payload.json for GCERT Standard 5 Hindi Second Language (તિતલી - ધોરણ 5).
Ingests into Cloud Firestore and Qdrant Vector Database via import_json.py.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-5-Titali_Hindi_SecondLanguage.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-5-Titali_Hindi_SecondLanguage.pdf"
storage_path = "textbooks/Std-5-Titali_Hindi_SecondLanguage.pdf"

subject_id = "sub_hindi_std5_sl"
subject_id_alt1 = "sub_hindi_std5"
subject_id_alt2 = "sub_titali_std5"
subject_id_alt3 = "sub_hindi_std5_sl"

standard_id = "std_5"
standard_number = 5
session = "1"

raw_chapters_info = [
    {
      "id": "sub_hindi_std5_sl_ch1",
      "chapterNumber": 1,
      "titleGu": "યાતાયાત (ચિત્રપાઠ)",
      "titleEn": "Traffic (Picture Lesson)",
      "descriptionGu": "વિવિધ વાહનો (રોડ, હવાઈ, અને પાણીના મુસાફરીના સાધનો) અને સુંદર ફૂલોના ચિત્રો જોઈને પ્રશ્નોના ઉત્તરો અને માતૃભાષામાં અનુવાદ કરવાની પ્રવૃત્તિઓ [૧૬, ૧૭, ૨૦].",
      "startPage": 7,
      "endPage": 14,
      "pdfPageOffset": 6,
      "pageIndex": 7,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch2",
      "chapterNumber": 2,
      "titleGu": "ગણતરી (૨૧ થી ૫૦)",
      "titleEn": "Counting (21 to 50)",
      "descriptionGu": "૨૧ થી ૫૦ સુધીની સંખ્યાઓનું હિન્દી શબ્દો અને અંકોમાં લેખન, સંખ્યા મિલાવી ચિત્ર પૂર્ણ કરવાની પ્રવૃત્તિ અને રમતો દ્વારા ગણતરીનો મહાવરો [૨૧, ૨૨].",
      "startPage": 15,
      "endPage": 19,
      "pdfPageOffset": 6,
      "pageIndex": 15,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch3",
      "chapterNumber": 3,
      "titleGu": "નન્હા મુન્ના રાહી હૂં",
      "titleEn": "I am a Little Soldier",
      "descriptionGu": "શકીલ બદાયૂની રચિત દેશભક્તિનું ગીત, જેમાં એક બાળ સૈનિક દેશસેવા, શાંતિ, સમાનતા અને દેશની પ્રગતિ માટે પોતાના મનોરથો રજૂ કરે છે [૨૪, ૨૫].",
      "startPage": 20,
      "endPage": 25,
      "pdfPageOffset": 6,
      "pageIndex": 20,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch4",
      "chapterNumber": 4,
      "titleGu": "પોતપોતાની વિચારસરણી",
      "titleEn": "To Each Their Own Thinking",
      "descriptionGu": "કુદરતી સવારના દ્રશ્ય અને ચિત્રવાર્તા 'ટોપીવાળો ફેરિયો અને વાંદરા' ના આધારે વિદ્યાર્થીઓમાં વિવેચનાત્મક વિચાર અને સર્જનાત્મક વાર્તાલેખન શક્તિનો વિકાસ [૩૦-૩૨].",
      "startPage": 26,
      "endPage": 33,
      "pdfPageOffset": 6,
      "pageIndex": 26,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch5",
      "chapterNumber": 5,
      "titleGu": "પ્રાણીસંગ્રહાલયની મુલાકાત",
      "titleEn": "A Visit to the Zoo",
      "descriptionGu": "ગીતા અને તેના દાદાજીની પ્રાણીસંગ્રહાલયની સફર દ્વારા સિંહ, લંગૂર, ગેંડો, કાચબો, રંગબેરંગી માછલીઓ, બતક અને વિવિધ પક્ષીઓનો અનોખો પરિચય [૩૫-૩૭].",
      "startPage": 34,
      "endPage": 40,
      "pdfPageOffset": 6,
      "pageIndex": 34,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch6",
      "chapterNumber": 6,
      "titleGu": "હાસ્યનો khajano",
      "titleEn": "The Box of Laughter",
      "descriptionGu": "જીવનમાં હાસ્ય અને ઉત્સાહનું મહત્ત્વ સમજાવતા રમુજી અને મજેદાર ટુચકાઓ (ચુટકુલે) જે બાળકોને તણાવ મુક્ત કરે છે અને વ્યાકરણ શીખવે છે [૪૪-૪૬].",
      "startPage": 41,
      "endPage": 43,
      "pdfPageOffset": 6,
      "pageIndex": 41,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch7",
      "chapterNumber": 7,
      "titleGu": "રસોઈ અને વાનગીઓ (ચિત્રપાઠ)",
      "titleEn": "Food Treasure (Picture Lesson)",
      "descriptionGu": "રસોઈઘરના ચિત્ર પરથી રસોઈની પ્રક્રિયા, વાસણો, અનાજ, શાકભાજી અને ફળોના હિન્દી અને ગુજરાતી નામોની વિસ્તૃત ભાષા-સજ્જતા [૪૭, ૪٨, ૫૦].",
      "startPage": 44,
      "endPage": 49,
      "pdfPageOffset": 6,
      "pageIndex": 44,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch8",
      "chapterNumber": 8,
      "titleGu": "ભરત મિલાપ",
      "titleEn": "Meeting with Bharat",
      "descriptionGu": "રામાયણના સુપ્રસિદ્ધ પ્રસંગ પરથી રામ, લક્ષ્મણ અને ભરત વચ્ચેના અતૂટ ભાઈચારા, આદર્શ કર્તવ્યનિષ્ઠા અને સેવાની ભાવના દર્શાવતું પ્રેરણાદાયી નાટક [૫૧, ૫૫].",
      "startPage": 50,
      "endPage": 58,
      "pdfPageOffset": 6,
      "pageIndex": 50,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch9",
      "chapterNumber": 9,
      "titleGu": "કેવો શોરબકોર?",
      "titleEn": "What a Noise?",
      "descriptionGu": "બિરજુ ચાચાના ખેતરમાં શાકભાજીઓ વચ્ચે પોતાની શ્રેષ્ઠતા સાબિત કરવા માટે થતી ગરમાગરમ ચર્ચા અને વિવિધ શાકભાજીઓનો પરિચય [૬૭-૬૯].",
      "startPage": 68,
      "endPage": 75,
      "pdfPageOffset": 6,
      "pageIndex": 68,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch10",
      "chapterNumber": 10,
      "titleGu": "શીખો",
      "titleEn": "Learn",
      "descriptionGu": "શ્રીનાથસિંહ રચિત સુંદર કવિતા, જેમાં પ્રકૃતિના તત્ત્વો જેવા કે ફૂલ, સૂરજ, ઝાડ, hava, પાણી, પૃથ્વી અને દીપક પાસેથી સદ્ગુણો શીખવાની પ્રેરણા છે [૭૭, ૭৮].",
      "startPage": 76,
      "endPage": 80,
      "pdfPageOffset": 6,
      "pageIndex": 76,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch11",
      "chapterNumber": 11,
      "titleGu": "સાચો બાળક",
      "titleEn": "The Truthful Boy",
      "descriptionGu": "ડાકુઓના હુમલા વચ્ચે પણ પોતાની માતાની શિખામણ યાદ રાખીને સાચું બોલનારા અને પાછળથી મહાન સંત બનેલા અબ્દુલ કાદિરનો પ્રેરક જીવનપ્રસંગ [૮૩-૮૬].",
      "startPage": 81,
      "endPage": 85,
      "pdfPageOffset": 6,
      "pageIndex": 81,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch12",
      "chapterNumber": 12,
      "titleGu": "દુમદુમા ગામના બાળકો",
      "titleEn": "Children of Dumduma Village",
      "descriptionGu": "ગામમાં પાણીની અછત દૂર કરવા માટે બાળકો દ્વારા સામૂહિક શ્રમદાનથી મોટું તળાવ ખોદવાની અને મુશ્કેલીનો સુંદર ઉકેલ લાવવાની સહભાગી વાર્તા [૯૨-૯૪].",
      "startPage": 86,
      "endPage": 96,
      "pdfPageOffset": 6,
      "pageIndex": 86,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch13",
      "chapterNumber": 13,
      "titleGu": "સ્વચ્છતા",
      "titleEn": "Cleanliness",
      "descriptionGu": "અજયના જન્મદિવસ પર મોહનની મુલાકાત અને શેરીની ગંદકી દૂર કરવા માટે શાળાના બાળકો અને શિક્ષકો દ્વારા હાથ ધરાયેલું ઉત્સાહપૂર્વકનું સફાઈ અભિયાન [૧૦૫-૧૦৮].",
      "startPage": 97,
      "endPage": 102,
      "pdfPageOffset": 6,
      "pageIndex": 97,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch14",
      "chapterNumber": 14,
      "titleGu": "અમે ભારતની શાન છીએ!",
      "titleEn": "We are the Pride of India",
      "descriptionGu": "નાના બાળકો દેશનું ભવિષ્ય છે અને તેઓ પોતાના મહાન કાર્યોથી કેવી રીતે દેશની પ્રતિષ્ઠા વધારે છે તે દર્શાવતી દેશભક્તિપૂર્ણ ટૂંકી કવિતા [૧૧૨].",
      "startPage": 103,
      "endPage": 105,
      "pdfPageOffset": 6,
      "pageIndex": 103,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch15",
      "chapterNumber": 15,
      "titleGu": "સસલું અને હાથી",
      "titleEn": "The Rabbit and the Elephant",
      "descriptionGu": "પંચતંત્રની પ્રખ્યાત વાર્તા, જેમાં ચતુર સસલાઓએ પોતાની બુદ્ધિ અને સમજદારીથી શક્તિશાળી હાથીઓના ત્રાસમાંથી કઈ રીતે રક્ષણ મેળવ્યું તેની સમજ [૧૧૫-૧૧૮].",
      "startPage": 106,
      "endPage": 111,
      "pdfPageOffset": 6,
      "pageIndex": 106,
      "verified": True
    },
    {
      "id": "sub_hindi_std5_sl_ch16",
      "chapterNumber": 16,
      "titleGu": "કોયડાઓ",
      "titleEn": "Riddles",
      "descriptionGu": "વિદ્યાર્થીઓમાં વિચારવાની અને તર્ક કરવાની ક્ષમતા તેમજ ભાષાગત જ્ઞાન અને શબ્દભંડોળમાં વધારો કરતા અનોખા કોયડાઓ અને પઝલ્સ [૧૨૩].",
      "startPage": 112,
      "endPage": 117,
      "pdfPageOffset": 6,
      "pageIndex": 112,
      "verified": True
    }
]

chapters_content = [
    {
      "chapterNumber": 1,
      "quizzes": [
        {
          "questionTextGu": "ચિત્રપાઠ 'યાતાયાત' ના અભ્યાસમાં આપેલા રેલવે ટિકિટના ચિત્રમાં મુસાફરી ક્યાંથી ક્યાં સુધીની બતાવવામાં આવી છે?",
          "options": [
            { "id": "A", "textGu": "મુંબઈ સેન્ટ્રલથી અમદાવાદ જંકશન" },
            { "id": "B", "textGu": "અમદાવાદથી સુરત" },
            { "id": "C", "textGu": "ઈડરથી ચિલોડા" },
            { "id": "D", "textGu": "મુંબઈથી દિલ્હી" }
          ],
          "correctOptionId": "A",
          "explanationGu": "રેલવે ટિકિટના ચિત્રમાં સ્પષ્ટ રીતે 'मुंबई सेन्ट्रल (Mumbai Central) से अहमदाबाद जं. (Ahmedabad JN.)' લખેલું વાંચી શકાય છે [૧૭]."
        },
        {
          "questionTextGu": "આપેલા રેલવે ટિકિટના ચિત્રમાં ટિકિટનું કુલ ભાડું (કિરાયો) કેટલા રૂપિયા દર્શાવેલું છે?",
          "options": [
            { "id": "A", "textGu": "૧૩૫ રૂપિયા" },
            { "id": "B", "textGu": "૯૧ રૂપિયા" },
            { "id": "C", "textGu": "૨૦૪ રૂપિયા" },
            { "id": "D", "textGu": "૩૦૦ રૂપિયા" }
          ],
          "correctOptionId": "C",
          "explanationGu": "રેલવે ટિકિટમાં ભાડું 'Rs. Two Hundred Four Only' એટલે કે ૨૦૪ રૂપિયા લખેલું છે [૧૭]."
        },
        {
          "questionTextGu": "એસ.ટી. બસની ટિકિટના ચિત્ર મુજબ બસ કયા ડેપોની છે અને તેનું ભાડું કેટલા રૂપિયા છે?",
          "options": [
            { "id": "A", "textGu": "ઈડર ડેપો, ૯૧ રૂપિયા" },
            { "id": "B", "textGu": "અમદાવાદ ડેપો, ૧૦૦ રૂપિયા" },
            { "id": "C", "textGu": "વડોદરા ડેપો, ૨૦૪ રૂપિયા" },
            { "id": "D", "textGu": "ચિલોડા ડેપો, ૯૦ રૂપિયા" }
          ],
          "correctOptionId": "A",
          "explanationGu": "બસ ટિકિટના ચિત્રમાં ઉપર 'G.S.R.T.C. IDER DEPOT' and ભાડું 'Rs. 91.00' દર્શાવેલ છે [૧૮]."
        },
        {
          "questionTextGu": "માતૃભાષામાં અનુવાદ કરવાના સ્વાધ્યાયના વાક્ય 'ऑटोरिक्शा के तीन पहिए होते हैं' નો સાચો ગુજરાતી અનુવાદ શું થાય?",
          "options": [
            { "id": "A", "textGu": "રિક્ષા લાલ રંગની હોય છે." },
            { "id": "B", "textGu": "રિક્ષાના ત્રણ પૈડાં હોય છે." },
            { "id": "C", "textGu": "મને રિક્ષામાં બેસવું ગમે છે." },
            { "id": "D", "textGu": "ઓટોરિક્ષા ઝડપથી ચાલે છે." }
          ],
          "correctOptionId": "B",
          "explanationGu": "'ऑटोरिक्शा के तीन पहिए होते हैं' નો ગુજરાતી અર્થ 'ઓટોરિક્ષા (રિક્ષા) ના ત્રણ પૈડાં હોય છે' એવો થાય છે [૨૦]."
        },
        {
          "questionTextGu": "योग्यता-વિસ્તારના 'ઇતના જાણો' (इतना जानिए) કોષ્ટક મુજબ હિન્દી શબ્દ 'ताँगा' નો ગુજરાતી અર્થ શું થાય છે?",
          "options": [
            { "id": "A", "textGu": "બળદગાડું" },
            { "id": "B", "textGu": "ઊંટગાડી" },
            { "id": "C", "textGu": "ઘોડાગાડી" },
            { "id": "D", "textGu": "મોટરસાયકલ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વાહનોના કોષ્ટક મુજબ હિન્દી શબ્દ 'घोडागाड़ी, ताँगा' નો ગુજરાતી અર્થ 'ઘોડાગાડી' થાય છે [૨૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "સાયકલ", "backGu": "સાયકલને હિન્દીમાં 'साइकिल' કહે છે [૨૦]." },
        { "frontGu": "ટ્રેન", "backGu": "ટ્રેનને હિન્દીમાં 'ट्रेन' તરીકે ઓળખવામાં આવે છે [૨૦]." },
        { "frontGu": "લોકશક્તિ એક્સપ્રેસ", "backGu": "પાઠ્યપુસ્તકમાં આપેલી રેલવે ટિકિટ જે ટ્રેનની છે તેનું નામ [૧૭]." },
        { "frontGu": "જી.એસ.આર.ટી.સી. (GSRTC)", "backGu": "ગુજરાત સ્ટેટ રોડ ટ્રાન્સપોર્ટ કોર્પોરેશન, જેની ઈડર ડેપોની બસ ટિકિટ પાઠમાં આપેલી છે [૧૮]." },
        { "frontGu": "રાષ્ટ્રીય ફૂલ", "backGu": "કમળ (कमल) એ ભારતનું રાષ્ટ્રીય ફૂલ છે [૨૦]." }
      ]
    },
    {
      "chapterNumber": 2,
      "quizzes": [
        {
          "questionTextGu": "હિન્દી અંકોની ગણતરી મુજબ '૩૯' ને હિન્દી શબ્દોમાં કઈ રીતે લખવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "उनतीस" },
            { "id": "B", "textGu": "उनतालीस" },
            { "id": "C", "textGu": "उनચાસ" },
            { "id": "D", "textGu": "ચાલીસ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૩૯ ને હિન્દીમાં 'उनतालीस' લખાય છે, જ્યારે ૨૯ ને 'उनतीस' અને ૪૯ ને 'उनchaas' લખાય છે [૨૧]."
        },
        {
          "questionTextGu": "સ્વાધ્યાયના જોડકાં મુજબ હિન્દી શબ્દ 'छब्बीस' ને અંકોમાં કઈ રીતે દર્શાવવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "૨૬ (२६)" },
            { "id": "B", "textGu": "૩૬ (३६)" },
            { "id": "C", "textGu": "૪૬ (४६)" },
            { "id": "D", "textGu": "૧૬ (१६)" }
          ],
          "correctOptionId": "A",
          "explanationGu": "હિન્દી અંકોમાં ૨૬ ને 'छब्बीस' (छब्बीस) લખાય છે [૨૧, ૨૨]."
        },
        {
          "questionTextGu": "હિન્દી ગણતરીની રમતમાં '૩૨' અંકના ખાના પર કઈ પ્રવૃત્તિ કરવાની સૂચના આપવામાં આવી છે?",
          "options": [
            { "id": "A", "textGu": "મોરનો અવાજ કાઢવો (मोर की आवाज़ निकालो)" },
            { "id": "B", "textGu": "દેડકાની જેમ ચાલવું" },
            { "id": "C", "textGu": "વાર્તા સંભળાવવી" },
            { "id": "D", "textGu": "ત્રણ તાળી વગાડવી" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ગણતરીના રમત બોર્ડ કોષ્ટક મુજબ ૩૨ નંબર પર 'मोर की आवाज़ निकालो' લખેલું છે [૨૩]."
        },
        {
          "questionTextGu": "રમતના ખાના ક્રમાંક '૪૯' પર આવતાં ખેલાડીને કઈ અનોખી રીતે ચાલવાની સૂચના મળે છે?",
          "options": [
            { "id": "A", "textGu": "ઘોડાની જેમ દોડવું" },
            { "id": "B", "textGu": "દેડકાની ચાલે ચાલવું (मेढक की चाल चलो)" },
            { "id": "C", "textGu": "મોરની જેમ નાચવું" },
            { "id": "D", "textGu": "નહાવાનો અભિનય કરવો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રમતના બોર્ડ પર ૪૯ નંબર પર 'मेढक की चाल चलो' (દેડકાની ચાલે ચાલવું) લખેલું છે [૨૩]."
        },
        {
          "questionTextGu": "ગણતરીના સ્વાધ્યાય મુજબ હિન્દી શબ્દ 'बयालीस' એટલે કઈ સંખ્યા થાય?",
          "options": [
            { "id": "A", "textGu": "૨૨ (२२)" },
            { "id": "B", "textGu": "૩૨ (३२)" },
            { "id": "C", "textGu": "૪૨ (४२)" },
            { "id": "D", "textGu": "૫૦ (५०)" }
          ],
          "correctOptionId": "C",
          "explanationGu": "હિન્દી ગણતરી મુજબ ૪૨ ને હિન્દીમાં 'बयालीस' લખાય છે [૨૧, ૨૨]."
        }
      ],
      "flashcards": [
        { "frontGu": "૨૯ (29)", "backGu": "હિન્દીમાં તેને 'उनतीस' કહે છે [૨૧]." },
        { "frontGu": "૩૯ (39)", "backGu": "હિન્દીમાં તેને 'उनतालीस' કહે છે [૨૧]." },
        { "frontGu": "૪૯ (49)", "backGu": "હિન્દીમાં તેને 'उनचाસ' કહે છે [૨૧]." },
        { "frontGu": "૫૦ (50)", "backGu": "હિન્દીમાં તેને 'पचास' કહે છે [૨૧]." },
        { "frontGu": "રમવાનો પાસો", "backGu": "દિવાસળીની ત્રણ ખાલી પેટીઓને એકબીજા પર ચોંટાડીને કાગળ લગાવી તૈયાર કરેલો અંકોનો પાસો [૨૨, ૨૩]." }
      ]
    },
    {
      "chapterNumber": 3,
      "quizzes": [
        {
          "questionTextGu": "દેશભક્તિ ગીત 'નન્હા મુન્ના રાહી હૂં' ના કવિ (રચનાકાર) કોણ છે?",
          "options": [
            { "id": "A", "textGu": "શકીલ બદાયૂની" },
            { "id": "B", "textGu": "શ્રીનાથસિંહ" },
            { "id": "C", "textGu": "શ્રી બંકિમચંદ્ર ચેટર્જી" },
            { "id": "D", "textGu": "હરિવંશરાય બચ્ચન" }
          ],
          "correctOptionId": "A",
          "explanationGu": "આ દેશભક્તિ ગીતના લેખક / કવિ શકીલ બદાયૂની (शकील बदायूँनी) છે [૨૪, ૨૬]."
        },
        {
          "questionTextGu": "કવિતામાં બાળ સૈનિક ક્યાં પહોંચતા પહેલાં શ્વાસ (દમ) ન લેવાની મક્કમતા વ્યક્ત કરે છે?",
          "options": [
            { "id": "A", "textGu": "પોતાના ઘર સુધી" },
            { "id": "B", "textGu": "સરહદ સુધી" },
            { "id": "C", "textGu": "મંજિલ (લક્ષ્ય) સુધી" },
            { "id": "D", "textGu": "ખેતર સુધી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કવિતાની પંક્તિ છે: 'मंजिल से पहले न लूँगा कहीं दम, आगे ही आगे बढ़ाऊँगा कदम।' [૨૫]."
        },
        {
          "questionTextGu": "કવિતાના આધારે આપેલા શબ્દાર્થ મુજબ 'ચલન' (चलन) શબ્દનો સાચો અર્થ શું થાય છે?",
          "options": [
            { "id": "A", "textGu": "ચાલવું તે" },
            { "id": "B", "textGu": "વ્યવહાર કે આચરણ" },
            { "id": "C", "textGu": "ચલણી સિક્કા" },
            { "id": "D", "textGu": "ચાલતી બસ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "શબ્દાર્થમાં સ્પષ્ટ આપ્યું છે કે 'ચલન' એટલે 'व्यवहार, आचरण' (વ્યવહાર કે આચરણ) [૨૬]."
        },
        {
          "questionTextGu": "રૂઢિપ્રયોગ 'આંખો કા તારા' (आँखों का तारा) નો સાચો અર્થ કયો છે?",
          "options": [
            { "id": "A", "textGu": "તારો બની ચમકવું" },
            { "id": "B", "textGu": "ખૂબ જ વહાલા હોવું (बहुत प्यारा)" },
            { "id": "C", "textGu": "અંધારું છવાઈ જવું" },
            { "id": "D", "textGu": "આંખોમાં પાણી આવવું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મુહાવરો 'आँखों का तारा' નો અર્થ 'बहुत प्यारा' (ખૂબ પ્રિય હોવું) થાય છે [૨૬]."
        },
        {
          "questionTextGu": "વ્યાકરણના સ્વાધ્યાય મુજબ 'રાહી' (राही) શબ્દના બે સાચા પર્યાયવાચી શબ્દો કયા છે?",
          "options": [
            { "id": "A", "textGu": "ફૌજી અને સૈનિક" },
            { "id": "B", "textGu": "મુસાફિર અને પંથી" },
            { "id": "C", "textGu": "ધરા અને પૃથ્વી" },
            { "id": "D", "textGu": "રાહ અને પંથ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પર્યાયવાચી કોષ્ટક મુજબ 'રાહી' ના બે સાચા પર્યાયવાચી શબ્દો 'मुसाफिर' અને 'पंथी' છે [૨૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "રાહી (राही)", "backGu": "તેનો અર્થ 'મુસાફિર' કે 'યાત્રી' થાય છે [૨૬]." },
        { "frontGu": "આંખો કા તારા", "backGu": "રૂઢિપ્રયોગ જેનો અર્થ 'ખૂબ જ વહાલો' (बहुत प्यारा) થાય છે [૨૬]." },
        { "frontGu": "ધૂપ (ધૂપ નો વિરોધી)", "backGu": "છાંયડો ('છાઁવ') [૨૯]." },
        { "frontGu": "મંજિલ", "backGu": "તેનો પર્યાયવાચી શબ્દ 'ધ્યેય' (ध्येय) અથવા 'લક્ષ્ય' (लक्ष्य) થાય છે [૨૬, ૨૯]." },
        { "frontGu": "બમ (बम)", "backGu": "વિસ્ફોટક પદાર્થોથી બનેલો ગોળો [૨૬]." }
      ]
    },
    {
      "chapterNumber": 4,
      "quizzes": [
        {
          "questionTextGu": "'સોચ અપની-અપની' પાઠમાં સવારના સુંદર કુદરતી ચિત્રમાં નાળિયેરીના કુલ કેટલા વૃક્ષો દેખાય છે?",
          "options": [
            { "id": "A", "textGu": "બે વૃક્ષો" },
            { "id": "B", "textGu": "ત્રણ વૃક્ષો" },
            { "id": "C", "textGu": "પાંચ વૃક્ષો" },
            { "id": "D", "textGu": "એક પણ નહીં" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ચિત્રના અભ્યાસ પ્રશ્ન ક્રમાંક ૩ મુજબ પૂછ્યું છે: 'नारियल के कितने पेड़ हैं?' અને ચિત્રમાં ૨ નાળિયેરીના વૃક્ષો દેખાય છે [૩૨]."
        },
        {
          "questionTextGu": "ટોપીવાળા ફેરિયાની વાર્તામાં વાંદરાઓ ઝાડ પરથી નીચે આવીને રંગબેરંગી ટોપીઓ ક્યાંથી કાઢીને પહેરી લે છે?",
          "options": [
            { "id": "A", "textGu": "ફેરિયાના માથા પરથી" },
            { "id": "B", "textGu": "ફેરિયાની ટોપલીમાંથી (टोकरी)" },
            { "id": "C", "textGu": "જમીન પરથી" },
            { "id": "D", "textGu": "દુકાનમાંથી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાર્તાના ચિત્રમાં ફેરિયો જ્યારે સૂતો હતો ત્યારે વાંદરાઓ તેની ટોપલી (टोकरी) માંથી બધી ટોપીઓ લઈ જાય છે [૩૩]."
        },
        {
          "questionTextGu": "વાંદરાઓ પાસેથી પોતાની ટોપીઓ પાછી મેળવવા માટે ચતુર ફેરિયાએ કઈ યુક્તિ અજમાવી?",
          "options": [
            { "id": "A", "textGu": "તેણે પથ્થર માર્યા" },
            { "id": "B", "textGu": "તેણે લાકડી બતાવી ડરાવ્યા" },
            { "id": "C", "textGu": "તેણે પોતાના માથા પરની ટોપી ગુસ્સામાં જમીન પર ફેંકી દીધી" },
            { "id": "D", "textGu": "તેણે ઝાડ પર ચઢીને ટોપીઓ ખેંચી લીધી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વાંદરાઓ નકલખોર હોય છે. ફેરિયાએ પોતાની ટોપી નીચે ફેંકતા જ બધા વાંદરાઓએ પણ નકલ કરીને પોતાની ટોપીઓ નીચે ફેંકી દીધી [૩૩, ૩૪]."
        },
        {
          "questionTextGu": "પુનરાવર્તન ૧ માં આપેલી 'બંદર બાંટ' વાર્તામાં બે બિલાડીઓ કઈ વસ્તુ માટે અંદરોઅંદર ઝઘડતી હતી?",
          "options": [
            { "id": "A", "textGu": "દૂધ પીવા માટે" },
            { "id": "B", "textGu": "ઉંદર પકડવા માટે" },
            { "id": "C", "textGu": "એક રોટલી માટે" },
            { "id": "D", "textGu": "સોનાના સિક્કા માટે" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વાર્તામાં વાક્ય છે કે: 'दोनों को भूख लगी। उन्हें एक रोटी मिली। वे एक रोटी के लिए झगड़ने लगीं।' [૩૫, ૩૬]."
        },
        {
          "questionTextGu": "બિલાડીઓનો ઝઘડો પતાવવા અને રોટલીના સરખા ભાગ કરવા વાંદરાએ કયા સાધનનો ઉપયોગ કર્યો?",
          "options": [
            { "id": "A", "textGu": "ત્રાજવું (तराजू)" },
            { "id": "B", "textGu": "મોટી લાકડી" },
            { "id": "C", "textGu": "તોલવાનું યંત્ર" },
            { "id": "D", "textGu": "દોરડું" }
          ],
          "correctOptionId": "A",
          "explanationGu": "વાર્તાની ખાલી જગ્યાઓ પૂરી કરતા વિગત બને છે કે: 'इतने में एक बंदर आया। वह तराजू लाया। उसने रोटी के दो टुकड़े किए।' [૩૬]."
        }
      ],
      "flashcards": [
        { "frontGu": "ચરવાહા", "backGu": "ગાય-ભેંસ કે ઘેટા-બકરા ચરાવનાર ગોવાળ (ગોવાળિયો) [૩૨]." },
        { "frontGu": "વ્યાપારી (ફેરિયો)", "backGu": "માથે ટોપલી મૂકીને બજારમાં રંગબેરંગી ટોપીઓ વેચવા જનાર ફેરિયો [૩૩]." },
        { "frontGu": "બંદર બાંટ", "backGu": "બે બિલાડીઓની લડાઈમાં વચ્ચે આવી આખી રોટલી ખાઈ જનાર વાંદરાની અનોખી વાર્તા [૩૫, ૩૬]." },
        { "frontGu": "તરાજુ", "backGu": "વસ્તુઓ તોલવા માટે વપરાતું ત્રાજવું [૩૬]." },
        { "frontGu": "પછતાવા", "backGu": "પોતાની મૂર્ખતાથી રોટલી ગુમાવ્યા પછી બંને બિલાડીઓને છેલ્લે થયેલો પસ્તાવો [૩૬]." }
      ]
    },
    {
      "chapterNumber": 5,
      "quizzes": [
        {
          "questionTextGu": "ગીતા અને તેના દાદાજી જ્યારે પ્રાણીસંગ્રહાલયમાં ગયા, ત્યારે કયા બોર્ડ પર તેમની નજર પડી?",
          "options": [
            { "id": "A", "textGu": "અહીં કચરો ફેંકવો મના છે" },
            { "id": "B", "textGu": "જાનવરોને ખાવાનું આપવાની મનાઈ છે (खाना देना मना है)" },
            { "id": "C", "textGu": "શાંતિ જાળવો" },
            { "id": "D", "textGu": "પ્રાણીઓથી દૂર રહો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દાદાજીએ ગીતાને ત્યાં લખેલું બોર્ડ વંચાવ્યું: 'चिड़ियाघर के जानवरों को खाना देना मना है।' [૩૭]."
        },
        {
          "questionTextGu": "પાઠમાં આપેલા લંગૂર (બંદરનો એક પ્રકાર) ના મોંની કઈ વિશેષતા જણાવવામાં આવી છે?",
          "options": [
            { "id": "A", "textGu": "તેનું મોં લાલ હોય છે" },
            { "id": "B", "textGu": "તેનું મોં કાળું હોય છે (मुँह काला होता है)" },
            { "id": "C", "textGu": "તેનું આખું મોં સફેદ હોય છે" },
            { "id": "D", "textGu": "તે ખૂબ નાનું હોય છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દાદાજીએ હસીને કહ્યું: 'बिटिया वह लंगूर है। लंगूर का मुँह काला होता है।' [૩૭]."
        },
        {
          "questionTextGu": "ગીતાએ પાણીમાં ચાલતો 'પથ્થર' જોયો, ત્યારે દાદાજીએ તેને સમજાવીને કયા જીવ વિશે વાત કરી?",
          "options": [
            { "id": "A", "textGu": "મોટો કાચબો (कछुआ)" },
            { "id": "B", "textGu": "નદીનો મગર" },
            { "id": "C", "textGu": "ગેંડો" },
            { "id": "D", "textGu": "જંગલી ભેંસ" }
          ],
          "correctOptionId": "A",
          "explanationGu": "દાદાજીએ સમજાવ્યું કે જેને તું પથ્થર સમજે છે તે 'कछुआ' (કાચબો) છે, જે પોતાના કવચ (ખોલ) માં માથું છુપાવી લે છે [૩૮]."
        },
        {
          "questionTextGu": "પ્રાણીસંગ્રહાલયમાં જોયેલું સફેદ રંગનું વિદેશી પક્ષી કયું હતું, જેને 'કાતુઆ' (कातुआ) પણ કહેવાય છે?",
          "options": [
            { "id": "A", "textGu": "હરિયલ તોતા" },
            { "id": "B", "textGu": "સફેદ કાકાકૌઆ (काकातुआ)" },
            { "id": "C", "textGu": "શાહમૃગ" },
            { "id": "D", "textGu": "બગલો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દાદાજીએ બતાવ્યું કે: 'उधर देखो वह सफेद वाला विदेशी चिड़िया है, इसे कातुआ (काकातुआ) कहते हैं।' [૩૮, ૩૯]."
        },
        {
          "questionTextGu": "પાઠમાં દર્શાવ્યા મુજબ વિશ્વનું સૌથી મોટું પક્ષી કયું છે, જે ઝાડની છાયામાં ઊભું હતું?",
          "options": [
            { "id": "A", "textGu": "સુંદર મોર" },
            { "id": "B", "textGu": "મોટું શાહમૃગ (शुतुरमुर्ग)" },
            { "id": "C", "textGu": "સર્પચીલ" },
            { "id": "D", "textGu": "વિમાન જેવું ગરુડ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દાદાજીએ ગીતાને જણાવ્યું કે સૌથી મોટું પક્ષી શુતુરમુર્ગ (शुतुरमुर्ग - શાહમૃગ) છે, જે ત્યાં ઊભું હતું [૩૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "ચિડિયાઘર", "backGu": "એવી જગ્યા જ્યાં પશુ-પક્ષીઓને જોવા માટે રાખવામાં આવે છે (પ્રાણીસંગ્રહાલય) [૪૦]." },
        { "frontGu": "खोकल (કવચ)", "backGu": "કાચબાની પીઠ પરનું કઠણ આવરણ જે તેનું રક્ષણ કરે છે [૩૮, ૪૦]." },
        { "frontGu": "ગેંડો (ગૌરૈયા)", "backGu": "નાક પર એક મોટું શિંગડું ધરાવતું પ્રાણી જે ગીતાએ પાઠમાં જોયું [૩૭, ૪૪]." },
        { "frontGu": "લંગૂર", "backGu": "કાળા મોઢાવાળો અને લાંબી પૂંછડી ધરાવતો એક ખાસ પ્રકારનો વાંદરો [૩૭, ૪૦]." },
        { "frontGu": "શુતુરમુર્ગ", "backGu": "દુનિયાનું સૌથી મોટું પક્ષી (શાહમૃગ) જે પાઠમાં બતાવવામાં આવ્યું છે [૩૯]." }
      ]
    },
    {
      "chapterNumber": 6,
      "quizzes": [
        {
          "questionTextGu": "સુકાતા ઘઉંનું ધ્યાન રાખતી વખતે છોકરાએ કયા પશુને ઘઉં ખાવા દીધા કારણ કે તેની માતાએ માત્ર ગાયને જ હાંકવાની સૂચના આપી હતી?",
          "options": [
            { "id": "A", "textGu": "મોટો કૂતરો" },
            { "id": "B", "textGu": "એક ગધેડો (गधा)" },
            { "id": "C", "textGu": "ભૂખ્યો આખલો" },
            { "id": "D", "textGu": "તોફાની વાંદરો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રમુજી ટુચકા મુજબ છોકરાએ કહ્યું કે: 'आपने तो गाय को हटाने को कहा था।... यह तो गधा है।' [૪૭]."
        },
        {
          "questionTextGu": "'દીપક મીઠાઈ નથી ખાતો' વાક્યમાં વ્યાકરણની દૃષ્ટિએ 'દીપક' શું છે? તેના જવાબમાં બીજા મિત્રએ કયો રમુજી જવાબ આપ્યો?",
          "options": [
            { "id": "A", "textGu": "સંજ્ઞા" },
            { "id": "B", "textGu": "મૂર્ખ (मूर्ख)" },
            { "id": "C", "textGu": "ક્રિયાપદ" },
            { "id": "D", "textGu": "વિશેષણ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પહેલા દોસ્તે વ્યાકરણનો પ્રશ્ન પૂછ્યો પણ બીજાએ હાસ્ય ઉપજાવતા કહ્યું કે 'મીઠાઈ ન ખાનારો દીપક મૂર્ખ કહેવાય' [૪૭]."
        },
        {
          "questionTextGu": "માલિકે નોકરને કંઈપણ કરતાં પહેલાં પૂછવાનું કહ્યું, તો નોકરે રસોડામાં બિલ્લી દૂધ પીતી વખતે શું પૂછ્યું?",
          "options": [
            { "id": "A", "textGu": "શું હું બિલ્લીને ભગાડી દઉં? (क्या मैं उसे भगा दूँ?)" },
            { "id": "B", "textGu": "શું હું બિલ્લીને પકડી લઉં?" },
            { "id": "C", "textGu": "શું હું દૂધ ગરમ કરી દઉં?" },
            { "id": "D", "textGu": "બિલ્લી માટે બીજું દૂધ ક્યાં છે?" }
          ],
          "correctOptionId": "A",
          "explanationGu": "નોકરે બિલ્લી દૂધ પીતી હોવા છતાં તેને ભગાડવા માટે પહેલા માલિકને પૂછવાની મૂર્ખામી કરી [૪૭]."
        },
        {
          "questionTextGu": "રામુ શ્યામુના હાથમાં કૂતરો જોઈને પૂછે છે કે 'આ ગધેડાને લઈને ક્યાં જાય છે?' ત્યારે શ્યામુએ કૂતરો હોવાનું કહેતા રામુએ શું જવાબ આપ્યો?",
          "options": [
            { "id": "A", "textGu": "હું કૂતરા સાથે જ વાત કરું છું (मैं कुत्ते से ही पूछ रहा हूँ)" },
            { "id": "B", "textGu": "તારો કૂતરો બહુ મસ્ત છે" },
            { "id": "C", "textGu": "આ ખરેખર ગધેડો જ છે" },
            { "id": "D", "textGu": "તને સમજવામાં ભૂલ થઈ છે" }
          ],
          "correctOptionId": "A",
          "explanationGu": "રામુએ શ્યામુને ટોણો મારતા કૂતરા તરફ જોઈને પૂછ્યું કે 'આ ગધેડા (શ્યામુ) ને લઈને ક્યાં જાય છે?' [૪૮]."
        },
        {
          "questionTextGu": "વ્યાકરણના સ્વાધ્યાય મુજબ 'બેવકૂફ' (बेवकूफ) શબ્દનો સમાન અર્થ ધરાવતો હિન્દી શબ્દ કયો છે?",
          "options": [
            { "id": "A", "textGu": "દોસ્ત" },
            { "id": "B", "textGu": "મૂર્ખ (मूर्ख)" },
            { "id": "C", "textGu": "વક્ત" },
            { "id": "D", "textGu": "પ્રાતઃકાલ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સમાનાર્થી શબ્દોના કોષ્ટક મુજબ 'મૂર્ખ' અને 'बेवकूफ' બંને સમાન અર્થ ધરાવે છે [૪૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "દોસ્ત (દોસ્ત નો વિરોધી)", "backGu": "દુશ્મન (दुश्मन) [૪૮]." },
        { "frontGu": "મૂર્ખ (મૂર્ખ નો વિરોધી)", "backGu": "બુદ્ધિશાળી (बुद्धिमान) [૪૮]." },
        { "frontGu": "સમય", "backGu": "હિન્દીમાં તેને 'समय' અથવા 'वक्त' કહે છે [૪૯]." },
        { "frontGu": "ગધેડો (ટુચકા વાળો)", "backGu": "પંક્તિમાં આવેલો ગધેડો જે ઘઉં ખાતો હોવા છતાં છોકરો તેને હટાવતો નથી [૪૭]." },
        { "frontGu": "પ્રાતઃકાલ", "backGu": "સવારનો સમય અથવા હિન્દીમાં 'सुबह' [૪૮, ૪૯]." }
      ]
    }
]

# Generate remaining 10 chapters empty placeholders
for i in range(7, 17):
    chapters_content.append({
        "chapterNumber": i,
        "quizzes": [],
        "flashcards": []
    })

payload = {
    "subjects": [
        {
            "id": subject_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standardId": "5",
            "standard_id": "5",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "5",
            "session": session,
            "name": "Titali Hindi Second Language",
            "nameGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "name_en": "Standard 5 Titali Hindi (Second Language)",
            "name_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "title": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "titleGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "title_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "icon": "🦋",
            "order": 3,
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
            "standardId": "5",
            "standard_id": "5",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "5",
            "session": session,
            "name": "Titali Hindi Second Language",
            "nameGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "name_en": "Standard 5 Titali Hindi (Second Language)",
            "name_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "title": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "titleGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "title_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "icon": "🦋",
            "order": 3,
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
            "standardId": "5",
            "standard_id": "5",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "5",
            "session": session,
            "name": "Titali Hindi Second Language",
            "nameGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "name_en": "Standard 5 Titali Hindi (Second Language)",
            "name_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "title": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "titleGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "title_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "icon": "🦋",
            "order": 3,
            "total_chapters": len(raw_chapters_info),
            "totalChapters": len(raw_chapters_info),
            "isDeleted": False,
            "is_deleted": False,
            "isActive": True,
            "is_active": True
        },
        {
            "id": subject_id_alt3,
            "subject_id": subject_id_alt3,
            "subjectId": subject_id_alt3,
            "standardId": "5",
            "standard_id": "5",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "5",
            "session": session,
            "name": "Titali Hindi Second Language",
            "nameGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "name_en": "Standard 5 Titali Hindi (Second Language)",
            "name_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "title": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "titleGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "title_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5",
            "icon": "🦋",
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
            "title_gu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5 પાઠ્યપુસ્તક",
            "titleGu": "તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5 પાઠ્યપુસ્તક",
            "title_en": "Standard 5 Titali Hindi (Second Language) Textbook",
            "titleEn": "Standard 5 Titali Hindi (Second Language) Textbook",
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "5",
            "standardId": "5",
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
            "standardId": "5",
            "standard_id": "5",
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

quiz_map = {}
fc_by_chapter = {}

for ch_info, ch_content in zip(raw_chapters_info, chapters_content):
    c_num = ch_info["chapterNumber"]
    ch_id = ch_info["id"]
    title_gu = ch_info["titleGu"]
    title_en = ch_info["titleEn"]
    desc_gu = ch_info["descriptionGu"]
    start_page = ch_info["startPage"]
    end_page = ch_info["endPage"]
    offset = ch_info["pdfPageOffset"]
    page_idx = ch_info["pageIndex"]
    tp_id = f"{ch_id}_tp1"
    stp_id = f"{ch_id}_tp1_stp1"

    ch_doc = {
        "id": ch_id,
        "chapter_id": ch_id,
        "chapterId": ch_id,
        "subject_id": subject_id,
        "subjectId": subject_id,
        "standard_id": "5",
        "standardId": "5",
        "standard_number": standard_number,
        "standardNumber": standard_number,
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
        "verified": True,
        "pdf_url": pdf_url,
        "pdfUrl": pdf_url,
        "file_url": pdf_url,
        "url": pdf_url,
        "gs_url": gs_url,
        "gsUrl": gs_url,
        "storage_path": storage_path,
        "storagePath": storage_path,
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
        "chapter_id": ch_id,
        "chapterId": ch_id,
        "subject_id": subject_id,
        "subjectId": subject_id,
        "standard_id": "5",
        "standardId": "5",
        "standard_number": standard_number,
        "titleGu": title_gu,
        "title_gu": title_gu,
        "title_en": title_en,
        "title": title_gu,
        "topicNumber": 1,
        "topic_number": 1,
        "order": 1,
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
        "standard_id": "5",
        "standardId": "5",
        "titleGu": title_gu,
        "title_gu": title_gu,
        "title_en": title_en,
        "title": title_gu,
        "subTopicNumber": 1,
        "sub_topic_number": 1,
        "order": 1,
        "is_active": True,
        "isActive": True,
        "isDeleted": False,
        "is_deleted": False
    }
    payload["sub_topics"].append(stp_doc)

    # Process Quizzes & MCQ Questions
    q_list = ch_content.get("quizzes", [])
    quiz_id = f"quiz_std5_hindi_{ch_id}"
    question_docs = []
    question_ids = []

    for q_idx, q in enumerate(q_list):
        q_text = q["questionTextGu"]
        # Filter non-empty options
        raw_opts = [opt for opt in q["options"] if opt.get("textGu") and opt["textGu"].strip()]
        correct_ans = q["correctOptionId"]
        explanation = q.get("explanationGu", "")
        qz_q_id = f"q_std5_hindi_{ch_id}_{q_idx+1}"

        option_map = {opt["id"]: opt["textGu"] for opt in raw_opts}

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
            "standard_id": "5",
            "standardId": "5",
            "standardNumber": standard_number,
            "standard_number": standard_number,
            "questionText": q_text,
            "questionTextGu": q_text,
            "question_text_gu": q_text,
            "question_text": q_text,
            "question": q_text,
            "title": q_text,
            "options": raw_opts,
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
            "standardId": "5",
            "standard_id": "5",
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
            fc_id = f"fc_std5_hindi_{ch_id}_{idx+1}"

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
                "standard_id": "5",
                "standardId": "5",
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

    # Build AI Knowledge Base Documents for Qdrant (only for chapters 1-6)
    if c_num <= 6:
        q_docs = quiz_map.get(ch_id, [])
        q_summary = "\n".join([f"પ્રશ્ન: {q['questionTextGu']} | જવાબ: {q['correctOptionId']} | સમજૂતી: {q['explanationGu']}" for q in q_docs])
        fcs = fc_by_chapter.get(ch_id, [])
        fc_summary = "\n".join([f"શબ્દાર્થ: {f[0]} -> {f[1]}" for f in fcs])

        content = f"વિષય: તિતલી (હિન્દી - દ્વિતીય ભાષા) ધોરણ 5\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
        if q_summary:
            content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
        if fc_summary:
            content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

        payload["ai_knowledge_base"].append({
            "kb_id": f"kb_std5_hindi_{ch_id}",
            "standard_id": "5",
            "standard_number": standard_number,
            "session": session,
            "subject_id": subject_id,
            "chapter_id": ch_id,
            "topic_id": tp_id,
            "topic_number": 1,
            "title_gu": title_gu,
            "content_gu": content,
            "keywords": [title_gu, title_en, "હિન્દી", "તિતલી", "ધોરણ 5", "hindi", "titali"],
            "learning_outcomes": [desc_gu],
            "revision_notes": [desc_gu],
            "difficulty_level": "medium",
            "page_numbers": [start_page],
            "is_active": True,
            "isDeleted": False
        })

output_file = PROJECT_ROOT / "outputs" / "std5_hindi_sl_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 5 Titali Hindi SL payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
