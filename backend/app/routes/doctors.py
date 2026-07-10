# app/routes/doctors.py
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.schemas.doctor import DoctorCreate, DoctorResponse, DoctorUpdate
from app.database import db
from app.auth.security import get_current_user

router = APIRouter(
    prefix="/doctors", 
    tags=["Doctors"],
    dependencies=[Depends(get_current_user)]
)

def doctor_serializer(doctor) -> dict:
    """Helper to convert MongoDB ObjectId to a string."""
    return {
        "id": str(doctor["_id"]),
        "name": doctor["name"],
        "specialization": doctor["specialization"],
        "consultation_fee": doctor["consultation_fee"],
        "is_active": doctor.get("is_active", True)
    }

@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(doctor: DoctorCreate):
    doctor_dict = doctor.model_dump()
    result = await db["doctors"].insert_one(doctor_dict)
    new_doctor = await db["doctors"].find_one({"_id": result.inserted_id})
    return doctor_serializer(new_doctor)

@router.get("/", response_model=list[DoctorResponse])
async def get_doctors():
    doctors = await db["doctors"].find().to_list(100)
    return [doctor_serializer(d) for d in doctors]

@router.put("/{id}", response_model=DoctorResponse)
async def update_doctor(id: str, doctor_update: DoctorUpdate):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Doctor ID format")
    
    update_data = {k: v for k, v in doctor_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")

    result = await db["doctors"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    updated_doctor = await db["doctors"].find_one({"_id": ObjectId(id)})
    return doctor_serializer(updated_doctor)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Doctor ID format")
        
    result = await db["doctors"].delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")