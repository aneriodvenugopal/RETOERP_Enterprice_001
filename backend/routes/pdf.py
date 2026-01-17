"""
PDF Generation API Routes
Endpoints for generating and downloading PDFs
"""

from fastapi import APIRouter, HTTPException, Request, Response, Query
from fastapi.responses import StreamingResponse
from services.pdf_service import PDFGenerator, number_to_words
from middleware.auth import get_current_user
from datetime import datetime, timezone
from typing import Optional
import uuid

router = APIRouter(prefix="/pdf", tags=["pdf"])


def get_db(request: Request):
    return request.app.state.db


async def get_user_from_request_or_token(request: Request, token: Optional[str] = None):
    """Get user from request header or query parameter token"""
    # If token provided as query param, temporarily add it to headers
    if token:
        # Create a modified request with the token in header
        from starlette.datastructures import Headers, MutableHeaders
        new_headers = MutableHeaders(request._headers)
        new_headers["authorization"] = f"Bearer {token}"
        request._headers = new_headers
    
    return await get_current_user(request)


async def get_company_info(db, tenant_id: str) -> dict:
    """Get company info for PDF header"""
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        return {"name": "ExlainERP"}
    
    company = tenant.get("company", {})
    return {
        "name": company.get("name", tenant.get("name", "ExlainERP")),
        "address": company.get("address", ""),
        "phone": company.get("phone", ""),
        "email": company.get("email", ""),
        "logo": company.get("logo", "")
    }


