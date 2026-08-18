#!/usr/bin/env python3
"""
Python PDF Upload & Ingestion Tool for GCERT Parser Engine
Allows uploading and parsing PDF textbooks directly in Python without React Native UI.
"""

import sys
import os
import argparse
import uuid
import datetime
import json
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

# Auto-re-execute using venv python if running with system python without virtualenv
venv_python = PROJECT_ROOT / "venv" / "bin" / "python"
if venv_python.exists() and sys.executable != str(venv_python) and "VIRTUAL_ENV" not in os.environ:
    os.execv(str(venv_python), [str(venv_python)] + sys.argv)

try:
    from config.settings import settings
    from src.core.logger import logger
except ImportError as e:
    print("❌ Missing required dependencies. Make sure to activate your virtual environment:")
    print("   source venv/bin/activate")
    print(f"Details: {e}")
    sys.exit(1)



def find_pdf_files():
    """Scans root directory and uploads/ folder for .pdf files."""
    pdf_files = []
    for root, _, files in os.walk(PROJECT_ROOT):
        # Skip venv, outputs, hidden dirs
        if any(skip in root for skip in ["venv", ".git", "outputs", "__pycache__"]):
            continue
        for file in files:
            if file.endswith(".pdf"):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                pdf_files.append(rel_path)
    return pdf_files


def _init_firebase():
    """Initialize Firebase Admin SDK and return Firestore client."""
    import firebase_admin
    from firebase_admin import credentials, firestore as fs
    try:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass  # Already initialized
    return fs.client(database_id=settings.FIRESTORE_DATABASE_ID)


def _pick_option(items, prompt_label, name_fn, allow_custom=False):
    """Generic numbered list picker. Returns the selected item or None."""
    if not items:
        print(f"  ⚠️  કોઈ {prompt_label} મળ્યું નથી Firestore માં.")
        return None

    for idx, item in enumerate(items, 1):
        print(f"  [{idx}] {name_fn(item)}")
    if allow_custom:
        print(f"  [{len(items) + 1}] ✏️  Custom value enter કરો")

    max_choice = len(items) + (1 if allow_custom else 0)
    while True:
        raw = input(f"\n  Select {prompt_label} (1-{max_choice}) [1]: ").strip()
        if not raw:
            raw = "1"
        try:
            choice = int(raw)
            if 1 <= choice <= len(items):
                return items[choice - 1]
            if allow_custom and choice == len(items) + 1:
                return None  # Caller handles custom input
        except ValueError:
            pass
        print(f"  ❌ Invalid choice. 1-{max_choice} માંથી select કરો.")


