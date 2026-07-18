# app/routes/billing.py
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime
from schemas.billing import BillCreate, BillResponse
from database import db
from auth.security import get_current_user

router = APIRouter(
    prefix="/bills", 
    tags=["Billing"],
    dependencies=[Depends(get_current_user)]
)

def bill_serializer(bill) -> dict:
    return {
        "id": str(bill["_id"]),
        "patient_id": str(bill["patient_id"]),
        "doctor_id": str(bill["doctor_id"]),
        "services": bill["services"],
        "consultation_fee": bill["consultation_fee"],
        "subtotal": bill["subtotal"],
        "tax": bill["tax"],
        "discount": bill["discount"],
        "total_amount": bill["total_amount"],
        "payment_status": bill["payment_status"],
        "date_issued": bill["date_issued"]
    }

@router.post("/", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def create_bill(bill_in: BillCreate):
    # 1. Validate IDs
    if not ObjectId.is_valid(bill_in.patient_id) or not ObjectId.is_valid(bill_in.doctor_id):
        raise HTTPException(status_code=400, detail="Invalid Patient or Doctor ID")

    # 2. Verify Patient Exists
    patient = await db["patients"].find_one({"_id": ObjectId(bill_in.patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 3. Verify Doctor Exists and get their fee
    doctor = await db["doctors"].find_one({"_id": ObjectId(bill_in.doctor_id)})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    consultation_fee = doctor.get("consultation_fee", 0.0)

    # 4. Fetch Services and Build Snapshots
    service_snapshots = []
    services_total = 0.0
    
    for s_id in bill_in.service_ids:
        if not ObjectId.is_valid(s_id):
            raise HTTPException(status_code=400, detail=f"Invalid Service ID: {s_id}")
            
        service = await db["services"].find_one({"_id": ObjectId(s_id)})
        if not service:
            raise HTTPException(status_code=404, detail=f"Service not found: {s_id}")
            
        service_snapshots.append({
            "id": str(service["_id"]),
            "name": service["name"],
            "cost": service["cost"]
        })
        services_total += service["cost"]

    # 5. Calculate Financials
    subtotal = consultation_fee + services_total
    tax_rate = 0.10  # 10% standard tax
    tax_amount = subtotal * tax_rate
    total_amount = subtotal + tax_amount - bill_in.discount

    if total_amount < 0:
        raise HTTPException(status_code=400, detail="Discount cannot exceed subtotal and tax")

    # 6. Prepare Database Document
    bill_doc = {
        "patient_id": ObjectId(bill_in.patient_id),
        "doctor_id": ObjectId(bill_in.doctor_id),
        "services": service_snapshots,
        "consultation_fee": consultation_fee,
        "subtotal": subtotal,
        "tax": tax_amount,
        "discount": bill_in.discount,
        "total_amount": total_amount,
        "payment_status": "Pending",
        "date_issued": datetime.utcnow()
    }

    # 7. Save and Return
    result = await db["bills"].insert_one(bill_doc)
    new_bill = await db["bills"].find_one({"_id": result.inserted_id})
    
    return bill_serializer(new_bill)

@router.get("/", response_model=list[BillResponse])
async def get_all_bills():
    """Retrieve all bills for reporting and dashboard."""
    bills = await db["bills"].find().sort("date_issued", -1).to_list(100)
    return [bill_serializer(b) for b in bills]

@router.get("/{id}", response_model=BillResponse)
async def get_bill_by_id(id: str):
    """Retrieve a specific bill for invoice generation."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Bill ID format")
        
    bill = await db["bills"].find_one({"_id": ObjectId(id)})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    return bill_serializer(bill)

@router.patch("/{id}/pay", response_model=BillResponse)
async def mark_bill_as_paid(id: str):
    """Update the payment status of a bill to Paid."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Bill ID format")
        
    result = await db["bills"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"payment_status": "Paid"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    updated_bill = await db["bills"].find_one({"_id": ObjectId(id)})
    return bill_serializer(updated_bill)    