#!/usr/bin/env python3
"""
Builds complete std4_kuhu_payload.json for GCERT Standard 4 Gujarati Kuhu (કુહૂ - ગુજરાતી પ્રથમ ભાષા ધોરણ ૪).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-4%20Kuhu%20Gujarati%20First%20Lang.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-4 Kuhu Gujarati First Lang.pdf"
storage_path = "textbooks/Std-4 Kuhu Gujarati First Lang.pdf"

subject_id = "sub_kuhu_std4_fl"
standard_id = "std_4"
standard_number = 4
session = "1"

chapters_mapping = [
    {
      "id": "sub_kuhu_std4_ch1",
      "chapterNumber": 1,
      "titleGu": "ખિસ્સામાં પહેલવાન? હા!",
      "title_en": "Khissama Pahelvan? Ha!",
      "descriptionGu": "ચણાની વાર્તા, ખિસ્સાની સફર (સૂરજદાદા, ધોબીભાઈ, દરજીકાકા) અને નાનકડા ખિસ્સાનું સુંદર બાળગીત.",
      "start_page": 1,
      "end_page": 18,
      "pdfPageOffset": 0,
      "pageIndex": 0
    },
    {
      "id": "sub_kuhu_std4_ch2",
      "chapterNumber": 2,
      "titleGu": "તેને તે ઊગશે?",
      "title_en": "Tene Te Ugshe?",
      "descriptionGu": "કૂકડીની ઊડવાની તીવ્ર ઈચ્છા, પથરા પર ચડવાની સફળતા અને માથે કલગી ઊગવાની વાર્તા.",
      "start_page": 19,
      "end_page": 36,
      "pdfPageOffset": 0,
      "pageIndex": 18
    },
    {
      "id": "sub_kuhu_std4_ch3",
      "chapterNumber": 3,
      "titleGu": "શંખલાની બહેન છીપલી",
      "title_en": "Shankhlani Bahen Chhipli",
      "descriptionGu": "દિવ્યેશની હોશિયારી, કારેલાંના બીની કલાત્મક રાખડીઓ, રક્ષાબંધનની ઉજવણી અને ભાઈબહેનનું ગીત.",
      "start_page": 37,
      "end_page": 54,
      "pdfPageOffset": 0,
      "pageIndex": 36
    },
    {
      "id": "sub_kuhu_std4_ch4",
      "chapterNumber": 4,
      "titleGu": "સિંહ ઘૂઘવે બકરો ભાગે",
      "title_en": "Sinh Ghughve Bakro Bhage",
      "descriptionGu": "સિંહણ દ્વારા ઉછેરાયેલા બકરા (મોટિયા) ની વાર્તા અને દરિયા (મહાસાગર) નું કાવ્ય વર્ણન.",
      "start_page": 55,
      "end_page": 72,
      "pdfPageOffset": 0,
      "pageIndex": 54
    },
    {
      "id": "sub_kuhu_std4_ch5",
      "chapterNumber": 5,
      "titleGu": "પવન ખિજાય તો ગોળ ઝાપટો",
      "title_en": "Pavan Khijay To Gol Zhapto",
      "descriptionGu": "મિન્ટુભાઈ મકોડાની ગોળ ખાવાની જિદ્દ, શેરડીના ખેતરમાં ચીચોડાની સફર અને અટકચાળા પવનનું ગીત.",
      "start_page": 73,
      "end_page": 90,
      "pdfPageOffset": 0,
      "pageIndex": 72
    },
    {
      "id": "sub_kuhu_std4_ch6",
      "chapterNumber": 6,
      "titleGu": "ભાઈબંધ મારો બોલ્યો કુહૂ",
      "title_en": "Bhaiband Maro Bolyo Kuhu",
      "descriptionGu": "ગોફણબાજ બોધરાજનું પરિવર્તન, ગોદામમાં બ્રાહ્મણી કાબરના બચ્ચાંનું સમડીથી રક્ષણ.",
      "start_page": 91,
      "end_page": 108,
      "pdfPageOffset": 0,
      "pageIndex": 90
    },
    {
      "id": "sub_kuhu_std4_ch7",
      "chapterNumber": 7,
      "titleGu": "નખ્ખમ્ ધખ્ખમ્ ધડાપડાબૂમ્",
      "title_en": "Nakhkham Dhakhkham Dhadapdabum",
      "descriptionGu": "બાવા બનેલા બચુની કવિતા, તૃપ્તિ અને અંશુલના જાદુના પ્રયોગોનું રહસ્ય.",
      "start_page": 109,
      "end_page": 126,
      "pdfPageOffset": 0,
      "pageIndex": 108
    },
    {
      "id": "sub_kuhu_std4_ch8",
      "chapterNumber": 8,
      "titleGu": "ટામેટાની દડી, રમે દાદાદાદી",
      "title_en": "Tametani Dadi, Rame Dadadadi",
      "descriptionGu": "ફ્રીઝમાં ટમેટાની ઠંડીનું ગીત, દાદાદાદીની બાળપણની મારદડી અને દાંડીકૂચની રમતો.",
      "start_page": 127,
      "end_page": 144,
      "pdfPageOffset": 0,
      "pageIndex": 126
    },
    {
      "id": "sub_kuhu_std4_ch9",
      "chapterNumber": 9,
      "titleGu": "કમળજળકમળજળકમળજળકમળ",
      "title_en": "Kamaljal-Kamaljal",
      "descriptionGu": "યમુના નદીના ધરામાં કૃષ્ણ દ્વારા કાલિય નાગનું મર્દન અને નાગદમન કાવ્ય રજૂઆત.",
      "start_page": 145,
      "end_page": 162,
      "pdfPageOffset": 0,
      "pageIndex": 144
    },
    {
      "id": "sub_kuhu_std4_ch10",
      "chapterNumber": 10,
      "titleGu": "રંગેસંગે કામ કરો",
      "title_en": "Rangesange Kaam Karo",
      "descriptionGu": "ટૉમ સૉયરની યુક્તિથી દીવાલ રંગવાની મજેદાર વાર્તા અને 'મોસમ આવી મહેનતની' વર્ષાગીત.",
      "start_page": 163,
      "end_page": 180,
      "pdfPageOffset": 0,
      "pageIndex": 162
    }
]

chapters_content = [
    {
      "chapterNumber": 1,
      "titleGu": "ખિસ્સામાં પહેલવાન? હા!",
      "quizzes": [
        {
          "questionTextGu": "એક ચણો ખાડામાં પડ્યો ત્યારે શું થયું?",
          "options": [
            { "id": "A", "textGu": "તે ડૂબી ગયો" },
            { "id": "B", "textGu": "તેના આંસુથી તળાવ બની ગયું" },
            { "id": "C", "textGu": "તે ઉડી ગયો" },
            { "id": "D", "textGu": "તે સુકાઈ ગયો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કવિતા મુજબ ચણો ખાડામાં પડ્યો અને રડ્યો, જેના આંસુથી ખાડામાં તળાવ બની ગયું [૩૩]."
        },
        {
          "questionTextGu": "ખિસ્સું કોની પાસે જવા માંગતું હતું?",
          "options": [
            { "id": "A", "textGu": "પેન્ટ પાસે" },
            { "id": "B", "textGu": "બુશકોટ પાસે" },
            { "id": "C", "textGu": "ટોપી પાસે" },
            { "id": "D", "textGu": "રૂમાલ પાસે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નાનકડું ખિસ્સું નવા નવા બુશકોટ પર બેસવાની ઈચ્છા ધરાવતું હતું [૩૫]."
        },
        {
          "questionTextGu": "ખિસ્સાને કોણે સુકવી દીધું?",
          "options": [
            { "id": "A", "textGu": "પવનદેવે" },
            { "id": "B", "textGu": "ધોબીભાઈએ" },
            { "id": "C", "textGu": "સૂરજદાદાએ" },
            { "id": "D", "textGu": "દરજીકાકાએ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "સૂરજદાદાએ વહાલથી હાથ ફેરવીને ભીંજાયેલા ખિસ્સાને સુકવી દીધું [૩૬]."
        },
        {
          "questionTextGu": "ખિસ્સાની કરચલીઓ કોણે દૂર કરી?",
          "options": [
            { "id": "A", "textGu": "નીરજભાઈએ" },
            { "id": "B", "textGu": "દરજીભાઈએ" },
            { "id": "C", "textGu": "પોલીમાસીએ" },
            { "id": "D", "textGu": "ધોબીભાઈએ" }
          ],
          "correctOptionId": "D",
          "explanationGu": "ધોબીભાઈએ ગરમ ઈસ્ત્રી ફેરવીને ખિસ્સાની બધી કરચલીઓ ગુમ કરી દીધી [૩૭]."
        },
        {
          "questionTextGu": "ખિસ્સું છેલ્લે કોના બુશકોટ પર ચોંટી ગયું?",
          "options": [
            { "id": "A", "textGu": "રમણભાઈના" },
            { "id": "B", "textGu": "નીરજભાઈના" },
            { "id": "C", "textGu": "અક્ષયભાઈના" },
            { "id": "D", "textGu": "દિવ્યેશના" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દરજીભાઈએ ખિસ્સાને નીરજભાઈના નવા બુશકોટ પર સીવી દીધું [૩૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "ચણો", "backGu": "ખાડામાં પડીને પહેલવાન બનેલો દાણો [૩૩]" },
        { "frontGu": "સૂરજદાદા", "backGu": "ખિસ્સાને વહાલથી સુકવનાર [૩૬]" },
        { "frontGu": "ધોબીભાઈ", "backGu": "ઈસ્ત્રી ફેરવી કરચલી દૂર કરનાર [૩૭]" },
        { "frontGu": "દરજીકાકા", "backGu": "બુશકોટ પર ખિસ્સું સીવનાર [૩૮]" },
        { "frontGu": "ગજવું", "backGu": "ખિસ્સાનો બીજો સમાન અર્થ [૪૯]" }
      ]
    },
    {
      "chapterNumber": 2,
      "titleGu": "તેને તે ઊગશે?",
      "quizzes": [
        {
          "questionTextGu": "કૂકડીને શું શીખવાની તીવ્ર ઈચ્છા હતી?",
          "options": [
            { "id": "A", "textGu": "દોડવાનું" },
            { "id": "B", "textGu": "ઊડવાનું" },
            { "id": "C", "textGu": "તમાશો જોવાનું" },
            { "id": "D", "textGu": "ચણ વીણવાનું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કૂકડીને વંડી પર ચડવા માટે ઊંચું ઊડતા શીખવાની ખૂબ ઈચ્છા હતી [૭૦]."
        },
        {
          "questionTextGu": "કૂકડી અચાનક ક્યાં ચડી ગઈ?",
          "options": [
            { "id": "A", "textGu": "ઝાડ પર" },
            { "id": "B", "textGu": "પથરા પર" },
            { "id": "C", "textGu": "છાપરા પર" },
            { "id": "D", "textGu": "પાંજરામાં" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બિલાડીઓથી બચવા જતાં કૂકડી જોર કરીને ઉડી અને પથરા પર ચડી ગઈ [૭૧]."
        },
        {
          "questionTextGu": "કૂકડીને કોણ સતત ખિજવતું હતું?",
          "options": [
            { "id": "A", "textGu": "કૂકડો" },
            { "id": "B", "textGu": "ચકલી" },
            { "id": "C", "textGu": "કાગડો" },
            { "id": "D", "textGu": "કાબર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કાગડો કૂકડીને કહેતો કે ગમે તેટલું ઉડશે તો પણ તને કલગી નહીં ઉગે [૭૩]."
        },
        {
          "questionTextGu": "કોણે કૂકડીને કહ્યું કે તેને માથે કલગી ઊગી છે?",
          "options": [
            { "id": "A", "textGu": "કાબરે" },
            { "id": "B", "textGu": "મોરે" },
            { "id": "C", "textGu": "પોપટે" },
            { "id": "D", "textGu": "ચકલીએ" }
          ],
          "correctOptionId": "A",
          "explanationGu": "દૂરથી ઉડીને આવેલી કાબરે કૂકડીને કલગી ઉગ્યાના સમાચાર આપ્યા [૭૪]."
        },
        {
          "questionTextGu": "પપ્પાને માથે શું હોય છે એવો પ્રશ્ન કવિ પૂછે છે?",
          "options": [
            { "id": "A", "textGu": "ચોટલો" },
            { "id": "B", "textGu": "પાઘડી" },
            { "id": "C", "textGu": "ટાલ" },
            { "id": "D", "textGu": "ટોપી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કવિતામાં બાળક પૂછે છે કે મમ્મીને લાંબો ચોટલો તો પપ્પાને માથે કેમ ટાલ? [૮૨]"
        }
      ],
      "flashcards": [
        { "frontGu": "વંડી", "backGu": "જમીન ફરતે કરેલી દીવાલ [૭૮]" },
        { "frontGu": "કલગી", "backGu": "કૂકડીને માથે ઉગેલી શોભા [૭૪]" },
        { "frontGu": "અભિલાષા", "backGu": "તીવ્ર ઉત્કટ ઈચ્છા [૭૮]" },
        { "frontGu": "હરખઘેલું", "backGu": "અતિશય આનંદમાં આવી ગયેલું [૭૮]" },
        { "frontGu": "ચણ", "backGu": "પક્ષીઓને ખાવા માટે નખાતું અનાજ [૯૫]" }
      ]
    },
    {
      "chapterNumber": 3,
      "titleGu": "શંખલાની બહેન છીપલી",
      "quizzes": [
        {
          "questionTextGu": "દિવ્યેશ કેટલા વર્ષનો હતો?",
          "options": [
            { "id": "A", "textGu": "૭ વર્ષ" },
            { "id": "B", "textGu": "૯ વર્ષ" },
            { "id": "C", "textGu": "૧૦ વર્ષ" },
            { "id": "D", "textGu": "૧૨ વર્ષ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાર્તામાં ઉલ્લેખ છે કે દિવ્યેશ નવ વર્ષનો હતો [૯૮]."
        },
        {
          "questionTextGu": "દિવ્યેશના પપ્પાની શાની લારી હતી?",
          "options": [
            { "id": "A", "textGu": "નાસ્તાની" },
            { "id": "B", "textGu": "ફળોની" },
            { "id": "C", "textGu": "ચાની" },
            { "id": "D", "textGu": "કુલફીની" }
          ],
          "correctOptionId": "C",
          "explanationGu": "દિવ્યેશના પિતાને ચાની લારી હતી, જેમાં કુલફીનો ડબ્બો પણ રાખતા [૯૮]."
        },
        {
          "questionTextGu": "દિવ્યેશે રિયા માટે શાની રાખડી બનાવી હતી?",
          "options": [
            { "id": "A", "textGu": "કારેલાંના બીની" },
            { "id": "B", "textGu": "મોતીની" },
            { "id": "C", "textGu": "રૂની" },
            { "id": "D", "textGu": "લાકડાના પારાની" }
          ],
          "correctOptionId": "A",
          "explanationGu": "રિયાને કારેલાંનું શાક ભાવતું હોવાથી દિવ્યેશે તેના માટે 'કારેલાં રાખડી' બનાવી હતી [૧૦૦]."
        },
        {
          "questionTextGu": "દિવ્યેશની આંખમાં આંસુ કેમ આવી ગયાં?",
          "options": [
            { "id": "A", "textGu": "તેને વાગ્યું હતું" },
            { "id": "B", "textGu": "તેને તેની ઢીંગલી (બહેન) યાદ આવી" },
            { "id": "C", "textGu": "તેને રાખડી નહોતી મળી" },
            { "id": "D", "textGu": "શિક્ષકે વઢ્યા હતા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રક્ષાબંધને તેને તેની નાની બહેન યાદ આવી જે હવે આ દુનિયામાં નહોતી [૧૦૩]."
        },
        {
          "questionTextGu": "ભાઈબહેન કવિતામાં બાળકો કયા સમયે જાગી ગયા?",
          "options": [
            { "id": "A", "textGu": "સવારના પહોરે" },
            { "id": "B", "textGu": "બપોરે" },
            { "id": "C", "textGu": "પાછલા પહોરે" },
            { "id": "D", "textGu": "સાંજે" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કવિતા મુજબ 'પાછલા તે પહોરની ઉડી ગઈ નીંદરા' [૧૧૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "ફુરસદ", "backGu": "નવરાશ અથવા ખાલી સમય [૧૦૭]" },
        { "frontGu": "પ્રવીણ", "backGu": "કોઈ કામમાં કુશળ કે હોશિયાર [૧૦૭]" },
        { "frontGu": "વિધિવત્", "backGu": "નિયમ કે પરંપરા મુજબ [૧૨૯]" },
        { "frontGu": "આજીજી", "backGu": "વિનંતી કરવી [૧૨૩]" },
        { "frontGu": "બિલ્લીપગે", "backGu": "છાનામાના કે અવાજ કર્યા વગર ચાલવું [૧૨૩]" }
      ]
    },
    {
      "chapterNumber": 4,
      "titleGu": "સિંહ ઘૂઘવે બકરો ભાગે",
      "quizzes": [
        {
          "questionTextGu": "સિંહે બકરીના બચ્ચાને શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "મારી નાખ્યું" },
            { "id": "B", "textGu": "ખાઈ ગયો" },
            { "id": "C", "textGu": "જીવતું પકડી સિંહણ પાસે લાવ્યો" },
            { "id": "D", "textGu": "જવા દીધું" }
          ],
          "correctOptionId": "C",
          "explanationGu": "સિંહે દયા ખાઈને બકરીના બચ્ચાને સિંહણ પાસે લાવ્યો જેથી તે તેના બચ્ચા સાથે ઉછરે [૧૩૪]."
        },
        {
          "questionTextGu": "સિંહણે બકરાનું નામ શું પાડ્યું હતું?",
          "options": [
            { "id": "A", "textGu": "નાનિયો" },
            { "id": "B", "textGu": "મોટિયો" },
            { "id": "C", "textGu": "લાલિયો" },
            { "id": "D", "textGu": "ઝનૂની" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સિંહણે ઉછરેલા બકરાને 'મોટિયો' અને પોતાના બચ્ચાને 'નાનિયો' નામ આપ્યું હતું [૧૩૬]."
        },
        {
          "questionTextGu": "હાથીઓને જોઈને કોણ ઉશ્કેરાઈ ગયું?",
          "options": [
            { "id": "A", "textGu": "મોટિયો" },
            { "id": "B", "textGu": "નાનિયો (સિંહનું બચ્ચું)" },
            { "id": "C", "textGu": "સિંહણ" },
            { "id": "D", "textGu": "બકરી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "હાથીઓને જોઈને સિંહનું બચ્ચું ઝનૂની બની ગયું અને સામે લડવા જવા લાગ્યું [૧૩૭]."
        },
        {
          "questionTextGu": "પૃથ્વીના કેટલા ભાગમાં દરિયો (મહાસાગર) પથરાયેલો છે?",
          "options": [
            { "id": "A", "textGu": "અડધા ભાગમાં" },
            { "id": "B", "textGu": "પોણી દુનિયા પર" },
            { "id": "C", "textGu": "ચોથા ભાગમાં" },
            { "id": "D", "textGu": "આખી દુનિયામાં" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મહાસાગર પોણી દુનિયા જેટલી જગ્યા રોકે છે [૧૫૦]."
        },
        {
          "questionTextGu": "મહાસાગરનું પાણી કેવું હોય છે?",
          "options": [
            { "id": "A", "textGu": "મીઠું" },
            { "id": "B", "textGu": "ખારું ઊસ જેવું" },
            { "id": "C", "textGu": "કડવું" },
            { "id": "D", "textGu": "તીખું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કવિતા મુજબ મહાસાગરનું પાણી ખારું ઊસ જેવું હોય છે [૧૫૧]."
        }
      ],
      "flashcards": [
        { "frontGu": "હૃષ્ટપુષ્ટ", "backGu": "તંદુરસ્ત અને ભરાવદાર શરીરવાળું [૧૩૫]" },
        { "frontGu": "ઝનૂની", "backGu": "ખૂબ જ આવેશ કે ગુસ્સાવાળું [૧૩૭]" },
        { "frontGu": "ઓટ", "backGu": "ભરતી પછી દરિયાના પાણીનું ઉતરી જવું [૧૫૮]" },
        { "frontGu": "પરથારો", "backGu": "નાનો ઓટલો કે પગથિયું [૧૬૭]" },
        { "frontGu": "ગંજાવર", "backGu": "ખૂબ જ મોટું કે વિશાળ [૧૬૭]" }
      ]
    },
    {
      "chapterNumber": 5,
      "titleGu": "પવન ખિજાય તો ગોળ ઝાપટો",
      "quizzes": [
        {
          "questionTextGu": "મિન્ટુડાને શું ખૂબ જ ભાવતું હતું?",
          "options": [
            { "id": "A", "textGu": "ખાંડ" },
            { "id": "B", "textGu": "ગોળ" },
            { "id": "C", "textGu": "શેરડી" },
            { "id": "D", "textGu": "ભજીયા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મિન્ટુભાઈ મકોડાને ગોળ ખૂબ ભાવતો, તે ગોળ ખાતા ખાતા જ બધું કામ કરતા [૧૮૧]."
        },
        {
          "questionTextGu": "મિન્ટુને લઈને તેની મમ્મી કોના ખેતરે ગઈ?",
          "options": [
            { "id": "A", "textGu": "શાંતિબાપાના" },
            { "id": "B", "textGu": "રામજીબાપાના" },
            { "id": "C", "textGu": "ધનજીભાઈના" },
            { "id": "D", "textGu": "કુલદીપભાઈના" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મિન્ટુની જીદ પૂરી કરવા મમ્મી તેને રામજીબાપાના શેરડીના ખેતરે લઈ ગઈ [૧૮૨]."
        },
        {
          "questionTextGu": "શેરડી પીલવાના સાધનને શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "પાવડો" },
            { "id": "B", "textGu": "ચિચોડો" },
            { "id": "C", "textGu": "ગાડું" },
            { "id": "D", "textGu": "હળ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "શેરડીમાંથી રસ કાઢવા માટે 'ચિચોડો' નામનું સાધન વપરાય છે [૧૮૬]."
        },
        {
          "questionTextGu": "બળતણ માટે શેનો ઉપયોગ કરવામાં આવ્યો?",
          "options": [
            { "id": "A", "textGu": "લાકડાનો" },
            { "id": "B", "textGu": "કોલસાનો" },
            { "id": "C", "textGu": "શેરડીના કૂચાનો" },
            { "id": "D", "textGu": "પ્લાસ્ટિકનો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "રામજીબાપાએ શેરડીના સુકાયેલા કૂચાનો ઉપયોગ ભઠ્ઠામાં બળતણ તરીકે કર્યો [૧૮૭]."
        },
        {
          "questionTextGu": "અટકચાળો પવન રાત્રે શું ખખડાવે છે?",
          "options": [
            { "id": "A", "textGu": "તાળું અને સાંકળ" },
            { "id": "B", "textGu": "તિજોરી" },
            { "id": "C", "textGu": "થાળી" },
            { "id": "D", "textGu": "પુસ્તક" }
          ],
          "correctOptionId": "A",
          "explanationGu": "કવિતા મુજબ પવન ઘરની સાંકળ અને બંધ તાળું ખખડાવે છે [૨૦૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "રવો", "backGu": "ગોળનો મોટો ગાંગડો [૧૮૩]" },
        { "frontGu": "ચિચોડો", "backGu": "શેરડીનું કોલું [૨૦૬]" },
        { "frontGu": "કૂચા", "backGu": "રસ કાઢ્યા પછી વધેલો શેરડીનો ભાગ [૨૦૬]" },
        { "frontGu": "તલપાપડ થવું", "backGu": "ખૂબ જ ઉતાવળા થવું [૧૯૨]" },
        { "frontGu": "રાજીના રેડ થવું", "backGu": "ખૂબ જ ખુશ થઈ જવું [૧૯૩]" }
      ]
    },
    {
      "chapterNumber": 6,
      "titleGu": "ભાઈબંધ મારો બોલ્યો કુહૂ",
      "quizzes": [
        {
          "questionTextGu": "સૌથી વિચિત્ર છોકરો બોધરાજ ગજવામાં શું ભરી રાખતો?",
          "options": [
            { "id": "A", "textGu": "ચોકલેટ" },
            { "id": "B", "textGu": "જીવતો દેડકો અને ઈંડાં" },
            { "id": "C", "textGu": "લખોટીઓ" },
            { "id": "D", "textGu": "પૈસા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બોધરાજ સાવ વિચિત્ર હતો, તેના ગજવામાં દેડકા અને ઈંડાં જેવી વસ્તુઓ રહેતી [૨૧૮]."
        },
        {
          "questionTextGu": "બોધરાજના હાથમાં હંમેશા શું રહેતું?",
          "options": [
            { "id": "A", "textGu": "બેટ" },
            { "id": "B", "textGu": "પેન" },
            { "id": "C", "textGu": "ગોફણ" },
            { "id": "D", "textGu": "દોરી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "બોધરાજ પાસે અચૂક નિશાન લગાવવા માટે ગોફણ રહેતી હતી [૨૧૮]."
        },
        {
          "questionTextGu": "ગોદામમાં કોનો માળો હતો?",
          "options": [
            { "id": "A", "textGu": "કાગડાનો" },
            { "id": "B", "textGu": "ચકલીનો" },
            { "id": "C", "textGu": "બ્રાહ્મણી કાબરનો" },
            { "id": "D", "textGu": "પોપટનો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "હવાબારી પાસે બ્રાહ્મણી કાબરનો માળો હતો અને તેમાં બે બચ્ચાં હતાં [૨૨૦]."
        },
        {
          "questionTextGu": "કાબરના બચ્ચાંને ખાવા માટે કોણ આવ્યું હતું?",
          "options": [
            { "id": "A", "textGu": "બિલાડી" },
            { "id": "B", "textGu": "સમડી" },
            { "id": "C", "textGu": "સાપ" },
            { "id": "D", "textGu": "કુતરો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "એક ભયંકર સમડી બચ્ચાં પર હુમલો કરવા માટે ગોદામમાં આવી હતી [૨૨૧]."
        },
        {
          "questionTextGu": "પક્ષીઓને બચાવ્યા પછી બોધરાજ બીજા દિવસે શું લાવ્યો?",
          "options": [
            { "id": "A", "textGu": "ગોફણ" },
            { "id": "B", "textGu": "પથ્થર" },
            { "id": "C", "textGu": "દાણાની થેલી" },
            { "id": "D", "textGu": "પાંજરું" }
          ],
          "correctOptionId": "C",
          "explanationGu": "બોધરાજ બદલાઈ ગયો હતો અને તે બચ્ચાંને ખવડાવવા માટે દાણાની થેલી લાવ્યો હતો [૨૨૪]."
        }
      ],
      "flashcards": [
        { "frontGu": "ગોફણ", "backGu": "પથ્થર ફેંકવાનું સાધન [૨૧૮]" },
        { "frontGu": "બખોલ", "backGu": "ઝાડ કે પહાડમાં પાડેલું પોલાણ [૨૧૩]" },
        { "frontGu": "બઢતી", "backGu": "નોકરીમાં હોદ્દો વધવો (Promotion) [૨૨૭]" },
        { "frontGu": "ખંધું", "backGu": "લુચ્ચું અથવા કપટી [૨૧૨]" },
        { "frontGu": "ગોદામ", "backGu": "સામાન રાખવાની મોટી ઓરડી [૨૨૭]" }
      ]
    },
    {
      "chapterNumber": 7,
      "titleGu": "નખ્ખમ્ ધખ્ખમ્ ધડાપડાબૂમ્",
      "quizzes": [
        {
          "questionTextGu": "બચુ શું બનીને આવ્યો હતો?",
          "options": [
            { "id": "A", "textGu": "શિક્ષક" },
            { "id": "B", "textGu": "બાવો" },
            { "id": "C", "textGu": "સૈનિક" },
            { "id": "D", "textGu": "પોલીસ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બચુએ જટા બનાવી અને ભભૂત લગાવીને બાવો બનવાનો વેશ ધારણ કર્યો હતો [૨૪૩]."
        },
        {
          "questionTextGu": "બાવા બનેલા બચુએ શું ખાવાની ઈચ્છા વ્યક્ત કરી?",
          "options": [
            { "id": "A", "textGu": "મીઠાઈ" },
            { "id": "B", "textGu": "માવો" },
            { "id": "C", "textGu": "સાદું ભોજન (ખીચડી આટો)" },
            { "id": "D", "textGu": "ફળો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કવિતા મુજબ વૈરાગીને મીઠાઈ ન જોઈએ, તેને સાદું ભોજન ખપે [૨૪૪]."
        },
        {
          "questionTextGu": "તૃપ્તિ અને અંશુલે ટેબલ પર કયા રંગનો દુપટ્ટો પાથર્યો હતો?",
          "options": [
            { "id": "A", "textGu": "લાલ" },
            { "id": "B", "textGu": "પીળો" },
            { "id": "C", "textGu": "સફેદ" },
            { "id": "D", "textGu": "લીલો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "જાદુ બતાવવા માટે તૃપ્તિએ સફેદ રંગનો દુપટ્ટો ટેબલ પર પાથર્યો હતો [૨૫૦]."
        },
        {
          "questionTextGu": "બંગડી અને જામફળ ખસવા પાછળનું સાચું રહસ્ય શું હતું?",
          "options": [
            { "id": "A", "textGu": "મંત્ર" },
            { "id": "B", "textGu": "ભૂતના લીધે" },
            { "id": "C", "textGu": "સફેદ દોરો અને ઈલેસ્ટિક" },
            { "id": "D", "textGu": "પવન" }
          ],
          "correctOptionId": "C",
          "explanationGu": "તૃપ્તિએ દોરા અને ઈલેસ્ટિકની મદદથી વસ્તુઓ ખસેડી હતી જે સફેદ દુપટ્ટામાં દેખાતા નહોતા [૨૫૫]."
        },
        {
          "questionTextGu": "લીંબુમાંથી લોહી કાઢવા માટે છરી પર શેનો રસ લગાવ્યો હતો?",
          "options": [
            { "id": "A", "textGu": "કંકુનો" },
            { "id": "B", "textGu": "કપાસના જીંડવાનો" },
            { "id": "C", "textGu": "દાડમનો" },
            { "id": "D", "textGu": "રંગનો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કપાસના જીંડવાનો રસ છરી પર લગાવવાથી લીંબુ કાપતા લાલ રંગનું પ્રવાહી નીકળતું હતું [૨૫૮]."
        }
      ],
      "flashcards": [
        { "frontGu": "ભભૂત", "backGu": "રાખ (સાધુઓ શરીરે લગાવે તે) [૨૬૯]" },
        { "frontGu": "ત્રાટક", "backGu": "એકાગ્રતાથી એક જ સ્થાને જોવું [૨૬૯]" },
        { "frontGu": "સરપાવ", "backGu": "ઈનામ અથવા પુરસ્કાર [૨૬૯]" },
        { "frontGu": "ભિક્ષા", "backGu": "દાનમાં મળેલી વસ્તુ કે ભોજન [૨૪૭]" },
        { "frontGu": "વેશ", "backGu": "ધારણ કરેલો નવો દેખાવ [૨૪૭]" }
      ]
    },
    {
      "chapterNumber": 8,
      "titleGu": "ટામેટાની દડી, રમે દાદાદાદી",
      "quizzes": [
        {
          "questionTextGu": "ટમેટાને ફ્રીઝમાં કેમ ઠંડી લાગે છે?",
          "options": [
            { "id": "A", "textGu": "ત્યાં પંખો છે" },
            { "id": "B", "textGu": "ત્યાં હૂંફનું નામ નથી" },
            { "id": "C", "textGu": "ત્યાં પાણી છે" },
            { "id": "D", "textGu": "ત્યાં બારી ખુલ્લી છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ફ્રીઝમાં માત્ર બરફના ગામ છે અને હૂંફ બિલકુલ નથી [૨૯૬]."
        },
        {
          "questionTextGu": "ટમેટાને ટપલી કોણે મારી?",
          "options": [
            { "id": "A", "textGu": "દૂધીમાસીએ" },
            { "id": "B", "textGu": "મૂળાભાઈએ" },
            { "id": "C", "textGu": "ગાજરભાઈએ" },
            { "id": "D", "textGu": "કાકડીબહેને" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મૂળાભાઈએ રમત-રમતમાં ટમેટાને ટપલી મારી હતી [૨૯૬]."
        },
        {
          "questionTextGu": "દાદા બાળપણમાં કઈ રમતના માસ્ટર હતા?",
          "options": [
            { "id": "A", "textGu": "ક્રિકેટ" },
            { "id": "B", "textGu": "કબડ્ડી" },
            { "id": "C", "textGu": "મારદડી" },
            { "id": "D", "textGu": "ખો-ખો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "દાદા મારદડી રમવામાં એક્કો હતા તેથી તેમનું નામ 'મારદડી માસ્ટર' પડ્યું હતું [૨૭૫]."
        },
        {
          "questionTextGu": "દાદાને મારદડીમાં કોણે હરાવ્યા હતા?",
          "options": [
            { "id": "A", "textGu": "મિત્રએ" },
            { "id": "B", "textGu": "શિક્ષકે" },
            { "id": "C", "textGu": "દાદીમાએ" },
            { "id": "D", "textGu": "કોઈએ નહીં" }
          ],
          "correctOptionId": "C",
          "explanationGu": "દાદીમાં બાળપણમાં ખૂબ તાકોડી હતા અને તેમણે દાદાને દડો માર્યો હતો [૨૭૭]."
        },
        {
          "questionTextGu": "‘દાંડીકૂચ’ રમતમાં જેનો દાવ આવે તે ટીમને શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "ગાંધી ટીમ" },
            { "id": "B", "textGu": "અંગ્રેજ ટીમ" },
            { "id": "C", "textGu": "ભારતીય ટીમ" },
            { "id": "D", "textGu": "આઝાદ ટીમ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દાંડીકૂચ રમતમાં દાવ લેનાર ટીમ 'અંગ્રેજ ટીમ' અને સામેની ટીમ 'ગાંધી ટીમ' કહેવાય છે [૨૮૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "તાકોડી", "backGu": "જેને તાકે તેને પાડી દે તેવી વ્યક્તિ [૨૭૬]" },
        { "frontGu": "ઘારી", "backGu": "સુરતની પ્રખ્યાત મીઠાઈ [૨૯૭]" },
        { "frontGu": "બંડી", "backGu": "પહેરવાનું એક વસ્ત્ર [૨૯૬]" },
        { "frontGu": "હૂંફ", "backGu": "ગરમાવો અથવા ઉષ્મા [૩૦૧]" },
        { "frontGu": "ચપળતા", "backGu": "ખૂબ જ ઝડપ કે તરવરાટ [૩૦૧]" }
      ]
    },
    {
      "chapterNumber": 9,
      "titleGu": "કમળજળકમળજળકમળજળકમળ",
      "quizzes": [
        {
          "questionTextGu": "ગોપીઓ કૃષ્ણની ફરિયાદ કોને કરે છે?",
          "options": [
            { "id": "A", "textGu": "નંદબાબાને" },
            { "id": "B", "textGu": "બલભદ્રને" },
            { "id": "C", "textGu": "માતા યશોદાને" },
            { "id": "D", "textGu": "ગોવાળોને" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ગોપીઓ રોજ કૃષ્ણના તોફાનોની ફરિયાદ માતા યશોદા પાસે કરતી હતી [૩૦૫]."
        },
        {
          "questionTextGu": "યમુના નદીના ઊંડા ધરામાં કોણ રહેતું હતું?",
          "options": [
            { "id": "A", "textGu": "મગર" },
            { "id": "B", "textGu": "કાલિય નાગ" },
            { "id": "C", "textGu": "કાચબો" },
            { "id": "D", "textGu": "માછલી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "યમુના નદીના ઝેરી ધરામાં ભયંકર કાલિય નાગ રહેતો હતો [૩૦૯]."
        },
        {
          "questionTextGu": "દડો લેવા માટે કૃષ્ણે નદીમાં શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "હોડી લીધી" },
            { "id": "B", "textGu": "જાળ નાખી" },
            { "id": "C", "textGu": "ઝંપલાવ્યું (ડૂબકી મારી)" },
            { "id": "D", "textGu": "પથ્થર માર્યો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કૃષ્ણે કોઈની વાત માન્યા વગર દડો લેવા નદીમાં ઝંપલાવ્યું [૩૧૨]."
        },
        {
          "questionTextGu": "નાગણે કૃષ્ણને પાછા જવા માટે શું લાલચ આપી?",
          "options": [
            { "id": "A", "textGu": "માખણ" },
            { "id": "B", "textGu": "ગાયો" },
            { "id": "C", "textGu": "સવા લાખનો હાર" },
            { "id": "D", "textGu": "રમકડાં" }
          ],
          "correctOptionId": "C",
          "explanationGu": "નાગણે કૃષ્ણને જીવ બચાવવા માટે સવા લાખનો હાર આપવાની લાલચ આપી [૩૧૩]."
        },
        {
          "questionTextGu": "કૃષ્ણ નદીમાંથી બહાર આવ્યા ત્યારે કોની પર સવાર હતા?",
          "options": [
            { "id": "A", "textGu": "હાથી પર" },
            { "id": "B", "textGu": "કાલિય નાગના માથે" },
            { "id": "C", "textGu": "ઘોડા પર" },
            { "id": "D", "textGu": "મગર પર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કૃષ્ણ કાલિય નાગને નાથીને તેના ફેણ (માથા) પર ઉભા રહીને બહાર આવ્યા [૩૧૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "ધરો", "backGu": "નદીનું ખૂબ જ ઊંડું પાણી [૩૧૬]" },
        { "frontGu": "ભાથું", "backGu": "સાથે લીધેલું ભોજન [૩૧૭]" },
        { "frontGu": "અપરાધી", "backGu": "ભૂલ કરનાર કે ગુનેગાર [૩૨૮]" },
        { "frontGu": "નાથવું", "backGu": "કાબૂમાં કરવું [૩૨૮]" },
        { "frontGu": "વિલાપ", "backGu": "રડવું અથવા રુદન [૩૨૮]" }
      ]
    },
    {
      "chapterNumber": 10,
      "titleGu": "રંગેસંગે કામ કરો",
      "quizzes": [
        {
          "questionTextGu": "પૉલીમાસીએ ટૉમ સૉયરને કયું કામ સોંપ્યું હતું?",
          "options": [
            { "id": "A", "textGu": "વાસણ સાફ કરવાનું" },
            { "id": "B", "textGu": "બહારની દીવાલ રંગવાનું" },
            { "id": "C", "textGu": "ખેતર ખેડવાનું" },
            { "id": "D", "textGu": "કપડાં ધોવાનું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "માસીએ રવિવારના દિવસે ટૉમને ઘરની બહારની દીવાલને ચૂનો લગાવવાનું કામ આપ્યું [૩૩૩]."
        },
        {
          "questionTextGu": "ટૉમે બૅન પાસેથી શું લીધું?",
          "options": [
            { "id": "A", "textGu": "પતંગ" },
            { "id": "B", "textGu": "લખોટીઓ" },
            { "id": "C", "textGu": "આખું સફરજન" },
            { "id": "D", "textGu": "સિપાહી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "બૅન પાસેથી ટૉમે દીવાલ રંગવાના બદલામાં આખું સફરજન લીધું [૩૩૬]."
        },
        {
          "questionTextGu": "બપોર સુધીમાં દીવાલ કેટલી વાર રંગાઈ ચૂકી હતી?",
          "options": [
            { "id": "A", "textGu": "એક વાર" },
            { "id": "B", "textGu": "બે વાર" },
            { "id": "C", "textGu": "ત્રણ વાર" },
            { "id": "D", "textGu": "ચાર વાર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ટૉમની યુક્તિથી મિત્રોએ કામ કર્યું અને દીવાલ ત્રણ વાર રંગાઈ ગઈ [૩૩૮]."
        },
        {
          "questionTextGu": "‘મોસમ આવી મહેનતની’ કવિતાના કવિ કોણ છે?",
          "options": [
            { "id": "A", "textGu": "નર્મદ" },
            { "id": "B", "textGu": "નાથાલાલ દવે" },
            { "id": "C", "textGu": "કૃષ્ણ દવે" },
            { "id": "D", "textGu": "સ્વાતિ મેઢ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "આ સુંદર વર્ષાગીત નાથાલાલ દવે દ્વારા રચવામાં આવ્યું છે [૩૫૩]."
        },
        {
          "questionTextGu": "ખેડૂતો ખેતરમાં કામ કરવા માટે શું લેવાનું કહે છે?",
          "options": [
            { "id": "A", "textGu": "પુસ્તક" },
            { "id": "B", "textGu": "રમતનાં સાધન" },
            { "id": "C", "textGu": "પછેડી અને દાતરડાં" },
            { "id": "D", "textGu": "જાળ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કવિતામાં પંક્તિ છે 'લિયો પછેડી દાતરડાં આજ સીમ કરે છે સાદ' [૩૫૨]."
        }
      ],
      "flashcards": [
        { "frontGu": "આફત", "backGu": "મોટી મુશ્કેલી કે સંકટ [૩૪૧]" },
        { "frontGu": "ખામી", "backGu": "કોઈ ભૂલ અથવા ત્રુટિ [૩૪૨]" },
        { "frontGu": "પરસેવે રેબઝેબ", "backGu": "ખૂબ જ પરસેવો થવો [૩૪૨]" },
        { "frontGu": "સોનાવરણી", "backGu": "સોના જેવા પીળા રંગની [૩૫૯]" },
        { "frontGu": "મેહુલિયો", "backGu": "વરસાદ [૩૫૯]" }
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
            "name": "Standard 4 Gujarati Kuhu",
            "nameGu": "કુહૂ (ગુજરાતી - પ્રથમ ભાષા) ધોરણ ૪",
            "name_en": "Standard 4 Gujarati Kuhu (First Language)",
            "name_gu": "કુહૂ (ગુજરાતી - પ્રથમ ભાષા) ધોરણ ૪",
            "title": "કુહૂ (ગુજરાતી - પ્રથમ ભાષા) ધોરણ ૪",
            "titleGu": "કુહૂ (ગુજરાતી - પ્રથમ ભાષા) ધોરણ ૪",
            "title_gu": "કુહૂ (ગુજરાતી - પ્રથમ ભાષા) ધોરણ ૪",
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
            "title_gu": "કુહૂ (ગુજરાતી - પ્રથમ ભાષા) ધોરણ ૪ પાઠ્યપુસ્તક",
            "titleGu": "કુહૂ (ગુજરાતી - પ્રથમ ભાષા) ધોરણ ૪ પાઠ્યપુસ્તક",
            "title_en": "Standard 4 Gujarati Kuhu Textbook",
            "titleEn": "Standard 4 Gujarati Kuhu Textbook",
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
        quiz_id = f"quiz_std4_kuhu_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std4_kuhu_{ch_id}_{q_idx+1}"

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
        fc_id = f"fc_std4_kuhu_{ch_id}_{fc_idx+1}"

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

# 3. Generate AI Knowledge Base Documents for all 10 chapters
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

    content = f"વિષય: કુહૂ (ગુજરાતી - પ્રથમ ભાષા) ધોરણ ૪\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std4_kuhu_{ch_id}",
        "standard_id": "4",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "કુહૂ", "ગુજરાતી", "ધોરણ ૪"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std4_kuhu_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 4 Gujarati Kuhu payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
