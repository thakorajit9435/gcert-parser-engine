import firebase_admin
from firebase_admin import credentials, firestore
import os

cred_path = "../serviceAccountKey.json"
if not os.path.exists(cred_path):
    cred_path = "serviceAccountKey.json"

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("--- REPAIRING AND POPULATING FIRESTORE SUBCOLLECTIONS ---", flush=True)

# 1. Sync Quiz questions into quizzes/{quizId}/questions subcollection
quizzes_snap = db.collection("quizzes").get()
print(f"Found {len(quizzes_snap)} total quizzes in Firestore.", flush=True)

total_synced_questions = 0
for quiz_doc in quizzes_snap:
    quiz_data = quiz_doc.to_dict()
    quiz_id = quiz_doc.id
    chapter_id = quiz_data.get("chapterId") or quiz_data.get("chapter_id")
    subject_id = quiz_data.get("subjectId") or quiz_data.get("subject_id")
    standard_id = quiz_data.get("standardId") or quiz_data.get("standard_id") or "1"
    chapter_title_gu = quiz_data.get("titleGu") or quiz_data.get("title") or "પ્રકરણ"

    # Query top level questions for this quiz
    q_snap = db.collection("questions").where("quizId", "==", quiz_id).get()
    if len(q_snap) == 0:
        q_snap = db.collection("questions").where("quiz_id", "==", quiz_id).get()
        
    print(f"Quiz '{quiz_id}': Found {len(q_snap)} existing top-level questions.")

    # If top-level questions are fewer than 5, create synthetic Gujarati MCQs for this quiz
    questions_list = [q.to_dict() for q in q_snap]
    if len(questions_list) < 5:
        needed = 5 - len(questions_list)
        print(f"  Generating {needed} additional MCQs for quiz '{quiz_id}'...")
        
        for idx in range(needed):
            q_num = len(questions_list) + 1
            q_id = f"qz_q_{chapter_id}_{q_num}"
            
            q_doc = {
                "id": q_id,
                "question_id": q_id,
                "quizId": quiz_id,
                "quiz_id": quiz_id,
                "chapterId": chapter_id,
                "chapter_id": chapter_id,
                "subjectId": subject_id,
                "subject_id": subject_id,
                "standardId": str(standard_id),
                "questionText": f"{chapter_title_gu}: બહુવિકલ્પ સ્વાધ્યાય પ્રશ્ન #{q_num}",
                "questionTextGu": f"{chapter_title_gu}: બહુવિકલ્પ સ્વાધ્યાય પ્રશ્ન #{q_num}",
                "options": [
                    {"id": "A", "text": f"{chapter_title_gu} નો મુખ્ય સિદ્ધાંત અને નિયમ", "textGu": f"{chapter_title_gu} નો મુખ્ય સિદ્ધાંત અને નિયમ"},
                    {"id": "B", "text": "વિકલ્પ B", "textGu": "વિકલ્પ B"},
                    {"id": "C", "text": "વિકલ્પ C", "textGu": "વિકલ્પ C"},
                    {"id": "D", "text": "વિકલ્પ D", "textGu": "વિકલ્પ D"}
                ],
                "correctOptionId": "A",
                "explanation": f"{chapter_title_gu} આધારિત મહત્ત્વનો પ્રશ્ન.",
                "explanationGu": f"{chapter_title_gu} આધારિત મહત્ત્વનો પ્રશ્ન.",
                "points": 10,
                "order": q_num,
                "isDeleted": False
            }
            questions_list.append(q_doc)
            # Write to top-level questions collection as well
            db.collection("questions").document(q_id).set(q_doc, merge=True)

    # Write all questions into quizzes/{quiz_id}/questions subcollection
    batch = db.batch()
    for q_data in questions_list:
        q_id = q_data.get("id") or q_data.get("question_id")
        subcol_ref = db.collection("quizzes").document(quiz_id).collection("questions").document(q_id)
        batch.set(subcol_ref, q_data, merge=True)
        total_synced_questions += 1
    batch.commit()
    
    # Update totalQuestions count on Quiz doc
    db.collection("quizzes").document(quiz_id).update({
        "totalQuestions": len(questions_list),
        "totalMarks": len(questions_list)
    })
    print(f"  Synced {len(questions_list)} questions into quizzes/{quiz_id}/questions subcollection.")

# 2. Check and sync Flashcards for all chapters
chapters_snap = db.collection("chapters").where("isDeleted", "==", False).get()
print(f"\nFound {len(chapters_snap)} chapters in Firestore.")

for ch_doc in chapters_snap:
    ch_data = ch_doc.to_dict()
    ch_id = ch_doc.id
    ch_title = ch_data.get("titleGu") or ch_data.get("title") or "પ્રકરણ"
    subject_id = ch_data.get("subjectId") or ch_data.get("subject_id")
    standard_id = ch_data.get("standardId") or ch_data.get("standard_id") or "1"

    fc_snap = db.collection("flashcards").where("chapter_id", "==", ch_id).where("isDeleted", "==", False).get()
    if len(fc_snap) == 0:
        fc_snap = db.collection("flashcards").where("chapterId", "==", ch_id).where("isDeleted", "==", False).get()

    print(f"Chapter '{ch_id}' ({ch_title}): Found {len(fc_snap)} existing flashcards.")

    if len(fc_snap) < 5:
        needed = 5 - len(fc_snap)
        print(f"  Generating {needed} flashcards for chapter '{ch_id}'...")
        batch = db.batch()
        for idx in range(needed):
            fc_num = len(fc_snap) + idx + 1
            fc_id = f"fc_{ch_id}_{fc_num}"
            fc_doc = {
                "id": fc_id,
                "flashcard_id": fc_id,
                "chapter_id": ch_id,
                "chapterId": ch_id,
                "subject_id": subject_id,
                "subjectId": subject_id,
                "standard_id": str(standard_id),
                "standardId": str(standard_id),
                "front_text_gu": f"સંકલ્પનાત્મક મુદ્દો #{fc_num} ({ch_title})",
                "question_gu": f"સંકલ્પનાત્મક મુદ્દો #{fc_num} ({ch_title})",
                "back_text_gu": f"{ch_title} ના મુખ્ય પરિભાવો, સિદ્ધાંતો અને યાદ રાખવાના નિયમો.",
                "answer_gu": f"{ch_title} ના મુખ્ય પરિભાવો, સિદ્ધાંતો અને યાદ રાખવાના નિયમો.",
                "card_type": "concept",
                "difficulty_level": "easy",
                "is_active": True,
                "isActive": True,
                "is_premium": False,
                "is_ai_generated": True,
                "isDeleted": False
            }
            ref = db.collection("flashcards").document(fc_id)
            batch.set(ref, fc_doc, merge=True)
        batch.commit()
        print(f"  Added {needed} flashcards for chapter '{ch_id}'.")

print("\n--- REPAIR AND FIRESTORE SUBCOLLECTION SYNC COMPLETED SUCCESSFULLY ---")
