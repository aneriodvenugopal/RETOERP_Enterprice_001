from fastapi import APIRouter, Request, HTTPException, Query, UploadFile, File, Form
from typing import Optional, List
from datetime import datetime
import re
import pdfplumber
import io

router = APIRouter(prefix="/voters", tags=["Voters"])


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
    village: Optional[str] = Query(None, description="Filter by village name"),
    ward: Optional[str] = Query(None, description="Filter by ward number"),
    gender: Optional[str] = Query(None, description="Filter by gender (M/F)"),
    age_min: Optional[int] = Query(None, description="Minimum age"),
    age_max: Optional[int] = Query(None, description="Maximum age"),
    search: Optional[str] = Query(None, description="Search in name, epic_no, house_number"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=200, description="Items per page")
):
    """Get voters list with filters and pagination"""
    try:
        db = request.app.state.db
        
        query = {}
        
        if village:
            query["village"] = {"$regex": f"^{village}$", "$options": "i"}
        
        if ward is not None and ward != 'all':
            try:
                query["ward_no"] = int(ward)
            except (ValueError, TypeError):
                query["ward_no"] = ward
        
        if gender and gender != 'all':
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
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"epic_no": search_regex},
                {"house_number": search_regex},
                {"father_husband_name": search_regex}
            ]
        
        total = await db.voters.count_documents(query)
        
        skip = (page - 1) * limit
        cursor = db.voters.find(query, {"_id": 0}).skip(skip).limit(limit).sort([("ward_no", 1), ("sl_no", 1)])
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


