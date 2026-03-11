"""
AI Orchestrator for WhatsApp Agentic Workflow
Coordinates intent detection, agent selection, and workflow execution
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid
from dotenv import load_dotenv

from emergentintegrations.llm.chat import LlmChat, UserMessage

from .state_machine import ConversationStateMachine, ConversationState, CustomerIntent
from .knowledge_retriever import KnowledgeRetriever
from .agents import (
    GreetingAgent,
    QualificationAgent,
    InventoryAgent,
    SiteVisitAgent,
    BookingAgent,
    PaymentAgent,
    KnowledgeAgent
)

load_dotenv()


class AIOrchestrator:
    """
    Main orchestrator for WhatsApp AI workflow
    Handles intent detection, agent routing, and response coordination
    """
    
    INTENT_DETECTION_PROMPT = """You are an intent classifier for a real estate company's WhatsApp bot.
Analyze the customer message and determine their intent.

Possible intents:
- greeting: Hello, hi, good morning, etc.
- price_inquiry: Questions about price, rate, cost
- availability_check: Questions about available plots, units
- layout_request: Request for layout, map, brochure
- site_visit_request: Want to visit, see property, schedule visit
- booking_interest: Want to book, reserve, buy
- payment_question: Questions about payment, EMI, token
- general_question: Other questions about property, location, amenities
- complaint: Issues, problems, dissatisfaction
- human_request: Want to talk to agent, human, real person

Customer message: {message}

Recent conversation context:
{conversation_history}

Current conversation state: {current_state}

