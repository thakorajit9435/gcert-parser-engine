#!/usr/bin/env python3
"""
Builds complete std4_hindi_sl_sem2_payload.json for GCERT Standard 4 Hindi Second Language Sem 2 (ટમટમ - હિન્દી દ્વિતીય ભાષા ધોરણ ૪).
Ingests into Cloud Firestore and Qdrant Vector Database.
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-4%20Hindi%20Second%20Language.pdf?alt=media"
gs_url = "gs://quizapp-1627022258976.appspot.com/textbooks/Std-4 Hindi Second Language.pdf"
storage_path = "textbooks/Std-4 Hindi Second Language.pdf"

subject_id = "sub_hindi_std4_sl_sem2"
standard_id = "std_4"
standard_number = 4
session = "2"

chapters_mapping = [
    { "id": "sub_hindi_std4_ch1", "rawId": "ch1", "chapterNumber": 1, "titleGu": "નવી રાહ", "title_en": "Nayi Raah", "descriptionGu": "અભ્યાસ અને ચિત્ર ઓળખ દ્વારા હિન્દી વર્ણો અને મૂળાક્ષરોની ઓળખ.", "start_page": 7, "end_page": 9, "pdfPageOffset": 6, "pageIndex": 6 },
    { "id": "sub_hindi_std4_ch2", "rawId": "ch2", "chapterNumber": 2, "titleGu": "બઢતે કદમ", "title_en": "Badhte Kadam", "descriptionGu": "સર્વનામો (यह, वह, ये, वे, आप, मैं, हम) નો વાક્યપ્રયોગ અને વચન બદલોની સમજ.", "start_page": 10, "end_page": 17, "pdfPageOffset": 6, "pageIndex": 9 },
    { "id": "sub_hindi_std4_ch3", "rawId": "ch3", "chapterNumber": 3, "titleGu": "ગિનતી (૧ થી ૨૦)", "title_en": "Ginti (1 to 20)", "descriptionGu": "૧ થી ૨૦ સુધીની હિન્દી અંકો અને શબ્દોમાં ગણતરી.", "start_page": 18, "end_page": 22, "pdfPageOffset": 6, "pageIndex": 17 },
    { "id": "sub_hindi_std4_ch4", "rawId": "ch4", "chapterNumber": 4, "titleGu": "અપને બારે મેં...", "title_en": "Apne Bare Mein...", "descriptionGu": "પોતાનો પરિચય અને કૌટુંબિક સંબંધો (બુઆ, મૌસી, મામા, નાના) ની ઓળખ.", "start_page": 23, "end_page": 25, "pdfPageOffset": 6, "pageIndex": 22 },
    { "id": "sub_hindi_std4_ch5", "rawId": "ch5", "chapterNumber": 5, "titleGu": "ધમ્મક-ધમ્મક આતા હાથી", "title_en": "Dhammak-Dhammak Aata Hathi", "descriptionGu": "હાથીના ચાલવા, નહાવા અને કેળા ખાવાની મજેદાર હિન્દી બાળકવિતા.", "start_page": 30, "end_page": 33, "pdfPageOffset": 6, "pageIndex": 29 },
    { "id": "sub_hindi_std4_ch6", "rawId": "ch6", "chapterNumber": 6, "titleGu": "ટપકા કા ડર", "title_en": "Tapka Ka Dar", "descriptionGu": "બુઢિયાની ઝૂંપડી અને વરસાદમાં ટપકાંથી ડરીને ભાગી જતા વાઘની રમુજી વાર્તા.", "start_page": 34, "end_page": 39, "pdfPageOffset": 6, "pageIndex": 33 },
    { "id": "sub_hindi_std4_ch7", "rawId": "ch7", "chapterNumber": 7, "titleGu": "ઝૂલા", "title_en": "Zhula", "descriptionGu": "હિંચકે ઝૂલતા બાળક અને તેની આકાશ અડવાની કલ્પનાનું ગીત.", "start_page": 40, "end_page": 44, "pdfPageOffset": 6, "pageIndex": 39 },
    { "id": "sub_hindi_std4_ch8", "rawId": "ch8", "chapterNumber": 8, "titleGu": "ચતુર ચૂહા", "title_en": "Chatur Chuha", "descriptionGu": "દરજી અને કશીદાકાર પાસે પોતાની ટોપી સિવડાવીને ખુશ થતા ચતુર ઉંદરની વાર્તા.", "start_page": 45, "end_page": 48, "pdfPageOffset": 6, "pageIndex": 44 }
]

quizzes_raw = [
    {
      "chapterId": "ch1",
      "questions": [
        { "questionTextGu": "હિન્દી શબ્દ 'તોતા' (तोता) નો ગુજરાતી અર્થ શું થાય?", "options": ["કાગડો", "પોપટ", "મોર", "ચકલી"], "correctOptionId": "B", "explanationGu": "પાઠ ૧ ના અભ્યાસ ૧ મુજબ 'તોતા' એટલે પોપટ થાય છે [૧૨]." },
        { "questionTextGu": "ચિત્ર ઓળખો: 'ઠઠેરા' (ठठेरा) એટલે શું?", "options": ["કુંભાર", "મોચી", "કંસારો", "દરજી"], "correctOptionId": "C", "explanationGu": "હિન્દીમાં વાસણ બનાવનાર કે ટીપનારને 'ઠઠેરા' કહેવામાં આવે છે [૧૨]." },
        { "questionTextGu": "હિન્દી વર્ણ 'જ' (ज) ને ગુજરાતીમાં કેવી રીતે લખાય?", "options": ["જ્ઞ", "ઝ", "જ", "ગ"], "correctOptionId": "C", "explanationGu": "ગુજરાતી અને હિન્દી વર્ણોની સમજૂતીમાં 'જ' એ ગુજરાતી 'જ' સમાન છે [૧૩]." },
        { "questionTextGu": "'ઈમલી' (इमली) શબ્દનો અર્થ શું છે?", "options": ["કેરી", "આંબલી", "દ્રાક્ષ", "પપૈયું"], "correctOptionId": "B", "explanationGu": "અભ્યાસ ૪ મુજબ 'ઈમલી' નો ગુજરાતી અર્થ આંબલી થાય છે [૧૩]." },
        { "questionTextGu": "'ઓખલી' (ओखली) ને ગુજરાતીમાં શું કહેવાય?", "options": ["ગળણી", "ખાંડણી/ખલ", "ચમચી", "વાટકો"], "correctOptionId": "B", "explanationGu": "ચિત્ર ઓળખ મુજબ 'ઓખલી' એટલે ખાંડણી અથવા ખલ થાય છે [૧૩]." }
      ]
    },
    {
      "chapterId": "ch2",
      "questions": [
        { "questionTextGu": "નજીકની એક વસ્તુ દર્શાવવા માટે કયા શબ્દનો ઉપયોગ થાય છે?", "options": ["वह", "ये", "वे", "यह"], "correctOptionId": "D", "explanationGu": "પાઠ ૨ ના અભ્યાસ ૨ મુજબ નજીકની વસ્તુ માટે 'यह' (આ) વપરાય છે [૧૪]." },
        { "questionTextGu": "દૂરની એકથી વધુ વસ્તુઓ (બહુવચન) માટે શું વપરાય?", "options": ["ये", "वे", "वह", "इस"], "correctOptionId": "B", "explanationGu": "અભ્યાસ ૪ મુજબ દૂરની ઘણી વસ્તુઓ માટે 'वे' (તેઓ/પેલા) વપરાય છે [૧૫]." },
        { "questionTextGu": "શિક્ષક માટે કયું માનવાચક સર્વનામ વપરાય છે?", "options": ["तुम", "तू", "आप", "हम"], "correctOptionId": "C", "explanationGu": "હિન્દીમાં વડીલો કે વ્યવસાયકારો માટે 'आप' શબ્દ વપરાય છે [૧૬]." },
        { "questionTextGu": "'મછલીયાં પાની ___ હૈં' (मछलियाँ पानी ___ हैं) - ખાલી જગ્યા પૂરો.", "options": ["પર", "કે ઉપર", "મેં", "કે નીચે"], "correctOptionId": "C", "explanationGu": "માછલીઓ પાણીની અંદર હોવાથી 'મેં' (માં) શબ્દ વપરાય છે [૧૭]." },
        { "questionTextGu": "'વહ કિતાબ હૈ' નું બહુવચન શું થાય?", "options": ["ये किताबें हैं", "वे किताबें हैं", "वह किताबें हैं", "वे किताब है"], "correctOptionId": "B", "explanationGu": "બહુવચન નિયમ મુજબ 'વહ' નું 'વે' અને 'કિતાબ' નું 'કિતાબૈં' થાય છે [૧૫]." }
      ]
    },
    {
      "chapterId": "ch3",
      "questions": [
        { "questionTextGu": "હિન્દી અંક '૧૧' ને શબ્દોમાં શું કહેવાય?", "options": ["દસ", "ગ્યારહ", "બારહ", "તેરહ"], "correctOptionId": "B", "explanationGu": "હિન્દી ગિનતી મુજબ ૧૧ ને 'ગ્યારહ' (ग्यारह) કહેવાય છે [૨૦]." },
        { "questionTextGu": "સંખ્યા '૧૯' (19) ને હિન્દીમાં શું કહે છે?", "options": ["સત્રહ", "અઠારહ", "ઉન્નીસ", "બીસ"], "correctOptionId": "C", "explanationGu": "ગિનતી કોષ્ટક મુજબ ૧૯ ને 'ઉન્નીસ' (उन्नीस) કહેવામાં આવે છે [૨૦]." },
        { "questionTextGu": "હિન્દી શબ્દ 'છહ' (छः) ને અંકમાં કેવી રીતે લખાય?", "options": ["૫", "૬", "૭", "૮"], "correctOptionId": "B", "explanationGu": "અભ્યાસ ૪ મુજબ 'છહ' એટલે અંક ૬ થાય છે [૨૦]." },
        { "questionTextGu": "ગિનાતી મુજબ 'તેરહ' પછી કઈ સંખ્યા આવે?", "options": ["ગ્યારહ", "બારહ", "ચૌદહ", "પંદ્રહ"], "correctOptionId": "C", "explanationGu": "૧૩ (તેરહ) પછી ૧૪ આવે છે, જેને હિન્દીમાં 'ચૌદહ' કહેવાય છે [૨૦]." },
        { "questionTextGu": "સંખ્યા '૮' ને હિન્દી શબ્દોમાં શું કહેવાય?", "options": ["સાત", "છહ", "આઠ", "નૌ"], "correctOptionId": "C", "explanationGu": "અંક ૮ ને હિન્દીમાં 'આઠ' લખાય છે [૨૦]." }
      ]
    },
    {
      "chapterId": "ch4",
      "questions": [
        { "questionTextGu": "પિતાની બહેનને હિન્દીમાં શું કહેવાય?", "options": ["મૌસી", "બુઆ", "ચાચી", "મામી"], "correctOptionId": "B", "explanationGu": "યોગ્યતા-વિસ્તાર મુજબ પિતાની બહેન એટલે 'બુઆ' [૨૬]." },
        { "questionTextGu": "માતાના ભાઈ માટે હિન્દીમાં કયો શબ્દ છે?", "options": ["ચાચા", "તાઉ", "મામા", "ફૂફા"], "correctOptionId": "C", "explanationGu": "માતાનો ભાઈ એટલે 'મામા' કહેવાય છે [૨૬]." },
        { "questionTextGu": "તમે કઈ કક્ષા (ધોરણ) માં ભણો છો?", "options": ["તીસરી", "ચૌથી", "પાંચવી", "દૂસરી"], "correctOptionId": "B", "explanationGu": "આ પુસ્તક ધોરણ ૪ (ચૌથી કક્ષા) નું છે [૨૪]." },
        { "questionTextGu": "માતાના પિતાને હિન્દીમાં શું કહેવાય?", "options": ["દાદા", "નાના", "મામા", "ચાચા"], "correctOptionId": "B", "explanationGu": "સંબંધોની સમજ મુજબ માતાના પિતા એટલે 'નાના' [૨૬]." },
        { "questionTextGu": "શિક્ષક માટે હિન્દીમાં બીજો કયો શબ્દ વપરાય છે?", "options": ["ખિલાડી", "અધ્યાપક", "ડોક્ટર", "સહેલી"], "correctOptionId": "B", "explanationGu": "શબ્દાર્થ મુજબ શિક્ષક એટલે 'અધ્યાપક' થાય છે [૨૪]." }
      ]
    },
    {
      "chapterId": "ch5",
      "questions": [
        { "questionTextGu": "હાથી કઈ રીતે આવે છે?", "options": ["ધીરે-ધીરે", "ધમ્મક-ધમ્મક", "દોડીને", "કૂદીને"], "correctOptionId": "B", "explanationGu": "કવિતાની પ્રથમ પંક્તિ મુજબ 'ધમ્મક-ધમ્મક આતા હાથી' [૨૮]." },
        { "questionTextGu": "હાથી નહાવા માટે સૂંઢમાં શું ભરે છે?", "options": ["રેતી", "પાણી", "ફૂલો", "ઘાસ"], "correctOptionId": "B", "explanationGu": "કવિતા મુજબ 'ભર-ભર સૂંઢ નહાતા હાથી' જેમાં પાણીનો સંદર્ભ છે [૨૯]." },
        { "questionTextGu": "હાથી કયું ફળ ખાય છે પણ કોઈને જણાવતો નથી?", "options": ["કેરી", "કેળા", "સફરજન", "જાંબુ"], "correctOptionId": "B", "explanationGu": "કવિતામાં ઉલ્લેખ છે કે 'કિતને કેલે ખાતા હાથી, યહ તો નહીં બતાતા હાથી' [૨૯]." },
        { "questionTextGu": "'આના' (आना) શબ્દનો વિરોધી શબ્દ શું થાય?", "options": ["ખાના", "ગાના", "જાના", "રોના"], "correctOptionId": "C", "explanationGu": "અભ્યાસ ૩ મુજબ 'આના' નો વિરોધી શબ્દ 'જાના' (જવું) થાય છે [૨૯]." },
        { "questionTextGu": "હાથી તેના કયા અંગને હલાવે અને ઘુમાવે છે?", "options": ["પગ", "પૂંછડી", "સૂંઢ", "કાન"], "correctOptionId": "C", "explanationGu": "કવિતામાં હાથી તેની સૂંઢ (સૂંઢ) ઉઠાવવા, ગિરાવવા અને હલાવવાની વાત છે [૨૮]." }
      ]
    },
    {
      "chapterId": "ch6",
      "questions": [
        { "questionTextGu": "બુઢિયાની ઝૂંપડીમાં શું ટપકી રહ્યું હતું?", "options": ["દૂધ", "તેલ", "પાણી", "રસ"], "correctOptionId": "C", "explanationGu": "વરસાદને કારણે બુઢિયાના છાપરામાંથી પાણી ટપકી રહ્યું હતું [૩૧]." },
        { "questionTextGu": "વાઘ કોનાથી ડરીને ભાગી ગયો?", "options": ["બુઢિયાથી", "શિકારીથી", "સિંહથી", "ટપકાથી"], "correctOptionId": "D", "explanationGu": "વાઘને લાગ્યું કે 'ટપકા' કોઈ મોટું જાનવર છે જે બુઢિયાને તેનાથી પણ વધુ ડરાવે છે [૩૨]." },
        { "questionTextGu": "બુઢિયા ચૂલા પર શું રાંધી રહી હતી?", "options": ["ખીચડી", "ચોખા (ચાવલ)", "શાક", "રોટલી"], "correctOptionId": "B", "explanationGu": "વાર્તા મુજબ બુઢિયા અંદર ચાવલ પકાવી રહી હતી [૩૧]." },
        { "questionTextGu": "'સિર પર પેર રખકર ભાગના' મુહાવરાનો અર્થ શું છે?", "options": ["ધીરે ચાલવું", "ખૂબ તેજ ગતિએ ભાગવું", "પલટી મારવી", "ઉભા રહેવું"], "correctOptionId": "B", "explanationGu": "મુહાવરા મુજબ તેનો અર્થ તેજ ગતિથી ભાગવું થાય છે [૩૨]." },
        { "questionTextGu": "વરસાદમાં બુઢિયાના ઘરની સાથે જંગલમાં બીજું શું પડી રહ્યું હતું?", "options": ["બરફ", "ઓલા (કરા)", "પાંદડા", "પથ્થર"], "correctOptionId": "B", "explanationGu": "વાર્તામાં ઉલ્લેખ છે કે 'થોડી દેર મેં ઓલે ભી પડને લગે' [૩૧]." }
      ]
    },
    {
      "chapterId": "ch7",
      "questions": [
        { "questionTextGu": "બાળક તેની અમ્માને શું લગાવવાનું કહે છે?", "options": ["પંખો", "ઝૂલા (હિંચકો)", "નિસરણી", "બગીચો"], "correctOptionId": "B", "explanationGu": "કવિતાની શરૂઆતમાં જ બાળક 'અમ્મા આજ લગા દે ઝૂલા' કહે છે [૩૫]." },
        { "questionTextGu": "હિંચકે ઝૂલીને બાળક કયા બે શહેરોમાં જવાની કલ્પના કરે છે?", "options": ["મુંબઈ-પુણે", "દિલ્હી-કલકત્તા", "અમદાવાદ-સુરત", "કાશી-મથુરા"], "correctOptionId": "B", "explanationGu": "કવિતામાં પંક્તિ છે: 'ચલ દિલ્હી, લે ચલ કલકત્તા' [૩૬]." },
        { "questionTextGu": "બાળક આસમાનને ક્યારે અડવાની વાત કરે છે?", "options": ["દોડીને", "ઝૂલા પર ચઢીને", "સીડી લગાવીને", "વિમાનમાં બેસીને"], "correctOptionId": "B", "explanationGu": "બાળક કહે છે કે ઝૂલા પર ચઢીને તે આસમાનને અડી લેશે [૩૫]." },
        { "questionTextGu": "નીચેની ધરતી શું કરી રહી છે?", "options": ["દોડી રહી છે", "ઝૂલી રહી છે", "રડી રહી છે", "સુઈ રહી છે"], "correctOptionId": "B", "explanationGu": "કવિતા મુજબ 'ઝૂલ રહી નીચે કી ધરતી' [૩૬]." },
        { "questionTextGu": "વાદળોનું ટોળું લૂંટવા માટે બાળક શું ઈચ્છે છે?", "options": ["કૂદવા", "ઉડવા", "દોડવા", "તરવા"], "correctOptionId": "B", "explanationGu": "પંક્તિ છે: 'ઉડકર મૈં લૂંટૂ દલ-બાદલ' [૩૬]." }
      ]
    },
    {
      "chapterId": "ch8",
      "questions": [
        { "questionTextGu": "ઉંદરને રસ્તામાં શું મળ્યું?", "options": ["ખાવાનું", "કપડાનો ટુકડો", "ટોપી", "સોનું"], "correctOptionId": "B", "explanationGu": "વાર્તાની શરૂઆતમાં ઉંદરને કપડાનો એક ટુકડો મળે છે [૩૯]." },
        { "questionTextGu": "ઉંદર ટોપી સિવડાવવા કોની પાસે ગયો?", "options": ["મોચી", "દરજી", "કુંભાર", "સુથાર"], "correctOptionId": "B", "explanationGu": "કપડાની ટોપી બનાવવા ઉંદર 'દરજી' પાસે જાય છે [૩૯]." },
        { "questionTextGu": "કશીદાકાર ઉંદરની વાત સાંભળીને કેમ ડરી ગયો?", "options": ["ઉંદર કરડશે એટલે", "ઉંદર કચેરીમાં જશે એટલે", "બિલાડી આવશે એટલે", "ઉંદર ચીસો પાડશે એટલે"], "correctOptionId": "B", "explanationGu": "ઉંદર 'કચહરી મેં જાઉંગા...' વાળી ધમકી આપે છે તેથી તે ડરી જાય છે [૪૧]." },
        { "questionTextGu": "ઉંદર ટોપી પર શું કરાવવા ઈચ્છતો હતો?", "options": ["રંગ", "કશીદા (ભરતકામ)", "બટન", "ખિસ્સું"], "correctOptionId": "B", "explanationGu": "ઉંદરને ટોપી પર કશીદા કઢાવવાની ઈચ્છા હતી [૪૦]." },
        { "questionTextGu": "વાર્તાના અંતે ઉંદર કેવો હતો?", "options": ["ઉદાસ", "ગુસ્સે", "ખુશ", "દુઃખી"], "correctOptionId": "C", "explanationGu": "ટોપી પર કશીદા કઢાવ્યા પછી ઉંદર ખુશ થઈ ગયો [૪૧]." }
      ]
    }
]

flashcards_raw = [
    { "chapterId": "ch1", "frontGu": "પતંગ (पतंग)", "backGu": "પતંગ" },
    { "chapterId": "ch1", "frontGu": "તોતા (तोता)", "backGu": "પોપટ" },
    { "chapterId": "ch1", "frontGu": "ઠઠેરા (ठठेरा)", "backGu": "કંસારો (વાસણ બનાવનાર)" },
    { "chapterId": "ch1", "frontGu": "સપેરા (सपेरा)", "backGu": "મદારી" },
    { "chapterId": "ch1", "frontGu": "ઋષિ (ऋषि)", "backGu": "ઋષિ" },
    { "chapterId": "ch2", "frontGu": "यह (Yah)", "backGu": "આ (નજીકની વસ્તુ માટે)" },
    { "chapterId": "ch2", "frontGu": "वह (Vah)", "backGu": "તે/પેલો (દૂરની વસ્તુ માટે)" },
    { "chapterId": "ch2", "frontGu": "મેં (मैं)", "backGu": "હું" },
    { "chapterId": "ch2", "frontGu": "હમ (हम)", "backGu": "અમે" },
    { "chapterId": "ch2", "frontGu": "આપ (आप)", "backGu": "તમે (માનવાચક)" },
    { "chapterId": "ch3", "frontGu": "ગ્યારહ (१૧)", "backGu": "અગિયાર" },
    { "chapterId": "ch3", "frontGu": "બારહ (૧૨)", "backGu": "બાર" },
    { "chapterId": "ch3", "frontGu": "ઉન્નીસ (૧૯)", "backGu": "ઓગણીસ" },
    { "chapterId": "ch3", "frontGu": "બીસ (૨૦)", "backGu": "વીસ" },
    { "chapterId": "ch3", "frontGu": "સત્રહ (૧૭)", "backGu": "સત્તર" },
    { "chapterId": "ch4", "frontGu": "બુઆ (बुआ)", "backGu": "ફઈ (પિતાની બહેન)" },
    { "chapterId": "ch4", "frontGu": "મૌસી (मौसी)", "backGu": "માસી (માતાની બહેન)" },
    { "chapterId": "ch4", "frontGu": "પરિવાર (परिवार)", "backGu": "કુટુંબ" },
    { "chapterId": "ch4", "frontGu": "અધ્યાપક (अध्यापक)", "backGu": "શિક્ષક" },
    { "chapterId": "ch4", "frontGu": "સહેલી (सहेली)", "backGu": "બહેનપણી/સખી" },
    { "chapterId": "ch5", "frontGu": "સૂંઢ (सूँड)", "backGu": "હાથીની સૂંઢ" },
    { "chapterId": "ch5", "frontGu": "ધમ્મક (धम्मक)", "backGu": "જોશ કે ભારે અવાજ સાથે" },
    { "chapterId": "ch5", "frontGu": "કેલે (केले)", "backGu": "કેળા" },
    { "chapterId": "ch5", "frontGu": "ઉઠાના x ગિરાના", "backGu": "ઉપાડવું x પાડી દેવું (વિરોધી)" },
    { "chapterId": "ch5", "frontGu": "આના x જાના", "backGu": "આવવું x જવું (વિરોધી)" },
    { "chapterId": "ch6", "frontGu": "પરેશાન (पेशासन)", "backGu": "હેરાન/ચિંતિત" },
    { "chapterId": "ch6", "frontGu": "છપ્પર (छप्पर)", "backGu": "ઘાસ-ફૂસનું છાપરું" },
    { "chapterId": "ch6", "frontGu": "ઓલે (ओले)", "backGu": "કરા (બરફના કાંકરા)" },
    { "chapterId": "ch6", "frontGu": "ઝુઝલા ઉઠના", "backGu": "ક્રોધિત થવું/ખીજાવું" },
    { "chapterId": "ch6", "frontGu": "સિર પર પેર રખકર ભાગના", "backGu": "ખૂબ ઝડપથી ભાગી જવું" },
    { "chapterId": "ch7", "frontGu": "ઝૂલા (झूला)", "backGu": "હિંચકો/પારણું" },
    { "chapterId": "ch7", "frontGu": "અમ્મા (अम्बा)", "backGu": "બા/માતા" },
    { "chapterId": "ch7", "frontGu": "આસમાન (आसमान)", "backGu": "આકાશ" },
    { "chapterId": "ch7", "frontGu": "ધરતી (धरती)", "backGu": "જમીન/પૃથ્વી" },
    { "chapterId": "ch7", "frontGu": "હંસના x રોના", "backGu": "હસવું x રડવું (વિરોધી)" },
    { "chapterId": "ch8", "frontGu": "દરજી (दरजी)", "backGu": "કપડાં સીવનાર" },
    { "chapterId": "ch8", "frontGu": "કશીદા (कशीदा)", "backGu": "ભરતકામ" },
    { "chapterId": "ch8", "frontGu": "કચહરી (कचहरी)", "backGu": "અદાલત/કોર્ટ" },
    { "chapterId": "ch8", "frontGu": "સિપાહી (सिपाही)", "backGu": "સૈનિક/પોલીસ" },
    { "chapterId": "ch8", "frontGu": "ઝટપટ (झटपट)", "backGu": "તરત જ/જલ્દીથી" }
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
            "name": "Standard 4 Hindi Second Language Sem 2",
            "nameGu": "ટમટમ - હિન્દી (દ્વિતીય ભાષા) ધોરણ ૪",
            "name_en": "Standard 4 Hindi (Second Language) Sem 2",
            "name_gu": "ટમટમ - હિન્દી (દ્વિતીય ભાષા) ધોરણ ૪",
            "title": "ટમટમ - હિન્દી (દ્વિતીય ભાષા) ધોરણ ૪",
            "titleGu": "ટમટમ - હિન્દી (દ્વિતીય ભાષા) ધોરણ ૪",
            "title_gu": "ટમટમ - હિન્દી (દ્વિતીય ભાષા) ધોરણ ૪",
            "icon": "📙",
            "order": 4,
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
            "title_gu": "ટમટમ - હિન્દી (દ્વિતીય ભાષા) ધોરણ ૪ પાઠ્યપુસ્તક (દ્વિતીય સત્ર)",
            "titleGu": "ટમટમ - હિન્દી (દ્વિતીય ભાષા) ધોરણ ૪ પાઠ્યપુસ્તક (દ્વિતીય સત્ર)",
            "title_en": "Standard 4 Hindi Second Language Sem 2 Textbook",
            "titleEn": "Standard 4 Hindi Second Language Sem 2 Textbook",
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
            "title": "દ્વિતીય સત્ર",
            "type": "textbook",
            "order": 2,
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

raw_to_ch_id = {item["rawId"]: item["id"] for item in chapters_mapping}

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

# 2. Process Quizzes & Questions
quiz_map = {}
for qz in quizzes_raw:
    raw_ch_id = qz["chapterId"]
    ch_id = raw_to_ch_id.get(raw_ch_id, raw_ch_id)
    q_list = qz["questions"]
    ch_info = next((c for c in chapters_mapping if c["id"] == ch_id), None)
    c_num = ch_info["chapterNumber"] if ch_info else 1
    title_gu = ch_info["titleGu"] if ch_info else ""
    title_en = ch_info["title_en"] if ch_info else ""
    tp_id = f"{ch_id}_tp1"

    if q_list:
        quiz_id = f"quiz_std4_hindi_{ch_id}"
        question_docs = []
        question_ids = []

        for q_idx, q_item in enumerate(q_list):
            qz_q_id = f"qz_q_std4_hindi_{ch_id}_{q_idx+1}"

            opts = q_item["options"]
            opts_list = []
            option_map = {}
            option_letters = ["A", "B", "C", "D"]
            for opt_idx, opt_text in enumerate(opts):
                opt_id = option_letters[opt_idx]
                opts_list.append({
                    "id": opt_id, "optionId": opt_id, "option_id": opt_id,
                    "key": opt_id, "value": opt_id, "label": opt_id, "code": opt_id,
                    "text": opt_text, "textGu": opt_text, "text_gu": opt_text,
                    "textEn": opt_text, "text_en": opt_text, "content": opt_text, "title": opt_text
                })
                option_map[opt_id] = opt_text

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
for idx, fc in enumerate(flashcards_raw):
    raw_ch_id = fc["chapterId"]
    ch_id = raw_to_ch_id.get(raw_ch_id, raw_ch_id)
    front_gu = fc["frontGu"]
    back_gu = fc["backGu"]
    tp_id = f"{ch_id}_tp1"
    fc_id = f"fc_std4_hindi_{ch_id}_{idx+1}"

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

# 4. Generate AI Knowledge Base Documents for all 8 chapters
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

    content = f"વિષય: ટમટમ - હિન્દી (દ્વિતીય ભાષા) ધોરણ ૪\nપ્રકરણ {c_num}: {title_gu} ({title_en})\nવર્ણન: {desc_gu}\n"
    if q_summary:
        content += f"\nમુખ્ય પ્રશ્નોત્તરી:\n{q_summary}\n"
    if fc_summary:
        content += f"\nશબ્દાર્થ / ફ્લેશકાર્ડ્સ:\n{fc_summary}\n"

    payload["ai_knowledge_base"].append({
        "kb_id": f"kb_std4_hindi_{ch_id}",
        "standard_id": "4",
        "standard_number": standard_number,
        "session": session,
        "subject_id": subject_id,
        "chapter_id": ch_id,
        "topic_id": tp_id,
        "topic_number": 1,
        "title_gu": title_gu,
        "content_gu": content,
        "keywords": [title_gu, title_en, "ટમટમ", "હિન્દી", "ધોરણ ૪"],
        "learning_outcomes": [desc_gu],
        "revision_notes": [desc_gu],
        "difficulty_level": "medium",
        "page_numbers": [ch_info["start_page"]],
        "is_active": True,
        "isDeleted": False
    })

output_file = PROJECT_ROOT / "outputs" / "std4_hindi_sl_sem2_payload.json"
os.makedirs(output_file.parent, exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"✅ Generated Standard 4 Hindi SL Sem 2 payload: {output_file}")
print(f"   Subjects:          {len(payload['subjects'])}")
print(f"   Textbooks:         {len(payload['textbooks'])}")
print(f"   Chapters:          {len(payload['chapters'])}")
print(f"   Quizzes:           {len(payload['quizzes'])}")
print(f"   Questions:         {len(payload['questions'])}")
print(f"   Flashcards:        {len(payload['flashcards'])}")
print(f"   AI KB Docs:        {len(payload['ai_knowledge_base'])}")
