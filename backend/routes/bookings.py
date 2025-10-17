from fastapi import APIRouter, HTTPException, Request
from models.payment import Booking, BookingCreate, Payment, PaymentCreate, PaymentSchedule, PaymentScheduleCreate
from models.property import Property
from utils.helpers import serialize_doc, deserialize_doc
from services.audit_log_service import AuditLogService
from middleware.auth import get_current_user
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import uuid

router = APIRouter(prefix="/bookings", tags=["bookings"])

def get_db(request: Request):
    return request.app.state.db

@router.post("/", response_model=Booking)
async def create_booking(booking_create: BookingCreate, request: Request):
    """Create a new booking"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Check if property exists and is available
    property_doc = await db.properties.find_one({'id': booking_create.property_id, 'deleted_at': None}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get booked status
    booked_status = await db.master_categories.find_one({'slug': 'booked', 'type': 'property_status'}, {"_id": 0})
    if not booked_status:
        raise HTTPException(status_code=500, detail="Booked status not found")
    
    # Check property status
    current_status = await db.master_categories.find_one({'id': property_doc['status_id']}, {"_id": 0})
    if current_status and current_status['slug'] not in ['available', 'blocked']:
        raise HTTPException(status_code=400, detail=f"Property is already {current_status['name']}")
    
    # Create booking
    booking = Booking(**booking_create.model_dump())
    booking_doc = serialize_doc(booking.model_dump())
    
    await db.bookings.insert_one(booking_doc)
    
    # Update property status to booked
    await db.properties.update_one(
        {'id': booking_create.property_id},
        {'$set': {
            'status_id': booked_status['id'],
            'booked_by': booking_create.customer_id,
            'booked_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update project stats
    from routes.properties import update_project_stats
    await update_project_stats(db, booking_create.project_id)
    
    # Create payment schedules if EMI
    if booking.payment_plan_type == 'emi' and booking.emi_months:
        await create_payment_schedules(db, booking)
    
    # Audit log
    audit_service = AuditLogService(db)
    await audit_service.log(
        auditable_type="Booking",
        auditable_id=booking.id,
        event="created",
        module="booking",
        user_id=user.get('user_id'),
        new_values=booking_doc,
        tenant_id=booking.tenant_id,
        project_id=booking.project_id,
        ip_address=request.client.host
    )
    
    return booking

async def create_payment_schedules(db, booking: Booking):
    """Create payment schedules for EMI bookings"""
    remaining_amount = booking.total_amount - (booking.down_payment or booking.booking_amount)
    monthly_amount = remaining_amount / booking.emi_months
    
    # First schedule is for down payment (if any)
    if booking.down_payment and booking.down_payment > booking.booking_amount:
        schedule = PaymentSchedule(
            tenant_id=booking.tenant_id,
            project_id=booking.project_id,
            booking_id=booking.id,
            installment_number=0,
            due_amount=booking.down_payment - booking.booking_amount,
            due_date=datetime.now(timezone.utc) + timedelta(days=7),
            currency_id=booking.currency_id,
            remaining_amount=booking.down_payment - booking.booking_amount
        )
        schedule_doc = serialize_doc(schedule.model_dump())
        await db.payment_schedules.insert_one(schedule_doc)
    
    # Create monthly installment schedules
    for i in range(1, booking.emi_months + 1):
        due_date = datetime.now(timezone.utc) + timedelta(days=30 * i)
        schedule = PaymentSchedule(
            tenant_id=booking.tenant_id,
            project_id=booking.project_id,
            booking_id=booking.id,
            installment_number=i,
            due_amount=monthly_amount,
            due_date=due_date,
            currency_id=booking.currency_id,
            remaining_amount=monthly_amount
        )
        schedule_doc = serialize_doc(schedule.model_dump())
        await db.payment_schedules.insert_one(schedule_doc)

@router.get("/", response_model=List[Booking])
async def get_bookings(
    request: Request,
    tenant_id: Optional[str] = None,
    project_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get all bookings with filters"""
    db = get_db(request)
    user = await get_current_user(request)
    
    query = {'deleted_at': None}
    
    # If not super admin, filter by tenant
    if user.get('role') != 'super_admin':
        query['tenant_id'] = user.get('tenant_id')
    elif tenant_id:
        query['tenant_id'] = tenant_id
    
    # If customer, show only their bookings
    if user.get('role') == 'customer':
        query['customer_id'] = user.get('user_id')
    elif customer_id:
        query['customer_id'] = customer_id
    
    if project_id:
        query['project_id'] = project_id
    
    if status:
        query['status'] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
    
    for booking in bookings:
        deserialize_doc(booking)
    
    return [Booking(**b) for b in bookings]

