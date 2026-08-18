import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("--- SEEDING FLASHCARDS FOR STANDARD 1 GUJARATI ---")

flashcards_data = [
    # Ch 1
    {"id": "fc_std1_ch1_1", "chapter_id": "sci_std_01_ch1", "front": "વાંદરાભાઈનું નામ શું હતું?", "back": "ખટખટ", "type": "સામાન્ય જ્ઞાન"},
    {"id": "fc_std1_ch1_2", "chapter_id": "sci_std_01_ch1", "front": "વાંદરાભાઈને શું ખાવું બહુ ગમે?", "back": "કેળાં અને ફળો", "type": "ખોરાક"},
    {"id": "fc_std1_ch1_3", "chapter_id": "sci_std_01_ch1", "front": "વાંદરાભાઈ ઠંડી ભગાડવા શું કરતા હતા?", "back": "એક ઝાડથી બીજા ઝાડ પર હૂપાહૂપ કરતા હતા", "type": "વાર્તા"},
    
    # Ch 2
    {"id": "fc_std1_ch2_1", "chapter_id": "sci_std_01_ch2", "front": "વાદળ આકાશમાં શું કરે છે?", "back": "વાદળ આકાશમાં ગરજે છે અને પાણી વરસાવે છે", "type": "કુદરત"},
    {"id": "fc_std1_ch2_2", "chapter_id": "sci_std_01_ch2", "front": "વીજળી ચમકે ત્યારે કેવો અવાજ આવે?", "back": "કડડાભૂમ અને ગડગડાટ અવાજ આવે", "type": "અવાજ"},
    
    # Ch 3
    {"id": "fc_std1_ch3_1", "chapter_id": "sci_std_01_ch3", "front": "બિલ્લી માસી ક્યાં ગયા હતા?", "back": "બિલ્લી માસી દિલ્હી ગયા હતા", "type": "વાર્તા"},
    {"id": "fc_std1_ch3_2", "chapter_id": "sci_std_01_ch3", "front": "બિલ્લી માસીની ગાડી કોણ ખેંચતું હતું?", "back": "બિલ્લી માસીની ગાડી દેડકાભાઈ ખેંચતા હતા", "type": "સવારી"},
    
    # Ch 4
    {"id": "fc_std1_ch4_1", "chapter_id": "sci_std_01_ch4", "front": "મેળામાં શું શું જોવા મળે છે?", "back": "ચકડોળ, રમકડાંની દુકાન અને મીઠાઈની દુકાન", "type": "મેળો"},
    {"id": "fc_std1_ch4_2", "chapter_id": "sci_std_01_ch4", "front": "મેળામાં ચકડોળ કેવું ફરે છે?", "back": "મોટું અને ગોળ ગોળ ફરે છે", "type": "ચકડોળ"},
    
    # Ch 5
    {"id": "fc_std1_ch5_1", "chapter_id": "sci_std_01_ch5", "front": "શાકભાજીનો રાજા કોણ છે?", "back": "રીંગણ", "type": "શાકભાજી"},
    {"id": "fc_std1_ch5_2", "chapter_id": "sci_std_01_ch5", "front": "ગાજરનો રંગ કેવો હોય છે?", "back": "લાલ કે કેસરી રંગ", "type": "રંગો"},
    
    # Ch 6
    {"id": "fc_std1_ch6_1", "chapter_id": "sci_std_01_ch6", "front": "ઉંદર કોનાથી ડરે છે?", "back": "બિલાડી માસીથી ડરે છે", "type": "ડર"},
    {"id": "fc_std1_ch6_2", "chapter_id": "sci_std_01_ch6", "front": "ઉંદર ક્યાં રહે છે?", "back": "ઉંદર દરમાં રહે છે", "type": "રહેઠાણ"},
    
    # Ch 7
    {"id": "fc_std1_ch7_1", "chapter_id": "sci_std_01_ch7", "front": "પતંગ શેનાથી ઉડાડાય છે?", "back": "દોરી અને ફીરકીથી ઉડાડાય છે", "type": "ઉતરાયણ"},
    {"id": "fc_std1_ch7_2", "chapter_id": "sci_std_01_ch7", "front": "ઉતરાયણ કયા મહિનામાં આવે છે?", "back": "૧૪ જાન્યુઆરી મહિનામાં આવે છે", "type": "તહેવાર"},
    
    # Ch 8
    {"id": "fc_std1_ch8_1", "chapter_id": "sci_std_01_ch8", "front": "ઢીંગલી શું નથી કરતી?", "back": "ઢીંગલી જાતે બોલતી કે ખાતી નથી", "type": "રમકડાં"},
    {"id": "fc_std1_ch8_2", "chapter_id": "sci_std_01_ch8", "front": "ઢીંગલીને શામાં બેસાડીને રમાડાય છે?", "back": "નાના પારણામાં બેસાડીને", "type": "રમકડાં"}
]

for fc in flashcards_data:
    ref = db.collection("flashcards").document(fc["id"])
    ref.set({
        "flashcard_id": fc["id"],
        "chapter_id": fc["chapter_id"],
        "front_text_gu": fc["front"],
        "back_text_gu": fc["back"],
        "front_text_en": fc["front"],
        "back_text_en": fc["back"],
        "card_type": fc["type"],
        "is_active": True,
        "isDeleted": False,
        "display_order": 1
    }, merge=True)
    print(f"Seeded flashcard: {fc['id']} -> {fc['front']}")

print("\n--- FLASHCARDS SEEDING COMPLETE ---")
