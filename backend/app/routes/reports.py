# app/routes/reports.py
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, time
from typing import Optional
from database import db
from auth.security import get_current_user
from routes.billing import bill_serializer

router = APIRouter(
    prefix="/reports", 
    tags=["Dashboard & Reports"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/dashboard")
async def get_dashboard_stats():
    """Fetches key metrics for the frontend dashboard cards."""
    # Define the time range for "today"
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_end = datetime.combine(datetime.utcnow().date(), time.max)

    # 1. Calculate Today's Revenue (Only counting 'Paid' bills)
    pipeline = [
        {
            "$match": {
                "date_issued": {"$gte": today_start, "$lte": today_end},
                "payment_status": "Paid"
            }
        },
        {
            "$group": {
                "_id": None,
                "total_revenue": {"$sum": "$total_amount"}
            }
        }
    ]
    
    revenue_cursor = db["bills"].aggregate(pipeline)
    revenue_result = await revenue_cursor.to_list(1)
    today_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0.0

    # 2. Count Records
    bills_today = await db["bills"].count_documents({
        "date_issued": {"$gte": today_start, "$lte": today_end}
    })
    total_doctors = await db["doctors"].count_documents({"is_active": True})
    total_patients = await db["patients"].count_documents({})

    return {
        "today_revenue": today_revenue,
        "bills_generated_today": bills_today,
        "active_doctors": total_doctors,
        "total_patients": total_patients
    }

@router.get("/bills")
async def search_bills(
    patient_id: Optional[str] = None, 
    doctor_id: Optional[str] = None
):
    """Search and filter the invoice history."""
    query = {}
    
    # Dynamically build the MongoDB query based on what the user provides
    if patient_id:
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(status_code=400, detail="Invalid Patient ID")
        query["patient_id"] = ObjectId(patient_id)
        
    if doctor_id:
        if not ObjectId.is_valid(doctor_id):
            raise HTTPException(status_code=400, detail="Invalid Doctor ID")
        query["doctor_id"] = ObjectId(doctor_id)

    # Fetch filtered results
    bills = await db["bills"].find(query).sort("date_issued", -1).to_list(100)
    return [bill_serializer(b) for b in bills]