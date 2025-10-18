from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
from utils.helpers import serialize_doc
from middleware.auth import get_current_user as auth_get_current_user

router = APIRouter(prefix="/customer", tags=["customer"])

def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    """Get current user from JWT token"""
    return await auth_get_current_user(request)

class ResaleRequest(BaseModel):
    property_id: str
    booking_id: str
    asking_price: float
    reason: Optional[str] = None
    notes: Optional[str] = None

@router.get("/dashboard")
async def get_customer_dashboard(request: Request):
    """Get customer dashboard overview"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get('user_id')
    
    # Get customer's bookings
    bookings = await db.bookings.find(
        {'customer_id': user_id, 'deleted_at': None},
        {'_id': 0}
    ).to_list(length=None)
    
    total_bookings = len(bookings)
    total_invested = sum(b.get('total_amount', 0) for b in bookings)
    total_paid = sum(b.get('paid_amount', 0) for b in bookings)
    total_pending = total_invested - total_paid
    
    # Get active bookings (not cancelled)
    active_bookings = [b for b in bookings if b.get('status') != 'cancelled']
    
    # Get properties for these bookings
    property_ids = [b['property_id'] for b in active_bookings if b.get('property_id')]
    properties = []
    if property_ids:
        properties = await db.properties.find(
            {'id': {'$in': property_ids}, 'deleted_at': None},
            {'_id': 0}
        ).to_list(length=None)
    
    # Get upcoming payment schedules
    today = datetime.now(timezone.utc).date().isoformat()
    future_date = (datetime.now(timezone.utc).date()).isoformat()
    
    upcoming_payments = await db.payment_schedules.find({
        'booking_id': {'$in': [b['id'] for b in active_bookings]},
        'status': 'pending',
        'due_date': {'$gte': today},
        'deleted_at': None
    }, {'_id': 0}).sort('due_date', 1).limit(5).to_list(length=5)
    
    # Get overdue payments
    overdue_payments = await db.payment_schedules.find({
        'booking_id': {'$in': [b['id'] for b in active_bookings]},
        'status': 'pending',
        'due_date': {'$lt': today},
        'deleted_at': None
    }, {'_id': 0}).to_list(length=None)
    
    overdue_amount = sum(p.get('amount', 0) for p in overdue_payments)
    
    # Recent payments
    recent_payments = await db.payments.find(
        {'customer_id': user_id, 'deleted_at': None},
        {'_id': 0}
    ).sort('payment_date', -1).limit(5).to_list(length=5)
    
    return {
        'overview': {
            'total_bookings': total_bookings,
            'active_bookings': len(active_bookings),
            'total_invested': round(total_invested, 2),
            'total_paid': round(total_paid, 2),
            'total_pending': round(total_pending, 2),
            'overdue_amount': round(overdue_amount, 2),
            'overdue_count': len(overdue_payments)
        },
        'properties': properties,
        'upcoming_payments': upcoming_payments,
        'recent_payments': recent_payments
    }

@router.get("/bookings")
async def get_customer_bookings(request: Request):
    """Get all customer bookings"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get('user_id')
    
    # Get bookings
    bookings = await db.bookings.find(
        {'customer_id': user_id, 'deleted_at': None},
        {'_id': 0}
    ).to_list(length=None)
    
    # Enrich with property and project details
    for booking in bookings:
        # Get property
        if booking.get('property_id'):
            property_doc = await db.properties.find_one(
                {'id': booking['property_id']},
                {'_id': 0}
            )
            booking['property'] = property_doc
        
        # Get project
        if booking.get('project_id'):
            project = await db.projects.find_one(
                {'id': booking['project_id']},
                {'_id': 0}
            )
            booking['project'] = project
        
        # Get payment schedules
        schedules = await db.payment_schedules.find(
            {'booking_id': booking['id'], 'deleted_at': None},
            {'_id': 0}
        ).to_list(length=None)
        booking['payment_schedules'] = schedules
    
    return {'bookings': bookings}