def interactive_prompt():
    """Interactive CLI prompt that fetches Standards, Subjects & Sessions from Firestore."""
    print("=" * 60)
    print(" 📚 GCERT Parser Engine - Python PDF Upload CLI")
    print("=" * 60)

    # ── 1. PDF File Selection ──────────────────────────────────
    pdfs = find_pdf_files()
    pdf_path = None

    if pdfs:
        print("\n📄 Found PDF files:")
        for idx, pdf in enumerate(pdfs, 1):
            print(f"  [{idx}] {pdf}")
        print(f"  [{len(pdfs) + 1}] ✏️  Custom file path enter કરો")

        try:
            choice = input(f"\n  Select PDF file (1-{len(pdfs) + 1}) [1]: ").strip()
            if not choice:
                choice = "1"
            idx_choice = int(choice)
            if 1 <= idx_choice <= len(pdfs):
                pdf_path = str(PROJECT_ROOT / pdfs[idx_choice - 1])
        except Exception:
            pass

    if not pdf_path:
        while True:
            custom_path = input("\n  Enter full path to PDF file: ").strip().strip("'\"")
            if os.path.exists(custom_path) and custom_path.endswith(".pdf"):
                pdf_path = custom_path
                break
            else:
                print("  ❌ File does not exist or is not a .pdf. Please try again.")

    print(f"\n  ✅ Selected PDF: {pdf_path}")

    # ── 2. Connect to Firestore ────────────────────────────────
    print("\n🔗 Connecting to Firestore...")
    try:
        db = _init_firebase()
        print("  ✅ Firestore connected!")
    except Exception as e:
        print(f"  ❌ Firestore connection failed: {e}")
        print("  Falling back to manual entry...\n")
        return _fallback_manual_prompt(pdf_path)

    # ── 3. Standard Selection ──────────────────────────────────
    print("\n📋 ધોરણ (Standard) select કરો:")
    try:
        std_docs = db.collection("standards").where("is_active", "==", True).stream()
        standards = []
        for doc in std_docs:
            data = doc.to_dict()
            data["_doc_id"] = doc.id
            standards.append(data)
        standards.sort(key=lambda s: s.get("standard_number", 0))
    except Exception as e:
        print(f"  ⚠️  Standards fetch failed: {e}")
        standards = []

    if standards:
        selected_std = _pick_option(
            standards,
            "Standard",
            lambda s: f"ધોરણ {s.get('standard_number', '?')} - {s.get('display_name_gu', s.get('display_name_en', ''))}",
            allow_custom=True
        )
        if selected_std:
            standard_number = int(selected_std.get("standard_number", 1))
            standard_id = selected_std.get("standard_id", selected_std["_doc_id"])
        else:
            # Custom entry
            std_num_str = input("  Enter Standard Number (e.g. 3): ").strip() or "3"
            standard_number = int(std_num_str)
            standard_id = f"std_{standard_number}"
    else:
        std_num_str = input("  Enter Standard Number (e.g. 3): ").strip() or "3"
        standard_number = int(std_num_str)
        standard_id = f"std_{standard_number}"

    print(f"  ✅ Standard: ધોરણ {standard_number} ({standard_id})")

    # ── 4. Subject Selection ───────────────────────────────────
    print(f"\n📘 વિષય (Subject) select કરો (ધોરણ {standard_number}):")
    try:
        subj_docs = (
            db.collection("subjects")
            .where("standardId", "==", str(standard_number))
            .where("isDeleted", "==", False)
            .stream()
        )
        subjects = []
        for doc in subj_docs:
            data = doc.to_dict()
            data["_doc_id"] = doc.id
            subjects.append(data)
        subjects.sort(key=lambda s: s.get("order", s.get("display_order", 0)))
    except Exception as e:
        print(f"  ⚠️  Subjects fetch failed: {e}")
        subjects = []

    if subjects:
        selected_subj = _pick_option(
            subjects,
            "Subject",
            lambda s: f"{s.get('nameGu', '') or s.get('name_gu', '')} ({s.get('name', '') or s.get('name_en', '')}) [ID: {s['_doc_id']}]",
            allow_custom=True
        )
        if selected_subj:
            subject_id = selected_subj["_doc_id"]
        else:
            subject_id = input("  Enter Subject ID (e.g. sci_01): ").strip() or "sci_01"
    else:
        subject_id = input("  Enter Subject ID (e.g. sci_01, math_01): ").strip() or "sci_01"

    print(f"  ✅ Subject ID: {subject_id}")

    # ── 5. Session Selection ───────────────────────────────────
    print(f"\n📅 સત્ર (Session) select કરો (ધોરણ {standard_number}):")
    try:
        sess_docs = (
            db.collection("sessions")
            .where("standardId", "==", str(standard_number))
            .where("isDeleted", "==", False)
            .stream()
        )
        sessions_list = []
        for doc in sess_docs:
            data = doc.to_dict()
            data["_doc_id"] = doc.id
            sessions_list.append(data)
        sessions_list.sort(key=lambda s: s.get("order", 0))
    except Exception as e:
        print(f"  ⚠️  Sessions fetch failed: {e}")
        sessions_list = []

    if sessions_list:
        selected_sess = _pick_option(
            sessions_list,
            "Session",
            lambda s: f"{s.get('title', 'Session')} (session={s.get('session', '?')})",
            allow_custom=True
        )
        if selected_sess:
            session = str(selected_sess.get("session", "1"))
        else:
            session = input("  Enter Session/Semester [1]: ").strip() or "1"
    else:
        session = input("  Enter Session/Semester [1]: ").strip() or "1"

    print(f"  ✅ Session: {session}")

    # ── 6. Execution Mode ──────────────────────────────────────
    mode = input("\n⚙️  Execution Mode:\n  [1] Direct Python (No server needed)\n  [2] API Endpoint (FastAPI running)\n  Select mode [1]: ").strip() or "1"
    use_api = (mode == "2")

    return pdf_path, subject_id, standard_id, standard_number, session, use_api


def _fallback_manual_prompt(pdf_path):
    """Fallback manual entry when Firestore is not available."""
    std_num_str = input("\nEnter Standard Number (e.g. 10) [10]: ").strip() or "10"
    try:
        standard_number = int(std_num_str)
    except ValueError:
        standard_number = 10
    standard_id = input(f"Enter Standard ID [std_{standard_number}]: ").strip() or f"std_{standard_number}"
    subject_id = input("Enter Subject ID (e.g. sci_01) [sci_01]: ").strip() or "sci_01"
    session = input("Enter Session/Semester [1]: ").strip() or "1"
    mode = input("\nExecution Mode:\n [1] Direct Python\n [2] API Endpoint\nSelect mode [1]: ").strip() or "1"
    use_api = (mode == "2")
    return pdf_path, subject_id, standard_id, standard_number, session, use_api


