# app/schemas/doctor.py
from pydantic import BaseModel
from typing import Optional

class DoctorCreate(BaseModel):
    name: str
    specialization: str
    consultation_fee: float
    is_active: Optional[bool] = True

class DoctorResponse(DoctorCreate):
    id: str

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    consultation_fee: Optional[float] = None
    is_active: Optional[bool] = None