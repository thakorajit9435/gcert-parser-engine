#!/usr/bin/env python3
"""
Builds complete std4_maths_payload.json for GCERT Standard 4 Mathematics (ગણિત-ગમ્મત ધોરણ ૪).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-4%20Ganit%20Gamat%20Gujarati%20Medium.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-4 Ganit Gamat Gujarati Medium.pdf"
storage_path = "textbooks/Std-4 Ganit Gamat Gujarati Medium.pdf"

subject_id = "sub_maths_std4_gm"
standard_id = "std_4"
standard_number = 4
session = "1"

chapters_mapping = [
    {
      "id": "sub_maths_std4_ch1",
      "chapterNumber": 1,
      "titleGu": "ઈંટોની ઇમારત",
      "title_en": "Building with Bricks",
      "descriptionGu": "મુરસીદ કુલી ખાનનો મકબરો, ઈંટોના આકાર (૬ બાજુઓ), જાળી-કમાન-ઝરૂખો પૅટર્ન, ઈંટોની ભઠ્ઠી અને ગણતરી.",
      "start_page": 9,
      "end_page": 20,
      "pdfPageOffset": 8,
      "pageIndex": 8
    },
    {
      "id": "sub_maths_std4_ch2",
      "chapterNumber": 2,
      "titleGu": "લાંબું અને ટૂંકું",
      "title_en": "Long and Short",
      "descriptionGu": "અકબર-બિરબલની રેખાની વાર્તા, સેમી/મીટર/કિમી માપન, ઊંચો કૂદકો, મેરેથોન અને કુતુબમિનારની ઊંચાઈ.",
      "start_page": 21,
      "end_page": 30,
      "pdfPageOffset": 8,
      "pageIndex": 20
    },
    {
      "id": "sub_maths_std4_ch3",
      "chapterNumber": 3,
      "titleGu": "ભોપાલનો પ્રવાસ",
      "title_en": "A Trip to Bhopal",
      "descriptionGu": "૨૧૦ બાળકોનો પ્રવાસ, નર્મદા નદીનો પુલ, ભીમબેટકાના ૧૦,૦૦૦ વર્ષ જૂના ગુફાચિત્રો, ડીઝલનો ખર્ચ અને નૌકાવિહાર.",
      "start_page": 31,
      "end_page": 42,
      "pdfPageOffset": 8,
      "pageIndex": 30
    },
    {
      "id": "sub_maths_std4_ch4",
      "chapterNumber": 4,
      "titleGu": "ટીક – ટીક - ટીક",
      "title_en": "Tick-Tick-Tick",
      "descriptionGu": "ઘડિયાળનું સમય માપન (મિનિટ, કલાક), ૧૨-કલાક અને ૨૪-કલાક પદ્ધતિ, એક્સપાયરી ડેટ અને સમયગાળાની ગણતરી.",
      "start_page": 43,
      "end_page": 59,
      "pdfPageOffset": 8,
      "pageIndex": 42
    },
    {
      "id": "sub_maths_std4_ch5",
      "chapterNumber": 5,
      "titleGu": "દુનિયા જોવાનો રસ્તો",
      "title_en": "The Way The World Looks",
      "descriptionGu": "ગપ્પુ ઉંદરનો દૃષ્ટિકોણ (ઉપરથી, બાજુએથી), દૃશ્યનો નિયમ (Perspective), પાસાના સામસામેના અંકોનો સરવાળો (૭).",
      "start_page": 60,
      "end_page": 67,
      "pdfPageOffset": 8,
      "pageIndex": 59
    },
    {
      "id": "sub_maths_std4_ch6",
      "chapterNumber": 6,
      "titleGu": "ભંગાર વેચનાર",
      "title_en": "The Junk Seller",
      "descriptionGu": "કિરણની ભંગારની દુકાન, ધિરાણ (લોન), રિક્ષાનું ભાડું, નાણાકીય હિસાબ અને મૌખિક ગુણાકાર.",
      "start_page": 68,
      "end_page": 75,
      "pdfPageOffset": 8,
      "pageIndex": 67
    },
    {
      "id": "sub_maths_std4_ch7",
      "chapterNumber": 7,
      "titleGu": "જગ અને મગ",
      "title_en": "Jugs and Mugs",
      "descriptionGu": "ગુંજાશના એકમો (૧ લિટર = ૧૦૦૦ મિલિ), ગ્લાસ અને ઇન્જેક્શનની ગણતરી તથા દૈનિક પાણીનો વપરાશ.",
      "start_page": 76,
      "end_page": 88,
      "pdfPageOffset": 8,
      "pageIndex": 75
    },
    {
      "id": "sub_maths_std4_ch8",
      "chapterNumber": 8,
      "titleGu": "ગાડું અને પૈડાં",
      "title_en": "Carts and Wheels",
      "descriptionGu": "વર્તુળની વિભાવના, કેન્દ્ર (Centre), ત્રિજ્યા (Radius), પરિકરનો ઉપયોગ અને જુદા જુદા પૈડાંનું માપન.",
      "start_page": 89,
      "end_page": 91,
      "pdfPageOffset": 8,
      "pageIndex": 88
    },
    {
      "id": "sub_maths_std4_ch9",
      "chapterNumber": 9,
      "titleGu": "અડધું અને પા",
      "title_en": "Halves and Quarters",
      "descriptionGu": "અપૂર્ણાંક (અડધો ૧/૨, પા ૧/૪, પોણો ૩/૪), ગ્રામ/કિગ્રા અને સિક્કાઓના ભાગની સમજ.",
      "start_page": 92,
      "end_page": 114,
      "pdfPageOffset": 8,
      "pageIndex": 91
    },
    {
      "id": "sub_maths_std4_ch10",
      "chapterNumber": 10,
      "titleGu": "પેટર્નની રમત",
      "title_en": "Play with Patterns",
      "descriptionGu": "સંખ્યા મિનારો (જાદુઈ ટાવર), ૧-૯ નો જાદુઈ ચોરસ, ગુપ્ત સંદેશા (કોડિંગ) અને ભોંયતળિયાની લાદી પૅટર્ન.",
      "start_page": 115,
      "end_page": 127,
      "pdfPageOffset": 8,
      "pageIndex": 114
    },
    {
      "id": "sub_maths_std4_ch11",
      "chapterNumber": 11,
      "titleGu": "ઘડિયા અને ભાગાકાર",
      "title_en": "Tables and Shares",
      "descriptionGu": "સમાન વહેંચણી અને પુનરાવર્તિત બાદબાકી દ્વારા ભાગાકાર, ઘડિયા (ટેબલ્સ) ની બનાવટ અને જૂથ ગણતરી.",
      "start_page": 128,
      "end_page": 140,
      "pdfPageOffset": 8,
      "pageIndex": 127
    },
    {
      "id": "sub_maths_std4_ch12",
      "chapterNumber": 12,
      "titleGu": "કેટલું ભારે? કેટલું હલકું?",
      "title_en": "How Heavy? How Light?",
      "descriptionGu": "વજનના એકમો (૧ કિગ્રા = ૧૦૦૦ ગ્રામ), ત્રાજવું, હાથીના વજનની યુક્તિ અને ટપાલ દરનું કોષ્ટક.",
      "start_page": 141,
      "end_page": 155,
      "pdfPageOffset": 8,
      "pageIndex": 140
    },
    {
      "id": "sub_maths_std4_ch13",
      "chapterNumber": 13,
      "titleGu": "ખેતર અને તેની ફરતે વાડ",
      "title_en": "Fields and Fences",
      "descriptionGu": "આકારની હદ (પરિમિતિ), બાજુઓનો સરવાળો, ચક્ર દોડાવવાનું માપન અને ચોરસ શીટ પર ક્ષેત્રફળ.",
      "start_page": 156,
      "end_page": 169,
      "pdfPageOffset": 8,
      "pageIndex": 155
    },
    {
      "id": "sub_maths_std4_ch14",
      "chapterNumber": 14,
      "titleGu": "સ્માર્ટ ચાર્ટ",
      "title_en": "Smart Charts",
      "descriptionGu": "માહિતી રજૂઆત, પાઈ ચાર્ટ (ચપાટી આલેખ), ચિહ્ન ચાર્ટ (ત્રિકોણ/સંકેત) અને માહિતીનું વિશ્લેષણ.",
      "start_page": 170,
      "end_page": 178,
      "pdfPageOffset": 8,
      "pageIndex": 169
    }
]

chapters_content = [
    {
      "chapterNumber": 1,
      "titleGu": "ઈંટોની ઇમારત",
      "quizzes": [
        {
          "questionTextGu": "જાગૃતિ શાળાના કડિયાઓ ઈંટોની પૅટર્ન જોવા ક્યાં ગયા હતા?",
          "options": [
            { "id": "A", "textGu": "તાજમહાલ" },
            { "id": "B", "textGu": "મુરસીદ કુલી ખાનનો મકબરો" },
            { "id": "C", "textGu": "લાલ કિલ્લો" },
            { "id": "D", "textGu": "કુતુબમિનાર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કડિયાઓ નવી યુક્તિઓ મેળવવા પશ્ચિમ બંગાળમાં આવેલો મુરસીદ કુલી ખાનનો મકબરો જોવા ગયા હતા [૨૩]."
        },
        {
          "questionTextGu": "એક ઈંટમાં કુલ કેટલી બાજુઓ હોય છે?",
          "options": [
            { "id": "A", "textGu": "૪" },
            { "id": "B", "textGu": "૬" },
            { "id": "C", "textGu": "૮" },
            { "id": "D", "textGu": "૧૨" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઈંટ એ લંબઘન આકાર ધરાવે છે અને તેની કુલ ૬ બાજુઓ હોય છે [૨૫]."
        },
        {
          "questionTextGu": "ભારતમાં ઈંટોની કેટલી ભઠ્ઠીઓ હોવાનો અંદાજ છે?",
          "options": [
            { "id": "A", "textGu": "૧૦૦૦" },
            { "id": "B", "textGu": "૫૦૦૦" },
            { "id": "C", "textGu": "એક લાખથી વધુ" },
            { "id": "D", "textGu": "દસ હજાર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ભારતમાં એક સો હજાર (એક લાખ) થી પણ વધારે ઈંટોની ભઠ્ઠીઓ છે [૩૨]."
        },
        {
          "questionTextGu": "ઈંટોની ગોઠવણી દ્વારા દીવાલ પર જે છિદ્રાળુ પૅટર્ન બને છે તેને શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "કમાન" },
            { "id": "B", "textGu": "જાળી" },
            { "id": "C", "textGu": "ઝરૂખો" },
            { "id": "D", "textGu": "ખૂણો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઈંટોની વચ્ચે જગ્યા છોડીને બનાવવામાં આવતી પૅટર્નને 'જાળી' કહેવામાં આવે છે [૨૭]."
        },
        {
          "questionTextGu": "જો ૧૦૦૦ ઈંટોનો ભાવ ₹ ૧૨૦૦ હોય, તો ૫૦૦ ઈંટોનો ભાવ કેટલો થાય?",
          "options": [
            { "id": "A", "textGu": "₹ ૬૦૦" },
            { "id": "B", "textGu": "₹ ૧૨૦૦" },
            { "id": "C", "textGu": "₹ ૩૦૦" },
            { "id": "D", "textGu": "₹ ૮૦૦" }
          ],
          "correctOptionId": "A",
          "explanationGu": "૧૦૦૦ ઈંટોના ૧૨૦૦ હોય તો તેના અડધા એટલે કે ૫૦૦ ઈંટોના ₹ ૬૦૦ થાય [૩૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "બ્રીક (Brick)", "backGu": "ઈંટ [૨૩]" },
        { "frontGu": "પૅટર્ન (Pattern)", "backGu": "ભાત અથવા નમૂનો [૨૨]" },
        { "frontGu": "એક લાખ", "backGu": "એક સો હજાર (૧,૦૦,૦૦૦) [૩૨]" },
        { "frontGu": "કમાન (Arch)", "backGu": "પુલ કે જૂની ઇમારતોમાં જોવા મળતો વળાંકવાળો ભાગ [૨૯]" },
        { "frontGu": "ભોંયતળિયું", "backGu": "ઘર કે શાળાની જમીનનો ભાગ (Floor) [૨૪]" }
      ]
    },
    {
      "chapterNumber": 2,
      "titleGu": "લાંબું અને ટૂંકું",
      "quizzes": [
        {
          "questionTextGu": "અકબરની રેખાને કોણે નાની કરી આપી?",
          "options": [
            { "id": "A", "textGu": "તેના સૈનિકે" },
            { "id": "B", "textGu": "બિરબલે" },
            { "id": "C", "textGu": "રાણીએ" },
            { "id": "D", "textGu": "કોઈએ નહીં" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બિરબલે અકબરની રેખાની નીચે તેનાથી લાંબી રેખા દોરી તેને નાની સાબિત કરી દીધી [૩૫]."
        },
        {
          "questionTextGu": "૧૫૦૦ મીટરની દોડ એટલે કેટલા કિલોમીટર?",
          "options": [
            { "id": "A", "textGu": "૧ કિમી" },
            { "id": "B", "textGu": "૧.૫ કિમી" },
            { "id": "C", "textGu": "૨ કિમી" },
            { "id": "D", "textGu": "૩ કિમી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૧૦૦૦ મીટર એટલે ૧ કિમી, તેથી ૧૫૦૦ મીટર એટલે ૧ અને અડધો (૧.૫) કિમી થાય [૩૯]."
        },
        {
          "questionTextGu": "ઊંચા કૂદકામાં ચંદ્રપાલનો ભારતીય રેકોર્ડ કેટલો છે?",
          "options": [
            { "id": "A", "textGu": "૨ મીટર ૪૫ સેમી" },
            { "id": "B", "textGu": "૨ મીટર ૯ સેમી" },
            { "id": "C", "textGu": "૨ મીટર ૧૭ સેમી" },
            { "id": "D", "textGu": "૧ મીટર ૯૧ સેમી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કોષ્ટક મુજબ ચંદ્રપાલનો ભારતીય રેકોર્ડ ૨ મીટર ૧૭ સેમી છે [૪૦]."
        },
        {
          "questionTextGu": "મેરેથોન દોડ આશરે કેટલા કિલોમીટરની હોય છે?",
          "options": [
            { "id": "A", "textGu": "૧૦ કિમી" },
            { "id": "B", "textGu": "૨૧ કિમી" },
            { "id": "C", "textGu": "૪૦ કિમી" },
            { "id": "D", "textGu": "૫ કિમી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "મેરેથોનમાં લોકોને અંદાજે ૪૦ કિમી જેટલું રસ્તા પર દોડવાનું હોય છે [૩૯]."
        },
        {
          "questionTextGu": "કુતુબમિનારની ઊંચાઈ આશરે કેટલા મીટર છે?",
          "options": [
            { "id": "A", "textGu": "૫૦ મીટર" },
            { "id": "B", "textGu": "૭૨ મીટર" },
            { "id": "C", "textGu": "૧૦૦ મીટર" },
            { "id": "D", "textGu": "૧૫૦ મીટર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પુસ્તક મુજબ કુતુબમિનાર ૭૨ મીટર ઊંચો છે [૪૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "૧ મીટર", "backGu": "૧૦૦ સેન્ટીમીટર [૪૧]" },
        { "frontGu": "૧ કિલોમીટર", "backGu": "૧૦૦૦ મીટર [૩૯]" },
        { "frontGu": "ડિસ્ટન્સ (Distance)", "backGu": "બે બિંદુઓ વચ્ચેનું અંતર [૩૩]" },
        { "frontGu": "સ્કેલ (Scale)", "backGu": "માપપટ્ટી [૩૪]" },
        { "frontGu": "ટૉલેસ્ટ (Tallest)", "backGu": "સૌથી ઊંચું [૩૭]" }
      ]
    },
    {
      "chapterNumber": 3,
      "titleGu": "ભોપાલનો પ્રવાસ",
      "quizzes": [
        {
          "questionTextGu": "ભોપાલના પ્રવાસે કુલ કેટલા બાળકો જઈ રહ્યા હતા?",
          "options": [
            { "id": "A", "textGu": "૧૦૦" },
            { "id": "B", "textGu": "૧૫૦" },
            { "id": "C", "textGu": "૨૧૦" },
            { "id": "D", "textGu": "૨૫૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "બધા ધોરણોના બાળકોની સંખ્યાનો સરવાળો કરતા ૨૧૦ બાળકો થાય છે [૪૮]."
        },
        {
          "questionTextGu": "ભીમબેટકા શાના માટે જાણીતું છે?",
          "options": [
            { "id": "A", "textGu": "મોટા બગીચા માટે" },
            { "id": "B", "textGu": "ગુફાઓ અને ગુફાચિત્રો માટે" },
            { "id": "C", "textGu": "નદી માટે" },
            { "id": "D", "textGu": "રેલવે સ્ટેશન માટે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ભીમબેટકા ૧૦,૦૦૦ વર્ષ જૂના ગુફાચિત્રો માટે પ્રખ્યાત સ્થળ છે [૫૫]."
        },
        {
          "questionTextGu": "નર્મદા નદી પરનો પુલ આશરે કેટલા મીટર પહોળો છે?",
          "options": [
            { "id": "A", "textGu": "૧૦૦ મીટર" },
            { "id": "B", "textGu": "૫૦૦ મીટર" },
            { "id": "C", "textGu": "૧૦૦૦ મીટર" },
            { "id": "D", "textGu": "૨૦૦ મીટર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "આશાબેનના અંદાજ મુજબ નર્મદાનો પટ આશરે ૫૦૦ મીટર પહોળો છે [૫૨]."
        },
        {
          "questionTextGu": "ડબલ ડેકર હોડીમાં બેસવા માટે એક ટિકિટના કેટલા રૂપિયા છે?",
          "options": [
            { "id": "A", "textGu": "₹ ૧૫" },
            { "id": "B", "textGu": "₹ ૨૫" },
            { "id": "C", "textGu": "₹ ૩૦" },
            { "id": "D", "textGu": "₹ ૪૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "હોડીના કોષ્ટક મુજબ ડબલ ડેકરનો ભાવ ₹ ૩૦ છે [૬૨]."
        },
        {
          "questionTextGu": "૧૦૦ લિટર ડીઝલ માટે ₹ ૫૫૦૦ ચૂકવ્યા હોય, તો ૧ લિટરનો ભાવ કેટલો?",
          "options": [
            { "id": "A", "textGu": "₹ ૪૫" },
            { "id": "B", "textGu": "₹ ૫૦" },
            { "id": "C", "textGu": "₹ ૫૫" },
            { "id": "D", "textGu": "₹ ૬૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "૫૫૦૦ ભાગ્યા ૧૦૦ કરતા ૧ લિટર ડીઝલનો ભાવ ₹ ૫૫ મળે [૫૪, ૫૫]."
        }
      ],
      "flashcards": [
        { "frontGu": "એસ્ટિમેટ (Estimate)", "backGu": "અંદાજ કાઢવો [૪૯]" },
        { "frontGu": "નર્મદા", "backGu": "ગુજરાતની મોટી નદી જે ભોપાલના માર્ગમાં આવે છે [૫૨]" },
        { "frontGu": "પઝલ (Puzzle)", "backGu": "ઉખાણાં [૫૯]" },
        { "frontGu": "નૌકાવિહાર", "backGu": "હોડીમાં બેસીને પાણીની સફર કરવી [૬૧]" },
        { "frontGu": "ડીઝલ", "backGu": "બસ ચલાવવા માટે વપરાતું ઇંધણ [૫૪]" }
      ]
    },
    {
      "chapterNumber": 4,
      "titleGu": "ટીક – ટીક - ટીક",
      "quizzes": [
        {
          "questionTextGu": "જો મિનિટ કાંટો ૧૨ પરથી ખસીને ૨ પર આવે તો કેટલી મિનિટ થાય?",
          "options": [
            { "id": "A", "textGu": "૨ મિનિટ" },
            { "id": "B", "textGu": "૫ મિનિટ" },
            { "id": "C", "textGu": "૧૦ મિનિટ" },
            { "id": "D", "textGu": "૧૨ મિનિટ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "દરેક અંક વચ્ચે ૫ મિનિટ હોય છે, તેથી ૨ પર આવતા ૧૦ મિનિટ થાય [૬૬]."
        },
        {
          "questionTextGu": "૨૪ કલાકની ઘડિયાળમાં ૧૩:૦૦ કલાક એટલે કેટલા વાગ્યા?",
          "options": [
            { "id": "A", "textGu": "રાત્રે ૧ વાગ્યા" },
            { "id": "B", "textGu": "બપોરે ૧ વાગ્યા" },
            { "id": "C", "textGu": "સવારે ૧ વાગ્યા" },
            { "id": "D", "textGu": "સાંજે ૩ વાગ્યા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૧૨ કલાક પછી ૧૩:૦૦ એટલે બપોરના ૧ વાગ્યા થાય [૮૩]."
        },
        {
          "questionTextGu": "જો દવાની બોટલ પર 'Exp date 07/18' લખ્યું હોય તો તે ક્યારે લેવી અસલામત છે?",
          "options": [
            { "id": "A", "textGu": "જાન્યુઆરી ૨૦૧૮ પછી" },
            { "id": "B", "textGu": "જુલાઈ ૨૦૧૮ પછી" },
            { "id": "C", "textGu": "માર્ચ ૨૦૧૮ પછી" },
            { "id": "D", "textGu": "ડિસેમ્બર ૨૦૧૮ પછી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૦૭/૧૮ એટલે જુલાઈ ૨૦૧૮, તે પછી દવા વાપરવી અસલામત છે [૮૧]."
        },
        {
          "questionTextGu": "સપ્ટેમ્બર મહિનામાં મુન્નીને પહેલો દાંત આવ્યો, માર્ચમાં જન્મેલી મુન્ની કેટલા મહિનાની હશે?",
          "options": [
            { "id": "A", "textGu": "૪ મહિના" },
            { "id": "B", "textGu": "૫ મહિના" },
            { "id": "C", "textGu": "૬ મહિના" },
            { "id": "D", "textGu": "૮ મહિના" }
          ],
          "correctOptionId": "C",
          "explanationGu": "માર્ચથી સપ્ટેમ્બર ગણતા (એપ્રિલ, મે, જૂન, જુલાઈ, ઓગસ્ટ, સપ્ટેમ્બર) ૬ મહિના થાય [૭૪]."
        },
        {
          "questionTextGu": "રેલવેની ટિકિટ પર સાંજના ૫:૩૦ માટે શું લખ્યું હશે?",
          "options": [
            { "id": "A", "textGu": "૦૫:૩૦" },
            { "id": "B", "textGu": "૧૫:૩૦" },
            { "id": "C", "textGu": "૧૭:૩૦" },
            { "id": "D", "textGu": "૧૯:૩૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "સાંજના ૫:૩૦ એટલે ૧૨ + ૫:૩૦ = ૧૭:૩૦ કલાક [૮૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "am (Antemeridiem)", "backGu": "મધ્યરાત્રિથી બપોરના ૧૨ વાગ્યા સુધીનો સમય [૮૪]" },
        { "frontGu": "pm (Postmeridiem)", "backGu": "બપોરના ૧૨ વાગ્યાથી મધ્યરાત્રિ સુધીનો સમય [૮૪]" },
        { "frontGu": "એક્સપાયરી ડેટ", "backGu": "વસ્તુ વાપરવાની અંતિમ સુરક્ષિત તારીખ [૮૦]" },
        { "frontGu": "રોજનીશી (Daily note)", "backGu": "રોજિંદી ઘટનાઓની નોંધ રાખતી ચોપડી [૭૨]" },
        { "frontGu": "વિકાસ (Growth)", "backGu": "બાળક કે પ્રાણીના મોટા થવાની પ્રક્રિયા [૭૫]" }
      ]
    },
    {
      "chapterNumber": 5,
      "titleGu": "દુનિયા જોવાનો રસ્તો",
      "quizzes": [
        {
          "questionTextGu": "ગપ્પુ ઉંદર ઉપરથી નીચે જોતો હતો ત્યારે તેને જગ પર શું દેખાયું?",
          "options": [
            { "id": "A", "textGu": "દૂધ" },
            { "id": "B", "textGu": "માખણ" },
            { "id": "C", "textGu": "ચીઝ" },
            { "id": "D", "textGu": "ખાંડ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ગપ્પુ ઉંદર ઉપરથી જોઈ શક્યો કે જગ પર ચીઝ પડેલું છે, જ્યારે નીચેથી ચીંકી તે જોઈ શકી નહીં [૮૬]."
        },
        {
          "questionTextGu": "રેલવેના પાટાને ઉપરથી જોતાં તે કેવા દેખાય છે?",
          "options": [
            { "id": "A", "textGu": "વળાંકવાળા" },
            { "id": "B", "textGu": "એકબીજાને સમાંતર સીધા" },
            { "id": "C", "textGu": "ત્રિકોણ જેવા" },
            { "id": "D", "textGu": "ટૂંકા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રેલવેના પાટા ઉપરથી એકસમાન અંતરવાળા સીધા દેખાય છે [૮૯]."
        },
        {
          "questionTextGu": "પાસા (ખોખા) પર સામસામેની બાજુના અંકોનો સરવાળો કેટલો થાય?",
          "options": [
            { "id": "A", "textGu": "૫" },
            { "id": "B", "textGu": "૬" },
            { "id": "C", "textGu": "૭" },
            { "id": "D", "textGu": "૧૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "જાદુઈ ખોખા (પાસા) પર વિરુદ્ધ દિશાના અંકોનો સરવાળો હંમેશા ૭ થાય છે [૯૫]."
        },
        {
          "questionTextGu": "જો પાસા પર અંક ૫ સામે દેખાય, તો તેની વિરુદ્ધ (નીચે) કયો અંક હશે?",
          "options": [
            { "id": "A", "textGu": "૧" },
            { "id": "B", "textGu": "૨" },
            { "id": "C", "textGu": "૩" },
            { "id": "D", "textGu": "૪" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સરવાળો ૭ થવો જોઈએ, તેથી ૫ ની વિરુદ્ધમાં ૨ હોય [૯૫]."
        },
        {
          "questionTextGu": "વસ્તુઓ જ્યારે સામેના છેડે જાય ત્યારે કેવી દેખાય છે?",
          "options": [
            { "id": "A", "textGu": "મોટી અને પહોળી" },
            { "id": "B", "textGu": "નાની અને સાંકડી" },
            { "id": "C", "textGu": "એ જ માપની" },
            { "id": "D", "textGu": "દેખાતી બંધ થાય" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દૃશ્યના નિયમ (Perspective) મુજબ દૂરની વસ્તુઓ નાની અને સાંકડી દેખાય છે [૯૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "ફ્રોમ ધ ટોપ", "backGu": "વસ્તુને ઉપરથી જોવી [૮૯]" },
        { "frontGu": "ફ્રોમ ધ સાઈડ", "backGu": "વસ્તુને બાજુએથી જોવી [૮૯]" },
        { "frontGu": "નેરો (Narrow)", "backGu": "સાંકડું [૯૦]" },
        { "frontGu": "ઓપોઝિટ (Opposite)", "backGu": "વિરુદ્ધ દિશા અથવા સામેનું [૯૫]" },
        { "frontGu": "યોગા", "backGu": "શારીરિક કસરત, જેમાં ઉપરથી જોતાં આકાર અલગ દેખાઈ શકે [૯૦]" }
      ]
    },
    {
      "chapterNumber": 6,
      "titleGu": "ભંગાર વેચનાર",
      "quizzes": [
        {
          "questionTextGu": "કિરણને ભંગારની દુકાન શરૂ કરવા માટે કેટલા રૂપિયાનું ધિરાણ લીધું હતું?",
          "options": [
            { "id": "A", "textGu": "₹ ૧૦૦૦" },
            { "id": "B", "textGu": "₹ ૫૦૦૦" },
            { "id": "C", "textGu": "₹ ૮૦૦૦" },
            { "id": "D", "textGu": "₹ ૧૦૦૦૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કિરણે ૨૦૦૧ માં ધંધો શરૂ કરવા ₹ ૮૦૦૦ ની લોન (ધિરાણ) લીધી હતી [૯૮]."
        },
        {
          "questionTextGu": "જો એક વ્યક્તિ ચાની દુકાને રોજના ₹ ૩૦ કમાય, તો એક મહિનામાં (૩૦ દિવસ) કેટલા કમાશે?",
          "options": [
            { "id": "A", "textGu": "₹ ૬૦૦" },
            { "id": "B", "textGu": "₹ ૯૦૦" },
            { "id": "C", "textGu": "₹ ૩૦૦" },
            { "id": "D", "textGu": "₹ ૧૫૦૦" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૩૦ ગુણ્યા ૩૦ કરતા ₹ ૯૦૦ જવાબ મળે [૯૮]."
        },
        {
          "questionTextGu": "કિરણ એક રિક્ષાના એક દિવસના કેટલા રૂપિયા ભાડું લેતી હતી?",
          "options": [
            { "id": "A", "textGu": "₹ ૧૦" },
            { "id": "B", "textGu": "₹ ૨૦" },
            { "id": "C", "textGu": "₹ ૫૦" },
            { "id": "D", "textGu": "₹ ૫" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કિરણ તેની ૯ રિક્ષાઓમાંથી દરેકના એક દિવસના ₹ ૨૦ ભાડું લેતી હતી [૧૦૦]."
        },
        {
          "questionTextGu": "૧ કિગ્રા લોખંડનો ભાવ ₹ ૨૪ હોય, તો ૧૦ કિગ્રા લોખંડના કેટલા રૂપિયા થાય?",
          "options": [
            { "id": "A", "textGu": "₹ ૨૪૦" },
            { "id": "B", "textGu": "₹ ૧૨૦" },
            { "id": "C", "textGu": "₹ ૪૮૦" },
            { "id": "D", "textGu": "₹ ૨૦૦" }
          ],
          "correctOptionId": "A",
          "explanationGu": "૨૪ ને ૧૦ વડે ગુણતા ₹ ૨૪૦ થાય [૧૦૬]."
        },
        {
          "questionTextGu": "કિરણ રવિવારના દિવસે રિક્ષાનું કેટલું ભાડું લેતી હતી?",
          "options": [
            { "id": "A", "textGu": "₹ ૨૦" },
            { "id": "B", "textGu": "₹ ૧૦" },
            { "id": "C", "textGu": "કંઈ પણ નહીં" },
            { "id": "D", "textGu": "બમણું" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કિરણ રવિવારના દિવસે રિક્ષાનું ભાડું લેતી ન હતી [૧૦૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "ધિરાણ (Loan)", "backGu": "બેંક કે વ્યક્તિ પાસેથી કામ માટે ઉછીના લીધેલા નાણાં [૯૮]" },
        { "frontGu": "મૌખિક ગણતરી", "backGu": "કાગળ-પેન વગર મનમાં ગણતરી કરવાની રીત [૧૦૧]" },
        { "frontGu": "કોસ્ટ (Cost)", "backGu": "વસ્તુની કિંમત [૯૭]" },
        { "frontGu": "સેલ (Sell)", "backGu": "વેચવું [૧૦૪]" },
        { "frontGu": "ડિફીકલ્ટ (Difficult)", "backGu": "અઘરું અથવા મુશ્કેલ [૯૬]" }
      ]
    },
    {
      "chapterNumber": 7,
      "titleGu": "જગ અને મગ",
      "quizzes": [
        {
          "questionTextGu": "૧ લિટર એટલે કેટલા મિલિલિટર (મિલિ)?",
          "options": [
            { "id": "A", "textGu": "૧૦૦ મિલિ" },
            { "id": "B", "textGu": "૫૦૦ મિલિ" },
            { "id": "C", "textGu": "૧૦૦૦ મિલિ" },
            { "id": "D", "textGu": "૧૦ મિલિ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "શિયાળના સમજાવ્યા મુજબ ૧ લિટર એટલે ૧૦૦૦ મિલિ થાય [૧૧૦]."
        },
        {
          "questionTextGu": "૧ લિટર ખીર ભરવા માટે ૨૫૦ મિલિના કેટલા ગ્લાસ જોઈએ?",
          "options": [
            { "id": "A", "textGu": "૨" },
            { "id": "B", "textGu": "૪" },
            { "id": "C", "textGu": "૫" },
            { "id": "D", "textGu": "૧૦" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૨૫૦ મિલિ ચાર વાર લઈએ તો ૧૦૦૦ મિલિ એટલે કે ૧ લિટર પૂર્ણ થાય [૧૧૩]."
        },
        {
          "questionTextGu": "નીતુને ૫ દિવસ સુધી રોજ કેટલા ઇન્જેક્શન લેવાના હતા?",
          "options": [
            { "id": "A", "textGu": "૧" },
            { "id": "B", "textGu": "૨" },
            { "id": "C", "textGu": "૩" },
            { "id": "D", "textGu": "૫" }
          ],
          "correctOptionId": "C",
          "explanationGu": "નીતુને દરરોજના ૩ ઇન્જેક્શન લેવાની સલાહ આપવામાં આવી હતી [૧૧૬]."
        },
        {
          "questionTextGu": "જો એક ઇન્જેક્શનમાં ૫ મિલિ દવા હોય, તો ૩ ઇન્જેક્શનમાં કુલ કેટલી દવા થાય?",
          "options": [
            { "id": "A", "textGu": "૧૦ મિલિ" },
            { "id": "B", "textGu": "૧૫ મિલિ" },
            { "id": "C", "textGu": "૨૦ મિલિ" },
            { "id": "D", "textGu": "૫ મિલિ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૫ ગુણ્યા ૩ કરતા ૧૫ મિલિ દવા થાય [૧૧૬]."
        },
        {
          "questionTextGu": "દાહોદ ગામનું કુટુંબ એક દિવસમાં નાહવા માટે કેટલા લિટર પાણી વાપરે છે?",
          "options": [
            { "id": "A", "textGu": "૩૦ લિટર" },
            { "id": "B", "textGu": "૪૦ લિટર" },
            { "id": "C", "textGu": "૭૫ લિટર" },
            { "id": "D", "textGu": "૨૦ લિટર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કોષ્ટક મુજબ નાહવા માટે ૭૫ લિટર પાણીનો વપરાશ થાય છે [૧૧૮]."
        }
      ],
      "flashcards": [
        { "frontGu": "લિટર (Litre)", "backGu": "ગુંજાશનો મોટો એકમ [૧૧૦]" },
        { "frontGu": "મિલિ (ml)", "backGu": "મિલિલિટર, ગુંજાશનો નાનો એકમ [૧૧૦]" },
        { "frontGu": "ગુંજાશ (Capacity)", "backGu": "વાસણમાં સમાઈ શકે તેવા પ્રવાહીનું માપ [૧૧૦]" },
        { "frontGu": "માપન (Measuring)", "backGu": "વસ્તુનું ચોક્કસ માપ કાઢવું [૧૧૫]" },
        { "frontGu": "અડધો લિટર", "backGu": "૫૦૦ મિલિલિટર [૧૧૦]" }
      ]
    },
    {
      "chapterNumber": 8,
      "titleGu": "ગાડું અને પૈડાં",
      "quizzes": [
        {
          "questionTextGu": "વર્તુળ દોરવા માટે કયા સાધનનો ઉપયોગ થાય છે?",
          "options": [
            { "id": "A", "textGu": "માપપટ્ટી" },
            { "id": "B", "textGu": "પરિકર" },
            { "id": "C", "textGu": "કાતર" },
            { "id": "D", "textGu": "પેન્સિલ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પરિકરની મદદથી કાગળ પર ચોક્કસ વર્તુળ દોરી શકાય છે [૧૨૬]."
        },
        {
          "questionTextGu": "વર્તુળના કેન્દ્રથી તેની સપાટી સુધીના અંતરને શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "વ્યાસ" },
            { "id": "B", "textGu": "પરિઘ" },
            { "id": "C", "textGu": "ત્રિજ્યા" },
            { "id": "D", "textGu": "ખૂણો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કેન્દ્રથી વર્તુળ સુધીની લંબાઈને ત્રિજ્યા (Radius) કહેવામાં આવે છે [૧૨૪]."
        },
        {
          "questionTextGu": "પરિકરનો અણીદાર ભાગ કાગળ પર જે બિંદુએ રહે છે તેને શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "ત્રિજ્યા" },
            { "id": "B", "textGu": "કેન્દ્ર" },
            { "id": "C", "textGu": "વર્તુળ" },
            { "id": "D", "textGu": "ખૂણો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "અણીદાર ભાગ જ્યાં રાખ્યો હોય તે નિશાન વર્તુળનું કેન્દ્ર (Centre) છે [૧૨૭]."
        },
        {
          "questionTextGu": "શું બધાં વાહનોના પૈડાંની ત્રિજ્યા એકસરખી હોય છે?",
          "options": [
            { "id": "A", "textGu": "હા" },
            { "id": "B", "textGu": "ના" },
            { "id": "C", "textGu": "કહી શકાય નહીં" },
            { "id": "D", "textGu": "માત્ર સાયકલના" }
          ],
          "correctOptionId": "B",
          "explanationGu": "જુદા જુદા વાહનો (ટ્રેક્ટર, સાયકલ, બળદગાડું) ના પૈડાં અલગ અલગ માપના હોય છે [૧૨૫]."
        },
        {
          "questionTextGu": "જો લાંબું દોરડું વાપરી વર્તુળ બનાવીએ તો કેવું વર્તુળ બનશે?",
          "options": [
            { "id": "A", "textGu": "નાનું" },
            { "id": "B", "textGu": "મોટું" },
            { "id": "C", "textGu": "ત્રિકોણ" },
            { "id": "D", "textGu": "ચોરસ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ત્રિજ્યા વધારતા (દોરડું લાંબુ કરતા) વર્તુળ મોટું બને છે [૧૨૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "વર્તુળ (Circle)", "backGu": "ગોળ આકૃતિ [૧૨૧]" },
        { "frontGu": "કેન્દ્ર (Centre)", "backGu": "વર્તુળનું મધ્યબિંદુ [૧૨૭]" },
        { "frontGu": "ત્રિજ્યા (Radius)", "backGu": "કેન્દ્રથી વર્તુળ સુધીનું અંતર [૧૨૪]" },
        { "frontGu": "પરિકર (Compass)", "backGu": "વર્તુળ દોરવા માટેનું સાધન [૧૨૬]" },
        { "frontGu": "સંતુલન (Balance)", "backGu": "વસ્તુને કેન્દ્ર પર સ્થિર રાખવાની પ્રક્રિયા [૧૩૦]" }
      ]
    },
    {
      "chapterNumber": 9,
      "titleGu": "અડધું અને પા",
      "quizzes": [
        {
          "questionTextGu": "રોટલીના બે એકસરખા ભાગ કરવાથી દરેક ભાગ કેટલો કહેવાય?",
          "options": [
            { "id": "A", "textGu": "પા" },
            { "id": "B", "textGu": "અડધો (૧/૨)" },
            { "id": "C", "textGu": "પોણો" },
            { "id": "D", "textGu": "આખો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બે સમાન ભાગ પૈકીનો દરેક ભાગ અડધો (૧/૨) કહેવાય છે [૧૩૫]."
        },
        {
          "questionTextGu": "૪ ભાગમાંથી ૧ ભાગને ગાણિતિક ભાષામાં શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "૧/૨" },
            { "id": "B", "textGu": "૧/૪ (પા ભાગ)" },
            { "id": "C", "textGu": "૩/૪" },
            { "id": "D", "textGu": "૪/૧" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૪ ભાગમાંનો ૧ ભાગ એટલે ચોથો ભાગ અથવા પા (૧/૪) ભાગ [૧૩૬]."
        },
        {
          "questionTextGu": "કુંદને ૧૦ રૂપિયામાં કેટલું કોળું ખરીદવાની જીદ કરી હતી?",
          "options": [
            { "id": "A", "textGu": "અડધું" },
            { "id": "B", "textGu": "પા" },
            { "id": "C", "textGu": "આખું" },
            { "id": "D", "textGu": "પોણું" }
          ],
          "correctOptionId": "C",
          "explanationGu": "લોભી કુંદન ૧૦ રૂપિયામાં આખું કોળું લેવા માંગતો હતો [૧૪૦]."
        },
        {
          "questionTextGu": "૧ કિલોગ્રામ (૧૦૦૦ ગ્રામ) ના અડધા કેટલા થાય?",
          "options": [
            { "id": "A", "textGu": "૨૫૦ ગ્રામ" },
            { "id": "B", "textGu": "૫૦૦ ગ્રામ" },
            { "id": "C", "textGu": "૭૫૦ ગ્રામ" },
            { "id": "D", "textGu": "૧૦૦ ગ્રામ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૧૦૦૦ ના અડધા ૫૦૦ ગ્રામ થાય છે [૧૪૫]."
        },
        {
          "questionTextGu": "જો રવિ પાસે ૨ સિક્કા ૫૦ પૈસાના હોય, તો કુલ કેટલા રૂપિયા થયા?",
          "options": [
            { "id": "A", "textGu": "૧ રૂપિયો" },
            { "id": "B", "textGu": "૫૦ પૈસા" },
            { "id": "C", "textGu": "૨ રૂપિયા" },
            { "id": "D", "textGu": "૫ રૂપિયા" }
          ],
          "correctOptionId": "A",
          "explanationGu": "૫૦ + ૫૦ = ૧૦૦ પૈસા એટલે કે ૧ રૂપિયો થાય [૧૪૬]."
        }
      ],
      "flashcards": [
        { "frontGu": "ક્વાર્ટર (Quarter)", "backGu": "ચોથો ભાગ અથવા પા ભાગ (૧/૪) [૧૩૪]" },
        { "frontGu": "હાફ (Half)", "backGu": "અડધો ભાગ (૧/૨) [૧૩૩]" },
        { "frontGu": "પોણો ભાગ", "backGu": "ત્રણ ચતુર્થાંશ (૩/૪) [૧૩૭]" },
        { "frontGu": "કિલોગ્રામ (Weight)", "backGu": "૧૦૦૦ ગ્રામ [૧૪૫]" },
        { "frontGu": "અપૂર્ણાંક", "backGu": "આખી વસ્તુના ભાગ દર્શાવતી સંખ્યા [૧૩૫]" }
      ]
    },
    {
      "chapterNumber": 10,
      "titleGu": "પેટર્નની રમત",
      "quizzes": [
        {
          "questionTextGu": "સંખ્યા મિનારામાં નીચેની લાઈનનો સરવાળો ક્યાં જોવા મળે છે?",
          "options": [
            { "id": "A", "textGu": "બાજુમાં" },
            { "id": "B", "textGu": "નીચે" },
            { "id": "C", "textGu": "ઉપરના ખાનામાં" },
            { "id": "D", "textGu": "ક્યાંય નહીં" }
          ],
          "correctOptionId": "C",
          "explanationGu": "મિનારામાં નીચેની બે સંખ્યાનો સરવાળો તેની બરાબર ઉપરના ખાનામાં લખવામાં આવે છે [૧૪૯]."
        },
        {
          "questionTextGu": "જાદુઈ ચોકઠામાં ૧ થી ૯ અંકોનો દરેક લીટીમાં સરવાળો કેટલો થાય?",
          "options": [
            { "id": "A", "textGu": "૧૦" },
            { "id": "B", "textGu": "૧૨" },
            { "id": "C", "textGu": "૧૫" },
            { "id": "D", "textGu": "૨૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "૧ થી ૯ અંકોના જાદુઈ ચોકઠામાં આડી, ઊભી કે ત્રાંસી દરેક લીટીનો સરવાળો ૧૫ થાય છે [૧૪૮]."
        },
        {
          "questionTextGu": "જો ગુપ્ત સંદેશામાં A=1, B=2 હોય, તો 'JUMP' કેવી રીતે લખાય?",
          "options": [
            { "id": "A", "textGu": "૧૦ ૨૧ ૧૩ ૧૬" },
            { "id": "B", "textGu": "૧૧ ૨૨ ૧૪ ૧૭" },
            { "id": "C", "textGu": "૧ ૨ ૩ ૪" },
            { "id": "D", "textGu": "૨૦ ૧૫ ૧૦ ૫" }
          ],
          "correctOptionId": "A",
          "explanationGu": "J=10, U=21, M=13, P=16 અંકો મુજબ સંદેશો બનશે [૧૫૨]."
        },
        {
          "questionTextGu": "ભોંયતળિયાની લાદીની પૅટર્નમાં લાદીઓ કેવી રીતે ગોઠવાય છે?",
          "options": [
            { "id": "A", "textGu": "વચ્ચે જગ્યા રાખીને" },
            { "id": "B", "textGu": "એકબીજાની ઉપર" },
            { "id": "C", "textGu": "જગ્યા છોડ્યા વગર સંપૂર્ણ ઢાંકી દે તેવી રીતે" },
            { "id": "D", "textGu": "માત્ર ખૂણામાં" }
          ],
          "correctOptionId": "C",
          "explanationGu": "લાદીની પૅટર્ન એવી રીતે હોય છે કે તે જગ્યા છોડ્યા વગર આખા ભોંયતળિયાને ઢાંકી દે [૧૫૫]."
        },
        {
          "questionTextGu": "જો પૅટર્ન ૮૬૪, ૭૬૪, ૬૬૪ હોય તો પછીની સંખ્યા કઈ?",
          "options": [
            { "id": "A", "textGu": "૬૬૪" },
            { "id": "B", "textGu": "૫૬૪" },
            { "id": "C", "textGu": "૪૬૪" },
            { "id": "D", "textGu": "૭૬૪" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દરેક વખતે ૧૦૦ નો ઘટાડો થાય છે, તેથી ૬૬૪ પછી ૫૬૪ આવે [૧૪૭]."
        }
      ],
      "flashcards": [
        { "frontGu": "પૅટર્ન (Pattern)", "backGu": "નિયમબદ્ધ રીતે પુનરાવર્તિત થતી ભાત [૧૧૫]" },
        { "frontGu": "જાદુઈ મિનારો", "backGu": "અંકોનો ટાવર જેમાં સરવાળાનો નિયમ વપરાય છે [૧૪૯]" },
        { "frontGu": "કોડિંગ (Coding)", "backGu": "સાંકેતિક ભાષામાં સંદેશો લખવો [૧૫૩]" },
        { "frontGu": "બ્લૉક પ્રિન્ટિંગ", "backGu": "ઠપ્પાનો ઉપયોગ કરીને બનાવવામાં આવતી પૅટર્ન [૧૧૫]" },
        { "frontGu": "લાદી (Tile)", "backGu": "ભોંયતળિયું સજાવવા માટે વપરાતા ચોક્કસ આકારના ટુકડા [૧૫૫]" }
      ]
    },
    {
      "chapterNumber": 11,
      "titleGu": "ઘડિયા અને ભાગાકાર",
      "quizzes": [
        {
          "questionTextGu": "શ્યામાએ ૧૮ રોપા ૩ હારમાં સમાન રીતે વાવ્યા, તો દરેક હારમાં કેટલા રોપા હશે?",
          "options": [
            { "id": "A", "textGu": "૩" },
            { "id": "B", "textGu": "૬" },
            { "id": "C", "textGu": "૯" },
            { "id": "D", "textGu": "૧૮" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૧૮ ભાગ્યા ૩ કરતા ૬ જવાબ મળે છે [૧૫૬]."
        },
        {
          "questionTextGu": "જો બિલાડીના પગ ગણતા ૨૮ થયા હોય, તો ખોખામાં કેટલી બિલાડીઓ હશે?",
          "options": [
            { "id": "A", "textGu": "૪" },
            { "id": "B", "textGu": "૭" },
            { "id": "C", "textGu": "૧૪" },
            { "id": "D", "textGu": "૨૮" }
          ],
          "correctOptionId": "B",
          "explanationGu": "એક બિલાડીને ૪ પગ હોય, તેથી ૨૮ ભાગ્યા ૪ કરતા ૭ બિલાડીઓ મળે [૧૬૦]."
        },
        {
          "questionTextGu": "દેડકો એક સાથે ૩ કદમ કૂદે છે, તો ૨૭ પર પહોંચવા તેને કેટલા કૂદકા મારવા પડે?",
          "options": [
            { "id": "A", "textGu": "૯" },
            { "id": "B", "textGu": "૩" },
            { "id": "C", "textGu": "૨૭" },
            { "id": "D", "textGu": "૧૦" }
          ],
          "correctOptionId": "A",
          "explanationGu": "૨૭ ભાગ્યા ૩ કરતા ૯ જવાબ મળે છે [૧૬૧]."
        },
        {
          "questionTextGu": "૭નો ઘડિયો કયા બે ઘડિયાના સરવાળાથી બનાવી શકાય?",
          "options": [
            { "id": "A", "textGu": "૧ અને ૬" },
            { "id": "B", "textGu": "૨ અને ૫" },
            { "id": "C", "textGu": "૩ અને ૪" },
            { "id": "D", "textGu": "ઉપરના તમામ" }
          ],
          "correctOptionId": "D",
          "explanationGu": "કોઈપણ બે એવી સંખ્યા જેના સરવાળો ૭ થતો હોય તેના ઘડિયાના ઉપયોગથી ૭નો ઘડિયો બની શકે [૧૫૮, ૧૫૯]."
        },
        {
          "questionTextGu": "ધ્રુવે ૧૧૨ છીપલાંમાંથી ૨૮ છીપલાંની એક એવી કેટલી માળા બનાવી?",
          "options": [
            { "id": "A", "textGu": "૩" },
            { "id": "B", "textGu": "૪" },
            { "id": "C", "textGu": "૫" },
            { "id": "D", "textGu": "૬" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૧૧૨ માંથી ૨૮ ચાર વાર બાદ કરી શકાય છે, તેથી ૪ માળા બનશે [૧૬૪]."
        }
      ],
      "flashcards": [
        { "frontGu": "ટેબલ (Table)", "backGu": "ગાણિતિક ઘડિયો [૧૫૮]" },
        { "frontGu": "ભાગાકાર (Division)", "backGu": "વસ્તુઓની સરખે ભાગે વહેંચણી કરવાની રીત [૧૬૦]" },
        { "frontGu": "હાર (Row)", "backGu": "આડી લાઈનમાં વસ્તુઓની ગોઠવણી [૧૫૭]" },
        { "frontGu": "જૂથ (Group)", "backGu": "સમાન સંખ્યા ધરાવતું ટોળું [૧૬૧]" },
        { "frontGu": "છીપલાં (Shells)", "backGu": "દરિયાકિનારે મળતી વસ્તુ, જેનો ઉપયોગ ગણતરી માટે થઈ શકે [૧૬૩]" }
      ]
    },
    {
      "chapterNumber": 12,
      "titleGu": "કેટલું ભારે? કેટલું હલકું?",
      "quizzes": [
        {
          "questionTextGu": "૭૦૦ કિગ્રાથી વધારે ભાર કોણ ખેંચી શકતું નહોતું?",
          "options": [
            { "id": "A", "textGu": "હાથી" },
            { "id": "B", "textGu": "બળદ" },
            { "id": "C", "textGu": "ઘોડો" },
            { "id": "D", "textGu": "ગધેડો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ઘોડો નાદુરસ્ત હોવાથી ૭૦૦ કિગ્રાથી વધુ ભાર ખેંચી શકતો ન હતો [૧૭૩]."
        },
        {
          "questionTextGu": "૧ કિલોગ્રામ (કિગ્રા) એટલે કેટલા ગ્રામ?",
          "options": [
            { "id": "A", "textGu": "૧૦૦ ગ્રામ" },
            { "id": "B", "textGu": "૫૦૦ ગ્રામ" },
            { "id": "C", "textGu": "૧૦૦૦ ગ્રામ" },
            { "id": "D", "textGu": "૧૦ ગ્રામ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વજનના એકમ મુજબ ૧ કિગ્રા બરાબર ૧૦૦૦ ગ્રામ થાય [૧૭૯]."
        },
        {
          "questionTextGu": "હાથીનું વજન માપવા માટે વૈદિકાની દીકરીએ શાનો ઉપયોગ કર્યો?",
          "options": [
            { "id": "A", "textGu": "મોટું ત્રાજવું" },
            { "id": "B", "textGu": "મોટી હોડી અને નદી" },
            { "id": "C", "textGu": "વજન કાંટો" },
            { "id": "D", "textGu": "ઝાડની ડાળી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તેણે હોડી પાણીમાં કેટલી ડૂબે છે તેના પરથી હાથીનું વજન શોધવાની યુક્તિ કરી [૧૮૩]."
        },
        {
          "questionTextGu": "૧૩ કિગ્રાના પથ્થરના કયા ત્રણ ટુકડા થયા હતા?",
          "options": [
            { "id": "A", "textGu": "૧, ૫, ૭ કિગ્રા" },
            { "id": "B", "textGu": "૨, ૫, ૬ કિગ્રા" },
            { "id": "C", "textGu": "૩, ૪, ૬ કિગ્રા" },
            { "id": "D", "textGu": "૨, ૪, ૭ કિગ્રા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "અબ્દુના પથ્થરના ૨ કિગ્રા, ૫ કિગ્રા અને ૬ કિગ્રાના ત્રણ ટુકડા થયા હતા [૧૮૪]."
        },
        {
          "questionTextGu": "પોસ્ટકાર્ડની કિંમત કેટલી છે?",
          "options": [
            { "id": "A", "textGu": "₹ ૨.૫૦" },
            { "id": "B", "textGu": "₹ ૫.૦૦" },
            { "id": "C", "textGu": "₹ ૦.૫૦" },
            { "id": "D", "textGu": "₹ ૬.૦૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ટપાલના દરના કોષ્ટક મુજબ એક જ પોસ્ટકાર્ડની કિંમત ₹ ૦.૫૦ છે [૧૮૫]."
        }
      ],
      "flashcards": [
        { "frontGu": "વજન (Weight)", "backGu": "વસ્તુ કેટલું દળ ધરાવે છે તેનું માપ [૧૭૩]" },
        { "frontGu": "લાઈટેસ્ટ (Lightest)", "backGu": "સૌથી હલકું [૧૭૫]" },
        { "frontGu": "હેવિએસ્ટ (Heaviest)", "backGu": "સૌથી ભારે [૧૭૫]" },
        { "frontGu": "ત્રાજવું", "backGu": "વજન માપવા માટેનું સાધન [૧૭૪]" },
        { "frontGu": "એક્સપાયરી ડેટ", "backGu": "દવા કે ખોરાક વાપરવાની છેલ્લી સુરક્ષિત તારીખ [૮૧]" }
      ]
    },
    {
      "chapterNumber": 13,
      "titleGu": "ખેતર અને તેની ફરતે વાડ",
      "quizzes": [
        {
          "questionTextGu": "રહેમતના ખેતરની હદની કુલ લંબાઈ કેટલી હતી?",
          "options": [
            { "id": "A", "textGu": "૧૫ મીટર" },
            { "id": "B", "textGu": "૨૧ મીટર" },
            { "id": "C", "textGu": "૫૪ મીટર" },
            { "id": "D", "textGu": "૭૦ મીટર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "૯+૯+૧૫+૨૧ મીટરનો સરવાળો કરતા ૫૪ મીટર થાય છે [૧૯૦]."
        },
        {
          "questionTextGu": "જો કોઈ ખેતર ચોરસ હોય અને તેની એક બાજુ ૧૫ મીટર હોય, તો હદ કેટલી થાય?",
          "options": [
            { "id": "A", "textGu": "૧૫ મીટર" },
            { "id": "B", "textGu": "૩૦ મીટર" },
            { "id": "C", "textGu": "૬૦ મીટર" },
            { "id": "D", "textGu": "૪૫ મીટર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ચોરસની ચારેય બાજુ સમાન હોય, તેથી ૧૫ ગુણ્યા ૪ = ૬૦ મીટર થાય [૧૯૧]."
        },
        {
          "questionTextGu": "ચંદુના ખેતરની હદ ૫૦૦ મીટર છે, તે રોજ ૪ ચક્કર મારે તો કેટલું દોડતો હશે?",
          "options": [
            { "id": "A", "textGu": "૧ કિમી" },
            { "id": "B", "textGu": "૨ કિમી" },
            { "id": "C", "textGu": "૫૦૦ મીટર" },
            { "id": "D", "textGu": "૪ કિમી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૫૦૦ ગુણ્યા ૪ = ૨૦૦૦ મીટર એટલે કે ૨ કિમી થાય [૧૯૨]."
        },
        {
          "questionTextGu": "૧ મીટર ૫૦ સેમી લાંબા ટેબલક્લોથની હદ શોધવા માટે ૫૦ સેમી બાજુને કેટલી વાર ગણવી પડે?",
          "options": [
            { "id": "A", "textGu": "૧ વાર" },
            { "id": "B", "textGu": "૨ વાર" },
            { "id": "C", "textGu": "૪ વાર" },
            { "id": "D", "textGu": "૩ વાર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "લંબચોરસ ટેબલક્લોથમાં સામસામેની બે પહોળાઈ ૫૦ સેમીની હોય છે [૧૯૩]."
        },
        {
          "questionTextGu": "હૉકીનું મેદાન કેટલા મીટર પહોળું હોય છે?",
          "options": [
            { "id": "A", "textGu": "૯૧ મીટર" },
            { "id": "B", "textGu": "૫૫ મીટર" },
            { "id": "C", "textGu": "૪૦ મીટર" },
            { "id": "D", "textGu": "૧૦૦ મીટર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "હૉકીનું મેદાન ૫૫ મીટર પહોળું હોય છે [૧૯૬]."
        }
      ],
      "flashcards": [
        { "frontGu": "હદ (Boundary)", "backGu": "આકારની કિનારીની કુલ લંબાઈ [૧૯૦]" },
        { "frontGu": "પરિમિતિ", "backGu": "આકારની બધી બાજુઓનો સરવાળો [૧૯૧]" },
        { "frontGu": "સ્ક્વૅર શીટ", "backGu": "ચોરસ ખાનાવાળો કાગળ, ક્ષેત્રફળ માપવા માટે વપરાય [૧૯૩]" },
        { "frontGu": "વાડ (Fence)", "backGu": "ખેતરનું રક્ષણ કરવા માટે ફરતે કરવામાં આવતી કવચ [૧૯૦]" },
        { "frontGu": "દોરીનો ઉપયોગ", "backGu": "વક્ર આકારની હદ માપવા માટેની રીત [૧૯૩]" }
      ]
    },
    {
      "chapterNumber": 14,
      "titleGu": "સ્માર્ટ ચાર્ટ",
      "quizzes": [
        {
          "questionTextGu": "વર્તુળ આલેખને બીજા કયા નામે ઓળખવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "ચોરસ આલેખ" },
            { "id": "B", "textGu": "ચપાટી આલેખ" },
            { "id": "C", "textGu": "મિનારા આલેખ" },
            { "id": "D", "textGu": "લાંબો આલેખ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વર્તુળ આલેખને તેની ગોળાઈના કારણે 'ચપાટી આલેખ' (પાઈ ચાર્ટ) પણ કહેવાય છે [૨૧૦]."
        },
        {
          "questionTextGu": "જો શાળાના ૨૦૦ વિદ્યાર્થીઓમાંથી અડધા રમત મંડળમાં હોય, તો તેની સંખ્યા કેટલી?",
          "options": [
            { "id": "A", "textGu": "૫૦" },
            { "id": "B", "textGu": "૧૦૦" },
            { "id": "C", "textGu": "૧૫૦" },
            { "id": "D", "textGu": "૨૦૦" }
          ],
          "correctOptionId": "B",
          "explanationGu": "૨૦૦ ના અડધા ૧૦૦ થાય છે [૨૧૧]."
        },
        {
          "questionTextGu": "કવિતામાં કયો મૂળાક્ષર સૌથી વધુ વપરાયો છે?",
          "options": [
            { "id": "A", "textGu": "ક" },
            { "id": "B", "textGu": "મ" },
            { "id": "C", "textGu": "હ" },
            { "id": "D", "textGu": "ર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "આપેલ કવિતામાં 'હ' મૂળાક્ષર વારંવાર જોવા મળે છે [૨૦૬]."
        },
        {
          "questionTextGu": "નાટકનો ચાર્ટ બનાવવા માટે ૩ બાળકો માટે કયો સંકેત વપરાયો છે?",
          "options": [
            { "id": "A", "textGu": "ચોરસ" },
            { "id": "B", "textGu": "ત્રિકોણ" },
            { "id": "C", "textGu": "ગોળ" },
            { "id": "D", "textGu": "તારો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નાટક ચાર્ટમાં એક ત્રિકોણ એટલે ૩ બાળકો એવો સંકેત આપવામાં આવ્યો છે [૨૦૮]."
        },
        {
          "questionTextGu": "સૌથી મોટું માથું કોનું છે તે જાણવા કયા સાધનનો ઉપયોગ આલેખમાં થયો?",
          "options": [
            { "id": "A", "textGu": "લાકડી" },
            { "id": "B", "textGu": "પેપરની પટ્ટીઓ" },
            { "id": "C", "textGu": "દોરડું" },
            { "id": "D", "textGu": "રબર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "માથાના માપની લાંબી પેપર પટ્ટીઓ કાપી તેને આલેખ પર ચોંટાડવામાં આવી હતી [૨૦૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "ચપાટી આલેખ", "backGu": "વર્તુળ આલેખ અથવા પાઈ ચાર્ટ [૨૧૦]" },
        { "frontGu": "સ્માર્ટ ચાર્ટ", "backGu": "માહિતીને આકર્ષક અને સરળ રીતે રજૂ કરવાની રીત [૨૦૧]" },
        { "frontGu": "વન-ફોર્થ (1/4)", "backGu": "એક-ચતુર્થાંશ અથવા ચોથો ભાગ [૨૧૧]" },
        { "frontGu": "માહિતી (Data)", "backGu": "એકઠી કરેલી વિગતો કે આંકડા [૨૦૨]" },
        { "frontGu": "ટ્રી-હાઉસ", "backGu": "વૃક્ષ પર બનાવેલું ઘર, જેની ઊંચાઈ માપી શકાય [૧૭૨]" }
      ]
    }
]

payload = {
    "subjects": [
        {
            "id": subject_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standardId": "4",
            "standard_id": "4",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "4",
            "session": session,
            "name": "Standard 4 Mathematics Ganit Gamat",
            "nameGu": "ગણિત-ગમ્મત (ધોરણ ૪)",
            "name_en": "Standard 4 Mathematics Ganit Gamat",
            "name_gu": "ગણિત-ગમ્મત (ધોરણ ૪)",
            "title": "ગણિત-ગમ્મત (ધોરણ ૪)",
            "titleGu": "ગણિત-ગમ્મત (ધોરણ ૪)",
            "title_gu": "ગણિત-ગમ્મત (ધોરણ ૪)",
            "icon": "📐",
            "order": 1,
            "total_chapters": len(chapters_mapping),
            "totalChapters": len(chapters_mapping),
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
            "title_gu": "ગણિત-ગમ્મત (ધોરણ ૪) પાઠ્યપુસ્તક",
            "titleGu": "ગણિત-ગમ્મત (ધોરણ ૪) પાઠ્યપુસ્તક",
            "title_en": "Standard 4 Mathematics Ganit Gamat Textbook",
            "titleEn": "Standard 4 Mathematics Ganit Gamat Textbook",
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "4",
            "standardId": "4",
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
            "total_chapters": len(chapters_mapping)
        }
    ],
    "sessions": [
        {
            "session_id": f"session_{standard_id}_sem{session}",
            "standardId": "4",
            "standard_id": "4",
            "session": session,
            "title": "વાર્ષિક (સત્ર ૧ અને ૨)",
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

ch_map = {item["chapterNumber"]: item for item in chapters_mapping}

# 1. Process Chapters, Topics, SubTopics
for idx, ch_info in enumerate(chapters_mapping):
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
        "standardId": "4",
        "standard_id": "4",
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
        "standard_id": "4",
        "standardId": "4",
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

# 2. Process Quizzes and Flashcards
quiz_map = {}
fc_by_chapter = {}

for ch_data in chapters_content:
    c_num = ch_data["chapterNumber"]
    ch_info = ch_map.get(c_num)
    if not ch_info:
        continue
    ch_id = ch_info["id"]
    title_gu = ch_info["titleGu"]
    title_en = ch_info["title_en"]
    tp_id = f"{ch_id}_tp1"

    # Process Quizzes
    q_list = ch_data.get("quizzes", [])
    if q_list:
        quiz_id = f"quiz_std4_maths_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std4_maths_{ch_id}_{q_idx+1}"

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
                "standardId": "4",
                "standard_id": "4",
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
            "standardId": "4",
            "standard_id": "4",
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
    fc_list = ch_data.get("flashcards", [])
    for fc_idx, fc in enumerate(fc_list):
        front_gu = fc["frontGu"]
        back_gu = fc["backGu"]
        fc_id = f"fc_std4_maths_{ch_id}_{fc_idx+1}"

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
            "standard_id": "4",
            "standardId": "4",
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
            "cardType": "concept",
            "card_type": "concept",
            "type": "concept",
            "order": fc_idx + 1,
            "difficulty_level": "easy",
            "isActive": True,
            "is_active": True,
            "is_premium": False,
            "is_ai_generated": True,
            "isDeleted": False,
            "is_deleted": False
        }
        payload["flashcards"].append(fc_doc)

# 3. Generate AI Knowledge Base Documents for all 14 chapters
for ch_info in chapters_mapping:
    ch_id = ch_info["id"]
    c_num = ch_info["chapterNumber"]
    title_gu = ch_info["titleGu"]
    title_en = ch_info["title_en"]
    desc_gu = ch_info["descriptionGu"]
    tp_id = f"{ch_id}_tp1"

    q_docs = quiz_map.get(ch_id, [])
    q_summary = "\n".join([f"પ્રશ્ન: {q['questionTextGu']} | જવાબ: {q['correctOptionId']} | સમજૂતી: {q['explanationGu']}" for q in q_docs])

    fcs = fc_by_chapter.get(ch_id, [])
    fc_summary = "\n".join([f"ગાણિતિક સંકલ્પના: {f[0]} -> {f[1]}" for f in fcs])

    content = f"વિષય: ગણિત-ગમ્મત (ધોરણ ૪)\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nગાણિતિક સંકલ્પનાઓ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std4_maths_{ch_id}",
        "standard_id": "4",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "ગણિત", "ગણિત-ગમ્મત", "ધોરણ ૪"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std4_maths_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 4 Mathematics payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
