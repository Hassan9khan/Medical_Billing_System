# app/routes/patients.py
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from database import db
from auth.security import get_current_user

# We will eventually protect these routes with our JWT, but let's test them openly first.
# router = APIRouter(prefix="/patient", tags=["Patient"])
router = APIRouter(
    prefix="/patients", 
    tags=["Patients"],
    dependencies=[Depends(get_current_user)] 
)

def patient_serializer(patient) -> dict:
    """Helper to convert MongoDB ObjectId to a string."""
    return {
        "id": str(patient["_id"]),
        "first_name": patient["first_name"],
        "last_name": patient["last_name"],
        "phone": patient["phone"],
        "date_of_birth": patient["date_of_birth"],
        "address": patient.get("address")
    }

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate):
    # Convert schema to dict
    patient_dict = patient.model_dump()
    
    # Insert into MongoDB
    result = await db["patients"].insert_one(patient_dict)
    
    # Fetch the newly created patient to return it
    new_patient = await db["patients"].find_one({"_id": result.inserted_id})
    return patient_serializer(new_patient)

@router.get("/", response_model=list[PatientResponse])
async def get_patient():
    # Fetch up to 100 patient
    patient = await db["patients"].find().to_list(100)
    return [patient_serializer(p) for p in patient]

@router.put("/{id}", response_model=PatientResponse)
async def update_patient(id: str, patient_update: PatientUpdate):
    # 1. Validate ObjectId
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Patient ID format")
    
    # 2. Drop None values so we don't overwrite existing data with nulls
    update_data = {k: v for k, v in patient_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")

    # 3. Perform the update
    result = await db["patients"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # 4. Fetch and return the updated document
    updated_patient = await db["patients"].find_one({"_id": ObjectId(id)})
    return patient_serializer(updated_patient)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Patient ID format")
        
    result = await db["patients"].delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")