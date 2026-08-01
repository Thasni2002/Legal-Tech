"""
OCR Service — High-performance multi-engine OCR for legal documents.

Primary Engine:  RapidOCR (ONNX-based — ultra-fast, local, handles images, scans, IDs)
Fallback Engine: Tesseract OCR (if system binary exists)

Supports English + Indian Languages (Hindi, Malayalam, Tamil, Telugu, Kannada, Bengali, etc.)
"""

import io
import os
import platform
import logging
from PIL import Image

logger = logging.getLogger(__name__)

# ── 1. RapidOCR (Primary Engine) ──────────────────────────────────────────────
_RAPID_OCR_ENGINE = None
_RAPID_OCR_AVAILABLE = False

try:
    from rapidocr_onnxruntime import RapidOCR
    _RAPID_OCR_AVAILABLE = True
except ImportError:
    _RAPID_OCR_AVAILABLE = False


def _get_rapid_ocr():
    """Lazy initialize RapidOCR engine instance."""
    global _RAPID_OCR_ENGINE
    if _RAPID_OCR_ENGINE is None and _RAPID_OCR_AVAILABLE:
        try:
            _RAPID_OCR_ENGINE = RapidOCR()
        except Exception as e:
            logger.error(f"RapidOCR initialization error: {e}")
            _RAPID_OCR_ENGINE = None
    return _RAPID_OCR_ENGINE


# ── 2. Tesseract OCR (Secondary Fallback Engine) ─────────────────────────────
import pytesseract

TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"E:\Tesseract-OCR\tesseract.exe",
    r"C:\Tesseract-OCR\tesseract.exe",
]

def _init_tesseract():
    if platform.system() == "Windows":
        for p in TESSERACT_PATHS:
            if os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                return p
    return None

TESSERACT_EXE = _init_tesseract()
ALL_LANGUAGES = "eng+mal+hin+tam+tel+kan+ben+guj+pan+ori+urd+mar+san"


# ── 3. Image Preprocessing ───────────────────────────────────────────────────

def _preprocess(pil_image: Image.Image) -> Image.Image:
    """Preprocess image for optimal OCR extraction."""
    return pil_image.convert("RGB")


# ── 4. Core OCR Engine Dispatcher ────────────────────────────────────────────

def _ocr_image(pil_image: Image.Image, lang: str = ALL_LANGUAGES) -> str:
    """
    Run OCR on a PIL image.
    Uses RapidOCR first (ONNX), falls back to Tesseract if needed.
    """
    img_rgb = _preprocess(pil_image)

    # 1. Primary: RapidOCR Engine (ONNX based - fast & accurate)
    rapid_engine = _get_rapid_ocr()
    if rapid_engine is not None:
        try:
            buf = io.BytesIO()
            img_rgb.save(buf, format="PNG")
            img_bytes = buf.getvalue()
            result, _ = rapid_engine(img_bytes)
            if result:
                lines = [box[1] for box in result if box and len(box) >= 2 and box[1]]
                extracted = "\n".join(lines).strip()
                if extracted:
                    return extracted
        except Exception as e:
            logger.warning(f"RapidOCR processing failed: {e}")

    # 2. Secondary: Tesseract OCR (if installed)
    if TESSERACT_EXE and os.path.exists(TESSERACT_EXE):
        try:
            config = "--oem 3 --psm 3"
            text = pytesseract.image_to_string(img_rgb, lang=lang, config=config)
            if text and text.strip():
                return text.strip()
        except Exception as e:
            logger.warning(f"Tesseract OCR processing failed: {e}")

    return "(No readable text detected in this document)"


# ── 5. Public API ────────────────────────────────────────────────────────────

def extract_text_from_image(file_bytes: bytes, lang: str = ALL_LANGUAGES) -> dict:
    """Extract text from a single image (JPG / PNG / TIFF / BMP / WEBP)."""
    image = Image.open(io.BytesIO(file_bytes))
    text = _ocr_image(image, lang=lang)
    return {
        "extracted_text": text,
        "page_count": 1,
        "languages_used": lang,
    }


def extract_text_from_pdf(file_bytes: bytes, lang: str = ALL_LANGUAGES) -> dict:
    """Convert each PDF page to image, then run OCR."""
    try:
        from pdf2image import convert_from_bytes
    except ImportError:
        return {
            "extracted_text": "pdf2image is not installed.",
            "page_count": 0,
            "languages_used": lang,
            "error": "pdf2image is missing.",
        }

    try:
        pages = convert_from_bytes(file_bytes, dpi=200)
    except Exception as e:
        return {
            "extracted_text": f"PDF Conversion Error: {e}",
            "page_count": 0,
            "languages_used": lang,
        }

    page_texts = []
    for i, page in enumerate(pages, start=1):
        text = _ocr_image(page, lang=lang)
        page_texts.append(f"--- Page {i} ---\n{text}")

    return {
        "extracted_text": "\n\n".join(page_texts),
        "page_count": len(pages),
        "languages_used": lang,
    }


def run_ocr(file_bytes: bytes, content_type: str, lang: str = ALL_LANGUAGES) -> dict:
    """Main OCR dispatcher."""
    pdf_types = {"application/pdf"}
    image_types = {
        "image/jpeg", "image/jpg", "image/png",
        "image/tiff", "image/bmp", "image/webp",
    }

    if content_type in pdf_types:
        return extract_text_from_pdf(file_bytes, lang=lang)
    elif content_type in image_types or content_type.startswith("image/"):
        return extract_text_from_image(file_bytes, lang=lang)
    else:
        return {
            "extracted_text": "",
            "page_count": 0,
            "languages_used": "",
            "error": f"Unsupported file type: {content_type}",
        }
