import unicodedata
import fitz  # PyMuPDF
import subprocess
import tempfile
import os
from src.core.logger import logger
from src.core.exceptions import OCRProcessingError

class Step03OCR:
    def run(self, context: dict) -> None:
        logger.info(f"[%s] Pipeline Step 3: Extracting text from PDF...", context["job_id"])
        
        pdf_path = context.get("file_path")
        if not pdf_path:
            raise OCRProcessingError("PDF file path missing in context.")
            
        try:
            logger.info(f"[%s] Opening PDF file: {pdf_path}", context["job_id"])
            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            logger.info(f"[%s] PDF loaded successfully. Total pages: {total_pages}", context["job_id"])
            
            import re
            guj_regex = re.compile(r'[\u0A80-\u0AFF]')

            extracted_text_list = []
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                page_text = page.get_text("text")
                
                # Check for legacy non-Unicode font gibberish in Gujarati PDFs
                guj_count = len(guj_regex.findall(page_text))
                total_chars = len(page_text.strip())
                ratio = guj_count / total_chars if total_chars > 0 else 0
                
                # If page contains no selectable text OR contains legacy font gibberish, fallback to Tesseract OCR
                if not page_text.strip() or ratio < 0.25:
                    logger.info(f"[%s] Page {page_num+1} has missing or font-gibberish text (guj_ratio={ratio:.2f}). Running Tesseract OCR...", context["job_id"])
                    # Render page to high-quality pixmap (3x zoom for higher OCR accuracy)
                    pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
                    
                    # Save to temp PNG file
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_img:
                        temp_img_name = temp_img.name
                        pix.save(temp_img_name)
                        
                    try:
                        # Call local Tesseract engine with workspace tessdata directory
                        from config.settings import settings
                        tessdata_dir = str(settings.BASE_DIR / "tessdata")
                        cmd = ["tesseract", temp_img_name, "stdout", "--tessdata-dir", tessdata_dir, "-l", "guj"]
                        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8")
                        if result.returncode == 0:
                            page_text = result.stdout
                            logger.info(f"[%s] Tesseract OCR successfully extracted {len(page_text)} chars from Page {page_num+1}", context["job_id"])
                        else:
                            logger.error(f"[%s] Tesseract failed on Page {page_num+1}: {result.stderr}", context["job_id"])
                    except Exception as e:
                        logger.error(f"[%s] Failed to run Tesseract on Page {page_num+1}: {str(e)}", context["job_id"])
                    finally:
                        if os.path.exists(temp_img_name):
                            os.remove(temp_img_name)
                            
                # Add a page marker before each page's text so the LLM can detect page numbers
                page_marker = f"\n\n--- PAGE {page_num + 1} ---\n"
                if page_text:
                    extracted_text_list.append(page_marker + page_text)
                else:
                    # Even pages with no text get a marker (e.g. image-only QR scanner pages)
                    extracted_text_list.append(page_marker + "[IMAGE/SCANNER PAGE]")
                    
            raw_text = "\n".join(extracted_text_list)
            
            if not any(t.strip() and "[IMAGE/SCANNER PAGE]" not in t for t in extracted_text_list):
                logger.warning(f"[%s] No text extracted (neither raw text nor OCR text).", context["job_id"])
                raise OCRProcessingError("No text could be extracted from this PDF. Please check if it is empty or corrupted.")
                
            # Normalize unicode to fix compound letters/diacritics in Gujarati
            normalized_text = unicodedata.normalize('NFKC', raw_text)
            
            logger.info(f"[%s] Unicode extraction completed. Character count: {len(normalized_text)}", context["job_id"])
            context["extracted_raw_text"] = normalized_text
            
        except Exception as e:
            logger.error(f"[%s] PDF Text extraction failed: {str(e)}", context["job_id"])
            raise OCRProcessingError(f"PDF Text extraction failed: {str(e)}")
