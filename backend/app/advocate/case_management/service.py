from sqlalchemy.orm import Session
import json
from datetime import datetime

from .models import Case
from .schemas import CaseCreate, CaseUpdate


def create_case(db: Session, data: CaseCreate):

    new_case = Case(
        case_id=data.caseId,
        case_title=data.caseTitle,
        case_no=data.caseNo,
        case_type=data.caseType,
        case_description=data.caseDes,

        client_name=data.clientName,
        contact_number=data.contactNumber,
        email_id=data.emailId,

        court_name=data.courtName,
        court_type=data.courtType,

        status=data.status,

        selected_advocate=data.selectedAdvocate,
        documents=json.dumps(
            [doc.dict() for doc in data.documents]
        ) if data.documents else "[]",
        next_hearing_date=data.nextHearingDate,
        cnr_number=data.cnrNumber
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    if isinstance(new_case.documents, str):
        new_case.documents = json.loads(new_case.documents or "[]")

    return new_case


def get_all_cases(db: Session):
    cases = db.query(Case).all()

    for case in cases:
        if isinstance(case.documents, str):
            case.documents = json.loads(case.documents or "[]")

    return cases


def get_case(db: Session, case_id: int):
    case = db.query(Case).filter(Case.id == case_id).first()

    if case:
        if isinstance(case.documents, str):
            case.documents = json.loads(case.documents or "[]")

    return case


def update_case(db: Session, case_id: int, data: CaseUpdate):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        return None

    if data.caseId is not None:
        case.case_id = data.caseId
    if data.caseTitle is not None:
        case.case_title = data.caseTitle
    if data.caseNo is not None:
        case.case_no = data.caseNo
    if data.caseType is not None:
        case.case_type = data.caseType
    if data.caseDes is not None:
        case.case_description = data.caseDes
    if data.clientName is not None:
        case.client_name = data.clientName
    if data.contactNumber is not None:
        case.contact_number = data.contactNumber
    if data.emailId is not None:
        case.email_id = data.emailId
    if data.courtName is not None:
        case.court_name = data.courtName
    if data.courtType is not None:
        case.court_type = data.courtType
    if data.status is not None:
        case.status = data.status
        try:
            from app.advocate.lawfirm_management.models import AssignedCase
            assigned_cases = db.query(AssignedCase).filter(
                (AssignedCase.case_id == case.id) |
                ((AssignedCase.case_id == None) & (AssignedCase.case_number == case.case_no))
            ).all()
            for ac in assigned_cases:
                if ac.case_id is None:
                    ac.case_id = case.id
                if data.status == "Pending":
                    ac.status = "In Progress"
                elif data.status == "Closed":
                    ac.status = "Closed"
                else:
                    ac.status = data.status
        except Exception as e:
            print(f"Error synchronizing case status to assignment: {e}")
    if data.selectedAdvocate is not None:
        case.selected_advocate = data.selectedAdvocate
        try:
            from app.advocate.lawfirm_management.models import AssignedCase
            if not data.selectedAdvocate:
                db.query(AssignedCase).filter(
                    (AssignedCase.case_id == case.id) |
                    ((AssignedCase.case_id == None) & (AssignedCase.case_number == case.case_no))
                ).delete(synchronize_session=False)
            else:
                assigned_cases = db.query(AssignedCase).filter(
                    (AssignedCase.case_id == case.id) |
                    ((AssignedCase.case_id == None) & (AssignedCase.case_number == case.case_no))
                ).all()
                for ac in assigned_cases:
                    ac.advocate_name = data.selectedAdvocate
                    if ac.case_id is None:
                        ac.case_id = case.id
        except Exception as e:
            print(f"Error synchronizing advocate on case update: {e}")
    if data.documents is not None:
        case.documents = json.dumps(
            [doc.dict() for doc in data.documents]
        )
        try:
            from app.advocate.lawfirm_management.models import AssignedCase
            assigned_cases = db.query(AssignedCase).filter(
                (AssignedCase.case_id == case.id) |
                ((AssignedCase.case_id == None) & (AssignedCase.case_number == case.case_no))
            ).all()
            for ac in assigned_cases:
                if ac.case_id is None:
                    ac.case_id = case.id
                ac.assigned_documents = case.documents
        except Exception as e:
            print(f"Error synchronizing document permissions: {e}")
    if data.nextHearingDate is not None:
        case.next_hearing_date = data.nextHearingDate
    if data.cnrNumber is not None:
        case.cnr_number = data.cnrNumber

    case.updated_at = datetime.utcnow()

    if isinstance(case.documents, (list, dict)):
        case.documents = json.dumps(case.documents)

    db.commit()
    db.refresh(case)

    if isinstance(case.documents, str):
        case.documents = json.loads(case.documents or "[]")

    return case


def delete_case(db: Session, case_id: int):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        return None

    db.delete(case)
    db.commit()

    return case


def generate_legal_document(db: Session, case_id: int, user_prompt: str):
    import os
    import google.generativeai as genai
    from fastapi import HTTPException

    case = get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured in backend")

    genai.configure(api_key=api_key)
    
    # Construct prompt with case context
    context = f"""
    Case Title: {case.case_title}
    Case Number: {case.case_no}
    Case Type: {case.case_type}
    Client Name: {case.client_name}
    Court: {case.court_name} ({case.court_type})
    Case Description: {case.case_description}
    Status: {case.status}
    """
    
    full_prompt = f"""
You are an expert legal assistant. Use the following context about a legal case to generate the requested document. 
Format the output in clean Markdown. Include appropriate placeholders like [Signature] or [Date] where necessary.

Context:
{context}

User Request:
{user_prompt}
"""

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(full_prompt)
        return {"document": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


def ask_ai_assistant(db: Session, user_query: str, user_role: str = None, advocate_name: str = None, client_name: str = None):
    import os
    import json
    from datetime import datetime
    import google.generativeai as genai
    from fastapi import HTTPException
    
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured in backend")
        
    genai.configure(api_key=api_key)
    
    # Fetch cases and apply role-based filtering
    cases = get_all_cases(db)
    if user_role == "Junior Advocate" and advocate_name:
        cases = [c for c in cases if c.selected_advocate == advocate_name]
    
    if client_name:
        client_name_lower = client_name.strip().lower()
        cases = [c for c in cases if c.client_name and (client_name_lower in c.client_name.strip().lower() or c.client_name.strip().lower() in client_name_lower)]
    
    context_lines = []
    for case in cases:
        case_info = f"Case Title: {case.case_title} | Case No: {case.case_no} | Status: {case.status} | Client: {case.client_name} (Phone: {case.contact_number}, Email: {case.email_id}) | Court: {case.court_name} | Next Hearing: {case.next_hearing_date or 'Not scheduled'}"
        
        doc_info = "Documents: None"
        if case.documents:
            try:
                docs = case.documents if isinstance(case.documents, list) else json.loads(case.documents)
                if docs:
                    doc_names = [f"{d.get('file', 'Unknown')} ({d.get('documentType', 'Unknown type')})" for d in docs]
                    doc_info = "Documents: " + ", ".join(doc_names)
            except Exception:
                pass
                
        context_lines.append(f"- {case_info} | {doc_info}")
        
    context_block = "\n".join(context_lines)

    # Fetch billing and consultation data if client context is active
    invoices_context = ""
    consultations_context = ""
    
    if client_name:
        try:
            from app.advocate.finance_management.models import Invoice
            # Query invoices matching client_name
            invoices = db.query(Invoice).all()
            matched_invoices = [inv for inv in invoices if inv.client_name and (client_name_lower in inv.client_name.strip().lower() or inv.client_name.strip().lower() in client_name_lower)]
            if matched_invoices:
                inv_lines = []
                for inv in matched_invoices:
                    inv_lines.append(f"- Invoice ID: {inv.id} | Amount: ₹{inv.grand_total} | Status: {inv.status} | Date: {inv.created_at.strftime('%Y-%m-%d') if inv.created_at else 'N/A'} | Method: {inv.payment_method or 'N/A'}")
                invoices_context = "\n".join(inv_lines)
            else:
                invoices_context = "No invoices found."
        except Exception as e:
            invoices_context = f"Error fetching invoices: {str(e)}"
            
        try:
            from app.advocate.consultations.models import Consultation
            # Query consultations matching client_name
            consultations = db.query(Consultation).all()
            matched_consultations = [con for con in consultations if con.client_name and (client_name_lower in con.client_name.strip().lower() or con.client_name.strip().lower() in client_name_lower)]
            if matched_consultations:
                cons_lines = []
                for con in matched_consultations:
                    cons_lines.append(f"- Consultation ID: {con.id} | Issue: {con.issue or 'N/A'} | Status: {con.status} | Date: {con.date} {con.time} | Type: {con.type} | Summary: {con.summary or 'No summary'}")
                consultations_context = "\n".join(cons_lines)
            else:
                consultations_context = "No consultations found."
        except Exception as e:
            consultations_context = f"Error fetching consultations: {str(e)}"

    client_info_block = ""
    if client_name:
        client_info_block = f"""
Context (Client Specific Invoices & Billing):
{invoices_context}

Context (Client Specific Consultations & Discussions):
{consultations_context}
"""

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    full_prompt = f"""
You are an expert AI Legal Assistant for an advocate. You have access to the following context about the law firm's cases, clients, and documents.
Answer the user's question accurately based ONLY on this context. 

Current Date and Time: {current_time}
Scheduler Logic: Automatic reminders are sent to clients and advocates exactly 5, 2, and 1 days before the Next Hearing Date. Use the current date to deduce if reminders have been sent.

Drafting: If the user asks you to draft a legal document (e.g., a notice), write out the full draft using professional legal formatting in Markdown, filling in details from the context.

Action Taking (Function Calling): 
If the user explicitly asks you to UPDATE the status of a case, you MUST return ONLY a JSON object (without any markdown formatting or extra text) in the following exact format:
{{
  "action": "update_status",
  "case_no": "insert_case_no_here",
  "new_status": "insert_new_status_here (Active, Pending, or Closed)",
  "reply": "I have successfully updated the status of the case to [status]."
}}
DO NOT return JSON unless an action is requested. If no action is requested, answer normally in markdown.

Context (Cases):
{context_block}
{client_info_block}

User Question:
{user_query}
"""

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(full_prompt)
        response_text = response.text.strip()
        
        # Check if the response is our JSON action format
        if response_text.startswith("{") and response_text.endswith("}") and '"action"' in response_text:
            try:
                action_data = json.loads(response_text)
                if action_data.get("action") == "update_status":
                    case_no = action_data.get("case_no")
                    new_status = action_data.get("new_status")
                    
                    # Execute database update
                    case_to_update = db.query(Case).filter(Case.case_no == case_no).first()
                    if case_to_update:
                        case_to_update.status = new_status
                        db.commit()
                        return {"response": action_data.get("reply", "Status updated successfully.")}
                    else:
                        return {"response": f"Failed to update: Could not find case with number {case_no}."}
            except json.JSONDecodeError:
                pass # Fall back to normal text if parsing fails
                
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Assistant failed: {str(e)}")


# Document templates configuration for the "Document Format Generate" feature
DOCUMENT_TEMPLATES = {
    "name_change_affidavit": {
        "name": "Name Change Affidavit",
        "description": "Scaffolds an affidavit declaring a change of name for official gazette publication.",
        "fields": ["client_name", "father_spouse_name", "age", "address", "city", "old_name", "new_name", "date"],
        "template": """AFFIDAVIT FOR CHANGE OF NAME

I, {{client_name}}, son/daughter of {{father_spouse_name}}, aged {{age}} years, residing at {{address}}, {{city}}, do hereby solemnly affirm and state on oath as follows:

1. That my birth name was {{old_name}}, which is recorded in my official documents.
2. That I have recently changed my name to {{new_name}} for personal/professional reasons.
3. That I declare that {{old_name}} and {{new_name}} refer to one and the same person, i.e., myself.

VERIFICATION
Verified at {{city}} on this {{date}} that the contents of this affidavit are true to my knowledge.
"""
    },
    "vakalatnama": {
        "name": "Vakalatnama",
        "description": "Authorizes an advocate to represent the client in court.",
        "fields": ["client_name", "opposite_party", "case_number", "court_name", "advocate_name"],
        "template": """VAKALATNAMA

IN THE COURT OF {{court_name}}
Case No. {{case_number}} of 2026

Between:
{{client_name}} ... Petitioner/Plaintiff
AND
{{opposite_party}} ... Respondent/Defendant

I, {{client_name}}, do hereby appoint and authorize Advocate {{advocate_name}} to appear, plead, and act for me in the above-mentioned case.
"""
    },
    "general_affidavit": {
        "name": "General Affidavit",
        "description": "A general-purpose sworn statement to declare facts under oath.",
        "fields": ["client_name", "father_spouse_name", "age", "address", "city", "declarations", "date"],
        "template": """GENERAL AFFIDAVIT

I, {{client_name}}, son/daughter of {{father_spouse_name}}, aged {{age}} years, residing at {{address}}, {{city}}, do hereby solemnly affirm and state on oath as follows:

{{declarations}}

VERIFICATION
Verified at {{city}} on this {{date}} that the contents of this affidavit are true to my knowledge and belief.
"""
    }
}


def get_document_formats():
    return DOCUMENT_TEMPLATES


def generate_document_from_format(db: Session, case_id: int, template_key: str, draft_text: str):
    import os
    import json
    import google.generativeai as genai
    from fastapi import HTTPException
    from .models import UploadedFile
    from sqlalchemy import text as sql_text

    template_info = DOCUMENT_TEMPLATES.get(template_key)
    if not template_info:
        raise HTTPException(status_code=400, detail="Invalid template key")

    case = get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Read case metadata before expunging
    case_no = case.case_no
    court_name = case.court_name
    case_title = case.case_title
    selected_advocate = case.selected_advocate
    filename_base = case_no

    # Expunge the case from the session immediately to prevent SQLAlchemy from
    # trying to flush the `documents` field (which may be a Python list/dict
    # that pymysql cannot serialize) when we later call db.commit().
    db.expunge(case)

    # Call Gemini to polish the user's draft_text
    # Falls back to raw draft_text if Gemini is unavailable or misconfigured
    polished_text = draft_text  # default fallback
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            prompt = f"""
You are an expert legal assistant. Use the following context about a case and the user's raw draft text to generate a highly polished, professional, legally-sound document in clean Markdown. Preserve all factual names, addresses, dates, and terms specified in the raw draft. Do not add any conversational text before or after the document text.

Case Context:
Case Number: {case_no}
Court Name: {court_name}
Case Title: {case_title}

User Raw Draft Text:
{draft_text}
"""
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            if response and response.text:
                polished_text = response.text.strip()
    except Exception:
        # Fallback to raw text if AI fails — do not raise HTTP error
        polished_text = draft_text

    # Create UploadedFile record
    filename = f"{template_info['name'].replace(' ', '_')}_{filename_base}.md"
    db_file = UploadedFile(
        filename=filename,
        content_type="text/markdown",
        data=polished_text.encode('utf-8')
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    file_url = f"http://localhost:8000/case-management/documents/{db_file.id}"

    # Read the current documents directly via raw SQL to avoid ORM deserialization issues
    row = db.execute(
        sql_text("SELECT documents FROM case_management_cases WHERE id = :cid"),
        {"cid": case_id}
    ).fetchone()

    current_docs = []
    if row and row[0]:
        try:
            raw = row[0]
            current_docs = json.loads(raw) if isinstance(raw, str) else list(raw)
        except Exception:
            current_docs = []

    new_doc_obj = {
        "documentType": template_info["name"],
        "advocate": selected_advocate or "System",
        "file": filename,
        "url": file_url,
        "view": True,
        "upload": True,
        "edit": False,
        "delete": False,
    }
    current_docs.append(new_doc_obj)
    docs_json = json.dumps(current_docs)

    # Update documents via raw SQL to avoid pymysql dict serialization issue
    db.execute(
        sql_text("UPDATE case_management_cases SET documents = :docs WHERE id = :cid"),
        {"docs": docs_json, "cid": case_id}
    )
    db.commit()

    return {
        "success": True,
        "document": polished_text,
        "file_url": file_url,
        "filename": filename,
    }
