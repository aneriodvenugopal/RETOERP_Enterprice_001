from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from typing import List, Optional
from datetime import datetime
import uuid
import math

from models.workforce import (
    WorkforceWorker,
    WorkforceWorkerCreate,
    WorkforceWorkerUpdate,
    WorkforceSearchParams
)
from middleware.auth import get_current_user, require_saas_admin
from services.workforce_scraper import workforce_scraper

router = APIRouter()

def get_db(request: Request):
    return request.app.state.db

# Haversine formula for distance calculation
def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in kilometers"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

# PUBLIC ENDPOINTS

@router.get("/workforce/search", response_model=List[WorkforceWorker])
async def search_workforce(
    request: Request,
    skill_type: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = 20,
    min_experience: Optional[int] = None,
    work_type: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """
    PUBLIC: Search construction workers by skill, location, and filters
    """
    db = get_db(request)
    
    # Build query
    query = {"status": "approved"}  # Only show approved workers
    
    if skill_type:
        query["skill_type"] = {"$regex": skill_type, "$options": "i"}
    
    if city:
        query["location.city"] = {"$regex": city, "$options": "i"}
    
    if state:
        query["location.state"] = {"$regex": state, "$options": "i"}
    
    if min_experience:
        query["experience_years"] = {"$gte": min_experience}
    
    if work_type:
        query["work_type"] = work_type
    
    # Fetch workers
    workers = await db.workforce_workers.find(query).skip(skip).limit(limit).to_list(length=None)
    
    # Apply geo-location filtering if coordinates provided
    if lat and lng:
        filtered_workers = []
        for worker in workers:
            worker_lat = worker["location"]["lat"]
            worker_lng = worker["location"]["lng"]
            distance = calculate_distance(lat, lng, worker_lat, worker_lng)
            
            if distance <= radius_km:
                worker["distance_km"] = round(distance, 2)
                filtered_workers.append(worker)
        
        # Sort by distance
        filtered_workers.sort(key=lambda x: x.get("distance_km", 999))
        return [WorkforceWorker(**w) for w in filtered_workers]
    
    return [WorkforceWorker(**w) for w in workers]

@router.post("/workforce/add", response_model=WorkforceWorker)
async def add_worker_public(
    request: Request,
    worker_data: WorkforceWorkerCreate
):
    """
    PUBLIC: Submit new worker to database (pending approval)
    """
    db = get_db(request)
    # Create worker document
    worker = {
        "id": str(uuid.uuid4()),
        **worker_data.dict(),
        "status": "pending",
        "source": "user_submitted",
        "verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Check for duplicate phone number
    existing = await db.workforce_workers.find_one({"phone": worker_data.phone})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker with this phone number already exists"
        )
    
    # Insert to database
    await db.workforce_workers.insert_one(worker)
    
    return WorkforceWorker(**worker)

@router.get("/workforce/skills", response_model=List[str])
async def get_skill_types():
    """
    PUBLIC: Get list of available skill types
    """
    skills = [
        "Carpenter",
        "Electrician",
        "Mason",
        "Painter",
        "POP Worker",
        "JCB Operator",
        "Borewell Worker",
        "Tiles Mason",
        "Fabrication Worker",
        "Plumber",
        "Welder",
        "Helper",
        "Supervisor",
        "Contractor",
        "Architect",
        "Interior Designer"
    ]
    return skills

@router.get("/workforce/cities", response_model=List[str])
async def get_cities(request: Request):
    """
    PUBLIC: Get list of cities with workforce data
    """
    db = get_db(request)
    # Get unique cities from database
    cities = await db.workforce_workers.distinct("location.city")
    
    # Add major cities if not present
    major_cities = ["Hyderabad", "Bangalore", "Mumbai", "Chennai", "Delhi", "Pune"]
    for city in major_cities:
        if city not in cities:
            cities.append(city)
    
    return sorted(cities)

@router.get("/workforce/stats")
async def get_workforce_stats():
    """
    PUBLIC: Get workforce statistics
    """
    total_workers = await db.workforce_workers.count_documents({"status": "approved"})
    pending_workers = await db.workforce_workers.count_documents({"status": "pending"})
    
    # Count by skill type
    skill_counts = await db.workforce_workers.aggregate([
        {"$match": {"status": "approved"}},
        {"$group": {"_id": "$skill_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(length=None)
    
    # Count by city
    city_counts = await db.workforce_workers.aggregate([
        {"$match": {"status": "approved"}},
        {"$group": {"_id": "$location.city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(length=None)
    
    return {
        "total_approved_workers": total_workers,
        "pending_approval": pending_workers,
        "by_skill": [{"skill": item["_id"], "count": item["count"]} for item in skill_counts],
        "by_city": [{"city": item["_id"], "count": item["count"]} for item in city_counts]
    }

# ADMIN ENDPOINTS

@router.get("/workforce/admin/pending", response_model=List[WorkforceWorker])
async def get_pending_workers(
    current_user: dict = Depends(require_saas_admin)
):
    """
    ADMIN: Get all pending worker submissions for approval
    """
    workers = await db.workforce_workers.find({"status": "pending"}).to_list(length=None)
    return [WorkforceWorker(**w) for w in workers]

@router.put("/workforce/admin/{worker_id}/approve")
async def approve_worker(
    worker_id: str,
    current_user: dict = Depends(require_saas_admin)
):
    """
    ADMIN: Approve a worker submission
    """
    result = await db.workforce_workers.update_one(
        {"id": worker_id},
        {
            "$set": {
                "status": "approved",
                "verified": True,
                "approved_at": datetime.utcnow(),
                "approved_by": current_user.get("id"),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found"
        )
    
    return {"success": True, "message": "Worker approved successfully"}

@router.put("/workforce/admin/{worker_id}/reject")
async def reject_worker(
    worker_id: str,
    current_user: dict = Depends(require_saas_admin)
):
    """
    ADMIN: Reject a worker submission
    """
    result = await db.workforce_workers.update_one(
        {"id": worker_id},
        {
            "$set": {
                "status": "rejected",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found"
        )
    
    return {"success": True, "message": "Worker rejected"}

@router.delete("/workforce/admin/{worker_id}")
async def delete_worker(
    worker_id: str,
    current_user: dict = Depends(require_saas_admin)
):
    """
    ADMIN: Delete a worker from database
    """
    result = await db.workforce_workers.delete_one({"id": worker_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found"
        )
    
    return {"success": True, "message": "Worker deleted successfully"}

@router.put("/workforce/admin/{worker_id}")
async def update_worker(
    worker_id: str,
    worker_data: WorkforceWorkerUpdate,
    current_user: dict = Depends(require_saas_admin)
):
    """
    ADMIN: Update worker details
    """
    update_data = {k: v for k, v in worker_data.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.workforce_workers.update_one(
        {"id": worker_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found"
        )
    
    return {"success": True, "message": "Worker updated successfully"}

# AI SCRAPING ENDPOINT

@router.post("/workforce/admin/scrape")
async def trigger_ai_scrape(
    background_tasks: BackgroundTasks,
    skill_type: str,
    location: str,
    limit: int = 10,
    current_user: dict = Depends(require_saas_admin)
):
    """
    ADMIN: Trigger AI scraping to populate workforce database
    """
    async def scrape_and_save():
        try:
            workers_data = await workforce_scraper.scrape_workers_from_search(
                skill_type=skill_type,
                location=location,
                limit=limit
            )
            
            # Save to database
            for worker_data in workers_data:
                worker = {
                    "id": str(uuid.uuid4()),
                    **worker_data,
                    "status": "approved",  # Auto-approve AI scraped data
                    "source": "ai_scraped",
                    "verified": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "approved_at": datetime.utcnow(),
                    "approved_by": current_user.get("id")
                }
                
                # Check for duplicates
                existing = await db.workforce_workers.find_one({"phone": worker.get("phone")})
                if not existing:
                    await db.workforce_workers.insert_one(worker)
            
            print(f"[AI SCRAPER] Successfully scraped and saved {len(workers_data)} workers")
        
        except Exception as e:
            print(f"[AI SCRAPER ERROR] {str(e)}")
    
    # Run in background
    background_tasks.add_task(scrape_and_save)
    
    return {
        "success": True,
        "message": f"AI scraping initiated for {skill_type} in {location}. Workers will be added to database shortly."
    }