@router.get("/bookings/{booking_id}")
async def get_booking_detail(booking_id: str, request: Request):
    """Get detailed booking information"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get('user_id')
    
    # Get booking
    booking = await db.bookings.find_one(
        {'id': booking_id, 'customer_id': user_id, 'deleted_at': None},
        {'_id': 0}
    )
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get property details
    if booking.get('property_id'):
        property_doc = await db.properties.find_one(
            {'id': booking['property_id']},
            {'_id': 0}
        )
        booking['property'] = property_doc
    
    # Get project details
    if booking.get('project_id'):
        project = await db.projects.find_one(
            {'id': booking['project_id']},
            {'_id': 0}
        )
        booking['project'] = project
    
    # Get all payments
    payments = await db.payments.find(
        {'booking_id': booking_id, 'deleted_at': None},
        {'_id': 0}
    ).sort('payment_date', -1).to_list(length=None)
    booking['payments'] = payments
    
    # Get payment schedules
    schedules = await db.payment_schedules.find(
        {'booking_id': booking_id, 'deleted_at': None},
        {'_id': 0}
    ).sort('due_date', 1).to_list(length=None)
    booking['payment_schedules'] = schedules
    
    return booking

@router.get("/payments")
async def get_customer_payments(request: Request):
    """Get all customer payments"""
    user = get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get('user_id')
    
    # Get payments
    payments = await db.payments.find(
        {'customer_id': user_id, 'deleted_at': None},
        {'_id': 0}
    ).sort('payment_date', -1).to_list(length=None)
    
    # Enrich with booking and property details
    for payment in payments:
        if payment.get('booking_id'):
            booking = await db.bookings.find_one(
                {'id': payment['booking_id']},
                {'_id': 0, 'property_id': 1, 'project_id': 1}
            )
            
            if booking and booking.get('property_id'):
                property_doc = await db.properties.find_one(
                    {'id': booking['property_id']},
                    {'_id': 0, 'property_number': 1}
                )
                payment['property_number'] = property_doc.get('property_number') if property_doc else None
    
    return {'payments': payments}

@router.get("/payment-schedules")
async def get_customer_payment_schedules(request: Request, status: Optional[str] = Query(None)):
    """Get customer's payment schedules"""
    user = get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get('user_id')
    
    # Get customer's bookings first
    bookings = await db.bookings.find(
        {'customer_id': user_id, 'deleted_at': None},
        {'_id': 0, 'id': 1}
    ).to_list(length=None)
    
    booking_ids = [b['id'] for b in bookings]
    
    if not booking_ids:
        return {'schedules': []}
    
    # Build query
    query = {
        'booking_id': {'$in': booking_ids},
        'deleted_at': None
    }
    
    if status:
        query['status'] = status
    
    # Get schedules
    schedules = await db.payment_schedules.find(query, {'_id': 0}).sort('due_date', 1).to_list(length=None)
    
    # Enrich with property details
    for schedule in schedules:
        booking = await db.bookings.find_one(
            {'id': schedule['booking_id']},
            {'_id': 0}
        )
        
        if booking:
            schedule['booking'] = booking
            
            if booking.get('property_id'):
                property_doc = await db.properties.find_one(
                    {'id': booking['property_id']},
                    {'_id': 0, 'property_number': 1}
                )
                schedule['property_number'] = property_doc.get('property_number') if property_doc else None
    
    return {'schedules': schedules}

@router.get("/properties")
async def get_customer_properties(request: Request):
    """Get all properties owned by customer"""
    user = get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get('user_id')
    
    # Get customer's bookings
    bookings = await db.bookings.find(
        {'customer_id': user_id, 'status': {'$ne': 'cancelled'}, 'deleted_at': None},
        {'_id': 0}
    ).to_list(length=None)
    
    property_ids = [b['property_id'] for b in bookings if b.get('property_id')]
    
    if not property_ids:
        return {'properties': []}
    
    # Get properties
    properties = await db.properties.find(
        {'id': {'$in': property_ids}, 'deleted_at': None},
        {'_id': 0}
    ).to_list(length=None)
    
    # Enrich with project and booking details
    for prop in properties:
        # Get project
        if prop.get('project_id'):
            project = await db.projects.find_one(
                {'id': prop['project_id']},
                {'_id': 0}
            )
            prop['project'] = project
        
        # Find corresponding booking
        booking = next((b for b in bookings if b['property_id'] == prop['id']), None)
        if booking:
            prop['booking_id'] = booking['id']
            prop['booking_date'] = booking.get('booking_date')
            prop['payment_status'] = 'Fully Paid' if booking.get('balance_amount', 0) <= 0 else 'Pending'
    
    return {'properties': properties}

@router.post("/resale-request")
async def create_resale_request(resale_data: ResaleRequest, request: Request):
    """Request property resale"""
    user = get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get('user_id')
    
    # Verify booking belongs to customer
    booking = await db.bookings.find_one(
        {'id': resale_data.booking_id, 'customer_id': user_id, 'deleted_at': None},
        {'_id': 0}
    )
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if already requested
    existing = await db.resale_requests.find_one({
        'booking_id': resale_data.booking_id,
        'status': {'$in': ['pending', 'approved']},
        'deleted_at': None
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Resale request already exists")
    
    # Create resale request
    import uuid
    resale_request = {
        'id': str(uuid.uuid4()),
        'customer_id': user_id,
        'property_id': resale_data.property_id,
        'booking_id': resale_data.booking_id,
        'asking_price': resale_data.asking_price,
        'reason': resale_data.reason,
        'notes': resale_data.notes,
        'status': 'pending',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'deleted_at': None
    }
    
    await db.resale_requests.insert_one(serialize_doc(resale_request))
    
    return {
        'message': 'Resale request submitted successfully',
        'request_id': resale_request['id']
    }

@router.get("/resale-requests")
async def get_customer_resale_requests(request: Request):
    """Get customer's resale requests"""
    user = get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user.get('user_id')
    
    # Get resale requests
    requests = await db.resale_requests.find(
        {'customer_id': user_id, 'deleted_at': None},
        {'_id': 0}
    ).sort('created_at', -1).to_list(length=None)
    
    # Enrich with property details
    for req in requests:
        if req.get('property_id'):
            property_doc = await db.properties.find_one(
                {'id': req['property_id']},
                {'_id': 0}
            )
            req['property'] = property_doc
    
    return {'requests': requests}
