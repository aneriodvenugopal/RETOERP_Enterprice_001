"""
WhatsApp Webhook Handler for Meta Cloud API
Handles incoming WhatsApp messages and triggers AI workflow

Features:
- 24-hour session management
- Template fallback for expired sessions
- Error handling and logging
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid
import os
import logging
from dotenv import load_dotenv

from middleware.auth import get_current_user
from services.whatsapp_agentic.orchestrator import AIOrchestrator
from services.whatsapp_agentic.meta_whatsapp_client import meta_whatsapp_client
from services.whatsapp_agentic.state_machine import ConversationStateMachine, ConversationState
from services.whatsapp_agentic.session_manager import session_manager

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp AI"])


def get_db(request: Request):
    """Get database from app state"""
    return request.app.state.db


# ============ Pydantic Models ============

class IncomingWebhookPayload(BaseModel):
    """Leonas webhook payload structure"""
    phone: Optional[str] = Field(None, alias="from")
    message_id: Optional[str] = Field(None, alias="id")
    text: Optional[Dict[str, str]] = None
    body: Optional[str] = None
    timestamp: Optional[str] = None
    type: Optional[str] = "text"
    
    class Config:
        populate_by_name = True


class ManualMessageRequest(BaseModel):
    """Request for sending manual message"""
    phone: str
    message: str
    lead_id: Optional[str] = None


class AgentTakeoverRequest(BaseModel):
    """Request for agent to take over conversation"""
    conversation_id: str
    agent_id: Optional[str] = None


# ============ Helper Functions ============

def normalize_phone(phone: str) -> str:
    """Normalize phone number"""
    phone = ''.join(filter(str.isdigit, str(phone)))
    if len(phone) == 10:
        phone = f"91{phone}"
    return phone


async def identify_tenant(db, payload: Dict) -> Optional[str]:
    """Identify tenant from webhook payload"""
    to_number = payload.get("to", payload.get("waba_id", ""))
    
    if to_number:
        mapping = await db.whatsapp_tenant_mapping.find_one(
            {"whatsapp_number": normalize_phone(to_number)},
            {"_id": 0}
        )
        if mapping:
            return mapping["tenant_id"]
    
    # For development - use first active tenant
    tenant = await db.tenants.find_one(
        {"is_active": {"$ne": False}},
        {"_id": 0, "id": 1}
    )
    return tenant.get("id") if tenant else None


async def find_or_create_lead(db, tenant_id: str, phone: str) -> Dict:
    """Find existing lead or create new one"""
    phone = normalize_phone(phone)
    
    lead = await db.leads.find_one(
        {
            "tenant_id": tenant_id,
            "$or": [
                {"buyer_phone": phone},
                {"buyer_phone": phone[-10:]},
                {"buyer_phone": f"+{phone}"},
                {"buyer_phone": f"+91{phone[-10:]}"}
            ]
        },
        {"_id": 0}
    )
    
    if lead:
        return lead
    
    new_lead = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "buyer_name": "",
        "buyer_phone": phone,
        "source": "whatsapp",
        "status": "new",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.leads.insert_one(new_lead)
    return new_lead


async def process_incoming_message(
    db,
    tenant_id: str,
    lead_id: str,
    phone: str,
    message: str,
    message_id: str
):
    """Background task to process incoming message with session management"""
    try:
        # Initialize session manager with db
        session_manager.set_db(db)
        meta_whatsapp_client.set_session_manager(session_manager, db)
        
        # UPDATE SESSION - Customer message opens/refreshes 24-hour window
        session_status = await session_manager.update_session(
            phone=phone,
            tenant_id=tenant_id,
            direction="inbound",
            message_id=message_id
        )
        logger.info(f"📥 Session updated for {phone}: {session_status}")
        
        # Process with AI Orchestrator
        orchestrator = AIOrchestrator(db)
        
        result = await orchestrator.process_message(
            tenant_id=tenant_id,
            lead_id=lead_id,
            phone=phone,
            message=message,
            message_id=message_id
        )
        
        # Send response with session awareness
        if result.get("success") and result.get("response"):
            send_result = await meta_whatsapp_client.send_text_message(
                phone=phone,
                message=result["response"],
                tenant_id=tenant_id,
                check_session=True,
                fallback_to_template=True
            )
            
            if not send_result.get("success"):
                logger.error(f"❌ Failed to send WhatsApp response: {send_result.get('error')}")
                
                # If fallback was used, log it
                if send_result.get("fallback_used"):
                    logger.info(f"📋 Fallback template sent instead to {phone}")
            else:
                logger.info(f"✅ Response sent to {phone}")
        
        if result.get("human_followup_required"):
            await notify_agent_for_followup(db, tenant_id, lead_id, result)
        
        logger.info(f"Message processed: intent={result.get('intent')}, action={result.get('action')}")
        
    except Exception as e:
        logger.error(f"❌ Error processing message: {e}")
        import traceback
        traceback.print_exc()


async def notify_agent_for_followup(db, tenant_id: str, lead_id: str, result: Dict):
    """Notify marketing agent about high-priority conversation"""
    try:
        lead = await db.leads.find_one(
            {"tenant_id": tenant_id, "id": lead_id},
            {"_id": 0}
        )
        
        agent_id = lead.get("assigned_to") if lead else None
        
        if not agent_id:
            agent = await db.users.find_one(
                {"tenant_id": tenant_id, "role": {"$in": ["marketing_agent", "admin"]}},
                {"_id": 0, "id": 1}
            )
            agent_id = agent.get("id") if agent else None
        
        if agent_id:
            notification = {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "user_id": agent_id,
                "type": "whatsapp_followup",
                "title": "WhatsApp Follow-up Required",
                "message": f"High-intent lead requires follow-up. Action: {result.get('action')}",
                "data": {
                    "lead_id": lead_id,
                    "conversation_id": result.get("conversation_id"),
                    "action": result.get("action")
                },
                "is_read": False,
                "created_at": datetime.utcnow()
            }
            await db.notifications.insert_one(notification)
            
    except Exception as e:
        print(f"Error notifying agent: {e}")


# ============ Webhook Endpoints ============

@router.post("/webhook")
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Webhook endpoint for Meta WhatsApp Cloud API"""
    db = get_db(request)
    
    try:
        raw_payload = await request.json()
        print(f"WhatsApp Webhook received: {raw_payload}")
        
        parsed = meta_whatsapp_client.parse_webhook_payload(raw_payload)
        
        if parsed.get("error"):
            return {"status": "error", "message": "Failed to parse payload"}
        
        phone = parsed.get("phone", "")
        message_text = parsed.get("text", "")
        message_id = parsed.get("message_id", "")
        
        if not phone or not message_text:
            return {"status": "ok", "message": "Non-message webhook received"}
        
        phone = normalize_phone(phone)
        tenant_id = await identify_tenant(db, raw_payload)
        
        if not tenant_id:
            return {"status": "error", "message": "Tenant not identified"}
        
        lead = await find_or_create_lead(db, tenant_id, phone)
        lead_id = lead["id"]
        
        background_tasks.add_task(
            process_incoming_message,
            db,
            tenant_id,
            lead_id,
            phone,
            message_text,
            message_id
        )
        
        return {
            "status": "ok",
            "message": "Message received and processing",
            "lead_id": lead_id
        }
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/webhook")
async def whatsapp_webhook_verify(request: Request):
    """Webhook verification endpoint for Meta Cloud API"""
    params = request.query_params
    
    # Meta sends hub.mode, hub.challenge, hub.verify_token
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    verify_token = os.getenv("META_WHATSAPP_VERIFY_TOKEN", os.getenv("WHATSAPP_VERIFY_TOKEN", "realapex_whatsapp_verify"))
    
    if mode == "subscribe" and token == verify_token:
        print("✅ Webhook verified successfully!")
        return int(challenge) if challenge else 0
    
    # For non-verification requests, return OK
    return {"status": "ok", "message": "WhatsApp webhook active"}


