from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional
from datetime import datetime
import os
import math

from models.incomelands_property import (
    IncomeLandsProperty,
    PropertyCreateRequest,
    PropertyUpdateRequest,
    PropertySearchQuery,
    ContactUnlockRequest
)
from middleware.auth import get_current_user

router = APIRouter(prefix="/incomelands", tags=["IncomeLands Properties"])

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers using Haversine formula"""
    R = 6371  # Earth's radius in kilometers

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c

    return distance

@router.post("/properties", status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: PropertyCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new property listing"""
    
    # Create property document
    property_doc = IncomeLandsProperty(
        agent_id=current_user["id"],
        agent_name=current_user.get("name"),
        agent_phone=current_user.get("mobile"),
        **property_data.dict()
    )
    
    # Insert into database
    result = await db.incomelands_properties.insert_one(property_doc.dict())
    
    if result.inserted_id:
        return {
            "success": True,
            "message": "Property created successfully",
            "property_id": property_doc.id
        }
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to create property"
    )

@router.get("/properties/{property_id}")
async def get_property(property_id: str, current_user: dict = Depends(get_current_user)):
    """Get property details by ID"""
    
    property_doc = await db.incomelands_properties.find_one({"id": property_id})
    
    if not property_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Increment view count
    await db.incomelands_properties.update_one(
        {"id": property_id},
        {"$inc": {"views": 1}}
    )
    
    # Hide owner contact unless it's the agent who posted or contact is unlocked
    if property_doc.get("agent_id") != current_user["id"]:
        # Check if user has unlocked contact
        has_unlocked = any(
            unlock["user_id"] == current_user["id"]
            for unlock in property_doc.get("contact_unlocks", [])
        )
        
        if not has_unlocked and not property_doc.get("is_retoerp_property", False):
            # Hide agent contact
            property_doc["agent_phone"] = None
            property_doc["contact_locked"] = True
        
        # Always hide owner contact
        if "owner_contact" in property_doc:
            property_doc["owner_contact"] = None
    
    return property_doc

@router.post("/properties/search")
async def search_properties(
    query: PropertySearchQuery,
    current_user: dict = Depends(get_current_user)
):
    """Search properties based on filters"""
    
    filter_query = {"status": "active"}
    
    if query.property_type:
        filter_query["property_type"] = query.property_type
    
    if query.transaction_type:
        filter_query["transaction_type"] = query.transaction_type
    
    if query.min_price or query.max_price:
        filter_query["price.amount"] = {}
        if query.min_price:
            filter_query["price.amount"]["$gte"] = query.min_price
        if query.max_price:
            filter_query["price.amount"]["$lte"] = query.max_price
    
    # Get all matching properties
    properties = await db.incomelands_properties.find(filter_query).to_list(length=None)
    
    # Filter by distance if lat/lng provided
    if query.latitude and query.longitude:
        properties_with_distance = []
        for prop in properties:
            if "location" in prop and "latitude" in prop["location"]:
                distance = calculate_distance(
                    query.latitude,
                    query.longitude,
                    prop["location"]["latitude"],
                    prop["location"]["longitude"]
                )
                
                if distance <= query.radius_km:
                    prop["distance_km"] = round(distance, 2)
                    properties_with_distance.append(prop)
        
        properties = sorted(properties_with_distance, key=lambda x: x["distance_km"])
    
    # Hide contacts
    for prop in properties:
        if prop.get("agent_id") != current_user["id"]:
            has_unlocked = any(
                unlock["user_id"] == current_user["id"]
                for unlock in prop.get("contact_unlocks", [])
            )
            
            if not has_unlocked and not prop.get("is_retoerp_property", False):
                prop["agent_phone"] = None
                prop["contact_locked"] = True
        
        if "owner_contact" in prop:
            prop["owner_contact"] = None
    
    # Pagination
    total = len(properties)
    properties = properties[query.skip:query.skip + query.limit]
    
    return {
        "success": True,
        "total": total,
        "count": len(properties),
        "properties": properties
    }

@router.post("/properties/{property_id}/unlock-contact")
async def unlock_contact(
    property_id: str,
    unlock_request: ContactUnlockRequest,
    current_user: dict = Depends(get_current_user)
):
    """Unlock agent contact using credits"""
    
    property_doc = await db.incomelands_properties.find_one({"id": property_id})
    
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Free for RETOERP properties
    if property_doc.get("is_retoerp_property", False):
        await db.incomelands_properties.update_one(
            {"id": property_id},
            {"$push": {"contact_unlocks": {"user_id": current_user["id"], "amount": 0, "timestamp": datetime.utcnow()}}}
        )
        return {"success": True, "agent_phone": property_doc.get("agent_phone")}
    
    # Check if already unlocked
    has_unlocked = any(u["user_id"] == current_user["id"] for u in property_doc.get("contact_unlocks", []))
    if has_unlocked:
        return {"success": True, "agent_phone": property_doc.get("agent_phone")}
    
    # Check credits
    user = await db.users.find_one({"id": current_user["id"]})
    free_credits = user.get("free_credits", 0)
    paid_credits = user.get("paid_credits", 0)
    total = free_credits + paid_credits
    
    if total < unlock_request.amount:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    # Deduct credits
    if free_credits >= unlock_request.amount:
        await db.users.update_one({"id": current_user["id"]}, {"$inc": {"free_credits": -unlock_request.amount}})
    else:
        remaining = unlock_request.amount - free_credits
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"free_credits": 0}, "$inc": {"paid_credits": -remaining}}
        )
    
    # Add unlock record
    await db.incomelands_properties.update_one(
        {"id": property_id},
        {"$push": {"contact_unlocks": {"user_id": current_user["id"], "amount": unlock_request.amount, "timestamp": datetime.utcnow()}}}
    )
    
    return {
        "success": True,
        "agent_phone": property_doc.get("agent_phone"),
        "remaining_credits": total - unlock_request.amount
    }

@router.get("/credits/balance")
async def get_credit_balance(current_user: dict = Depends(get_current_user)):
    """Get credit balance"""
    
    user = await db.users.find_one({"id": current_user["id"]})
    free_credits = user.get("free_credits", 20)  # Default 20 free credits
    paid_credits = user.get("paid_credits", 0)
    
    return {
        "success": True,
        "free_credits": free_credits,
        "paid_credits": paid_credits,
        "total_credits": free_credits + paid_credits
    }
