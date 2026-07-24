import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

# Initialize Firebase Admin
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client(database_id="topics")
print(f"Connected to project: {firebase_admin.get_app().project_id}")
print("All root-level collections visible to script:")
for coll in db.collections():
    print(f" - {coll.id}")
def backfill_topics_to_ai_kb():
    print("Fetching active topics...")
    topics_ref = db.collection('topics').where(filter=FieldFilter('isDeleted', '==', False)).stream()
    
    batch = db.batch()
    count = 0
    
    for doc in topics_ref:
        topic_data = doc.to_dict()
        topic_id = doc.id
        
        # Check if already exists in ai_knowledge_base
        kb_query = db.collection('ai_knowledge_base').where(filter=FieldFilter('topic_id', '==', topic_id)).get()
        if len(kb_query) > 0:
            print(f"Skipping topic {topic_id} - already exists in KB")
            continue
            
        kb_ref = db.collection('ai_knowledge_base').document()
        
        ai_payload = {
            "topic_id": topic_id,
            "chapter_id": topic_data.get("chapter_id", ""),
            "subject_id": topic_data.get("subject_id", ""),
            "standard_id": topic_data.get("standard_id", ""),
            "summary_gu": f"{topic_data.get('topicNameGujarati', '')} વિશે વિસ્તૃત માહિતી. આ પ્રકરણના મુખ્ય બિંદુઓ અને ચર્ચાઓનો સમાવેશ કરે છે.",
            "summary_en": f"Detailed summary for topic: {topic_data.get('topicName', '')}.",
            "keywords": topic_data.get("keywords", []),
            "revision_notes": [
                "આ મુદ્દો પરીક્ષા માટે અત્યંત મહત્વનો છે.",
                "આ વ્યાખ્યા ખાસ યાદ રાખવી."
            ],
            "formulas": [
                {
                    "name_gu": "મૂળભૂત સમીકરણ",
                    "latex_formula": "E = mc^2",
                    "explanation_gu": "ઉર્જા અને દળનો સંબંધ દર્શાવે છે."
                }
            ],
            "activities": [
                {
                    "title_gu": "પ્રયોગશાળા નિરીક્ષણ",
                    "objective_gu": "પરિણામ ચકાસવા માટે.",
                    "procedure_gu": "તબક્કાવાર પગલાંઓ અનુસરો."
                }
            ],
            "important_questions": [
                {
                    "question_gu": "આ મુદ્દાની વ્યાખ્યા આપી સમજાવો.",
                    "answer_gu": "આ વ્યાખ્યા વિગતવાર પુસ્તકમાંથી મેળવી શકાશે.",
                    "marks": 3
                }
            ],
            "related_topics": [],
            "metadata": {
                "backfilled_by": "migration_script_v1",
                "embedding_model": "text-embedding-004"
            },
            "isDeleted": False,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }
        
        batch.set(kb_ref, ai_payload)
        count += 1
        print(f"Queued KB doc for topic: {topic_id}")
        
        if count == 500:
            batch.commit()
            print("Committed batch of 500 records.")
            batch = db.batch()
            count = 0
            
    if count > 0:
        batch.commit()
        print("Committed final batch of records.")
        
if __name__ == "__main__":
    backfill_topics_to_ai_kb()
    