# ============ API Endpoints ============

@router.post("/send")
async def send_whatsapp_message(
    msg_request: ManualMessageRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Send manual WhatsApp message"""
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    if not tenant_id:
        raise HTTPException(status_code=403, detail="Tenant not identified")
    
    result = await meta_whatsapp_client.send_text_message(
        phone=msg_request.phone,
        message=msg_request.message,
        tenant_id=tenant_id
    )
    
    if result.get("success"):
        conversation = await db.whatsapp_conversations.find_one(
            {"tenant_id": tenant_id, "phone": normalize_phone(msg_request.phone)},
            {"_id": 0}
        )
        
        if conversation:
            message_doc = {
                "id": str(uuid.uuid4()),
                "conversation_id": conversation["id"],
                "tenant_id": tenant_id,
                "lead_id": msg_request.lead_id,
                "role": "assistant",
                "content": msg_request.message,
                "sent_by": current_user.get("id"),
                "sent_by_name": current_user.get("name", "Agent"),
                "is_manual": True,
                "external_message_id": result.get("message_id"),
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
            await db.whatsapp_messages.insert_one(message_doc)
    
    return {
        "success": result.get("success", False),
        "message_id": result.get("message_id"),
        "error": result.get("error")
    }


@router.post("/agent-takeover")
async def agent_takeover(
    takeover_request: AgentTakeoverRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Agent takes over conversation from AI"""
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    agent_id = takeover_request.agent_id or current_user.get("id")
    
    state_machine = ConversationStateMachine(db)
    
    await state_machine.enable_human_handoff(
        conversation_id=takeover_request.conversation_id,
        agent_id=agent_id,
        reason="agent_takeover"
    )
    
    await db.whatsapp_messages.insert_one({
        "id": str(uuid.uuid4()),
        "conversation_id": takeover_request.conversation_id,
        "tenant_id": tenant_id,
        "role": "system",
        "content": f"Agent {current_user.get('name', 'Unknown')} took over the conversation",
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow()
    })
    
    return {"success": True, "message": "Agent takeover successful"}


@router.post("/resume-ai/{conversation_id}")
async def resume_ai_conversation(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Resume AI handling for a conversation"""
    db = get_db(request)
    
    state_machine = ConversationStateMachine(db)
    await state_machine.resume_ai(conversation_id)
    
    return {"success": True, "message": "AI resumed for conversation"}


@router.get("/conversations")
async def get_conversations(
    request: Request,
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    state: Optional[str] = None,
    ai_enabled: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get WhatsApp conversations for tenant"""
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    query = {"tenant_id": tenant_id}
    
    if status:
        query["status"] = status
    if state:
        query["state"] = state
    if ai_enabled is not None:
        query["ai_enabled"] = ai_enabled
    
    conversations = await db.whatsapp_conversations.find(
        query,
        {"_id": 0}
    ).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for conv in conversations:
        lead = await db.leads.find_one(
            {"tenant_id": tenant_id, "id": conv.get("lead_id")},
            {"_id": 0, "buyer_name": 1, "buyer_phone": 1, "status": 1}
        )
        conv["lead"] = lead
        
        last_msg = await db.whatsapp_messages.find_one(
            {"conversation_id": conv["id"]},
            {"_id": 0, "content": 1, "role": 1, "timestamp": 1},
            sort=[("timestamp", -1)]
        )
        conv["last_message"] = last_msg
    
    total = await db.whatsapp_conversations.count_documents(query)
    
    return {
        "conversations": conversations,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.get("/conversations/{conversation_id}")
async def get_conversation_detail(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get full conversation with messages"""
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    orchestrator = AIOrchestrator(db)
    conversation = await orchestrator.get_conversation_for_dashboard(
        tenant_id=tenant_id,
        conversation_id=conversation_id
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


@router.get("/conversations/lead/{lead_id}")
async def get_conversation_by_lead(
    lead_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get conversation by lead ID"""
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    orchestrator = AIOrchestrator(db)
    conversation = await orchestrator.get_conversation_for_dashboard(
        tenant_id=tenant_id,
        lead_id=lead_id
    )
    
    if not conversation:
        return {"conversation": None, "message": "No WhatsApp conversation found for this lead"}
    
    return conversation


@router.get("/stats")
async def get_whatsapp_stats(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get WhatsApp AI statistics"""
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    total_conversations = await db.whatsapp_conversations.count_documents(
        {"tenant_id": tenant_id}
    )
    
    active_ai = await db.whatsapp_conversations.count_documents(
        {"tenant_id": tenant_id, "ai_enabled": True, "status": "active"}
    )
    
    human_handoff = await db.whatsapp_conversations.count_documents(
        {"tenant_id": tenant_id, "ai_enabled": False, "status": "active"}
    )
    
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$group": {"_id": "$state", "count": {"$sum": 1}}}
    ]
    state_dist = await db.whatsapp_conversations.aggregate(pipeline).to_list(20)
    
    from datetime import timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today = await db.whatsapp_messages.count_documents(
        {"tenant_id": tenant_id, "timestamp": {"$gte": today_start}}
    )
    
    visits_via_wa = await db.site_visits.count_documents(
        {"tenant_id": tenant_id, "source": "whatsapp_ai"}
    )
    
    return {
        "total_conversations": total_conversations,
        "active_ai_conversations": active_ai,
        "human_handoff_conversations": human_handoff,
        "state_distribution": {item["_id"]: item["count"] for item in state_dist},
        "messages_today": messages_today,
        "site_visits_scheduled": visits_via_wa
    }


# ============ TEST/SIMULATOR ENDPOINTS ============

@router.post("/simulate")
async def simulate_whatsapp_message(
    request: Request,
    phone: str,
    message: str,
    current_user: dict = Depends(get_current_user)
):
    """
    SIMULATOR: Test AI workflow without real WhatsApp
    
    Use this to test all 7 AI agents:
    - Send: "Hi" → Greeting Agent
    - Send: "My budget is 50 lakhs" → Qualification Agent  
    - Send: "Show available plots" → Inventory Agent
    - Send: "I want to visit" → Site Visit Agent
    - Send: "I want to book" → Booking Agent
    - Send: "Payment options?" → Payment Agent
    - Send: "What amenities?" → Knowledge Agent
    """
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    if not tenant_id:
        raise HTTPException(status_code=403, detail="Tenant not identified")
    
    # Normalize phone
    phone = normalize_phone(phone)
    
    # Find or create lead
    lead = await find_or_create_lead(db, tenant_id, phone)
    lead_id = lead["id"]
    
    # Process message through AI orchestrator
    orchestrator = AIOrchestrator(db)
    
    result = await orchestrator.process_message(
        tenant_id=tenant_id,
        lead_id=lead_id,
        phone=phone,
        message=message,
        message_id=f"sim_{uuid.uuid4().hex[:8]}"
    )
    
    return {
        "success": result.get("success", False),
        "input_message": message,
        "ai_response": result.get("response"),
        "intent_detected": result.get("intent"),
        "conversation_state": result.get("next_state"),
        "conversation_id": result.get("conversation_id"),
        "action_taken": result.get("action"),
        "metadata": result.get("metadata", {}),
        "human_followup_required": result.get("human_followup_required", False)
    }


@router.get("/simulate/test-all-agents")
async def test_all_agents(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Test all 7 AI agents with sample messages
    Returns example responses from each agent
    """
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    if not tenant_id:
        raise HTTPException(status_code=403, detail="Tenant not identified")
    
    test_cases = [
        {"agent": "GreetingAgent", "message": "Hi, good morning!", "expected_intent": "greeting"},
        {"agent": "QualificationAgent", "message": "My budget is 50 lakhs, looking for plot in Hyderabad", "expected_intent": "qualification"},
        {"agent": "InventoryAgent", "message": "Show me available plots", "expected_intent": "availability_check"},
        {"agent": "KnowledgeAgent", "message": "What amenities are available in your project?", "expected_intent": "general_question"},
        {"agent": "SiteVisitAgent", "message": "I want to schedule a site visit tomorrow", "expected_intent": "site_visit_request"},
        {"agent": "BookingAgent", "message": "I want to book plot A12", "expected_intent": "booking_interest"},
        {"agent": "PaymentAgent", "message": "What are the payment options and EMI plans?", "expected_intent": "payment_question"},
    ]
    
    results = []
    orchestrator = AIOrchestrator(db)
    
    for i, test in enumerate(test_cases):
        # Create unique phone for each test
        test_phone_unique = f"919999{str(i).zfill(6)}"
        
        # Find or create lead
        lead = await find_or_create_lead(db, tenant_id, test_phone_unique)
        
        try:
            result = await orchestrator.process_message(
                tenant_id=tenant_id,
                lead_id=lead["id"],
                phone=test_phone_unique,
                message=test["message"],
                message_id=f"test_{i}"
            )
            
            results.append({
                "test_number": i + 1,
                "agent": test["agent"],
                "input_message": test["message"],
                "expected_intent": test["expected_intent"],
                "actual_intent": result.get("intent"),
                "ai_response": result.get("response", "")[:500],  # Truncate
                "conversation_state": result.get("next_state"),
                "success": result.get("success", False)
            })
        except Exception as e:
            results.append({
                "test_number": i + 1,
                "agent": test["agent"],
                "input_message": test["message"],
                "error": str(e),
                "success": False
            })
    
    return {
        "total_tests": len(test_cases),
        "results": results,
        "note": "Each test creates a new conversation to show fresh agent responses"
    }


@router.delete("/simulate/cleanup")
async def cleanup_test_conversations(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Cleanup test conversations (phone numbers starting with 919999)
    """
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    # Delete test conversations
    conv_result = await db.whatsapp_conversations.delete_many({
        "tenant_id": tenant_id,
        "phone": {"$regex": "^919999"}
    })
    
    # Delete test messages
    msg_result = await db.whatsapp_messages.delete_many({
        "tenant_id": tenant_id,
        "external_message_id": {"$regex": "^(sim_|test_)"}
    })
    
    # Delete test leads
    lead_result = await db.leads.delete_many({
        "tenant_id": tenant_id,
        "buyer_phone": {"$regex": "^919999"},
        "source": "whatsapp"
    })
    
    return {
        "conversations_deleted": conv_result.deleted_count,
        "messages_deleted": msg_result.deleted_count,
        "leads_deleted": lead_result.deleted_count
    }


@router.post("/simulate/reset/{phone}")
async def reset_conversation_for_phone(
    phone: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Reset conversation for a specific phone number - re-enables AI
    Use this when conversation is stuck in human_handoff mode
    """
    db = get_db(request)
    tenant_id = current_user.get("tenant_id")
    
    phone = normalize_phone(phone)
    
    # Find and reset the conversation
    result = await db.whatsapp_conversations.update_one(
        {
            "tenant_id": tenant_id,
            "phone": phone
        },
        {
            "$set": {
                "ai_enabled": True,
                "state": "new_lead",
                "human_assigned": None,
                "handoff_reason": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        return {
            "success": True,
            "message": f"Conversation reset for {phone}. AI is now active."
        }
    else:
        # No existing conversation, that's fine
        return {
            "success": True,
            "message": f"No existing conversation found for {phone}. Fresh conversation will be created."
        }




@router.get("/agents-info")
async def get_agents_info():
    """
    Get information about all 7 AI agents
    """
    return {
        "agents": [
            {
                "name": "GreetingAgent",
                "purpose": "Welcome new users and detect language (Telugu/Hindi/English)",
                "triggers": ["hi", "hello", "good morning", "నమస్కారం", "नमस्ते"],
                "example_response": "Hello! Welcome to [Company]. I'm your property assistant. How may I help you today?"
            },
            {
                "name": "QualificationAgent", 
                "purpose": "Collect customer information: budget, property type, location, timeline",
                "triggers": ["budget", "lakhs", "crore", "looking for", "interested in"],
                "example_response": "That's great! What's your preferred location? And are you looking for a plot, flat, or villa?"
            },
            {
                "name": "InventoryAgent",
                "purpose": "Show real-time plot availability from database",
                "triggers": ["available", "show plots", "options", "what do you have"],
                "example_response": "We have 5 plots available:\n• Plot #A12: 267 sqft, East facing, ₹45L\n• Plot #B05: 320 sqft, North, ₹52L"
            },
            {
                "name": "KnowledgeAgent",
                "purpose": "Answer questions about projects, amenities, location using RAG",
                "triggers": ["amenities", "features", "location", "RERA", "about project"],
                "example_response": "Our Green Valley project offers: Club house, Swimming pool, 24/7 Security, Children's park. RERA: AP12345678"
            },
            {
                "name": "SiteVisitAgent",
                "purpose": "Schedule site visits and create calendar entries",
                "triggers": ["visit", "see property", "come there", "schedule", "appointment"],
                "example_response": "I'd be happy to schedule a visit! Available slots:\n• Tomorrow 10 AM\n• Saturday 3 PM\nWhich works for you?"
            },
            {
                "name": "BookingAgent",
                "purpose": "Handle booking interest and add to booking queue",
                "triggers": ["book", "reserve", "take", "finalize", "want this plot"],
                "example_response": "Excellent choice! To reserve Plot #A12, a token amount of ₹50,000 is required. Our sales team will contact you for the paperwork."
            },
            {
                "name": "PaymentAgent",
                "purpose": "Answer payment queries and generate payment links",
                "triggers": ["payment", "EMI", "installment", "pay", "token amount"],
                "example_response": "Payment options:\n• Full payment: 5% discount\n• 50-50: 50% now, 50% on registration\n• EMI: 12-24 months available"
            }
        ],
        "conversation_states": [
            "new_lead", "greeting", "qualification", "project_discussion",
            "site_visit_offer", "site_visit_scheduled", "post_visit_followup",
            "booking_discussion", "payment_pending", "booked", "human_handoff"
        ],
        "supported_languages": ["English", "Telugu", "Hindi"]
    }




# ============ DIRECT SEND ENDPOINTS (For Testing) ============

class DirectSendRequest(BaseModel):
    """Request for direct message sending"""
    phone: str
    message: str
    message_type: str = "text"  # text, template


@router.post("/send-direct")
async def send_direct_message(
    send_request: DirectSendRequest,
    request: Request
):
    """
    Send WhatsApp message directly (for testing)
    No authentication required - use with caution
    
    Example:
    POST /api/whatsapp/send-direct
    {
        "phone": "919948303060",
        "message": "Hello from RealApex!"
    }
    """
    try:
        if send_request.message_type == "template":
            # Send hello_world template
            result = await meta_whatsapp_client.send_template_message(
                phone=send_request.phone,
                template_name="hello_world",
                language="en_US"
            )
        else:
            # Send text message
            result = await meta_whatsapp_client.send_text_message(
                phone=send_request.phone,
                message=send_request.message
            )
        
        return {
            "success": result.get("success", False),
            "message_id": result.get("message_id"),
            "phone": send_request.phone,
            "message": send_request.message,
            "response": result.get("response"),
            "error": result.get("error")
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/phone-info")
async def get_phone_info():
    """
    Get registered WhatsApp phone number info
    """
    result = await meta_whatsapp_client.get_phone_number_info()
    return result


@router.get("/templates")
async def get_available_templates():
    """
    Get all available message templates
    """
    result = await meta_whatsapp_client.get_templates()
    return result


@router.post("/send-template")
async def send_template_message(
    phone: str,
    template_name: str = "hello_world",
    language: str = "en_US"
):
    """
    Send a template message
    
    Available templates:
    - hello_world (en_US)
    - sample_issue_resolution (en_US) - requires name parameter
    - sample_shipping_confirmation (en_US) - requires days parameter
    """
    result = await meta_whatsapp_client.send_template_message(
        phone=phone,
        template_name=template_name,
        language=language
    )
    return {
        "success": result.get("success", False),
        "message_id": result.get("message_id"),
        "phone": phone,
        "template": template_name,
        "response": result.get("response"),
        "error": result.get("error")
    }



class TemplateSendRequest(BaseModel):
    """Request for sending template message"""
    phone: str
    template_name: str
    language: str = "en_US"
    params: Optional[List[str]] = None


@router.post("/send-template-live")
async def send_template_live(
    request_data: TemplateSendRequest,
    request: Request
):
    """
    Send WhatsApp template message in LIVE mode
    
    This sends REAL messages to actual WhatsApp numbers.
    
    Available templates:
    - hello_world (en_US) - No params
    - sample_issue_resolution (en_US) - params: [name]
    - sample_shipping_confirmation (en_US) - params: [days]
    - sample_purchase_feedback (en_US) - params: [product]
    - sample_happy_hour_announcement (en_US) - params: [venue, time]
    
    Example:
    POST /api/whatsapp/send-template-live
    {
        "phone": "919949376620",
        "template_name": "hello_world",
        "language": "en_US"
    }
    """
    # Normalize phone
    phone = ''.join(filter(str.isdigit, request_data.phone))
    if len(phone) == 10:
        phone = f"91{phone}"
    
    try:
        result = await meta_whatsapp_client.send_template_message(
            phone=phone,
            template_name=request_data.template_name,
            template_params=request_data.params,
            language=request_data.language
        )
        
        return {
            "success": result.get("success", False),
            "message_id": result.get("message_id"),
            "phone": phone,
            "template": request_data.template_name,
            "mode": "LIVE",
            "response": result.get("response"),
            "error": result.get("error") if not result.get("success") else None
        }
    except Exception as e:
        return {
            "success": False,
            "phone": phone,
            "template": request_data.template_name,
            "error": str(e)
        }


@router.get("/status")
async def get_whatsapp_status():
    """
    Get WhatsApp integration status
    """
    import os
    mode = os.getenv("META_WHATSAPP_MODE", "TEST")
    
    phone_info = await meta_whatsapp_client.get_phone_number_info()
    
    return {
        "mode": mode,
        "phone_number_id": os.getenv("META_WHATSAPP_PHONE_NUMBER_ID"),
        "waba_id": os.getenv("META_WHATSAPP_WABA_ID"),
        "phone_info": phone_info.get("phone_info", {}),
        "is_connected": phone_info.get("success", False)
    }



@router.get("/session/{tenant_id}/{phone}")
async def get_session_status(
    tenant_id: str,
    phone: str,
    request: Request
):
    """
    Get WhatsApp session status for a phone number
    
    Returns:
    - status: active | expired | warning | no_session
    - can_send_free_message: bool
    - must_use_template: bool
    - hours_remaining: float
    - session_expires_at: datetime
    """
    db = get_db(request)
    session_manager.set_db(db)
    
    status = await session_manager.check_session(phone, tenant_id)
    return status


@router.post("/session/reopen")
async def reopen_session(
    phone: str,
    tenant_id: str,
    request: Request
):
    """
    Send template message to reopen expired session
    
    Use this when session has expired and you need to re-engage customer
    """
    db = get_db(request)
    session_manager.set_db(db)
    meta_whatsapp_client.set_session_manager(session_manager, db)
    
    # Check current session status
    status = await session_manager.check_session(phone, tenant_id)
    
    if status.get("can_send_free_message"):
        return {
            "success": True,
            "message": "Session is already active",
            "session_status": status
        }
    
    # Send template to reopen session
    result = await meta_whatsapp_client.send_template_message(
        phone=phone,
        template_name="hello_world",
        language="en_US"
    )
    
    if result.get("success"):
        await session_manager.mark_re_engaged(phone, tenant_id)
        return {
            "success": True,
            "message": "Template sent to reopen session",
            "message_id": result.get("message_id"),
            "note": "Session will reopen when customer replies"
        }
    
    return {
        "success": False,
        "error": result.get("error"),
        "message": "Failed to send reopen template"
    }


@router.get("/sessions/expired")
async def get_expired_sessions(
    request: Request,
    tenant_id: Optional[str] = None,
    limit: int = 50
):
    """
    Get list of expired sessions that need re-engagement
    """
    db = get_db(request)
    session_manager.set_db(db)
    
    sessions = await session_manager.get_expired_sessions(tenant_id, limit)
    
    return {
        "count": len(sessions),
        "sessions": sessions
    }
