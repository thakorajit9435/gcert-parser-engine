#!/usr/bin/env python3
"""
Builds complete std4_english_sl_payload.json for GCERT Standard 4 English Second Language (અંગ્રેજી દ્વિતીય ભાષા ધોરણ 4).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-4%20English_Second%20Language.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-4 English_Second Language.pdf"
storage_path = "textbooks/Std-4 English_Second Language.pdf"

subject_id = "sub_eng_std4_sl"
subject_id_alt1 = "sub_english_std4_sl"
subject_id_alt2 = "sub_english_std4"
subject_id_alt3 = "sub_eng_std4"

standard_id = "std_4"
standard_number = 4
session = "1"

chapters_data = [
    {
      "id": "sub_eng_std4_ch1",
      "chapterNumber": 1,
      "titleGu": "Let's Celebrate",
      "title_en": "Let's Celebrate",
      "descriptionGu": "પતંગિયાના અભિનય ગીત અને ઉંદર ભાઈઓની મેળાની વાર્તા 'A Day at the Carnival' દ્વારા તહેવારોની મજા સમજાવવામાં આવી છે [૨૭, ૨૮, ૨૯].",
      "start_page": 11,
      "end_page": 24,
      "pdfPageOffset": 10,
      "pageIndex": 10
    },
    {
      "id": "sub_eng_std4_ch2",
      "chapterNumber": 2,
      "titleGu": "Animals - Our Faithful Friends",
      "title_en": "Animals - Our Faithful Friends",
      "descriptionGu": "વૃક્ષ વિશેનું ગીત અને શેળો (Sheru Hedgehog) ની વાર્તા દ્વારા પ્રાણીઓ પ્રત્યેના પ્રેમ અને સાચી મિત્રતાનો બોધ આપ્યો છે [૩૮, ૩૯, ૪૦].",
      "start_page": 25,
      "end_page": 36,
      "pdfPageOffset": 10,
      "pageIndex": 24
    },
    {
      "id": "sub_eng_std4_ch3",
      "chapterNumber": 3,
      "titleGu": "My Actions",
      "title_en": "My Actions",
      "descriptionGu": "દૈનિક ક્રિયાઓના ગીત 'My Busy Day' અને બે મિત્રો તથા રીંછની વાર્તા દ્વારા સ્વાર્થી મિત્રોથી દૂર રહેવાની સમજ આપી છે [૫૧, ૫૨].",
      "start_page": 37,
      "end_page": 45,
      "pdfPageOffset": 10,
      "pageIndex": 36
    },
    {
      "id": "sub_eng_std4_ch4",
      "chapterNumber": 4,
      "titleGu": "I Love my Family",
      "title_en": "I Love my Family",
      "descriptionGu": "કુટુંબના સભ્યો પ્રત્યેના આદરનું ગીત અને વૃદ્ધ ખેડૂત તથા તેના દીકરાઓની 'એકતામાં શક્તિ' વાર્તાનો સમાવેશ છે [૬૧, ૬૨].",
      "start_page": 46,
      "end_page": 55,
      "pdfPageOffset": 10,
      "pageIndex": 45
    },
    {
      "id": "sub_eng_std4_ch5",
      "chapterNumber": 5,
      "titleGu": "I Can",
      "title_en": "I Can",
      "descriptionGu": "પ્રાણીઓની શક્તિઓનું ગીત અને રમતિયાળ ભરવાડના છોકરાની વાર્તા દ્વારા પ્રમાણિકતાનું મહત્વ સમજાવ્યું છે [૭૨, ૭૩].",
      "start_page": 56,
      "end_page": 65,
      "pdfPageOffset": 10,
      "pageIndex": 55
    },
    {
      "id": "sub_eng_std4_ch6",
      "chapterNumber": 6,
      "titleGu": "The Sky is Falling",
      "title_en": "The Sky is Falling",
      "descriptionGu": "ચાલવા અને દોડવાના ગીત સાથે સસલાની 'આકાશ પડ્યું' ની મજેદાર વાર્તા દ્વારા સત્ય જાણવાની પ્રેરણા આપી છે [૮૩, ૮૪, ૮૫].",
      "start_page": 66,
      "end_page": 77,
      "pdfPageOffset": 10,
      "pageIndex": 65
    },
    {
      "id": "sub_eng_std4_ch7",
      "chapterNumber": 7,
      "titleGu": "Did It Yesterday, Do It Today",
      "title_en": "Did It Yesterday, Do It Today",
      "descriptionGu": "પાંચ બતકના બચ્ચાંનું ગીત અને સાધુ તથા વિંછીની વાર્તા દ્વારા ભૂતકાળની ક્રિયાઓ અને પરોપકારી સ્વભાવની સમજ આપી છે [૯૭, ૯૮, ૯૯].",
      "start_page": 78,
      "end_page": 87,
      "pdfPageOffset": 10,
      "pageIndex": 77
    },
    {
      "id": "sub_eng_std4_ch8",
      "chapterNumber": 8,
      "titleGu": "My Moods, My Feelings",
      "title_en": "My Moods, My Feelings",
      "descriptionGu": "વિવિધ વ્યવસાયોના ગીત અને ભક્ત પ્રહલાદની વાર્તા દ્વારા માનવીય લાગણીઓ અને અતૂટ શ્રદ્ધાનો પરિચય આપ્યો છે [૧૦૯, ૧૧૦, ૧૧૧].",
      "start_page": 88,
      "end_page": 99,
      "pdfPageOffset": 10,
      "pageIndex": 87
    },
    {
      "id": "sub_eng_std4_ch9",
      "chapterNumber": 9,
      "titleGu": "Our World",
      "title_en": "Our World",
      "descriptionGu": "ઉપર-નીચેની હિલચાલના ગીત અને ગણેશજીની બુદ્ધિની વાર્તા દ્વારા માતા-પિતા જ આપણી સાચી દુનિયા છે તે બોધ આપ્યો છે [૧૨૨, ૧૨૩, ૧૨૬].",
      "start_page": 100,
      "end_page": 111,
      "pdfPageOffset": 10,
      "pageIndex": 99
    },
    {
      "id": "sub_eng_std4_ch10",
      "chapterNumber": 10,
      "titleGu": "Safety First",
      "title_en": "Safety First",
      "descriptionGu": "રસ્તો ઓળંગવાની સાવચેતીનું ગીત અને બિનિયાની વાદળી છત્રીની વાર્તા દ્વારા સુરક્ષા અને આત્મસંતોષની સમજૂતી આપી છે [૧૩૪, ૧૩૫, ૧૩૬].",
      "start_page": 112,
      "end_page": 122,
      "pdfPageOffset": 10,
      "pageIndex": 111
    }
]

quizzes_raw = [
    {
      "chapterId": "sub_eng_std4_ch1",
      "questions": [
        {
          "questionTextGu": "'Butterfly' કવિતામાં પતંગિયું છેલ્લે શું કહે છે?",
          "options": [
            { "id": "A", "textGu": "Hello" },
            { "id": "B", "textGu": "Good-bye" },
            { "id": "C", "textGu": "Fly away" },
            { "id": "D", "textGu": "Touch the ground" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કવિતાની છેલ્લી પંક્તિ મુજબ પતંગિયું આકાશને આંબીને 'good-bye' કહે છે [૨૮]."
        },
        {
          "questionTextGu": "'A Day at the Carnival' વાર્તામાં કયો ઉંદર ખોવાઈ ગયો હતો?",
          "options": [
            { "id": "A", "textGu": "Little mouse" },
            { "id": "B", "textGu": "Lucky mouse" },
            { "id": "C", "textGu": "Tiny mouse" },
            { "id": "D", "textGu": "Big mouse" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વાર્તા મુજબ લિટલ માઉસ અને લકી માઉસ સાથે ગયેલો નાનકડો 'Tiny mouse' મેળામાં ખોવાઈ ગયો હતો [૩૦]."
        },
        {
          "questionTextGu": "ત્રણેય ઉંદર ભાઈઓએ મેળામાં કયો રસ પીધો?",
          "options": [
            { "id": "A", "textGu": "Mango juice" },
            { "id": "B", "textGu": "Orange juice" },
            { "id": "C", "textGu": "Sugarcane juice" },
            { "id": "D", "textGu": "Apple juice" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ઉંદર ભાઈઓએ મેળામાં શેરડીનો રસ (sugarcane juice) પીધો હતો [૩૦]."
        },
        {
          "questionTextGu": "હાથીના બચ્ચાં 'અપ્પુ' (Appu) નું વજન કેટલું છે?",
          "options": [
            { "id": "A", "textGu": "50 kg" },
            { "id": "B", "textGu": "100 kg" },
            { "id": "C", "textGu": "200 kg" },
            { "id": "D", "textGu": "500 kg" }
          ],
          "correctOptionId": "B",
          "explanationGu": "અપ્પુ હાથીના વર્ણન મુજબ તેનું વજન ૧૦૦ કિલોગ્રામ (100 kg) છે [૩૧]."
        },
        {
          "questionTextGu": "હોળીનો તહેવાર કયા મહિનામાં ઉજવવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "શ્રાવણ" },
            { "id": "B", "textGu": "ફાગણ" },
            { "id": "C", "textGu": "કારતક" },
            { "id": "D", "textGu": "ચૈત્ર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પુસ્તકમાં ઉલ્લેખ છે કે 'Holi is celebrated on Purnima in the month of Falgun' [૩૩]."
        }
      ]
    },
    {
      "chapterId": "sub_eng_std4_ch2",
      "questions": [
        {
          "questionTextGu": "શેળો (Sheru) ને તેના શરીર પર શું નહોતું ગમતું?",
          "options": [
            { "id": "A", "textGu": "તેની પૂંછડી" },
            { "id": "B", "textGu": "તેના કાન" },
            { "id": "C", "textGu": "તેના શરીર પરના કાંટા (quills)" },
            { "id": "D", "textGu": "તેનો રંગ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "શેરુને તેના આખા શરીર પર રહેલા તીક્ષ્ણ કાંટા (sharp quills) ગમતા નહોતા [૩૯]."
        },
        {
          "questionTextGu": "કયા પ્રાણીને રણનું વાહન કહેવામાં આવે છે અને તેની પીઠ પર ખૂંધ હોય છે?",
          "options": [
            { "id": "A", "textGu": "ઘોડો" },
            { "id": "B", "textGu": "ઊંટ (Camel)" },
            { "id": "C", "textGu": "હાથી" },
            { "id": "D", "textGu": "ઝીબ્રા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઊંટ (Camel) રણમાં રહે છે અને તેને પીઠ પર ખૂંધ (hump) હોય છે [૪૩]."
        },
        {
          "questionTextGu": "કયા પક્ષીને પાંખો અને પૂંછડી હોતી નથી?",
          "options": [
            { "id": "A", "textGu": "Ostrich" },
            { "id": "B", "textGu": "Peacock" },
            { "id": "C", "textGu": "Kiwi" },
            { "id": "D", "textGu": "Sparrow" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કિવી (Kiwi) એક રમુજી પક્ષી છે કારણ કે તેને પાંખો કે પૂંછડી હોતી નથી [૪૪]."
        },
        {
          "questionTextGu": "ભૂખ્યા શિયાળે દ્રાક્ષ મેળવવા શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "ઝાડ પર ચઢ્યો" },
            { "id": "B", "textGu": "વારંવાર કૂદકા માર્યા (jumped)" },
            { "id": "C", "textGu": "પથ્થર માર્યો" },
            { "id": "D", "textGu": "રડવા લાગ્યો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "શિયાળ દ્રાક્ષ સુધી પહોંચવા વારંવાર કૂદ્યો પણ પહોંચી શક્યો નહીં [૪૬]."
        },
        {
          "questionTextGu": "દ્રાક્ષ ન મળતા શિયાળે છેલ્લે શું કહ્યું?",
          "options": [
            { "id": "A", "textGu": "દ્રાક્ષ મીઠી છે" },
            { "id": "B", "textGu": "દ્રાક્ષ ખાટી છે (sour)" },
            { "id": "C", "textGu": "દ્રાક્ષ કડવી છે" },
            { "id": "D", "textGu": "દ્રાક્ષ લીલી છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "હાર માનીને શિયાળે કહ્યું કે 'The grapes are sour' (દ્રાક્ષ ખાટી છે) [૪૬]."
        }
      ]
    },
    {
      "chapterId": "sub_eng_std4_ch3",
      "questions": [
        {
          "questionTextGu": "કલ્લુ અને બિલ્લુ જ્યારે જંગલમાં ફરતા હતા ત્યારે અચાનક શું જોયું?",
          "options": [
            { "id": "A", "textGu": "વાઘ" },
            { "id": "B", "textGu": "સિંહ" },
            { "id": "C", "textGu": "રીંછ (Bear)" },
            { "id": "D", "textGu": "હાથી" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વાર્તા મુજબ કલ્લુ અને બિલ્લુએ જંગલમાં અચાનક એક રીંછ (bear) જોયું [૫૨]."
        },
        {
          "questionTextGu": "રીંછને જોઈને કલ્લુએ શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "બૂમો પાડી" },
            { "id": "B", "textGu": "ઝડપથી ઝાડ પર ચઢી ગયો" },
            { "id": "C", "textGu": "નદીમાં કૂદ્યો" },
            { "id": "D", "textGu": "રીંછ સામે લડ્યો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રીંછ આવતા જ કલ્લુ દોડીને ઝાડ પર ચઢી ગયો અને મિત્રને મદદ ન કરી [૫૨]."
        },
        {
          "questionTextGu": "બિલ્લુએ પોતાની જાતને બચાવવા માટે કેવી યુક્તિ કરી?",
          "options": [
            { "id": "A", "textGu": "તે ભાગી ગયો" },
            { "id": "B", "textGu": "તે મરેલા જેવો થઈને સૂઈ રહ્યો" },
            { "id": "C", "textGu": "તેણે બૂમો પાડી" },
            { "id": "D", "textGu": "તે છુપાઈ ગયો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બિલ્લુ મરેલા માણસની જેમ સૂઈ ગયો અને પોતાનો શ્વાસ રોકી રાખ્યો [૫૩]."
        },
        {
          "questionTextGu": "ભારતના રાષ્ટ્રધ્વજમાં અશોક ચક્ર કયા રંગનું હોય છે?",
          "options": [
            { "id": "A", "textGu": "કાળું" },
            { "id": "B", "textGu": "નેવી બ્લૂ (Navy Blue)" },
            { "id": "C", "textGu": "લીલું" },
            { "id": "D", "textGu": "કેસરી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રાષ્ટ્રધ્વજના મધ્યમાં સફેદ પટ્ટી પર નેવી બ્લૂ રંગનું અશોક ચક્ર હોય છે [૫૪]."
        },
        {
          "questionTextGu": "રાષ્ટ્રધ્વજમાં અશોક ચક્રમાં કુલ કેટલા આરા (spokes) હોય છે?",
          "options": [
            { "id": "A", "textGu": "૧૨" },
            { "id": "B", "textGu": "૨૦" },
            { "id": "C", "textGu": "૨૪" },
            { "id": "D", "textGu": "૩૦" }
          ],
          "correctOptionId": "C",
          "explanationGu": "અશોક ચક્રમાં કુલ ૨૪ આરા (24 spokes) હોય છે [૫૪]."
        }
      ]
    }
]

flashcards_raw = [
    {
      "chapterId": "sub_eng_std4_ch1",
      "cards": [
        { "frontGu": "Butterfly", "backGu": "પતંગિયું [૨૮]" },
        { "frontGu": "Carnival", "backGu": "મેળો [૨૯]" },
        { "frontGu": "Sugarcane", "backGu": "શેરડી [૩૦]" },
        { "frontGu": "Tusks", "backGu": "હાથીના દંતશૂળ [૩૧]" },
        { "frontGu": "Trunk", "backGu": "હાથીની સૂંઢ [૩૧]" }
      ]
    },
    {
      "chapterId": "sub_eng_std4_ch2",
      "cards": [
        { "frontGu": "Hedgehog", "backGu": "શેળો (કાંટાળું પ્રાણી) [૩૯]" },
        { "frontGu": "Quills", "backGu": "શરીર પરના કાંટા [૪૦]" },
        { "frontGu": "Hump", "backGu": "ઊંટની ખૂંધ [૪૩]" },
        { "frontGu": "Grapes", "backGu": "દ્રાક્ષ [૪૫]" },
        { "frontGu": "Sour", "backGu": "ખાટું [૪૬]" }
      ]
    },
    {
      "chapterId": "sub_eng_std4_ch3",
      "cards": [
        { "frontGu": "Selfish", "backGu": "સ્વાર્થી [૫૩]" },
        { "frontGu": "Bear", "backGu": "રીંછ [૫૨]" },
        { "frontGu": "Saffron", "backGu": "કેસરી રંગ [૫૪]" },
        { "frontGu": "National Flag", "backGu": "રાષ્ટ્રધ્વજ [૫૪]" },
        { "frontGu": "Spokes", "backGu": "ચક્રના આરા [૫૪]" }
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
            "name": "Standard 4 English Second Language",
            "nameGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 4",
            "name_en": "Standard 4 English (Second Language)",
            "name_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 4",
            "title": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 4",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 4",
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 4",
            "icon": "🔤",
            "order": 2,
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
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 4 પાઠ્યપુસ્તક",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 4 પાઠ્યપુસ્તક",
            "title_en": "Standard 4 English Second Language Textbook",
            "titleEn": "Standard 4 English Second Language Textbook",
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
            "total_chapters": len(chapters_data)
        }
    ],
    "sessions": [
        {
            "session_id": f"session_{standard_id}_sem{session}",
            "standardId": "4",
            "standard_id": "4",
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
        quiz_id = f"quiz_std4_eng_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std4_eng_{ch_id}_{q_idx+1}"

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

# 3. Process Flashcards
fc_by_chapter = {}
for fc_group in flashcards_raw:
    ch_id = fc_group["chapterId"]
    c_list = fc_group["cards"]
    tp_id = f"{ch_id}_tp1"

    for idx, fc in enumerate(c_list):
        front_gu = fc["frontGu"]
        back_gu = fc["backGu"]
        fc_id = f"fc_std4_eng_{ch_id}_{idx+1}"

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

# 4. Generate AI Knowledge Base Documents for all 10 chapters
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

    content = f"વિષય: અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 4\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std4_eng_{ch_id}",
        "standard_id": "4",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "અંગ્રેજી", "ધોરણ 4"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std4_english_sl_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 4 English SL payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
