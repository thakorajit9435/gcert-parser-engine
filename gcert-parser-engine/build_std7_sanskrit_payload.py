#!/usr/bin/env python3
"""
Builds complete std7_sanskrit_payload.json for GCERT Standard 7 Sanskrit Sem 1 (સંસ્કૃત ધોરણ 7 પ્રથમ સત્ર).
Incorporate user-provided chapters, mapping, quizzes, and flashcards.
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-7_Sanskrut_Sem-1-Med-Gujarati.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-7_Sanskrut_Sem-1-Med-Gujarati.pdf"
storage_path = "textbooks/Std-7_Sanskrut_Sem-1-Med-Gujarati.pdf"
subject_id = "sub_sanskrut_std7_sem1"
subject_id_alt1 = "sub_sanskrut_std7"
subject_id_alt2 = "sub_sanskrit_std7"
subject_id_alt3 = "sub_sans_std7"

standard_id = "std_7"
standard_number = 7
session = "1"

chapters_data = [
    {
        "id": "sub_sans_std7_ch0",
        "chapterNumber": 0,
        "titleGu": "વન્દના",
        "title_en": "Vandana",
        "descriptionGu": "વિદ્યાની દેવી સરસ્વતી, સંસ્કૃત ભાષા અને ગુરુદેવની સ્તુતિ કરતા પવિત્ર શ્લોકો.",
        "start_page": 7,
        "end_page": 7,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch1",
        "chapterNumber": 1,
        "titleGu": "ચિત્રપદાનિ ૧-૩",
        "title_en": "Chitrapadani 1-3",
        "descriptionGu": "આસપાસની વિવિધ વસ્તુઓ, ઘરવખરીના સાધનો અને ફળોની ચિત્રો દ્વારા સંસ્કૃતમાં ઓળખ.",
        "start_page": 8,
        "end_page": 10,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch2",
        "chapterNumber": 2,
        "titleGu": "મેઘો વર્ષતિ",
        "title_en": "Megho Varshati",
        "descriptionGu": "વર્ષાઋતુનું વર્ણન કરતું ગીત, જેમાં વાદળ વરસતા ખેડૂતની પ્રસન્નતા અને કૃષિ કાર્યની સમજ છે.",
        "start_page": 11,
        "end_page": 12,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch3",
        "chapterNumber": 3,
        "titleGu": "કોઽરુક્",
        "title_en": "Ko-aruk",
        "descriptionGu": "શારીરિક સ્વાસ્થ્ય અને યોગ્ય આહાર-વિહારનું મહત્વ સમજાવતી પક્ષી અને વાગ્ભટ્ટ ઋષિની બોધકથા.",
        "start_page": 13,
        "end_page": 15,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch4",
        "chapterNumber": 4,
        "titleGu": "હાસ્યયોગઃ",
        "title_en": "Hasyayogah",
        "descriptionGu": "જીવનમાં હાસ્ય અને વિનોદ જગાડતા વિવિધ રમુજી પ્રસંગો અને ટુચકાઓ દ્વારા ભાષા જ્ઞાન.",
        "start_page": 16,
        "end_page": 18,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch5",
        "chapterNumber": 5,
        "titleGu": "ચટક ! ચટક !",
        "title_en": "Chatak! Chatak!",
        "descriptionGu": "ચકલી સાથેના આત્મીય સંવાદ દ્વારા પક્ષી પ્રત્યેની સંવેદના વ્યક્ત કરતું મધુર ગીત.",
        "start_page": 19,
        "end_page": 21,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_p1",
        "chapterNumber": 5.1,
        "titleGu": "પુનરાવર્તનમ્ ૧",
        "title_en": "Punravartanam 1",
        "descriptionGu": "અગાઉના એકમોના અભ્યાસનું દ્રઢીકરણ અને સ્વાધ્યાય પ્રવૃત્તિઓ.",
        "start_page": 22,
        "end_page": 23,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch6",
        "chapterNumber": 6,
        "titleGu": "સંખ્યા",
        "title_en": "Sankhya",
        "descriptionGu": "ક્રિકેટના સ્કોરબોર્ડના માધ્યમથી ૧ થી ૫૦ સુધીની સંખ્યાઓનું સંસ્કૃતમાં પઠન અને લેખન.",
        "start_page": 24,
        "end_page": 27,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch7",
        "chapterNumber": 7,
        "titleGu": "વિશ્વાસઃ નૈવ કર્તવ્યઃ",
        "title_en": "Vishwasah Naiva Kartavyah",
        "descriptionGu": "અજાણ્યા પાત્ર પર ક્યારેય વિશ્વાસ ન કરવો જોઈએ તે શીખવતી બકરી અને શિયાળની વાર્તા.",
        "start_page": 28,
        "end_page": 31,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch8",
        "chapterNumber": 8,
        "titleGu": "સમયઃ",
        "title_en": "Samayah",
        "descriptionGu": "ઘડિયાળના ચિત્રો દ્વારા સંસ્કૃતમાં સમય જોવાની અને બોલવાની પદ્ધતિની સમજ.",
        "start_page": 32,
        "end_page": 34,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_ch9",
        "chapterNumber": 9,
        "titleGu": "આમ્લં દ્રાક્ષાફલમ્",
        "title_en": "Aamlam Drakshafalam",
        "descriptionGu": "દ્રાક્ષ મેળવવામાં અસફળ રહેતા અને અંતે 'દ્રાક્ષ ખાટી છે' તેમ કહીને ચાલ્યા જતા શિયાળની વાર્તા.",
        "start_page": 35,
        "end_page": 37,
        "pdfPageOffset": 6
    },
    {
        "id": "sub_sans_std7_p2",
        "chapterNumber": 9.1,
        "titleGu": "પુનરાવર્તનમ્ ૨",
        "title_en": "Punravartanam 2",
        "descriptionGu": "સમગ્ર પ્રથમ સત્રના અભ્યાસક્રમનું સર્વગ્રાહી પુનરાવર્તન અને મૂલ્યાંકન.",
        "start_page": 38,
        "end_page": 41,
        "pdfPageOffset": 6
    }
]

quizzes_raw = [
    {
      "chapterId": "sub_sans_std7_ch1",
      "questions": [
        { "questionTextGu": "'આસન્દઃ' (आसन्दः) શબ્દનો અર્થ શું થાય છે?", "options": [{ "id": "A", "textGu": "ખુરશી" }, { "id": "B", "textGu": "થેલો" }, { "id": "C", "textGu": "પલંગ" }, { "id": "D", "textGu": "પહાડ" }], "correctOptionId": "A", "explanationGu": "ચિત્રપદાનિ-૧ મુજબ 'આસન્દઃ' એટલે બેસવા માટેની ખુરશી." },
        { "questionTextGu": "'યોજિની' (योजिनी) નો સાચો અર્થ શોધો.", "options": [{ "id": "A", "textGu": "સ્કેલ" }, { "id": "B", "textGu": "માળા" }, { "id": "C", "textGu": "સ્ટેપલર" }, { "id": "D", "textGu": "હોડી" }], "correctOptionId": "C", "explanationGu": "ચિત્રપદાનિ-૨ માં આપેલ સાધન 'યોજિની' એટલે સ્ટેપલર." },
        { "questionTextGu": "'સંગણકમ્' (सङ्गणकम्) એટલે શું?", "options": [{ "id": "A", "textGu": "ગણતરી" }, { "id": "B", "textGu": "મોબાઈલ" }, { "id": "C", "textGu": "ટીવી" }, { "id": "D", "textGu": "કોમ્પ્યુટર" }], "correctOptionId": "D", "explanationGu": "આજના યુગનું સાધન 'સંગણકમ્' એટલે કોમ્પ્યુટર." },
        { "questionTextGu": "'સ્યૂતઃ' (स्यूतः) શબ્દ કોના માટે વપરાયો છે?", "options": [{ "id": "A", "textGu": "થેલો" }, { "id": "B", "textGu": "પત્ર" }, { "id": "C", "textGu": "ઈસ્ત્રી" }, { "id": "D", "textGu": "ચપ્પલ" }], "correctOptionId": "A", "explanationGu": "ચિત્રપદાનિ-૧ માં દર્શાવ્યા મુજબ 'સ્યૂતઃ' એટલે દફતર અથવા થેલો." },
        { "questionTextGu": "'વાતાયનમ્' (वातायनम्) એટલે શું?", "options": [{ "id": "A", "textGu": "બારણું" }, { "id": "B", "textGu": "બારી" }, { "id": "C", "textGu": "પંખો" }, { "id": "D", "textGu": "ઘર" }], "correctOptionId": "B", "explanationGu": "ગૃહવપરાશના ચિત્રપદાનિ-૩ મુજબ 'વાતાયનમ્' એટલે બારી." }
      ]
    },
    {
      "chapterId": "sub_sans_std7_ch2",
      "questions": [
        { "questionTextGu": "વાદળ વર્ષે છે ત્યારે શું વહે છે?", "options": [{ "id": "A", "textGu": "દૂધ" }, { "id": "B", "textGu": "પાણી (નીરમ્)" }, { "id": "C", "textGu": "રસ" }, { "id": "D", "textGu": "ઘી" }], "correctOptionId": "B", "explanationGu": "કાવ્યની પ્રથમ પંક્તિ મુજબ 'મેઘો વર્ષતિ પ્રવહતિ નીરમ્' એટલે કે વાદળ વરસે છે ત્યારે પાણી વહે છે." },
        { "questionTextGu": "કોણ સંતુષ્ટ થઈને વાડામાં જાય છે?", "options": [{ "id": "A", "textGu": "પશુ" }, { "id": "B", "textGu": "ખેડૂત (કૃષકઃ)" }, { "id": "C", "textGu": "બાળક" }, { "id": "D", "textGu": "શિકારી" }], "correctOptionId": "B", "explanationGu": "મેઘ વરસતા ખેડૂત પ્રસન્ન થાય છે અને પશુઓના વાડા (ગોષ્ઠમ્) માં જાય છે." },
        { "questionTextGu": "ખેડૂત ખેતરમાં શું વાવે છે?", "options": [{ "id": "A", "textGu": "પાણી" }, { "id": "B", "textGu": "ઘાસ" }, { "id": "C", "textGu": "બીજ" }, { "id": "D", "textGu": "વૃક્ષ" }], "correctOptionId": "C", "explanationGu": "ખેડૂત ખેતરમાં હળ ચલાવે છે અને બીજ વાવે છે (વપતિ ચ બીજમ્)." },
        { "questionTextGu": "'સસ્યમ્' (सस्यम्) શબ્દનો અર્થ શોધો.", "options": [{ "id": "A", "textGu": "સસલું" }, { "id": "B", "textGu": "ધાન્ય/અનાજ" }, { "id": "C", "textGu": "આકાશ" }, { "id": "D", "textGu": "વરસાદ" }], "correctOptionId": "B", "explanationGu": "કાવ્યમાં 'રોહતિ સસ્યમ્' એટલે કે અનાજ/ધાન્ય ઊગે છે તેવો અર્થ થાય છે." },
        { "questionTextGu": "'મેઘો વર્ષતિ' કાવ્યના રચયિતા કોણ છે?", "options": [{ "id": "A", "textGu": "મહાબલેશ્વર ભટ્ટ" }, { "id": "B", "textGu": "કાલિદાસ" }, { "id": "C", "textGu": "વેદવ્યાસ" }, { "id": "D", "textGu": "ભાસ" }], "correctOptionId": "A", "explanationGu": "આ સુંદર વર્ષાગીત મહાબલેશ્વર ભટ્ટ દ્વારા રચવામાં આવ્યું છે." }
      ]
    },
    {
      "chapterId": "sub_sans_std7_ch3",
      "questions": [
        { "questionTextGu": "પક્ષી આકાશમાં ઉડતી વખતે શું બોલે છે?", "options": [{ "id": "A", "textGu": "નમસ્તે" }, { "id": "B", "textGu": "કોઽરુક્" }, { "id": "C", "textGu": "ચિવં-ચિવં" }, { "id": "D", "textGu": "કુહુ-કુહુ" }], "correctOptionId": "B", "explanationGu": "પક્ષી દ્વારે દ્વારે ફરીને એક જ પ્રશ્ન પૂછે છે 'કોઽરુક્' (કોણ નિરોગી છે?)." },
        { "questionTextGu": "ઝાડની નીચે કોણ બેઠું હતું?", "options": [{ "id": "A", "textGu": "ખેડૂત" }, { "id": "B", "textGu": "શિકારી" }, { "id": "C", "textGu": "વૈદ્યર્ષિ વાગ્ભટ્ટ" }, { "id": "D", "textGu": "સિંહ" }], "correctOptionId": "C", "explanationGu": "જ્યારે પક્ષી ઝાડ પર બેસે છે ત્યારે તેની નીચે વૈદ્યર્ષિ વાગ્ભટ્ટ બેઠા હોય છે જે પક્ષીનો પ્રશ્ન સાંભળે છે." },
        { "questionTextGu": "નિરોગી રહેવા માટે કેવું ભોજન કરવું જોઈએ?", "options": [{ "id": "A", "textGu": "ખૂબ જ વધારે" }, { "id": "B", "textGu": "તીખું" }, { "id": "C", "textGu": "મિતભુક્ (માપસર)" }, { "id": "D", "textGu": "ઠંડુ" }], "correctOptionId": "C", "explanationGu": "ઋષિ કહે છે કે જે હિતકારી, માપસર (મિતભુક્) અને ઋતુ અનુસાર ભોજન કરે તે નિરોગી રહે છે." },
        { "questionTextGu": "પક્ષી સંતુષ્ટ થઈને કોની પાસે જાય છે?", "options": [{ "id": "A", "textGu": "મિત્ર પાસે" }, { "id": "B", "textGu": "ઋષિ પાસે" }, { "id": "C", "textGu": "માતા પાસે" }, { "id": "D", "textGu": "નદી પાસે" }], "correctOptionId": "B", "explanationGu": "ઋષિ પાસેથી સાચો ઉત્તર મળતા સંતુષ્ટ પક્ષી ઋષિ પાસે આવી તેમને નમે છે." },
        { "questionTextGu": "'અટતિ' (अटति) શબ્દનો અર્થ શું થાય?", "options": [{ "id": "A", "textGu": "રડે છે" }, { "id": "B", "textGu": "ખાય છે" }, { "id": "C", "textGu": "ભટકે છે / ફરે છે" }, { "id": "D", "textGu": "ઊંઘે છે" }], "correctOptionId": "C", "explanationGu": "વાર્તામાં 'પક્ષી દ્વારં દ્વારમ્ અટતિ' એટલે કે પક્ષી દ્વારે દ્વારે ફરે છે/ભટકે છે." }
      ]
    },
    {
      "chapterId": "sub_sans_std7_ch4",
      "questions": [
        { "questionTextGu": "વેપારી ગ્રાહકને યંત્ર વિશે શું કહે છે?", "options": [{ "id": "A", "textGu": "ખૂબ મોંઘું છે" }, { "id": "B", "textGu": "૫૦ ટકા કાર્યભાર ઓછો કરશે" }, { "id": "C", "textGu": "બગડી ગયું છે" }, { "id": "D", "textGu": "ફ્રી છે" }], "correctOptionId": "B", "explanationGu": "વેપારી યંત્રની વિશેષતા જણાવતા કહે છે કે તે ગ્રાહકનો ૫૦ ટકા કાર્યભાર ઓછો કરી દેશે." },
        { "questionTextGu": "ગ્રાહક વેપારી પાસે કેટલા યંત્રો માંગે છે?", "options": [{ "id": "A", "textGu": "એક" }, { "id": "B", "textGu": "બે" }, { "id": "C", "textGu": "ત્રણ" }, { "id": "D", "textGu": "પાંચ" }], "correctOptionId": "B", "explanationGu": "૫૦ ટકા કામ ઓછું થાય તે જાણીને ગ્રાહક રમુજી રીતે ૧૦૦ ટકા કામ ઓછું કરવા બે યંત્રો માંગે છે." },
        { "questionTextGu": "શિક્ષક બાળકના હોમવર્ક વિશે શું કહે છે?", "options": [{ "id": "A", "textGu": "ખૂબ સરસ છે" }, { "id": "B", "textGu": "ઘણી ભૂલો છે" }, { "id": "C", "textGu": "કર્યું નથી" }, { "id": "D", "textGu": "ખોવાઈ ગયું છે" }], "correctOptionId": "B", "explanationGu": "શિક્ષક બાળકના ગૃહકાર્યમાં ઘણી ભૂલો હોવાનું જણાવે છે." },
        { "questionTextGu": "બે ચોર ક્યાં લૂંટ કરે છે?", "options": [{ "id": "A", "textGu": "દુકાનમાં" }, { "id": "B", "textGu": "બેંક (વિત્તકોષે)" }, { "id": "C", "textGu": "ઘરમાં" }, { "id": "D", "textGu": "રસ્તા પર" }], "correctOptionId": "B", "explanationGu": "રમુજી પ્રસંગ મુજબ બે ચોર બેંક (વિત્તકોષ) માં લૂંટ કરે છે." },
        { "questionTextGu": "શંભુનાથની પત્ની કેમ મોડેથી જમે છે?", "options": [{ "id": "A", "textGu": "કામ હોય છે" }, { "id": "B", "textGu": "વ્રત હોય છે" }, { "id": "C", "textGu": "બંને વચ્ચે દાંતનું એક જ ચોકઠું છે" }, { "id": "D", "textGu": "ભૂખ નથી હોતી" }], "correctOptionId": "C", "explanationGu": "શંભુનાથ જણાવે છે કે તેમની વચ્ચે કૃત્રિમ દાંતનું એક જ ચોકઠું હોવાથી તે વારાફરતી જમે છે." }
      ]
    },
    {
      "chapterId": "sub_sans_std7_ch5",
      "questions": [
        { "questionTextGu": "ચકલી ક્યાં રહે છે?", "options": [{ "id": "A", "textGu": "પાંજરામાં" }, { "id": "B", "textGu": "માળામાં (નીડે)" }, { "id": "C", "textGu": "ઘરમાં" }, { "id": "D", "textGu": "નદીમાં" }], "correctOptionId": "B", "explanationGu": "ગીતની પંક્તિ 'નીડે નિવસસિ સુખેન ડયસે' મુજબ ચકલી માળામાં રહે છે." },
        { "questionTextGu": "બાળક ચકલીને શું પીવા કહે છે?", "options": [{ "id": "A", "textGu": "દૂધ" }, { "id": "B", "textGu": "રસ" }, { "id": "C", "textGu": "પાણી (નીરમ્)" }, { "id": "D", "textGu": "ચા" }], "correctOptionId": "C", "explanationGu": "બાળક ચકલીને કહે છે કે ચણ સ્વીકાર અને પાણી (નીરમ્) પી." },
        { "questionTextGu": "ચકલી કેવા આકાશમાં વિહાર કરે છે?", "options": [{ "id": "A", "textGu": "સ્વચ્છ અને વિશાળ" }, { "id": "B", "textGu": "કાળા" }, { "id": "C", "textGu": "વાદળવાળા" }, { "id": "D", "textGu": "નાના" }], "correctOptionId": "A", "explanationGu": "ચકલી વિમલ (સ્વચ્છ) અને વિપુલ (વિશાળ) ગગનમાં વિહાર કરે છે." },
        { "questionTextGu": "ઘરે કોણ નથી જેથી બાળક એકલો છે?", "options": [{ "id": "A", "textGu": "ભાઈ-બહેન" }, { "id": "B", "textGu": "મિત્રો" }, { "id": "C", "textGu": "માતા-પિતા" }, { "id": "D", "textGu": "શિક્ષક" }], "correctOptionId": "C", "explanationGu": "ગીતમાં ઉલ્લેખ છે 'માતાપિતરાવિહ મમ ન સ્તઃ' એટલે કે માતા-પિતા અહીં નથી." },
        { "questionTextGu": "બાળક ચકલી પાસે શું શીખવા માંગે છે?", "options": [{ "id": "A", "textGu": "ઉડવાનું" }, { "id": "B", "textGu": "ખાવાનું" }, { "id": "C", "textGu": "ભાષા" }, { "id": "D", "textGu": "રમવાનું" }], "correctOptionId": "C", "explanationGu": "બાળક ચકલીને વિનંતી કરે છે 'પાઠય મામપિ તવ ભાષામ્' - મને પણ તારી ભાષા શીખવ." }
      ]
    },
    {
      "chapterId": "sub_sans_std7_ch6",
      "questions": [
        { "questionTextGu": "રાકેશે પ્રથમ રમતમાં કેટલા રન (ધાવનાઙ્કાઃ) કર્યા?", "options": [{ "id": "A", "textGu": "૧૦" }, { "id": "B", "textGu": "૫૦" }, { "id": "C", "textGu": "૩૬" }, { "id": "D", "textGu": "૨૦" }], "correctOptionId": "B", "explanationGu": "સ્કોરબોર્ડ મુજબ રાકેશે પ્રથમ રમતમાં ૫૦ (પશ્ચાશત્) રન કર્યા છે." },
        { "questionTextGu": "નીરવના ત્રીજી રમતના રન કેટલા છે?", "options": [{ "id": "A", "textGu": "૩૩" }, { "id": "B", "textGu": "૨૧" }, { "id": "C", "textGu": "૪૦ (ચત્વારિંશત્)" }, { "id": "D", "textGu": "૪૨" }], "correctOptionId": "C", "explanationGu": "નીલેશ અને રમેશના સંવાદ મુજબ નીરવે ત્રીજી રમતમાં ૪૦ રન કર્યા છે." },
        { "questionTextGu": "'૩૮' સંખ્યાને સંસ્કૃત શબ્દોમાં કેવી રીતે લખાય?", "options": [{ "id": "A", "textGu": "અષ્ટાવિંશતિઃ" }, { "id": "B", "textGu": "અષ્ટત્રિંશત્" }, { "id": "C", "textGu": "અષ્ટચત્વારિંશત્" }, { "id": "D", "textGu": "અષ્ટાદશ" }], "correctOptionId": "B", "explanationGu": "સંખ્યા કોષ્ટક મુજબ ૩૮ એટલે 'અષ્ટત્રિંશત્'." },
        { "questionTextGu": "'એકચત્વારિંશત્' એટલે કઈ સંખ્યા?", "options": [{ "id": "A", "textGu": "૧૪" }, { "id": "B", "textGu": "૨૧" }, { "id": "C", "textGu": "૩૧" }, { "id": "D", "textGu": "૪૧" }], "correctOptionId": "D", "explanationGu": "૪૧ સંખ્યાને સંસ્કૃતમાં 'એકચત્વારિંશત્' કહેવામાં આવે છે." },
        { "questionTextGu": "ભાવિકના ચોથી રમતના રન કેટલા છે?", "options": [{ "id": "A", "textGu": "૪૧" }, { "id": "B", "textGu": "૩૪" }, { "id": "C", "textGu": "૨૮" }, { "id": "D", "textGu": "૫૦" }], "correctOptionId": "D", "explanationGu": "સંવાદ મુજબ ભાવિકે ચોથી રમતમાં પંચાશત્ (૫૦) રન કર્યા છે." }
      ]
    },
    {
      "chapterId": "sub_sans_std7_ch7",
      "questions": [
        { "questionTextGu": "બકરીનું બચ્ચું કેમ રડે છે?", "options": [{ "id": "A", "textGu": "ભૂખ લાગી છે" }, { "id": "B", "textGu": "માર્ગ ભૂલી ગયું છે" }, { "id": "C", "textGu": "પડી ગયું છે" }, { "id": "D", "textGu": "બીક લાગે છે" }], "correctOptionId": "B", "explanationGu": "બકરીનું બચ્ચું માતાની પાછળ જતા માર્ગ ભૂલી જાય છે (માર્ગં વિસ્મરતિ), તેથી રડે છે." },
        { "questionTextGu": "કોણ બચ્ચાનું કુમળું માંસ ખાવા ઈચ્છે છે?", "options": [{ "id": "A", "textGu": "સિંહ" }, { "id": "B", "textGu": "વાઘ" }, { "id": "C", "textGu": "શિયાળ (શૃગાલઃ)" }, { "id": "D", "textGu": "કૂતરો" }], "correctOptionId": "C", "explanationGu": "લુચ્ચું શિયાળ રડતા બચ્ચાને જોઈ તેનું કુમળું માંસ ખાવાની ઈચ્છા કરે છે." },
        { "questionTextGu": "શિયાળ બચ્ચાને લલચાવવા કોની ઓળખાણ આપે છે?", "options": [{ "id": "A", "textGu": "પોતાની" }, { "id": "B", "textGu": "માતાની" }, { "id": "C", "textGu": "મિત્રની" }, { "id": "D", "textGu": "વનરાજાની" }], "correctOptionId": "B", "explanationGu": "શિયાળ કહે છે કે 'હું તારી માતાને ઓળખું છું, ચાલ હું તને તેની પાસે લઈ જાઉં'." },
        { "questionTextGu": "બચ્ચાના મોઢેથી વાત સાંભળી બકરી શું કરે છે?", "options": [{ "id": "A", "textGu": "રડે છે" }, { "id": "B", "textGu": "શિયાળ પર પ્રહાર કરે છે" }, { "id": "C", "textGu": "ભાગી જાય છે" }, { "id": "D", "textGu": "રમે છે" }], "correctOptionId": "B", "explanationGu": "બકરી ગુસ્સે થઈને લુચ્ચા શિયાળ પર પ્રહાર કરે છે (શૃગાલં પ્રહરતિ)." },
        { "questionTextGu": "આ વાર્તા પરથી શો બોધ મળે છે?", "options": [{ "id": "A", "textGu": "ઝડપથી દોડવું" }, { "id": "B", "textGu": "અજાણ્યા પર વિશ્વાસ ન કરવો" }, { "id": "C", "textGu": "મિત્રો બનાવવા" }, { "id": "D", "textGu": "જંગલમાં ફરવું" }], "correctOptionId": "B", "explanationGu": "વાર્તાનો મુખ્ય બોધ છે કે અજાણ્યા વ્યક્તિ પર ક્યારેય વિશ્વાસ ન કરવો જોઈએ." }
      ]
    },
    {
      "chapterId": "sub_sans_std7_ch8",
      "questions": [
        { "questionTextGu": "'સાર્ધ-ષડ્વાદનમ્' એટલે કેટલા વાગ્યા?", "options": [{ "id": "A", "textGu": "૬:૦૦" }, { "id": "B", "textGu": "૬:૧૫" }, { "id": "C", "textGu": "૬:૩૦" }, { "id": "D", "textGu": "૫:૪૫" }], "correctOptionId": "C", "explanationGu": "'સાર્ધ' એટલે અડધો કલાક ઉમેરવો, તેથી ૬:૩૦ થાય." },
        { "questionTextGu": "'સપાદ-ચતુર્વાદનમ્' નો સાચો સમય જણાવો.", "options": [{ "id": "A", "textGu": "૪:૦૦" }, { "id": "B", "textGu": "૪:૧૫" }, { "id": "C", "textGu": "૪:૩૦" }, { "id": "D", "textGu": "૩:૪૫" }], "correctOptionId": "B", "explanationGu": "'સપાદ' એટલે ૧૫ મિનિટ વધારે, તેથી ૪:૧૫ થાય." },
        { "questionTextGu": "'પાદોન-દશવાદનમ્' એટલે કેટલો સમય?", "options": [{ "id": "A", "textGu": "૧૦:૧૫" }, { "id": "B", "textGu": "૧૦:૩૦" }, { "id": "C", "textGu": "૯:૪૫" }, { "id": "D", "textGu": "૯:૧૫" }], "correctOptionId": "C", "explanationGu": "'પાદોન' એટલે પોણો કલાક અથવા ૧૫ મિનિટ ઓછી, તેથી ૯:૪૫ થાય." },
        { "questionTextGu": "૮:૪૫ ને સંસ્કૃતમાં શું કહેવાય?", "options": [{ "id": "A", "textGu": "પાદોન-અષ્ટવાદનમ્" }, { "id": "B", "textGu": "સપાદ-અષ્ટવાદનમ્" }, { "id": "C", "textGu": "પાદોન-નવવાદનમ્" }, { "id": "D", "textGu": "સાર્ધ-અષ્ટવાદનમ્" }], "correctOptionId": "C", "explanationGu": "૮:૪૫ એટલે ૯ માં ૧૫ મિનિટ ઓછી, જેને 'પાદોન-નવવાદનમ્' કહેવાય." },
        { "questionTextGu": "'સપાદ-અષ્ટવાદનમ્' એટલે કેટલા વાગ્યા?", "options": [{ "id": "A", "textGu": "૮:૧૫" }, { "id": "B", "textGu": "૭:૪૫" }, { "id": "C", "textGu": "૮:૩૦" }, { "id": "D", "textGu": "૮:૦૦" }], "correctOptionId": "A", "explanationGu": "૮ વાગ્યા અને ૧૫ મિનિટને 'સપાદ-અષ્ટવાદનમ્' કહે છે." }
      ]
    },
    {
      "chapterId": "sub_sans_std7_ch9",
      "questions": [
        { "questionTextGu": "શિયાળ વનમાં કેમ જાય છે?", "options": [{ "id": "A", "textGu": "રમેવા માટે" }, { "id": "B", "textGu": "ભૂખ અને તરસને કારણે" }, { "id": "C", "textGu": "મિત્રને મળવા" }, { "id": "D", "textGu": "ઊંઘવા માટે" }], "correctOptionId": "B", "explanationGu": "શિયાળને તરસ (પિપાસા) અને ભૂખ (બુભુક્ષા) લાગી હોવાથી તે વનમાં ભટકે છે." },
        { "questionTextGu": "શિયાળ વેલ પર શું જુએ છે?", "options": [{ "id": "A", "textGu": "કેરી" }, { "id": "B", "textGu": "સફરજન" }, { "id": "C", "textGu": "દ્રાક્ષ (દ્રાક્ષાફલમ્)" }, { "id": "D", "textGu": "ફૂલ" }], "correctOptionId": "C", "explanationGu": "શિયાળ વેલ (લતાસુ) પર દ્રાક્ષના ફળ લટકેલા જુએ છે." },
        { "questionTextGu": "દ્રાક્ષ જોઈને શિયાળના મુખમાં શું આવે છે?", "options": [{ "id": "A", "textGu": "પાણી (રસઃ)" }, { "id": "B", "textGu": "લોહી" }, { "id": "C", "textGu": "ઝેર" }, { "id": "D", "textGu": "ચોકલેટ" }], "correctOptionId": "A", "explanationGu": "દ્રાક્ષને જોઈને તરત જ શિયાળના મુખમાં પાણી (રસઃ જાયતે) આવે છે." },
        { "questionTextGu": "દ્રાક્ષ મેળવવા શિયાળ શું કરે છે?", "options": [{ "id": "A", "textGu": "ઝાડ પર ચઢે છે" }, { "id": "B", "textGu": "કૂદકા મારે છે (ઉત્પતતિ)" }, { "id": "C", "textGu": "થઈને બેસી રહે છે" }, { "id": "D", "textGu": "રડે છે" }], "correctOptionId": "B", "explanationGu": "શિયાળ દ્રાક્ષ સુધી પહોંચવા વારંવાર કૂદકા (પુનઃ પુનઃ ઉત્પતતિ) મારે છે." },
        { "questionTextGu": "નિષ્ફળ ગયેલું શિયાળ શું કહીને નાસી જાય છે?", "options": [{ "id": "A", "textGu": "દ્રાક્ષ મીઠી છે" }, { "id": "B", "textGu": "દ્રાક્ષ કડવી છે" }, { "id": "C", "textGu": "દ્રાક્ષ ખાટી છે (આમ્લમ્)" }, { "id": "D", "textGu": "મારે નથી ખાવી" }], "correctOptionId": "C", "explanationGu": "દ્રાક્ષ ન મળતા શિયાળ પોતાની હાર છુપાવવા કહે છે 'આમ્લં દ્રાક્ષાફલમ્' - દ્રાક્ષ ખાટી છે." }
      ]
    }
]

flashcards_raw = [
    { "chapterId": "sub_sans_std7_ch1", "frontGu": "આસન્દઃ (आसन्दः)", "backGu": "ખુરશી" },
    { "chapterId": "sub_sans_std7_ch1", "frontGu": "સ્યૂતઃ (स्यूतः)", "backGu": "થેલો / દફતર" },
    { "chapterId": "sub_sans_std7_ch1", "frontGu": "સમીકરઃ (समीकरः)", "backGu": "ઈસ્ત્રી" },
    { "chapterId": "sub_sans_std7_ch1", "frontGu": "યોજિની (योजिनी)", "backGu": "સ્ટેપલર" },
    { "chapterId": "sub_sans_std7_ch1", "frontGu": "વાતાયનમ્ (वातायनम्)", "backGu": "બારી" },
    { "chapterId": "sub_sans_std7_ch2", "frontGu": "મેઘઃ (मेघः)", "backGu": "વાદળ" },
    { "chapterId": "sub_sans_std7_ch2", "frontGu": "કૃષકઃ (कृषकः)", "backGu": "ખેડૂત" },
    { "chapterId": "sub_sans_std7_ch2", "frontGu": "ગોષ્ઠમ્ (गोष्ठम्)", "backGu": "પશુઓનો વાડો" },
    { "chapterId": "sub_sans_std7_ch2", "frontGu": "વૃષભઃ (वृषभः)", "backGu": "બળદ" },
    { "chapterId": "sub_sans_std7_ch2", "frontGu": "સસ્યમ્ (सस्यम्)", "backGu": "અનાજ / ધાન્ય" },
    { "chapterId": "sub_sans_std7_ch3", "frontGu": "કોઽરુક્ (कोऽरुक्)", "backGu": "કોણ નિરોગી છે?" },
    { "chapterId": "sub_sans_std7_ch3", "frontGu": "વૈદ્યર્ષિઃ (वैद्यर्षिः)", "backGu": "વૈદ્ય ઋષિ" },
    { "chapterId": "sub_sans_std7_ch3", "frontGu": "મિતભુક્ (मितभुक्)", "backGu": "માપસર ખાનાર" },
    { "chapterId": "sub_sans_std7_ch3", "frontGu": "ઋતભુક્ (ऋतभुक्)", "backGu": "ઋતુ મુજબ ખાનાર" },
    { "chapterId": "sub_sans_std7_ch3", "frontGu": "અટતિ (अटति)", "backGu": "ભટકે છે / ફરે છે" },
    { "chapterId": "sub_sans_std7_ch4", "frontGu": "આપણિકઃ (आपणिकः)", "backGu": "વેપારી / દુકાનદાર" },
    { "chapterId": "sub_sans_std7_ch4", "frontGu": "વિત્તકોષઃ (वित्तकोषः)", "backGu": "બેંક" },
    { "chapterId": "sub_sans_std7_ch4", "frontGu": "લુણ્ઠનમ્ (लुण्ठनम्)", "backGu": "લૂંટ" },
    { "chapterId": "sub_sans_std7_ch4", "frontGu": "કૃત્રિમદન્તાવલિઃ", "backGu": "દાંતનું ચોકઠું" },
    { "chapterId": "sub_sans_std7_ch4", "frontGu": "શ્વાનભયમ્ (श्वानभयम्)", "backGu": "કૂતરાનો ડર" },
    { "chapterId": "sub_sans_std7_ch5", "frontGu": "ચટક (चटक)", "backGu": "ચકલી" },
    { "chapterId": "sub_sans_std7_ch5", "frontGu": "નીડે (नीडे)", "backGu": "માળામાં" },
    { "chapterId": "sub_sans_std7_ch5", "frontGu": "ગગને (गगने)", "backGu": "આકાશમાં" },
    { "chapterId": "sub_sans_std7_ch5", "frontGu": "ચણકમ્ (चणकम्)", "backGu": "ચણ" },
    { "chapterId": "sub_sans_std7_ch5", "frontGu": "વિહગ (विहग)", "backGu": "હે પક્ષી" },
    { "chapterId": "sub_sans_std7_ch6", "frontGu": "એકચત્વારિંશત્ (४૧)", "backGu": "ચાલીસ ને એક (41)" },
    { "chapterId": "sub_sans_std7_ch6", "frontGu": "ષટ્ત્રિંશત્ (૩૬)", "backGu": "ત્રીસ ને છ (36)" },
    { "chapterId": "sub_sans_std7_ch6", "frontGu": "પશ્ચાશત્ (૫૦)", "backGu": "પચાસ (50)" },
    { "chapterId": "sub_sans_std7_ch6", "frontGu": "ચતુર્ર્દશ (૧૪)", "backGu": "ચૌદ (14)" },
    { "chapterId": "sub_sans_std7_ch6", "frontGu": "ત્રયોદશ (૧૩)", "backGu": "તેર (13)" },
    { "chapterId": "sub_sans_std7_ch7", "frontGu": "અજા (अजा)", "backGu": "બકરી" },
    { "chapterId": "sub_sans_std7_ch7", "frontGu": "વશ્વકઃ (वञ्चकः)", "backGu": "છેતરનારો / લુચ્ચો" },
    { "chapterId": "sub_sans_std7_ch7", "frontGu": "પીપ્પલવૃક્ષઃ", "backGu": "પીપળાનું ઝાડ" },
    { "chapterId": "sub_sans_std7_ch7", "frontGu": "ક્રુધ્યતિ (क्रुध्यति)", "backGu": "ગુસ્સે થાય છે" },
    { "chapterId": "sub_sans_std7_ch7", "frontGu": "પલાયતે (पलायते)", "backGu": "નાસી જાય છે" },
    { "chapterId": "sub_sans_std7_ch8", "frontGu": "સાર્ધ (सार्ध)", "backGu": "અડધો કલાક (30 મિનિટ)" },
    { "chapterId": "sub_sans_std7_ch8", "frontGu": "સપાદ (सपाद)", "backGu": "પંદર મિનિટ (સવા)" },
    { "chapterId": "sub_sans_std7_ch8", "frontGu": "પાદોન (पादोन)", "backGu": "પંદર મિનિટ ઓછી (પોણો)" },
    { "chapterId": "sub_sans_std7_ch8", "frontGu": "વાદનમ્ (वादनम्)", "backGu": "વાગ્યા" },
    { "chapterId": "sub_sans_std7_ch8", "frontGu": "ઘટી (घटी)", "backGu": "ઘડિયાળ" },
    { "chapterId": "sub_sans_std7_ch9", "frontGu": "બુભુક્ષા (बुभुक्षा)", "backGu": "ભૂખ" },
    { "chapterId": "sub_sans_std7_ch9", "frontGu": "પિપાસા (पिपासा)", "backGu": "તરસ" },
    { "chapterId": "sub_sans_std7_ch9", "frontGu": "દ્રાક્ષાફલમ્", "backGu": "દ્રાક્ષ" },
    { "chapterId": "sub_sans_std7_ch9", "frontGu": "આમ્લમ્ (आम्लम्)", "backGu": "ખાટી" },
    { "chapterId": "sub_sans_std7_ch9", "frontGu": "ઉત્પતતિ (उत्पतति)", "backGu": "કૂદે છે" }
]

payload = {
    "subjects": [
        {
            "id": subject_id,
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standardId": "7",
            "standard_id": "7",
            "standard_number": standard_number,
            "standardNumber": standard_number,
            "standard": "7",
            "session": session,
            "name": "Standard 7 Sanskrit",
            "nameGu": "સંસ્કૃત ધોરણ 7 (પ્રથમ સત્ર)",
            "name_en": "Standard 7 Sanskrit (First Semester)",
            "name_gu": "સંસ્કૃત ધોરણ 7 (પ્રથમ સત્ર)",
            "title": "સંસ્કૃત ધોરણ 7 (પ્રથમ સત્ર)",
            "titleGu": "સંસ્કૃત ધોરણ 7 (પ્રથમ સત્ર)",
            "title_gu": "સંસ્કૃત ધોરણ 7 (પ્રથમ સત્ર)",
            "icon": "📜",
            "order": 5,
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
            "title_gu": "સંસ્કૃત ધોરણ 7 પાઠ્યપુસ્તક (પ્રથમ સત્ર)",
            "titleGu": "સંસ્કૃત ધોરણ 7 પાઠ્યપુસ્તક (પ્રથમ સત્ર)",
            "title_en": "Standard 7 Sanskrit Textbook (Sem 1)",
            "titleEn": "Standard 7 Sanskrit Textbook (Sem 1)",
            "subject_id": subject_id,
            "subjectId": subject_id,
            "standard_id": "7",
            "standardId": "7",
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
            "standardId": "7",
            "standard_id": "7",
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
        "standardId": "7",
        "standard_id": "7",
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
        "standard_id": "7",
        "standardId": "7",
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

# 2. Process Quizzes and Questions
quiz_map = {}
for qz in quizzes_raw:
    ch_id = qz["chapterId"]
    q_list = qz["questions"]
    ch_info = next((c for c in chapters_data if c["id"] == ch_id), None)
    c_num = ch_info["chapterNumber"] if ch_info else 1
    title_gu = ch_info["titleGu"] if ch_info else ""
    title_en = ch_info["title_en"] if ch_info else ""
    tp_id = f"{ch_id}_tp1"

    quiz_id = f"quiz_std7_sans_{ch_id}"
    question_docs = []
    question_ids = []

    for q_idx, q_item in enumerate(q_list):
        qz_q_id = f"qz_q_std7_sans_{ch_id}_{q_idx+1}"

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
            "standardId": "7",
            "standard_id": "7",
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
        "standardId": "7",
        "standard_id": "7",
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
    fc_id = f"fc_std7_sans_{ch_id}_{idx+1}"

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
        "standard_id": "7",
        "standardId": "7",
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

# 4. Generate AI Knowledge Base Documents for Qdrant Vector DB Indexing
for ch_info in chapters_data:
    ch_id = ch_info["id"]
    c_num = ch_info["chapterNumber"]
    title_gu = ch_info["titleGu"]
    title_en = ch_info["title_en"]
    desc_gu = ch_info["descriptionGu"]
    tp_id = f"{ch_id}_tp1"

    # Build rich content including quiz and flashcard details for indexing
    q_docs = quiz_map.get(ch_id, [])
    q_summary = "\n".join([f"પ્રશ્ન: {q['questionTextGu']} | જવાબ: {q['correctOptionId']} | સમજૂતી: {q['explanationGu']}" for q in q_docs])

    fcs = fc_by_chapter.get(ch_id, [])
    fc_summary = "\n".join([f"શબ્દાર્થ: {f[0]} -> {f[1]}" for f in fcs])

    content = f"વિષય: સંસ્કૃત ધોરણ 7 (પ્રથમ સત્ર)\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std7_sans_{ch_id}",
        "standard_id": "7",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "સંસ્કૃત", "ધોરણ 7"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std7_sanskrit_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Sanskrit Std 7 payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