@router.get("/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, request: Request):
    """Get booking by ID"""
    db = get_db(request)
    
    booking_doc = await db.bookings.find_one({'id': booking_id, 'deleted_at': None}, {"_id": 0})
    if not booking_doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking_doc = deserialize_doc(booking_doc)
    return Booking(**booking_doc)

@router.get("/{booking_id}/details")
async def get_booking_details(booking_id: str, request: Request):
    """Get booking with all related information"""
    db = get_db(request)
    
    booking_doc = await db.bookings.find_one({'id': booking_id, 'deleted_at': None}, {"_id": 0})
    if not booking_doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking_doc = deserialize_doc(booking_doc)
    
    # Get property
    property_doc = await db.properties.find_one({'id': booking_doc['property_id']}, {"_id": 0})
    
    # Get project
    project_doc = await db.projects.find_one({'id': booking_doc['project_id']}, {"_id": 0})
    
    # Get payments
    payments = await db.payments.find({'booking_id': booking_id}, {"_id": 0}).sort('payment_date', -1).to_list(100)
    for payment in payments:
        deserialize_doc(payment)
    
    # Get payment schedules
    schedules = await db.payment_schedules.find({'booking_id': booking_id}, {"_id": 0}).sort('installment_number', 1).to_list(100)
    for schedule in schedules:
        deserialize_doc(schedule)
    
    # Calculate totals
    total_paid = sum(p['amount'] for p in payments if p['status'] == 'completed')
    total_pending = booking_doc['total_amount'] - total_paid
    
    return {
        'booking': Booking(**booking_doc),
        'property': property_doc,
        'project': project_doc,
        'payments': payments,
        'payment_schedules': schedules,
        'total_paid': total_paid,
        'total_pending': total_pending,
        'payment_progress': (total_paid / booking_doc['total_amount'] * 100) if booking_doc['total_amount'] > 0 else 0
    }

# Payment routes
@router.post("/{booking_id}/payments", response_model=Payment)
async def create_payment(booking_id: str, payment_create: PaymentCreate, request: Request):
    """Create a payment for a booking"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get booking
    booking_doc = await db.bookings.find_one({'id': booking_id, 'deleted_at': None}, {"_id": 0})
    if not booking_doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Create payment
    payment_data = payment_create.model_dump()
    payment_data['tenant_id'] = booking_doc['tenant_id']
    payment_data['project_id'] = booking_doc['project_id']
    payment_data['property_id'] = booking_doc['property_id']
    payment_data['currency_id'] = booking_doc['currency_id']
    
    # Generate receipt number
    payment_data['receipt_number'] = f"REC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    payment = Payment(**payment_data)
    payment_doc = serialize_doc(payment.model_dump())
    
    await db.payments.insert_one(payment_doc)
    
    # Update payment schedule if installment
    if payment.installment_number is not None:
        schedule = await db.payment_schedules.find_one({
            'booking_id': booking_id,
            'installment_number': payment.installment_number
        }, {"_id": 0})
        
        if schedule:
            paid_amount = schedule.get('paid_amount', 0) + payment.amount
            remaining_amount = schedule['due_amount'] - paid_amount
            status = 'paid' if remaining_amount <= 0 else 'partial'
            
            await db.payment_schedules.update_one(
                {'id': schedule['id']},
                {'$set': {
                    'paid_amount': paid_amount,
                    'remaining_amount': remaining_amount,
                    'status': status,
                    'payment_id': payment.id,
                    'paid_date': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }}
            )
    
    # Check if booking is fully paid
    total_paid = await db.payments.aggregate([
        {'$match': {'booking_id': booking_id, 'status': 'completed'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]).to_list(1)
    
    total_paid_amount = total_paid[0]['total'] if total_paid else 0
    
    if total_paid_amount >= booking_doc['total_amount']:
        # Update booking status to completed
        await db.bookings.update_one(
            {'id': booking_id},
            {'$set': {'status': 'completed', 'updated_at': datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update property status to sold
        sold_status = await db.master_categories.find_one({'slug': 'sold', 'type': 'property_status'}, {"_id": 0})
        if sold_status:
            await db.properties.update_one(
                {'id': booking_doc['property_id']},
                {'$set': {'status_id': sold_status['id'], 'updated_at': datetime.now(timezone.utc).isoformat()}}
            )
            
            # Update project stats
            from routes.properties import update_project_stats
            await update_project_stats(db, booking_doc['project_id'])
    
    # Audit log
    audit_service = AuditLogService(db)
    await audit_service.log(
        auditable_type="Payment",
        auditable_id=payment.id,
        event="created",
        module="payment",
        user_id=user.get('user_id'),
        new_values=payment_doc,
        tenant_id=booking_doc['tenant_id'],
        project_id=booking_doc['project_id'],
        ip_address=request.client.host
    )
    
    return payment

@router.get("/{booking_id}/payments", response_model=List[Payment])
async def get_booking_payments(booking_id: str, request: Request):
    """Get all payments for a booking"""
    db = get_db(request)
    
    payments = await db.payments.find({'booking_id': booking_id}, {"_id": 0}).sort('payment_date', -1).to_list(100)
    
    for payment in payments:
        deserialize_doc(payment)
    
    return [Payment(**p) for p in payments]

@router.get("/{booking_id}/schedules", response_model=List[PaymentSchedule])
async def get_payment_schedules(booking_id: str, request: Request):
    """Get payment schedules for a booking"""
    db = get_db(request)
    
    schedules = await db.payment_schedules.find({'booking_id': booking_id}, {"_id": 0}).sort('installment_number', 1).to_list(100)
    
    for schedule in schedules:
        deserialize_doc(schedule)
    
    return [PaymentSchedule(**s) for s in schedules]
