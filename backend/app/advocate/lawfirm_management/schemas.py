from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class AdvocateBase(BaseModel):
    advocate_name: str = Field(alias="advocateName")
    bar_council_id: str = Field(alias="barCouncilId")
    enrollment_number: str = Field(alias="enrollmentNumber")
    phone_number: str = Field(alias="phoneNumber")
    email_address: str = Field(alias="emailAddress")
    specialization: str
    city: str
    status: Optional[str] = "Active"

    # New fields
    date_of_birth: Optional[str] = Field(None, alias="dateOfBirth")
    gender: Optional[str] = Field(None, alias="gender")
    aadhaar_number: Optional[str] = Field(None, alias="aadhaarNumber")
    pan_number: Optional[str] = Field(None, alias="panNumber")
    practice_area: Optional[str] = Field(None, alias="practiceArea")
    court_type: Optional[str] = Field(None, alias="courtType")
    years_of_experience: Optional[str] = Field(None, alias="yearsOfExperience")
    languages_known: Optional[str] = Field(None, alias="languagesKnown")
    law_firm_name: Optional[str] = Field(None, alias="lawFirmName")
    state: Optional[str] = Field(None, alias="state")
    pincode: Optional[str] = Field(None, alias="pincode")
    chambers_address: Optional[str] = Field(None, alias="chambersAddress")
    about: Optional[str] = Field(None, alias="about")
    profile_image: Optional[str] = Field(None, alias="profileImage")

    class Config:
        populate_by_name = True
        from_attributes = True


class AdvocateCreate(AdvocateBase):
    pass


class AdvocateUpdate(AdvocateBase):
    pass


class AdvocateOut(AdvocateBase):
    id: int

    class Config:
        populate_by_name = True
        from_attributes = True


class AssignedCaseCreate(BaseModel):
    case_name: Optional[str] = None
    case_number: str
    case_title: str
    advocate_name: str
    practice_area: str
    priority: str
    due_date: str
    assignment_notes: str
    status: Optional[str] = "Active"
    assigned_documents: Optional[List[Dict[str, Any]]] = []


class AssignedCaseOut(AssignedCaseCreate):
    id: int

    class Config:
        from_attributes = True