# app/routes/services.py
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate
from app.database import db
from app.auth.security import get_current_user

router = APIRouter(
    prefix="/services", 
    tags=["Services"],
    dependencies=[Depends(get_current_user)]
)

def service_serializer(service) -> dict:
    """Helper to convert MongoDB ObjectId to a string."""
    return {
        "id": str(service["_id"]),
        "name": service["name"],
        "description": service["description"],
        "cost": service["cost"]
    }

@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(service: ServiceCreate):
    service_dict = service.model_dump()
    result = await db["services"].insert_one(service_dict)
    new_service = await db["services"].find_one({"_id": result.inserted_id})
    return service_serializer(new_service)

@router.get("/", response_model=list[ServiceResponse])
async def get_services():
    services = await db["services"].find().to_list(100)
    return [service_serializer(s) for s in services]

@router.put("/{id}", response_model=ServiceResponse)
async def update_service(id: str, service_update: ServiceUpdate):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID format")
    
    update_data = {k: v for k, v in service_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")

    result = await db["services"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
        
    updated_service = await db["services"].find_one({"_id": ObjectId(id)})
    return service_serializer(updated_service)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID format")
        
    result = await db["services"].delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")