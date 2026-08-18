#!/usr/bin/env python3
"""
Builds complete std3_english_sl_payload.json for GCERT Standard 3 English Second Language (અંગ્રેજી દ્વિતીય ભાષા ધોરણ 3).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-3_English_Second%20Lang%20(1).pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-3_English_Second Lang (1).pdf"
storage_path = "textbooks/Std-3_English_Second Lang (1).pdf"

subject_id = "sub_eng_std3_sl"
subject_id_alt1 = "sub_english_std3_sl"
subject_id_alt2 = "sub_english_std3"
subject_id_alt3 = "sub_eng_std3"

standard_id = "std_3"
standard_number = 3
session = "1"

chapters_data = [
    {
      "id": "sub_eng_std3_ch1",
      "chapterNumber": 1,
      "titleGu": "Pre-reading Activities",
      "title_en": "Pre-reading Activities",
      "descriptionGu": "આ એકમમાં કેપિટલ અને સ્મોલ મૂળાક્ષરોમાં રંગ પૂરવા, ટપકાં જોડીને ચિત્રો પૂર્ણ કરવા અને 'I am a Little Teapot' જેવી બાળવાર્તાઓનો સમાવેશ છે [૨૭, ૩૦].",
      "start_page": 11,
      "end_page": 20,
      "pdfPageOffset": 10,
      "pageIndex": 10
    },
    {
      "id": "sub_eng_std3_ch2",
      "chapterNumber": 2,
      "titleGu": "Unit - 1 Colours All Around",
      "title_en": "Colours All Around",
      "descriptionGu": "ફળો અને રંગો વિશેની કવિતા, ઉખાણાં અને વિરોધી શબ્દો (big-small, hot-cold) ની પાયાની સમજ આપતો એકમ [૩૨, ૩૪].",
      "start_page": 21,
      "end_page": 30,
      "pdfPageOffset": 10,
      "pageIndex": 20
    },
    {
      "id": "sub_eng_std3_ch3",
      "chapterNumber": 3,
      "titleGu": "Unit - 2 Beautiful Birds",
      "title_en": "Beautiful Birds",
      "descriptionGu": "'Little Bird' અભિનય ગીત અને 'The Big Tree' વાર્તા દ્વારા પક્ષીઓના નામ અને તેમની વિશેષતાઓની સમજ [૪૧, ૪૩].",
      "start_page": 31,
      "end_page": 40,
      "pdfPageOffset": 10,
      "pageIndex": 30
    },
    {
      "id": "sub_eng_std3_ch4",
      "chapterNumber": 4,
      "titleGu": "Unit - 3 Rainbow",
      "title_en": "Rainbow",
      "descriptionGu": "મેઘધનુષના રંગોનું ગીત, 'The Fox and the Grapes' ની જાણીતી વાર્તા અને ૬૧ થી ૭૦ સુધીના અંકોની ઓળખ [૫૦, ૫૧, ૫૪].",
      "start_page": 41,
      "end_page": 50,
      "pdfPageOffset": 10,
      "pageIndex": 40
    },
    {
      "id": "sub_eng_std3_ch5",
      "chapterNumber": 5,
      "titleGu": "Unit - 4 Lion or Donkey?",
      "title_en": "Lion or Donkey?",
      "descriptionGu": "સિંહના ચામડામાં ગધેડાની રમુજી વાર્તા દ્વારા બાળકોને નકલ ન કરવા અને પોતાની ઓળખ જાળવી રાખવાનો બોધ [૫૯].",
      "start_page": 51,
      "end_page": 55,
      "pdfPageOffset": 10,
      "pageIndex": 50
    },
    {
      "id": "sub_eng_std3_ch6",
      "chapterNumber": 6,
      "titleGu": "Unit - 5 Happy Cloud",
      "title_en": "Happy Cloud",
      "descriptionGu": "વાદળ અને જંગલ વચ્ચેના સંવાદની વાર્તા અને 'If You Are Happy' એક્શન સોન્ગ દ્વારા વિવિધ અભિવાદનોની સમજ [૬૪, ૬૫].",
      "start_page": 56,
      "end_page": 63,
      "pdfPageOffset": 10,
      "pageIndex": 55
    },
    {
      "id": "sub_eng_std3_ch7",
      "chapterNumber": 7,
      "titleGu": "Unit - 6 Useful Things",
      "title_en": "Useful Things",
      "descriptionGu": "રોજિંદા જીવનમાં ઉપયોગી વસ્તુઓ, તેમના આકાર અને સર્વનામો (his, her, its) નો વાક્યોમાં ઉપયોગ [૭૪, ૭૭].",
      "start_page": 64,
      "end_page": 76,
      "pdfPageOffset": 10,
      "pageIndex": 63
    },
    {
      "id": "sub_eng_std3_ch8",
      "chapterNumber": 8,
      "titleGu": "Unit - 7 Our Helpers",
      "title_en": "Our Helpers",
      "descriptionGu": "વિવિધ વ્યવસાયકારોના કાર્યો અને 'The Tortoise and the Swans' ની બોધપ્રદ વાર્તા દ્વારા મદદની ભાવના [૮૭, ૯૨].",
      "start_page": 77,
      "end_page": 87,
      "pdfPageOffset": 10,
      "pageIndex": 76
    },
    {
      "id": "sub_eng_std3_ch9",
      "chapterNumber": 9,
      "titleGu": "Unit - 8 Animals, Our Friends",
      "title_en": "Animals, Our Friends",
      "descriptionGu": "પ્રાણીઓને ઓળખવા માટેનું ગીત, 'The Greedy Dog' ની વાર્તા અને This/That/These/Those નો ઉપયોગ [૯૮, ૧૦૨, ૧૦૪].",
      "start_page": 88,
      "end_page": 97,
      "pdfPageOffset": 10,
      "pageIndex": 87
    },
    {
      "id": "sub_eng_std3_ch10",
      "chapterNumber": 10,
      "titleGu": "Unit - 9 Not Hard at all",
      "title_en": "Not Hard at all",
      "descriptionGu": "અંગ્રેજી ભાષા શીખવી સરળ છે તે સમજાવતું ગીત અને ખેડૂત તથા સારસની વાર્તા [૧૧૨, ૧૧૪].",
      "start_page": 98,
      "end_page": 102,
      "pdfPageOffset": 10,
      "pageIndex": 97
    },
    {
      "id": "sub_eng_std3_ch11",
      "chapterNumber": 11,
      "titleGu": "Enrichment Activities",
      "title_en": "Enrichment Activities",
      "descriptionGu": "ભાષાસમૃદ્ધિ માટે વધારાની જાણકારી, ઉખાણાં, સંવાદો અને પ્રેરક ટૂંકી વાર્તાઓ જેવી રસપ્રદ પ્રવૃત્તિઓ [૧૨૬].",
      "start_page": 103,
      "end_page": 122,
      "pdfPageOffset": 10,
      "pageIndex": 102
    }
]

chapters_content = [
    {
      "id": "sub_eng_std3_ch1",
      "chapterNumber": 1,
      "titleGu": "Pre-reading Activities",
      "quizzes": [
        {
          "questionTextGu": "'I am a Little Teapot' ગીતમાં કીટલીનો આકાર કેવો વર્ણવવામાં આવ્યો છે?",
          "options": [
            { "id": "A", "textGu": "Tall and thin" },
            { "id": "B", "textGu": "Short and stout" },
            { "id": "C", "textGu": "Big and heavy" },
            { "id": "D", "textGu": "Small and light" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગીતની પંક્તિ 'Short and stout' મુજબ કીટલી ઠીંગણી અને મજબૂત છે [1]."
        },
        {
          "questionTextGu": "કીટલીના કયા ભાગમાંથી ચા રેડવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "Handle" },
            { "id": "B", "textGu": "Lid" },
            { "id": "C", "textGu": "Spout" },
            { "id": "D", "textGu": "Base" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કીટલીના નાળચાને અંગ્રેજીમાં 'Spout' કહેવામાં આવે છે, જેમાંથી પ્રવાહી રેડાય છે [1, 2]."
        },
        {
          "questionTextGu": "જ્યારે કીટલી ગરમ (steamed) થાય છે ત્યારે તે શું કરે છે?",
          "options": [
            { "id": "A", "textGu": "Dance" },
            { "id": "B", "textGu": "Sleep" },
            { "id": "C", "textGu": "Shout" },
            { "id": "D", "textGu": "Jump" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ગીત મુજબ 'When I get all steamed, Hear me shout' એટલે કે તે અવાજ કરે છે [1]."
        },
        {
          "questionTextGu": "પ્રી-રીડિંગ પ્રવૃત્તિમાં ટપકાં જોડીને કયું મોટું પ્રાણી બનાવવાનું છે?",
          "options": [
            { "id": "A", "textGu": "Lion" },
            { "id": "B", "textGu": "Elephant" },
            { "id": "C", "textGu": "Giraffe" },
            { "id": "D", "textGu": "Camel" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પાના નંબર 4 પર અંગ્રેજી મૂળાક્ષરો જોડીને હાથી (Elephant) નું ચિત્ર બનાવવાની પ્રવૃત્તિ છે [3]."
        },
        {
          "questionTextGu": "કીટલી પકડી રાખવા માટે કયા ભાગનો ઉપયોગ થાય છે?",
          "options": [
            { "id": "A", "textGu": "Spout" },
            { "id": "B", "textGu": "Lid" },
            { "id": "C", "textGu": "Handle" },
            { "id": "D", "textGu": "Base" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કીટલી પકડવાના હાથાને 'Handle' કહેવામાં આવે છે [1, 2]."
        }
      ],
      "flashcards": [
        { "frontGu": "Handle", "backGu": "પકડવાનો હાથો [1]" },
        { "frontGu": "Spout", "backGu": "નાળચું (જ્યાંથી પ્રવાહી બહાર આવે) [1]" },
        { "frontGu": "Lid", "backGu": "કીટલીનું ઢાંકણ [2]" },
        { "frontGu": "Short and stout", "backGu": "ઠીંગણું અને મજબૂત [1]" },
        { "frontGu": "Pour out", "backGu": "બહાર રેડવું [1]" }
      ]
    },
    {
      "id": "sub_eng_std3_ch2",
      "chapterNumber": 2,
      "titleGu": "Colours All Around",
      "quizzes": [
        {
          "questionTextGu": "ઉખાણા મુજબ ફળોનો રાજા કોણ છે?",
          "options": [
            { "id": "A", "textGu": "Apple" },
            { "id": "B", "textGu": "Mango" },
            { "id": "C", "textGu": "Banana" },
            { "id": "D", "textGu": "Orange" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઉખાણામાં 'I am the king of fruits' તરીકે કેરી (Mango) નો ઉલ્લેખ છે [4]."
        },
        {
          "questionTextGu": "કયું ફળ લાલ અને ગોળ છે અને શિયાળામાં મળે છે?",
          "options": [
            { "id": "A", "textGu": "Guava" },
            { "id": "B", "textGu": "Berry" },
            { "id": "C", "textGu": "Apple" },
            { "id": "D", "textGu": "Pear" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ઉખાણા મુજબ 'I am red, I am round... When winter is around' એટલે સફરજન (Apple) [4]."
        },
        {
          "questionTextGu": "હાથી (Elephant) માટે કયો વિરોધી શબ્દ યોગ્ય છે?",
          "options": [
            { "id": "A", "textGu": "Small" },
            { "id": "B", "textGu": "Short" },
            { "id": "C", "textGu": "Big" },
            { "id": "D", "textGu": "New" }
          ],
          "correctOptionId": "C",
          "explanationGu": "કદની સરખામણીમાં હાથી મોટો (Big) હોય છે [5, 6]."
        },
        {
          "questionTextGu": "'Cold' (ઠંડુ) શબ્દનો સાચો વિરોધી શબ્દ કયો છે?",
          "options": [
            { "id": "A", "textGu": "Fast" },
            { "id": "B", "textGu": "Hot" },
            { "id": "C", "textGu": "Heavy" },
            { "id": "D", "textGu": "New" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઠંડુ (Cold) નું વિરોધી ગરમ (Hot) થાય છે [5, 6]."
        },
        {
          "questionTextGu": "૫૬ (56) ને અંગ્રેજી શબ્દોમાં કેવી રીતે લખાય?",
          "options": [
            { "id": "A", "textGu": "Fifty-one" },
            { "id": "B", "textGu": "Sixty-five" },
            { "id": "C", "textGu": "Fifty-six" },
            { "id": "D", "textGu": "Fifty-five" }
          ],
          "correctOptionId": "C",
          "explanationGu": "અંકોની ગણતરી મુજબ ૫૬ એટલે Fifty-six [7]."
        }
      ],
      "flashcards": [
        { "frontGu": "Big - Small", "backGu": "મોટું - નાનું [5]" },
        { "frontGu": "Hot - Cold", "backGu": "ગરમ - ઠંડું [5]" },
        { "frontGu": "Fast - Slow", "backGu": "ઝડપી - ધીમું [5]" },
        { "frontGu": "Circle", "backGu": "વર્તુળ / ગોળ [8]" },
        { "frontGu": "Rectangle", "backGu": "લંબચોરસ [8]" }
      ]
    },
    {
      "id": "sub_eng_std3_ch3",
      "chapterNumber": 3,
      "titleGu": "Beautiful Birds",
      "quizzes": [
        {
          "questionTextGu": "વાર્તા મુજબ માળામાં રહેતા ત્રણ બચ્ચાં પક્ષીઓના નામ શું હતા?",
          "options": [
            { "id": "A", "textGu": "Jerry, Billy, Kiwi" },
            { "id": "B", "textGu": "Pinku, Tinku, Minku" },
            { "id": "C", "textGu": "Leo, Meo, Teo" },
            { "id": "D", "textGu": "Parrot, Crow, Duck" }
          ],
          "correctOptionId": "A",
          "explanationGu": "'The Big Tree' વાર્તા મુજબ ત્રણ બચ્ચાં પક્ષીઓ Jerry, Billy અને Kiwi હતા [9]."
        },
        {
          "questionTextGu": "પક્ષીઓના બચ્ચાંને ખાવા માટે કોણ આવ્યું હતું?",
          "options": [
            { "id": "A", "textGu": "Lion" },
            { "id": "B", "textGu": "Fox" },
            { "id": "C", "textGu": "Snake" },
            { "id": "D", "textGu": "Cat" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વાર્તામાં એક કાળો મોટો સાપ (Snake) બચ્ચાંને ખાવા માટે આવ્યો હતો [9]."
        },
        {
          "questionTextGu": "બચ્ચાંને બચાવવા માટે કોણે મદદ કરી?",
          "options": [
            { "id": "A", "textGu": "The Elephant" },
            { "id": "B", "textGu": "Other birds (Cuckoo, Parrot, Crow)" },
            { "id": "C", "textGu": "The Farmer" },
            { "id": "D", "textGu": "A Dog" }
          ],
          "correctOptionId": "B",
          "explanationGu": "જ્યારે Jerry એ બૂમ પાડી ત્યારે બીજા પક્ષીઓ (કોયલ, પોપટ, કાગડો) મદદ માટે આવ્યા હતા [9, 10]."
        },
        {
          "questionTextGu": "'Grey' (ભૂખરો) રંગ કયા પક્ષીનો હોય છે?",
          "options": [
            { "id": "A", "textGu": "Parrot" },
            { "id": "B", "textGu": "Pigeon" },
            { "id": "C", "textGu": "Flamingo" },
            { "id": "D", "textGu": "Crow" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પુસ્તક મુજબ કબૂતર (Pigeon) ભૂખરા (grey) રંગનું હોય છે [11]."
        },
        {
          "questionTextGu": "'Flamingo' પક્ષીનો રંગ કેવો દર્શાવવામાં આવ્યો છે?",
          "options": [
            { "id": "A", "textGu": "Red" },
            { "id": "B", "textGu": "Pink" },
            { "id": "C", "textGu": "Blue" },
            { "id": "D", "textGu": "Green" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પુસ્તકના ચિત્ર વર્ણન મુજબ ફ્લેમિંગો (flamingo) ગુલાબી (pink) રંગનું હોય છે [11]."
        }
      ],
      "flashcards": [
        { "frontGu": "Nest", "backGu": "પક્ષીનો માળો [9]" },
        { "frontGu": "Peck", "backGu": "ચાંચ મારવી [10]" },
        { "frontGu": "Brave", "backGu": "બહાદુર [12, 13]" },
        { "frontGu": "Scared", "backGu": "ડરી ગયેલું [9, 12]" },
        { "frontGu": "Feathers", "backGu": "પક્ષીના પીંછાં [6]" }
      ]
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
            "name": "Standard 3 English Second Language",
            "nameGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 3",
            "name_en": "Standard 3 English (Second Language)",
            "name_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 3",
            "title": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 3",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 3",
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 3",
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
            "title_gu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 3 પાઠ્યપુસ્તક",
            "titleGu": "અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 3 પાઠ્યપુસ્તક",
            "title_en": "Standard 3 English Second Language Textbook",
            "titleEn": "Standard 3 English Second Language Textbook",
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

# 2. Process Quizzes & Flashcards
quiz_map = {}
fc_by_chapter = {}

for ch_c in chapters_content:
    ch_id = ch_c["id"]
    q_list = ch_c.get("quizzes", [])
    fc_list = ch_c.get("flashcards", [])

    ch_info = next((c for c in chapters_data if c["id"] == ch_id), None)
    c_num = ch_info["chapterNumber"] if ch_info else 1
    title_gu = ch_info["titleGu"] if ch_info else ""
    title_en = ch_info["title_en"] if ch_info else ""
    tp_id = f"{ch_id}_tp1"

    if q_list:
        quiz_id = f"quiz_std3_eng_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std3_eng_{ch_id}_{q_idx+1}"

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

    if fc_list:
        for idx, fc in enumerate(fc_list):
            front_gu = fc["frontGu"]
            back_gu = fc.get("backGu") or fc.get("textGu") or ""
            fc_id = f"fc_std3_eng_{ch_id}_{idx+1}"

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

# 3. Generate AI Knowledge Base Documents for all 11 chapters
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

    content = f"વિષય: અંગ્રેજી (દ્વિતીય ભાષા) ધોરણ 3\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std3_eng_{ch_id}",
        "standard_id": "3",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "અંગ્રેજી", "ધોરણ 3"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std3_english_sl_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 3 English SL payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
