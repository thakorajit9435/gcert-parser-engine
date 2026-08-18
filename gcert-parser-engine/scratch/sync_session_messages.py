import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings

def sync_messages():
    try:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    db_source = firestore.client(database_id="topics")
    db_dest = firestore.client()

    sessions = list(db_source.collection("chat_sessions").stream())
    print(f"Found {len(sessions)} sessions. Syncing their messages...")

    for sess in sessions:
        sess_id = sess.id
        messages = list(db_source.collection("chat_sessions").document(sess_id).collection("messages").stream())
        print(f"Session {sess_id}: found {len(messages)} messages.")
        
        if not messages:
            continue
            
        batch = db_dest.batch()
        for msg in messages:
            msg_data = msg.to_dict()
            dest_msg_ref = db_dest.collection("chat_sessions").document(sess_id).collection("messages").document(msg.id)
            batch.set(dest_msg_ref, msg_data)
            
        batch.commit()
        print(f"Synced {len(messages)} messages for session {sess_id}.")

    print("🎉 Session messages sync complete!")

if __name__ == "__main__":
    sync_messages()
