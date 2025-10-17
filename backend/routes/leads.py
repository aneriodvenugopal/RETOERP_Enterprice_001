from fastapi import APIRouter, HTTPException, Request
from models.lead import Lead, LeadCreate, LeadUpdate, LeadFollowup, LeadFollowupCreate, LeadConvert
from models.user import User, UserCreate
from models.role import Role
from utils.helpers import serialize_doc, deserialize_doc
from services.audit_log_service import AuditLogService
from middleware.auth import get_current_user
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/leads", tags=["leads"])

def get_db(request: Request):
    return request.app.state.db

@router.post("/", response_model=Lead)
async def create_lead(lead_create: LeadCreate, request: Request):
    """Create a new lead"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Check if lead with same phone already exists in tenant
    existing = await db.leads.find_one({
        'tenant_id': lead_create.tenant_id,
        'phone': lead_create.phone,
        'deleted_at': None
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Lead with this phone number already exists")
    
    # Create lead
    lead_data = lead_create.model_dump()
    if lead_data.get('assigned_to'):
        lead_data['assigned_at'] = datetime.now(timezone.utc)
    
    lead = Lead(**lead_data)
    lead_doc = serialize_doc(lead.model_dump())
    
    await db.leads.insert_one(lead_doc)
    
    # Audit log
    audit_service = AuditLogService(db)
    await audit_service.log(
        auditable_type="Lead",
        auditable_id=lead.id,
        event="created",
        module="lead",
        user_id=user.get('user_id'),
        new_values=lead_doc,
        tenant_id=lead.tenant_id,
        project_id=lead.project_id,
        ip_address=request.client.host
    )
    
    return lead

@router.get("/", response_model=List[Lead])
async def get_leads(
    request: Request,
    tenant_id: Optional[str] = None,
    project_id: Optional[str] = None,
    status_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    source_id: Optional[str] = None,
    is_converted: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get all leads with filters"""
    db = get_db(request)
    user = await get_current_user(request)
    
    query = {'deleted_at': None}
    
    # If not super admin, filter by tenant
    if user.get('role') != 'super_admin':
        query['tenant_id'] = user.get('tenant_id')
    elif tenant_id:
        query['tenant_id'] = tenant_id
    
    # If staff, show only assigned leads
    if user.get('role') == 'staff':
        query['assigned_to'] = user.get('user_id')
    elif assigned_to:
        query['assigned_to'] = assigned_to
    
    if project_id:
        query['project_id'] = project_id
    
    if status_id:
        query['status_id'] = status_id
    
    if source_id:
        query['source_id'] = source_id
    
    if is_converted is not None:
        query['is_converted'] = is_converted
    
    leads = await db.leads.find(query, {"_id": 0}).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
    
    for lead in leads:
        deserialize_doc(lead)
    
    return [Lead(**l) for l in leads]

