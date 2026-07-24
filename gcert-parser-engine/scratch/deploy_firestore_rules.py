import sys
import os
import firebase_admin
from firebase_admin import credentials, security_rules

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings

def deploy_rules():
    try:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    # Read rules file
    rules_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../firestore.rules"))
    print(f"Reading rules from: {rules_path}")
    if not os.path.exists(rules_path):
        print("❌ firestore.rules file not found!")
        return

    with open(rules_path, "r", encoding="utf-8") as f:
        rules_content = f.read()

    print("Creating ruleset from firestore.rules content...")
    try:
        # Create Firestore rules files object
        rules_files = security_rules.FirestoreRulesFiles(rules_content)
        ruleset = security_rules.create_ruleset(rules_files)
        print(f"✔ Ruleset created successfully: {ruleset.name}")
        
        print("Releasing ruleset for default database (release name: cloud.firestore)...")
        security_rules.release_ruleset("cloud.firestore", ruleset.name)
        print("✔ Released successfully for default database!")
        
        # Try releasing for named 'topics' database if it exists
        try:
            print("Releasing ruleset for 'topics' database (release name: cloud.firestore/databases/topics)...")
            security_rules.release_ruleset("cloud.firestore/databases/topics", ruleset.name)
            print("✔ Released successfully for 'topics' database!")
        except Exception as ex:
            print(f"ℹ Could not release for 'topics' database (it might use default or rules are inherited): {str(ex)}")

        print("\n🎉 ALL DONE! Rules deployed successfully!")
    except Exception as e:
        print(f"❌ Failed to deploy security rules: {str(e)}")

if __name__ == "__main__":
    deploy_rules()
