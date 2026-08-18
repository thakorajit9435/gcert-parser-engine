#!/usr/bin/env python3
"""
Builds complete std5_english_sl_payload.json for GCERT Standard 5 English Second Language (અંગ્રેજી દ્વિતીય ભાષા ધોરણ 5).
Ingests into Cloud Firestore and Qdrant Vector Database via import_json.py.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-5%20English%20Second%20Language.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-5 English Second Language.pdf"
storage_path = "textbooks/Std-5 English Second Language.pdf"

subject_id = "sub_eng_std5_sl"
subject_id_alt1 = "sub_english_std5_sl"
subject_id_alt2 = "sub_english_std5"
subject_id_alt3 = "sub_eng_std5"

standard_id = "std_5"
standard_number = 5
session = "1"

raw_chapters_info = [
    {
        "chapterNumber": 1,
        "id": "sub_eng_std5_ch1",
        "titleGu": "Smile Please!",
        "titleEn": "Smile Please!",
        "descriptionGu": "કવિતા અને સ્માઈલ વિષયક વાર્તા દ્વારા ચહેરા પરના સ્મિતનું મહત્વ અને ખાનક-ખુશીની રમુજી વાર્તાનો પરિચય [૨૮, ૨૯, ૩૦, ૩૧].",
        "startPage": 11,
        "endPage": 22
    },
    {
        "chapterNumber": 2,
        "id": "sub_eng_std5_ch2",
        "titleGu": "Helping Hands",
        "titleEn": "Helping Hands",
        "descriptionGu": "મિસ પોલીની ઢીંગલીનું ગીત અને હેતલ, મિહિર, મયંક તથા એલિયન વચ્ચેની મદદ અને મિત્રતાની વાર્તા [૪૧, ૪૩, ૪૪, ૪૫].",
        "startPage": 23,
        "endPage": 35
    },
    {
        "chapterNumber": 3,
        "id": "sub_eng_std5_ch3",
        "titleGu": "Nature - God's Gift",
        "titleEn": "Nature - God's Gift",
        "descriptionGu": "જાદુઈ બગીચો, ઔષધીય છોડ (લીમડો, તુલસી) ના ઉપયોગ અને પર્યાવરણ સુરક્ષા (પ્લાસ્ટિક મુક્તિ) ની સમજ [૫૮, ૬૨, ૬૩, ૬૪].",
        "startPage": 36,
        "endPage": 48
    },
    {
        "chapterNumber": 4,
        "id": "sub_eng_std5_ch4",
        "titleGu": "Animals - The Living Wonders",
        "titleEn": "Animals - The Living Wonders",
        "descriptionGu": "બિલાડીઓની આદતો, પતંગિયાના સંઘર્ષની વાર્તા અને માઉન્ટ આબુના પ્રખ્યાત 'ટોડ રોક' વિશેની રસપ્રદ માહિતી [૭૨, ૭૪, ૭૫, ૭૭].",
        "startPage": 49,
        "endPage": 62
    },
    {
        "chapterNumber": 5,
        "id": "sub_eng_std5_ch5",
        "titleGu": "A Beautiful Bond",
        "titleEn": "A Beautiful Bond",
        "descriptionGu": "મીના અને તેના નાના ભાઈ વચ્ચેનો નિઃસ્વાર્થ પ્રેમ તથા વાદળી ટબમાં પડેલા ચાલાક શિયાળની વાર્તા [૮૮, ૮૯, ૯૦, ૯૧, ૯૨].",
        "startPage": 63,
        "endPage": 75
    },
    {
        "chapterNumber": 6,
        "id": "sub_eng_std5_ch6",
        "titleGu": "Cleanliness Habits",
        "titleEn": "Cleanliness Habits",
        "descriptionGu": "જમ્પી વાંદરો અને મિત્રો દ્વારા પાર્કની સફાઈ, કચરાપેટીનો ઉપયોગ અને વ્યક્તિગત સ્વચ્છતાની ટેવો [૧૦૦, ૧૦૧, ૧૦૨, ૧૦૩].",
        "startPage": 76,
        "endPage": 88
    },
    {
        "chapterNumber": 7,
        "id": "sub_eng_std5_ch7",
        "titleGu": "Think Differently",
        "titleEn": "Think Differently",
        "descriptionGu": "તેનાલી રામન અને ચાચા ચૌધરીની ચતુર બુદ્ધિ અને ભારત-પાકિસ્તાન સરહદ પર આવેલા નડાબેટનો પરિચય [૧૧૪, ૧૧૬, ૧૧૭, ૧૨૧, ૧૨૨, ૧૨૬].",
        "startPage": 89,
        "endPage": 102
    },
    {
        "chapterNumber": 8,
        "id": "sub_eng_std5_ch8",
        "titleGu": "Sharing is Caring",
        "titleEn": "Sharing is Caring",
        "descriptionGu": "મોહનભાઈની વાર્તાઓ, રાજુ સસલાનો જાદુઈ ગાજરનો બગીચો અને મીતાની રસ્તા પર મરઘી-બચ્ચાંની દયાળુતા [૧૩૫, ૧૩૬, ૧૩૭, ૧૩૯].",
        "startPage": 103,
        "endPage": 115
    },
    {
        "chapterNumber": 9,
        "id": "sub_eng_std5_ch9",
        "titleGu": "Friendship",
        "titleEn": "Friendship",
        "descriptionGu": "રેતી અને પથ્થર પર લખવાની મિત્રતાની વાર્તા, સેનાના જવાનો કુલદીપ-સમશેરની વફાદારી અને હર્ષદાનો જન્મદિવસ [૧૪૭, ૧૪૮, ૧૪૯, ૧૫૦, ૧૫૨].",
        "startPage": 116,
        "endPage": 128
    },
    {
        "chapterNumber": 10,
        "id": "sub_eng_std5_ch10",
        "titleGu": "Life Skills",
        "titleEn": "Life Skills",
        "descriptionGu": "જિજ્ઞાસુ છોકરો, સ્વ-મૂલ્યાંકન (Self Assessment), અંધ છોકરાનું સાઈનબોર્ડ અને સહાનુભૂતિ તથા પ્રત્યાયન કૌશલ્યો [૧૫૮, ૧૬૦, ૧૬૧, ૧૬૪, ૧૬૬, ૧૭૦].",
        "startPage": 129,
        "endPage": 142
    }
]

chapters_content = [
    {
      "chapterNumber": 1,
      "titleGu": "Smile Please!",
      "quizzes": [
        {
          "questionTextGu": "કવિતા મુજબ સ્મિત (Smile) ક્યાં સંતાઈ જાય છે?",
          "options": [
            { "id": "A", "textGu": "ખિસ્સામાં" },
            { "id": "B", "textGu": "ગુપ્ત સંતાવાની જગ્યાએ" },
            { "id": "C", "textGu": "દફતરમાં" },
            { "id": "D", "textGu": "શાળામાં" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કવિતામાં જણાવ્યા મુજબ જ્યારે સ્મિત જતું રહે છે, ત્યારે તમે તેની ગુપ્ત સંતાવાની જગ્યા (secret hiding place) ક્યારેય શોધી શકતા નથી [૨૮]."
        },
        {
          "questionTextGu": "ખુશી અને ખનક શાળાએથી પાછા ફરતી વખતે શું કરતા હતા?",
          "options": [
            { "id": "A", "textGu": "વાતો કરતા" },
            { "id": "B", "textGu": "રડતા હતા" },
            { "id": "C", "textGu": "એકબીજા સાથે રેસ લગાવતા" },
            { "id": "D", "textGu": "નાસ્તો કરતા" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ખુશી અને ખનક પાકા મિત્રો હતા અને શાળાએથી પાછા ફરતી વખતે તેઓ એકબીજા સાથે રેસ (raced each other) લગાવતા હતા [૨૯]."
        },
        {
          "questionTextGu": "શિક્ષિકા સરસ્વતીબેને જ્યારે ખુશીનું નામ બોલાવ્યું ત્યારે તેણે શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "તેણે જવાબ આપ્યો" },
            { "id": "B", "textGu": "તેણે હાથ ઊંચો કર્યો" },
            { "id": "C", "textGu": "તે વર્ગની બહાર ગઈ" },
            { "id": "D", "textGu": "તે ગાવા લાગી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "જ્યારે સરસ્વતીબેને બીજી વાર મોટેથી બૂમ પાડી, ત્યારે ખુશીએ માત્ર પોતાનો હાથ ઊંચો કર્યો (raised her hand) [૨૯]."
        },
        {
          "questionTextGu": "ખનકે ખુશીને હસાવવા માટે તેના બેગમાંથી શું કાઢ્યું?",
          "options": [
            { "id": "A", "textGu": "ચોકલેટ" },
            { "id": "B", "textGu": "રમકડું" },
            { "id": "C", "textGu": "રબરનો દેડકો" },
            { "id": "D", "textGu": "પુસ્તક" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ખુશીને હસાવવા માટે ખનકે તેના બેગમાંથી એક મોટો, લીલો અને રબરનો દેડકો કાઢ્યો હતો [૩૦, ૩૧]."
        },
        {
          "questionTextGu": "ખુશી આખો દિવસ કેમ હસતી કે બોલતી નહોતી?",
          "options": [
            { "id": "A", "textGu": "તે બીમાર હતી" },
            { "id": "B", "textGu": "તેને શિક્ષકે વઢ્યા હતા" },
            { "id": "C", "textGu": "તેના આગળના ચાર દાંત પડી ગયા હતા" },
            { "id": "D", "textGu": "તેનો ભાઈ ખોવાઈ ગયો હતો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વાર્તાના અંતે ખબર પડી કે ખુશીના આગળના ચાર દાંત નહોતા (front teeth were missing), તેથી તે હસતી નહોતી [૩૧]."
        }
      ],
      "flashcards": [
        { "frontGu": "Smile", "backGu": "સ્મિત - જે ચહેરા પર કરચલીઓ પાડે છે [૨૮]" },
        { "frontGu": "Funny thing", "backGu": "રમુજી વસ્તુ - કવિતામાં સ્મિતને રમુજી વસ્તુ કહેવાય છે [૨૮]" },
        { "frontGu": "Cheerful", "backGu": "આનંદી અથવા ખુશમિજાજ [૨૯]" },
        { "frontGu": "Upset", "backGu": "ગભરાયેલું અથવા વ્યગ્ર દેખાવું [૩૦]" },
        { "frontGu": "Rubber frog", "backGu": "રબરનો દેડકો - જે ખનકના હાથમાંથી સરકી ગયો હતો [૩૦, ૩૧]" }
      ]
    },
    {
      "chapterNumber": 2,
      "titleGu": "Helping Hands",
      "quizzes": [
        {
          "questionTextGu": "મિસ પોલીની ડોલી (ઢીંગલી) ને શું થયું હતું?",
          "options": [
            { "id": "A", "textGu": "તે ખોવાઈ ગઈ હતી" },
            { "id": "B", "textGu": "તે બીમાર હતી" },
            { "id": "C", "textGu": "તે રમતી હતી" },
            { "id": "D", "textGu": "તે ઊંઘતી હતી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કવિતા મુજબ મિસ પોલીની ઢીંગલી બીમાર (sick) હતી, તેથી તેણે ડોક્ટરને બોલાવ્યા હતા [૪૧]."
        },
        {
          "questionTextGu": "હેતલ, મિહિર અને મયંક ક્યાં પ્રવાસે ગયા હતા?",
          "options": [
            { "id": "A", "textGu": "નજીકના જંગલમાં" },
            { "id": "B", "textGu": "દરિયાકિનારે" },
            { "id": "C", "textGu": "પ્રાણીસંગ્રહાલયમાં" },
            { "id": "D", "textGu": "મ્યુઝિયમમાં" }
          ],
          "correctOptionId": "A",
          "explanationGu": "તેમની શાળાએ નજીકના જંગલમાં (nearby forest) એક પ્રવાસનું આયોજન કર્યું હતું [૪૩]."
        },
        {
          "questionTextGu": "જંગલમાં રાત્રે મિહિર અને મયંકે જોયેલો લીલા રંગનો જીવ કયો હતો?",
          "options": [
            { "id": "A", "textGu": "વાઘ" },
            { "id": "B", "textGu": "સસલું" },
            { "id": "C", "textGu": "એલિયન (પરગ્રહવાસી)" },
            { "id": "D", "textGu": "દેડકો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "મિહિરે ચીસ પાડી કે તે એક એલિયન (alien) હતો, જેનું શરીર પ્રકાશથી ચમકતું હતું [૪૪]."
        },
        {
          "questionTextGu": "હેતલે એલિયનની મદદ કરવા માટે શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "તેણે તેને ખાવાનું આપ્યું" },
            { "id": "B", "textGu": "તેણે તેને પાણી આપ્યું" },
            { "id": "C", "textGu": "તેણે ફર્સ્ટ એઇડ કિટ લાવી પાટો બાંધ્યો" },
            { "id": "D", "textGu": "તેણે તેને પકડી લીધો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "એલિયનના પગમાંથી લોહી નીકળતું હતું, તેથી હેતલે ફર્સ્ટ એઇડ કિટ (First Aid kit) લાવીને પાટો બાંધ્યો હતો [૪૫]."
        },
        {
          "questionTextGu": "એલિયને ત્રણેય મિત્રોને મદદ બદલ શું ભેટ આપી?",
          "options": [
            { "id": "A", "textGu": "ચોકલેટ" },
            { "id": "B", "textGu": "જાદુઈ લાકડી" },
            { "id": "C", "textGu": "3-D મેજિક બોક્સ" },
            { "id": "D", "textGu": "નવી સાઈકલ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "એલિયને તેમની મદદ અને દયા બદલ 3-D મેજિક બોક્સ (magic box) ભેટમાં આપ્યું હતું [૪૫]."
        }
      ],
      "flashcards": [
        { "frontGu": "Dolly", "backGu": "ઢીંગલી - જે મિસ પોલી પાસે હતી [૪૧]" },
        { "frontGu": "Sick", "backGu": "બીમાર અથવા અસ્વસ્થ હોવું [૪૧]" },
        { "frontGu": "Trio", "backGu": "ત્રણ વ્યક્તિઓનું જૂથ (હેતલ, મિહિર અને મયંક) [૪૩]" },
        { "frontGu": "Bonfire", "backGu": "તાપણું - જે સાંજે જંગલમાં કરવામાં આવ્યું હતું [૪૩]" },
        { "frontGu": "Alien", "backGu": "પરગ્રહવાસી - જે બીજા ગ્રહ પરથી આવ્યો હતો [૪૪]" }
      ]
    },
    {
      "chapterNumber": 3,
      "titleGu": "Nature - God's Gift",
      "quizzes": [
        {
          "questionTextGu": "મેજિક ગાર્ડન ક્યાં આવેલું હતું?",
          "options": [
            { "id": "A", "textGu": "બગીચામાં" },
            { "id": "B", "textGu": "શાળાના મેદાનમાં" },
            { "id": "C", "textGu": "ઘરની પાછળ" },
            { "id": "D", "textGu": "નદી કિનારે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સરસ્વતી વિદ્યાલયના રમતના મેદાનમાં (playground) એક જાદુઈ બગીચો હતો [૫૮]."
        },
        {
          "questionTextGu": "બગીચાના ફૂલો કોને 'નાના માળી' (little gardeners) કહેતા હતા?",
          "options": [
            { "id": "A", "textGu": "પક્ષીઓને" },
            { "id": "B", "textGu": "શાળાના બાળકોને" },
            { "id": "C", "textGu": "શિક્ષકોને" },
            { "id": "D", "textGu": "માતા-પિતાને" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ફૂલોએ એકબીજાને કહ્યું કે તેમની પાસે હજારો નાના માળીઓ છે, જેઓ તે જ શાળાના બાળકો હતા [૫૮]."
        },
        {
          "questionTextGu": "કયા વૃક્ષની ડાળીઓનો ઉપયોગ દાંત સાફ કરવા (દાતણ) માટે થાય છે?",
          "options": [
            { "id": "A", "textGu": "અશોક વૃક્ષ" },
            { "id": "B", "textGu": "લીમડો (Neem)" },
            { "id": "C", "textGu": "પીપળો" },
            { "id": "D", "textGu": "તુલસી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "લોકો લીમડાના વૃક્ષની ડાળીઓ (twigs) નો ઉપયોગ દાંત સાફ કરવા માટે કરે છે [૬૨]."
        },
        {
          "questionTextGu": "તુલસીના પાન શેમાં રાહત મેળવવા માટે મદદરૂપ છે?",
          "options": [
            { "id": "A", "textGu": "તાવ" },
            { "id": "B", "textGu": "ઉધરસ અને શરદી" },
            { "id": "C", "textGu": "માથાનો દુખાવો" },
            { "id": "D", "textGu": "પેટનો દુખાવો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તુલસીના પાન ઉધરસ અને શરદી (cough and cold) માં રાહત આપે છે [૬૩]."
        },
        {
          "questionTextGu": "પ્લાસ્ટિક કેમ હાનિકારક છે?",
          "options": [
            { "id": "A", "textGu": "તે પાણીના પ્રાણીઓને મારી નાખે છે" },
            { "id": "B", "textGu": "તે પૃથ્વીને નુકસાન કરે છે" },
            { "id": "C", "textGu": "તે પ્રાણીઓના પેટમાં જોવા મળે છે" },
            { "id": "D", "textGu": "ઉપરના તમામ" }
          ],
          "correctOptionId": "D",
          "explanationGu": "પ્લાસ્ટિક પૃથ્વીને નુકસાન કરે છે, પાણીના પ્રાણીઓને મારે છે અને જમીન પરના પ્રાણીઓના પેટમાં પણ જાય છે [૬૪]."
        }
      ],
      "flashcards": [
        { "frontGu": "Magic Garden", "backGu": "જાદુઈ બગીચો - જેમાં પરીઓ પણ હતી [૫૮, ૬૦]" },
        { "frontGu": "Sunshine", "backGu": "સૂર્યપ્રકાશ - જે બગીચામાં ફૂલોને ખૂબ ગમતો [૫૮]" },
        { "frontGu": "Medicinal Plants", "backGu": "ઔષધીય છોડ - જેમ કે લીમડો, તુલસી અને અશોક [૬૨, ૬૩]" },
        { "frontGu": "Cough and Cold", "backGu": "ઉધરસ અને શરદી - તુલસીના પાનથી રાહત મળે છે [૬૩]" },
        { "frontGu": "No to Plastic", "backGu": "પ્લાસ્ટિકને 'ના' કહો - તે આપણા ગ્રહ માટે હાનિકારક છે [૬૪]" }
      ]
    },
    {
      "chapterNumber": 4,
      "titleGu": "Animals - The Living Wonders",
      "quizzes": [
        {
          "questionTextGu": "કવિતા મુજબ બિલાડીઓ ક્યાં ઊંઘી શકે છે?",
          "options": [
            { "id": "A", "textGu": "ટેબલ કે ખુરશી પર" },
            { "id": "B", "textGu": "પિયાનોની ઉપર" },
            { "id": "C", "textGu": "પગરખાં કે ખોખામાં" },
            { "id": "D", "textGu": "કોઈપણ જગ્યાએ" }
          ],
          "correctOptionId": "D",
          "explanationGu": "કવિતામાં જણાવ્યા મુજબ બિલાડીઓ કોઈપણ જગ્યાએ (anywhere) ઊંઘી શકે છે [૭૨]."
        },
        {
          "questionTextGu": "હામિદે પતંગિયાને કોશેટો (cocoon) માંથી બહાર આવવા કેવી રીતે મદદ કરી?",
          "options": [
            { "id": "A", "textGu": "હાથથી તોડીને" },
            { "id": "B", "textGu": "કાતર વડે કાપીને" },
            { "id": "C", "textGu": "પાણી નાખીને" },
            { "id": "D", "textGu": "તેણે મદદ નહોતી કરી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "હામિદે કાતરની જોડી (pair of scissors) લીધી અને હોલ મોટો કરવા કોશેટો કાપ્યો [૭૪]."
        },
        {
          "questionTextGu": "હામિદની મદદ પછી પતંગિયું કેમ ઉડી ન શક્યું?",
          "options": [
            { "id": "A", "textGu": "તે બીમાર હતું" },
            { "id": "B", "textGu": "તેની પાંખો નબળી હતી" },
            { "id": "C", "textGu": "તેણે સંઘર્ષ (મહેનત) નહોતો કર્યો" },
            { "id": "D", "textGu": "તે ઉડવા માંગતું નહોતું" }
          ],
          "correctOptionId": "C",
          "explanationGu": "સંઘર્ષ વગર પાંખોમાં પ્રવાહી ન આવ્યું, તેથી પતંગિયું ક્યારેય ઉડી ન શક્યું [૭૫]."
        },
        {
          "questionTextGu": "'ટોડ રોક' (Toad Rock) કયા શહેરમાં આવેલું છે?",
          "options": [
            { "id": "A", "textGu": "અંબાજી" },
            { "id": "B", "textGu": "માઉન્ટ આબુ" },
            { "id": "C", "textGu": "પાવાગઢ" },
            { "id": "D", "textGu": "જૂનાગઢ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ટોડ રોક માઉન્ટ આબુમાં નખી તળાવની દક્ષિણે આવેલું છે [૭૭]."
        },
        {
          "questionTextGu": "ટોડ રોકની ટોચ પર પહોંચવા માટે કેટલા પગથિયાં ચઢવા પડે છે?",
          "options": [
            { "id": "A", "textGu": "૧૦૦" },
            { "id": "B", "textGu": "૨૦૦" },
            { "id": "C", "textGu": "૨૫૦" },
            { "id": "D", "textGu": "૫૦૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ટોડ રોકની ટોચ પર પહોંચવા માટે ૨૫૦ પગથિયાં (steps) છે [૭૭]."
        }
      ],
      "flashcards": [
        { "frontGu": "Cocoon", "backGu": "કોશેટો - જેમાંથી પતંગિયું બહાર આવે છે [૭૪]" },
        { "frontGu": "Hard work", "backGu": "સખત મહેનત - જે પતંગિયાને ઉડવા માટે જરૂરી છે [૭૫]" },
        { "frontGu": "Toad Rock", "backGu": "દેડકા જેવો પથ્થર - માઉન્ટ આબુમાં આવેલો છે [૭૭]" },
        { "frontGu": "Nakki Lake", "backGu": "નખી તળાવ - જેની પાસે ટોડ રોક છે [૭૭]" },
        { "frontGu": "Giant frog", "backGu": "વિશાળ દેડકો - ટોડ રોક જોવામાં વિશાળ દેડકા જેવો લાગે છે [૭૭]" }
      ]
    },
    {
      "chapterNumber": 5,
      "titleGu": "A Beautiful Bond",
      "quizzes": [
        {
          "questionTextGu": "મીના કેટલા વર્ષની હતી?",
          "options": [
            { "id": "A", "textGu": "૪ વર્ષ" },
            { "id": "B", "textGu": "૮ વર્ષ" },
            { "id": "C", "textGu": "૧૨ વર્ષ" },
            { "id": "D", "textGu": "૧૫ વર્ષ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "મીના બાર વર્ષની (twelve years old) હતી [૮૯]."
        },
        {
          "questionTextGu": "મીના કોને પોતાની પીઠ પર બેસાડીને ટેકરી ચઢતી હતી?",
          "options": [
            { "id": "A", "textGu": "પોતાના પુસ્તકોને" },
            { "id": "B", "textGu": "પોતાના નાના ભાઈને" },
            { "id": "C", "textGu": "નાના કૂતરાને" },
            { "id": "D", "textGu": "પોતાની મિત્રને" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મીનાએ તેના ચાર વર્ષના ભાઈને પોતાની પીઠ પર બેસાડ્યો હતો [૮૯]."
        },
        {
          "questionTextGu": "જ્યારે માણસે મીનાને પૂછ્યું કે 'શું તને ભાર નથી લાગતો?', ત્યારે મીનાએ શું જવાબ આપ્યો?",
          "options": [
            { "id": "A", "textGu": "હા, બહુ ભાર લાગે છે" },
            { "id": "B", "textGu": "ના, તે ભાર નથી, મારો ભાઈ છે" },
            { "id": "C", "textGu": "હું થાકી ગઈ છું" },
            { "id": "D", "textGu": "તેણે કંઈ જવાબ ન આપ્યો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મીનાએ નવાઈ સાથે જવાબ આપ્યો, 'તે ભાર નથી. તે મારો ભાઈ છે.' [૯૦]"
        },
        {
          "questionTextGu": "ચાલાક શિયાળ ક્યાં પડી ગયું હતું?",
          "options": [
            { "id": "A", "textGu": "નદીમાં" },
            { "id": "B", "textGu": "વાદળી રંગના ટબમાં" },
            { "id": "C", "textGu": "ખાડામાં" },
            { "id": "D", "textGu": "તે જંગલમાં જ હતું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ચાલાક શિયાળ વાદળી રંગના ટબમાં (tub of blue dye) પડી ગયું હતું [૯૧]."
        },
        {
          "questionTextGu": "શિયાળે પ્રાણીઓને ડરાવવા માટે પોતાને શું જાહેર કર્યો?",
          "options": [
            { "id": "A", "textGu": "દેવદૂત" },
            { "id": "B", "textGu": "શિકારી" },
            { "id": "C", "textGu": "રાજા" },
            { "id": "D", "textGu": "મિત્ર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "શિયાળે પ્રાણીઓને કહ્યું કે તે તેમનો રાજા (king) છે [૯૧]."
        }
      ],
      "flashcards": [
        { "frontGu": "Hill", "backGu": "ટેકરી - જેની પર લોકો પવિત્ર જગ્યાએ જતા હતા [૮૮]" },
        { "frontGu": "Brother", "backGu": "ભાઈ - મીના તેના ભાઈ પ્રત્યે ખૂબ પ્રેમ ધરાવતી હતી [૮૯, ૯૦]" },
        { "frontGu": "Load", "backGu": "ભાર - મીના માટે તેનો ભાઈ ભાર નહોતો [૯૦]" },
        { "frontGu": "Cunning Jackal", "backGu": "ચાલાક શિયાળ - જેણે વાદળી રંગનો ઉપયોગ કરી છેતરપિંડી કરી [૯૧]" },
        { "frontGu": "Howling", "backGu": "શિયાળનો અવાજ - જે રાત્રે શિયાળે કાઢ્યો અને પકડાઈ ગયો [૯૨]" }
      ]
    },
    {
      "chapterNumber": 6,
      "titleGu": "Cleanliness Habits",
      "quizzes": [
        {
          "questionTextGu": "જમ્પી વાંદરો અને તેના મિત્રો કઈ રમતો રમતા હતા?",
          "options": [
            { "id": "A", "textGu": "ક્રિકેટ અને ફૂટબોલ" },
            { "id": "B", "textGu": "થપ્પો (Hide and seek) અને ખો-ખો" },
            { "id": "C", "textGu": "કેરમ અને ચેસ" },
            { "id": "D", "textGu": "વીડિયો ગેમ્સ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તેઓ પાર્કમાં થપ્પો, બેડમિંતન અને ખો-ખો જેવી રમતો રમતા હતા [૧૦૧]."
        },
        {
          "questionTextGu": "કોકો બગલા (crane) એ પાર્કમાં શું જોયું?",
          "options": [
            { "id": "A", "textGu": "સુંદર ફૂલો" },
            { "id": "B", "textGu": "ઘણો બધો કચરો" },
            { "id": "C", "textGu": "મોટી રમત" },
            { "id": "D", "textGu": "બાળકોને" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કોકો પાર્કની ગંદકી જોઈને ચોંકી ગયો હતો [૧૦૧]."
        },
        {
          "questionTextGu": "મિત્રોએ કચરાનું શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "તેને ત્યાં જ રહેવા દીધો" },
            { "id": "B", "textGu": "તેને સળગાવી દીધો" },
            { "id": "C", "textGu": "તેને ડસ્ટબિનમાં ફેંકી દીધો" },
            { "id": "D", "textGu": "બીજા પાર્કમાં નાખી આવ્યા" }
          ],
          "correctOptionId": "C",
          "explanationGu": "મિત્રોએ કચરો ભેગો કર્યો અને તેને ડસ્ટબિન (dustbin) માં નાખ્યો [૧૦૨]."
        },
        {
          "questionTextGu": "પાર્કના દરવાજે કયા લખાણવાળું સાઈનબોર્ડ લગાવવામાં આવ્યું?",
          "options": [
            { "id": "A", "textGu": "રમત રમો" },
            { "id": "B", "textGu": "મહેરબાની કરીને પાર્કમાં કચરો ન કરો" },
            { "id": "C", "textGu": "ફૂલો તોડો નહીં" },
            { "id": "D", "textGu": "અહીં બેસો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તેમણે બોર્ડ લગાવ્યું, \"Please do not litter in the park.\" [૧૦૨]"
        },
        {
          "questionTextGu": "વ્યક્તિગત સ્વચ્છતામાં કઈ બાબતનો સમાવેશ થાય છે?",
          "options": [
            { "id": "A", "textGu": "રોજ સ્નાન કરવું" },
            { "id": "B", "textGu": "દિવસમાં બે વાર બ્રશ કરવું" },
            { "id": "C", "textGu": "છીંકતી વખતે મોઢું ઢાંકવું" },
            { "id": "D", "textGu": "ઉપરના તમામ" }
          ],
          "correctOptionId": "D",
          "explanationGu": "આ તમામ બાબતો વ્યક્તિગત સ્વચ્છતા (Personal hygiene) ના ભાગ છે [૧૦૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "Mother Earth", "backGu": "પૃથ્વી માતા - જે આપણને પાણી, જમીન અને સૂર્ય આપે છે [૧૦૦]" },
        { "frontGu": "Litter", "backGu": "કચરો અથવા ગંદકી [૧૦૧]" },
        { "frontGu": "Dustbin", "backGu": "કચરાપેટી - જેમાં કચરો નાખવો જોઈએ [૧૦૨]" },
        { "frontGu": "Handkerchief", "backGu": "રૂમાલ - છીંકતી વખતે મોઢું ઢાંકવા માટે [૧૦૩]" },
        { "frontGu": "Recycle", "backGu": "પુનઃચક્રણ - વસ્તુઓને ફેંકી ન દેતા ફરીથી ઉપયોગમાં લેવી [૧૦૦]" }
      ]
    },
    {
      "chapterNumber": 7,
      "titleGu": "Think Differently",
      "quizzes": [
        {
          "questionTextGu": "તેનાલી રામન કોણ હતા?",
          "options": [
            { "id": "A", "textGu": "એક શિકારી" },
            { "id": "B", "textGu": "કૃષ્ણદેવરાયના બુદ્ધિશાળી સલાહકાર" },
            { "id": "C", "textGu": "એક વેપારી" },
            { "id": "D", "textGu": "એક સૈનિક" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તેનાલી રામન રાજા કૃષ્ણદેવરાયના દરબારમાં બુદ્ધિશાળી અને ચતુર સલાહકાર હતા [૧૧૬]."
        },
        {
          "questionTextGu": "રામને કેવી રીતે જાણ્યું કે ઊંટ એક પગે લંગડાતું હતું?",
          "options": [
            { "id": "A", "textGu": "વેપારીએ તેને કહ્યું હતું" },
            { "id": "B", "textGu": "ત્રણ પગના નિશાનો જોઈને" },
            { "id": "C", "textGu": "તેણે ઊંટને જોયું હતું" },
            { "id": "D", "textGu": "ઊંટનો અવાજ સાંભળીને" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રામને જમીન પર માત્ર ત્રણ પગના નિશાન જોયા હતા, તેથી તેણે અનુમાન કર્યું કે ઊંટ લંગડાતું હતું [૧૧૭]."
        },
        {
          "questionTextGu": "નડાબેટ (Nadabet) કયા જિલ્લામાં આવેલું છે?",
          "options": [
            { "id": "A", "textGu": "કચ્છ" },
            { "id": "B", "textGu": "બનાસકાંઠા" },
            { "id": "C", "textGu": "પાટણ" },
            { "id": "D", "textGu": "રાજકોટ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નડાબેટ બનાસકાંઠા જિલ્લાના સુઈગામ તાલુકામાં આવેલી સરહદ છે [૧૨૨]."
        },
        {
          "questionTextGu": "નડાબેટ કઈ સરહદ (Border) માટે જાણીતું છે?",
          "options": [
            { "id": "A", "textGu": "ભારત-ચીન" },
            { "id": "B", "textGu": "ભારત-પાકિસ્તાન" },
            { "id": "C", "textGu": "ભારત-નેપાળ" },
            { "id": "D", "textGu": "ભારત-બાંગ્લાદેશ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નડાબેટ ભારત-પાકિસ્તાન સરહદ (Indo-Pak Border) પર આવેલું પ્રવાસન સ્થળ છે [૧૨૧, ૧૨૨]."
        },
        {
          "questionTextGu": "ચાચા ચૌધરીનું પાત્ર શાના માટે પ્રખ્યાત છે?",
          "options": [
            { "id": "A", "textGu": "તેમની લંબાઈ માટે" },
            { "id": "B", "textGu": "તેમની બુદ્ધિ અને ઝડપી વિચારવાની ક્ષમતા માટે" },
            { "id": "C", "textGu": "તેમના ગુસ્સા માટે" },
            { "id": "D", "textGu": "તેમના ડર માટે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ચાચા ચૌધરી ખૂબ જ ચતુર છે અને અઘરી સમસ્યાઓ ઝડપથી ઉકેલી શકે છે [૧૨૬]."
        }
      ],
      "flashcards": [
        { "frontGu": "Detective", "backGu": "જાસૂસ - જે રહસ્યો ઉકેલે છે [૧૧૪, ૧૧૬]" },
        { "frontGu": "Limping", "backGu": "લંગડાતા ચાલવું [૧૧૯, ૧૨૦]" },
        { "frontGu": "Border", "backGu": "સરહદ - જેમ કે નડાબેટ બોર્ડર [૧૨૧]" },
        { "frontGu": "BSF", "backGu": "Border Security Force - જેમના પરેડ નડાબેટમાં જોવા મળે છે [૧૨૨]" },
        { "frontGu": "Turban", "backGu": "પાઘડી - ચાચા ચૌધરી મોટી લાલ પાઘડી પહેરે છે [૧૨૬]" }
      ]
    },
    {
      "chapterNumber": 8,
      "titleGu": "Sharing is Caring",
      "quizzes": [
        {
          "questionTextGu": "મોહનભાઈ સાંજે બાળકોને શું કરતા હતા?",
          "options": [
            { "id": "A", "textGu": "ભણાવતા હતા" },
            { "id": "B", "textGu": "રમતો રમાડતા હતા" },
            { "id": "C", "textGu": "વાર્તાઓ કહેતા હતા" },
            { "id": "D", "textGu": "જમાડતા હતા" }
          ],
          "correctOptionId": "C",
          "explanationGu": "મોહનભાઈ દરરોજ સાંજે બાળકોને અદભૂત વાર્તાઓ (wonderful stories) કહેતા હતા [૧૩૫]."
        },
        {
          "questionTextGu": "રાજુ સસલાએ જાદુઈ ગાજર પાસે શું માંગ્યું?",
          "options": [
            { "id": "A", "textGu": "એક ગાજર" },
            { "id": "B", "textGu": "વિશાળ ગાજરનો બગીચો" },
            { "id": "C", "textGu": "નવું ઘર" },
            { "id": "D", "textGu": "ઘણા બધા મિત્રો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રાજુએ લાલચમાં આવીને પોતાની માટે એક વિશાળ ગાજરનો બગીચો (huge carrot garden) માંગ્યો હતો [૧૩૬]."
        },
        {
          "questionTextGu": "રાજુને ગાજરનો બગીચો મળ્યા પછી કેવું લાગ્યું?",
          "options": [
            { "id": "A", "textGu": "ખૂબ આનંદ થયો" },
            { "id": "B", "textGu": "તેને એકલતા અને દુઃખ અનુભવાયું" },
            { "id": "C", "textGu": "તે ઊંઘી ગયો" },
            { "id": "D", "textGu": "તેણે બધું ખાઈ લીધું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તે બધા ગાજર એકલો ખાઈ શકતો નહોતો, તેથી તેને એકલતા અને ઉદાસી (lonely and sad) અનુભવાઈ [૧૩૭]."
        },
        {
          "questionTextGu": "મીતા દરરોજ શાળાએ કેવી રીતે જતી હતી?",
          "options": [
            { "id": "A", "textGu": "બસમાં" },
            { "id": "B", "textGu": "સાયકલ પર" },
            { "id": "C", "textGu": "ચાલીને" },
            { "id": "D", "textGu": "રિક્ષામાં" }
          ],
          "correctOptionId": "C",
          "explanationGu": "મીતા દરરોજ શાળાએ ચાલીને (walked to school) જતી હતી [૧૩૯]."
        },
        {
          "questionTextGu": "રસ્તા પર ટ્રાફિક કેમ જામ થઈ ગયો હતો?",
          "options": [
            { "id": "A", "textGu": "અકસ્માત થયો હતો" },
            { "id": "B", "textGu": "મરઘી તેના બચ્ચાં સાથે રસ્તો ઓળંગી રહી હતી" },
            { "id": "C", "textGu": "રસ્તો બંધ હતો" },
            { "id": "D", "textGu": "ખૂબ જ વરસાદ હતો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "એક મરઘી તેના દસ બચ્ચાં (hen with ten chicks) સાથે રસ્તો ઓળંગી રહી હતી, તેથી ટ્રાફિક અટકી ગયો હતો [૧૩૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "Sharing", "backGu": "વહેંચણી - જે ખુશી લાવે છે [૧૩૭]" },
        { "frontGu": "Greedy", "backGu": "લાલચુ - વાર્તામાં રાજુ સસલો શરૂઆતમાં લાલચુ હતો [૧૩૬]" },
        { "frontGu": "Traffic Signal", "backGu": "ટ્રાફિક સિગ્નલ - જ્યાં વાહનો ઉભા રહે છે [૧૩૯]" },
        { "frontGu": "Chicks", "backGu": "મરઘીના બચ્ચાં [૧૩૯]" },
        { "frontGu": "Kind-hearted", "backGu": "દયાળુ હૃદયવાળું [૧૩૫]" }
      ]
    },
    {
      "chapterNumber": 9,
      "titleGu": "Friendship",
      "quizzes": [
        {
          "questionTextGu": "જ્યારે રઘુએ માધવને થપ્પડ મારી, ત્યારે માધવે ક્યાં લખ્યું?",
          "options": [
            { "id": "A", "textGu": "પથ્થર પર" },
            { "id": "B", "textGu": "રેતી પર" },
            { "id": "C", "textGu": "પુસ્તકમાં" },
            { "id": "D", "textGu": "તેણે ક્યાંય ન લખ્યું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "માધવ દુઃખી થયો પણ તેણે માત્ર રેતી પર (wrote on the sand) લખ્યું કે તેના મિત્રએ તેને થપ્પડ મારી [૧૪૭]."
        },
        {
          "questionTextGu": "જ્યારે રઘુએ માધવનો જીવ બચાવ્યો, ત્યારે તેણે ક્યાં કોતર્યું?",
          "options": [
            { "id": "A", "textGu": "રેતી પર" },
            { "id": "B", "textGu": "પથ્થર પર" },
            { "id": "C", "textGu": "ઝાડ પર" },
            { "id": "D", "textGu": "પાણી પર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "જીવ બચાવવા બદલ માધવે પથ્થર પર કોતર્યું (engraved on a stone) જેથી તે હંમેશા યાદ રહે [૧૪૭, ૧૪૮]."
        },
        {
          "questionTextGu": "સમશેર અને કુલદીપનું સપનું શું હતું?",
          "options": [
            { "id": "A", "textGu": "વેપારી બનવાનું" },
            { "id": "B", "textGu": "સેનામાં જોડાઈ દેશની સેવા કરવાનું" },
            { "id": "C", "textGu": "ડોક્ટર બનવાનું" },
            { "id": "D", "textGu": "વિદેશ જવાનું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બંને બાળપણના મિત્રો હતા અને સેનામાં જોડાઈ દેશની સેવા (serve the nation) કરવા માંગતા હતા [૧૪૯]."
        },
        {
          "questionTextGu": "યુદ્ધ દરમિયાન જ્યારે કુલદીપ સમશેર પાસે પહોંચ્યો, ત્યારે સમશેરે શું કહ્યું?",
          "options": [
            { "id": "A", "textGu": "હું મરી રહ્યો છું" },
            { "id": "B", "textGu": "મને ખાતરી હતી કે તું ચોક્કસ આવીશ" },
            { "id": "C", "textGu": "મને અહીંથી લઈ જા" },
            { "id": "D", "textGu": "તે કંઈ ન બોલ્યો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સમશેરના છેલ્લા શબ્દો હતા, \"મિત્ર, મને ખાતરી હતી કે તું ચોક્કસ આવીશ.\" [૧૫૦]"
        },
        {
          "questionTextGu": "હર્ષદાનો જન્મદિવસ ક્યારે છે?",
          "options": [
            { "id": "A", "textGu": "૧૫ ઓગસ્ટ" },
            { "id": "B", "textGu": "૨૭ નવેમ્બર" },
            { "id": "C", "textGu": "૧ જાન્યુઆરી" },
            { "id": "D", "textGu": "૫ સપ્ટેમ્બર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "જન્મદિવસના કાર્ડ મુજબ હર્ષદાનો જન્મદિવસ ૨૭ નવેમ્બરે છે [૧૫૨]."
        }
      ],
      "flashcards": [
        { "frontGu": "Engrave", "backGu": "કોતરવું (જેમ કે પથ્થર પર લખાણ) [૧૪૭]" },
        { "frontGu": "Rescue", "backGu": "બચાવ કરવો [૧૪૭]" },
        { "frontGu": "Army", "backGu": "લશ્કર અથવા સેના [૧૪૯]" },
        { "frontGu": "Battle", "backGu": "યુદ્ધ અથવા લડાઈ [૧૪૯]" },
        { "frontGu": "Faith", "backGu": "વિશ્વાસ - કુલદીપે તેના મિત્રનો વિશ્વાસ બચાવ્યો [૧૫૦]" }
      ]
    },
    {
      "chapterNumber": 10,
      "titleGu": "Life Skills",
      "quizzes": [
        {
          "questionTextGu": "કવિતામાં છોકરો કેવો છે?",
          "options": [
            { "id": "A", "textGu": "આળસુ" },
            { "id": "B", "textGu": "જિજ્ઞાસુ (Curious)" },
            { "id": "C", "textGu": "શાંત" },
            { "id": "D", "textGu": "તોફાની" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કવિતામાં છોકરો ખૂબ જ જિજ્ઞાસુ (curious) છે અને હંમેશા 'કેમ?' (Why?) પૂછ્યા કરે છે [૧૫૮]."
        },
        {
          "questionTextGu": "કરિયાણાની દુકાનમાં છોકરો ફોન પર શું પૂછતો હતો?",
          "options": [
            { "id": "A", "textGu": "ખાવાનું માંગતો હતો" },
            { "id": "B", "textGu": "તે લોન (ઘાસ) કાપવાનું કામ માંગતો હતો" },
            { "id": "C", "textGu": "તે સામાન મંગાવતો હતો" },
            { "id": "D", "textGu": "તે તેના પિતાને ફોન કરતો હતો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "છોકરો એક મહિલાને પૂછતો હતો કે શું તે તેને ઘાસ કાપવાનું (cutting your lawn) કામ આપી શકે [૧૬૦]."
        },
        {
          "questionTextGu": "છોકરો વાસ્તવમાં કેમ ફોન કરી રહ્યો હતો?",
          "options": [
            { "id": "A", "textGu": "કામ શોધવા" },
            { "id": "B", "textGu": "પૈસા માટે" },
            { "id": "C", "textGu": "પોતાના કામનું મૂલ્યાંકન (Performance check) કરવા" },
            { "id": "D", "textGu": "મજાક કરવા" }
          ],
          "correctOptionId": "C",
          "explanationGu": "તે પોતે જ તે મહિલાને ત્યાં કામ કરતો હતો અને માત્ર ચેક કરતો હતો કે તેના કામથી તે મહિલા સંતુષ્ટ છે કે નહીં [૧૬૧]."
        },
        {
          "questionTextGu": "અંધ છોકરાના સાઈનબોર્ડ પર માણસે કયા નવા શબ્દો લખ્યા?",
          "options": [
            { "id": "A", "textGu": "હું ભૂખ્યો છું" },
            { "id": "B", "textGu": "આજે સુંદર દિવસ છે પણ હું તે જોઈ શકતો નથી" },
            { "id": "C", "textGu": "મને પૈસા આપો" },
            { "id": "D", "textGu": "હું અંધ છું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "માણસે લખ્યું, \"Today is a beautiful day but I cannot see it.\" જેથી લોકો તેની મુશ્કેલી અનુભવી શકે [૧૬૪]."
        },
        {
          "questionTextGu": "શ્યામાએ ૨૦૨૩-૨૪માં કયા વિષયોમાં સૌથી વધુ ગુણ મેળવ્યા હતા?",
          "options": [
            { "id": "A", "textGu": "ગણિત અને અંગ્રેજી" },
            { "id": "B", "textGu": "હિન્દી અને ગુજરાતી" },
            { "id": "C", "textGu": "માત્ર ગણિત" },
            { "id": "D", "textGu": "અંગ્રેજી અને હિન્દી" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ગ્રાફ મુજબ શ્યામાએ ગણિત અને અંગ્રેજીમાં સૌથી વધુ ગુણ મેળવ્યા હતા [૧૬૬]."
        }
      ],
      "flashcards": [
        { "frontGu": "Curious", "backGu": "જિજ્ઞાસુ - જે નવી વસ્તુઓ જાણવા માંગે છે [૧૫૮]" },
        { "frontGu": "Self Assessment", "backGu": "સ્વ-મૂલ્યાંકન - પોતાના કામની જાતે ચકાસણી કરવી [૧૬૦]" },
        { "frontGu": "Positive spirit", "backGu": "હકારાત્મક અભિગમ [૧૬૧]" },
        { "frontGu": "Empathy", "backGu": "સહાનુભૂતિ - બીજાની લાગણીઓને સમજવી [૧૭૦]" },
        { "frontGu": "Communication", "backGu": "પ્રત્યાયન - વિચારોની આપ-લે કરવાનું કૌશલ્ય [૧૭૦]" }
      ]
    }
]

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
            "name": "English Second Language",
            "nameGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "name_en": "Standard 5 English (Second Language)",
            "name_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "title": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "icon": "🔤",
            "order": 5,
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
            "name": "English Second Language",
            "nameGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "name_en": "Standard 5 English (Second Language)",
            "name_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "title": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "icon": "🔤",
            "order": 5,
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
            "name": "English Second Language",
            "nameGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "name_en": "Standard 5 English (Second Language)",
            "name_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "title": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "icon": "🔤",
            "order": 5,
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
            "name": "English Second Language",
            "nameGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "name_en": "Standard 5 English (Second Language)",
            "name_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "title": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5",
            "icon": "🔤",
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
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5 પાઠ્યપુસ્તક",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5 પાઠ્યપુસ્તક",
            "title_en": "Standard 5 English (Second Language) Textbook",
            "titleEn": "Standard 5 English (Second Language) Textbook",
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
        "pdfPageOffset": 10,
        "pageIndex": start_page - 1,
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
    quiz_id = f"quiz_std5_eng_{ch_id}"
    question_docs = []
    question_ids = []

    for q_idx, q in enumerate(q_list):
        q_text = q["questionTextGu"]
        opts_list = q["options"]
        correct_ans = q["correctOptionId"]
        explanation = q["explanationGu"]
        qz_q_id = f"q_std5_eng_{ch_id}_{q_idx+1}"

        option_map = {opt["id"]: opt["textGu"] for opt in opts_list}

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
            fc_id = f"fc_std5_eng_{ch_id}_{idx+1}"

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

    # Build AI Knowledge Base Documents for Qdrant
    q_docs = quiz_map.get(ch_id, [])
    q_summary = "\n".join([f"પ્રશ્ન: {q['questionTextGu']} | જવાબ: {q['correctOptionId']} | સમજૂતી: {q['explanationGu']}" for q in q_docs])
    fcs = fc_by_chapter.get(ch_id, [])
    fc_summary = "\n".join([f"શબ્દાર્થ: {f[0]} -> {f[1]}" for f in fcs])

    content = f"વિષય: અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 5\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std5_eng_{ch_id}",
        "standard_id": "5",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "અંગ્રેજી", "ધોરણ 5"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [start_page],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std5_english_sl_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 5 English SL payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