@router.get("/booking-confirmation/{booking_id}")
async def generate_booking_confirmation_pdf(
    booking_id: str, 
    request: Request,
    token: Optional[str] = Query(None, description="Optional auth token for direct access")
):
    """Generate Booking Confirmation Letter PDF
    
    Can be accessed publicly for booking confirmations
    """
    db = get_db(request)
    
    # Try to authenticate, but don't require it
    user = None
    try:
        if token:
            user = await get_user_from_request_or_token(request, token)
        else:
            user = await get_current_user(request)
    except:
        pass  # Allow public access
    
    # Get booking details
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        # Try to find in properties with booked status
        property_doc = await db.properties.find_one({"id": booking_id}, {"_id": 0})
        if not property_doc:
            raise HTTPException(status_code=404, detail="Booking not found")
        booking = {
            "id": property_doc.get("id"),
            "booking_date": property_doc.get("booked_at") or property_doc.get("created_at"),
            "customer_id": property_doc.get("customer_id"),
            "property_id": property_doc.get("id"),
            "project_id": property_doc.get("project_id"),
            "tenant_id": property_doc.get("tenant_id"),
            "booking_amount": property_doc.get("booking_amount", 0),
        }
    
    # Get customer details
    customer = await db.customers.find_one({"id": booking.get("customer_id")}, {"_id": 0})
    if not customer:
        customer = {"name": "N/A", "phone": "N/A", "email": "N/A", "address": "N/A"}
    
    # Get property details
    property_doc = await db.properties.find_one({"id": booking.get("property_id") or booking_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get project details
    project = await db.projects.find_one({"id": property_doc.get("project_id")}, {"_id": 0})
    project_name = project.get("name", "N/A") if project else "N/A"
    
    # Get payment schedule
    payments = await db.emi_schedules.find(
        {"property_id": property_doc.get("id")},
        {"_id": 0}
    ).sort("due_date", 1).to_list(100)
    
    payment_schedule = []
    for p in payments:
        payment_schedule.append({
            "installment_name": p.get("installment_name", "EMI"),
            "due_date": p.get("due_date"),
            "amount": p.get("amount", 0),
            "status": p.get("status", "Pending")
        })
    
    # Get company info
    company_info = await get_company_info(db, booking.get("tenant_id") or property_doc.get("tenant_id"))
    
    # Prepare booking data
    booking_data = {
        "booking_id": booking.get("id", booking_id),
        "booking_date": booking.get("booking_date") or datetime.now(timezone.utc).isoformat(),
        "customer_name": customer.get("name"),
        "customer_phone": customer.get("phone"),
        "customer_email": customer.get("email"),
        "customer_address": customer.get("address", "N/A"),
        "project_name": project_name,
        "property_number": property_doc.get("property_number"),
        "block": property_doc.get("block", "-"),
        "area": property_doc.get("area", 0),
        "facing": property_doc.get("facing", "-"),
        "total_price": property_doc.get("price", 0),
        "booking_amount": booking.get("booking_amount", 0),
        "balance_amount": property_doc.get("price", 0) - booking.get("booking_amount", 0),
        "payment_schedule": payment_schedule
    }
    
    # Generate PDF
    pdf_generator = PDFGenerator(company_info)
    pdf_buffer = pdf_generator.generate_booking_confirmation(booking_data)
    
    filename = f"Booking_Confirmation_{property_doc.get('property_number', booking_id)[:8]}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/payment-receipt/{payment_id}")
async def generate_payment_receipt_pdf(payment_id: str, request: Request):
    """Generate Payment Receipt PDF"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get payment details
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        # Try EMI payment
        payment = await db.emi_payments.find_one({"id": payment_id}, {"_id": 0})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Get customer details
    customer = await db.customers.find_one({"id": payment.get("customer_id")}, {"_id": 0})
    if not customer:
        customer = {"name": "N/A", "phone": "N/A"}
    
    # Get property and project details
    property_doc = await db.properties.find_one({"id": payment.get("property_id")}, {"_id": 0})
    project_name = "N/A"
    property_number = "N/A"
    
    if property_doc:
        property_number = property_doc.get("property_number", "N/A")
        project = await db.projects.find_one({"id": property_doc.get("project_id")}, {"_id": 0})
        project_name = project.get("name", "N/A") if project else "N/A"
    
    # Get company info
    company_info = await get_company_info(db, payment.get("tenant_id"))
    
    # Prepare payment data
    amount = payment.get("amount", 0)
    payment_data = {
        "receipt_number": f"RCP-{payment.get('id', '')[:8].upper()}",
        "payment_date": payment.get("payment_date") or payment.get("created_at"),
        "payment_mode": payment.get("payment_mode", "Cash"),
        "customer_name": customer.get("name"),
        "customer_phone": customer.get("phone"),
        "project_name": project_name,
        "property_number": property_number,
        "amount": amount,
        "amount_in_words": number_to_words(amount),
        "payment_for": payment.get("payment_for") or payment.get("description") or "Property Payment",
        "cheque_number": payment.get("cheque_number") or payment.get("reference_number"),
        "bank_name": payment.get("bank_name")
    }
    
    # Generate PDF
    pdf_generator = PDFGenerator(company_info)
    pdf_buffer = pdf_generator.generate_payment_receipt(payment_data)
    
    filename = f"Receipt_{payment_data['receipt_number']}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/payment-schedule/{property_id}")
async def generate_payment_schedule_pdf(
    property_id: str, 
    request: Request,
    token: Optional[str] = Query(None, description="Optional auth token for direct access")
):
    """Generate Payment Schedule / EMI Statement PDF
    
    Can be accessed publicly for property payment schedules
    """
    db = get_db(request)
    
    # Try to authenticate, but don't require it
    user = None
    try:
        if token:
            user = await get_user_from_request_or_token(request, token)
        else:
            user = await get_current_user(request)
    except:
        pass  # Allow public access
    
    # Get property details
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get customer details
    customer = await db.customers.find_one({"id": property_doc.get("customer_id")}, {"_id": 0})
    if not customer:
        customer = {"name": "N/A", "phone": "N/A"}
    
    # Get project details
    project = await db.projects.find_one({"id": property_doc.get("project_id")}, {"_id": 0})
    project_name = project.get("name", "N/A") if project else "N/A"
    
    # Get EMI schedule
    emi_schedules = await db.emi_schedules.find(
        {"property_id": property_id},
        {"_id": 0}
    ).sort("due_date", 1).to_list(100)
    
    # Get payments made
    payments = await db.emi_payments.find(
        {"property_id": property_id},
        {"_id": 0}
    ).to_list(100)
    
    payment_map = {p.get("emi_schedule_id"): p for p in payments}
    
    # Calculate totals
    total_amount = property_doc.get("price", 0)
    paid_amount = sum(p.get("amount", 0) for p in payments)
    
    # Build installments list
    installments = []
    for emi in emi_schedules:
        payment = payment_map.get(emi.get("id"))
        installments.append({
            "name": emi.get("installment_name", "EMI"),
            "due_date": emi.get("due_date"),
            "amount": emi.get("amount", 0),
            "status": "Paid" if payment else ("Due" if emi.get("status") == "due" else "Upcoming"),
            "paid_date": payment.get("payment_date") if payment else None
        })
    
    # Get company info
    company_info = await get_company_info(db, property_doc.get("tenant_id"))
    
    schedule_data = {
        "customer_name": customer.get("name"),
        "customer_phone": customer.get("phone"),
        "project_name": project_name,
        "property_number": property_doc.get("property_number"),
        "total_amount": total_amount,
        "paid_amount": paid_amount,
        "pending_amount": total_amount - paid_amount,
        "installments": installments
    }
    
    # Generate PDF
    pdf_generator = PDFGenerator(company_info)
    pdf_buffer = pdf_generator.generate_payment_schedule(schedule_data)
    
    filename = f"Payment_Schedule_{property_doc.get('property_number', property_id[:8])}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/allotment-letter/{property_id}")
async def generate_allotment_letter_pdf(
    property_id: str, 
    request: Request,
    token: Optional[str] = Query(None, description="Optional auth token for direct access")
):
    """Generate Property Allotment Letter PDF
    
    Can be accessed:
    1. With Bearer token in Authorization header (logged in users)
    2. With token query parameter for direct link sharing
    3. Without auth for public property documents (limited info)
    """
    db = get_db(request)
    
    # Try to authenticate, but don't require it
    user = None
    try:
        if token:
            user = await get_user_from_request_or_token(request, token)
        else:
            user = await get_current_user(request)
    except:
        pass  # Allow public access with limited info
    
    # Get property details
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get customer details
    customer = await db.customers.find_one({"id": property_doc.get("customer_id")}, {"_id": 0})
    if not customer:
        customer = {"name": "N/A", "phone": "N/A", "address": "N/A"}
    
    # Get project details
    project = await db.projects.find_one({"id": property_doc.get("project_id")}, {"_id": 0})
    project_name = project.get("name", "N/A") if project else "N/A"
    
    # Get company info
    company_info = await get_company_info(db, property_doc.get("tenant_id"))
    
    allotment_data = {
        "allotment_number": f"ALT-{property_doc.get('id', '')[:8].upper()}",
        "allotment_date": property_doc.get("booked_at") or property_doc.get("created_at"),
        "customer_name": customer.get("name"),
        "customer_phone": customer.get("phone"),
        "customer_address": customer.get("address", "N/A"),
        "project_name": project_name,
        "property_number": property_doc.get("property_number"),
        "block": property_doc.get("block", "-"),
        "floor": property_doc.get("floor", "-"),
        "area": property_doc.get("area", 0),
        "facing": property_doc.get("facing", "-"),
        "price_per_sqft": property_doc.get("price_per_sqft", 0),
        "total_price": property_doc.get("price", 0)
    }
    
    # Generate PDF
    pdf_generator = PDFGenerator(company_info)
    pdf_buffer = pdf_generator.generate_allotment_letter(allotment_data)
    
    filename = f"Allotment_Letter_{property_doc.get('property_number', property_id[:8])}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/customer-statement/{customer_id}")
async def generate_customer_statement_pdf(customer_id: str, request: Request):
    """Generate Customer Account Statement PDF"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get customer details
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get all properties for this customer
    properties = await db.properties.find(
        {"customer_id": customer_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get all payments
    payments = await db.payments.find(
        {"customer_id": customer_id},
        {"_id": 0}
    ).sort("payment_date", -1).to_list(100)
    
    emi_payments = await db.emi_payments.find(
        {"customer_id": customer_id},
        {"_id": 0}
    ).sort("payment_date", -1).to_list(100)
    
    # Get company info
    tenant_id = customer.get("tenant_id")
    company_info = await get_company_info(db, tenant_id)
    
    # Build statement data
    total_property_value = sum(p.get("price", 0) for p in properties)
    total_paid = sum(p.get("amount", 0) for p in payments) + sum(p.get("amount", 0) for p in emi_payments)
    
    # Combine and sort all payments
    all_payments = []
    for p in payments:
        all_payments.append({
            "date": p.get("payment_date"),
            "description": p.get("description", "Payment"),
            "amount": p.get("amount", 0),
            "mode": p.get("payment_mode", "Cash")
        })
    for p in emi_payments:
        all_payments.append({
            "date": p.get("payment_date"),
            "description": f"EMI Payment - {p.get('installment_name', '')}",
            "amount": p.get("amount", 0),
            "mode": p.get("payment_mode", "Cash")
        })
    
    all_payments.sort(key=lambda x: x.get("date") or "", reverse=True)
    
    schedule_data = {
        "customer_name": customer.get("name"),
        "customer_phone": customer.get("phone"),
        "project_name": f"{len(properties)} Properties",
        "property_number": ", ".join([p.get("property_number", "") for p in properties[:3]]),
        "total_amount": total_property_value,
        "paid_amount": total_paid,
        "pending_amount": total_property_value - total_paid,
        "installments": [
            {
                "name": p.get("description", "Payment"),
                "due_date": p.get("date"),
                "amount": p.get("amount"),
                "status": "Paid",
                "paid_date": p.get("date")
            }
            for p in all_payments[:20]  # Last 20 transactions
        ]
    }
    
    # Generate PDF using payment schedule template
    pdf_generator = PDFGenerator(company_info)
    pdf_buffer = pdf_generator.generate_payment_schedule(schedule_data)
    
    filename = f"Customer_Statement_{customer.get('name', customer_id[:8]).replace(' ', '_')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
