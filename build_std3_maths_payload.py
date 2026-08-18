#!/usr/bin/env python3
"""
Builds complete std3_maths_payload.json for GCERT Standard 3 Mathematics (ગણિત મેળો ધોરણ ૩).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-3_Ganit%20Mela%20(1).pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-3_Ganit Mela (1).pdf"
storage_path = "textbooks/Std-3_Ganit Mela (1).pdf"

subject_id = "sub_ganit_mela_std3"
subject_id_alt1 = "sub_ganit_std3"
subject_id_alt2 = "sub_maths_std3"
subject_id_alt3 = "sub_math_std3"

standard_id = "std_3"
standard_number = 3
session = "1"

chapters_data = [
    {
      "id": "sub_ganit_std3_ch1",
      "chapterNumber": 1,
      "titleGu": "નામમાં શું છે?",
      "title_en": "What's in a Name?",
      "descriptionGu": "તારાપૂરમાં રહેતા ગોવાળના કુટુંબની ગાયોની ગણતરીની વાર્તા દ્વારા બાળકોને જૂથમાં ગણતરી અને નામના અક્ષરોની ગણતરી કરવાની સમજ આપવામાં આવી છે [૩૬, ૩૯].",
      "start_page": 19,
      "end_page": 26,
      "pdfPageOffset": 18,
      "pageIndex": 18
    },
    {
      "id": "sub_ganit_std3_ch2",
      "chapterNumber": 2,
      "titleGu": "રમકડાંની રમતનો આનંદ",
      "title_en": "Joy of Toy Play",
      "descriptionGu": "જૂના ખોખાં અને ડબ્બાઓની મદદથી વિવિધ ભૌમિતિક આકારો જેવા કે સમઘન, લંબઘન, શંકુ અને નળાકારની ઓળખ આપવામાં આવી છે [૪૬, ૪૭].",
      "start_page": 27,
      "end_page": 33,
      "pdfPageOffset": 19,
      "pageIndex": 26
    },
    {
      "id": "sub_ganit_std3_ch3",
      "chapterNumber": 3,
      "titleGu": "બેવડી સદી",
      "title_en": "Double Century",
      "descriptionGu": "ગણતરીનો ઇતિહાસ, શૂન્યનું મહત્વ અને ૧૦૦ થી ૨૦૦ સુધીની સંખ્યાઓની વિવિધ રમતો અને સંખ્યારેખા દ્વારા સમજ આપવામાં આવી છે [૫૪, ૬૦].",
      "start_page": 34,
      "end_page": 46,
      "pdfPageOffset": 19,
      "pageIndex": 33
    },
    {
      "id": "sub_ganit_std3_ch4",
      "chapterNumber": 4,
      "titleGu": "નાનીમા સાથે વેકેશન",
      "title_en": "Vacation with Nani",
      "descriptionGu": "નાનીમા સાથેની રમતો અને ટપાલ ટિકિટના સંગ્રહ દ્વારા સરવાળા અને બાદબાકીના વ્યવહારુ કોયડાઓ ઉકેલવાની પ્રવૃત્તિ [૬૮, ૭૨].",
      "start_page": 47,
      "end_page": 62,
      "pdfPageOffset": 19,
      "pageIndex": 46
    },
    {
      "id": "sub_ganit_std3_ch5",
      "chapterNumber": 5,
      "titleGu": "આકાર સાથે આનંદ",
      "title_en": "Fun with Shapes",
      "descriptionGu": "રંગોળી અને વિવિધ વસ્તુઓના અનુરેખણ દ્વારા ચોરસ, લંબચોરસ, ત્રિકોણ અને વર્તુળના ગુણધર્મો અને ખૂણાઓની સમજૂતી [૯૧, ૯૪].",
      "start_page": 63,
      "end_page": 82,
      "pdfPageOffset": 19,
      "pageIndex": 62
    },
    {
      "id": "sub_ganit_std3_ch6",
      "chapterNumber": 6,
      "titleGu": "“સો”નું ઘર - ૧",
      "title_en": "The House of Hundreds - 1",
      "descriptionGu": "૨૦૦ થી ૫૦૦ સુધીની સંખ્યાઓનું વાંચન, લેખન અને તેમને સંખ્યારેખા પર દર્શાવવાની વિવિધ પ્રવૃત્તિઓ [૧૧૧, ૧૨૧].",
      "start_page": 83,
      "end_page": 100,
      "pdfPageOffset": 19,
      "pageIndex": 82
    },
    {
      "id": "sub_ganit_std3_ch7",
      "chapterNumber": 7,
      "titleGu": "રક્ષાબંધન",
      "title_en": "Rakshabandhan",
      "descriptionGu": "રક્ષાબંધનના તહેવારના માધ્યમથી ગુણાકાર અને ભાગાકારની પાયાની સંકલ્પનાઓ સ્પષ્ટ કરવામાં આવી છે [૧૩૩, ૧૩૬].",
      "start_page": 101,
      "end_page": 125,
      "pdfPageOffset": 19,
      "pageIndex": 100
    },
    {
      "id": "sub_ganit_std3_ch8",
      "chapterNumber": 8,
      "titleGu": "વાજબી વહેંચણી",
      "title_en": "Fair Sharing",
      "descriptionGu": "વસ્તુઓની સમાન વહેંચણી દ્વારા અડધા (Half), પા (Quarter) અને પોણા ભાગની ગાણિતિક સમજ [૧૬૫, ૧૭૧].",
      "start_page": 126,
      "end_page": 135,
      "pdfPageOffset": 19,
      "pageIndex": 125
    },
    {
      "id": "sub_ganit_std3_ch9",
      "chapterNumber": 9,
      "titleGu": "“સો”નું ઘર - ૨",
      "title_en": "The House of Hundreds - 2",
      "descriptionGu": "૫૦૦ થી ૧૦૦૦ સુધીની સંખ્યાઓ, સંખ્યા જાસૂસ અને વિશિષ્ટ સંખ્યા પેટર્નની સમજ [૧૭૬, ૧૮૫].",
      "start_page": 136,
      "end_page": 146,
      "pdfPageOffset": 19,
      "pageIndex": 135
    },
    {
      "id": "sub_ganit_std3_ch10",
      "chapterNumber": 10,
      "titleGu": "વર્ગખંડમાં આનંદ!",
      "title_en": "Joy in the Classroom!",
      "descriptionGu": "લંબાઈના વિવિધ એકમો, વેંત, પગલાં અને મીટર ગજ દ્વારા માપન કરવાની પદ્ધતિઓની ઓળખ [૧૯૦, ૧૯૮].",
      "start_page": 147,
      "end_page": 156,
      "pdfPageOffset": 19,
      "pageIndex": 146
    },
    {
      "id": "sub_ganit_std3_ch11",
      "chapterNumber": 11,
      "titleGu": "ભરો અને ઉપાડો",
      "title_en": "Fill and Lift",
      "descriptionGu": "ગુંજાશ (લિટર) અને વસ્તુઓના વજન (કિલોગ્રામ) ની પાયાની સમજ પ્રાયોગિક પ્રવૃત્તિઓ દ્વારા [૨૦૩, ૨૧૬].",
      "start_page": 157,
      "end_page": 168,
      "pdfPageOffset": 19,
      "pageIndex": 156
    },
    {
      "id": "sub_ganit_std3_ch12",
      "chapterNumber": 12,
      "titleGu": "આપો અને લો",
      "title_en": "Give and Take",
      "descriptionGu": "ત્રણ અંકી સંખ્યાઓના સરવાળા અને બાદબાકી તથા નાણાકીય વ્યવહારોની સમજૂતી [૨૨૦, ૨૩૧].",
      "start_page": 169,
      "end_page": 183,
      "pdfPageOffset": 19,
      "pageIndex": 168
    },
    {
      "id": "sub_ganit_std3_ch13",
      "chapterNumber": 13,
      "titleGu": "સમય વહી જાય છે",
      "title_en": "Time Flies",
      "descriptionGu": "કેલેન્ડર, તહેવારોની ગણતરી અને ઘડિયાળ દ્વારા સમય જોવાની અને માપવાની સમજ [૨૩૮, ૨૪૫].",
      "start_page": 184,
      "end_page": 195,
      "pdfPageOffset": 19,
      "pageIndex": 183
    },
    {
      "id": "sub_ganit_std3_ch14",
      "chapterNumber": 14,
      "titleGu": "સૂરજકુંડનો મેળો",
      "title_en": "Surajkund Fair",
      "descriptionGu": "સંમિતિ (Symmetry), રંગોળીની પેટર્ન અને નકશા વાંચન જેવી મહત્વની ગાણિતિક સંકલ્પનાઓ [૨૫૧, ૨૬૪].",
      "start_page": 196,
      "end_page": 210,
      "pdfPageOffset": 19,
      "pageIndex": 195
    }
]

quizzes_raw = [
    {
      "chapterId": "sub_ganit_std3_ch1",
      "questions": [
        {
          "questionTextGu": "દિશા અને દીપે ગાયોની ગણતરી રાખવા માટે શું યુક્તિ અપનાવી?",
          "options": [
            { "id": "A", "textGu": "દીવાલ પર નિશાન બનાવ્યાં" },
            { "id": "B", "textGu": "પથ્થરો ભેગા કર્યા" },
            { "id": "C", "textGu": "ચિત્રો દોર્યાં" },
            { "id": "D", "textGu": "નામ લખ્યાં" }
          ],
          "correctOptionId": "A",
          "explanationGu": "વાર્તા મુજબ, તેમણે ગાયો બહાર જાય ત્યારે નિશાન બનાવવાની અને પાછી આવે ત્યારે નિશાન દૂર કરવાની યુક્તિ અપનાવી હતી [૩૬]."
        },
        {
          "questionTextGu": "ભારતમાં સૌથી લાંબું નામ ધરાવતું સ્થળ કયું છે?",
          "options": [
            { "id": "A", "textGu": "અમદાવાદ" },
            { "id": "B", "textGu": "વેંકટનરસિમ્હારાજુવરીપેટા" },
            { "id": "C", "textGu": "તિરુવનંતપુરમ" },
            { "id": "D", "textGu": "હરિયાણા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પુસ્તકમાં ઉલ્લેખ છે કે આંધ્રપ્રદેશમાં આવેલું 'વેંકટનરસિમ્હારાજુવરીપેટા' ભારતનું સૌથી લાંબું નામ ધરાવતું સ્થળ છે [૪૪]."
        },
        {
          "questionTextGu": "ગુજરાતનું કયું સ્થળ સૌથી ટૂંકું નામ ધરાવતું ગણાય છે?",
          "options": [
            { "id": "A", "textGu": "ઈબ" },
            { "id": "B", "textGu": "ઓડ" },
            { "id": "C", "textGu": "વાવ" },
            { "id": "D", "textGu": "મોર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પુસ્તક મુજબ ગુજરાતનું 'ઓડ' એ ભારતમાં સૌથી નાના નામ ધરાવતાં સ્થળો પૈકીનું એક છે [૪૪]."
        },
        {
          "questionTextGu": "દિશા અને દીપના મિત્ર હેમંત પાસે કુલ કેટલી ગાયો હતી?",
          "options": [
            { "id": "A", "textGu": "૨૩" },
            { "id": "B", "textGu": "૩૬" },
            { "id": "C", "textGu": "૫૦" },
            { "id": "D", "textGu": "૧૮" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પાઠ્યપુસ્તક મુજબ હેમંત પાસે ૩૬ ગાયો અને ૨૩ ઘેટાં હતાં [૩૮]."
        },
        {
          "questionTextGu": "માલા શાળાએ જતી હતી ત્યારે તેની હેરસ્ટાઇલ કેવી હતી?",
          "options": [
            { "id": "A", "textGu": "ખુલ્લા વાળ" },
            { "id": "B", "textGu": "એક ચોટલી" },
            { "id": "C", "textGu": "બે ચોટલી (પોનીટેલ)" },
            { "id": "D", "textGu": "અંબોડો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ચિત્ર અને લખાણ મુજબ માલાને તેની માતાએ બે ચોટલી (પોનીટેલ) કરી આપી હતી [૪૬]."
        }
      ]
    },
    {
      "chapterId": "sub_ganit_std3_ch2",
      "questions": [
        {
          "questionTextGu": "કયો આકાર એક ખાસ પ્રકારનો લંબઘન (Cuboid) છે?",
          "options": [
            { "id": "A", "textGu": "સમઘન (Cube)" },
            { "id": "B", "textGu": "શંકુ" },
            { "id": "C", "textGu": "નળાકાર" },
            { "id": "D", "textGu": "ગોળો" }
          ],
          "correctOptionId": "A",
          "explanationGu": "પુસ્તકમાં નોંધ છે કે સમઘન (Cube) એ એક ખાસ પ્રકારનો લંબઘન છે [૪૯]."
        },
        {
          "questionTextGu": "જે આકારમાં કોઈ ધાર કે કિનારી નથી તે કયો છે?",
          "options": [
            { "id": "A", "textGu": "લંબઘન" },
            { "id": "B", "textGu": "ગોળો (Sphere)" },
            { "id": "C", "textGu": "સમઘન" },
            { "id": "D", "textGu": "શંકુ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગોળાકાર પદાર્થોમાં કોઈ ખૂણો કે ધાર હોતી નથી [૫૧]."
        },
        {
          "questionTextGu": "પાસા (Dice) પર ૧ ની વિરુદ્ધ સપાટી પર કઈ સંખ્યા હોય છે?",
          "options": [
            { "id": "A", "textGu": "૬" },
            { "id": "B", "textGu": "૫" },
            { "id": "C", "textGu": "૪" },
            { "id": "D", "textGu": "૨" }
          ],
          "correctOptionId": "A",
          "explanationGu": "સામાન્ય પાસામાં સામસામેની બાજુઓનો સરવાળો ૭ થાય છે, તેથી ૧ ની સામે ૬ હોય [૫૩]."
        },
        {
          "questionTextGu": "બાળકોએ પક્ષીનો ચહેરો બનાવવા માટે કયા આકારનો ઉપયોગ કર્યો?",
          "options": [
            { "id": "A", "textGu": "શંકુ (Cone)" },
            { "id": "B", "textGu": "નળાકાર" },
            { "id": "C", "textGu": "સમઘન" },
            { "id": "D", "textGu": "ગોળો" }
          ],
          "correctOptionId": "A",
          "explanationGu": "બાળકોએ શંકુ પર પક્ષીનો ચહેરો અને અણીદાર ચાંચ બનાવી હતી [૪૭]."
        },
        {
          "questionTextGu": "કયા આકારમાં માત્ર સપાટ (Flat) બાજુઓ હોય છે?",
          "options": [
            { "id": "A", "textGu": "નળાકાર" },
            { "id": "B", "textGu": "સમઘન" },
            { "id": "C", "textGu": "શંકુ" },
            { "id": "D", "textGu": "ગોળો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સમઘન અને લંબઘન જેવી વસ્તુઓમાં માત્ર સપાટ બાજુઓ જોવા મળે છે [૫૧]."
        }
      ]
    },
    {
      "chapterId": "sub_ganit_std3_ch3",
      "questions": [
        {
          "questionTextGu": "પ્રાચીન ભારતીયોએ સંખ્યા લખવા માટે કેટલા પ્રતીકોનો આવિષ્કાર કર્યો હતો?",
          "options": [
            { "id": "A", "textGu": "પાંચ" },
            { "id": "B", "textGu": "નવ" },
            { "id": "C", "textGu": "દસ" },
            { "id": "D", "textGu": "બાર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "માનવ ઇતિહાસની સૌથી બુદ્ધિશાળી શોધમાં ૧૦ પ્રતીકો (૦ થી ૯) નો સમાવેશ થાય છે [૫૪]."
        },
        {
          "questionTextGu": "ક્રિકેટમાં 'સદી' (Century) એટલે કેટલા રન થાય?",
          "options": [
            { "id": "A", "textGu": "૫૦" },
            { "id": "B", "textGu": "૧૦૦" },
            { "id": "C", "textGu": "૧૫૦" },
            { "id": "D", "textGu": "૨૦૦" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૧૦૦ રન પૂરા થાય ત્યારે તેને સદી કહેવામાં આવે છે [૫૭]."
        },
        {
          "questionTextGu": "૯૯ કરતાં ૧ વધુ એટલે કઈ સંખ્યા?",
          "options": [
            { "id": "A", "textGu": "૯૮" },
            { "id": "B", "textGu": "૧૦૦" },
            { "id": "C", "textGu": "૧૦૧" },
            { "id": "D", "textGu": "૯૯૧" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૯૯ માં ૧ ઉમેરતા ૧૦૦ પ્રાપ્ત થાય છે [૫૭]."
        },
        {
          "questionTextGu": "૧૦ લાકડીઓના ૧૦ જૂથ મળીને કુલ કેટલી લાકડીઓ બનાવે?",
          "options": [
            { "id": "A", "textGu": "૧૦" },
            { "id": "B", "textGu": "૨૦" },
            { "id": "C", "textGu": "૧૦૦" },
            { "id": "D", "textGu": "૫૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "૧૦-૧૦ ના દસ જૂથ એટલે ૧૦૦ થાય [૫૭]."
        },
        {
          "questionTextGu": "સંખ્યારેખા પર ૨૦૦ દર્શાવવા માટે કયા બે કૂદકાનો સરવાળો સાચો છે?",
          "options": [
            { "id": "A", "textGu": "૧૫૦ + ૫૦" },
            { "id": "B", "textGu": "૧૦૦ + ૫૦" },
            { "id": "C", "textGu": "૧૫૦ + ૪૦" },
            { "id": "D", "textGu": "૧૮૦ + ૧૦" }
          ],
          "correctOptionId": "A",
          "explanationGu": "સંખ્યારેખા પર ૧૫૦ અને ૫૦ નો કૂદકો મળીને ૨૦૦ દર્શાવે છે [૬૫]."
        }
      ]
    }
]

flashcards_raw = [
    {
      "chapterId": "sub_ganit_std3_ch1",
      "frontGu": "નિશાન (Mark)",
      "backGu": "ગાયોની ગણતરી રાખવા માટે દીવાલ પર કરવામાં આવતી યુક્તિ [૩૬]."
    },
    {
      "chapterId": "sub_ganit_std3_ch1",
      "frontGu": "વેંકટનરસિમ્હારાજુવરીપેટા",
      "backGu": "ભારતનું સૌથી લાંબું નામ ધરાવતું સ્થળ [૪૪]."
    },
    {
      "chapterId": "sub_ganit_std3_ch1",
      "frontGu": "ઈબ (IB)",
      "backGu": "ઓડિશામાં આવેલું ભારતનું સૌથી ટૂંકું નામ ધરાવતું સ્થળ [૪૪]."
    },
    {
      "chapterId": "sub_ganit_std3_ch1",
      "frontGu": "જૂથ (Group)",
      "backGu": "સમાન લાક્ષણિકતાઓ ધરાવતી વસ્તુઓનું એકત્રીકરણ [૪૪]."
    },
    {
      "chapterId": "sub_ganit_std3_ch1",
      "frontGu": "સંખ્યા નામ",
      "backGu": "સંખ્યાને શબ્દોમાં લખવાની રીત [૪૨]."
    },
    {
      "chapterId": "sub_ganit_std3_ch2",
      "frontGu": "સમઘન (Cube)",
      "backGu": "જેની બધી બાજુઓ ચોરસ અને સમાન હોય તેવો આકાર [૪૭]."
    },
    {
      "chapterId": "sub_ganit_std3_ch2",
      "frontGu": "નળાકાર (Cylinder)",
      "backGu": "બોટલ કે ડબ્બા જેવો આકાર જેમાં ઉપર-નીચે વર્તુળ હોય [૪૭]."
    },
    {
      "chapterId": "sub_ganit_std3_ch2",
      "frontGu": "શંકુ (Cone)",
      "backGu": "જોકરની ટોપી જેવો અણીદાર આકાર [૪૭]."
    },
    {
      "chapterId": "sub_ganit_std3_ch2",
      "frontGu": "ધાર (Edge)",
      "backGu": "બે સપાટીઓ જ્યાં મળે છે તે કિનારી [૪૮]."
    },
    {
      "chapterId": "sub_ganit_std3_ch2",
      "frontGu": "ખૂણો (Corner)",
      "backGu": "જ્યાં બે ધાર મળે છે તે બિંદુ [૪૮]."
    },
    {
      "chapterId": "sub_ganit_std3_ch3",
      "frontGu": "શૂન્ય (Zero)",
      "backGu": "'કશું જ નહીં' (Nothing) દર્શાવતું મહત્ત્વનું પ્રતીક [૫૫]."
    },
    {
      "chapterId": "sub_ganit_std3_ch3",
      "frontGu": "સદી (Century)",
      "backGu": "૧૦૦ ની સંખ્યા અથવા ૧૦૦ રન [૫૭]."
    },
    {
      "chapterId": "sub_ganit_std3_ch3",
      "frontGu": "બેવડી સદી (Double Century)",
      "backGu": "૨૦૦ ની સંખ્યા [૬૫]."
    },
    {
      "chapterId": "sub_ganit_std3_ch3",
      "frontGu": "સંખ્યારેખા",
      "backGu": "સંખ્યાઓને ક્રમબદ્ધ રીતે દર્શાવતી રેખા [૫૮]."
    },
    {
      "chapterId": "sub_ganit_std3_ch3",
      "frontGu": "૧૦૦૦ (એક હજાર)",
      "backGu": "૧૦૦-૧૦૦ ના દસ જૂથ મળીને બનતી મોટી સંખ્યા [૧૧૮]."
    }
]

payload = {
    "subjects": [
        {
            "id": subject_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standardId": "3",
            "standard_id": "3",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "3",
            "session": session,
            "name": "Standard 3 Mathematics Ganit Mela",
            "nameGu": "ગણિત મેળો (ધોરણ ૩)",
            "name_en": "Standard 3 Mathematics (Ganit Mela)",
            "name_gu": "ગણિત મેળો (ધોરણ ૩)",
            "title": "ગણિત મેળો (ધોરણ ૩)",
            "titleGu": "ગણિત મેળો (ધોરણ ૩)",
            "title_gu": "ગણિત મેળો (ધોરણ ૩)",
            "icon": "📐",
            "order": 3,
            "total_chapters": len(chapters_data),
            "totalChapters": len(chapters_data),
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
            "title_gu": "ગણિત મેળો (ધોરણ ૩) પાઠ્યપુસ્તક",
            "titleGu": "ગણિત મેળો (ધોરણ ૩) પાઠ્યપુસ્તક",
            "title_en": "Standard 3 Mathematics Ganit Mela Textbook",
            "titleEn": "Standard 3 Mathematics Ganit Mela Textbook",
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "3",
            "standardId": "3",
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
            "total_chapters": len(chapters_data)
        }
    ],
    "sessions": [
        {
            "session_id": f"session_{standard_id}_sem{session}",
            "standardId": "3",
            "standard_id": "3",
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

# 1. Process Chapters, Topics, SubTopics
for idx, ch_info in enumerate(chapters_data):
    ch_id = ch_info["id"]
    c_num = ch_info["chapterNumber"]
    start_p = ch_info["start_page"]
    end_p = ch_info["end_page"]
    offset = ch_info["pdfPageOffset"]
    book_start = max(1, start_p - offset)
    initial_p = max(0, start_p - 1)

    ch_doc = {
        "id": ch_id,
        "chapter_id": ch_id,
        "chapterId": ch_id,
        "textbook_id": f"tb_{subject_id}",
        "textbookId": f"tb_{subject_id}",
        "subjectId": subject_id,
        "subject_id": subject_id,
        "standardId": "3",
        "standard_id": "3",
        "standard": str(standard_number),
        "standardNumber": standard_number,
        "standard_number": standard_number,
        "session": session,
        "title": ch_info["title_en"],
        "titleGu": ch_info["titleGu"],
        "title_gu": ch_info["titleGu"],
        "title_en": ch_info["title_en"],
        "descriptionGu": ch_info["descriptionGu"],
        "description_gu": ch_info["descriptionGu"],
        "pdfUrl": pdf_url,
        "pdf_url": pdf_url,
        "file_url": pdf_url,
        "url": pdf_url,
        "gs_url": gs_url,
        "gsUrl": gs_url,
        "storage_path": storage_path,
        "storagePath": storage_path,
        "swadhyayPdfUrl": pdf_url,
        "swadhyay_pdf_url": pdf_url,
        "hasSwadhyay": True,
        "has_swadhyay": True,
        "hasMcq": True,
        "has_mcq": True,
        "hasMixedQuiz": True,
        "has_mixed_quiz": True,
        "order": idx + 1,
        "chapterNumber": c_num,
        "chapter_number": c_num,
        "startPage": start_p,
        "start_page": start_p,
        "endPage": end_p,
        "end_page": end_p,
        "bookStartPage": book_start,
        "book_start_page": book_start,
        "pageNumber": start_p,
        "page_number": start_p,
        "initialPage": initial_p,
        "initial_page": initial_p,
        "pageIndex": initial_p,
        "page_index": initial_p,
        "pdfPageOffset": offset,
        "pdf_page_offset": offset,
        "isActive": True,
        "is_active": True,
        "isDeleted": False,
        "is_deleted": False
    }
    payload["chapters"].append(ch_doc)

    tp_id = f"{ch_id}_tp1"
    payload["topics"].append({
        "topic_id": tp_id,
        "topicId": tp_id,
        "topic_number": 1,
        "chapter_id": ch_id,
        "chapterId": ch_id,
        "subject_id": subject_id,
        "subjectId": subject_id,
        "standard_id": "3",
        "standardId": "3",
        "standard_number": standard_number,
        "title_gu": ch_info["titleGu"],
        "titleGu": ch_info["titleGu"],
        "content_gu": ch_info["descriptionGu"],
        "display_order": 1,
        "keywords": [ch_info["titleGu"], ch_info["title_en"]]
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

# 2. Process Quizzes & Questions
quiz_map = {}
for qz in quizzes_raw:
    ch_id = qz["chapterId"]
    q_list = qz["questions"]
    ch_info = next((c for c in chapters_data if c["id"] == ch_id), None)
    c_num = ch_info["chapterNumber"] if ch_info else 1
    title_gu = ch_info["titleGu"] if ch_info else ""
    title_en = ch_info["title_en"] if ch_info else ""
    tp_id = f"{ch_id}_tp1"

    if q_list:
        quiz_id = f"quiz_std3_math_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std3_math_{ch_id}_{q_idx+1}"

            opts = q_item["options"]
            opts_list = []
            option_map = {}
            for opt in opts:
                opt_id = opt["id"]
                text_gu = opt.get("textGu") or opt.get("text") or ""
                opts_list.append({
                    "id": opt_id, "optionId": opt_id, "option_id": opt_id,
                    "key": opt_id, "value": opt_id, "label": opt_id, "code": opt_id,
                    "text": text_gu, "textGu": text_gu, "text_gu": text_gu,
                    "textEn": text_gu, "text_en": text_gu, "content": text_gu, "title": text_gu
                })
                option_map[opt_id] = text_gu

            correct_ans = str(q_item.get("correctOptionId", "A")).upper()
            q_text = q_item.get("questionTextGu") or q_item.get("questionText") or ""
            explanation = q_item.get("explanationGu") or q_item.get("explanation") or ""

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
                "standardId": "3",
                "standard_id": "3",
                "standard": str(standard_number),
                "standardNumber": standard_number,
                "standard_number": standard_number,
                "questionText": q_text,
                "questionTextGu": q_text,
                "question_text_gu": q_text,
                "question_text": q_text,
                "question": q_text,
                "title": q_text,
                "options": opts_list,
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

        quiz_doc = {
            "id": quiz_id,
            "quiz_id": quiz_id,
            "quizId": quiz_id,
            "chapterId": ch_id,
            "chapter_id": ch_id,
            "subjectId": subject_id,
            "subject_id": subject_id,
            "standardId": "3",
            "standard_id": "3",
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

# 3. Process Flashcards
fc_by_chapter = {}
for idx, fc in enumerate(flashcards_raw):
    ch_id = fc["chapterId"]
    front_gu = fc["frontGu"]
    back_gu = fc["backGu"]
    tp_id = f"{ch_id}_tp1"
    fc_id = f"fc_std3_math_{ch_id}_{idx+1}"

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
        "standard_id": "3",
        "standardId": "3",
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

# 4. Generate AI Knowledge Base Documents for all 14 chapters
for ch_info in chapters_data:
    ch_id = ch_info["id"]
    c_num = ch_info["chapterNumber"]
    title_gu = ch_info["titleGu"]
    title_en = ch_info["title_en"]
    desc_gu = ch_info["descriptionGu"]
    tp_id = f"{ch_id}_tp1"

    q_docs = quiz_map.get(ch_id, [])
    q_summary = "\n".join([f"પ્રશ્ન: {q['questionTextGu']} | જવાબ: {q['correctOptionId']} | સમજૂતી: {q['explanationGu']}" for q in q_docs])

    fcs = fc_by_chapter.get(ch_id, [])
    fc_summary = "\n".join([f"શબ્દાર્થ: {f[0]} -> {f[1]}" for f in fcs])

    content = f"વિષય: ગણિત મેળો (ધોરણ ૩)\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std3_math_{ch_id}",
        "standard_id": "3",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "ગણિત મેળો", "ધોરણ ૩"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std3_maths_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 3 Mathematics payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
