from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional, List
from datetime import datetime
import re

router = APIRouter(prefix="/voters", tags=["Voters"])

# Simple DMY password logic: date + month + year (e.g., 190126 for 19th Jan 2026)
def get_valid_password():
    """Generate today's password in DMY format"""
    now = datetime.now()
    return f"{now.day:02d}{now.month:02d}{str(now.year)[2:]}"

@router.post("/login")
async def voters_login(request: Request):
    """Simple password login for voters list access"""
    try:
        body = await request.json()
        password = body.get("password", "")
        
        valid_password = get_valid_password()
        
        if password == valid_password:
            return {
                "success": True,
                "message": "Login successful",
                "token": f"voters_session_{datetime.now().timestamp()}"
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid password")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def get_voters_list(
    request: Request,
    ward: Optional[int] = Query(None, description="Filter by ward number"),
    gender: Optional[str] = Query(None, description="Filter by gender (M/F)"),
    age_min: Optional[int] = Query(None, description="Minimum age"),
    age_max: Optional[int] = Query(None, description="Maximum age"),
    search: Optional[str] = Query(None, description="Search in name, epic_no, house_number, father_husband_name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=200, description="Items per page")
):
    """Get voters list with filters and pagination"""
    try:
        db = request.app.state.db
        
        # Build query
        query = {}
        
        if ward is not None:
            query["ward_no"] = ward
        
        if gender:
            query["gender"] = gender.upper()
        
        if age_min is not None or age_max is not None:
            query["age"] = {}
            if age_min is not None:
                query["age"]["$gte"] = age_min
            if age_max is not None:
                query["age"]["$lte"] = age_max
            if not query["age"]:
                del query["age"]
        
        if search:
            # Case-insensitive search across multiple fields
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"epic_no": search_regex},
                {"house_number": search_regex},
                {"father_husband_name": search_regex}
            ]
        
        # Get total count
        total = await db.voters.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        cursor = db.voters.find(query, {"_id": 0}).skip(skip).limit(limit).sort("sl_no", 1)
        voters = await cursor.to_list(length=limit)
        
        return {
            "success": True,
            "data": voters,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_voters_stats(request: Request, ward: Optional[int] = Query(None)):
    """Get voters statistics"""
    try:
        db = request.app.state.db
        
        match_query = {}
        if ward is not None:
            match_query["ward_no"] = ward
        
        # Get total count
        total = await db.voters.count_documents(match_query)
        
        # Get gender-wise count
        pipeline = [
            {"$match": match_query},
            {"$group": {"_id": "$gender", "count": {"$sum": 1}}}
        ]
        gender_stats = await db.voters.aggregate(pipeline).to_list(length=10)
        
        male_count = 0
        female_count = 0
        for stat in gender_stats:
            if stat["_id"] == "M":
                male_count = stat["count"]
            elif stat["_id"] == "F":
                female_count = stat["count"]
        
        # Get ward-wise count
        ward_pipeline = [
            {"$match": match_query} if match_query else {"$match": {}},
            {"$group": {"_id": "$ward_no", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        ward_stats = await db.voters.aggregate(ward_pipeline).to_list(length=20)
        
        # Get available wards
        wards = [w["_id"] for w in ward_stats if w["_id"] is not None]
        
        return {
            "success": True,
            "stats": {
                "total": total,
                "male": male_count,
                "female": female_count,
                "wards": wards,
                "ward_wise": {str(w["_id"]): w["count"] for w in ward_stats if w["_id"] is not None}
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_voters_data(request: Request):
    """Upload voters data from parsed PDF (admin only)"""
    try:
        db = request.app.state.db
        body = await request.json()
        
        voters_data = body.get("voters", [])
        ward_no = body.get("ward_no", 1)
        
        if not voters_data:
            raise HTTPException(status_code=400, detail="No voters data provided")
        
        # Add ward_no to each voter record
        for voter in voters_data:
            voter["ward_no"] = ward_no
            # Parse sl_no from ac_ps_slno for sorting
            if "ac_ps_slno" in voter:
                parts = voter["ac_ps_slno"].split("-")
                if len(parts) >= 3:
                    try:
                        voter["sl_no"] = int(parts[2])
                    except:
                        voter["sl_no"] = 0
        
        # Delete existing data for this ward (to avoid duplicates)
        await db.voters.delete_many({"ward_no": ward_no})
        
        # Insert new data
        if voters_data:
            result = await db.voters.insert_many(voters_data)
            
            # Create indexes for faster search
            await db.voters.create_index("ward_no")
            await db.voters.create_index("epic_no")
            await db.voters.create_index("name")
            await db.voters.create_index("gender")
            await db.voters.create_index("age")
            await db.voters.create_index("sl_no")
        
        return {
            "success": True,
            "message": f"Uploaded {len(voters_data)} voters for Ward {ward_no}",
            "count": len(voters_data)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