@router.get("/wards")
async def get_available_wards(
    request: Request,
    village: Optional[str] = Query(None, description="Filter by village name")
):
    """Get list of available wards for a village"""
    try:
        db = request.app.state.db
        
        match_query = {}
        if village:
            match_query["village"] = {"$regex": f"^{village}$", "$options": "i"}
        
        pipeline = [
            {"$match": match_query} if match_query else {"$match": {}},
            {"$group": {
                "_id": "$ward_no",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        result = await db.voters.aggregate(pipeline).to_list(100)
        
        wards = [{"ward_no": r["_id"], "voter_count": r["count"]} for r in result if r["_id"] is not None]
        
        return {
            "success": True,
            "wards": wards
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_voters_stats(
    request: Request, 
    village: Optional[str] = Query(None),
    ward: Optional[str] = Query(None)
):
    """Get voters statistics"""
    try:
        db = request.app.state.db
        
        match_query = {}
        if village:
            match_query["village"] = {"$regex": f"^{village}$", "$options": "i"}
        if ward is not None and ward != 'all':
            try:
                match_query["ward_no"] = int(ward)
            except (ValueError, TypeError):
                match_query["ward_no"] = ward
        
        total = await db.voters.count_documents(match_query)
        
        pipeline = [
            {"$match": match_query} if match_query else {"$match": {}},
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
        
        ward_pipeline = [
            {"$match": match_query} if match_query else {"$match": {}},
            {"$group": {"_id": "$ward_no", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        ward_stats = await db.voters.aggregate(ward_pipeline).to_list(length=50)
        
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
        
        for voter in voters_data:
            voter["ward_no"] = ward_no
            if "ac_ps_slno" in voter:
                parts = voter["ac_ps_slno"].split("-")
                if len(parts) >= 3:
                    try:
                        voter["sl_no"] = int(parts[2])
                    except:
                        voter["sl_no"] = 0
        
        await db.voters.delete_many({"ward_no": ward_no})
        
        if voters_data:
            await db.voters.insert_many(voters_data)
            
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


def extract_voters_by_columns(pdf_bytes: bytes) -> tuple[list, dict]:
    """
    Extract voter data from PDF by analyzing 3-column layout.
    Works with Ward Photo Voter List format.
    """
    voters = []
    metadata = {
        "total_pages": 0,
        "municipality": "",
        "ward_no": None,
        "extraction_method": "column_based",
        "extraction_errors": []
    }
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            metadata["total_pages"] = len(pdf.pages)
            
            for page_num, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text() or ""
                    
                    # Extract metadata from first page
                    if page_num == 0:
                        if 'aliyabad' in text.lower():
                            metadata["municipality"] = "Aliyabad"
                        ward_match = re.search(r'ward\s*(?:no\.?\s*)?:?\s*(\d+)', text, re.IGNORECASE)
                        if ward_match:
                            metadata["ward_no"] = int(ward_match.group(1))
                        
                        # Skip if title page (no voter data)
                        if not re.search(r'YAV\d+|GNH\d+', text):
                            continue
                    
                    # Get words with positions
                    words = page.extract_words(keep_blank_chars=True)
                    
                    if not words:
                        continue
                    
                    # Divide page into 3 columns
                    page_width = page.width
                    col_width = page_width / 3
                    
                    columns = [[], [], []]
                    for word in words:
                        x_center = (word['x0'] + word['x1']) / 2
                        if x_center < col_width:
                            columns[0].append(word)
                        elif x_center < 2 * col_width:
                            columns[1].append(word)
                        else:
                            columns[2].append(word)
                    
                    # Process each column
                    for col_words in columns:
                        if not col_words:
                            continue
                        
                        col_words.sort(key=lambda w: (w['top'], w['x0']))
                        col_text = ' '.join([w['text'] for w in col_words])
                        
                        # Find EPIC numbers
                        epic_matches = list(re.finditer(r'(YAV\d+|GNH\d+)', col_text))
                        
                        for epic_match in epic_matches:
                            epic = epic_match.group(1)
                            
                            # Get context before EPIC
                            context_start = max(0, epic_match.start() - 400)
                            context = col_text[context_start:epic_match.end()]
                            
                            voter = {
                                'epic_no': epic,
                                'name': '',
                                'father_husband_name': '',
                                'age': None,
                                'gender': '',
                                'house_number': '',
                                'ac_ps_slno': '',
                                'sl_no': 0
                            }
                            
                            # Extract AC-PS-SLNO
                            acps_match = re.search(r'(\d+)\s*-\s*(\d+)\s*-\s*(\d+)', context)
                            if acps_match:
                                voter['ac_ps_slno'] = f"{acps_match.group(1)}-{acps_match.group(2)}-{acps_match.group(3)}"
                                try:
                                    voter['sl_no'] = int(acps_match.group(3))
                                except:
                                    pass
                            
                            # Extract Name
                            name_match = re.search(r'Name\s*:?\s*([A-Za-z][A-Za-z\s]+?)(?:\s+(?:Father|Husband|Age|Door|$))', context)
                            if name_match:
                                voter['name'] = name_match.group(1).strip()[:100]
                            
                            # Extract Father/Husband Name
                            rel_match = re.search(r'(?:Father|Husband)(?:\s+Name)?\s*:?\s*([A-Za-z][A-Za-z\s]+?)(?:\s+(?:Age|Door|Name|$))', context)
                            if rel_match:
                                voter['father_husband_name'] = rel_match.group(1).strip()[:100]
                            
                            # Extract Age
                            age_match = re.search(r'Age\s*:?\s*(\d+)', context)
                            if age_match:
                                age = int(age_match.group(1))
                                if 18 <= age <= 120:
                                    voter['age'] = age
                            
                            # Extract Gender
                            gender_match = re.search(r'Sex\s*:?\s*:?\s*([MF])', context)
                            if gender_match:
                                voter['gender'] = gender_match.group(1)
                            
                            # Extract Door No
                            door_match = re.search(r'Door\s*No\.?\s*:?\s*([^\s]+)', context)
                            if door_match:
                                voter['house_number'] = door_match.group(1).strip()[:20]
                            
                            voters.append(voter)
                            
                except Exception as page_error:
                    metadata["extraction_errors"].append(f"Page {page_num + 1}: {str(page_error)}")
                    
    except Exception as e:
        metadata["extraction_errors"].append(f"PDF Error: {str(e)}")
    
    # Remove duplicates
    seen = set()
    unique_voters = []
    for v in voters:
        if v['epic_no'] and v['epic_no'] not in seen:
            seen.add(v['epic_no'])
            unique_voters.append(v)
    
    return unique_voters, metadata


def extract_voters_simple(pdf_bytes: bytes) -> tuple[list, dict]:
    """Simple extraction fallback - find all EPICs and associated data."""
    voters = []
    metadata = {
        "total_pages": 0,
        "municipality": "",
        "ward_no": None,
        "extraction_method": "simple",
        "extraction_errors": []
    }
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            metadata["total_pages"] = len(pdf.pages)
            
            all_text = ""
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                
                if page_num == 0:
                    if 'aliyabad' in text.lower():
                        metadata["municipality"] = "Aliyabad"
                    ward_match = re.search(r'ward\s*(?:no\.?\s*)?:?\s*(\d+)', text, re.IGNORECASE)
                    if ward_match:
                        metadata["ward_no"] = int(ward_match.group(1))
                
                all_text += text + "\n"
            
            # Find all EPIC numbers
            epic_matches = list(re.finditer(r'(YAV\d+|GNH\d+)', all_text))
            
            for match in epic_matches:
                epic = match.group(1)
                
                start = max(0, match.start() - 300)
                end = min(len(all_text), match.end() + 50)
                context = all_text[start:end]
                
                voter = {
                    'epic_no': epic,
                    'name': '',
                    'father_husband_name': '',
                    'age': None,
                    'gender': '',
                    'house_number': '',
                    'ac_ps_slno': '',
                    'sl_no': 0
                }
                
                acps = re.search(r'(\d+)-(\d+)-(\d+)', context)
                if acps:
                    voter['ac_ps_slno'] = f"{acps.group(1)}-{acps.group(2)}-{acps.group(3)}"
                    try:
                        voter['sl_no'] = int(acps.group(3))
                    except:
                        pass
                
                name_match = re.search(r'Name\s*:?\s*([A-Za-z][A-Za-z\s]+)', context)
                if name_match:
                    voter['name'] = name_match.group(1).strip()[:100]
                
                age_match = re.search(r'Age\s*:?\s*(\d+)', context)
                if age_match:
                    age = int(age_match.group(1))
                    if 18 <= age <= 120:
                        voter['age'] = age
                
                gender_match = re.search(r'Sex\s*:?\s*:?\s*([MF])', context)
                if gender_match:
                    voter['gender'] = gender_match.group(1)
                
                door_match = re.search(r'Door\s*No\.?\s*:?\s*([^\s]+)', context)
                if door_match:
                    voter['house_number'] = door_match.group(1).strip()[:20]
                
                voters.append(voter)
                
    except Exception as e:
        metadata["extraction_errors"].append(f"PDF Error: {str(e)}")
    
    # Remove duplicates
    seen = set()
    unique = []
    for v in voters:
        if v['epic_no'] and v['epic_no'] not in seen:
            seen.add(v['epic_no'])
            unique.append(v)
    
    return unique, metadata


@router.post("/upload-pdf")
async def upload_voters_pdf(
    request: Request,
    file: UploadFile = File(...),
    village: str = Form(...),
    ward_no: str = Form(...),
    replace_existing: bool = Form(True)
):
    """Upload and process a voter list PDF file."""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        pdf_bytes = await file.read()
        
        if len(pdf_bytes) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum 50MB allowed.")
        
        try:
            ward_int = int(ward_no)
        except ValueError:
            raise HTTPException(status_code=400, detail="Ward number must be a valid integer")
        
        # Try column-based extraction first
        voters, metadata = extract_voters_by_columns(pdf_bytes)
        
        # Fallback to simple extraction if not enough results
        if len(voters) < 10:
            voters_simple, metadata_simple = extract_voters_simple(pdf_bytes)
            if len(voters_simple) > len(voters):
                voters = voters_simple
                metadata = metadata_simple
        
        if not voters:
            return {
                "success": False,
                "message": "Could not extract any voter data from the PDF.",
                "metadata": metadata,
                "extracted_count": 0
            }
        
        # Add village and ward to each voter
        for voter in voters:
            voter["village"] = village.strip()
            voter["ward_no"] = ward_int
            voter["ward"] = str(ward_int)
        
        db = request.app.state.db
        
        deleted_count = 0
        if replace_existing:
            delete_result = await db.voters.delete_many({
                "village": {"$regex": f"^{village}$", "$options": "i"},
                "ward_no": ward_int
            })
            deleted_count = delete_result.deleted_count
        
        if voters:
            await db.voters.insert_many(voters)
            
            await db.voters.create_index("village")
            await db.voters.create_index("ward_no")
            await db.voters.create_index("ward")
            await db.voters.create_index("epic_no")
            await db.voters.create_index("name")
            await db.voters.create_index("gender")
            await db.voters.create_index("age")
            await db.voters.create_index("sl_no")
            await db.voters.create_index([("village", 1), ("ward_no", 1)])
        
        return {
            "success": True,
            "message": f"Successfully imported {len(voters)} voters for {village} - Ward {ward_no}",
            "extracted_count": len(voters),
            "replaced_count": deleted_count,
            "metadata": {
                "total_pages": metadata.get("total_pages", 0),
                "extraction_method": metadata.get("extraction_method", "unknown"),
                "detected_ward": metadata.get("ward_no"),
                "detected_municipality": metadata.get("municipality"),
                "errors": metadata.get("extraction_errors", [])[:5]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@router.get("/villages")
async def get_available_villages(request: Request):
    """Get list of all unique villages"""
    try:
        db = request.app.state.db
        
        villages = await db.voters.distinct("village")
        villages = [v for v in villages if v]
        
        return {
            "success": True,
            "villages": sorted(villages, key=lambda x: x.lower() if x else "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear")
async def clear_voters_data(
    request: Request,
    village: Optional[str] = Query(None),
    ward_no: Optional[int] = Query(None)
):
    """Clear voters data for a specific village/ward or all data"""
    try:
        db = request.app.state.db
        
        query = {}
        if village:
            query["village"] = {"$regex": f"^{village}$", "$options": "i"}
        if ward_no is not None:
            query["ward_no"] = ward_no
        
        result = await db.voters.delete_many(query)
        
        return {
            "success": True,
            "message": f"Deleted {result.deleted_count} voter records",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