def run_direct_pipeline(file_path: str, subject_id: str, standard_id: str, standard_number: int, session: str):
    """Executes the pipeline directly in the current Python process."""
    job_id = str(uuid.uuid4())
    print("\n" + "=" * 60)
    print(f"🚀 Starting Direct Python Pipeline Execution...")
    print(f" Job ID:          {job_id}")
    print(f" File Path:       {file_path}")
    print(f" Subject ID:      {subject_id}")
    print(f" Standard ID:     {standard_id}")
    print(f" Standard Number: {standard_number}")
    print(f" Session:         {session}")
    print(f" LLM Provider:    {settings.LLM_PROVIDER}")
    if settings.LLM_PROVIDER == "ollama":
        print(f" Ollama Model:    {settings.OLLAMA_MODEL}")
        print(f" Ollama URL:      {settings.OLLAMA_BASE_URL}")
    print("=" * 60 + "\n")

    # Copy / Save file to uploads directory if needed
    dest_path = settings.UPLOAD_DIR / f"{job_id}.pdf"
    import shutil
    shutil.copyfile(file_path, dest_path)

    # Save job metadata
    meta_path = settings.OUTPUT_DIR / f"{job_id}_meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({
            "job_id": job_id,
            "filename": os.path.basename(file_path),
            "subject_id": subject_id,
            "standard_id": standard_id,
            "standard_number": standard_number,
            "session": session,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }, f, ensure_ascii=False, indent=2)

    from src.pipeline.manager import PipelineManager

    manager = PipelineManager(
        job_id=job_id,
        file_path=str(dest_path),
        subject_id=subject_id,
        standard_id=standard_id,
        standard_number=standard_number,
        session=session
    )

    try:
        result = manager.execute()
        print("\n" + "=" * 60)
        print("🎉 PIPELINE COMPLETED SUCCESSFULLY!")
        print(f" Job ID:           {job_id}")
        print(f" Chapters Parsed:  {result.get('summary', {}).get('chapters_parsed', 0)}")
        print(f" Questions Parsed: {result.get('summary', {}).get('questions_parsed', 0)}")
        print(f" MCQs Parsed:      {result.get('summary', {}).get('mcqs_parsed', 0)}")
        print("=" * 60)
        return result
    except Exception as e:
        print(f"\n❌ Pipeline execution failed: {str(e)}")
        sys.exit(1)


def upload_via_api(file_path: str, subject_id: str, standard_id: str, standard_number: int, session: str, api_url: str = "http://localhost:8000"):
    """Uploads the PDF file to running FastAPI backend endpoint."""
    endpoint = f"{api_url}/api/v1/parser/upload"
    print(f"\n📡 Uploading {file_path} to API endpoint: {endpoint}...")

    try:
        import requests
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "application/pdf")}
            data = {
                "subject_id": subject_id,
                "standard_id": standard_id,
                "standard_number": str(standard_number),
                "session": session
            }
            resp = requests.post(endpoint, files=files, data=data)
            if resp.status_code == 200:
                res_data = resp.json()
                print("\n✅ API Upload Successful!")
                print(f" Job ID:  {res_data.get('job_id')}")
                print(f" Status:  {res_data.get('status')}")
                print(f" Message: {res_data.get('message')}")
                return res_data
            else:
                print(f"\n❌ API Error ({resp.status_code}): {resp.text}")
                sys.exit(1)
    except Exception as e:
        print(f"\n❌ Failed to upload via API: {str(e)}")
        print("💡 Make sure FastAPI server is running (`uvicorn src.main:app --reload`).")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Upload and parse GCERT PDF textbooks in Python")
    parser.add_argument("-f", "--file", type=str, help="Path to PDF file")
    parser.add_argument("-s", "--subject", "--subject_id", type=str, default=None, help="Subject ID (e.g. sci_01)")
    parser.add_argument("-std", "--standard_id", type=str, default=None, help="Standard ID (e.g. std_10)")
    parser.add_argument("-n", "--std_num", "--standard_number", type=int, default=None, help="Standard number (e.g. 10)")
    parser.add_argument("-se", "--session", type=str, default="1", help="Session/Semester (e.g. 1)")
    parser.add_argument("--api", action="store_true", help="Upload via running FastAPI server endpoint")
    parser.add_argument("--url", type=str, default="http://localhost:8000", help="Base API URL for server upload")

    args = parser.parse_args()

    if not args.file:
        pdf_path, subject_id, standard_id, standard_number, session, use_api = interactive_prompt()
    else:
        pdf_path = args.file
        if not os.path.exists(pdf_path):
            print(f"❌ Error: Specified file '{pdf_path}' does not exist.")
            sys.exit(1)
        standard_number = args.std_num or 10
        standard_id = args.standard_id or f"std_{standard_number}"
        subject_id = args.subject or "sci_01"
        session = args.session or "1"
        use_api = args.api

    if use_api:
        upload_via_api(pdf_path, subject_id, standard_id, standard_number, session, args.url)
    else:
        run_direct_pipeline(pdf_path, subject_id, standard_id, standard_number, session)


if __name__ == "__main__":
    main()
