#!/usr/bin/env python3
"""
Builds complete std3_mayur_payload.json for GCERT Standard 3 Gujarati Second Language (મયૂર ધોરણ ૩).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-3%20Mayur_Gujarati%20Second%20Lang%20(2).pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-3 Mayur_Gujarati Second Lang (2).pdf"
storage_path = "textbooks/Std-3 Mayur_Gujarati Second Lang (2).pdf"

subject_id = "sub_mayur_std3_sl"
subject_id_alt1 = "sub_mayur_std3"
subject_id_alt2 = "sub_gujarati_std3_sl"
subject_id_alt3 = "sub_guj_std3_sl"

standard_id = "std_3"
standard_number = 3
session = "1"

chapters_data = [
    {
        "id": "sub_mayur_std3_ch1",
        "chapterNumber": 1,
        "titleGu": "નાક-કાન વગર ગા",
        "title_en": "Nak-Kan Vagar Ga",
        "descriptionGu": "નાનકડું એક પતંગિયું ગીત અને ઝૂમરુ જોકરની મજેદાર વાર્તા દ્વારા બાળકોને શરીરના અંગોની ઓળખ આપવામાં આવી છે.",
        "start_page": 7,
        "end_page": 16,
        "pdfPageOffset": 6,
        "pageIndex": 6
    },
    {
        "id": "sub_mayur_std3_ch2",
        "chapterNumber": 2,
        "titleGu": "નારાજ વનરાજ",
        "title_en": "Naraj Vanraj",
        "descriptionGu": "સિંહ જીમી અને લુચ્ચા શિયાળ ડીપુની 'ગુફા ઓ ગુફા' વાર્તા દ્વારા બાળકોમાં તર્કશક્તિનો વિકાસ કરવામાં આવ્યો છે.",
        "start_page": 17,
        "end_page": 29,
        "pdfPageOffset": 6,
        "pageIndex": 16
    },
    {
        "id": "sub_mayur_std3_ch3",
        "chapterNumber": 3,
        "titleGu": "મકાન વગરના વાનર",
        "title_en": "Makan Vagarna Vanar",
        "descriptionGu": "ખટખટ વાંદરા અને ચટપટ સુઘરીની વાર્તા દ્વારા ઘરની જરૂરિયાત અને વિવિધ ઋતુઓની સમજ આપવામાં આવી છે.",
        "start_page": 30,
        "end_page": 41,
        "pdfPageOffset": 6,
        "pageIndex": 29
    },
    {
        "id": "sub_mayur_std3_ch4",
        "chapterNumber": 4,
        "titleGu": "લાલજીને ખાઈ ગઈ બાજરી",
        "title_en": "Laljine Khai Gai Bajari",
        "descriptionGu": "ખેડૂત સોમાભાઈના બળદ લાલિયાના ખોવાઈ જવાની અને રોટલાની પોપડી નીચેથી મળી આવવાની રમુજી વાર્તા.",
        "start_page": 42,
        "end_page": 53,
        "pdfPageOffset": 6,
        "pageIndex": 41
    },
    {
        "id": "sub_mayur_std3_ch5",
        "chapterNumber": 5,
        "titleGu": "તીખું તમતમતું ગીત",
        "title_en": "Tikhu Tamtamatū Gīt",
        "descriptionGu": "જંગલના પ્રાણીઓ વચ્ચે યોજાયેલ 'ગીત એક, રીત અનેક' હરીફાઈની મનોરંજક વાર્તા અને વિવિધ વાજિંત્રોની ઓળખ.",
        "start_page": 54,
        "end_page": 65,
        "pdfPageOffset": 6,
        "pageIndex": 53
    },
    {
        "id": "sub_mayur_std3_ch6",
        "chapterNumber": 6,
        "titleGu": "મરઘી બનો, મજા કરો",
        "title_en": "Marghi Bano, Maja Karo",
        "descriptionGu": "કામગરી મરઘી કોમડીની વાર્તા, જે મહેનતનું ફળ અને કામ પ્રત્યેની નિષ્ઠાનો બોધ આપે છે.",
        "start_page": 66,
        "end_page": 79,
        "pdfPageOffset": 6,
        "pageIndex": 65
    },
    {
        "id": "sub_mayur_std3_ch7",
        "chapterNumber": 7,
        "titleGu": "મિયાઉં...મિયાઉં, અહીં આવ",
        "title_en": "Miau...Miau, Ahi Aav",
        "descriptionGu": "બિલ્લુ અને તેની બિલાડી મીનીની શોધખોળની વાર્તા, જેમાં આડોશ-પાડોશ અને ભાષા વૈવિધ્યનું નિરૂપણ છે.",
        "start_page": 80,
        "end_page": 94,
        "pdfPageOffset": 6,
        "pageIndex": 79
    }
]

chapters_content = [
    {
      "id": "sub_mayur_std3_ch1",
      "chapterNumber": 1,
      "titleGu": "નાક-કાન વગર ગા",
      "quizzes": [
        {
          "questionTextGu": "ઝૂમરુ જોકર એક દિવસ ક્યાં ગયો?",
          "options": [
            { "id": "A", "textGu": "બગીચામાં" },
            { "id": "B", "textGu": "મેળામાં" },
            { "id": "C", "textGu": "શાળામાં" },
            { "id": "D", "textGu": "બજારમાં" }
          ],
          "correctOptionId": "C",
          "explanationGu": "પાઠ્યપુસ્તકની વાર્તા મુજબ, ઝૂમરુ જોકર એક દિવસ શાળામાં ગયો હતો [૧૭]."
        },
        {
          "questionTextGu": "પતંગિયું છેલ્લે ક્યાં બેઠું?",
          "options": [
            { "id": "A", "textGu": "બારી પર" },
            { "id": "B", "textGu": "ટેબલ પર" },
            { "id": "C", "textGu": "ખભા પર" },
            { "id": "D", "textGu": "દફતર પર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ગીત મુજબ પતંગિયું ટેબલ અને દફતર પર બેઠા પછી ટપુક દઈને ખભા પર બેઠું હતું [૧૬]."
        },
        {
          "questionTextGu": "ઝૂમરુના વાળ કોણે પકડ્યા?",
          "options": [
            { "id": "A", "textGu": "છોકરાએ" },
            { "id": "B", "textGu": "ટીચરે" },
            { "id": "C", "textGu": "છોકરીએ" },
            { "id": "D", "textGu": "કોઈએ નહીં" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાર્તામાં આગળ જતાં એક ટીચરે ઝૂમરુના વાળ પકડ્યા અને માથા પર વાળ ન હોવાથી બધા હસ્યા [૨૦]."
        },
        {
          "questionTextGu": "ઝૂમરુના ટકલે શું વગાડવાનું કહેવાયું છે?",
          "options": [
            { "id": "A", "textGu": "તબલું" },
            { "id": "B", "textGu": "ઢોલ" },
            { "id": "C", "textGu": "નગારું" },
            { "id": "D", "textGu": "ચમચી" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ઝૂમરુના ટાલવાળા માથા પર તબલું વગાડવાનું ગીતમાં કહેવાયું છે [૨૧]."
        },
        {
          "questionTextGu": "ઝૂમરુ ગીતમાં લડુમાંથી શું કાઢવાની વાત કરે છે?",
          "options": [
            { "id": "A", "textGu": "ખાંડ" },
            { "id": "B", "textGu": "ઘી" },
            { "id": "C", "textGu": "તેલ" },
            { "id": "D", "textGu": "રસ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઝૂમરુ ગાય છે: 'અમ્મનચમ્મન ગુડ કે લડુ, લડુ મેં સે ઘી નિકાલું...' [૧૭]."
        }
      ],
      "flashcards": [
        { "frontGu": "ઝૂમરુ", "backGu": "વાર્તામાં આવતા જોકરનું નામ [૧૭]." },
        { "frontGu": "અમ્મનચમ્મન", "backGu": "ઝૂમરુ જોકરના ગીતના શબ્દો [૧૭]." },
        { "frontGu": "પતંગિયું", "backGu": "ખભા પર ડાહ્યુંડમરું થઈને બેસનાર [૧૬]." },
        { "frontGu": "ટકલે પે તબલું", "backGu": "ઝૂમરુના માથા પર તબલું વગાડવાની મજા [૨૧]." },
        { "frontGu": "નકલી અંગો", "backGu": "ઝૂમરુના કાન, મૂછ અને નાક જે નીકળી ગયા હતા [૧૮-૨૦]." }
      ]
    },
    {
      "id": "sub_mayur_std3_ch2",
      "chapterNumber": 2,
      "titleGu": "નારાજ વનરાજ",
      "quizzes": [
        {
          "questionTextGu": "સિંહનું નામ શું હતું?",
          "options": [
            { "id": "A", "textGu": "જીમી" },
            { "id": "B", "textGu": "ડીપુ" },
            { "id": "C", "textGu": "ખટખટ" },
            { "id": "D", "textGu": "ઝૂમરુ" }
          ],
          "correctOptionId": "A",
          "explanationGu": "વાર્તાની શરૂઆતમાં જ ઉલ્લેખ છે કે સિંહનું નામ જીમી હતું [૨૮]."
        },
        {
          "questionTextGu": "શિયાળનું નામ શું હતું?",
          "options": [
            { "id": "A", "textGu": "જીમી" },
            { "id": "B", "textGu": "ડીપુ" },
            { "id": "C", "textGu": "ટીના" },
            { "id": "D", "textGu": "ચટપટ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાર્તામાં ચતુર શિયાળનું નામ ડીપુ છે [૨૯]."
        },
        {
          "questionTextGu": "ડીપુ શિયાળે ગુફા પાસે શું જોયું?",
          "options": [
            { "id": "A", "textGu": "સિંહને" },
            { "id": "B", "textGu": "પગલાં" },
            { "id": "C", "textGu": "લોહી" },
            { "id": "D", "textGu": "અંધારું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "શિયાળે ગુફા તરફ જતાં પગલાં જોયાં પણ બહાર નીકળવાનાં પગલાં દેખાતા નહોતા [૨૯]."
        },
        {
          "questionTextGu": "સિંહે ગુફા બનીને શિયાળને શું કહ્યું?",
          "options": [
            { "id": "A", "textGu": "ભાગી જા" },
            { "id": "B", "textGu": "તું કોણ છે?" },
            { "id": "C", "textGu": "ગુડ ઈવનિંગ ડિઅર ડીપુ, વેલકમ" },
            { "id": "D", "textGu": "હું ઊંઘું છું" }
          ],
          "correctOptionId": "C",
          "explanationGu": "શિયાળને પકડવા સિંહે ગુફા બનીને જવાબ આપ્યો: 'ગુડ ઈવનિંગ ડિઅર ડીપુ, વેલકમ' [૩૦]."
        },
        {
          "questionTextGu": "કબૂતરને શું બહુ ગમે?",
          "options": [
            { "id": "A", "textGu": "ખાવાનું" },
            { "id": "B", "textGu": "ઊડવાનું" },
            { "id": "C", "textGu": "રડવાનું" },
            { "id": "D", "textGu": "ઊંઘવાનું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગીત મુજબ: 'એક કબૂતર નાનું, એને બહુ ગમે ઊડવાનું' [૨૭]."
        }
      ],
      "flashcards": [
        { "frontGu": "જીમી", "backGu": "વાર્તાના સિંહનું નામ [૨૮]." },
        { "frontGu": "ડીપુ", "backGu": "વાર્તાના શિયાળનું નામ [૨૯]." },
        { "frontGu": "ગુફા ઓ ગુફા", "backGu": "શિયાળ અને સિંહની ચતુરાઈની વાર્તા [૨૮]." },
        { "frontGu": "છાનુંમાનું", "backGu": "નાનું કબૂતર કેવી રીતે ઊડ્યું [૨૭]." },
        { "frontGu": "વેલકમ", "backGu": "સિંહે ડીપુનું સ્વાગત કરવા માટે વાપરેલો શબ્દ [૩૦]." }
      ]
    },
    {
      "id": "sub_mayur_std3_ch3",
      "chapterNumber": 3,
      "titleGu": "મકાન વગરના વાનર",
      "quizzes": [
        {
          "questionTextGu": "વાંદરાનું નામ શું હતું?",
          "options": [
            { "id": "A", "textGu": "ખટખટ" },
            { "id": "B", "textGu": "ચટપટ" },
            { "id": "C", "textGu": "જીમી" },
            { "id": "D", "textGu": "બિલ્લુ" }
          ],
          "correctOptionId": "A",
          "explanationGu": "વાર્તા મુજબ વાંદરાનું નામ ખટખટ હતું [૩૮]."
        },
        {
          "questionTextGu": "સુઘરીનું નામ શું હતું?",
          "options": [
            { "id": "A", "textGu": "ખટખટ" },
            { "id": "B", "textGu": "ચટપટ" },
            { "id": "C", "textGu": "મીની" },
            { "id": "D", "textGu": "કોમડી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાંદરાની ચિંતા કરતી સુઘરીનું નામ ચટપટ હતું [૩૯]."
        },
        {
          "questionTextGu": "શિયાળામાં વાંદરાઓએ ઠંડી ભગાડવા શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "ઘર બનાવ્યું" },
            { "id": "B", "textGu": "લાલ મરચાંનું તાપણું કર્યું" },
            { "id": "C", "textGu": "ધાબળો ઓઢ્યો" },
            { "id": "D", "textGu": "પૂંછડી પછાડી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાંદરાઓએ ખેતરોમાંથી લાલ મરચાં ભેગાં કરી ઢગલો કરીને તાપણું કર્યું હતું [૩૮]."
        },
        {
          "questionTextGu": "ચોમાસામાં વરસાદથી બચવા વાંદરાઓએ પૂંછડીથી શું બનાવ્યું?",
          "options": [
            { "id": "A", "textGu": "છત્રી" },
            { "id": "B", "textGu": "માળો" },
            { "id": "C", "textGu": "પૂંછમિનારો" },
            { "id": "D", "textGu": "ઘર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "વરસાદમાં બધા વાંદરાઓએ પૂંછડી ઊંચી કરી મિનારા જેવું (પૂંછમિનાર) બનાવ્યું હતું [૪૧]."
        },
        {
          "questionTextGu": "વાર્તાના અંતે સુઘરીએ શું કર્યું?",
          "options": [
            { "id": "A", "textGu": "વાંદરાને કાઢી મૂક્યો" },
            { "id": "B", "textGu": "વાંદરાની ચિંતા છોડી દીધી" },
            { "id": "C", "textGu": "નવું ઘર બનાવ્યું" },
            { "id": "D", "textGu": "તાપણું કર્યું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વાંદરાઓએ ઘર ન બનાવ્યું એટલે છેવટે સુઘરીએ ચિંતા કરવાની છોડી દીધી [૪૨]."
        }
      ],
      "flashcards": [
        { "frontGu": "ખટખટ", "backGu": "વાર્તામાં આવતા વાંદરાભાઈનું નામ [૩૮]." },
        { "frontGu": "ચટપટ", "backGu": "વાંદરાને સલાહ આપતી સુઘરીનું નામ [૩૯]." },
        { "frontGu": "લાલ મરચાં", "backGu": "વાંદરાઓએ ઠંડી ભગાડવા તાપણું કરવા ભેગી કરેલી વસ્તુ [૩૮]." },
        { "frontGu": "પૂંછમિનાર", "backGu": "વરસાદમાં ભીંજાતા બચવા વાંદરાઓએ પૂંછડીથી બનાવેલી રચના [૪૨]." },
        { "frontGu": "હૂપાહૂપ", "backGu": "વાંદરાઓ દ્વારા કરવામાં આવતો અવાજ [૩૮]." }
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
            "name": "Standard 3 Gujarati Mayur",
            "nameGu": "મયૂર (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૩",
            "name_en": "Standard 3 Gujarati Mayur (Second Language)",
            "name_gu": "મયૂર (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૩",
            "title": "મયૂર (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૩",
            "titleGu": "મયૂર (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૩",
            "title_gu": "મયૂર (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૩",
            "icon": "🦚",
            "order": 1,
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
            "title_gu": "મયૂર (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૩ પાઠ્યપુસ્તક",
            "titleGu": "મયૂર (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૩ પાઠ્યપુસ્તક",
            "title_en": "Standard 3 Gujarati Mayur Textbook",
            "titleEn": "Standard 3 Gujarati Mayur Textbook",
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
        "keywords": [ch_info["titleGu"]]
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
        quiz_id = f"quiz_std3_mayur_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std3_mayur_{ch_id}_{q_idx+1}"

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
            fc_id = f"fc_std3_mayur_{ch_id}_{idx+1}"

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

# 3. Generate AI Knowledge Base Documents for all 7 chapters
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

    content = f"વિષય: મયૂર (ગુજરાતી - દ્વિતીય ભાષા) ધોરણ ૩\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std3_mayur_{ch_id}",
        "standard_id": "3",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "મયૂર", "ગુજરાતી", "ધોરણ ૩"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std3_mayur_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 3 Mayur payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
