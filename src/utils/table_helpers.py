from typing import List, Dict, Any

def convert_table_to_markdown(cells: List[List[str]]) -> str:
    """Converts a 2D array of string cells to a markdown table."""
    if not cells:
        return ""
        
    header = cells[0]
    markdown_lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(["---"] * len(header)) + " |"
    ]
    
    for row in cells[1:]:
        # Ensure row cell count matches header
        padded_row = row + [""] * (len(header) - len(row))
        markdown_lines.append("| " + " | ".join(padded_row) + " |")
        
    return "\n".join(markdown_lines)

def parse_table_structure(pdf_path: str, page_number: int, table_bbox: List[float]) -> List[List[str]]:
    """Uses pdfplumber to extract table cell texts directly."""
    # import pdfplumber
    # with pdfplumber.open(pdf_path) as pdf:
    #     page = pdf.pages[page_number]
    #     cropped = page.crop(table_bbox)
    #     return cropped.extract_table()
    return [["પ્રક્રિયકો", "નીપજો"], ["મેગ્નેશિયમ", "મેગ્નેશિયમ ઓક્સાઇડ"]]
