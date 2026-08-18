#!/usr/bin/env python3
"""
Builds complete std4_patrango_payload.json for GCERT Standard 4 Gujarati Patrango (પતરંગો - ગુજરાતી દ્વિતીય ભાષા ધોરણ ૪).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-4%20Patrango%20Gujarati%20Medium.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-4 Patrango Gujarati Medium.pdf"
storage_path = "textbooks/Std-4 Patrango Gujarati Medium.pdf"

subject_id = "sub_patrango_std4_sl"
standard_id = "std_4"
standard_number = 4
session = "1"

chapters_mapping = [
    {
      "id": "sub_patrango_std4_ch1",
      "chapterNumber": 1,
      "titleGu": "તમે શું ખાશો?",
      "title_en": "Tame Shu Khasho?",
      "descriptionGu": "મયૂરપુરીમાં સિમરન બકરીની પાર્ટી, ઝૂમરુ જોકરનો ચપટી જાદુ અને ચૂરમાના લાડુની મજેદાર વાર્તા.",
      "start_page": 7,
      "end_page": 21,
      "pdfPageOffset": 6,
      "pageIndex": 6
    },
    {
      "id": "sub_patrango_std4_ch2",
      "chapterNumber": 2,
      "titleGu": "ચાંદો પાણીમાં કોરોકટ્ટ!",
      "title_en": "Chando Panima Korokatt!",
      "descriptionGu": "તળાવના પાણીમાં ચાંદાના પ્રતિબિંબને પકડવાની વાંદરાના બચ્ચાંઓની ધમાલમસ્તી અને કિપલાલ વાનરદાદાની સમજાવટ.",
      "start_page": 22,
      "end_page": 42,
      "pdfPageOffset": 6,
      "pageIndex": 21
    },
    {
      "id": "sub_patrango_std4_ch3",
      "chapterNumber": 3,
      "titleGu": "ખારા દરિયામાં મારી હોડી",
      "title_en": "Khara Dariyama Mari Hodi",
      "descriptionGu": "કાગળ પર ગાગર અને ભીંતે ચિત્રો દોરવાનું બાળકવિતા તથા દરિયાકાંઠે શંખલાં-છીપલાં વીણવાનું કાવ્ય.",
      "start_page": 43,
      "end_page": 60,
      "pdfPageOffset": 6,
      "pageIndex": 42
    },
    {
      "id": "sub_patrango_std4_ch4",
      "chapterNumber": 4,
      "titleGu": "પાઠશાળામાં રમે પતરંગો",
      "title_en": "Pathshalama Rame Patrango",
      "descriptionGu": "ચમકતા લીલા પતરંગા પક્ષીની શાળામાં રમત, વિમાન અને શટલકૉક પકડવાની મજા તથા શેરી રમતોનું ગીત.",
      "start_page": 61,
      "end_page": 79,
      "pdfPageOffset": 6,
      "pageIndex": 60
    },
    {
      "id": "sub_patrango_std4_ch5",
      "chapterNumber": 5,
      "titleGu": "ખીણમાં તારા : સાપુતારા",
      "title_en": "Khinma Tara : Saputara",
      "descriptionGu": "સુરતથી સાપુતારાનો પ્રવાસ, ડાંગના જંગલો (સાગ, વાંસ), વઘઈ, આહવા અને ખીણમાં તારા જેવા દીવાઓનું સુંદર વર્ણન.",
      "start_page": 80,
      "end_page": 96,
      "pdfPageOffset": 6,
      "pageIndex": 79
    },
    {
      "id": "sub_patrango_std4_ch6",
      "chapterNumber": 6,
      "titleGu": "તમનેય ચંદ્રક મળે",
      "title_en": "Tamney Chandrak Male",
      "descriptionGu": "ગુલાબની સમયસૂચકતાથી સપડાયેલી કુસુમનો જીવ બચવો, અમૃતકાકાનો પર્વત બળદ અને ૧૪ વર્ષની સાહસિક ચારણકન્યા.",
      "start_page": 97,
      "end_page": 114,
      "pdfPageOffset": 6,
      "pageIndex": 96
    },
    {
      "id": "sub_patrango_std4_ch7",
      "chapterNumber": 7,
      "titleGu": "આ પાઠનું નામ આવડે છે?",
      "title_en": "Aa Pathnu Naam Aavde Chhe?",
      "descriptionGu": "મંકુ, બંકુ અને ચિમ્પુ વાંદરાઓનો કેળાંનો ઉપવાસ અને રમુજી રીતે પારણાં થવાની વાર્તા.",
      "start_page": 115,
      "end_page": 130,
      "pdfPageOffset": 6,
      "pageIndex": 114
    }
]

chapters_content = [
    {
      "id": "sub_patrango_std4_ch1",
      "chapterNumber": 1,
      "titleGu": "તમે શું ખાશો?",
      "quizzes": [
        {
          "questionTextGu": "મયૂરપુરીમાં પાર્ટી કોણે આપી હતી?",
          "options": [
            { "id": "A", "textGu": "મીની બિલ્લીએ" },
            { "id": "B", "textGu": "સિમરન બકરીએ" },
            { "id": "C", "textGu": "બાબુ કબૂતરે" },
            { "id": "D", "textGu": "ઝૂમરુ જોકરે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાર્તા મુજબ, સિમરન બકરીને એકલા જમવામાં મજા ન આવી એટલે તેણે બધાને પાર્ટીમાં બોલાવ્યા હતા [૧૬]."
        },
        {
          "questionTextGu": "ઝૂમરુ જોકર રસોઈ પીરસવા માટે શું વગાડતો હતો?",
          "options": [
            { "id": "A", "textGu": "ઢોલક" },
            { "id": "B", "textGu": "સીટી" },
            { "id": "C", "textGu": "ચપટી" },
            { "id": "D", "textGu": "ખંજરી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ઝૂમરુ હસતો જાય અને ચપટી વગાડતો જાય તેમ બધાની થાળીમાં ભોજન પીરસાતું જતું હતું [૧૮]."
        },
        {
          "questionTextGu": "ચોથી ચપટી વગાડતા થાળીમાં કઈ વાનગી પીરસાઈ?",
          "options": [
            { "id": "A", "textGu": "પૂરણપોળી" },
            { "id": "B", "textGu": "બટાકાવડાં" },
            { "id": "C", "textGu": "ટામેટો સૉસ" },
            { "id": "D", "textGu": "ચૂરમાના લાડુ" }
          ],
          "correctOptionId": "D",
          "explanationGu": "પાઠના ગીત મુજબ ચોથી ચપટીએ ચૂરમાના લાડુ પીરસાયા હતા [૧૯]."
        },
        {
          "questionTextGu": "સાતમી ચપટી વાગતા જમવા કોણ આવ્યું જેનાથી બધા ડરી ગયા?",
          "options": [
            { "id": "A", "textGu": "વાઘ" },
            { "id": "B", "textGu": "સિંહ" },
            { "id": "C", "textGu": "વરુ" },
            { "id": "D", "textGu": "રીંછ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સાતમી ચપટીએ જીમી સિંહ આવ્યો અને બધા 'ભાગો.. ભાગો..' ની બૂમો પાડવા લાગ્યા [૧૯]."
        },
        {
          "questionTextGu": "રસગુલ્લાં ગીતમાં દાદા-દાદી પાસે શું નથી, છતાં તે રસગુલ્લાં ચાવે છે?",
          "options": [
            { "id": "A", "textGu": "આંખ" },
            { "id": "B", "textGu": "હાથ" },
            { "id": "C", "textGu": "દાંત" },
            { "id": "D", "textGu": "જીભ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ગીત મુજબ 'દાદા-દાદી કેમ વખાણે? દાંત નથી ને તોપણ ચાવે!' [૨૨]."
        }
      ],
      "flashcards": [
        { "frontGu": "મયૂરપુરી", "backGu": "સિમરન બકરીનું ગામ જ્યાં પાર્ટી યોજાઈ હતી [૧૬]." },
        { "frontGu": "ઝૂમરુ", "backGu": "ચપટી વગાડીને જાદુઈ રીતે રસોઈ પીરસતો જોકર [૧૭]." },
        { "frontGu": "ટીપટોપ", "backGu": "ગીત મુજબ કબૂતર અને પતંગિયું તૈયાર થઈ ગયા હતા તે રીતે [૧૫]." },
        { "frontGu": "ચૂરમાના લાડુ", "backGu": "ચોથી ચપટીએ પીરસાયેલી વાનગી [૧૯]." },
        { "frontGu": "ખુલ્લંખુલ્લા", "backGu": "બાળક પપ્પાની જેમ ચોરીછૂપી નહીં પણ આ રીતે રસગુલ્લાં ખાય છે [૨૨]." }
      ]
    },
    {
      "id": "sub_patrango_std4_ch2",
      "chapterNumber": 2,
      "titleGu": "ચાંદો પાણીમાં કોરોકટ્ટ!",
      "quizzes": [
        {
          "questionTextGu": "તળાવના પાણીમાં ચિંકુએ શું જોયું?",
          "options": [
            { "id": "A", "textGu": "માછલી" },
            { "id": "B", "textGu": "ચાંદો" },
            { "id": "C", "textGu": "કાચબો" },
            { "id": "D", "textGu": "સાપ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ચિંકુએ તળાવના પાણીમાં ચાંદો જોયો અને તેને લાગ્યું કે તે અંદર પડી ગયો છે [૩૧]."
        },
        {
          "questionTextGu": "ટિંકુના મતે પાણીમાં દેખાતી વસ્તુ શું હતી?",
          "options": [
            { "id": "A", "textGu": "દડો" },
            { "id": "B", "textGu": "રોટલી" },
            { "id": "C", "textGu": "સરસ મજાનું ફળ" },
            { "id": "D", "textGu": "રંગ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ટિંકુએ કહ્યું કે 'અરે! હોય કંઈ! આ તો સરસ મજાનું ફળ છે' [૩૨]."
        },
        {
          "questionTextGu": "ચાંદાને બહાર કાઢવા માટે બચ્ચાંઓએ કઈ યુક્તિ કરી?",
          "options": [
            { "id": "A", "textGu": "લાકડી વડે ખેંચવાની" },
            { "id": "B", "textGu": "એકબીજાની પૂંછડી પકડી લટકવાની" },
            { "id": "C", "textGu": "પાણીમાં કૂદવાની" },
            { "id": "D", "textGu": "જાળ નાખવાની" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બચ્ચાંઓએ એકબીજાની પૂંછડી પકડીને ઝાડ પરથી લટકીને ચાંદાને પકડવાની યુક્તિ કરી [૩૩]."
        },
        {
          "questionTextGu": "વાનરદાદાનું નામ શું હતું?",
          "options": [
            { "id": "A", "textGu": "જગ્ગુભાઈ" },
            { "id": "B", "textGu": "કિપલાલ" },
            { "id": "C", "textGu": "લાલિયો" },
            { "id": "D", "textGu": "ખટખટ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બચ્ચાંઓને સાચી સમજ આપનાર વાનરદાદાનું નામ કિપલાલ હતું [૩૪]."
        },
        {
          "questionTextGu": "ચાંદો તળાવમાં અને આકાશમાં બંને જગ્યાએ કેમ દેખાતો હતો?",
          "options": [
            { "id": "A", "textGu": "બે ચાંદા હતા એટલે" },
            { "id": "B", "textGu": "પાણીમાં ચાંદાનો પડછાયો હતો એટલે" },
            { "id": "C", "textGu": "ચાંદો કૂદીને આકાશમાં ગયો એટલે" },
            { "id": "D", "textGu": "ચાંદો પાણીમાં હોતો જ નથી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "આકાશમાં અસલી ચાંદો હતો અને પાણીમાં તેનો પડછાયો (પ્રતિબિંબ) દેખાતો હતો [૩૭]."
        }
      ],
      "flashcards": [
        { "frontGu": "ધમાલમસ્તી", "backGu": "વાંદરાના બચ્ચાં આખો દિવસ આ કામ કરતા હતા [૩૨]." },
        { "frontGu": "કિપલાલ", "backGu": "બચ્ચાંને સમજાવનાર વાનરદાદા [૩૪]." },
        { "frontGu": "તાતા થૈયા", "backGu": "ગીત મુજબ નેહ ભરેલાં નયણાં સામે આ થાય છે [૪૦]." },
        { "frontGu": "ઉપવન", "backGu": "બગીચો અથવા નાનું જંગલ [૩૯]." },
        { "frontGu": "ગપ્પાં", "backGu": "ગીત મુજબ બાળકને ગળ્યાંગળ્યા ગપ્પાં સાથે દોસ્તી છે [૩૧]." }
      ]
    },
    {
      "id": "sub_patrango_std4_ch3",
      "chapterNumber": 3,
      "titleGu": "ખારા દરિયામાં મારી હોડી",
      "quizzes": [
        {
          "questionTextGu": "ગીત મુજબ કાગળ પર શું દોરવાનું છે?",
          "options": [
            { "id": "A", "textGu": "ડોલ" },
            { "id": "B", "textGu": "ગાગર" },
            { "id": "C", "textGu": "માટલું" },
            { "id": "D", "textGu": "ગ્લાસ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગીતની શરૂઆતમાં જ કહ્યું છે કે 'લીધો કોરો કાગળ, દોરી એમાં ગાગર' [૪૭]."
        },
        {
          "questionTextGu": "ભીંતે ભાત પાડવા માટે કેટલી પીંછીઓ લાવ્યા હતા?",
          "options": [
            { "id": "A", "textGu": "ત્રણ" },
            { "id": "B", "textGu": "પાંચ" },
            { "id": "C", "textGu": "સાત" },
            { "id": "D", "textGu": "નવ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કવિતા મુજબ 'લાવ્યો નાની પીંછી સાત, ભીંતે મેં તો પાડી ભાત' [૪૭]."
        },
        {
          "questionTextGu": "ભીંત પર ચિત્ર દોર્યા પછી બાએ શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "શાબાશી આપી" },
            { "id": "B", "textGu": "ટીપ્યો ધૂમ" },
            { "id": "C", "textGu": "નાસ્તો આપ્યો" },
            { "id": "D", "textGu": "રંગ પૂર્યા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ચિત્ર દોર્યા પછી બાળક જ્યારે બૂમ પાડે છે ત્યારે બા આવીને તેને મારે છે [૪૭]."
        },
        {
          "questionTextGu": "દરિયાકાંઠે શંખલાં-છીપલાં વીણીને શું બનાવવાનું છે?",
          "options": [
            { "id": "A", "textGu": "રમકડાં" },
            { "id": "B", "textGu": "ઘર" },
            { "id": "C", "textGu": "માળા" },
            { "id": "D", "textGu": "હાર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કાવ્ય પંક્તિ મુજબ 'શંખલાં છીપલાં વીણીને, માળા રે બનાવીશું' [૫૫]."
        },
        {
          "questionTextGu": "પાણીમાં સંધ્યાના રંગો કોણ બિછાવશે?",
          "options": [
            { "id": "A", "textGu": "વાદળાં" },
            { "id": "B", "textGu": "સૂરજદાદા" },
            { "id": "C", "textGu": "દરિયો" },
            { "id": "D", "textGu": "ચંદ્ર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કાવ્ય મુજબ 'સૂરજદાદા આવશે, સંધ્યા રંગોને પાણીમાં રે બિછાવશે' [૫૫]."
        }
      ],
      "flashcards": [
        { "frontGu": "ગાગર", "backGu": "કાગળ પર દોરેલું પાણી ભરવાનું સાધન [૪૭]." },
        { "frontGu": "ટીપ્યો ધૂમ", "backGu": "ખૂબ જ મારવું [૪૭]." },
        { "frontGu": "બાથ ભીડીશું", "backGu": "મોજાં સાથે લડીશું અથવા પકડીશું [૫૫]." },
        { "frontGu": "હિલ્લોળા", "backGu": "દરિયાના મોજામાં જોવા મળતા હિંચકા જેવા મોજા [૫૫]." },
        { "frontGu": "કોરો કાગળ", "backGu": "જેના પર હોડી અને ગાગર દોરવામાં આવી હતી [૪૭]." }
      ]
    },
    {
      "id": "sub_patrango_std4_ch4",
      "chapterNumber": 4,
      "titleGu": "પાઠશાળામાં રમે પતરંગો",
      "quizzes": [
        {
          "questionTextGu": "પતરંગો કેવા રંગનો પક્ષી છે?",
          "options": [
            { "id": "A", "textGu": "પીળો" },
            { "id": "B", "textGu": "લીલો" },
            { "id": "C", "textGu": "વાદળી" },
            { "id": "D", "textGu": "લાલ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પતરંગો રંગે રૂપાળો અને ચમકતા લીલા રંગનો હોય છે [૬૧]."
        },
        {
          "questionTextGu": "પતરંગાએ છોકરીના કયા રમકડાને જીવડું સમજી પકડી લીધું?",
          "options": [
            { "id": "A", "textGu": "ઢીંગલી" },
            { "id": "B", "textGu": "બૉલ" },
            { "id": "C", "textGu": "વિમાન" },
            { "id": "D", "textGu": "લખોટી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "સફેદ રંગનું વિમાન ઊડતું હતું તેને પતરંગાએ મોટું સફેદ જીવડું સમજી પકડી લીધું [૬૨]."
        },
        {
          "questionTextGu": "પતરંગાએ છોડેલી લખોટી કોના માથા પર પડી?",
          "options": [
            { "id": "A", "textGu": "છોકરીના" },
            { "id": "B", "textGu": "શિક્ષકના" },
            { "id": "C", "textGu": "છોકરાના" },
            { "id": "D", "textGu": "કોઈના નહીં" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ચાંચમાંથી છૂટેલી લખોટી ટપ્પ દઈને છોકરાના માથા પર પડી હતી [૬૨]."
        },
        {
          "questionTextGu": "પતરંગાને સફેદ પીંછાંવાળા કયા જીવડામાં સૌથી વધુ મજા પડી?",
          "options": [
            { "id": "A", "textGu": "પતંગિયું" },
            { "id": "B", "textGu": "ફૂલ (શટલકૉક)" },
            { "id": "C", "textGu": "માખી" },
            { "id": "D", "textGu": "કબૂતર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બાળકો ફૂલ-રૅકેટ રમતા હતા તે ફૂલ પકડવાની પતરંગાને બહુ મજા પડી [૬૪]."
        },
        {
          "questionTextGu": "લંગડીમાં કોણ સૌને પકડવાનો ફાંકો રાખતું હતું?",
          "options": [
            { "id": "A", "textGu": "સંતુ" },
            { "id": "B", "textGu": "નિલ્લમ" },
            { "id": "C", "textGu": "શૈલા" },
            { "id": "D", "textGu": "ભાવેશ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગીત મુજબ 'લંગડીમાં હું સૌને પકડું ફાંકો રાખતી નિલ્લમ' [૬૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "પતરંગો", "backGu": "લીલા રંગનું એક રૂપાળું પક્ષી જે જીવડાં ખાય છે [૬૧]." },
        { "frontGu": "કમ્પાઉન્ડ", "backGu": "શાળાનું પ્રાંગણ અથવા મેદાન [૬૧]." },
        { "frontGu": "ફાંકો રાખવો", "backGu": "ગર્વ અથવા અભિમાન હોવું [૬૯]." },
        { "frontGu": "ચલ્લકચલાણી", "backGu": "આમલી-પીપળી કે લંગડીની રમત દરમિયાન બોલાતો શબ્દ [૬૯]." },
        { "frontGu": "ધમ્મ ધુબાકા", "backGu": "તળાવમાં પાણીમાં પડતા થતો અવાજ અને મજા [૬૯]." }
      ]
    },
    {
      "id": "sub_patrango_std4_ch5",
      "chapterNumber": 5,
      "titleGu": "ખીણમાં તારા : સાપુતારા",
      "quizzes": [
        {
          "questionTextGu": "સાપુતારાનો પ્રવાસ કયા શહેરથી શરૂ થયો હતો?",
          "options": [
            { "id": "A", "textGu": "અમદાવાદ" },
            { "id": "B", "textGu": "સુરત" },
            { "id": "C", "textGu": "વડોદરા" },
            { "id": "D", "textGu": "રાજકોટ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પ્રવાસ સુરતથી બસમાં શરૂ થયો હતો [૮૦]."
        },
        {
          "questionTextGu": "ડાંગ જિલ્લામાં વાંસ સિવાય બીજા કયા કિંમતી ઝાડ થાય છે?",
          "options": [
            { "id": "A", "textGu": "આંબો" },
            { "id": "B", "textGu": "વડ" },
            { "id": "C", "textGu": "સાગ" },
            { "id": "D", "textGu": "પીપળો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ડાંગનાં જંગલોમાં ઊંચી જાતના સાગનાં ઝાડ પણ ખૂબ થાય છે જે ઈમારતી કામમાં વપરાય છે [૮૧]."
        },
        {
          "questionTextGu": "સાપુતારાનો અર્થ શું થાય છે?",
          "options": [
            { "id": "A", "textGu": "તારાઓનું ઘર" },
            { "id": "B", "textGu": "સાપોનું રહેઠાણ" },
            { "id": "C", "textGu": "ઊંચો ડુંગર" },
            { "id": "D", "textGu": "લીલો પ્રદેશ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાર્તા મુજબ સાપુતારા એટલે 'સાપોનું રહેઠાણ' [૮૨]."
        },
        {
          "questionTextGu": "સૂતાં પહેલાં નીચે ખીણ તરફ જોતા શું દેખાતું હતું?",
          "options": [
            { "id": "A", "textGu": "સાપ" },
            { "id": "B", "textGu": "નદી" },
            { "id": "C", "textGu": "આકાશના તારા જેવા દીવાઓનો પ્રકાશ" },
            { "id": "D", "textGu": "વાઘ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ખીણમાં ડાંગીઓના મકાનોમાં દીવાઓનો પ્રકાશ આકાશના તારા ખીણમાં આવી ગયા હોય તેવો લાગતો હતો [૮૩]."
        },
        {
          "questionTextGu": "રીંછના ગીતમાં સિંહને જોઈને શું થયું?",
          "options": [
            { "id": "A", "textGu": "આફત આવી મોટી" },
            { "id": "B", "textGu": "મજા આવી ગઈ" },
            { "id": "C", "textGu": "સિંહ ભાગી ગયો" },
            { "id": "D", "textGu": "રીંછે સોટી મારી" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ગીત મુજબ 'સામે રાણા સિંહ મળ્યા રે, આફત આવી મોટી' [૮૭]."
        }
      ],
      "flashcards": [
        { "frontGu": "વઘઈ", "backGu": "ડાંગ જિલ્લાનું પ્રવેશદ્વાર અને ઈમારતી લાકડાનું કેન્દ્ર [૮૦]." },
        { "frontGu": "આહવા", "backGu": "ડાંગ જિલ્લાનું મુખ્ય મથક [૮૧]." },
        { "frontGu": "ડાંગી", "backGu": "ડાંગ જિલ્લામાં રહેતા લોકો [૮૦]." },
        { "frontGu": "પડઘો (Echo)", "backGu": "સાપુતારામાં ડુંગર પર બોલાયેલા શબ્દનો ફરીથી સંભળાતો અવાજ [૮૨]." },
        { "frontGu": "લબલબ", "backGu": "મધ ખાવા માટે સિંહની જીભ આ રીતે થતી હતી [૮૭]." }
      ]
    },
    {
      "id": "sub_patrango_std4_ch6",
      "chapterNumber": 6,
      "titleGu": "તમનેય ચંદ્રક મળે",
      "quizzes": [
        {
          "questionTextGu": "કુસુમને સાપ કરડ્યો હોવાની જાણ સૌ પ્રથમ કોને થઈ?",
          "options": [
            { "id": "A", "textGu": "શિક્ષકને" },
            { "id": "B", "textGu": "ગુલાબને" },
            { "id": "C", "textGu": "ડૉક્ટરને" },
            { "id": "D", "textGu": "આચાર્યને" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કુસુમે હાથ પાછો ખેંચ્યો ત્યારે તેની આંગળી પર બે ટપકાં જોઈ ગુલાબ સમજી ગઈ હતી [૯૮]."
        },
        {
          "questionTextGu": "ગુલાબે કુસુમના કાંડા પર શું બાંધ્યું?",
          "options": [
            { "id": "A", "textGu": "રૂમાલ" },
            { "id": "B", "textGu": "દોરી" },
            { "id": "C", "textGu": "પોતાનો દુપટ્ટો" },
            { "id": "D", "textGu": "બેલ્ટ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ઝેર શરીરમાં પ્રસરે નહીં તે માટે ગુલાબે પોતાનો દુપટ્ટો કાંડા પર બાંધી દીધો [૯૮]."
        },
        {
          "questionTextGu": "અમૃતકાકાના બળદનું નામ શું હતું?",
          "options": [
            { "id": "A", "textGu": "પહાડ" },
            { "id": "B", "textGu": "પર્વત" },
            { "id": "C", "textGu": "હિમાલય" },
            { "id": "D", "textGu": "લાલિયો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બળદનું શરીર ડુંગર જેવડું હોવાથી કાકાએ તેનું નામ 'પર્વત' પાડ્યું હતું [૧૦૬]."
        },
        {
          "questionTextGu": "ચારણકન્યાની ઉંમર કેટલી હતી?",
          "options": [
            { "id": "A", "textGu": "દસ વરસ" },
            { "id": "B", "textGu": "બાર વરસ" },
            { "id": "C", "textGu": "ચૌદ વરસ" },
            { "id": "D", "textGu": "સોળ વરસ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કવિતા મુજબ 'ચૌદ વરસની ચારણકન્યા' [૧૧૦]."
        },
        {
          "questionTextGu": "ચારણકન્યાએ કોને ભગાડ્યો?",
          "options": [
            { "id": "A", "textGu": "વાઘને" },
            { "id": "B", "textGu": "દીપડાને" },
            { "id": "C", "textGu": "સાવજ (સિંહ) ને" },
            { "id": "D", "textGu": "બળદને" }
          ],
          "correctOptionId": "C",
          "explanationGu": "નાનકડું સાહસ બતાવી ચારણકન્યાએ વનરાવનના રાજા સિંહને ભગાડ્યો હતો [૧૧૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "સમયસૂચકતા", "backGu": "યોગ્ય સમયે સાચો નિર્ણય લેવાની ગુલાબની આવડત [૧૦૦]." },
        { "frontGu": "ચંદ્રક (Medal)", "backGu": "સાહસ કે બહાદુરી માટે મળતું ઈનામ [૯૭]." },
        { "frontGu": "ડાંગ", "backGu": "ચારણકન્યાએ સિંહને ભગાડવા માટે હાથમાં લીધેલી લાકડી [૧૧૦]." },
        { "frontGu": "સાવજ", "backGu": "ગીરના જંગલનો કેસરી સિંહ [૧૦૯]." },
        { "frontGu": "ધમ્માચકડી", "backGu": "બાળકો દ્વારા કરવામાં આવતી મસ્તી અને તોફાન [૯૭]." }
      ]
    },
    {
      "id": "sub_patrango_std4_ch7",
      "chapterNumber": 7,
      "titleGu": "આ પાઠનું નામ આવડે છે?",
      "quizzes": [
        {
          "questionTextGu": "ત્રણ વાંદરાઓના નામ શું હતા?",
          "options": [
            { "id": "A", "textGu": "ચિંકુ, મિંકુ, પિંકુ" },
            { "id": "B", "textGu": "મંકુ, બંકુ, ચિમ્પુ" },
            { "id": "C", "textGu": "લાલિયો, બાબુ, મીની" },
            { "id": "D", "textGu": "ખટખટ, ચટપટ, ઝૂમરુ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાર્તામાં મંકુ, બંકુ અને ચિમ્પુ નામના ત્રણ વાંદરાઓ હતા [૧૧૬]."
        },
        {
          "questionTextGu": "વાંદરાઓએ કયા ફળનો ઉપયોગ કરીને ઉપવાસ કર્યો?",
          "options": [
            { "id": "A", "textGu": "કેરી" },
            { "id": "B", "textGu": "જામફળ" },
            { "id": "C", "textGu": "કેળાં" },
            { "id": "D", "textGu": "સફરજન" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વાંદરાઓને ત્રણ કેળાં મળ્યાં હતાં અને તેમણે તેનો ઉપવાસ કરવાનો હતો [૧૧૬]."
        },
        {
          "questionTextGu": "કેળાને કીડીઓથી બચાવવા ચિમ્પુએ કયો રસ્તો કાઢ્યો?",
          "options": [
            { "id": "A", "textGu": "પાણીમાં મૂકવાનો" },
            { "id": "B", "textGu": "મોઢામાં મૂકી રાખવાનો" },
            { "id": "C", "textGu": "ઝાડે લટકાવવાનો" },
            { "id": "D", "textGu": "દાટી દેવાનો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ચિમ્પુએ કહ્યું કે કેળું મોઢામાં મૂકી રાખીએ તો કીડી ચઢવાનો ડર ન રહે [૧૧૮]."
        },
        {
          "questionTextGu": "વાર્તાના અંતે કેળાં ક્યાં ગયાં?",
          "options": [
            { "id": "A", "textGu": "કીડીઓ ખાઈ ગઈ" },
            { "id": "B", "textGu": "પેટમાં અલોપ થઈ ગયાં" },
            { "id": "C", "textGu": "ચોરાઈ ગયાં" },
            { "id": "D", "textGu": "સડી ગયાં" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મોઢામાં મૂકેલા કેળાં ધીરે ધીરે પેટમાં ઉતરી ગયાં અને ઉપવાસ તૂટી ગયો [૧૧૮]."
        },
        {
          "questionTextGu": "પારણાં કરવા એટલે શું?",
          "options": [
            { "id": "A", "textGu": "ઉપવાસ તોડવો / જમવું" },
            { "id": "B", "textGu": "હિંચકો ખાવો" },
            { "id": "C", "textGu": "ઉંઘી જવું" },
            { "id": "D", "textGu": "દોડવું" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ઉપવાસ પૂરો થયા પછી જે ભોજન લેવાય તેને 'પારણાં કરવા' કહેવાય [૧૨૧]."
        }
      ],
      "flashcards": [
        { "frontGu": "પારણાં", "backGu": "ઉપવાસ પછીનું પ્રથમ ભોજન [૧૨૧]." },
        { "frontGu": "ફાળ", "backGu": "વાંદરાઓ દ્વારા ભરવામાં આવતો મોટો કૂદકો [૧૧૫]." },
        { "frontGu": "અલોપ થવું", "backGu": "ગાયબ થઈ જવું અથવા દેખાતું બંધ થવું [૧૧૮]." },
        { "frontGu": "આબાદ રસ્તો", "backGu": "કોઈ મુશ્કેલીમાંથી બચવા માટેનો શ્રેષ્ઠ ઉપાય [૧૧૮]." },
        { "frontGu": "પંચાત", "backGu": "નકામી માથાકૂટ અથવા ચિંતા [૧૧૮]." }
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
            "name": "Standard 4 Gujarati Patrango",
            "nameGu": "પતરંગો (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૪",
            "name_en": "Standard 4 Gujarati Patrango (Second Language)",
            "name_gu": "પતરંગો (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૪",
            "title": "પતરંગો (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૪",
            "titleGu": "પતરંગો (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૪",
            "title_gu": "પતરંગો (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૪",
            "icon": "🦜",
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
            "title_gu": "પતરંગો (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૪ પાઠ્યપુસ્તક",
            "titleGu": "પતરંગો (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૪ પાઠ્યપુસ્તક",
            "title_en": "Standard 4 Gujarati Patrango Textbook",
            "titleEn": "Standard 4 Gujarati Patrango Textbook",
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

ch_map = {item["id"]: item for item in chapters_mapping}

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
    ch_id = ch_data["id"]
    ch_info = ch_map.get(ch_id)
    if not ch_info:
        continue
    c_num = ch_info["chapterNumber"]
    title_gu = ch_info["titleGu"]
    title_en = ch_info["title_en"]
    tp_id = f"{ch_id}_tp1"

    # Process Quizzes
    q_list = ch_data.get("quizzes", [])
    if q_list:
        quiz_id = f"quiz_std4_patrango_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std4_patrango_{ch_id}_{q_idx+1}"

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
        fc_id = f"fc_std4_patrango_{ch_id}_{fc_idx+1}"

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
            "cardType": "keyword",
            "card_type": "keyword",
            "type": "keyword",
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

# 3. Generate AI Knowledge Base Documents for all 7 chapters
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
    fc_summary = "\n".join([f"શબ્દાર્થ: {f[0]} -> {f[1]}" for f in fcs])

    content = f"વિષય: પતરંગો (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૪\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std4_patrango_{ch_id}",
        "standard_id": "4",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "પતરંગો", "ગુજરાતી", "ધોરણ ૪"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std4_patrango_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 4 Gujarati Patrango payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
