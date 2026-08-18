import fitz
from firebase_admin import storage
from config.settings import settings

def crop_and_export_image(pdf_path: str, page_number: int, bbox: list, output_path: str) -> None:
    """Crops an image block bounding box and writes it to a local output path."""
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_number)
    rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
    pix = page.get_pixmap(clip=rect, dpi=300)
    pix.save(output_path)
    doc.close()

def upload_image_to_firebase(local_path: str, destination_blob_name: str) -> str:
    """Uploads local image assets to Firebase Storage bucket and returns public access URL."""
    bucket = storage.bucket(name=settings.FIREBASE_STORAGE_BUCKET)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(local_path)
    
    # Make readable publicly if rules require or generate signed URL
    blob.make_public()
    return blob.public_url
