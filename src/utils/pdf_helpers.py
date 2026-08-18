import fitz  # PyMuPDF
from typing import List, Dict, Any

def get_page_dimensions(file_path: str, page_number: int) -> tuple:
    doc = fitz.open(file_path)
    page = doc.load_page(page_number)
    rect = page.rect
    doc.close()
    return rect.width, rect.height

def extract_bbox_text(file_path: str, page_number: int, bbox: List[float]) -> str:
    """Extract text within a specific boundary coordinate box."""
    doc = fitz.open(file_path)
    page = doc.load_page(page_number)
    # bbox format: [x0, y0, x1, y1]
    rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
    text = page.get_text("text", clip=rect)
    doc.close()
    return text.strip()

def filter_header_footers(page_height: float, blocks: List[Dict[str, Any]], margin_pct: float = 0.07) -> List[Dict[str, Any]]:
    """Filters out blocks located in top/bottom header/footer sections of the page height."""
    filtered = []
    top_threshold = page_height * margin_pct
    bottom_threshold = page_height * (1.0 - margin_pct)
    
    for block in blocks:
        y0 = block.get("bbox", [0, 0, 0, 0])[1]
        y1 = block.get("bbox", [0, 0, 0, 0])[3]
        
        # Check if block overlaps header or footer zones
        if y0 < top_threshold or y1 > bottom_threshold:
            continue
        filtered.append(block)
        
    return filtered
