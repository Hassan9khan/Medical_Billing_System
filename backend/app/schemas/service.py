# app/schemas/service.py
from pydantic import BaseModel
from typing import Optional

class ServiceCreate(BaseModel):
    name: str
    description: str
    cost: float

class ServiceResponse(ServiceCreate):
    id: str

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None