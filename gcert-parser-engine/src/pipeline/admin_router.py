"""
Admin Content Management Router
Provides APIs for managing chapter start pages from the admin panel,
and a user-facing endpoint to fetch chapters ordered by startPage.

Admin endpoints are protected by Firebase Auth with super_admin role verification.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Header
from pydantic import BaseModel, Field
from firebase_admin import firestore, auth as firebase_auth

from config.settings import settings
from src.core.logger import logger

admin_router = APIRouter(tags=["Admin Content Management"])


def get_firestore_db():
    try:
        return firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)
    except Exception as e:
        logger.error("Failed to acquire Firestore client: %s", str(e))
        raise HTTPException(status_code=500, detail="Database connection failed.")


# =====================================================================
#  Firebase Auth + super_admin Role Guard
# =====================================================================

async def verify_super_admin(
    authorization: str = Header(..., description="Bearer <Firebase ID Token>"),
    db=Depends(get_firestore_db),
) -> dict:
    """
    Dependency that verifies the Firebase ID token from the Authorization header
    and checks that the user has `super_admin` role in Firestore `users` collection.
    
    Returns the decoded user info dict on success.
    Raises 401/403 on failure.
    """
    # 1. Extract Bearer token
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header. Use 'Bearer <token>' format.")

    id_token = authorization[7:]  # Strip "Bearer " prefix

    # 2. Verify Firebase ID token
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired. Please login again.")
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token. Authentication failed.")
    except Exception as e:
        logger.error("Firebase token verification failed: %s", str(e))
        raise HTTPException(status_code=401, detail="Authentication failed.")

    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token: no user ID found.")

    # 3. Check super_admin role from Firestore users collection
    try:
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            logger.warning("User %s not found in Firestore users collection.", uid)
            raise HTTPException(status_code=403, detail="Access denied. User not found.")

        user_data = user_doc.to_dict()
        user_role = user_data.get("role", "")

        if user_role != "super_admin":
            logger.warning(
                "User %s attempted admin action with role '%s'. Requires super_admin.",
                uid, user_role
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied. Only super_admin can perform this action."
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to verify user role for %s: %s", uid, str(e))
        raise HTTPException(status_code=500, detail="Failed to verify user role.")

    return {
        "uid": uid,
        "email": decoded_token.get("email", ""),
        "role": "super_admin",
    }


# --- Request / Response Schemas ---

class UpdateStartPageRequest(BaseModel):
    startPage: int = Field(..., ge=1, description="Physical 1-based PDF page where chapter starts")
    endPage: Optional[int] = Field(None, ge=1, description="Physical 1-based PDF page where chapter ends")


class BatchChapterPageUpdate(BaseModel):
    chapterId: str
    startPage: int = Field(..., ge=1)
    endPage: Optional[int] = Field(None, ge=1)


class BatchUpdateStartPagesRequest(BaseModel):
    subjectId: str = Field(..., description="Subject ID for which chapters are being updated")
    chapters: List[BatchChapterPageUpdate]


class ChapterPageInfo(BaseModel):
    chapterId: str
    titleGu: str
    title: str
    chapterNumber: int
    order: int
    startPage: int
    endPage: int
    bookStartPage: int
    initialPage: int
    pdfPageOffset: int
    pdfUrl: str = ""
    subjectId: str = ""
    standard: str = ""
    session: str = ""
    isActive: bool = True


# --- Helper: Recalculate derived page fields ---

def _recalculate_page_fields(start_page: int, end_page: int, pdf_page_offset: int) -> dict:
    """
    Given a new startPage and the existing pdfPageOffset,
    recalculates all derived page fields with both camelCase and snake_case aliases.
    """
    book_start_page = max(1, start_page - pdf_page_offset)
    initial_page = max(0, start_page - 1)

    return {
        # Primary page fields
        "startPage": start_page,
        "start_page": start_page,
        "endPage": end_page,
        "end_page": end_page,
        # Derived: printed book page
        "bookStartPage": book_start_page,
        "book_start_page": book_start_page,
        # Derived: 0-based page index for PDF viewer
        "initialPage": initial_page,
        "initial_page": initial_page,
        "pageIndex": initial_page,
        "page_index": initial_page,
        # Aliases mirroring startPage
        "pageNumber": start_page,
        "page_number": start_page,
        "pageNo": start_page,
        "page_no": start_page,
        "page": start_page,
        # Timestamp
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }


def _chapter_doc_to_info(doc_id: str, data: dict) -> dict:
    """Converts a Firestore chapter document to a clean API response dict."""
    return {
        "chapterId": doc_id,
        "titleGu": data.get("titleGu") or data.get("title_gu") or "",
        "title": data.get("title") or data.get("title_en") or "",
        "chapterNumber": data.get("chapterNumber") or data.get("chapter_number") or 0,
        "order": data.get("order") or 0,
        "startPage": data.get("startPage") or data.get("start_page") or 0,
        "endPage": data.get("endPage") or data.get("end_page") or 0,
        "bookStartPage": data.get("bookStartPage") or data.get("book_start_page") or 0,
        "initialPage": data.get("initialPage") or data.get("initial_page") or 0,
        "pdfPageOffset": data.get("pdfPageOffset") or data.get("pdf_page_offset") or 0,
        "pdfUrl": data.get("pdfUrl") or data.get("pdf_url") or "",
        "subjectId": data.get("subjectId") or data.get("subject_id") or "",
        "standard": data.get("standard") or data.get("standardId") or "",
        "session": data.get("session") or "",
        "isActive": data.get("isActive", True),
    }


# =====================================================================
#  ADMIN ENDPOINTS — Protected by super_admin role
# =====================================================================

@admin_router.get("/api/v1/admin/content/subjects")
async def list_subjects(
    standard: Optional[str] = Query(None, description="Filter by standard number"),
    admin_user: dict = Depends(verify_super_admin),
    db=Depends(get_firestore_db),
):
    """
    Lists all subjects. super_admin can see all subjects to then drill into chapters.
    Supports filtering by standard number.
    """
    try:
        query = db.collection("subjects")

        if standard:
            query = query.where("standard", "==", standard)

        docs = query.get()

        subjects = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("isDeleted", False):
                continue
            subjects.append({
                "subjectId": doc.id,
                "name": data.get("name") or data.get("name_en") or "",
                "nameGu": data.get("nameGu") or data.get("name_gu") or "",
                "standard": data.get("standard") or data.get("standardId") or "",
                "standardNumber": data.get("standard_number") or data.get("standardNumber") or 0,
                "session": data.get("session") or "",
                "totalChapters": data.get("total_chapters") or data.get("totalChapters") or 0,
                "icon": data.get("icon") or "",
                "isActive": data.get("isActive", True),
            })

        # Sort by standard number then by name
        subjects.sort(key=lambda s: (s["standardNumber"], s["name"]))

        return {
            "status": "success",
            "adminUser": admin_user["email"],
            "count": len(subjects),
            "subjects": subjects,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list subjects: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list subjects: {str(e)}")


@admin_router.get("/api/v1/admin/content/chapters")
async def list_chapters(
    subject_id: str = Query(..., description="Subject ID (required) — select subject first"),
    standard: Optional[str] = Query(None, description="Filter by standard number"),
    session: Optional[str] = Query(None, description="Filter by session/semester"),
    admin_user: dict = Depends(verify_super_admin),
    db=Depends(get_firestore_db),
):
    """
    Lists all chapters for a subject with their current start page info.
    Requires super_admin role. Subject ID is required for subject-wise listing.
    Returns chapters ordered by 'order' field.
    """
    try:
        query = db.collection("chapters").where("subjectId", "==", subject_id)

        if standard:
            query = query.where("standard", "==", standard)
        if session:
            query = query.where("session", "==", session)

        query = query.order_by("order")
        docs = query.get()

        chapters = []
        for doc in docs:
            data = doc.to_dict()
            chapters.append(_chapter_doc_to_info(doc.id, data))

        return {
            "status": "success",
            "adminUser": admin_user["email"],
            "subjectId": subject_id,
            "count": len(chapters),
            "chapters": chapters,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list chapters: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list chapters: {str(e)}")


@admin_router.get("/api/v1/admin/content/chapters/{chapterId}")
async def get_chapter(
    chapterId: str,
    admin_user: dict = Depends(verify_super_admin),
    db=Depends(get_firestore_db),
):
    """Returns full details of a single chapter document. Requires super_admin role."""
    try:
        doc_ref = db.collection("chapters").document(chapterId)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Chapter '{chapterId}' not found.")

        data = doc.to_dict()
        return {
            "status": "success",
            "chapter": _chapter_doc_to_info(doc.id, data),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get chapter %s: %s", chapterId, str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get chapter: {str(e)}")


@admin_router.patch("/api/v1/admin/content/chapters/{chapterId}/start-page")
async def update_chapter_start_page(
    chapterId: str,
    request: UpdateStartPageRequest,
    admin_user: dict = Depends(verify_super_admin),
    db=Depends(get_firestore_db),
):
    """
    Updates the start page (and optionally end page) for a single chapter.
    Requires super_admin role.
    Auto-recalculates all derived page fields: bookStartPage, initialPage,
    pageNumber, pageIndex, etc.
    """
    try:
        doc_ref = db.collection("chapters").document(chapterId)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Chapter '{chapterId}' not found.")

        existing = doc.to_dict()
        pdf_offset = existing.get("pdfPageOffset") or existing.get("pdf_page_offset") or 0
        current_end = existing.get("endPage") or existing.get("end_page") or (request.startPage + 14)

        new_end_page = request.endPage if request.endPage is not None else current_end
        # Ensure endPage >= startPage
        new_end_page = max(request.startPage, new_end_page)

        update_fields = _recalculate_page_fields(request.startPage, new_end_page, pdf_offset)
        doc_ref.update(update_fields)

        logger.info(
            "super_admin [%s] updated chapter %s startPage to %d (end: %d, bookStart: %d)",
            admin_user["email"],
            chapterId,
            request.startPage,
            new_end_page,
            update_fields["bookStartPage"],
        )

        return {
            "status": "success",
            "chapterId": chapterId,
            "message": f"Start page updated to {request.startPage}",
            "updatedBy": admin_user["email"],
            "updatedFields": {
                "startPage": update_fields["startPage"],
                "endPage": update_fields["endPage"],
                "bookStartPage": update_fields["bookStartPage"],
                "initialPage": update_fields["initialPage"],
                "pageNumber": update_fields["pageNumber"],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update start page for %s: %s", chapterId, str(e))
        raise HTTPException(status_code=500, detail=f"Failed to update start page: {str(e)}")


@admin_router.put("/api/v1/admin/content/chapters/batch-start-pages")
async def batch_update_start_pages(
    request: BatchUpdateStartPagesRequest,
    admin_user: dict = Depends(verify_super_admin),
    db=Depends(get_firestore_db),
):
    """
    Batch updates start pages for multiple chapters of a subject in a single
    Firestore batch write. Requires super_admin role.
    Auto-recalculates all derived page fields for each chapter.
    """
    if not request.chapters:
        raise HTTPException(status_code=400, detail="No chapters provided for update.")

    if len(request.chapters) > 450:
        raise HTTPException(status_code=400, detail="Maximum 450 chapters per batch update.")

    try:
        # Validate all chapters belong to the specified subject
        chapter_ids = [ch.chapterId for ch in request.chapters]
        existing_docs = {}

        for cid in chapter_ids:
            doc = db.collection("chapters").document(cid).get()
            if not doc.exists:
                raise HTTPException(status_code=404, detail=f"Chapter '{cid}' not found.")
            doc_data = doc.to_dict()
            doc_subject = doc_data.get("subjectId") or doc_data.get("subject_id") or ""
            if doc_subject != request.subjectId:
                raise HTTPException(
                    status_code=400,
                    detail=f"Chapter '{cid}' does not belong to subject '{request.subjectId}'."
                )
            existing_docs[cid] = doc_data

        # Build batch update
        batch = db.batch()
        results = []

        for ch_update in request.chapters:
            existing = existing_docs[ch_update.chapterId]
            pdf_offset = existing.get("pdfPageOffset") or existing.get("pdf_page_offset") or 0
            current_end = existing.get("endPage") or existing.get("end_page") or (ch_update.startPage + 14)

            new_end_page = ch_update.endPage if ch_update.endPage is not None else current_end
            new_end_page = max(ch_update.startPage, new_end_page)

            update_fields = _recalculate_page_fields(ch_update.startPage, new_end_page, pdf_offset)

            doc_ref = db.collection("chapters").document(ch_update.chapterId)
            batch.update(doc_ref, update_fields)

            results.append({
                "chapterId": ch_update.chapterId,
                "startPage": ch_update.startPage,
                "endPage": new_end_page,
                "bookStartPage": update_fields["bookStartPage"],
                "initialPage": update_fields["initialPage"],
            })

        batch.commit()

        logger.info(
            "super_admin [%s] batch updated start pages for %d chapters of subject %s",
            admin_user["email"],
            len(results),
            request.subjectId,
        )

        return {
            "status": "success",
            "message": f"Successfully updated {len(results)} chapters",
            "subjectId": request.subjectId,
            "updatedBy": admin_user["email"],
            "updatedChapters": results,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Batch start page update failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


# =====================================================================
#  USER-FACING ENDPOINT — Chapters ordered by startPage (No auth required)
# =====================================================================

@admin_router.get("/api/v1/content/chapters")
async def get_chapters_by_start_page(
    subject_id: str = Query(..., description="Subject ID (required)"),
    standard: Optional[str] = Query(None, description="Standard number"),
    session: Optional[str] = Query(None, description="Session/semester"),
    db=Depends(get_firestore_db),
):
    """
    User-facing endpoint: Fetches chapters for a subject, sorted by startPage ascending.
    Excludes soft-deleted and inactive chapters. No authentication required.
    """
    try:
        query = db.collection("chapters").where("subjectId", "==", subject_id)

        if standard:
            query = query.where("standard", "==", standard)
        if session:
            query = query.where("session", "==", session)

        # Filter out deleted chapters
        query = query.where("isDeleted", "==", False)
        query = query.order_by("startPage")

        docs = query.get()

        chapters = []
        for doc in docs:
            data = doc.to_dict()
            # Also skip inactive chapters for user view
            if not data.get("isActive", True):
                continue
            chapters.append({
                "chapterId": doc.id,
                "titleGu": data.get("titleGu") or data.get("title_gu") or "",
                "title": data.get("title") or data.get("title_en") or "",
                "chapterNumber": data.get("chapterNumber") or data.get("chapter_number") or 0,
                "order": data.get("order") or 0,
                "startPage": data.get("startPage") or data.get("start_page") or 0,
                "endPage": data.get("endPage") or data.get("end_page") or 0,
                "bookStartPage": data.get("bookStartPage") or data.get("book_start_page") or 0,
                "initialPage": data.get("initialPage") or data.get("initial_page") or 0,
                "pdfUrl": data.get("pdfUrl") or data.get("pdf_url") or "",
                "isPremium": data.get("isPremium", False),
            })

        return {
            "status": "success",
            "subjectId": subject_id,
            "count": len(chapters),
            "chapters": chapters,
        }
    except Exception as e:
        logger.error("Failed to fetch chapters for subject %s: %s", subject_id, str(e))
        raise HTTPException(status_code=500, detail=f"Failed to fetch chapters: {str(e)}")
