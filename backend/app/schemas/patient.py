# app/schemas/patient.py
from pydantic import BaseModel, Field
from typing import Optional

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    date_of_birth: str 
    address: Optional[str] = None

class PatientResponse(PatientCreate):
    id: str

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None    