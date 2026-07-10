# app/schemas/billing.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BillCreate(BaseModel):
    patient_id: str
    doctor_id: str
    service_ids: List[str]
    discount: Optional[float] = 0.0

class ServiceSnapshot(BaseModel):
    id: str
    name: str
    cost: float

class BillResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    services: List[ServiceSnapshot]
    consultation_fee: float
    subtotal: float
    tax: float
    discount: float
    total_amount: float
    payment_status: str
    date_issued: datetime   