from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from .service import run_ocr, ALL_LANGUAGES
from .models import OcrResult
from .schemas import OcrResultOut

router = APIRouter(prefix="/ocr", tags=["OCR"])

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
    "image/bmp",
    "image/webp",
    "application/pdf",
}


@router.post("/extract", response_model=OcrResultOut)
async def extract_text(
    file: UploadFile = File(...),
    case_id: Optional[int] = Form(None),
    lang: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload a document (image or PDF) and extract text via Tesseract OCR.

    - **file**: The document file (JPG, PNG, TIFF, BMP, WEBP, PDF)
    - **case_id**: (optional) Link the result to a specific case
    - **lang**: (optional) Override language string, e.g. "eng+mal". Defaults to all Indian languages.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Allowed: JPEG, PNG, TIFF, BMP, WEBP, PDF.",
        )

    file_bytes = await file.read()
    selected_lang = lang or ALL_LANGUAGES

    try:
        result = run_ocr(file_bytes, content_type, lang=selected_lang)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing Error: {str(e)}")

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    record = OcrResult(
        case_id=case_id,
        original_filename=file.filename or "uploaded_file",
        file_type="pdf" if content_type == "application/pdf" else "image",
        extracted_text=result.get("extracted_text", ""),
        languages_used=result.get("languages_used", selected_lang),
        page_count=result.get("page_count", 1),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/results", response_model=List[OcrResultOut])
def get_ocr_results(
    case_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Fetch all OCR results, optionally filtered by case_id."""
    q = db.query(OcrResult)
    if case_id is not None:
        q = q.filter(OcrResult.case_id == case_id)
    return q.order_by(OcrResult.created_at.desc()).all()


@router.get("/results/{result_id}", response_model=OcrResultOut)
def get_ocr_result(result_id: int, db: Session = Depends(get_db)):
    """Get a single OCR result by ID."""
    record = db.query(OcrResult).filter(OcrResult.id == result_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="OCR result not found")
    return record


@router.delete("/results/{result_id}")
def delete_ocr_result(result_id: int, db: Session = Depends(get_db)):
    """Delete an OCR result record."""
    record = db.query(OcrResult).filter(OcrResult.id == result_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="OCR result not found")
    db.delete(record)
    db.commit()
    return {"message": "OCR result deleted successfully"}
