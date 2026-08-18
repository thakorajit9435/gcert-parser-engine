from typing import List, Dict, Any
import numpy as np

def run_gujarati_ocr(image_array: np.ndarray) -> str:
    """Placeholder function invoking OCR on target numpy image array.
    
    In execution, this loads easyocr/paddleocr Reader for Gujarati script ('gu').
    """
    # reader = easyocr.Reader(['gu', 'en'])
    # result = reader.readtext(image_array, detail=0)
    # return " ".join(result)
    return "મેગ્નેશિયમ પટ્ટીને હવામાં સળગાવતા રાસાયણિક પ્રક્રિયા થાય છે."

def segment_columns(text_blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort blocks to read left-to-right, then top-to-bottom for multi-column layouts."""
    # Sort primarily by horizontal mid-point to separate columns, then vertically
    return sorted(text_blocks, key=lambda b: (b.get("column_index", 0), b.get("bbox", [0,0,0,0])[1]))
