"""
AI Agents for WhatsApp Agentic Workflow
Each agent handles a specific aspect of the sales conversation
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from abc import ABC, abstractmethod
import uuid
from dotenv import load_dotenv

from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()


class BaseAgent(ABC):
    """Base class for all AI agents"""
    
    def __init__(self, db, llm_key: Optional[str] = None):
        self.db = db
        self.llm_key = llm_key or os.getenv("EMERGENT_LLM_KEY")
        self.model_provider = "anthropic"
        self.model_name = "claude-sonnet-4-20250514"
    
    @abstractmethod
    async def process(
        self, 
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process the request and return response"""
        pass
    
    async def generate_llm_response(
        self,
        system_prompt: str,
        user_message: str,
        session_id: str
    ) -> str:
        """Generate response using LLM"""
        try:
            chat = LlmChat(
                api_key=self.llm_key,
                session_id=session_id,
                system_message=system_prompt
            ).with_model(self.model_provider, self.model_name)
            
            response = await chat.send_message(UserMessage(text=user_message))
            return response
        except Exception as e:
            print(f"LLM Error: {e}")
            return "I apologize, I'm having trouble processing your request. Please try again."


class GreetingAgent(BaseAgent):
    """
    Handles initial greetings and language detection
    """
    
    SYSTEM_PROMPT = """You are a friendly real estate sales assistant for {company_name}.
Your task is to:
1. Warmly greet the customer
2. Detect their preferred language (Telugu, Hindi, or English)
3. Introduce yourself briefly
4. Ask how you can help them today

Keep responses concise (2-3 sentences max).
Be warm and professional.
If customer writes in Telugu or Hindi, respond in the same language.

Example responses:
English: "Hello! Welcome to {company_name}. I'm your property assistant. How may I help you today?"
Telugu: "నమస్కారం! {company_name} కి స్వాగతం. నేను మీ ప్రాపర్టీ అసిస్టెంట్. మీకు ఎలా సహాయం చేయగలను?"
Hindi: "नमस्ते! {company_name} में आपका स्वागत है। मैं आपका प्रॉपर्टी असिस्टेंट हूं। मैं आपकी कैसे मदद कर सकता हूं?"
"""
    
    async def process(
        self, 
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        # Get tenant/company name
        tenant = await self.db.tenants.find_one(
            {"id": tenant_id},
            {"_id": 0, "company_name": 1, "name": 1}
        )
        company_name = tenant.get("company_name") or tenant.get("name", "our company") if tenant else "our company"
        
        # Detect language from message
        detected_language = self._detect_language(message)
        
        system_prompt = self.SYSTEM_PROMPT.format(company_name=company_name)
        
        response = await self.generate_llm_response(
            system_prompt=system_prompt,
            user_message=f"Customer message: {message}\nDetected language: {detected_language}",
            session_id=f"greeting_{lead_id}"
        )
        
        return {
            "response": response,
            "detected_language": detected_language,
            "action": "greeting_sent",
            "next_state": "qualification"
        }
    
    def _detect_language(self, text: str) -> str:
        """Simple language detection based on character sets"""
        # Telugu Unicode range
        telugu_chars = sum(1 for c in text if '\u0C00' <= c <= '\u0C7F')
        # Hindi/Devanagari Unicode range
        hindi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
        
        total_chars = len(text.strip())
        if total_chars == 0:
            return "english"
        
        if telugu_chars / total_chars > 0.3:
            return "telugu"
        elif hindi_chars / total_chars > 0.3:
            return "hindi"
        
        return "english"


class QualificationAgent(BaseAgent):
    """
    Collects customer qualification information with STRICT business rules
    """
    
    SYSTEM_PROMPT = """You are a business-specific sales assistant for real estate at {company_name}.

STRICT RULES - FOLLOW EXACTLY:

1. CONTEXT MEMORY (MANDATORY)
- Always remember and use:
  - User budget: {budget}
  - Preferred location: {location}
  - Property type: {property_type}
  - Stage: {stage}
- Once user mentions location, DO NOT suggest any other location unless user explicitly asks.

2. PROJECT FILTERING (CRITICAL)
- Only suggest projects that match:
  - User preferred location
  - User budget range
- If no matching project available:
  - Do NOT suggest random project
  - Instead say: "Currently exact match available ledu, but similar options chupistanu"

3. RESPONSE CONSISTENCY
- All replies must align with previous conversation
- Never change city, project, or context randomly

4. SALES FLOW CONTROL
- If user is in early stage → give info + ask questions
- If user shows interest → guide + build trust
- If user asks for site visit → trigger booking flow
- If user asks about price negotiation → trigger human handover

5. HANDOVER RULE
- For: negotiation, legal/documents, final decision
- Respond: "maa team nundi okaru connect avtharu"

6. NO RANDOM GENERATION
- Do NOT generate: random city names, unrelated projects, generic answers

7. HUMAN-LIKE TONE
- Use natural Telugu-English mix
- Keep it simple, polite, and slightly persuasive

8. PRIORITY ORDER
- Accuracy > Smartness
- Relevance > Creativity
- Trust > Length

OUTPUT STYLE:
- Short, clear, conversational
- 2–5 lines max
- Always guide towards next step (visit / call / decision)

Current customer information:
{customer_info}

Available projects in {location} (ONLY suggest from this list):
{project_knowledge}

Respond in: {language}
"""
    
    QUALIFICATION_FIELDS = ["budget", "property_type", "preferred_location", "timeline", "purpose"]
    
    async def process(
        self, 
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        # Get current lead data
        lead = await self.db.leads.find_one(
            {"tenant_id": tenant_id, "id": lead_id},
            {"_id": 0}
        )
        
        # Extract any new information from message
        extracted = await self._extract_info(message, context.get("language", "english"))
        
        # Update lead if new info extracted
        if extracted:
            await self._update_lead(tenant_id, lead_id, extracted)
        
        # Merge lead data with extracted
        lead_data = lead or {}
        if extracted:
            lead_data = {**lead_data, **extracted}
        
        # Determine what's still missing
        missing_fields = self._get_missing_fields(lead_data, extracted)
        
        customer_info = self._format_customer_info(lead_data, extracted)
        
        # Get location-filtered projects
        preferred_location = lead_data.get("preferred_location", "")
        budget = lead_data.get("budget_max") or lead_data.get("budget", 0)
        
        project_knowledge = context.get("project_knowledge", "No projects loaded")
        
        # Get tenant/company name
        tenant = await self.db.tenants.find_one(
            {"id": tenant_id},
            {"_id": 0, "company_name": 1, "name": 1}
        )
        company_name = tenant.get("company_name") or tenant.get("name", "our company") if tenant else "our company"
        
        # Determine stage
        stage = "exploring"
        conv_context = context.get("conversation_context", {})
        if conv_context.get("site_visit_requested"):
            stage = "site_visit"
        elif conv_context.get("interested_projects"):
            stage = "interested"
        elif budget or preferred_location:
            stage = "qualified"
        
        system_prompt = self.SYSTEM_PROMPT.format(
            company_name=company_name,
            customer_info=customer_info,
            project_knowledge=project_knowledge,
            language=context.get("language", "english"),
            budget=f"₹{budget:,.0f}" if budget else "Not specified",
            location=preferred_location or "Not specified",
            property_type=lead_data.get("property_type", "Not specified"),
            stage=stage
        )
        
        user_prompt = f"""Customer message: {message}

Missing information we still need: {', '.join(missing_fields) if missing_fields else 'All information collected!'}

Generate a natural response that either:
1. Acknowledges the information provided and asks about the next missing field
2. Or if all info is collected, summarize and offer to show available properties
3. If asking about price negotiation or documents, say "maa team nundi okaru connect avtharu"

REMEMBER: Only suggest projects in {preferred_location or 'their preferred area'}. Do NOT mention random cities."""
        
        response = await self.generate_llm_response(
            system_prompt=system_prompt,
            user_message=user_prompt,
            session_id=f"qualification_{lead_id}"
        )
        
        # Check for handoff triggers
        message_lower = message.lower()
        handoff_keywords = ['negotiation', 'discount', 'reduce', 'documents', 'legal', 'final', 'deal']
        should_handoff = any(kw in message_lower for kw in handoff_keywords)
        
        # Determine next state
        next_state = "qualification"
        context_update = {}
        
        if should_handoff:
            next_state = "human_handoff"
            context_update["handoff_reason"] = "negotiation_or_legal"
        elif not missing_fields or len(missing_fields) <= 1:
            next_state = "project_discussion"
        
        if extracted.get("preferred_location"):
            context_update["preferred_location"] = extracted["preferred_location"]
        if extracted.get("budget"):
            context_update["budget"] = extracted["budget"]
        
        return {
            "response": response,
            "extracted_info": extracted,
            "missing_fields": missing_fields,
            "action": "qualification_continued",
            "next_state": next_state,
            "context_update": context_update if context_update else None
        }
    
    async def _extract_info(self, message: str, language: str) -> Dict[str, Any]:
        """Extract qualification information from message"""
        extracted = {}
        message_lower = message.lower()
        
        # Budget extraction (simple pattern matching)
        import re
        budget_patterns = [
            r'(\d+)\s*(lakh|lakhs|lac|lacs)',
            r'(\d+)\s*(crore|cr)',
            r'budget.*?(\d+)',
            r'(\d+).*?(budget|spend|invest)'
        ]
        
        for pattern in budget_patterns:
            match = re.search(pattern, message_lower)
            if match:
                amount = int(match.group(1))
                if 'crore' in message_lower or 'cr' in message_lower:
                    amount *= 10000000
                elif 'lakh' in message_lower or 'lac' in message_lower:
                    amount *= 100000
                extracted["budget"] = amount
                break
        
        # Property type extraction
        if any(word in message_lower for word in ['plot', 'land', 'site', 'ప్లాట్', 'भूखंड']):
            extracted["property_type"] = "plot"
        elif any(word in message_lower for word in ['flat', 'apartment', 'ఫ్లాట్', 'फ्लैट']):
            extracted["property_type"] = "flat"
        elif any(word in message_lower for word in ['villa', 'house', 'independent', 'విల్లా', 'विला']):
            extracted["property_type"] = "villa"
        
        # Timeline extraction
        if any(word in message_lower for word in ['immediate', 'asap', 'urgent', 'now', 'వెంటనే', 'तुरंत']):
            extracted["timeline"] = "immediate"
        elif any(word in message_lower for word in ['month', '1-3', 'soon', 'త్వరలో']):
            extracted["timeline"] = "1-3 months"
        elif any(word in message_lower for word in ['year', '6 month', 'ఆరు నెలలు']):
            extracted["timeline"] = "6-12 months"
        
        # Purpose extraction
        if any(word in message_lower for word in ['invest', 'investment', 'return', 'పెట్టుబడి', 'निवेश']):
            extracted["purpose"] = "investment"
        elif any(word in message_lower for word in ['stay', 'live', 'home', 'family', 'నివాసం', 'रहने']):
            extracted["purpose"] = "self_use"
        
        return extracted
    
    async def _update_lead(self, tenant_id: str, lead_id: str, extracted: Dict):
        """Update lead with extracted information"""
        update = {"$set": {"updated_at": datetime.utcnow()}}
        
        field_mapping = {
            "budget": "budget",
            "property_type": "property_type",
            "preferred_location": "preferred_location",
            "timeline": "purchase_timeline",
            "purpose": "purpose"
        }
        
        for key, value in extracted.items():
            if key in field_mapping:
                update["$set"][field_mapping[key]] = value
        
        if len(update["$set"]) > 1:  # More than just updated_at
            await self.db.leads.update_one(
                {"tenant_id": tenant_id, "id": lead_id},
                update
            )
    
    def _get_missing_fields(self, lead: Optional[Dict], extracted: Dict) -> List[str]:
        """Get list of fields still needed"""
        missing = []
        combined = {**(lead or {}), **extracted}
        
        if not combined.get("budget"):
            missing.append("budget")
        if not combined.get("property_type"):
            missing.append("property_type")
        if not combined.get("preferred_location"):
            missing.append("preferred_location")
        if not combined.get("purchase_timeline") and not combined.get("timeline"):
            missing.append("timeline")
        
        return missing
    
    def _format_customer_info(self, lead: Optional[Dict], extracted: Dict) -> str:
        """Format customer info for prompt"""
        combined = {**(lead or {}), **extracted}
        
        parts = []
        if combined.get("buyer_name"):
            parts.append(f"Name: {combined['buyer_name']}")
        if combined.get("budget"):
            parts.append(f"Budget: ₹{combined['budget']:,.0f}")
        if combined.get("property_type"):
            parts.append(f"Property Type: {combined['property_type']}")
        if combined.get("preferred_location"):
            parts.append(f"Location: {combined['preferred_location']}")
        if combined.get("purchase_timeline") or combined.get("timeline"):
            parts.append(f"Timeline: {combined.get('purchase_timeline') or combined.get('timeline')}")
        
        return "\n".join(parts) if parts else "No information collected yet"


class InventoryAgent(BaseAgent):
    """
    Handles plot/property availability queries
    """
    
    SYSTEM_PROMPT = """You are a real estate inventory specialist.
Your task is to help customers find suitable properties.

Available Properties:
{available_plots}

Customer Requirements:
{customer_requirements}

Guidelines:
- Present 2-3 best matching options
- Highlight key features (area, facing, price)
- Mention if plots are limited
- Create urgency professionally
- Respond in {language}
- Keep responses concise but informative
- Offer to share layout/brochure
- Suggest site visit

Format property details clearly:
Plot/Site #X
- Area: XXX sqft
- Facing: East/West/North/South
- Price: ₹X,XX,XXX
"""
    
    async def process(
        self, 
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        knowledge = context.get("knowledge", {})
        available_plots = knowledge.get("available_plots", [])
        
        # Format plots for prompt
        plots_text = self._format_plots(available_plots)
        
        # Get customer requirements
        lead = await self.db.leads.find_one(
            {"tenant_id": tenant_id, "id": lead_id},
            {"_id": 0}
        )
        requirements = self._format_requirements(lead)
        
        system_prompt = self.SYSTEM_PROMPT.format(
            available_plots=plots_text,
            customer_requirements=requirements,
            language=context.get("language", "english")
        )
        
        response = await self.generate_llm_response(
            system_prompt=system_prompt,
            user_message=f"Customer query: {message}",
            session_id=f"inventory_{lead_id}"
        )
        
        # Determine if we should offer site visit
        should_offer_visit = len(available_plots) > 0 and any(
            word in message.lower() 
            for word in ['interested', 'like', 'good', 'show', 'see', 'visit']
        )
        
        return {
            "response": response,
            "plots_shown": len(available_plots),
            "action": "inventory_shown",
            "next_state": "site_visit_offer" if should_offer_visit else "project_discussion"
        }
    
    def _format_plots(self, plots: List[Dict]) -> str:
        """Format plots for LLM prompt"""
        if not plots:
            return "No plots currently available"
        
        lines = []
        for i, plot in enumerate(plots[:10], 1):
            price = plot.get('price')
            price_str = f"₹{price:,.0f}" if price else "Contact for price"
            
            lines.append(f"""
Plot #{plot.get('plot_number', i)}
- Area: {plot.get('area', 'N/A')} {plot.get('area_unit', 'sqft')}
- Facing: {plot.get('facing', 'N/A')}
- Price: {price_str}
- Dimensions: {plot.get('dimensions', 'N/A')}
""")
        
        return "\n".join(lines)
    
    def _format_requirements(self, lead: Optional[Dict]) -> str:
        """Format customer requirements"""
        if not lead:
            return "No specific requirements provided"
        
        parts = []
        if lead.get("budget"):
            parts.append(f"Budget: ₹{lead['budget']:,.0f}")
        if lead.get("property_type"):
            parts.append(f"Type: {lead['property_type']}")
        if lead.get("preferred_location"):
            parts.append(f"Location: {lead['preferred_location']}")
        
        return ", ".join(parts) if parts else "No specific requirements"


class SiteVisitAgent(BaseAgent):
    """
    Handles site visit scheduling
    """
    
    SYSTEM_PROMPT = """You are a site visit coordinator for a real estate company.
Your task is to schedule site visits for interested customers.

Current date: {current_date}
Available slots: {available_slots}
Project to visit: {project_name}

Guidelines:
- Offer 2-3 time slots
- Confirm customer's preferred date and time
- Collect any special requests
- Confirm pickup point if applicable
- Respond in {language}
- Be enthusiastic about the visit
- Mention what they'll see during the visit

After confirmation, summarize:
- Date and time
- Location/Meeting point
- Contact person
"""
    
    async def process(
        self, 
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        knowledge = context.get("knowledge", {})
        projects = knowledge.get("projects", [])
        project_name = projects[0].get("name", "our project") if projects else "our project"
        
        # Generate available slots (next 7 days, 10am and 3pm)
        available_slots = self._generate_slots()
        
        system_prompt = self.SYSTEM_PROMPT.format(
            current_date=datetime.now().strftime("%Y-%m-%d"),
            available_slots=available_slots,
            project_name=project_name,
            language=context.get("language", "english")
        )
        
        # Check if message contains date/time confirmation
        visit_details = self._extract_visit_details(message)
        
        user_prompt = f"Customer message: {message}"
        if visit_details:
            user_prompt += f"\nExtracted visit preferences: {visit_details}"
        
        response = await self.generate_llm_response(
            system_prompt=system_prompt,
            user_message=user_prompt,
            session_id=f"sitevisit_{lead_id}"
        )
        
        # If visit details confirmed, create site visit
        site_visit_id = None
        if visit_details.get("confirmed"):
            site_visit_id = await self._create_site_visit(
                tenant_id, lead_id, visit_details, context
            )
        
        return {
            "response": response,
            "visit_details": visit_details,
            "site_visit_id": site_visit_id,
            "action": "site_visit_scheduled" if site_visit_id else "site_visit_offered",
            "next_state": "site_visit_scheduled" if site_visit_id else "site_visit_offer"
        }
    
    def _generate_slots(self) -> str:
        """Generate available time slots for next 7 days"""
        slots = []
        today = datetime.now()
        
        for i in range(1, 8):
            date = today + timedelta(days=i)
            if date.weekday() < 6:  # Monday to Saturday
                date_str = date.strftime("%A, %B %d")
                slots.append(f"- {date_str}: 10:00 AM or 3:00 PM")
        
        return "\n".join(slots[:5])
    
    def _extract_visit_details(self, message: str) -> Dict[str, Any]:
        """Extract visit scheduling details from message"""
        details = {}
        message_lower = message.lower()
        
        # Check for confirmation keywords
        if any(word in message_lower for word in ['confirm', 'ok', 'yes', 'done', 'book', 'schedule']):
            details["intent"] = "confirm"
        
        # Time extraction
        if '10' in message or 'morning' in message_lower:
            details["time"] = "10:00 AM"
        elif '3' in message or '15' in message or 'afternoon' in message_lower or 'evening' in message_lower:
            details["time"] = "3:00 PM"
        
        # Day extraction
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for day in days:
            if day in message_lower:
                details["day"] = day.capitalize()
                break
        
        # Tomorrow/day after
        if 'tomorrow' in message_lower:
            details["day"] = (datetime.now() + timedelta(days=1)).strftime("%A")
        
        # Mark as confirmed if we have enough info
        if details.get("intent") == "confirm" and (details.get("day") or details.get("time")):
            details["confirmed"] = True
        
        return details
    
    async def _create_site_visit(
        self, 
        tenant_id: str, 
        lead_id: str, 
        details: Dict,
        context: Dict
    ) -> Optional[str]:
        """Create site visit record"""
        try:
            knowledge = context.get("knowledge", {})
            projects = knowledge.get("projects", [])
            project_id = projects[0].get("id") if projects else None
            
            # Calculate scheduled date
            today = datetime.now()
            scheduled_date = today + timedelta(days=1)  # Default to tomorrow
            
            if details.get("day"):
                # Find the next occurrence of the specified day
                days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                target_day = days.index(details["day"].lower())
                current_day = today.weekday()
                days_ahead = target_day - current_day
                if days_ahead <= 0:
                    days_ahead += 7
                scheduled_date = today + timedelta(days=days_ahead)
            
            # Parse time
            scheduled_time = details.get("time", "10:00 AM")
            
            site_visit = {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "lead_id": lead_id,
                "project_id": project_id,
                "scheduled_date": scheduled_date.strftime("%Y-%m-%d"),
                "scheduled_time": scheduled_time,
                "status": "scheduled",
                "source": "whatsapp_ai",
                "assigned_to": None,  # Will be assigned by system
                "notes": "Scheduled via WhatsApp AI assistant",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await self.db.site_visits.insert_one(site_visit)
            
            # Update lead status
            await self.db.leads.update_one(
                {"tenant_id": tenant_id, "id": lead_id},
                {
                    "$set": {
                        "status": "site_visit_scheduled",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return site_visit["id"]
            
        except Exception as e:
            print(f"Error creating site visit: {e}")
            return None


class BookingAgent(BaseAgent):
    """
    Handles booking interest and queue management
    """
    
    SYSTEM_PROMPT = """You are a booking specialist for a real estate company.
Your task is to help customers with property booking.

Available Properties:
{available_plots}

Customer Profile:
{customer_profile}

Guidelines:
- Confirm the specific plot/property customer wants
- Explain booking process briefly
- Mention token/booking amount
- Create excitement about their choice
- Respond in {language}
- If they're ready, confirm and add to booking queue
- Mention that sales team will call to complete formalities
"""
    
    async def process(
        self, 
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        knowledge = context.get("knowledge", {})
        available_plots = knowledge.get("available_plots", [])
        
        # Get customer profile
        lead = await self.db.leads.find_one(
            {"tenant_id": tenant_id, "id": lead_id},
            {"_id": 0}
        )
        
        system_prompt = self.SYSTEM_PROMPT.format(
            available_plots=self._format_plots(available_plots),
            customer_profile=self._format_customer(lead),
            language=context.get("language", "english")
        )
        
        response = await self.generate_llm_response(
            system_prompt=system_prompt,
            user_message=f"Customer message: {message}",
            session_id=f"booking_{lead_id}"
        )
        
        # Check if booking intent is strong
        booking_intent = self._check_booking_intent(message)
        
        booking_id = None
        if booking_intent:
            booking_id = await self._create_booking_queue(
                tenant_id, lead_id, context
            )
        
        return {
            "response": response,
            "booking_intent": booking_intent,
            "booking_id": booking_id,
            "action": "booking_created" if booking_id else "booking_discussed",
            "next_state": "payment_pending" if booking_id else "booking_discussion"
        }
    
    def _format_plots(self, plots: List[Dict]) -> str:
        """Format available plots"""
        if not plots:
            return "Contact sales for availability"
        
        lines = []
        for plot in plots[:5]:
            price = plot.get('price')
            lines.append(f"Plot #{plot.get('plot_number', 'N/A')} - {plot.get('area', 'N/A')} sqft - ₹{price:,.0f}" if price else f"Plot #{plot.get('plot_number', 'N/A')}")
        return "\n".join(lines)
    
    def _format_customer(self, lead: Optional[Dict]) -> str:
        """Format customer profile"""
        if not lead:
            return "New customer"
        return f"Name: {lead.get('buyer_name', 'N/A')}, Budget: ₹{lead.get('budget', 'N/A'):,}" if lead.get('budget') else f"Name: {lead.get('buyer_name', 'N/A')}"
    
    def _check_booking_intent(self, message: str) -> bool:
        """Check if message indicates strong booking intent"""
        intent_keywords = [
            'book', 'reserve', 'want', 'take', 'finalize', 'confirm',
            'బుక్', 'కావాలి', 'बुक', 'चाहिए'
        ]
        return any(keyword in message.lower() for keyword in intent_keywords)
    
    async def _create_booking_queue(
        self, 
        tenant_id: str, 
        lead_id: str,
        context: Dict
    ) -> Optional[str]:
        """Add to booking queue"""
        try:
            knowledge = context.get("knowledge", {})
            plots = knowledge.get("available_plots", [])
            
            booking = {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "lead_id": lead_id,
                "property_id": plots[0].get("id") if plots else None,
                "status": "pending",
                "source": "whatsapp_ai",
                "priority": "high",
                "notes": "Added via WhatsApp AI - follow up required",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await self.db.booking_queue.insert_one(booking)
            
            # Update lead
            await self.db.leads.update_one(
                {"tenant_id": tenant_id, "id": lead_id},
                {
                    "$set": {
                        "status": "hot",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return booking["id"]
            
        except Exception as e:
            print(f"Error creating booking queue: {e}")
            return None


class PaymentAgent(BaseAgent):
    """
    Handles payment inquiries and link generation
    """
    
    SYSTEM_PROMPT = """You are a payment coordinator for a real estate company.
Your task is to help customers with payment questions.

Payment Information:
{payment_info}

Booking Details:
{booking_details}

Guidelines:
- Explain payment options clearly
- Mention EMI options if available
- Provide payment link when ready
- Be reassuring about security
- Respond in {language}
- Offer to connect with accounts team for complex queries
"""
    
    async def process(
        self, 
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        # Get any existing booking
        booking = await self.db.booking_queue.find_one(
            {"tenant_id": tenant_id, "lead_id": lead_id},
            {"_id": 0}
        )
        
        system_prompt = self.SYSTEM_PROMPT.format(
            payment_info="Token amount: 10% of plot value\nPayment modes: UPI, Bank Transfer, Cheque",
            booking_details=f"Booking ID: {booking.get('id', 'N/A')}" if booking else "No active booking",
            language=context.get("language", "english")
        )
        
        response = await self.generate_llm_response(
            system_prompt=system_prompt,
            user_message=f"Customer query: {message}",
            session_id=f"payment_{lead_id}"
        )
        
        return {
            "response": response,
            "booking_id": booking.get("id") if booking else None,
            "action": "payment_info_provided",
            "next_state": "payment_pending"
        }


class KnowledgeAgent(BaseAgent):
    """
    Handles general project/property knowledge queries with STRICT business rules
    """
    
    SYSTEM_PROMPT = """You are a business-specific real estate consultant for {company_name}.

STRICT RULES - FOLLOW EXACTLY:

1. CONTEXT MEMORY (MANDATORY)
- Always remember and use customer's:
  - Budget: {budget}
  - Preferred location: {location}
  - Property type: {property_type}
- Once user mentions location, DO NOT suggest any other location.

2. PROJECT FILTERING (CRITICAL)
- Only answer about projects that match user's preferred location
- If question is about different city → say "Currently {location} projects meedha focus chesdam, akkada manchi options unnai"
- If no matching project → "Currently exact match available ledu, but similar options chupistanu"

3. NO RANDOM GENERATION
- Do NOT generate: random city names, unrelated projects, generic answers
- ONLY use data from: {project_knowledge}

4. RESPONSE STYLE
- Use natural Telugu-English mix
- Keep it simple, polite, and slightly persuasive
- Short, clear, conversational (2-5 lines max)
- Always guide towards next step (visit / call / decision)

5. HANDOVER RULE
- For: negotiation, legal/documents, final decision
- Say: "maa team nundi okaru connect avtharu"

6. PRIORITY ORDER
- Accuracy > Smartness
- Relevance > Creativity
- Trust > Length

Project Knowledge (ONLY use this data):
{project_knowledge}

Respond in: {language}
"""
    
    async def process(
        self, 
        tenant_id: str,
        lead_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        knowledge_text = context.get("formatted_knowledge", "No project information available")
        
        # Get lead preferences
        lead = await self.db.leads.find_one(
            {"tenant_id": tenant_id, "id": lead_id},
            {"_id": 0}
        )
        
        # Get tenant/company name
        tenant = await self.db.tenants.find_one(
            {"id": tenant_id},
            {"_id": 0, "company_name": 1, "name": 1}
        )
        company_name = tenant.get("company_name") or tenant.get("name", "our company") if tenant else "our company"
        
        # Extract preferences
        budget = lead.get("budget_max") or lead.get("budget", 0) if lead else 0
        location = lead.get("preferred_location", "") if lead else ""
        property_type = lead.get("property_type", "") if lead else ""
        
        system_prompt = self.SYSTEM_PROMPT.format(
            company_name=company_name,
            project_knowledge=knowledge_text,
            language=context.get("language", "english"),
            budget=f"₹{budget:,.0f}" if budget else "Not specified",
            location=location or "Not specified",
            property_type=property_type or "Not specified"
        )
        
        response = await self.generate_llm_response(
            system_prompt=system_prompt,
            user_message=f"Customer question: {message}\n\nRemember: Only suggest projects in '{location or 'their preferred area'}'. Do NOT mention random cities.",
            session_id=f"knowledge_{lead_id}"
        )
        
        # Check for handoff triggers
        message_lower = message.lower()
        handoff_keywords = ['negotiation', 'discount', 'reduce', 'documents', 'legal', 'final', 'deal', 'price kam']
        should_handoff = any(kw in message_lower for kw in handoff_keywords)
        
        next_state = "project_discussion"
        if should_handoff:
            next_state = "human_handoff"
            response = response + "\n\nmaa team nundi okaru connect avtharu - they'll help you with this."
        
        return {
            "response": response,
            "action": "question_answered",
            "next_state": next_state
        }
