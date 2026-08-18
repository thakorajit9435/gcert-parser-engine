#!/usr/bin/env python3
"""
Builds complete std4_env_payload.json for GCERT Standard 4 Environmental Studies (પર્યાવરણ - આસપાસ ધોરણ ૪).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-4-Environment%20Gujarati%20Medium.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-4-Environment Gujarati Medium.pdf"
storage_path = "textbooks/Std-4-Environment Gujarati Medium.pdf"

subject_id = "sub_env_std4_gm"
standard_id = "std_4"
standard_number = 4
session = "1"

chapters_mapping = [
    {"id": "sub_env_std4_ch1", "chapterNumber": 1, "titleGu": "રોજ નિશાળે જઈએ...", "title_en": "Let us go to school every day", "descriptionGu": "શાળાએ જવાના વિવિધ સાધનો (હોડી, ઊંટગાડી, બળદગાડું, વ્હીલચેર, રોપ-વે).", "start_page": 1, "end_page": 10, "pdfPageOffset": 0, "pageIndex": 0},
    {"id": "sub_env_std4_ch2", "chapterNumber": 2, "titleGu": "કાનથી કાન", "title_en": "Ear to Ear", "descriptionGu": "પ્રાણીઓના કાનની વિવિધતા, સસ્તન પ્રાણીઓ (બચ્ચાંને જન્મ આપતા) અને ઈંડાં મૂકતા પ્રાણીઓ.", "start_page": 11, "end_page": 20, "pdfPageOffset": 0, "pageIndex": 10},
    {"id": "sub_env_std4_ch3", "chapterNumber": 3, "titleGu": "નંદુ સાથે એક દિવસ", "title_en": "A Day with Nandu", "descriptionGu": "હાથીના બચ્ચાં નંદુની વાર્તા, હાથીના ટોળાનું જીવન, વજન, ખોરાક અને ટેવો.", "start_page": 21, "end_page": 30, "pdfPageOffset": 0, "pageIndex": 20},
    {"id": "sub_env_std4_ch4", "chapterNumber": 4, "titleGu": "અમૃતાની વાર્તા", "title_en": "The Story of Amrita", "descriptionGu": "રાજસ્થાનના ખેજડી ગામની અમૃતા અને બિશ્નોઈ સમાજનું વૃક્ષપ્રેમ તથા રક્ષણ.", "start_page": 31, "end_page": 38, "pdfPageOffset": 0, "pageIndex": 30},
    {"id": "sub_env_std4_ch5", "chapterNumber": 5, "titleGu": "અનીતા અને મધમાખીઓ", "title_en": "Anita and the Honeybees", "descriptionGu": "બિહારની અનીતા ખુશવાહની વાર્તા, શિક્ષણ માટેનો સંઘર્ષ અને મધમાખી ઉછેર (એપિકલ્ચર).", "start_page": 39, "end_page": 48, "pdfPageOffset": 0, "pageIndex": 38},
    {"id": "sub_env_std4_ch6", "chapterNumber": 6, "titleGu": "રિયાની મુસાફરી", "title_en": "Riya's Journey", "descriptionGu": "ગાંધીધામથી ભુજ અને કચ્છના નાના રણ (મીઠાના અગર) ની ટ્રેન મુસાફરી.", "start_page": 49, "end_page": 56, "pdfPageOffset": 0, "pageIndex": 48},
    {"id": "sub_env_std4_ch7", "chapterNumber": 7, "titleGu": "રિયાની ટ્રેન મોડી પડી", "title_en": "Riya's Train was Late", "descriptionGu": "વડોદરા જંક્શન, નર્મદા નદીનો ગોલ્ડન બ્રિજ, કેબલ બ્રિજ અને સુરત શહેરની મુલાકાત.", "start_page": 57, "end_page": 64, "pdfPageOffset": 0, "pageIndex": 56},
    {"id": "sub_env_std4_ch8", "chapterNumber": 8, "titleGu": "રિયા પહોંચી મામાને ઘેર", "title_en": "Riya Reached Uncle's House", "descriptionGu": "વાપી સ્ટેશન, દમણનો જંપોર બીચ, રેલવે ટિકિટ અને PNR નંબરની સમજ.", "start_page": 65, "end_page": 74, "pdfPageOffset": 0, "pageIndex": 64},
    {"id": "sub_env_std4_ch9", "chapterNumber": 9, "titleGu": "બદલાતાં કુટુંબો", "title_en": "Changing Families", "descriptionGu": "બહેનનો જન્મ, નોકરીની બદલી, લગ્ન પ્રસંગ અને કાયદેસર લગ્નની ઉંમર.", "start_page": 75, "end_page": 84, "pdfPageOffset": 0, "pageIndex": 74},
    {"id": "sub_env_std4_ch10", "chapterNumber": 10, "titleGu": "કબડ્ડી... કબડ્ડી... કબડ્ડી...", "title_en": "Hu Tu Tu, Hu Tu Tu", "descriptionGu": "કબડ્ડી રમત, કરણમ્ મલ્લેશ્વરી (વેઇટ લિફ્ટર) અને સરિતા ગાયકવાડ (દોડવીર).", "start_page": 85, "end_page": 94, "pdfPageOffset": 0, "pageIndex": 84},
    {"id": "sub_env_std4_ch11", "chapterNumber": 11, "titleGu": "વાડીમાં", "title_en": "In the Orchard", "descriptionGu": "વિવિધ ફૂલો, વડવાઈ (કબીરવડ), મૂળ અને પર્ણખર ઋતુની સમજ.", "start_page": 95, "end_page": 104, "pdfPageOffset": 0, "pageIndex": 94},
    {"id": "sub_env_std4_ch12", "chapterNumber": 12, "titleGu": "બદલાતો સમય", "title_en": "Changing Times", "descriptionGu": "નીલાભાઈનું સ્થળાંતર (અલ્યારનો ટંડો), કાચા મકાનમાંથી પાકાં મકાનોનો વિકાસ.", "start_page": 105, "end_page": 114, "pdfPageOffset": 0, "pageIndex": 104},
    {"id": "sub_env_std4_ch13", "chapterNumber": 13, "titleGu": "નદીની સફર", "title_en": "A River's Journey", "descriptionGu": "નદીનું ઉદગમ સ્થાન, માનવ પ્રવૃત્તિથી પ્રદૂષણ, દરિયાનું પાણી અને પાણીનું શુદ્ધિકરણ.", "start_page": 115, "end_page": 124, "pdfPageOffset": 0, "pageIndex": 114},
    {"id": "sub_env_std4_ch14", "chapterNumber": 14, "titleGu": "રાજુનું ખેતર", "title_en": "Raju's Farm", "descriptionGu": "ડુંગળીનો પાક, ખેતર ખેડવું (કોદાળી, હળ, ટ્રેક્ટર), નીંદણ અને લણણી (ઈલ્લીજ).", "start_page": 125, "end_page": 134, "pdfPageOffset": 0, "pageIndex": 124},
    {"id": "sub_env_std4_ch15", "chapterNumber": 15, "titleGu": "બજારથી ઘર સુધી", "title_en": "From Market to Home", "descriptionGu": "શાકભાજી વિક્રેતાનું જીવન, મંડી, તાજાં શાકભાજીની જાળવણી અને વેચાણ.", "start_page": 135, "end_page": 144, "pdfPageOffset": 0, "pageIndex": 134},
    {"id": "sub_env_std4_ch16", "chapterNumber": 16, "titleGu": "કામનો મહિનો", "title_en": "A Busy Month", "descriptionGu": "ગીજુભાઈ બધેકાનો પત્ર, પક્ષીઓના માળા (કોયલ, દરજીડો, સુગરી) અને પ્રાણીઓના દાંત.", "start_page": 145, "end_page": 154, "pdfPageOffset": 0, "pageIndex": 144},
    {"id": "sub_env_std4_ch17", "chapterNumber": 17, "titleGu": "તેજલ અમદાવાદમાં", "title_en": "Tejal in Ahmedabad", "descriptionGu": "શહેરી અને ગ્રામીણ જીવનનો તફાવત, સામૂહિક નળ, લિફ્ટ અને રિવરફ્રન્ટ.", "start_page": 155, "end_page": 164, "pdfPageOffset": 0, "pageIndex": 154},
    {"id": "sub_env_std4_ch18", "chapterNumber": 18, "titleGu": "ગામ-ગામનાં પાણી", "title_en": "Water From Different Places", "descriptionGu": "પ્રદૂષિત પાણીથી થતા રોગો, ORS નો ઉપયોગ, વૉટર પાર્ક અને ચેકડેમ.", "start_page": 165, "end_page": 174, "pdfPageOffset": 0, "pageIndex": 164},
    {"id": "sub_env_std4_ch19", "chapterNumber": 19, "titleGu": "સાથે જમીએ", "title_en": "Eating Together", "descriptionGu": "ઉત્તરાયણનો તહેવાર (ઊંધિયું-જલેબી), શાળામાં મધ્યાહ્ન ભોજન અને તિથિભોજન.", "start_page": 175, "end_page": 184, "pdfPageOffset": 0, "pageIndex": 174},
    {"id": "sub_env_std4_ch20", "chapterNumber": 20, "titleGu": "ખોરાક અને મજા", "title_en": "Food and Fun", "descriptionGu": "ગુરુદ્વારામાં લંગર અને કઢાહપ્રસાદ, સેવાભાવ અને છાત્રાલયનું જીવન.", "start_page": 185, "end_page": 194, "pdfPageOffset": 0, "pageIndex": 184},
    {"id": "sub_env_std4_ch21", "chapterNumber": 21, "titleGu": "જગત મારા ઘરમાં", "title_en": "The World in my Home", "descriptionGu": "ઘરના નિર્ણયો, પ્રામાણિકતા (મીનાકાકી), અયોગ્ય સ્પર્શથી સાવધાની.", "start_page": 195, "end_page": 204, "pdfPageOffset": 0, "pageIndex": 194},
    {"id": "sub_env_std4_ch22", "chapterNumber": 22, "titleGu": "પટોળાં", "title_en": "Patola", "descriptionGu": "પાટણના પ્રખ્યાત પટોળાં, મલબારી સિલ્ક, તાણા-વાણા અને રાણીની વાવ.", "start_page": 205, "end_page": 212, "pdfPageOffset": 0, "pageIndex": 204},
    {" identity": "sub_env_std4_ch23", "chapterNumber": 23, "titleGu": "દેશ-પરદેશ", "title_en": "Home and Abroad", "descriptionGu": "અબુધાબી રણપ્રદેશ, ચલણ દિરહામ, ખજૂરનું ઝાડ અને સસ્તું પેટ્રોલ.", "start_page": 213, "end_page": 220, "pdfPageOffset": 0, "pageIndex": 212},
    {"id": "sub_env_std4_ch24", "chapterNumber": 24, "titleGu": "મસાલેદાર કોયડા", "title_en": "Spicy Riddles", "descriptionGu": "રસોઈના વિવિધ મસાલા (મરચું, હળદર, લવિંગ, જીરું) અને કેરળના મસાલાના બગીચા.", "start_page": 221, "end_page": 228, "pdfPageOffset": 0, "pageIndex": 220},
    {"id": "sub_env_std4_ch25", "chapterNumber": 25, "titleGu": "મારો જિલ્લો", "title_en": "My District", "descriptionGu": "ગુજરાતના જિલ્લાઓ, કચ્છ (સૌથી મોટો), ડાંગ (સૌથી નાનો), સ્ટેચ્યૂ ઓફ યુનિટી અને પંચાયત.", "start_page": 229, "end_page": 240, "pdfPageOffset": 0, "pageIndex": 228}
]

# Clean up ch23 id field
chapters_mapping[22]["id"] = "sub_env_std4_ch23"

chapters_content = [
    {
      "chapterNumber": 1,
      "titleGu": "રોજ નિશાળે જઈએ...",
      "quizzes": [
        {
          "questionTextGu": "નદી ઉપર મુસાફરી કરવા માટે કયા વાહનનો ઉપયોગ થાય છે?",
          "options": [
            { "id": "A", "textGu": "રિક્ષા" },
            { "id": "B", "textGu": "સાઈકલ" },
            { "id": "C", "textGu": "હોડી" },
            { "id": "D", "textGu": "બળદગાડું" }
          ],
          "correctOptionId": "C",
          "explanationGu": "બેટ દ્વારકા જેવા વિસ્તારોમાં બાળકો હોડીનો ઉપયોગ કરીને શાળાએ જાય છે [૪૨]."
        },
        {
          "questionTextGu": "રણ પ્રદેશમાં શાળાએ જવા માટે કયા વાહનનો ઉપયોગ વધુ અનુકૂળ છે?",
          "options": [
            { "id": "A", "textGu": "ઊંટગાડી" },
            { "id": "B", "textGu": "બળદગાડું" },
            { "id": "C", "textGu": "રિક્ષા" },
            { "id": "D", "textGu": "બસ" }
          ],
          "correctOptionId": "A",
          "explanationGu": "રણમાં રેતી ગરમ હોવાથી બાળકો ઊંટગાડીમાં સવારી કરીને શાળાએ જાય છે [૪૩]."
        },
        {
          "questionTextGu": "પાવાગઢમાં તળેટીથી ટોચ પર જવા માટે કઈ વ્યવસ્થા છે?",
          "options": [
            { "id": "A", "textGu": "પથરાળ રસ્તો" },
            { "id": "B", "textGu": "ઉડન-ખટોલા (રોપ-વે)" },
            { "id": "C", "textGu": "પુલ" },
            { "id": "D", "textGu": "રિક્ષા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પાવાગઢ અને અંબાજીમાં ઉડન-ખટોલા દ્વારા ઉપર કે નીચે જઈ શકાય છે [૪૮]."
        },
        {
          "questionTextGu": "નિધિ નામની છોકરી વ્હીલચેરનો ઉપયોગ કેમ કરે છે?",
          "options": [
            { "id": "A", "textGu": "તેને ચાલવું ગમતું નથી" },
            { "id": "B", "textGu": "તેના પગ જન્મથી જ કામ કરતા નથી" },
            { "id": "C", "textGu": "તેને બસ મળતી નથી" },
            { "id": "D", "textGu": "શાળા દૂર છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "શારીરિક ખામી (અપંગતા) ને કારણે તે જાતે ચાલી શકતી નથી, તેથી વ્હીલચેર વાપરે છે [૪૭]."
        },
        {
          "questionTextGu": "ખેતરો વચ્ચેથી પસાર થતી વખતે ગામડાના બાળકો કયા વાહનનો ઉપયોગ કરે છે?",
          "options": [
            { "id": "A", "textGu": "ઊંટગાડી" },
            { "id": "B", "textGu": "બળદગાડું" },
            { "id": "C", "textGu": "ઘોડા ગાડી" },
            { "id": "D", "textGu": "રિક્ષા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગામડામાં બાળકો બળદગાડામાં બેસી લીલાંછમ ખેતરો વચ્ચેથી શાળાએ જાય છે [૪૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "બ્રિજ (Bridge)", "backGu": "નદી પર સિમેન્ટ, ઈંટો અને લોખંડથી બનાવેલો પુલ [૪૧]" },
        { "frontGu": "વ્હીલચેર", "backGu": "પૈડાંવાળી ખુરશી જે અપંગ વ્યક્તિને હલનચલનમાં મદદ કરે છે [૪૭]" },
        { "frontGu": "રોપ-વે", "backGu": "મજબૂત તારના દોરડા પર લટકતી ટ્રોલી (ઉડન-ખટોલા) [૪૮]" },
        { "frontGu": "સૂરજબારી પુલ", "backGu": "કચ્છનું પ્રવેશદ્વાર ગણાતો પુલ [૮૯]" },
        { "frontGu": "બામ્બૂ પુલ", "backGu": "વધારે વરસાદવાળા વિસ્તારોમાં વાંસમાંથી બનાવેલો પુલ [૪૯]" }
      ]
    },
    {
      "chapterNumber": 2,
      "titleGu": "કાનથી કાન",
      "quizzes": [
        {
          "questionTextGu": "કયા પ્રાણીના કાન પંખા જેવા મોટા હોય છે?",
          "options": [
            { "id": "A", "textGu": "સસલું" },
            { "id": "B", "textGu": "હાથી" },
            { "id": "C", "textGu": "જિરાફ" },
            { "id": "D", "textGu": "ઉંદર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "હાથીના કાન ખૂબ મોટા અને પંખા જેવા હોય છે [૫૨]."
        },
        {
          "questionTextGu": "પક્ષીઓને સાંભળવા માટે માથાની બંને બાજુ શું હોય છે?",
          "options": [
            { "id": "A", "textGu": "મોટા કાન" },
            { "id": "B", "textGu": "નાનાં કાણાં" },
            { "id": "C", "textGu": "સીંગડાં" },
            { "id": "D", "textGu": "કાંઈ હોતું નથી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પક્ષીઓને કાનની જગ્યાએ નાનાં કાણાં હોય છે જે પીંછાંથી ઢંકાયેલાં હોય છે [૫૩]."
        },
        {
          "questionTextGu": "જે પ્રાણીઓના કાન જોઈ શકાય છે અને શરીર પર વાળ હોય છે તેઓ:",
          "options": [
            { "id": "A", "textGu": "ઈંડાં મૂકે છે" },
            { "id": "B", "textGu": "બચ્ચાંને જન્મ આપે છે" },
            { "id": "C", "textGu": "પાણીમાં રહે છે" },
            { "id": "D", "textGu": "ઊડી શકે છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કાન બહાર દેખાતા હોય અને વાળ હોય તેવા પ્રાણીઓ સસ્તન હોય છે અને બચ્ચાંને જન્મ આપે છે [૫૬]."
        },
        {
          "questionTextGu": "ગરોળીના માથા પર સાંભળવા માટે શું હોય છે?",
          "options": [
            { "id": "A", "textGu": "મોટા કાન" },
            { "id": "B", "textGu": "નાનાં ટપકાં જેવાં કાણાં" },
            { "id": "C", "textGu": "જીભ" },
            { "id": "D", "textGu": "પૂંછડી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગરોળીના માથા પર પણ સાંભળવા માટે નાનાં કાણાં હોય છે [૫૩]."
        },
        {
          "questionTextGu": "આપણું રાષ્ટ્રીય પક્ષી કયું છે?",
          "options": [
            { "id": "A", "textGu": "ચકલી" },
            { "id": "B", "textGu": "કબૂતર" },
            { "id": "C", "textGu": "મોર" },
            { "id": "D", "textGu": "કાગડો" }
          ],
          "correctOptionId": "C",
          "explanationGu": "મોર એ ભારતનું રાષ્ટ્રીય પક્ષી છે [૫૮]."
        }
      ],
      "flashcards": [
        { "frontGu": "સસ્તન પ્રાણી", "backGu": "જેમના કાન જોઈ શકાય અને જે બચ્ચાંને જન્મ આપે [૫૬]" },
        { "frontGu": "ઈંડાં મૂકતા પ્રાણી", "backGu": "જેમને બહાર કાન હોતા નથી અને શરીર પર વાળ નથી હોતા [૫૬]" },
        { "frontGu": "મગરના કાન", "backGu": "નાનાં કાણાં જેવા હોય છે પણ સરળતાથી દેખાતા નથી [૫૩]" },
        { "frontGu": "ચામડીની ભાત", "backGu": "પ્રાણીના શરીર પરના વાળને કારણે વિવિધ રંગ અને ભાત દેખાય છે [૫૪]" },
        { "frontGu": "રાષ્ટ્રીય પ્રાણી", "backGu": "વાઘ એ આપણું રાષ્ટ્રીય પ્રાણી છે [૫૯]" }
      ]
    },
    {
      "chapterNumber": 3,
      "titleGu": "નંદુ સાથે એક દિવસ",
      "quizzes": [
        {
          "questionTextGu": "નંદુ કોણ છે?",
          "options": [
            { "id": "A", "textGu": "વાઘનું બચ્ચું" },
            { "id": "B", "textGu": "હાથીનું બચ્ચું" },
            { "id": "C", "textGu": "ગાયનું વાછરડું" },
            { "id": "D", "textGu": "ઊંટનું બચ્ચું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નંદુ એક નાનું હાથીનું બચ્ચું છે [૫૯]."
        },
        {
          "questionTextGu": "હાથીના ટોળામાં મુખ્ય નિર્ણયો કોણ લે છે?",
          "options": [
            { "id": "A", "textGu": "સૌથી મોટો નર હાથી" },
            { "id": "B", "textGu": "સૌથી ઘરડી હાથણી" },
            { "id": "C", "textGu": "બધા હાથી ભેગા મળીને" },
            { "id": "D", "textGu": "નંદુની મા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "હાથીના ટોળામાં સૌથી ઘરડી હાથણી પ્રમુખ હોય છે અને નિર્ણયો લે છે [૬૨]."
        },
        {
          "questionTextGu": "પુખ્ત હાથી એક દિવસમાં કેટલા કિલો પાંદડાં ખાઈ શકે?",
          "options": [
            { "id": "A", "textGu": "૫૦ કિગ્રા" },
            { "id": "B", "textGu": "૧૦૦ કિગ્રાથી વધુ" },
            { "id": "C", "textGu": "૨૦૦ કિગ્રા" },
            { "id": "D", "textGu": "૧૦ કિગ્રા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "એક મોટો હાથી દિવસમાં ૧૦૦ કિલોથી પણ વધુ પાન અને ડાળીઓ ખાઈ શકે છે [૬૦]."
        },
        {
          "questionTextGu": "હાથીઓ દિવસમાં કેટલા કલાક ઊંઘે છે?",
          "options": [
            { "id": "A", "textGu": "૧૦ થી ૧૨ કલાક" },
            { "id": "B", "textGu": "૮ થી ૧૦ કલાક" },
            { "id": "C", "textGu": "૨ થી ૪ કલાક" },
            { "id": "D", "textGu": "૬ થી ૭ કલાક" }
          ],
          "correctOptionId": "C",
          "explanationGu": "હાથીઓ બહુ આરામ કરતા નથી, તેઓ માત્ર ૨ થી ૪ કલાક જ સૂએ છે [૬૦]."
        },
        {
          "questionTextGu": "નર હાથી કેટલા વર્ષની ઉંમરે ટોળું છોડી દે છે?",
          "options": [
            { "id": "A", "textGu": "૫-૬ વર્ષ" },
            { "id": "B", "textGu": "૧૦ વર્ષ" },
            { "id": "C", "textGu": "૧૪-૧૫ વર્ષ" },
            { "id": "D", "textGu": "૨૦ વર્ષ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "નર હાથી ૧૪-૧૫ વર્ષના થાય ત્યારે ટોળું છોડીને એકલા ફરે છે [૬૨]."
        }
      ],
      "flashcards": [
        { "frontGu": "ટોળું (Herd)", "backGu": "પ્રાણીઓનો સમૂહ જે ખોરાકની શોધમાં સાથે ફરે છે [૬૨]" },
        { "frontGu": "ચિંઘાડ (Trumpet)", "backGu": "હાથી દ્વારા કાઢવામાં આવતો મોટો અવાજ [૬૦]" },
        { "frontGu": "નંદુનું વજન", "backGu": "ત્રણ મહિનાની ઉંમરે ૨૦૦ કિલોગ્રામ [૬૧]" },
        { "frontGu": "હાથીના કાન", "backGu": "પંખા જેવું કામ કરે છે અને શરીરને ઠંડું રાખે છે [૬૦]" },
        { "frontGu": "કાદવમાં રમત", "backGu": "કાદવ હાથીની ચામડીને ઠંડક આપે છે [૬૦]" }
      ]
    },
    {
      "chapterNumber": 4,
      "titleGu": "અમૃતાની વાર્તા",
      "quizzes": [
        {
          "questionTextGu": "ખેજડી ગામ કયા રાજ્યમાં આવેલું છે?",
          "options": [
            { "id": "A", "textGu": "ગુજરાત" },
            { "id": "B", "textGu": "રાજસ્થાન" },
            { "id": "C", "textGu": "મધ્ય પ્રદેશ" },
            { "id": "D", "textGu": "બિહાર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ખેજડી ગામ રાજસ્થાનના જોધપુર શહેરની નજીક આવેલું છે [૬૬]."
        },
        {
          "questionTextGu": "ગામનું નામ ખેજડી કેમ પડ્યું?",
          "options": [
            { "id": "A", "textGu": "ત્યાં ખેજડીનાં ઝાડ ઘણાં ઊગતાં" },
            { "id": "B", "textGu": "ત્યાંના રાજાનું નામ ખેજડી હતું" },
            { "id": "C", "textGu": "ગામમાં નદીનું નામ ખેજડી હતું" },
            { "id": "D", "textGu": "ત્યાં ખેતર વધારે હતાં" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ખેજડીનાં વૃક્ષોની વિપુલતાને કારણે ગામનું નામ ખેજડી પડ્યું [૬૬]."
        },
        {
          "questionTextGu": "બિશ્નોઈ લોકોનું મુખ્ય કાર્ય શું છે?",
          "options": [
            { "id": "A", "textGu": "ખેતી કરવી" },
            { "id": "B", "textGu": "વૃક્ષો અને પ્રાણીઓનું રક્ષણ કરવું" },
            { "id": "C", "textGu": "શિકાર કરવો" },
            { "id": "D", "textGu": "મહેલ બનાવવા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બિશ્નોઈ સમાજના લોકો વૃક્ષો અને પ્રાણીઓને બચાવવા માટે જાણીતા છે [૬૯]."
        },
        {
          "questionTextGu": "ખેજડી વૃક્ષની છાલમાંથી શું બનાવવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "ખોરાક" },
            { "id": "B", "textGu": "દવા" },
            { "id": "C", "textGu": "કાપડ" },
            { "id": "D", "textGu": "રમકડાં" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ખેજડી વૃક્ષની છાલ ઔષધીય ગુણો ધરાવે છે અને તેમાંથી દવા બને છે [૭૨]."
        },
        {
          "questionTextGu": "ખેજડી ગામના લોકો વૃક્ષો વિશે શું કહેતા?",
          "options": [
            { "id": "A", "textGu": "વૃક્ષો કાપો તો જ મહેલ બને" },
            { "id": "B", "textGu": "વૃક્ષો છે, તો જ આપણે છીએ" },
            { "id": "C", "textGu": "વૃક્ષો નકામી વસ્તુ છે" },
            { "id": "D", "textGu": "વૃક્ષો પર પક્ષીઓ રહે છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગામવાસીઓ વૃક્ષો પ્રત્યે અપાર પ્રેમ રાખતા અને તેમના જીવનનું મૂલ્ય સમજતા [૬૬]."
        }
      ],
      "flashcards": [
        { "frontGu": "અમૃતા", "backGu": "વૃક્ષોને બચાવવા માટે પોતાનું બલિદાન આપનાર બહાદુર સ્ત્રી [૬૮]" },
        { "frontGu": "ખેજડી વૃક્ષ", "backGu": "રણ વિસ્તારમાં ઓછાં પાણીમાં ટકી શકતું વૃક્ષ [૭૨]" },
        { "frontGu": "બિશ્નોઈ", "backGu": "પર્યાવરણ પ્રેમી સમાજ જે ૩૦૦ વર્ષથી રક્ષણ કરે છે [૬૯]" },
        { "frontGu": "વૃક્ષનું લાકડું", "backGu": "ખેજડીનું લાકડું એવું હોય છે જેમાં જીવજંતુ પડતા નથી [૭૨]" },
        { "frontGu": "ખેજડીનાં ફળ", "backGu": "લોકો ખેજડીનાં ફળોને રાંધીને જમે છે [૭૨]" }
      ]
    },
    {
      "chapterNumber": 5,
      "titleGu": "અનીતા અને મધમાખીઓ",
      "quizzes": [
        {
          "questionTextGu": "અનીતા ખુશવાહ કયા રાજ્યની વતની છે?",
          "options": [
            { "id": "A", "textGu": "ગુજરાત" },
            { "id": "B", "textGu": "બિહાર" },
            { "id": "C", "textGu": "રાજસ્થાન" },
            { "id": "D", "textGu": "પંજાબ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "અનીતા બિહારના મુઝફ્ફરપુર જિલ્લાના બોચાહા ગામમાં રહે છે [૭૩]."
        },
        {
          "questionTextGu": "મધમાખીઓના ઉછેર માટે કયો સમય સૌથી ઉત્તમ છે?",
          "options": [
            { "id": "A", "textGu": "જાન્યુઆરીથી માર્ચ" },
            { "id": "B", "textGu": "ઓક્ટોબરથી ડિસેમ્બર" },
            { "id": "C", "textGu": "જૂનથી ઓગસ્ટ" },
            { "id": "D", "textGu": "એપ્રિલથી મે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઓક્ટોબરથી ડિસેમ્બરના સમયમાં મધમાખીઓ ઈંડાં આપે છે [૭૬]."
        },
        {
          "questionTextGu": "લીચીના વૃક્ષને કયા મહિનામાં ફૂલો આવે છે?",
          "options": [
            { "id": "A", "textGu": "ફેબ્રુઆરી" },
            { "id": "B", "textGu": "જૂન" },
            { "id": "C", "textGu": "ઓક્ટોબર" },
            { "id": "D", "textGu": "ઓગસ્ટ" }
          ],
          "correctOptionId": "A",
          "explanationGu": "લીચીના વૃક્ષને ફેબ્રુઆરીમાં ફૂલો આવે છે જે મધમાખીઓને ખૂબ ગમે છે [૭૮]."
        },
        {
          "questionTextGu": "મધપૂડામાં ઈંડાં મૂકવાનું કાર્ય કોણ કરે છે?",
          "options": [
            { "id": "A", "textGu": "કામદાર માખી" },
            { "id": "B", "textGu": "રાણી માખી" },
            { "id": "C", "textGu": "નર માખી" },
            { "id": "D", "textGu": "બધી માખીઓ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દરેક મધપૂડામાં એક રાણી માખી હોય છે જે ઈંડાં મૂકે છે [૮૦]."
        },
        {
          "questionTextGu": "અનીતા મધની શું બનવા માંગે છે?",
          "options": [
            { "id": "A", "textGu": "શિક્ષિકા" },
            { "id": "B", "textGu": "મોટી વેપારી" },
            { "id": "C", "textGu": "ખેડૂત" },
            { "id": "D", "textGu": "ડૉક્ટર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "અનીતા મોટી વેપારી બનીને લોકોને મધની પૂરતી કિંમત અપાવવા માંગે છે [૭૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "મધમાખી ઉછેર", "backGu": "એપિકલ્ચર (Beekeeping) - જે ઓક્ટોબરથી ડિસેમ્બરમાં શરૂ થાય [૭૬]" },
        { "frontGu": "રસ (Nectar)", "backGu": "મધમાખીઓ ફૂલોમાંથી રસ એકઠો કરી મધ બનાવે છે [૮૦]" },
        { "frontGu": "કામદાર માખી", "backGu": "મધપૂડા માટે સૌથી મહત્વની માખી જે આખો દિવસ કામ કરે [૮૦]" },
        { "frontGu": "ઉધઈ અને ભમરી", "backGu": "કીડીઓ અને મધમાખીઓની જેમ જૂથમાં રહેતા જીવજંતુ [૮૧]" },
        { "frontGu": "અનીતાની સાઈકલ", "backGu": "તે રોજ ૫ કિમી દૂર કૉલેજ જવા માટે સાઈકલ વાપરે છે [૭૯]" }
      ]
    },
    {
      "chapterNumber": 6,
      "titleGu": "રિયાની મુસાફરી",
      "quizzes": [
        {
          "questionTextGu": "રિયાની ટ્રેન કયા સ્ટેશનથી ઉપડી હતી?",
          "options": [
            { "id": "A", "textGu": "ગાંધીધામ" },
            { "id": "B", "textGu": "ભૂજ" },
            { "id": "C", "textGu": "અમદાવાદ" },
            { "id": "D", "textGu": "સામખિયાળી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કચ્છ એક્સપ્રેસ ટ્રેન ભુજથી ઉપડી હતી [૮૪]."
        },
        {
          "questionTextGu": "સામખિયાળી સ્ટેશનને 'જંક્શન' કેમ કહેવાય છે?",
          "options": [
            { "id": "A", "textGu": "ત્યાં બધી ટ્રેનો ઉભી રહે છે" },
            { "id": "B", "textGu": "ત્યાંથી બે કે તેથી વધુ રેલવેમાર્ગ છૂટા પડે છે" },
            { "id": "C", "textGu": "તે ખૂબ મોટું સ્ટેશન છે" },
            { "id": "D", "textGu": "ત્યાં ટિકિટ મળે છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "જે સ્ટેશનથી આગળ જવા માટે માર્ગ છૂટા પડતા હોય તેને જંક્શન કહેવાય [૮૭]."
        },
        {
          "questionTextGu": "કચ્છના નાના રણમાં જમીન પર શું પથરાયેલું હોય છે?",
          "options": [
            { "id": "A", "textGu": "રેતી" },
            { "id": "B", "textGu": "મીઠાનો થર" },
            { "id": "C", "textGu": "બરફ" },
            { "id": "D", "textGu": "ઘાસ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રણમાં સફેદ ચાદર જેવું દેખાતું પડ એ જમીન પર જામેલું મીઠું છે [૮૮]."
        },
        {
          "questionTextGu": "કચ્છનું પ્રવેશદ્વાર કયો પુલ ગણાય છે?",
          "options": [
            { "id": "A", "textGu": "નર્મદા પુલ" },
            { "id": "B", "textGu": "સૂરજબારી પુલ" },
            { "id": "C", "textGu": "ગોલ્ડન બ્રિજ" },
            { "id": "D", "textGu": "સાબરમતી પુલ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સૂરજબારી પુલને કચ્છનું પ્રવેશદ્વાર કહેવામાં આવે છે [૮૮]."
        },
        {
          "questionTextGu": "રેલવે સ્ટેશન પર સામાન ઉપાડનારા (કૂલી) કેવા રંગના કપડાં પહેરે છે?",
          "options": [
            { "id": "A", "textGu": "સફેદ" },
            { "id": "B", "textGu": "લાલ" },
            { "id": "C", "textGu": "વાદળી" },
            { "id": "D", "textGu": "લીલો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "લાલ રંગના કપડાંવાળા માણસો (કૂલી) સામાન ઉપાડીને મુસાફરોની મદદ કરે છે [૯૨]."
        }
      ],
      "flashcards": [
        { "frontGu": "કચ્છ એક્સપ્રેસ", "backGu": "રિયા જે ટ્રેનમાં મુસાફરી કરતી હતી તેનું નામ [૮૪]" },
        { "frontGu": "અગરિયા", "backGu": "મીઠાના અગર બનાવીને મીઠું પકવનારા લોકો [૮૮]" },
        { "frontGu": "ટિકિટ ચેકર", "backGu": "મુસાફરોની ટિકિટ અને બેઠક ચકાસનાર રેલવે કર્મચારી [૮૬]" },
        { "frontGu": "ગાંધીધામ", "backGu": "કચ્છ જિલ્લાનું એક મહત્વનું રેલવે સ્ટેશન [૮૪]" },
        { "frontGu": "ફેરિયા (Hawkers)", "backGu": "પ્લેટફોર્મ પર ખાણીપીણીની વસ્તુઓ વેચનારા લોકો [૯૨]" }
      ]
    },
    {
      "chapterNumber": 7,
      "titleGu": "રિયાની ટ્રેન મોડી પડી",
      "quizzes": [
        {
          "questionTextGu": "વડોદરા સ્ટેશને ટ્રેન કેટલા કલાક મોડી હતી?",
          "options": [
            { "id": "A", "textGu": "૧ કલાક" },
            { "id": "B", "textGu": "૨ કલાક" },
            { "id": "C", "textGu": "૫ કલાક" },
            { "id": "D", "textGu": "અડધો કલાક" }
          ],
          "correctOptionId": "B",
          "explanationGu": "માઈકમાં જાહેરાત કરવામાં આવી હતી કે ટ્રેનો બે કલાક મોડી ચાલશે [૯૫]."
        },
        {
          "questionTextGu": "ગુજરાતની સૌથી મોટી નદી કઈ છે?",
          "options": [
            { "id": "A", "textGu": "તાપી" },
            { "id": "B", "textGu": "સાબરમતી" },
            { "id": "C", "textGu": "નર્મદા" },
            { "id": "D", "textGu": "મહીસાગર" }
          ],
          "correctOptionId": "C",
          "explanationGu": "નર્મદા નદી ગુજરાતની જીવાદોરી અને સૌથી મોટી નદી છે [૯૯]."
        },
        {
          "questionTextGu": "નર્મદા નદી પર કયો જૂનો અને મજબૂત પુલ આવેલો છે?",
          "options": [
            { "id": "A", "textGu": "કેબલ બ્રિજ" },
            { "id": "B", "textGu": "ગોલ્ડન બ્રિજ" },
            { "id": "C", "textGu": "નેહરુ બ્રિજ" },
            { "id": "D", "textGu": "એલિસ બ્રિજ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ભરૂચ પાસે નર્મદા નદી પર ગોલ્ડન બ્રિજ આવેલો છે [૧૦૦]."
        },
        {
          "questionTextGu": "હીરાઉદ્યોગ અને કાપડઉદ્યોગ માટે કયું શહેર જાણીતું છે?",
          "options": [
            { "id": "A", "textGu": "અમદાવાદ" },
            { "id": "B", "textGu": "સુરત" },
            { "id": "C", "textGu": "વડોદરા" },
            { "id": "D", "textGu": "રાજકોટ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સુરત શહેર હીરા અને કાપડના ઉદ્યોગ માટે વિશ્વભરમાં પ્રખ્યાત છે [૧૦૩]."
        },
        {
          "questionTextGu": "સુરતની પ્રખ્યાત મીઠાઈ કઈ છે?",
          "options": [
            { "id": "A", "textGu": "જલેબી" },
            { "id": "B", "textGu": "ઘારી અને સૂતરફેણી" },
            { "id": "C", "textGu": "પેંડા" },
            { "id": "D", "textGu": "હલવો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રિયાના પપ્પા સુરત સ્ટેશનથી સૂતરફેણી અને ઘારી લાવ્યા હતા [૧૦૪]."
        }
      ],
      "flashcards": [
        { "frontGu": "વડોદરા જંક્શન", "backGu": "રેલવે સ્ટેશન જ્યાં રિયાએ સ્ટેશનની સુવિધાઓ જોઈ [૯૫]" },
        { "frontGu": "કેબલ બ્રિજ", "backGu": "નર્મદા નદી પર નવો બાંધેલો ભારતનો સૌથી મોટો પુલ [૧૦૦]" },
        { "frontGu": "તાપી નદી", "backGu": "સુરત શહેર આ નદીના કિનારે વસેલું છે [૧૦૦]" },
        { "frontGu": "બોગદું (Tunnel)", "backGu": "રેલમાર્ગ માટે પહાડો વચ્ચેથી બનાવેલો રસ્તો [૧૦૨]" },
        { "frontGu": "વડોદરાની રેલવે સુવિધા", "backGu": "પ્રતીક્ષાખંડ, પાર્સલ રૂમ, ટિકિટબારી અને કેન્ટીન [૯૬]" }
      ]
    },
    {
      "chapterNumber": 8,
      "titleGu": "રિયા પહોંચી મામાને ઘેર",
      "quizzes": [
        {
          "questionTextGu": "રિયા ટ્રેનમાંથી કયા સ્ટેશન પર ઉતરી?",
          "options": [
            { "id": "A", "textGu": "વલસાડ" },
            { "id": "B", "textGu": "નવસારી" },
            { "id": "C", "textGu": "વાપી" },
            { "id": "D", "textGu": "દમણ" }
          ],
          "correctOptionId": "C",
          "explanationGu": "રિયા અને તેનું કુટુંબ વાપી સ્ટેશને ઉતરીને મામાને ઘેર ગયા [૧૦૮]."
        },
        {
          "questionTextGu": "દમણમાં કયો બીચ (દરિયાકિનારો) પ્રખ્યાત છે?",
          "options": [
            { "id": "A", "textGu": "તીથલ બીચ" },
            { "id": "B", "textGu": "જંપોર બીચ" },
            { "id": "C", "textGu": "ચોપાટી" },
            { "id": "D", "textGu": "ઉભરાટ બીચ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મામાનું કુટુંબ અને રિયાનું કુટુંબ દમણના જંપોર બીચ પર ફરવા ગયા હતા [૧૦૯]."
        },
        {
          "questionTextGu": "દરિયાકિનારે રિયાએ શેના પર સવારી કરી?",
          "options": [
            { "id": "A", "textGu": "ઘોડા અને ઊંટ પર" },
            { "id": "B", "textGu": "હાથી પર" },
            { "id": "C", "textGu": "સાઈકલ પર" },
            { "id": "D", "textGu": "બળદગાડા પર" }
          ],
          "correctOptionId": "A",
          "explanationGu": "જંપોર બીચ પર રિયાએ ઘોડેસવારી અને ઊંટસવારીની મજા માણી [૧૧૦]."
        },
        {
          "questionTextGu": "રેલવે ટિકિટ પર PNR નંબર શું દર્શાવે છે?",
          "options": [
            { "id": "A", "textGu": "ટ્રેનનું નામ" },
            { "id": "B", "textGu": "પેસેન્જર નેમ રેકોર્ડ" },
            { "id": "C", "textGu": "પ્લેટફોર્મ નંબર" },
            { "id": "D", "textGu": "સીટ નંબર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "PNR (Passenger Name Record) એ મુસાફરીની નોંધણીનો ક્રમાંક છે [૧૧૨]."
        },
        {
          "questionTextGu": "રેલવેનું સમયપત્રક આપણને કઈ માહિતી આપે છે?",
          "options": [
            { "id": "A", "textGu": "ટ્રેનનો માર્ગ અને સમય" },
            { "id": "B", "textGu": "સ્ટેશનોના નામ" },
            { "id": "C", "textGu": "કાપેલું અંતર" },
            { "id": "D", "textGu": "ઉપરના તમામ" }
          ],
          "correctOptionId": "D",
          "explanationGu": "રેલવે સમયપત્રક ટ્રેન ક્યારે પહોંચશે, ક્યારે ઉપડશે અને કયા માર્ગે જશે તેની વિગત આપે છે [૧૧૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "સી-શૉર (Sea-shore)", "backGu": "દરિયાકિનારો, જ્યાં લોકો મોજ માણવા આવે છે [૧૦૯]" },
        { "frontGu": "PNR NO.", "backGu": "રેલવે ટિકિટ પરનો ૧૦ અંકોનો ઓળખ નંબર [૧૧૨]" },
        { "frontGu": "રેલવે સમયપત્રક", "backGu": "દરેક ટ્રેનના માર્ગ અને રોકાણ વિશે માહિતી આપતી પુસ્તિકા [૧૧૩]" },
        { "frontGu": "જંપોર બીચ", "backGu": "દમણમાં આવેલો રેતીવાળો દરિયાકિનારો [૧૦૯]" },
        { "frontGu": "વાપી", "backGu": "વલસાડ જિલ્લાનું એક મહત્વનું શહેર અને રેલવે સ્ટેશન [૧૦૮]" }
      ]
    },
    {
      "chapterNumber": 9,
      "titleGu": "બદલાતાં કુટુંબો",
      "quizzes": [
        {
          "questionTextGu": "કિરણના કુટુંબમાં ફેરફારનું કારણ શું હતું?",
          "options": [
            { "id": "A", "textGu": "પિતાની બદલી" },
            { "id": "B", "textGu": "નાની બહેનનો જન્મ" },
            { "id": "C", "textGu": "કાકાના લગ્ન" },
            { "id": "D", "textGu": "નવી નોકરી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કિરણના ઘરે નાની બહેનનો જન્મ થતા પરિવારમાં આનંદ અને નવા સભ્યો ઉમેરાયા [૧૧૭]."
        },
        {
          "questionTextGu": "સુમીના પિતાજીના કુટુંબમાં ફેરફારનું કારણ શું હતું?",
          "options": [
            { "id": "A", "textGu": "બહેનનો જન્મ" },
            { "id": "B", "textGu": "બઢતી અને બદલી" },
            { "id": "C", "textGu": "શાળા છૂટવી" },
            { "id": "D", "textGu": "લગ્ન" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સુમીના પિતાજીને નોકરીમાં પ્રમોશન મળ્યું અને બીજા શહેરમાં બદલી થઈ [૧૧૯]."
        },
        {
          "questionTextGu": "દીકરી સાસરે જાય ત્યારે પિતાના ઘરે કેવું પરિવર્તન આવે?",
          "options": [
            { "id": "A", "textGu": "સભ્યોની સંખ્યા વધે" },
            { "id": "B", "textGu": "સભ્યોની સંખ્યા ઘટે" },
            { "id": "C", "textGu": "કાઈ ફેરફાર ન થાય" },
            { "id": "D", "textGu": "નવી નોકરી મળે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "લગ્ન પછી દીકરી સાસરે જાય ત્યારે પિતાના ઘરમાંથી એક સભ્ય ઓછો થાય છે [૧૨૦]."
        },
        {
          "questionTextGu": "સરકાર દ્વારા લગ્ન માટે છોકરીની ઓછામાં ઓછી ઉંમર કેટલી નક્કી છે?",
          "options": [
            { "id": "A", "textGu": "૧૫ વર્ષ" },
            { "id": "B", "textGu": "૧૮ વર્ષ" },
            { "id": "C", "textGu": "૨૧ વર્ષ" },
            { "id": "D", "textGu": "૨૫ વર્ષ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ભારતમાં કાયદેસર લગ્ન માટે છોકરીની ઉંમર ૧૮ વર્ષ અને છોકરાની ૨૧ વર્ષ હોવી જોઈએ [૧૨૬]."
        },
        {
          "questionTextGu": "બદલી (Transfer) એટલે શું?",
          "options": [
            { "id": "A", "textGu": "એક જ શહેરમાં રહેવું" },
            { "id": "B", "textGu": "એક સ્થળેથી બીજા સ્થળે નોકરીમાં જવું" },
            { "id": "C", "textGu": "નવી નોકરી શરૂ કરવી" },
            { "id": "D", "textGu": "નિવૃત્ત થવું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સરકારી કે ખાનગી નોકરીમાં એક શહેરથી બીજા શહેર કે સ્થળે મોકલવાની પ્રક્રિયા [૧૧૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "કુટુંબ-વૃક્ષ", "backGu": "પરિવારના સભ્યોના સંબંધો દર્શાવતો ચાર્ટ [૧૨૩]" },
        { "frontGu": "બઢતી (Promotion)", "backGu": "નોકરીમાં હોદ્દો અને પગાર વધવો [૧૧૯]" },
        { "frontGu": "વર (Groom)", "backGu": "લગ્ન પ્રસંગે પરણવા જનાર પુરુષ [૧૨૧]" },
        { "frontGu": "કન્યા (Bride)", "backGu": "લગ્ન પ્રસંગે પરણતી સ્ત્રી [૧૨૧]" },
        { "frontGu": "બાળલગ્ન", "backGu": "નક્કી કરેલી ઉંમર પહેલા લગ્ન કરવા જે ગુનો છે [૧૨૫]" }
      ]
    },
    {
      "chapterNumber": 10,
      "titleGu": "કબડ્ડી... કબડ્ડી... કબડ્ડી...",
      "quizzes": [
        {
          "questionTextGu": "કબડ્ડીની રમતમાં એક ટીમમાં કેટલા ખેલાડીઓ હોય છે?",
          "options": [
            { "id": "A", "textGu": "૫" },
            { "id": "B", "textGu": "૭" },
            { "id": "C", "textGu": "૧૧" },
            { "id": "D", "textGu": "૧૨" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સામાન્ય રીતે કબડ્ડીની મેદાનમાં રમનારી એક ટીમમાં ૭ ખેલાડીઓ હોય છે [૧૨૮]."
        },
        {
          "questionTextGu": "કરણમ્ મલ્લેશ્વરી કઈ રમત સાથે જોડાયેલ ખેલાડી છે?",
          "options": [
            { "id": "A", "textGu": "કબડ્ડી" },
            { "id": "B", "textGu": "વેઇટ લિફ્ટિંગ (વજન ઊંચકવું)" },
            { "id": "C", "textGu": "દોડ" },
            { "id": "D", "textGu": "ક્રિકેટ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કરણમ્ મલ્લેશ્વરી આંતરરાષ્ટ્રીય સ્તરની વેઇટ લિફ્ટર છે [૧૩૧]."
        },
        {
          "questionTextGu": "સરિતા ગાયકવાડ કઈ રમતની દોડવીર છે?",
          "options": [
            { "id": "A", "textGu": "૧૦૦ મીટર" },
            { "id": "B", "textGu": "૪૦૦ મીટર દોડ અને વિઘ્નદોડ" },
            { "id": "C", "textGu": "૮૦૦ મીટર" },
            { "id": "D", "textGu": "લાંબી કૂદ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ડાંગની સરિતા ગાયકવાડ ૪૦૦ મીટરની દોડમાં સુવર્ણચંદ્રક જીતી છે [૧૩૨]."
        },
        {
          "questionTextGu": "ત્રણ બહેનો જ્વાલા, લીલા અને હીરા કઈ રમત રમતી હતી?",
          "options": [
            { "id": "A", "textGu": "ખો-ખો" },
            { "id": "B", "textGu": "કબડ્ડી" },
            { "id": "C", "textGu": "હોકી" },
            { "id": "D", "textGu": "વોલીબોલ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મુંબઈની આ ત્રણ બહેનો કબડ્ડી રમતી હતી અને કબડ્ડી ક્લબ પણ બનાવી હતી [૧૩૨, ૧૩૪]."
        },
        {
          "questionTextGu": "કબડ્ડીમાં દાવ લેનાર ક્યાં સુધી શ્વાસ રોકી રાખે છે?",
          "options": [
            { "id": "A", "textGu": "પાંચ મિનિટ સુધી" },
            { "id": "B", "textGu": "પોતાના ભાગમાં પરત આવે ત્યાં સુધી" },
            { "id": "C", "textGu": "રેખાને અડ્યા વગર" },
            { "id": "D", "textGu": "આઉટ થાય ત્યાં સુધી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ખેલાડી 'કબડ્ડી કબડ્ડી' બોલતા પોતાના કોર્ટમાં પાછો આવે ત્યાં સુધી શ્વાસ રોકે છે [૧૨૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "વેઇટ લિફ્ટર", "backGu": "ભારે વજન ઊંચકવાની રમત રમતા ખેલાડી [૧૩૧]" },
        { "frontGu": "સરિતા ગાયકવાડ", "backGu": "ગુજરાતની સુવર્ણચંદ્રક વિજેતા દોડવીર [૧૩૨]" },
        { "frontGu": "મધ્ય રેખા", "backGu": "કબડ્ડી મેદાનની વચ્ચે આવેલી રેખા જેને અડતા પોઈન્ટ મળે [૧૨૭]" },
        { "frontGu": "ચંદ્રક (Medal)", "backGu": "રમતગમતમાં શ્રેષ્ઠ દેખાવ માટે મળતું ઈનામ [૧૩૧]" },
        { "frontGu": "બહાદુરીની રમત", "backGu": "કબડ્ડીને તાકાત અને બુદ્ધિની રમત ગણવામાં આવે છે [૧૨૯]" }
      ]
    },
    {
      "chapterNumber": 11,
      "titleGu": "વાડીમાં",
      "quizzes": [
        {
          "questionTextGu": "ભરૂચમાં આવેલો કબીરવડ શાના માટે જાણીતો છે?",
          "options": [
            { "id": "A", "textGu": "ખૂબ જ નાનો છે" },
            { "id": "B", "textGu": "ખૂબ જ વિશાળ અને મોટી વડવાઈઓ માટે" },
            { "id": "C", "textGu": "તેની પર ફળ આવતા નથી" },
            { "id": "D", "textGu": "તે દીવાલ પર ઊગેલો છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કબીરવડની વડવાઈઓ હવે થાંભલા જેવી બની વડને મજબૂત આધાર આપે છે [૧૪૭]."
        },
        {
          "questionTextGu": "વડની લટકતી ડાળીઓને શું કહેવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "પર્ણો" },
            { "id": "B", "textGu": "વડવાઈ" },
            { "id": "C", "textGu": "સીંગડાં" },
            { "id": "D", "textGu": "પાણીના પાઈપ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વડની ડાળીઓમાંથી ઊગીને જમીન સુધી જતાં મૂળને વડવાઈ (Aerial roots) કહે છે [૧૪૭]."
        },
        {
          "questionTextGu": "ખોરાકમાં કયા ફૂલનો ઉપયોગ 'ગુલકંદ' બનાવવા માટે થાય છે?",
          "options": [
            { "id": "A", "textGu": "ગલગોટો" },
            { "id": "B", "textGu": "ગુલાબ" },
            { "id": "C", "textGu": "મોગરો" },
            { "id": "D", "textGu": "કેસૂડો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગુલાબના ફૂલનો ઉપયોગ ખાવાની વસ્તુ ગુલકંદ બનાવવા થાય છે [૧૪૦]."
        },
        {
          "questionTextGu": "મૂળા શું છે?",
          "options": [
            { "id": "A", "textGu": "ફળ" },
            { "id": "B", "textGu": "મૂળ" },
            { "id": "C", "textGu": "પર્ણ" },
            { "id": "D", "textGu": "પુષ્પ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મૂળા એ જમીનની અંદર રહેલું રૂપાંતરિત મૂળ છે [૧૪૪]."
        },
        {
          "questionTextGu": "વૃક્ષોને પાનખર ઋતુમાં શું થાય છે?",
          "options": [
            { "id": "A", "textGu": "નવા ફૂલ આવે" },
            { "id": "B", "textGu": "તેનાં પાંદડાં ખરી પડે છે" },
            { "id": "C", "textGu": "વૃક્ષ સુકાઈ જાય" },
            { "id": "D", "textGu": "મૂળ ઊંડા જાય" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વર્ષના ચોક્કસ મહિનાઓમાં વૃક્ષોના જૂના પાંદડાં ખરી પડે છે [૧૪૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "વડવાઈ", "backGu": "વડના ઝાડની ડાળીઓમાંથી નીકળતા હવાઈ મૂળ [૧૪૭]" },
        { "frontGu": "ગુલકંદ", "backGu": "ગુલાબની પાંખડીઓમાંથી બનતી ખાવાની મીઠી વસ્તુ [૧૪૦]" },
        { "frontGu": "અંકુરિત (Germinated)", "backGu": "બીજમાંથી નાના છોડનું ફૂટવું કે બહાર આવવું [૧૪૮]" },
        { "frontGu": "પાટણના પટોળાં", "backGu": "કચ્છ અને પાટણમાં ફૂલોની ભાત સાથેનું પ્રખ્યાત વણાટકામ [૧૩૬]" },
        { "frontGu": "પુષ્પગુચ્છ (Bouquet)", "backGu": "વિવિધ ફૂલોનો સજાવેલો સમૂહ [૧૪૨]" }
      ]
    },
    {
      "chapterNumber": 12,
      "titleGu": "બદલાતો સમય",
      "quizzes": [
        {
          "questionTextGu": "નીલાભાઈનું કુટુંબ ૭૦ વર્ષ પહેલાં કયા ગામમાં રહેતું હતું?",
          "options": [
            { "id": "A", "textGu": "ધોળાવીરા" },
            { "id": "B", "textGu": "અલ્યારનો ટંડો" },
            { "id": "C", "textGu": "ખરચરિયા" },
            { "id": "D", "textGu": "પાટણ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નીલાભાઈનું કુટુંબ પાકિસ્તાનમાં આવેલા અલ્યારનો ટંડો ગામમાં રહેતું હતું [૧૫૨]."
        },
        {
          "questionTextGu": "નીલાભાઈએ પહેલું ઘર બનાવવા કઈ સામગ્રીનો ઉપયોગ કર્યો હતો?",
          "options": [
            { "id": "A", "textGu": "સિમેન્ટ અને લોખંડ" },
            { "id": "B", "textGu": "માટી, ગાયનું છાણ અને ભૂંસું" },
            { "id": "C", "textGu": "ઈંટો અને પથ્થર" },
            { "id": "D", "textGu": "કાચ અને સ્ટીલ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "શરૂઆતમાં ઘરો કાચાં હતાં, જે માટી અને લીંપણથી બનાવવામાં આવતા હતા [૧૫૩]."
        },
        {
          "questionTextGu": "મા ભોંયતળિયે ગાયના છાણનું લીંપણ કેમ કરતા હતા?",
          "options": [
            { "id": "A", "textGu": "મજબૂતી માટે" },
            { "id": "B", "textGu": "જીવજંતુઓ દૂર રાખવા માટે" },
            { "id": "C", "textGu": "રંગ માટે" },
            { "id": "D", "textGu": "ઠંડક માટે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગાર કરેલી જગ્યાએથી જીવજંતુઓ દૂર રહે છે તેવી માન્યતા હતી [૧૫૪]."
        },
        {
          "questionTextGu": "બેલા (પથ્થર) શું છે?",
          "options": [
            { "id": "A", "textGu": "મોટો પહાડ" },
            { "id": "B", "textGu": "દરિયાકિનારે ખાણોમાંથી નીકળતો પથ્થર" },
            { "id": "C", "textGu": "પાકી ઈંટ" },
            { "id": "D", "textGu": "કાચનો પ્રકાર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બેલાં દરિયાકિનારેથી મળે છે અને તેનો ઉપયોગ ઈંટોની જેમ બાંધકામમાં થાય છે [૧૫૮]."
        },
        {
          "questionTextGu": "લાકડાનું કામ કરનાર માણસને શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "કુંભાર" },
            { "id": "B", "textGu": "સુથાર" },
            { "id": "C", "textGu": "લુહાર" },
            { "id": "D", "textGu": "કડિયો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "લાકડામાંથી ફર્નિચર કે ડાળીઓના વાંસા બનાવનારને સુથાર કહેવાય [૧૬૧]."
        }
      ],
      "flashcards": [
        { "frontGu": "સ્થળાંતર (Migration)", "backGu": "એક દેશ કે ગામ છોડીને બીજા સ્થળે જઈ રહેવું [૧૫૨]" },
        { "frontGu": "લીંપણ (Gar)", "backGu": "માટી અને છાણનું મિશ્રણ જે જમીન પર લગાવાય છે [૧૫૪]" },
        { "frontGu": "કડિયો (Mason)", "backGu": "ઈંટો અને સિમેન્ટ વડે મકાન ચણનાર માણસ [૧૬૨]" },
        { "frontGu": "નળિયાં", "backGu": "છત ઢાંકવા માટે વપરાતા માટીના વળાંકવાળા ટુકડા [૧૫૪]" },
        { "frontGu": "બદલાતો સમય", "backGu": "સમય સાથે રહેઠાણ અને બાંધકામની પદ્ધતિઓમાં આવતો ફેરફાર [૧૫૯]" }
      ]
    },
    {
      "chapterNumber": 13,
      "titleGu": "નદીની સફર",
      "quizzes": [
        {
          "questionTextGu": "નદીનું પાણી ક્યાંથી નીકળે ત્યારે સૌથી ચોખ્ખું હોય છે?",
          "options": [
            { "id": "A", "textGu": "દરિયા પાસે" },
            { "id": "B", "textGu": "પર્વત (ઉદગમ સ્થાન) પરથી" },
            { "id": "C", "textGu": "શહેર નજીક" },
            { "id": "D", "textGu": "ફેક્ટરી પાસે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નદી જ્યાંથી શરૂ થાય છે ત્યાં તેનું પાણી શુદ્ધ અને રંગહીન હોય છે [૧૬૫]."
        },
        {
          "questionTextGu": "નદીનું પાણી ગંદું થવાનું મુખ્ય કારણ શું છે?",
          "options": [
            { "id": "A", "textGu": "માછલીઓનું રહેવું" },
            { "id": "B", "textGu": "કપડાં ધોવા, કચરો અને ફેક્ટરીનું કેમિકલ" },
            { "id": "C", "textGu": "વરસાદ પડવો" },
            { "id": "D", "textGu": "હોડી ચલાવવી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "માનવ પ્રવૃત્તિઓ અને ઔદ્યોગિક કચરો નદીને પ્રદૂષિત કરે છે [૧૬૮]."
        },
        {
          "questionTextGu": "દરિયાનું પાણી પીવાલાયક કેમ નથી હોતું?",
          "options": [
            { "id": "A", "textGu": "તે ગંદું હોય છે" },
            { "id": "B", "textGu": "તે ખૂબ જ ખારું હોય છે" },
            { "id": "C", "textGu": "તેમાં માછલીઓ હોય છે" },
            { "id": "D", "textGu": "તે વહેતું નથી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દરિયાના પાણીમાં ક્ષારનું પ્રમાણ ખૂબ વધારે હોવાથી તે ખારું લાગે છે [૧૬૭]."
        },
        {
          "questionTextGu": "પાણીને શુદ્ધ કરવાનો સૌથી સારો ઉપાય કયો છે?",
          "options": [
            { "id": "A", "textGu": "તેને કપડાથી ગાળવું" },
            { "id": "B", "textGu": "તેને ઉકાળવું" },
            { "id": "C", "textGu": "તેમાં મીઠું નાખવું" },
            { "id": "D", "textGu": "તેને સ્થિર રાખવું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પાણીને ઉકાળવાથી તેમાં રહેલા હાનિકારક જીવાણુઓ નાશ પામે છે [૧૭૧]."
        },
        {
          "questionTextGu": "નીચેનામાંથી કઈ વસ્તુ પાણીમાં ઓગળતી નથી?",
          "options": [
            { "id": "A", "textGu": "મીઠું" },
            { "id": "B", "textGu": "ચૉકનો પાઉડર (કે પથ્થર)" },
            { "id": "C", "textGu": "ખાંડ" },
            { "id": "D", "textGu": "હળદર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પથ્થર, ચૉક કે પ્લાસ્ટિક જેવી વસ્તુઓ પાણીમાં અદ્રાવ્ય છે [૧૭૧]."
        }
      ],
      "flashcards": [
        { "frontGu": "પ્રદૂષિત પાણી", "backGu": "ગંદુ પાણી જે સ્વાસ્થ્ય માટે નુકસાનકારક છે [૧૭૧]" },
        { "frontGu": "શુદ્ધિકરણ (Purify)", "backGu": "પાણીને પીવાલાયક બનાવવાની પ્રક્રિયા [૧૭૧]" },
        { "frontGu": "જળચર (Aquatic)", "backGu": "પાણીમાં રહેતા પ્રાણીઓ અને વનસ્પતિઓ [૧૬૫]" },
        { "frontGu": "પૂર (Flood)", "backGu": "ભારે વરસાદને કારણે નદીમાં પાણીનું વધવું અને બહાર ફેલાવું [૧૬૮]" },
        { "frontGu": "દ્રાવ્ય પદાર્થ", "backGu": "ખાંડ અને મીઠું જેવી વસ્તુઓ જે પાણીમાં સંપૂર્ણ ઓગળી જાય છે [૧૭૦]" }
      ]
    },
    {
      "chapterNumber": 14,
      "titleGu": "રાજુનું ખેતર",
      "quizzes": [
        {
          "questionTextGu": "રાજુના પિતા ખેતર તૈયાર કરવા કયા સાધનનો ઉપયોગ કરે છે?",
          "options": [
            { "id": "A", "textGu": "કોદાળી" },
            { "id": "B", "textGu": "કરવત" },
            { "id": "C", "textGu": "હથોડી" },
            { "id": "D", "textGu": "પક્કડ" }
          ],
          "correctOptionId": "A",
          "explanationGu": "જમીનને ખોદીને નરમ અને પોચી બનાવવા કોદાળી વપરાય છે [૧૭૨]."
        },
        {
          "questionTextGu": "ખેતીમાં 'નીંદણ' (Weeds) એટલે શું?",
          "options": [
            { "id": "A", "textGu": "મુખ્ય પાક" },
            { "id": "B", "textGu": "વાવ્યા વગર ઊગી નીકળતું નકામું ઘાસ" },
            { "id": "C", "textGu": "ખાતર" },
            { "id": "D", "textGu": "ખેતીનું સાધન" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નીંદણ પાક સાથે પોષણ મેળવે છે, તેથી તેને દૂર કરવું જરૂરી છે [૧૭૪]."
        },
        {
          "questionTextGu": "ડુંગળીનો પાક તૈયાર થઈ ગયો છે તે કેવી રીતે ખબર પડે?",
          "options": [
            { "id": "A", "textGu": "તેના પાન લાલ થાય ત્યારે" },
            { "id": "B", "textGu": "પાંદડાં પીળાં અને સૂકાં થઈ જાય ત્યારે" },
            { "id": "C", "textGu": "જ્યારે વરસાદ પડે ત્યારે" },
            { "id": "D", "textGu": "તેની ઊંચાઈ વધે ત્યારે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સૂકાં અને પીળાં પાંદડાં સૂચવે છે કે ડુંગળી લણણી માટે તૈયાર છે [૧૭૫]."
        },
        {
          "questionTextGu": "ડુંગળીની સુકાયેલી ડાળીઓ કાપવા માટે કયા સાધનનો ઉપયોગ થાય છે?",
          "options": [
            { "id": "A", "textGu": "કુહાડી" },
            { "id": "B", "textGu": "ઈલ્લીજ (એક પ્રકારનું દાતરડું)" },
            { "id": "C", "textGu": "કાતર" },
            { "id": "D", "textGu": "હળ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઈલ્લીજ ખૂબ જ ધારદાર હોય છે જે ડુંગળી સાફ કરવામાં વપરાય છે [૧૭૬]."
        },
        {
          "questionTextGu": "ખેતર ખેડવા માટે પ્રાણીઓ સિવાય કયું આધુનિક સાધન વપરાય છે?",
          "options": [
            { "id": "A", "textGu": "ટ્રેક્ટર" },
            { "id": "B", "textGu": "બસ" },
            { "id": "C", "textGu": "રિક્ષા" },
            { "id": "D", "textGu": "લારી" }
          ],
          "correctOptionId": "A",
          "explanationGu": "આજકાલ ઘણા ખેડૂતો બળદની જગ્યાએ ટ્રેક્ટરનો ઉપયોગ કરે છે [૧૭૪]."
        }
      ],
      "flashcards": [
        { "frontGu": "વાવણી (Sowing)", "backGu": "જમીનમાં ચોક્કસ અંતરે બીજ નાખવાની ક્રિયા [૧૭૩]" },
        { "frontGu": "લણણી (Harvest)", "backGu": "તૈયાર થયેલા પાકને કાપવાની કે જમીનમાંથી બહાર કાઢવાની ક્રિયા [૧૭૫]" },
        { "frontGu": "કોદાળી", "backGu": "જમીન ખોદવા માટેનું એક લોખંડનું સાધન [૧૭૨]" },
        { "frontGu": "મંડી", "backGu": "મોટું બજાર જ્યાં ખેડૂતો પાક વેચવા જાય છે [૧૭૬]" },
        { "frontGu": "ઈલ્લીજ", "backGu": "શાકભાજી કે ડાળી કાપવા માટે વપરાતું વળાંકવાળું સાધન [૧૭૭]" }
      ]
    },
    {
      "chapterNumber": 15,
      "titleGu": "બજારથી ઘર સુધી",
      "quizzes": [
        {
          "questionTextGu": "વૈશાલીના પિતાજી અને કુટુંબનું કામ સવારે કેટલા વાગ્યે શરૂ થાય છે?",
          "options": [
            { "id": "A", "textGu": "૬:૦૦ વાગ્યે" },
            { "id": "B", "textGu": "૩:૦૦ વાગ્યે" },
            { "id": "C", "textGu": "૮:૦૦ વાગ્યે" },
            { "id": "D", "textGu": "૫:૦૦ વાગ્યે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "શાકભાજીની તૈયારી માટે કુટુંબ વહેલી સવારે ૩ વાગ્યે ઊઠી જાય છે [૧૭૯]."
        },
        {
          "questionTextGu": "તાજાં શાકભાજી લાવવા પિતાજી ક્યાં જાય છે?",
          "options": [
            { "id": "A", "textGu": "વાડીમાં" },
            { "id": "B", "textGu": "બજાર (મંડી)" },
            { "id": "C", "textGu": "બીજા ગામ" },
            { "id": "D", "textGu": "દુકાને" }
          ],
          "correctOptionId": "B",
          "explanationGu": "શાકભાજીના મોટા જથ્થાબંધ બજારને મંડી કહેવામાં આવે છે [૧૭૯]."
        },
        {
          "questionTextGu": "પિતાજી પહેલાં કયા શાકભાજી વેચવા પ્રયત્ન કરે છે?",
          "options": [
            { "id": "A", "textGu": "તાજાં" },
            { "id": "B", "textGu": "આગલા દિવસના વધેલા" },
            { "id": "C", "textGu": "રંગીન" },
            { "id": "D", "textGu": "સૌથી મોંઘા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "જૂના શાકભાજી બગડી ન જાય તે માટે તેને પહેલાં વેચવામાં આવે છે [૧૮૧]."
        },
        {
          "questionTextGu": "ઉનાળામાં શાકભાજી પર પાણીનો છંટકાવ કેમ કરવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "રંગ માટે" },
            { "id": "B", "textGu": "તેને સાફ કરવા" },
            { "id": "C", "textGu": "તે સુકાઈ ન જાય તે માટે" },
            { "id": "D", "textGu": "તેનું વજન વધારવા" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ગરમીમાં શાકભાજી જલદી સુકાઈ જાય છે, તેથી તેને ભેજવાળા રાખવા પડે છે [૧૮૨]."
        },
        {
          "questionTextGu": "નીચેનામાંથી કયું શાકભાજી જલદી બગડી જાય છે?",
          "options": [
            { "id": "A", "textGu": "બટાટા" },
            { "id": "B", "textGu": "ડુંગળી" },
            { "id": "C", "textGu": "પાલક" },
            { "id": "D", "textGu": "આદું" }
          ],
          "correctOptionId": "C",
          "explanationGu": "લીલા પાંદડાવાળા શાકભાજી (પાલક, મેથી) જલદી બગડી જાય છે [૧૮૪]."
        }
      ],
      "flashcards": [
        { "frontGu": "મંડી", "backGu": "શાકભાજીનું મોટું જથ્થાબંધ બજાર [૧૮૧]" },
        { "frontGu": "સ્પ્રિંકલ (Sprinkle)", "backGu": "પાણીનો છંટકાવ કરવો [૧૮૦]" },
        { "frontGu": "કોથળા (Sacks)", "backGu": "શાકભાજી ભરવા માટે વપરાતા શણના કે પ્લાસ્ટિકના કોથળા [૧૭૯]" },
        { "frontGu": "બગડી જવું (Spoil)", "backGu": "શાકભાજી કે ફળનું ખાવાલાયક ન રહેવું [૧૮૪]" },
        { "frontGu": "લારી", "backGu": "શાકભાજી વેચવા માટે વપરાતું પૈડાંવાળું સાધન [૧૮૧]" }
      ]
    },
    {
      "chapterNumber": 16,
      "titleGu": "કામનો મહિનો",
      "quizzes": [
        {
          "questionTextGu": "ગીજુભાઈ બધેકાએ બાળકોને પત્ર કયા શહેરમાંથી લખ્યો હતો?",
          "options": [
            { "id": "A", "textGu": "અમદાવાદ" },
            { "id": "B", "textGu": "ભાવનગર" },
            { "id": "C", "textGu": "રાજકોટ" },
            { "id": "D", "textGu": "વડોદરા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગીજુભાઈ ભાવનગરના બાલમંદિરથી પત્રો લખતા હતા [૧૮૫]."
        },
        {
          "questionTextGu": "કયું પક્ષી પોતાનો માળો બનાવતું નથી અને બીજાના માળામાં ઈંડાં મૂકે છે?",
          "options": [
            { "id": "A", "textGu": "કાગડો" },
            { "id": "B", "textGu": "કોયલ" },
            { "id": "C", "textGu": "ચકલી" },
            { "id": "D", "textGu": "કબૂતર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કોયલ ખૂબ આળસુ હોય છે, તે કાગડાના માળામાં ઈંડાં મૂકી દે છે [૧૮૮]."
        },
        {
          "questionTextGu": "બે પાંદડાં સીવીને માળો બનાવનાર પક્ષી કયું છે?",
          "options": [
            { "id": "A", "textGu": "સુગરી" },
            { "id": "B", "textGu": "દરજીડો" },
            { "id": "C", "textGu": "દેવચકલી" },
            { "id": "D", "textGu": "ફૂલસૂંઘણી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દરજીડો તેની તીક્ષ્ણ ચાંચથી પાંદડાં સીવીને સરસ માળો બનાવે છે [૧૯૦]."
        },
        {
          "questionTextGu": "કયા પ્રાણીના દાંત આખી જિંદગી વધ્યા જ કરે છે?",
          "options": [
            { "id": "A", "textGu": "સાપ" },
            { "id": "B", "textGu": "બિલાડી" },
            { "id": "C", "textGu": "ખિસકોલી" },
            { "id": "D", "textGu": "ગાય" }
          ],
          "correctOptionId": "C",
          "explanationGu": "ખિસકોલીના દાંત વધતા હોવાથી તે વસ્તુઓ કોતરીને તેમને ઘસે છે [૧૯૭]."
        },
        {
          "questionTextGu": "સાપ પોતાનો ખોરાક કેવી રીતે લે છે?",
          "options": [
            { "id": "A", "textGu": "ચાવીને" },
            { "id": "B", "textGu": "આખેઆખો ગળીને" },
            { "id": "C", "textGu": "ચાટીને" },
            { "id": "D", "textGu": "ટુકડા કરીને" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સાપને દાંત હોય છે પણ તે ખોરાક ચાવવા માટે નહીં, પકડવા માટે હોય છે [૧૯૭]."
        }
      ],
      "flashcards": [
        { "frontGu": "દેવચકલી (Indian Robin)", "backGu": "પથ્થરોની વચ્ચે ઘાસ, રૂ અને ઊનથી માળો બનાવનાર પક્ષી [૧૮૭]" },
        { "frontGu": "સુગરી", "backGu": "જેમાં નર પક્ષી સુંદર માળા વણે છે અને માદા તે પસંદ કરે છે [૧૯૧]" },
        { "frontGu": "કંસારો (Barbet)", "backGu": "વૃક્ષના થડમાં કાણું પાડીને માળો બનાવનાર પક્ષી [૧૯૦]" },
        { "frontGu": "પક્ષીના પંજા", "backGu": "તરવા, ડાળી પકડવા કે શિકાર કરવા માટે જુદા પ્રકારના હોય છે [૧૯૬]" },
        { "frontGu": "દૂધિયા દાંત", "backGu": "બાળપણમાં આવતા દાંત જે પડી જાય છે [૧૯૭]" }
      ]
    },
    {
      "chapterNumber": 17,
      "titleGu": "તેજલ અમદાવાદમાં",
      "quizzes": [
        {
          "questionTextGu": "તેજલ અમદાવાદ શા માટે આવી હતી?",
          "options": [
            { "id": "A", "textGu": "ફરવા માટે" },
            { "id": "B", "textGu": "માતાના ઈલાજ માટે" },
            { "id": "C", "textGu": "ભણવા માટે" },
            { "id": "D", "textGu": "નોકરી માટે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તેજલની માતા બીમાર હોવાથી તેને હૉસ્પિટલમાં દાખલ કરી હતી [૧૯૯]."
        },
        {
          "questionTextGu": "મામાના ઘરે પાણી ભરવા માટે તેજલે ક્યારે ઊઠવું પડતું?",
          "options": [
            { "id": "A", "textGu": "સવારે ૭:૦૦ વાગ્યે" },
            { "id": "B", "textGu": "સવારે ૪:૦૦ વાગ્યે" },
            { "id": "C", "textGu": "બપોરે ૧૨:૦૦ વાગ્યે" },
            { "id": "D", "textGu": "રાત્રે ૮:૦૦ વાગ્યે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સામૂહિક નળ પર પાણી ભરવા લાઈન લાગતી હોવાથી વહેલા ઊઠવું પડે [૨૦૧]."
        },
        {
          "questionTextGu": "ઊંચાં મકાનોમાં ઉપર જવા માટે શાનો ઉપયોગ થાય છે?",
          "options": [
            { "id": "A", "textGu": "સીડી" },
            { "id": "B", "textGu": "લિફ્ટ" },
            { "id": "C", "textGu": "દોરડાં" },
            { "id": "D", "textGu": "ઉપરના તમામ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બહુમાળી ઇમારતોમાં લોકો લિફ્ટ દ્વારા ઝડપથી ઉપર જઈ શકે છે [૨૦૪]."
        },
        {
          "questionTextGu": "તેજલના ગામના ઘર અને મામાના ઘર વચ્ચે મોટો તફાવત શું હતો?",
          "options": [
            { "id": "A", "textGu": "ગામમાં રસોઈ માટે અલગ જગ્યા અને આંગણું હતું" },
            { "id": "B", "textGu": "મામાનું ઘર મોટું હતું" },
            { "id": "C", "textGu": "ગામમાં વીજળી નહોતી" },
            { "id": "D", "textGu": "કોઈ તફાવત નહોતો" }
          ],
          "correctOptionId": "A",
          "explanationGu": "શહેરમાં ગલીની ઝૂંપડીઓમાં એક જ રૂમમાં બધું કરવું પડતું હોય છે [૨૦૧]."
        },
        {
          "questionTextGu": "અમદાવાદમાં સાબરમતી નદીના કિનારે શું આવેલું છે?",
          "options": [
            { "id": "A", "textGu": "વૉટર પાર્ક" },
            { "id": "B", "textGu": "રિવરફ્રન્ટ" },
            { "id": "C", "textGu": "મોટો પહાડ" },
            { "id": "D", "textGu": "રણ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "બાળકો અમદાવાદમાં રિવરફ્રન્ટ જોવા વિશે ખૂબ વાતો કરતા હતા [૨૦૮]."
        }
      ],
      "flashcards": [
        { "frontGu": "સાંકડી ગલી", "backGu": "શહેરની ભીડભાડવાળી જગ્યા જ્યાં મામા રહેતા હતા [૨૦૦]" },
        { "frontGu": "લિફ્ટ (Lift)", "backGu": "લોખંડના પાંજરા જેવી રચના જે ઉપર-નીચે લઈ જાય [૨૦૪]" },
        { "frontGu": "હૉસ્પિટલ", "backGu": "બીમાર વ્યક્તિઓની સારવાર માટેની જગ્યા [૨૦૫]" },
        { "frontGu": "સામૂહિક નળ", "backGu": "જ્યાં ગલીના બધા લોકો પાણી ભરવા ભેગા થાય [૨૦૧]" },
        { "frontGu": "સ્થળાંતર", "backGu": "નોટિસ મળવાને કારણે ઘર ખાલી કરી બીજી જગ્યાએ જવું [૨૦૯]" }
      ]
    },
    {
      "chapterNumber": 18,
      "titleGu": "ગામ-ગામનાં પાણી",
      "quizzes": [
        {
          "questionTextGu": "ગંદું કે પ્રદૂષિત પાણી પીવાથી શું થઈ શકે?",
          "options": [
            { "id": "A", "textGu": "શક્તિ વધે" },
            { "id": "B", "textGu": "બીમાર પડી શકાય (ઝાડા-ઊલટી)" },
            { "id": "C", "textGu": "તરસ ન લાગે" },
            { "id": "D", "textGu": "કાઈ ન થાય" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગંદા પાણીમાં રહેલા કચરા અને જીવાણુઓથી રોગ થાય છે [૨૧૨, ૨૧૮]."
        },
        {
          "questionTextGu": "ORS (ઓ.આર.એસ.) દ્રાવણ કેવી રીતે બનાવાય છે?",
          "options": [
            { "id": "A", "textGu": "દૂધ અને દહીં" },
            { "id": "B", "textGu": "ઉકાળેલા પાણીમાં ખાંડ અને મીઠું ભેળવીને" },
            { "id": "C", "textGu": "ઠંડા પીણામાં બરફ નાખીને" },
            { "id": "D", "textGu": "માત્ર પાણી પીવાથી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઝાડા-ઊલટી વખતે શરીરમાં પાણીનું પ્રમાણ જાળવવા આ દ્રાવણ અપાય છે [૨૧૮]."
        },
        {
          "questionTextGu": "વૉટર પાર્કમાં શું જોવા મળે છે?",
          "options": [
            { "id": "A", "textGu": "પાણીના ફુવારા અને રાઇડ્સ" },
            { "id": "B", "textGu": "મોટા ખેતરો" },
            { "id": "C", "textGu": "રેલવે સ્ટેશન" },
            { "id": "D", "textGu": "પાણીની અછત" }
          ],
          "correctOptionId": "A",
          "explanationGu": "વૉટર પાર્ક મનોરંજન માટે હોય છે જ્યાં પુષ્કળ પાણી વપરાય છે [૨૧૩]."
        },
        {
          "questionTextGu": "ચેકડેમ બનાવવાથી શું ફાયદો થાય છે?",
          "options": [
            { "id": "A", "textGu": "પાણીનો બગાડ થાય" },
            { "id": "B", "textGu": "જમીનમાં પાણીના તળ ઊંચા આવે" },
            { "id": "C", "textGu": "રસ્તાઓ બંધ થાય" },
            { "id": "D", "textGu": "વરસાદ ઓછો પડે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ચેકડેમ દ્વારા વહેતું પાણી અટકાવી જમીનમાં ઉતારી શકાય છે [૨૨૫]."
        },
        {
          "questionTextGu": "પાણી પીતા પહેલાં તેને શું કરવું સૌથી હિતાવહ છે?",
          "options": [
            { "id": "A", "textGu": "ફ્રીઝમાં મૂકવું" },
            { "id": "B", "textGu": "ઉકાળવું" },
            { "id": "C", "textGu": "બરફ નાખવો" },
            { "id": "D", "textGu": "કાચના ગ્લાસમાં ભરવું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ઉકાળેલું પાણી પીવા માટે સૌથી શુદ્ધ અને સલામત છે [૨૧૬]."
        }
      ],
      "flashcards": [
        { "frontGu": "ORS", "backGu": "Oral Rehydration Solution (ઓરલ રીહાઇડ્રેશન સૉલ્યુશન) [૨૧૮]" },
        { "frontGu": "ચેકડેમ", "backGu": "નદી કે વહેણ પર પાણી રોકવા માટે બાંધેલો નાનો ડેમ [૨૨૫]" },
        { "frontGu": "પ્રદૂષિત (Contaminated)", "backGu": "ગંદકી કે ગટરનું પાણી ભળવાથી અશુદ્ધ થયેલું [૨૧૨]" },
        { "frontGu": "ડોયો", "backGu": "માટલામાંથી પાણી લેવા માટે વપરાતું હાથાવાળું વાસણ [૨૨૧]" },
        { "frontGu": "ઝાડા-ઊલટી", "backGu": "શરીરમાંથી પાણી ઓછું કરી દેતી બીમારી [૨૧૮]" }
      ]
    },
    {
      "chapterNumber": 19,
      "titleGu": "સાથે જમીએ",
      "quizzes": [
        {
          "questionTextGu": "ઉત્તરાયણનો તહેવાર ક્યારે ઊજવવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "૧૪ જાન્યુઆરી" },
            { "id": "B", "textGu": "૧૫ ઓગસ્ટ" },
            { "id": "C", "textGu": "૨૬ જાન્યુઆરી" },
            { "id": "D", "textGu": "૧૪ નવેમ્બર" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ઉત્તરાયણને મકર સંક્રાંતિ પણ કહેવામાં આવે છે [૨૩૦, ૨૩૧]."
        },
        {
          "questionTextGu": "ઉત્તરાયણમાં કઈ વાનગી ખાસ બનાવવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "ઢોકળાં" },
            { "id": "B", "textGu": "ઊંધિયું અને જલેબી" },
            { "id": "C", "textGu": "લાપસી" },
            { "id": "D", "textGu": "સેવ ખમણી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પિન્કીની મમ્મીએ અને આખા ગામમાં લોકોએ ઊંધિયું બનાવ્યું હતું [૨૨૯]."
        },
        {
          "questionTextGu": "શાળાઓમાં અપાતા ગરમ ભોજનને શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "નાસ્તો" },
            { "id": "B", "textGu": "મધ્યાહ્ન ભોજન (Mid-day Meal)" },
            { "id": "C", "textGu": "ડિનર" },
            { "id": "D", "textGu": "લંચબોક્સ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પ્રાથમિક શાળાના બાળકોને તાજું અને પકવેલું ભોજન આપવું એ તેમનો હક છે [૨૩૫]."
        },
        {
          "questionTextGu": "તિથિભોજન એટલે શું?",
          "options": [
            { "id": "A", "textGu": "હોટલનું જમવાનું" },
            { "id": "B", "textGu": "ગામના લોકો દ્વારા કોઈ ખાસ દિવસે અપાતું ભોજન" },
            { "id": "C", "textGu": "ઉપવાસનું ભોજન" },
            { "id": "D", "textGu": "રાત્રિનું ભોજન" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તિથિભોજનમાં ઘણીવાર મીઠાઈ પણ આપવામાં આવે છે જે વાલીઓ તરફથી હોય છે [૨૩૨]."
        },
        {
          "questionTextGu": "ઊંધિયું બનાવવા માટે કયા શાકભાજી જોઈએ?",
          "options": [
            { "id": "A", "textGu": "રીંગણ, બટાટા, શક્કરિયાં" },
            { "id": "B", "textGu": "વાલોળ, પાપડી, વડાં" },
            { "id": "C", "textGu": "સૂરણ અને મસાલા" },
            { "id": "D", "textGu": "ઉપરના તમામ" }
          ],
          "correctOptionId": "D",
          "explanationGu": "ઊંધિયું એ વિવિધ શાકભાજી અને મસાલાઓનું મિશ્રણ છે [૨૨૯]."
        }
      ],
      "flashcards": [
        { "frontGu": "મધ્યાહ્ન ભોજન", "backGu": "સરકારી શાળાઓમાં બપોરે અપાતું મફત ભોજન [૨૩૧]" },
        { "frontGu": "તિથિભોજન", "backGu": "સ્વૈચ્છિક રીતે શાળામાં બાળકોને જમાડવાની પરંપરા [૨૩૩]" },
        { "frontGu": "ચિક્કી", "backGu": "ગોળ અને સીંગ અથવા તલમાંથી બનતી મીઠી વસ્તુ [૨૨૮]" },
        { "frontGu": "ઉજાણી (Party)", "backGu": "મિત્રો કે સહપાઠીઓ સાથે મળીને આનંદ કરવો અને જમવું [૨૨૭]" },
        { "frontGu": "સર્વોચ્ચ અદાલત", "backGu": "દેશની મોટી કોર્ટ જેણે મધ્યાહ્ન ભોજનનો હુકમ કર્યો છે [૨૩૫]" }
      ]
    },
    {
      "chapterNumber": 20,
      "titleGu": "ખોરાક અને મજા",
      "quizzes": [
        {
          "questionTextGu": "ગુરુદ્વારામાં સાથે રસોઈ કરવી અને જમવું તેને શું કહેવાય?",
          "options": [
            { "id": "A", "textGu": "પાર્ટી" },
            { "id": "B", "textGu": "લંગર" },
            { "id": "C", "textGu": "પિકનિક" },
            { "id": "D", "textGu": "તિથિભોજન" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગુરુદ્વારામાં દરેક વ્યક્તિ સાથે બેસીને પ્રેમથી જમે તેને લંગર કહેવાય [૨૪૧]."
        },
        {
          "questionTextGu": "કઢાહપ્રસાદ શામાંથી બનાવવામાં આવે છે?",
          "options": [
            { "id": "A", "textGu": "ચોખા અને દૂધ" },
            { "id": "B", "textGu": "ઘઉંનો લોટ, ઘી અને ખાંડ" },
            { "id": "C", "textGu": "બેસન અને તેલ" },
            { "id": "D", "textGu": "ફળો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કઢાહપ્રસાદ એક પ્રકારનો શીરો છે જે મોટી કઢાઈમાં બનાવાય છે [૨૩૯]."
        },
        {
          "questionTextGu": "ગુરુદ્વારામાં પ્રવેશતા પહેલા શું કરવું જરૂરી છે?",
          "options": [
            { "id": "A", "textGu": "માથું ઢાંકવું" },
            { "id": "B", "textGu": "પગરખાં પહેરવા" },
            { "id": "C", "textGu": "ગાવું" },
            { "id": "D", "textGu": "કાંઈ નહીં" }
          ],
          "correctOptionId": "A",
          "explanationGu": "ગુરુદ્વારામાં મર્યાદા જાળવવા માટે માથું રૂમાલ કે દુપટ્ટાથી ઢાંકવામાં આવે છે [૨૩૭]."
        },
        {
          "questionTextGu": "છાત્રાલય (Hostel) માં જીવન કેવું હોય છે?",
          "options": [
            { "id": "A", "textGu": "ત્યાં માતા-પિતા સાથે રહેવાય" },
            { "id": "B", "textGu": "ત્યાં બધા બાળકો સાથે મળીને રહે અને જમે" },
            { "id": "C", "textGu": "ત્યાં ભણવાનું હોતું નથી" },
            { "id": "D", "textGu": "તે ઘર જેવું જ હોય છે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "છાત્રાલયમાં બાળકો શિસ્ત અને સમૂહ જીવન શીખે છે [૨૩૬]."
        },
        {
          "questionTextGu": "ગુરુદ્વારામાં રસોઈ માટે વસ્તુઓ કોણ લાવે છે?",
          "options": [
            { "id": "A", "textGu": "માત્ર સરકાર" },
            { "id": "B", "textGu": "દરેક વ્યક્તિ શક્તિ મુજબ સહયોગ આપે છે" },
            { "id": "C", "textGu": "કોઈ એક જ માણસ" },
            { "id": "D", "textGu": "દુકાનદાર મફત આપે" }
          ],
          "correctOptionId": "B",
          "explanationGu": "સેવાભાવી લોકો અનાજ, પૈસા કે મહેનત દ્વારા ફાળો આપે છે [૨૪૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "લંગર", "backGu": "સામૂહિક રસોઈ અને ભોજનની વ્યવસ્થા [૨૪૧]" },
        { "frontGu": "કઢાહપ્રસાદ", "backGu": "ગુરુદ્વારામાં અપાતો પ્રસાદ (શીરો) [૨૩૯]" },
        { "frontGu": "અરદાસ", "backGu": "પ્રાર્થના (ગુરુદ્વારામાં થતી) [૨૪૧]" },
        { "frontGu": "છાત્રાલય (Hostel)", "backGu": "જ્યાં બાળકો રહીને અભ્યાસ કરે છે [૨૩૫]" },
        { "frontGu": "સેવા", "backGu": "સ્વૈચ્છિક રીતે બીજાની મદદ કરવી [૨૪૦]" }
      ]
    },
    {
      "chapterNumber": 21,
      "titleGu": "જગત મારા ઘરમાં",
      "quizzes": [
        {
          "questionTextGu": "મમતાના ઘરમાં ટીવી જોવા બાબતે કેમ ઝઘડો થતો હતો?",
          "options": [
            { "id": "A", "textGu": "ટીવી બગડી ગયું હતું" },
            { "id": "B", "textGu": "બધાને અલગ-અલગ કાર્યક્રમો જોવા હતા" },
            { "id": "C", "textGu": "ટીવી ખૂબ નાનું હતું" },
            { "id": "D", "textGu": "કોઈને ટીવી જોવું નહોતું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ભાઈને ક્રિકેટ, સેજલને ગીતો અને પપ્પાને ફૂટબોલ જોવો હતો [૨૪૩]."
        },
        {
          "questionTextGu": "મીનાકાકીએ કુલફી વેચનારને કેમ પૂરેપૂરા પૈસા આપ્યા?",
          "options": [
            { "id": "A", "textGu": "તેમની પાસે ઘણા પૈસા હતા" },
            { "id": "B", "textGu": "તેઓ પ્રામાણિક હતા" },
            { "id": "C", "textGu": "કુલફી વેચનાર તેમનો મિત્ર હતો" },
            { "id": "D", "textGu": "બાળકોએ જીદ કરી હતી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વેચનારે ભૂલથી ઓછી કુલફી ગણી હતી પણ મીનાકાકીએ પ્રમાણિકતા બતાવી [૨૪૫]."
        },
        {
          "questionTextGu": "અક્ષયના દાદી તેને અનિલના ઘરે કેમ ખાવા-પીવાની ના પાડતા હતા?",
          "options": [
            { "id": "A", "textGu": "અનિલ અક્ષયનો દુશ્મન હતો" },
            { "id": "B", "textGu": "સ્વચ્છતાના અભાવે ત્યાં વારંવાર લોકો બીમાર રહેતા" },
            { "id": "C", "textGu": "ત્યાં ખાવાનું સારું નહોતું" },
            { "id": "D", "textGu": "અનિલનું ઘર દૂર હતું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "દાદી અક્ષયને બીમારીથી બચાવવા માટે સ્વચ્છતાના આગ્રહી હતા [૨૪૭]."
        },
        {
          "questionTextGu": "કરશન કેમ નવો વ્યવસાય શરૂ કરવા માંગતો હતો?",
          "options": [
            { "id": "A", "textGu": "તેને ખેતી ગમતી નહોતી" },
            { "id": "B", "textGu": "તેને અનાજ દળવાની ઘંટી નાખી વધુ કમાણી કરવી હતી" },
            { "id": "C", "textGu": "તેને શહેર જવું હતું" },
            { "id": "D", "textGu": "તેના કાકાએ કહ્યું હતું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કરશન ગામમાં ઘંટી નાખીને કુટુંબને આર્થિક ફાયદો કરાવવા માંગતો હતો [૨૪૮]."
        },
        {
          "questionTextGu": "રિતુને મીનાના ઘરે કેમ જવું પસંદ નહોતું?",
          "options": [
            { "id": "A", "textGu": "ત્યાં રમકડાં નહોતાં" },
            { "id": "B", "textGu": "તેને મીનાના કાકાનું અડવું ગમતું નહોતું" },
            { "id": "C", "textGu": "મીના તેને બોલાવતી નહોતી" },
            { "id": "D", "textGu": "ત્યાં અંધારું હતું" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રિતુને કાકાથી ડર લાગતો હતો કારણ કે તેમનો વ્યવહાર તેને અયોગ્ય લાગતો [૨૫૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "ધારાવાહિક (Serial)", "backGu": "ટીવી પર આવતા ક્રમબદ્ધ કાર્યક્રમો [૨૪૩]" },
        { "frontGu": "પ્રામાણિકતા", "backGu": "ભૂલનો લાભ લેવાને બદલે સાચી રકમ ચૂકવવી (મીનાકાકી) [૨૪૫]" },
        { "frontGu": "નિયમોમાં તફાવત", "backGu": "છોકરા-છોકરીઓ માટે અલગ-અલગ ઘરે આવવાના સમય [૨૪૪]" },
        { "frontGu": "નિર્ણય (Decision)", "backGu": "કુટુંબના વડીલો દ્વારા લેવામાં આવતા મહત્વના કામો [૨૪૯]" },
        { "frontGu": "અડવું (Touch)", "backGu": "દરેકનું અડવું સરખું હોતું નથી, જે ન ગમે તેની સામે બોલવું જોઈએ [૨૫૧]" }
      ]
    },
    {
      "chapterNumber": 22,
      "titleGu": "પટોળાં",
      "quizzes": [
        {
          "questionTextGu": "પાટણનું કયું વણાટકામ વિશ્વભરમાં પ્રખ્યાત છે?",
          "options": [
            { "id": "A", "textGu": "બાંધણી" },
            { "id": "B", "textGu": "પટોળાં" },
            { "id": "C", "textGu": "જરીકામ" },
            { "id": "D", "textGu": "બ્લોક પ્રિન્ટિંગ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પટોળાં એ પાટણની હસ્તકારીગરીની શાન છે [૨૫૩]."
        },
        {
          "questionTextGu": "પટોળાં બનાવવા માટે કયા રેશમના તારનો ઉપયોગ થાય છે?",
          "options": [
            { "id": "A", "textGu": "કોટન સિલ્ક" },
            { "id": "B", "textGu": "મલબારી સિલ્ક" },
            { "id": "C", "textGu": "નાયલોન" },
            { "id": "D", "textGu": "વુલન" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પટોળાંના વણાટકામમાં સફેદ મલબારી સિલ્ક વપરાય છે [૨૫૪]."
        },
        {
          "questionTextGu": "એક પટોળું તૈયાર કરવામાં કેટલો સમય લાગે છે?",
          "options": [
            { "id": "A", "textGu": "૧ મહિનો" },
            { "id": "B", "textGu": "૪ થી ૬ માસ" },
            { "id": "C", "textGu": "૧૫ દિવસ" },
            { "id": "D", "textGu": "૧ વર્ષ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પટોળાં બનાવવામાં ખૂબ જ મહેનત અને ધીરજની જરૂર હોય છે [૨૫૪]."
        },
        {
          "questionTextGu": "‘પડી પટોળે ભાત, ફાટે પણ ફીટે નહિ’ એટલે શું?",
          "options": [
            { "id": "A", "textGu": "પટોળું જલ્દી ફાટી જાય" },
            { "id": "B", "textGu": "પટોળાંનો રંગ ક્યારેય જતો નથી" },
            { "id": "C", "textGu": "પટોળું સસ્તું છે" },
            { "id": "D", "textGu": "તેની ભાત ભૂંસાઈ જાય" }
          ],
          "correctOptionId": "B",
          "explanationGu": "પટોળાંના પાકા રંગો અને ડિઝાઇન વર્ષો સુધી તાજા રહે છે [૨૫૫]."
        },
        {
          "questionTextGu": "પાટણના કયા સ્થાપત્યમાં પટોળાંની ભાત જોવા મળે છે?",
          "options": [
            { "id": "A", "textGu": "સિદ્ધપુરનો રુદ્રમહાલય" },
            { "id": "B", "textGu": "રાણીની વાવ" },
            { "id": "C", "textGu": "સહસ્ત્રલિંગ તળાવ" },
            { "id": "D", "textGu": "મોઢેરાનું સૂર્યમંદિર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "રાણીની વાવના શિલ્પકામમાં પણ પટોળાંની સુંદર ભાત કંડારેલી છે [૨૫૩]."
        }
      ],
      "flashcards": [
        { "frontGu": "સાળવીવાડો", "backGu": "પાટણનો વિસ્તાર જ્યાં પટોળાં વણનારા પરિવારો રહે છે [૨૫૨]" },
        { "frontGu": "તાણાં અને વાણા", "backGu": "પટોળાંના વણાટમાં વપરાતા ઊભા અને આડા રેશમી તાર [૨૫૪]" },
        { "frontGu": "બાંધણીકામ", "backGu": "તાર પર ડિઝાઇન મુજબ દોરી બાંધીને રંગ કરવાની રીત [૨૫૪]" },
        { "frontGu": "હસ્તકારીગરી", "backGu": "હાથ વડે કરવામાં આવતી કલાત્મક કારીગરી (Handicraft) [૨૫૨]" },
        { "frontGu": "કસબી", "backGu": "કોઈ ચોક્કસ કલામાં નિષ્ણાત કારીગર [૨૫૬]" }
      ]
    },
    {
      "chapterNumber": 23,
      "titleGu": "દેશ-પરદેશ",
      "quizzes": [
        {
          "questionTextGu": "અબુધાબી કયા પ્રકારનો પ્રદેશ છે?",
          "options": [
            { "id": "A", "textGu": "પર્વતીય" },
            { "id": "B", "textGu": "રેતાળ રણપ્રદેશ" },
            { "id": "C", "textGu": "લીલોછમ જંગલ" },
            { "id": "D", "textGu": "બરફીલો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "અબુધાબીની આજુબાજુ માઈલો સુધી માત્ર રેતી જ દેખાય છે [૨૬૩]."
        },
        {
          "questionTextGu": "અબુધાબીનું ચલણ કયું છે?",
          "options": [
            { "id": "A", "textGu": "રૂપિયો" },
            { "id": "B", "textGu": "દિરહામ" },
            { "id": "C", "textGu": "ડોલર" },
            { "id": "D", "textGu": "દિનાર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "અબુધાબીમાં વપરાતા નાણાંને દિરહામ કહેવાય છે [૨૬૫]."
        },
        {
          "questionTextGu": "અબુધાબીમાં કયા વૃક્ષો સૌથી વધુ જોવા મળે છે?",
          "options": [
            { "id": "A", "textGu": "આંબો" },
            { "id": "B", "textGu": "ખજૂર" },
            { "id": "C", "textGu": "નાળિયેરી" },
            { "id": "D", "textGu": "વડ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ખજૂરનું વૃક્ષ રણપ્રદેશમાં સરળતાથી ઊગી શકે છે [૨૬૪]."
        },
        {
          "questionTextGu": "અબુધાબીમાં પાણી કરતાં શું સસ્તું છે?",
          "options": [
            { "id": "A", "textGu": "દૂધ" },
            { "id": "B", "textGu": "પેટ્રોલ" },
            { "id": "C", "textGu": "શરબત" },
            { "id": "D", "textGu": "ફળો" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ત્યાં જમીન નીચે પુષ્કળ તેલ હોવાથી પેટ્રોલ પાણી કરતા સસ્તું મળે છે [૨૬૪]."
        },
        {
          "questionTextGu": "ત્યાંના લોકો કેવા કપડાં પહેરવાનું પસંદ કરે છે?",
          "options": [
            { "id": "A", "textGu": "જાડા ઉનના કપડાં" },
            { "id": "B", "textGu": "હળવા સુતરાઉ અને આખા શરીરને ઢાંકે તેવા" },
            { "id": "C", "textGu": "રેઈનકોટ" },
            { "id": "D", "textGu": "માત્ર ટી-શર્ટ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ગરમીથી બચવા માટે લોકો સફેદ સુતરાઉ કપડાં પહેરે છે [૨૬૬]."
        }
      ],
      "flashcards": [
        { "frontGu": "સેન્ડ ડ્યુન્સ (Sand Dunes)", "backGu": "રણમાં જોવા મળતા રેતીના પર્વતો [૨૬૩]" },
        { "frontGu": "દિરહામ", "backGu": "અબુધાબીનું ચલણી નાણું [૨૬૫]" },
        { "frontGu": "ખજૂર", "backGu": "રણપ્રદેશનું મુખ્ય અને સ્વાદિષ્ટ ફળ [૨૬૪]" },
        { "frontGu": "વિમાનમથક (Airport)", "backGu": "જ્યાંથી વિમાન ઉપડે કે ઉતરે તે જગ્યા [૨૬૦]" },
        { "frontGu": "અરબી", "backGu": "અબુધાબીમાં બોલાતી સ્થાનિક ભાષા [૨૬૫]" }
      ]
    },
    {
      "chapterNumber": 24,
      "titleGu": "મસાલેદાર કોયડા",
      "quizzes": [
        {
          "questionTextGu": "કયો મસાલો રસોઈમાં તીખો સ્વાદ લાવે છે અને વધુ ખાતા નાકમાં પાણી લાવે છે?",
          "options": [
            { "id": "A", "textGu": "હળદર" },
            { "id": "B", "textGu": "મરચું" },
            { "id": "C", "textGu": "જીરું" },
            { "id": "D", "textGu": "ધાણા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "લાલ કે લીલું મરચું રસોઈને તીખી બનાવે છે [૨૭૧]."
        },
        {
          "questionTextGu": "ખાંસી થઈ હોય ત્યારે દૂધમાં કયો મસાલો નાખીને પીવાય છે?",
          "options": [
            { "id": "A", "textGu": "મીઠું" },
            { "id": "B", "textGu": "હળદર" },
            { "id": "C", "textGu": "રાઈ" },
            { "id": "D", "textGu": "હીંગ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "હળદર ઔષધ તરીકે વપરાય છે અને તે ખાંસી મટાડવામાં મદદરૂપ છે [૨૭૧]."
        },
        {
          "questionTextGu": "દાંતના દુખાવામાં કયો મસાલો રામબાણ ઈલાજ ગણાય છે?",
          "options": [
            { "id": "A", "textGu": "ઈલાયચી" },
            { "id": "B", "textGu": "લવિંગ" },
            { "id": "C", "textGu": "તજ" },
            { "id": "D", "textGu": "તમાલપત્ર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "લવિંગનું તેલ કે લવિંગ દાંતના દુખાવામાં રાહત આપે છે [૨૭૩]."
        },
        {
          "questionTextGu": "દહીં-છાશમાં ઉપરથી કયો મસાલો નાખતા તે સુગંધિત બને છે?",
          "options": [
            { "id": "A", "textGu": "જીરું" },
            { "id": "B", "textGu": "લવિંગ" },
            { "id": "C", "textGu": "રાઈ" },
            { "id": "D", "textGu": "હળદર" }
          ],
          "correctOptionId": "A",
          "explanationGu": "શેકેલું જીરું છાશનો સ્વાદ અને સુગંધ વધારે છે [૨૭૨]."
        },
        {
          "questionTextGu": "મસાલાનો બગીચો કયા રાજ્યમાં જોવા મળે છે?",
          "options": [
            { "id": "A", "textGu": "ગુજરાત" },
            { "id": "B", "textGu": "કેરળ" },
            { "id": "C", "textGu": "રાજસ્થાન" },
            { "id": "D", "textGu": "બિહાર" }
          ],
          "correctOptionId": "B",
          "explanationGu": "કેરળમાં મસાલાના બગીચા હોય છે જ્યાં મરી, ઈલાયચી વગેરે ઉગાડાય છે [૨૭૪]."
        }
      ],
      "flashcards": [
        { "frontGu": "હળદર", "backGu": "પીળો રંગ અને તૂરો સ્વાદ ધરાવતી ઔષધિ [૨૭૧]" },
        { "frontGu": "લવિંગ", "backGu": "ખીલી જેવો આકાર ધરાવતો દાંતના દુખાવાનો મસાલો [૨૭૩]" },
        { "frontGu": "વરિયાળી", "backGu": "લીલી, નાની અને મીઠી જે મુખવાસમાં વપરાય [૨૭૨]" },
        { "frontGu": "મરી (Pepper)", "backGu": "ઝીણી, ગોળ અને કાળી જે અંદરથી સફેદ હોય [૨૭૧]" },
        { "frontGu": "ગરમ મસાલો", "backGu": "ઘણા મસાલાઓનો મિશ્ર પાઉડર [૨૭૬]" }
      ]
    },
    {
      "chapterNumber": 25,
      "titleGu": "મારો જિલ્લો",
      "quizzes": [
        {
          "questionTextGu": "ક્ષેત્રફળની દૃષ્ટિએ ગુજરાતનો સૌથી મોટો જિલ્લો કયો છે?",
          "options": [
            { "id": "A", "textGu": "અમદાવાદ" },
            { "id": "B", "textGu": "કચ્છ" },
            { "id": "C", "textGu": "બનાસકાંઠા" },
            { "id": "D", "textGu": "રાજકોટ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "વિશ્વાએ કહ્યું તેમ કચ્છ જિલ્લો વિસ્તારની રીતે ઘણો મોટો છે [૨૭૭]."
        },
        {
          "questionTextGu": "ગુજરાતનો સૌથી નાનો અને સૌથી ઓછી વસતિ ધરાવતો જિલ્લો કયો છે?",
          "options": [
            { "id": "A", "textGu": "તાપી" },
            { "id": "B", "textGu": "ડાંગ" },
            { "id": "C", "textGu": "પોરબંદર" },
            { "id": "D", "textGu": "મોરબી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "ડાંગ જિલ્લો વિસ્તાર અને વસતિ એમ બંનેમાં સૌથી નાનો છે [૨૭૯]."
        },
        {
          "questionTextGu": "સરદાર સરોવર બંધ કઈ નદી પર બાંધવામાં આવ્યો છે?",
          "options": [
            { "id": "A", "textGu": "તાપી" },
            { "id": "B", "textGu": "નર્મદા" },
            { "id": "C", "textGu": "સાબરમતી" },
            { "id": "D", "textGu": "મહી" }
          ],
          "correctOptionId": "B",
          "explanationGu": "નર્મદા જિલ્લાના નવાગામ મુકામે આ વિશાળ બંધ આવેલો છે [૨૮૧]."
        },
        {
          "questionTextGu": "તરણેતરનો મેળો કયા જિલ્લામાં ભરાય છે?",
          "options": [
            { "id": "A", "textGu": "જૂનાગઢ" },
            { "id": "B", "textGu": "સુરેન્દ્રનગર" },
            { "id": "C", "textGu": "બનાસકાંઠા" },
            { "id": "D", "textGu": "અમદાવાદ" }
          ],
          "correctOptionId": "B",
          "explanationGu": "તરણેતરનો મેળો ભારતભરમાં તેની ભરત ભરેલી છત્રીઓ માટે જાણીતો છે [૨૮૨]."
        },
        {
          "questionTextGu": "ગુજરાતનું સૌથી ઊંચું શિખર કયું છે?",
          "options": [
            { "id": "A", "textGu": "પાવાગઢ" },
            { "id": "B", "textGu": "ગિરનારનું ગોરખ શિખર" },
            { "id": "C", "textGu": "સાપુતારા" },
            { "id": "D", "textGu": "ચોટીલા" }
          ],
          "correctOptionId": "B",
          "explanationGu": "મૈત્રીએ જણાવ્યું તેમ ગિરનાર પર્વત જૂનાગઢમાં આવેલો છે [૨૮૦]."
        }
      ],
      "flashcards": [
        { "frontGu": "સ્ટેચ્યૂ ઓફ યુનિટી", "backGu": "નર્મદા જિલ્લામાં આવેલી વિશ્વની સૌથી ઊંચી પ્રતિમા [૨૮૧]" },
        { "frontGu": "રીંછ અભયારણ્ય", "backGu": "બનાસકાંઠાના જેસોર અને બાલારામમાં આવેલું છે [૨૮૨]" },
        { "frontGu": "ઐતિહાસિક સ્થળો", "backGu": "મોઢેરાનું સૂર્યમંદિર અને વડનગરનું કીર્તિતોરણ [૨૮૦]" },
        { "frontGu": "જિલ્લા પંચાયત", "backGu": "જિલ્લાના વહીવટ અને વિકાસ માટેની સંસ્થા [૨૮૬]" },
        { "frontGu": "સાક્ષરતા દર (Literacy Rate)", "backGu": "ભણેલા લોકોની ટકાવારી (અમદાવાદમાં ૮૬.૬૫%) [૨૭૯]" }
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
            "name": "Standard 4 Environmental Studies Paryavaran Aaspaas",
            "nameGu": "પર્યાવરણ - આસપાસ (ધોરણ ૪)",
            "name_en": "Standard 4 Environmental Studies Paryavaran Aaspaas",
            "name_gu": "પર્યાવરણ - આસપાસ (ધોરણ ૪)",
            "title": "પર્યાવરણ - આસપાસ (ધોરણ ૪)",
            "titleGu": "પર્યાવરણ - આસપાસ (ધોરણ ૪)",
            "title_gu": "પર્યાવરણ - આસપાસ (ધોરણ ૪)",
            "icon": "🌿",
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
            "title_gu": "પર્યાવરણ - આસપાસ (ધોરણ ૪) પાઠ્યપુસ્તક",
            "titleGu": "પર્યાવરણ - આસપાસ (ધોરણ ૪) પાઠ્યપુસ્તક",
            "title_en": "Standard 4 Environmental Studies Paryavaran Aaspaas Textbook",
            "titleEn": "Standard 4 Environmental Studies Paryavaran Aaspaas Textbook",
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
        quiz_id = f"quiz_std4_env_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std4_env_{ch_id}_{q_idx+1}"

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
        fc_id = f"fc_std4_env_{ch_id}_{fc_idx+1}"

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

# 3. Generate AI Knowledge Base Documents for all 25 chapters
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
    fc_summary = "\n".join([f"પર્યાવરણીય સંકલ્પના: {f[0]} -> {f[1]}" for f in fcs])

    content = f"વિષય: પર્યાવરણ - આસપાસ (ધોરણ ૪)\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nપર્યાવરણીય સંકલ્પનાઓ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std4_env_{ch_id}",
        "standard_id": "4",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "પર્યાવરણ", "આસપાસ", "ધોરણ ૪"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std4_env_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 4 Environmental Studies payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
