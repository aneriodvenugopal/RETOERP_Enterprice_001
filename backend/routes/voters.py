from fastapi import APIRouter, Request, HTTPException, Query, UploadFile, File, Form
from typing import Optional, List
from datetime import datetime
import re
import pdfplumber
import io
import tempfile
import os

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
    village: Optional[str] = Query(None, description="Filter by village name"),
    ward: Optional[str] = Query(None, description="Filter by ward number"),
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
        
        # Village filter (case-insensitive)
        if village:
            query["village"] = {"$regex": f"^{village}$", "$options": "i"}
        
        if ward is not None and ward != 'all':
            # Handle ward as string or int
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
        
        # Build match query
        match_query = {}
        if village:
            match_query["village"] = {"$regex": f"^{village}$", "$options": "i"}
        
        # Get distinct wards
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
        
        # Get total count
        total = await db.voters.count_documents(match_query)
        
        # Get gender-wise count
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
        
        # Get ward-wise count
        ward_pipeline = [
            {"$match": match_query} if match_query else {"$match": {}},
            {"$group": {"_id": "$ward_no", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        ward_stats = await db.voters.aggregate(ward_pipeline).to_list(length=50)
        
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


def extract_voters_from_pdf(pdf_bytes: bytes) -> tuple[list, dict]:
    """
    Extract voter data from PDF using pdfplumber.
    Returns tuple of (voters_list, metadata)
    """
    voters = []
    metadata = {
        "total_pages": 0,
        "municipality": "",
        "ward_no": None,
        "extraction_errors": []
    }
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            metadata["total_pages"] = len(pdf.pages)
            
            for page_num, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text() or ""
                    lines = text.split('\n')
                    
                    # Try to extract municipality and ward from first page
                    if page_num == 0:
                        for line in lines[:15]:
                            line_lower = line.lower()
                            if 'municipality' in line_lower or 'corporation' in line_lower:
                                # Try to extract municipality name
                                if 'aliyabad' in line_lower:
                                    metadata["municipality"] = "Aliyabad"
                            if 'ward no' in line_lower or 'ward:' in line_lower:
                                ward_match = re.search(r'ward\s*(?:no\.?\s*)?:?\s*(\d+)', line, re.IGNORECASE)
                                if ward_match:
                                    metadata["ward_no"] = int(ward_match.group(1))
                    
                    # Skip first page if it's a title page (check for voter entries)
                    if page_num == 0:
                        has_voter_data = any(re.search(r'YAV\d+', line) for line in lines)
                        if not has_voter_data:
                            continue
                    
                    # Extract voter data using patterns
                    # Look for EPIC numbers (YAV followed by digits)
                    epic_pattern = r'(YAV\d+)'
                    
                    # Process text to find voter entries
                    current_voter = {}
                    
                    for i, line in enumerate(lines):
                        line = line.strip()
                        if not line:
                            continue
                        
                        # Check for EPIC number
                        epic_match = re.search(epic_pattern, line)
                        if epic_match:
                            # If we have a previous voter, save it
                            if current_voter.get('epic_no'):
                                if all(k in current_voter for k in ['name', 'epic_no']):
                                    voters.append(current_voter.copy())
                            
                            current_voter = {
                                'epic_no': epic_match.group(1),
                                'name': '',
                                'father_husband_name': '',
                                'age': None,
                                'gender': '',
                                'house_number': ''
                            }
                            
                            # Try to extract other data from the same line or nearby
                            remaining = line.replace(epic_match.group(1), '').strip()
                            
                            # Extract age (2-3 digit number)
                            age_match = re.search(r'\b(\d{2,3})\b', remaining)
                            if age_match:
                                age = int(age_match.group(1))
                                if 18 <= age <= 120:
                                    current_voter['age'] = age
                            
                            # Extract gender
                            if ' M ' in f' {remaining} ' or remaining.endswith(' M'):
                                current_voter['gender'] = 'M'
                            elif ' F ' in f' {remaining} ' or remaining.endswith(' F'):
                                current_voter['gender'] = 'F'
                        
                        # Check for AC-PS-SLNO pattern
                        acps_match = re.search(r'(\d+-\d+-\d+)', line)
                        if acps_match and current_voter.get('epic_no'):
                            current_voter['ac_ps_slno'] = acps_match.group(1)
                            parts = acps_match.group(1).split('-')
                            if len(parts) >= 3:
                                try:
                                    current_voter['sl_no'] = int(parts[2])
                                except:
                                    pass
                        
                        # Try to extract names (Telugu or English)
                        # Names usually have capital letters and spaces
                        if current_voter.get('epic_no') and not current_voter.get('name'):
                            name_match = re.search(r'([A-Z][a-zA-Z\s]+(?:\s[A-Z][a-zA-Z\s]+)*)', line)
                            if name_match:
                                potential_name = name_match.group(1).strip()
                                if len(potential_name) > 3 and not any(x in potential_name.lower() for x in ['page', 'ward', 'municipality', 'epic']):
                                    current_voter['name'] = potential_name
                        
                        # Extract house number
                        house_match = re.search(r'(\d+[-/]?\d*[-/]?\d*)\s*$', line)
                        if house_match and current_voter.get('epic_no'):
                            house_no = house_match.group(1)
                            if len(house_no) <= 10:
                                current_voter['house_number'] = house_no
                    
                    # Don't forget the last voter
                    if current_voter.get('epic_no') and all(k in current_voter for k in ['name', 'epic_no']):
                        voters.append(current_voter.copy())
                        
                except Exception as page_error:
                    metadata["extraction_errors"].append(f"Page {page_num + 1}: {str(page_error)}")
                    
    except Exception as e:
        metadata["extraction_errors"].append(f"PDF Error: {str(e)}")
    
    return voters, metadata


def extract_voters_with_tables(pdf_bytes: bytes) -> tuple[list, dict]:
    """
    Enhanced extraction using table detection for structured PDFs.
    """
    voters = []
    metadata = {
        "total_pages": 0,
        "municipality": "",
        "ward_no": None,
        "extraction_method": "table",
        "extraction_errors": []
    }
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            metadata["total_pages"] = len(pdf.pages)
            
            # First, try to extract ward info from first page
            first_page_text = pdf.pages[0].extract_text() or ""
            ward_match = re.search(r'ward\s*(?:no\.?\s*)?:?\s*(\d+)', first_page_text, re.IGNORECASE)
            if ward_match:
                metadata["ward_no"] = int(ward_match.group(1))
            
            if 'aliyabad' in first_page_text.lower():
                metadata["municipality"] = "Aliyabad"
            
            for page_num, page in enumerate(pdf.pages):
                try:
                    # Get all text for analysis
                    text = page.extract_text() or ""
                    
                    # Skip title pages
                    if page_num == 0 and 'publication date' in text.lower():
                        continue
                    
                    # Try table extraction first
                    tables = page.extract_tables()
                    
                    if tables:
                        for table in tables:
                            for row in table:
                                if row and len(row) >= 4:
                                    voter = process_table_row(row)
                                    if voter and voter.get('epic_no'):
                                        voters.append(voter)
                    else:
                        # Fall back to text extraction for grid-like PDFs
                        extracted = extract_from_grid_text(text)
                        voters.extend(extracted)
                        
                except Exception as page_error:
                    metadata["extraction_errors"].append(f"Page {page_num + 1}: {str(page_error)}")
                    
    except Exception as e:
        metadata["extraction_errors"].append(f"PDF Error: {str(e)}")
    
    # Remove duplicates based on EPIC number
    seen_epics = set()
    unique_voters = []
    for voter in voters:
        epic = voter.get('epic_no', '')
        if epic and epic not in seen_epics:
            seen_epics.add(epic)
            unique_voters.append(voter)
    
    return unique_voters, metadata


def process_table_row(row: list) -> dict:
    """Process a table row and extract voter information."""
    voter = {
        'epic_no': '',
        'name': '',
        'father_husband_name': '',
        'age': None,
        'gender': '',
        'house_number': '',
        'ac_ps_slno': ''
    }
    
    for cell in row:
        if not cell:
            continue
        cell = str(cell).strip()
        
        # EPIC number
        if re.match(r'YAV\d+', cell):
            voter['epic_no'] = cell
        
        # AC-PS-SLNO
        elif re.match(r'\d+-\d+-\d+', cell):
            voter['ac_ps_slno'] = cell
            parts = cell.split('-')
            if len(parts) >= 3:
                try:
                    voter['sl_no'] = int(parts[2])
                except:
                    pass
        
        # Age (2-3 digits between 18-120)
        elif re.match(r'^\d{2,3}$', cell):
            age = int(cell)
            if 18 <= age <= 120:
                voter['age'] = age
        
        # Gender
        elif cell.upper() in ['M', 'F', 'MALE', 'FEMALE']:
            voter['gender'] = 'M' if cell.upper() in ['M', 'MALE'] else 'F'
        
        # House number (short alphanumeric)
        elif re.match(r'^[\d/-]+$', cell) and len(cell) <= 10:
            if not voter['house_number']:
                voter['house_number'] = cell
        
        # Name (longer text with letters)
        elif len(cell) > 3 and re.search(r'[A-Za-z]', cell):
            if not voter['name']:
                voter['name'] = cell
            elif not voter['father_husband_name']:
                voter['father_husband_name'] = cell
    
    return voter


def extract_from_grid_text(text: str) -> list:
    """Extract voters from grid-formatted text (3 voters per row)."""
    voters = []
    lines = text.split('\n')
    
    # Find all EPIC numbers in the text
    epic_matches = list(re.finditer(r'(YAV\d+)', text))
    
    for match in epic_matches:
        epic = match.group(1)
        start_pos = match.start()
        
        # Get context around this EPIC (before and after)
        context_start = max(0, start_pos - 200)
        context_end = min(len(text), start_pos + 200)
        context = text[context_start:context_end]
        
        voter = {
            'epic_no': epic,
            'name': '',
            'father_husband_name': '',
            'age': None,
            'gender': '',
            'house_number': '',
            'ac_ps_slno': ''
        }
        
        # Extract AC-PS-SLNO
        acps_match = re.search(r'(\d+-\d+-\d+)', context)
        if acps_match:
            voter['ac_ps_slno'] = acps_match.group(1)
            parts = acps_match.group(1).split('-')
            if len(parts) >= 3:
                try:
                    voter['sl_no'] = int(parts[2])
                except:
                    pass
        
        # Extract age
        age_match = re.search(r'\b(\d{2})\b', context)
        if age_match:
            age = int(age_match.group(1))
            if 18 <= age <= 99:
                voter['age'] = age
        
        # Extract gender
        if re.search(r'\bM\b', context):
            voter['gender'] = 'M'
        elif re.search(r'\bF\b', context):
            voter['gender'] = 'F'
        
        # Extract name (English pattern)
        name_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', context)
        if name_match:
            voter['name'] = name_match.group(1)
        
        if voter['epic_no']:
            voters.append(voter)
    
    return voters


@router.post("/upload-pdf")
async def upload_voters_pdf(
    request: Request,
    file: UploadFile = File(...),
    village: str = Form(...),
    ward_no: str = Form(...),
    replace_existing: bool = Form(True)
):
    """
    Upload and process a voter list PDF file.
    Extracts voter data and stores in database with village and ward mapping.
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file
        pdf_bytes = await file.read()
        
        if len(pdf_bytes) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=400, detail="File too large. Maximum 50MB allowed.")
        
        # Convert ward_no to int
        try:
            ward_int = int(ward_no)
        except ValueError:
            raise HTTPException(status_code=400, detail="Ward number must be a valid integer")
        
        # Extract voters using enhanced method
        voters, metadata = extract_voters_with_tables(pdf_bytes)
        
        # If table extraction didn't work well, try text extraction
        if len(voters) < 10:
            voters_text, metadata_text = extract_voters_from_pdf(pdf_bytes)
            if len(voters_text) > len(voters):
                voters = voters_text
                metadata = metadata_text
                metadata["extraction_method"] = "text"
        
        if not voters:
            return {
                "success": False,
                "message": "Could not extract any voter data from the PDF. The PDF format may not be compatible.",
                "metadata": metadata,
                "extracted_count": 0
            }
        
        # Add village and ward to each voter
        for voter in voters:
            voter["village"] = village.strip()
            voter["ward_no"] = ward_int
            voter["ward"] = str(ward_int)  # Also store as string for flexibility
        
        # Get database
        db = request.app.state.db
        
        # Delete existing data if requested
        if replace_existing:
            delete_result = await db.voters.delete_many({
                "village": {"$regex": f"^{village}$", "$options": "i"},
                "ward_no": ward_int
            })
            deleted_count = delete_result.deleted_count
        else:
            deleted_count = 0
        
        # Insert new data
        if voters:
            await db.voters.insert_many(voters)
            
            # Create/update indexes
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
                "errors": metadata.get("extraction_errors", [])[:5]  # First 5 errors only
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@router.get("/villages")
async def get_available_villages(request: Request):
    """Get list of all unique villages in the voters database"""
    try:
        db = request.app.state.db
        
        # Get distinct villages
        villages = await db.voters.distinct("village")
        
        # Filter out None/empty values
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
