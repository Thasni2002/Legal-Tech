import io
import base64
import numpy as np
import cv2
from PIL import Image
from typing import List, Tuple, Dict, Any, Optional

def _bytes_to_cv2(file_bytes: bytes) -> Optional[np.ndarray]:
    """Convert raw file bytes (JPG, PNG, WEBP, BMP, PDF, etc.) into OpenCV BGR numpy array."""
    try:
        # Check if PDF file
        if file_bytes.startswith(b"%PDF") or file_bytes[:1024].find(b"%PDF") != -1:
            # 1. Primary: pypdfium2 (zero-dependency local PDF renderer)
            try:
                import pypdfium2 as pdfium
                pdf = pdfium.PdfDocument(file_bytes)
                if len(pdf) > 0:
                    page = pdf[0]
                    pil_img = page.render(scale=2).to_pil().convert("RGB")
                    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as e:
                print(f"pypdfium2 error: {e}")

            # 2. Fallback: pdf2image
            try:
                from pdf2image import convert_from_bytes
                pages = convert_from_bytes(file_bytes, first_page=1, last_page=1, dpi=200)
                if pages:
                    pil_img = pages[0].convert("RGB")
                    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as e:
                print(f"pdf2image error: {e}")
                return None

        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            # Try PIL fallback
            pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        return img
    except Exception as e:
        print(f"Error loading image bytes: {e}")
        return None


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Order 4 points in top-left, top-right, bottom-right, bottom-left order.
    pts shape: (4, 2)
    """
    rect = np.zeros((4, 2), dtype="float32")

    # Top-left has smallest sum, bottom-right has largest sum
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # Top-right has smallest difference (y - x), bottom-left has largest difference
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect


def detect_document_corners(file_bytes: bytes) -> Dict[str, Any]:
    """
    Detect document boundary corners in image/pdf page using edge detection and contour analysis.
    Returns width, height, original image Base64 data URI (for rendering PDF/raw image in frontend),
    and corners in percentage coords [[x%, y%], ...] for TL, TR, BR, BL.
    """
    img = _bytes_to_cv2(file_bytes)
    if img is None:
        raise ValueError("Could not decode image or PDF file. Please ensure valid document upload.")

    orig_h, orig_w = img.shape[:2]

    # Render base64 original preview string (especially useful for PDF files)
    is_success, orig_buffer = cv2.imencode(".png", img)
    orig_b64 = ""
    if is_success:
        orig_b64 = f"data:image/png;base64,{base64.b64encode(orig_buffer).decode('utf-8')}"

    # Resize image for faster contour analysis
    target_height = 800.0
    scale = target_height / float(orig_h)
    new_w = int(orig_w * scale)
    new_h = int(target_height)

    resized = cv2.resize(img, (new_w, new_h))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Edge detection combinations
    edged = cv2.Canny(blurred, 50, 200)

    # Morphological closing to seal gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    closed = cv2.morphologyEx(edged, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    doc_cnt = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)

        if len(approx) == 4:
            doc_cnt = approx
            break

    # If no 4-point contour found, fallback to convex hull / bounding rect inset
    if doc_cnt is None and len(contours) > 0:
        hull = cv2.convexHull(contours[0])
        peri = cv2.arcLength(hull, True)
        approx = cv2.approxPolyDP(hull, 0.03 * peri, True)
        if len(approx) == 4:
            doc_cnt = approx

    if doc_cnt is not None:
        pts = doc_cnt.reshape(4, 2) / scale
        ordered_pts = order_points(pts)
    else:
        # Fallback corners with 5% inset padding
        pad_x = orig_w * 0.05
        pad_y = orig_h * 0.05
        ordered_pts = np.array([
            [pad_x, pad_y],
            [orig_w - pad_x, pad_y],
            [orig_w - pad_x, orig_h - pad_y],
            [pad_x, orig_h - pad_y]
        ], dtype="float32")

    # Convert to percentages for frontend scaling
    corners_pct = [
        {"x": round(float((pt[0] / orig_w) * 100.0), 2), "y": round(float((pt[1] / orig_h) * 100.0), 2)}
        for pt in ordered_pts
    ]

    return {
        "width": orig_w,
        "height": orig_h,
        "original_preview_b64": orig_b64,
        "corners": corners_pct,
        "message": "Document boundary detected successfully."
    }


def four_point_transform(img: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """
    Perform 4-point perspective warp transform on OpenCV image matrix.
    pts shape: (4, 2) in pixels [TL, TR, BR, BL]
    """
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    # Compute width of new image
    width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_width = max(int(width_a), int(width_b))

    # Compute height of new image
    height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_height = max(int(height_a), int(height_b))

    # Ensure minimum valid dimensions
    max_width = max(max_width, 100)
    max_height = max(max_height, 100)

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    # Calculate perspective transform matrix and apply warp
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(img, M, (max_width, max_height))
    return warped


def remove_shadows(img: np.ndarray) -> np.ndarray:
    """Remove uneven shadows and background gradients from document image."""
    rgb_planes = cv2.split(img)
    result_planes = []
    for plane in rgb_planes:
        dilated_img = cv2.dilate(plane, np.ones((7, 7), np.uint8))
        bg_img = cv2.medianBlur(dilated_img, 21)
        diff_img = 255 - cv2.absdiff(plane, bg_img)
        norm_img = cv2.normalize(diff_img, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8UC1)
        result_planes.append(norm_img)
    return cv2.merge(result_planes)


def apply_enhancements(
    img: np.ndarray,
    preset: str = "scanned",
    auto_contrast: bool = False,
    brightness: int = 0,
    contrast: int = 0,
    sharpness: int = 0,
    noise_reduction: bool = False,
    shadow_removal: bool = False,
    rotation: int = 0
) -> np.ndarray:
    """Apply document enhancement filters and transformations to warped OpenCV image."""
    out = img.copy()

    # 1. Rotation
    if rotation == 90:
        out = cv2.rotate(out, cv2.ROTATE_90_CLOCKWISE)
    elif rotation == 180:
        out = cv2.rotate(out, cv2.ROTATE_180)
    elif rotation == 270:
        out = cv2.rotate(out, cv2.ROTATE_90_COUNTERCLOCKWISE)

    # 2. Shadow Removal
    if shadow_removal:
        out = remove_shadows(out)

    # 3. Preset Processing
    if preset == "scanned":
        # Scanner preset: boost white balance, clean background slightly while keeping full original colors/logos
        lab = cv2.cvtColor(out, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
        l = clahe.apply(l)
        out = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)
    elif preset == "bw":
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
        if auto_contrast:
            gray = cv2.equalizeHist(gray)
        bw = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 11
        )
        out = cv2.cvtColor(bw, cv2.COLOR_GRAY2BGR)
    elif preset == "grayscale":
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
        out = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    # 4. Auto Contrast (CLAHE on color image if explicitly requested)
    if auto_contrast and preset != "bw":
        lab = cv2.cvtColor(out, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        l = clahe.apply(l)
        out = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

    # 5. Brightness & Contrast Adjustments
    if brightness != 0 or contrast != 0:
        # contrast (-100 to 100) -> alpha (0.5 to 1.5)
        alpha = (contrast + 100) / 100.0 if contrast >= 0 else (contrast + 100) / 100.0
        alpha = max(0.2, min(3.0, alpha))
        # brightness (-100 to 100) -> beta
        beta = brightness * 1.5
        out = cv2.convertScaleAbs(out, alpha=alpha, beta=beta)

    # 6. Sharpness Filter
    if sharpness > 0:
        factor = 0.5 + (sharpness / 50.0)
        gaussian_blur = cv2.GaussianBlur(out, (0, 0), 3)
        out = cv2.addWeighted(out, 1.0 + factor, gaussian_blur, -factor, 0)

    # 7. Noise Reduction
    if noise_reduction:
        out = cv2.bilateralFilter(out, d=7, sigmaColor=50, sigmaSpace=50)

    return out


def scan_document(
    file_bytes: bytes,
    corners_pct: Optional[List[Dict[str, float]]] = None,
    preset: str = "scanned",
    auto_contrast: bool = False,
    brightness: int = 0,
    contrast: int = 0,
    sharpness: int = 0,
    noise_reduction: bool = False,
    shadow_removal: bool = False,
    rotation: int = 0
) -> Dict[str, Any]:
    """
    Process document: load image/PDF page, apply perspective warp using provided or auto-detected corners,
    apply image enhancements, and return Base64 scanned result.
    """
    img = _bytes_to_cv2(file_bytes)
    if img is None:
        raise ValueError("Could not decode image or PDF file. Please verify uploaded document.")

    orig_h, orig_w = img.shape[:2]

    # Use provided corners or auto detect
    if not corners_pct or len(corners_pct) != 4:
        detection = detect_document_corners(file_bytes)
        corners_pct = detection["corners"]

    # Convert percentage corners back to pixel coordinates
    pts_px = np.array([
        [(c["x"] / 100.0) * orig_w, (c["y"] / 100.0) * orig_h]
        for c in corners_pct
    ], dtype="float32")

    # Perspective warp
    warped = four_point_transform(img, pts_px)

    # Apply enhancement pipeline
    enhanced = apply_enhancements(
        warped,
        preset=preset,
        auto_contrast=auto_contrast,
        brightness=brightness,
        contrast=contrast,
        sharpness=sharpness,
        noise_reduction=noise_reduction,
        shadow_removal=shadow_removal,
        rotation=rotation
    )

    # Encode result to PNG Base64 Data URI
    is_success, buffer = cv2.imencode(".png", enhanced)
    if not is_success:
        raise ValueError("Failed to encode processed image")

    b64_str = base64.b64encode(buffer).decode("utf-8")
    data_uri = f"data:image/png;base64,{b64_str}"

    out_h, out_w = enhanced.shape[:2]

    return {
        "scanned_image_b64": data_uri,
        "width": out_w,
        "height": out_h,
        "corners": corners_pct
    }
