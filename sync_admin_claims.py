import firebase_admin
from firebase_admin import credentials, firestore, auth

def sync_admin_claims():
    print("Initializing Firebase Admin SDK...")
    cred = credentials.Certificate("serviceAccountKey.json")
    # Initialize the app with default database or check if already initialized
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass
        
    db = firestore.client()
    
    print("Fetching users with admin roles from Firestore...")
    # Query users where role is 'super_admin' or 'content_admin'
    users_ref = db.collection("users")
    
    # We query both by fetching all users or filtering if supported
    # To be safe and simple, let's query all docs in users collection and filter in Python
    all_users = users_ref.stream()
    
    admin_count = 0
    for doc in all_users:
        user_data = doc.to_dict()
        uid = doc.id
        role = user_data.get("role") or user_data.get("user_role")
        email = user_data.get("email")
        
        if role in ["super_admin", "content_admin"]:
            print(f"Found admin user: {email or 'No Email'} (UID: {uid}) with role: {role}")
            try:
                # Set custom claims in Firebase Authentication
                auth.set_custom_user_claims(uid, {"role": role})
                
                # Double check user custom claims
                user = auth.get_user(uid)
                print(f"Successfully set claims for {user.email}: {user.custom_claims}")
                admin_count += 1
            except Exception as e:
                print(f"Error setting claims for user {uid}: {e}")
                
    print(f"Sync complete. Updated {admin_count} admin accounts.")

if __name__ == "__main__":
    sync_admin_claims()