Respond with ONLY the intent name (one word from the list above).
If unclear, respond with "general_question".
"""
    
    # Human handoff triggers
    HUMAN_HANDOFF_KEYWORDS = [
        'human', 'agent', 'person', 'real person', 'talk to someone',
        'call me', 'callback', 'manager', 'supervisor',
        'మనిషి', 'एजेंट', 'कॉल'
    ]
    
    def __init__(self, db):
        self.db = db
        self.llm_key = os.getenv("EMERGENT_LLM_KEY")
        self.state_machine = ConversationStateMachine(db)
        self.knowledge_retriever = KnowledgeRetriever(db)
        
        # Initialize agents
        self.agents = {
            "greeting": GreetingAgent(db, self.llm_key),
            "qualification": QualificationAgent(db, self.llm_key),
            "inventory": InventoryAgent(db, self.llm_key),
            "site_visit": SiteVisitAgent(db, self.llm_key),
            "booking": BookingAgent(db, self.llm_key),
            "payment": PaymentAgent(db, self.llm_key),
            "knowledge": KnowledgeAgent(db, self.llm_key)
        }
        
        # Intent to agent mapping
        self.intent_agent_map = {
            CustomerIntent.GREETING: "greeting",
            CustomerIntent.PRICE_INQUIRY: "knowledge",
            CustomerIntent.AVAILABILITY_CHECK: "inventory",
            CustomerIntent.LAYOUT_REQUEST: "knowledge",
            CustomerIntent.SITE_VISIT_REQUEST: "site_visit",
            CustomerIntent.BOOKING_INTEREST: "booking",
            CustomerIntent.PAYMENT_QUESTION: "payment",
            CustomerIntent.GENERAL_QUESTION: "knowledge"
        }
    
    async def process_message(
        self,
        tenant_id: str,
        lead_id: str,
        phone: str,
        message: str,
        message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main entry point for processing incoming WhatsApp messages
        
        Args:
            tenant_id: Tenant identifier
            lead_id: Lead identifier
            phone: Customer phone number
            message: Message text
            message_id: External message ID
            
        Returns:
            Dict with response and metadata
        """
        try:
            # Get or create conversation
            conversation = await self.state_machine.get_or_create_conversation(
                tenant_id, lead_id, phone
            )
            
            conversation_id = conversation["id"]
            current_state = ConversationState(conversation["state"])
            
            # Store incoming message
            await self._store_message(
                conversation_id=conversation_id,
                tenant_id=tenant_id,
                lead_id=lead_id,
                role="user",
                content=message,
                message_id=message_id
            )
            
            # Check if AI is disabled for this conversation
            if not conversation.get("ai_enabled", True):
                return {
                    "success": True,
                    "response": None,
                    "action": "human_handoff_active",
                    "message": "Conversation is with human agent"
                }
            
            # Check for explicit human handoff request
            if self._should_handoff_to_human(message):
                await self.state_machine.enable_human_handoff(
                    conversation_id,
                    reason="customer_request"
                )
                return {
                    "success": True,
                    "response": self._get_handoff_message(conversation.get("context", {}).get("language", "english")),
                    "action": "human_handoff",
                    "conversation_id": conversation_id
                }
            
            # Detect intent
            intent = await self._detect_intent(
                message, 
                conversation,
                current_state
            )
            
            # Get context for AI
            context = await self._build_context(
                tenant_id, 
                lead_id, 
                conversation
            )
            
            # Select and run appropriate agent
            agent_result = await self._run_agent(
                intent=intent,
                current_state=current_state,
                tenant_id=tenant_id,
                lead_id=lead_id,
                message=message,
                context=context
            )
            
            # Get response
            response_text = agent_result.get("response", "")
            
            # Store AI response
            await self._store_message(
                conversation_id=conversation_id,
                tenant_id=tenant_id,
                lead_id=lead_id,
                role="assistant",
                content=response_text,
                metadata={
                    "intent": intent.value,
                    "agent": agent_result.get("agent_used"),
                    "action": agent_result.get("action")
                }
            )
            
            # Update conversation state
            next_state = agent_result.get("next_state")
            if next_state:
                new_state = ConversationState(next_state) if isinstance(next_state, str) else next_state
                await self.state_machine.transition_state(
                    conversation_id,
                    new_state,
                    context_update=agent_result.get("context_update")
                )
            
            # Update conversation metadata
            await self._update_conversation_metadata(
                conversation_id,
                intent,
                agent_result
            )
            
            # Check if we should trigger human handoff
            if self._should_auto_handoff(intent, agent_result, conversation):
                await self.state_machine.enable_human_handoff(
                    conversation_id,
                    reason="auto_high_intent"
                )
                # Still send the AI response, but mark for follow-up
                agent_result["human_followup_required"] = True
            
            return {
                "success": True,
                "response": response_text,
                "conversation_id": conversation_id,
                "intent": intent.value,
                "action": agent_result.get("action"),
                "next_state": next_state,
                "human_followup_required": agent_result.get("human_followup_required", False),
                "metadata": {
                    "site_visit_id": agent_result.get("site_visit_id"),
                    "booking_id": agent_result.get("booking_id")
                }
            }
            
        except Exception as e:
            print(f"Orchestrator error: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "error": str(e),
                "response": "I apologize, but I'm having trouble processing your request. Our team will get back to you shortly."
            }
    
    async def _detect_intent(
        self,
        message: str,
        conversation: Dict[str, Any],
        current_state: ConversationState
    ) -> CustomerIntent:
        """Detect customer intent using LLM"""
        
        # Get recent conversation history
        history = await self._get_conversation_history(conversation["id"], limit=5)
        history_text = "\n".join([
            f"{'Customer' if msg['role'] == 'user' else 'Agent'}: {msg['content'][:100]}"
            for msg in history
        ]) if history else "No previous conversation"
        
        prompt = self.INTENT_DETECTION_PROMPT.format(
            message=message,
            conversation_history=history_text,
            current_state=current_state.value
        )
        
        try:
            chat = LlmChat(
                api_key=self.llm_key,
                session_id=f"intent_{conversation['id']}",
                system_message="You are an intent classifier. Respond with only the intent name."
            ).with_model("anthropic", "claude-sonnet-4-20250514")
            
            response = await chat.send_message(UserMessage(text=prompt))
            intent_str = response.strip().lower().replace(" ", "_")
            
            # Map to CustomerIntent enum
            intent_map = {
                "greeting": CustomerIntent.GREETING,
                "price_inquiry": CustomerIntent.PRICE_INQUIRY,
                "availability_check": CustomerIntent.AVAILABILITY_CHECK,
                "layout_request": CustomerIntent.LAYOUT_REQUEST,
                "site_visit_request": CustomerIntent.SITE_VISIT_REQUEST,
                "booking_interest": CustomerIntent.BOOKING_INTEREST,
                "payment_question": CustomerIntent.PAYMENT_QUESTION,
                "general_question": CustomerIntent.GENERAL_QUESTION,
                "complaint": CustomerIntent.COMPLAINT,
                "human_request": CustomerIntent.HUMAN_REQUEST
            }
            
            return intent_map.get(intent_str, CustomerIntent.GENERAL_QUESTION)
            
        except Exception as e:
            print(f"Intent detection error: {e}")
            return CustomerIntent.GENERAL_QUESTION
    
    async def _build_context(
        self,
        tenant_id: str,
        lead_id: str,
        conversation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build context for AI agents"""
        
        context = {
            "language": conversation.get("context", {}).get("language", "english"),
            "current_state": conversation.get("state"),
            "conversation_context": conversation.get("context", {})
        }
        
        # Get project knowledge
        interested_projects = conversation.get("context", {}).get("interested_projects", [])
        project_id = interested_projects[0] if interested_projects else None
        
        knowledge = await self.knowledge_retriever.get_project_knowledge(
            tenant_id, project_id
        )
        context["knowledge"] = knowledge
        context["formatted_knowledge"] = self.knowledge_retriever.format_knowledge_for_llm(knowledge)
        
        # Get lead context
        lead_context = await self.knowledge_retriever.get_lead_context(tenant_id, lead_id)
        context["lead_context"] = lead_context
        context["formatted_lead_context"] = self.knowledge_retriever.format_lead_context_for_llm(lead_context)
        
        # Combine for full context
        context["project_knowledge"] = f"{context['formatted_knowledge']}\n\n{context['formatted_lead_context']}"
        
        return context
    
    async def _run_agent(
        self,
        intent: CustomerIntent,
        current_state: ConversationState,
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Select and run appropriate agent"""
        
        # Determine which agent to use based on intent and state
        agent_name = self._select_agent(intent, current_state)
        agent = self.agents.get(agent_name)
        
        if not agent:
            agent = self.agents["knowledge"]
            agent_name = "knowledge"
        
        # Run the agent
        result = await agent.process(
            tenant_id=tenant_id,
            lead_id=lead_id,
            message=message,
            context=context
        )
        
        result["agent_used"] = agent_name
        return result
    
    def _select_agent(
        self,
        intent: CustomerIntent,
        current_state: ConversationState
    ) -> str:
        """Select appropriate agent based on intent and state"""
        
        # State-based selection takes priority
        if current_state == ConversationState.NEW_LEAD:
            return "greeting"
        elif current_state == ConversationState.GREETING:
            return "greeting"
        elif current_state == ConversationState.QUALIFICATION:
            if intent == CustomerIntent.SITE_VISIT_REQUEST:
                return "site_visit"
            return "qualification"
        elif current_state == ConversationState.SITE_VISIT_OFFER:
            return "site_visit"
        elif current_state == ConversationState.BOOKING_DISCUSSION:
            return "booking"
        elif current_state == ConversationState.PAYMENT_PENDING:
            return "payment"
        
        # Intent-based selection
        return self.intent_agent_map.get(intent, "knowledge")
    
    def _should_handoff_to_human(self, message: str) -> bool:
        """Check if message requests human agent"""
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in self.HUMAN_HANDOFF_KEYWORDS)
    
    def _should_auto_handoff(
        self,
        intent: CustomerIntent,
        agent_result: Dict,
        conversation: Dict
    ) -> bool:
        """Check if we should auto-trigger human handoff"""
        
        # Handoff for complaints
        if intent == CustomerIntent.COMPLAINT:
            return True
        
        # Handoff for booking (high intent)
        if intent == CustomerIntent.BOOKING_INTEREST and agent_result.get("booking_id"):
            return True
        
        # Handoff after multiple qualification attempts
        message_count = conversation.get("message_count", 0)
        if message_count > 10 and conversation.get("state") == "qualification":
            return True
        
        return False
    
    def _get_handoff_message(self, language: str) -> str:
        """Get human handoff message in appropriate language"""
        messages = {
            "english": "I'm connecting you with one of our sales representatives. They will contact you shortly. Thank you for your patience!",
            "telugu": "మిమ్మల్ని మా సేల్స్ ప్రతినిధితో కనెక్ట్ చేస్తున్నాను. వారు త్వరలో మిమ్మల్ని సంప్రదిస్తారు. మీ ఓపికకు ధన్యవాదాలు!",
            "hindi": "मैं आपको हमारे सेल्स प्रतिनिधि से जोड़ रहा हूं। वे जल्द ही आपसे संपर्क करेंगे। धन्यवाद!"
        }
        return messages.get(language, messages["english"])
    
    async def _store_message(
        self,
        conversation_id: str,
        tenant_id: str,
        lead_id: str,
        role: str,
        content: str,
        message_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        """Store message in database"""
        
        message_doc = {
            "id": str(uuid.uuid4()),
            "conversation_id": conversation_id,
            "tenant_id": tenant_id,
            "lead_id": lead_id,
            "role": role,
            "content": content,
            "external_message_id": message_id,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        
        await self.db.whatsapp_messages.insert_one(message_doc)
        
        # Update conversation message count
        await self.db.whatsapp_conversations.update_one(
            {"id": conversation_id},
            {
                "$inc": {"message_count": 1},
                "$set": {
                    "last_message_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def _get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """Get recent conversation history"""
        
        messages = await self.db.whatsapp_messages.find(
            {"conversation_id": conversation_id},
            {"_id": 0, "role": 1, "content": 1, "timestamp": 1}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return list(reversed(messages))
    
    async def _update_conversation_metadata(
        self,
        conversation_id: str,
        intent: CustomerIntent,
        agent_result: Dict
    ):
        """Update conversation with processing metadata"""
        
        update = {
            "$set": {"updated_at": datetime.utcnow()},
            "$push": {
                "intent_history": {
                    "intent": intent.value,
                    "timestamp": datetime.utcnow(),
                    "agent": agent_result.get("agent_used")
                }
            }
        }
        
        # Update context based on agent results
        if agent_result.get("detected_language"):
            update["$set"]["context.language"] = agent_result["detected_language"]
        
        if agent_result.get("site_visit_id"):
            update["$set"]["context.site_visit_id"] = agent_result["site_visit_id"]
        
        if agent_result.get("booking_id"):
            update["$set"]["context.booking_id"] = agent_result["booking_id"]
        
        await self.db.whatsapp_conversations.update_one(
            {"id": conversation_id},
            update
        )
    
    async def get_conversation_for_dashboard(
        self,
        tenant_id: str,
        conversation_id: Optional[str] = None,
        lead_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get conversation details for agent dashboard"""
        
        query = {"tenant_id": tenant_id}
        if conversation_id:
            query["id"] = conversation_id
        elif lead_id:
            query["lead_id"] = lead_id
        else:
            return None
        
        conversation = await self.db.whatsapp_conversations.find_one(
            query, {"_id": 0}
        )
        
        if conversation:
            # Get messages
            messages = await self.db.whatsapp_messages.find(
                {"conversation_id": conversation["id"]},
                {"_id": 0}
            ).sort("timestamp", 1).to_list(100)
            
            conversation["messages"] = messages
            
            # Get lead info
            lead = await self.db.leads.find_one(
                {"tenant_id": tenant_id, "id": conversation["lead_id"]},
                {"_id": 0}
            )
            conversation["lead"] = lead
        
        return conversation