@router.get("/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, request: Request):
    """Get lead by ID"""
    db = get_db(request)
    
    lead_doc = await db.leads.find_one({'id': lead_id, 'deleted_at': None}, {"_id": 0})
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead_doc = deserialize_doc(lead_doc)
    return Lead(**lead_doc)

@router.get("/{lead_id}/details")
async def get_lead_details(lead_id: str, request: Request):
    """Get lead with all related information (assigned user, project, follow-ups)"""
    db = get_db(request)
    
    lead_doc = await db.leads.find_one({'id': lead_id, 'deleted_at': None}, {"_id": 0})
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead_doc = deserialize_doc(lead_doc)
    
    # Get assigned user info
    assigned_user = None
    if lead_doc.get('assigned_to'):
        user_doc = await db.users.find_one({'id': lead_doc['assigned_to']}, {"_id": 0, "password": 0, "otp": 0})
        if user_doc:
            assigned_user = {
                'id': user_doc['id'],
                'name': user_doc['name'],
                'phone': user_doc['phone'],
                'email': user_doc.get('email')
            }
    
    # Get project info
    project = None
    if lead_doc.get('project_id'):
        project_doc = await db.projects.find_one({'id': lead_doc['project_id']}, {"_id": 0})
        if project_doc:
            project = {
                'id': project_doc['id'],
                'name': project_doc['name'],
                'city': project_doc['city'],
                'state': project_doc['state']
            }
    
    # Get status info
    status = None
    if lead_doc.get('status_id'):
        status_doc = await db.master_categories.find_one({'id': lead_doc['status_id']}, {"_id": 0})
        if status_doc:
            status = {
                'id': status_doc['id'],
                'name': status_doc['name'],
                'slug': status_doc['slug']
            }
    
    # Get follow-ups
    followups = await db.lead_followups.find(
        {'lead_id': lead_id},
        {"_id": 0}
    ).sort('followup_date', -1).to_list(50)
    
    for followup in followups:
        deserialize_doc(followup)
    
    return {
        'lead': Lead(**lead_doc),
        'assigned_user': assigned_user,
        'project': project,
        'status': status,
        'followups': followups
    }

@router.put("/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_update: LeadUpdate, request: Request):
    """Update lead"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get existing lead
    existing = await db.leads.find_one({'id': lead_id, 'deleted_at': None}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Update lead
    update_data = lead_update.model_dump(exclude_none=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # If assigning to someone for first time, set assigned_at
    if 'assigned_to' in update_data and not existing.get('assigned_at'):
        update_data['assigned_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.leads.update_one(
        {'id': lead_id},
        {'$set': update_data}
    )
    
    # Audit log
    audit_service = AuditLogService(db)
    await audit_service.log(
        auditable_type="Lead",
        auditable_id=lead_id,
        event="updated",
        module="lead",
        user_id=user.get('user_id'),
        old_values=existing,
        new_values=update_data,
        tenant_id=existing.get('tenant_id'),
        project_id=existing.get('project_id'),
        ip_address=request.client.host
    )
    
    # Get updated lead
    lead_doc = await db.leads.find_one({'id': lead_id}, {"_id": 0})
    lead_doc = deserialize_doc(lead_doc)
    
    return Lead(**lead_doc)

@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, request: Request):
    """Soft delete lead"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get existing lead
    existing = await db.leads.find_one({'id': lead_id, 'deleted_at': None}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Soft delete
    await db.leads.update_one(
        {'id': lead_id},
        {'$set': {'deleted_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    # Audit log
    audit_service = AuditLogService(db)
    await audit_service.log(
        auditable_type="Lead",
        auditable_id=lead_id,
        event="deleted",
        module="lead",
        user_id=user.get('user_id'),
        tenant_id=existing.get('tenant_id'),
        project_id=existing.get('project_id'),
        ip_address=request.client.host
    )
    
    return {"message": "Lead deleted successfully"}

# Follow-up routes
@router.post("/followups", response_model=LeadFollowup)
async def create_followup(followup_create: LeadFollowupCreate, request: Request):
    """Create a follow-up for a lead"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get lead
    lead_doc = await db.leads.find_one({'id': followup_create.lead_id, 'deleted_at': None}, {"_id": 0})
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Create followup
    followup_data = followup_create.model_dump()
    followup_data['tenant_id'] = lead_doc['tenant_id']
    followup_data['project_id'] = lead_doc.get('project_id')
    
    followup = LeadFollowup(**followup_data)
    followup_doc = serialize_doc(followup.model_dump())
    
    await db.lead_followups.insert_one(followup_doc)
    
    # Update lead's last_followup_date and next_followup_date
    update_data = {
        'last_followup_date': datetime.now(timezone.utc).isoformat(),
        'followup_count': lead_doc.get('followup_count', 0) + 1,
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    if followup_create.next_followup_date:
        update_data['next_followup_date'] = followup_create.next_followup_date.isoformat()
    
    await db.leads.update_one(
        {'id': followup_create.lead_id},
        {'$set': update_data}
    )
    
    return followup

@router.get("/{lead_id}/followups", response_model=List[LeadFollowup])
async def get_lead_followups(lead_id: str, request: Request):
    """Get all follow-ups for a lead"""
    db = get_db(request)
    
    followups = await db.lead_followups.find(
        {'lead_id': lead_id},
        {"_id": 0}
    ).sort('followup_date', -1).to_list(100)
    
    for followup in followups:
        deserialize_doc(followup)
    
    return [LeadFollowup(**f) for f in followups]

@router.post("/convert")
async def convert_lead(convert_data: LeadConvert, request: Request):
    """Convert lead to customer"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get lead
    lead_doc = await db.leads.find_one({'id': convert_data.lead_id, 'deleted_at': None}, {"_id": 0})
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead_doc.get('is_converted'):
        raise HTTPException(status_code=400, detail="Lead is already converted")
    
    # Get customer role
    customer_role = await db.roles.find_one({'slug': 'customer'}, {"_id": 0})
    if not customer_role:
        raise HTTPException(status_code=500, detail="Customer role not found")
    
    # Check if user already exists with this phone
    existing_user = await db.users.find_one({'phone': convert_data.customer_phone}, {"_id": 0})
    
    if existing_user:
        customer_id = existing_user['id']
    else:
        # Create customer user
        customer = User(
            phone=convert_data.customer_phone,
            email=convert_data.customer_email,
            name=convert_data.customer_name,
            role_id=customer_role['id'],
            tenant_id=lead_doc['tenant_id']
        )
        customer_doc = serialize_doc(customer.model_dump())
        await db.users.insert_one(customer_doc)
        customer_id = customer.id
    
    # Update lead as converted
    await db.leads.update_one(
        {'id': convert_data.lead_id},
        {'$set': {
            'is_converted': True,
            'converted_to_customer_id': customer_id,
            'converted_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Get 'converted' status
    converted_status = await db.master_categories.find_one({'slug': 'converted', 'type': 'lead_status'}, {"_id": 0})
    if converted_status:
        await db.leads.update_one(
            {'id': convert_data.lead_id},
            {'$set': {'status_id': converted_status['id']}}
        )
    
    return {
        "message": "Lead converted to customer successfully",
        "customer_id": customer_id
    }

@router.get("/stats/summary")
async def get_lead_stats(request: Request, tenant_id: Optional[str] = None, project_id: Optional[str] = None):
    """Get lead statistics"""
    db = get_db(request)
    user = await get_current_user(request)
    
    query = {'deleted_at': None}
    
    # If not super admin, filter by tenant
    if user.get('role') != 'super_admin':
        query['tenant_id'] = user.get('tenant_id')
    elif tenant_id:
        query['tenant_id'] = tenant_id
    
    if project_id:
        query['project_id'] = project_id
    
    # Total leads
    total_leads = await db.leads.count_documents(query)
    
    # Converted leads
    query['is_converted'] = True
    converted_leads = await db.leads.count_documents(query)
    
    # Active leads (not converted)
    query['is_converted'] = False
    active_leads = await db.leads.count_documents(query)
    
    # Leads by status
    del query['is_converted']
    pipeline = [
        {'$match': query},
        {'$lookup': {
            'from': 'master_categories',
            'localField': 'status_id',
            'foreignField': 'id',
            'as': 'status_info'
        }},
        {'$unwind': '$status_info'},
        {'$group': {
            '_id': '$status_info.name',
            'count': {'$sum': 1}
        }}
    ]
    
    status_breakdown = await db.leads.aggregate(pipeline).to_list(100)
    
    return {
        'total_leads': total_leads,
        'active_leads': active_leads,
        'converted_leads': converted_leads,
        'conversion_rate': (converted_leads / total_leads * 100) if total_leads > 0 else 0,
        'status_breakdown': status_breakdown
    }
