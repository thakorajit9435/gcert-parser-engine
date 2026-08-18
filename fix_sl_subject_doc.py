import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import firebase_admin
from firebase_admin import credentials, firestore
from config.settings import settings

cred = credentials.Certificate(str(settings.GOOGLE_APPLICATION_CREDENTIALS))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)

# Update sub_gujarati_sl_std7 to have standardId = "7" and standard_id = "7"
sub_sl_ref = db.collection("subjects").document("sub_gujarati_sl_std7")
sub_sl_ref.update({
    "standardId": "7",
    "standard_id": "7",
    "standard": "7",
    "standardNumber": 7,
    "standard_number": 7,
    "session": "1",
    "isActive": True,
    "is_active": True,
    "isDeleted": False,
    "is_deleted": False,
    "order": 2,
    "icon": "📘",
    "nameGu": "ગુજરાતી (દ્વિતીય ભાષા)",
    "name_gu": "ગુજરાતી (દ્વિતીય ભાષા)",
    "titleGu": "ગુજરાતી (દ્વિતીય ભાષા)",
    "title_gu": "ગુજરાતી (દ્વિતીય ભાષા)",
    "name": "Gujarati Second Language",
    "title": "Gujarati Second Language"
})

print("✅ Successfully updated sub_gujarati_sl_std7 with standardId='7' and standard_id='7'")
