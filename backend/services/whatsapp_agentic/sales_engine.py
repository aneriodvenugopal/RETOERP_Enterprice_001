"""
Sales Engine - DB-First Real Estate Sales Closer
Replaces the question-machine approach with a smart sales flow:

FLOW:
  User message → Parse location/budget/intent
  → Check DB for matching projects/properties
  → Match Found? → Show projects → Close (visit/call/booking)
  → No Match? → Ask max 3 questions → Capture lead → "Our team will call"

RULES:
  - Max 3 questions total
  - Never repeat questions
  - DB check FIRST, then ask
  - Fast conversion (visit/call/booking)
  - Exit on bye/not interested
"""

import os
import re
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


# Location keywords for Indian cities/areas
LOCATION_KEYWORDS = {
    "hyderabad": ["hyderabad", "hyd", "secunderabad", "shamirpet", "adibatla", "tukkuguda",
                   "kompally", "medchal", "miyapur", "gachibowli", "kondapur", "madhapur",
                   "kukatpally", "bachupally", "nizampet", "pragathi nagar", "patancheru",
                   "mokila", "shankarpally", "shadnagar", "maheshwaram", "ibrahimpatnam",
                   "ghatkesar", "uppal", "nagole", "lb nagar", "dilsukhnagar", "vanasthalipuram",
                   "hayathnagar", "balapur", "meerpet", "bandlaguda"],
    "vijayawada": ["vijayawada", "vjw", "bezawada", "mangalagiri", "guntur", "amaravati",
                   "tadepalli", "undavalli", "sattenapalli", "tenali", "narasaraopet",
                   "santhinagar", "poranki", "kanuru", "gannavaram", "kanchikacherla"],
    "visakhapatnam": ["visakhapatnam", "vizag", "vishakhapatnam", "madhurawada",
                      "gajuwaka", "anakapalle", "pendurthi", "simhachalam"],
    "bangalore": ["bangalore", "bengaluru", "blr", "whitefield", "electronic city",
                  "sarjapur", "hsr layout", "koramangala", "marathahalli"],
    "chennai": ["chennai", "madras", "tambaram", "velachery", "adyar", "anna nagar",
                "omr", "ecr", "sholinganallur"],
}

EXIT_KEYWORDS = ["bye", "not interested", "no thanks", "no need", "stop", "cancel",
                 "leave me", "dont want", "don't want", "no more", "exit"]


def extract_location(message: str) -> Optional[str]:
    """Extract location/city from user message"""
    msg_lower = message.lower()
    for city, keywords in LOCATION_KEYWORDS.items():
        for kw in keywords:
            if kw in msg_lower:
                # Return the specific area if it's not the city name
                if kw != city:
                    return kw.title()
                return city.title()
    return None


def extract_budget(message: str) -> Optional[Dict[str, Any]]:
    """Extract budget from message. Returns dict with min/max and raw text"""
    msg_lower = message.lower()

    # Patterns: "50 lakhs", "50L", "1 crore", "1cr", "20-30 lakhs"
    patterns = [
        (r'(\d+\.?\d*)\s*(?:to|-)\s*(\d+\.?\d*)\s*(?:lakhs?|lacs?|l\b)', 'lakh_range'),
        (r'(\d+\.?\d*)\s*(?:to|-)\s*(\d+\.?\d*)\s*(?:crores?|cr\b)', 'crore_range'),
        (r'(\d+\.?\d*)\s*(?:lakhs?|lacs?|l\b)', 'lakh'),
        (r'(\d+\.?\d*)\s*(?:crores?|cr\b)', 'crore'),
        (r'(\d+\.?\d*)\s*(?:k\b)', 'thousand'),
    ]

    for pattern, ptype in patterns:
        match = re.search(pattern, msg_lower)
        if match:
            if ptype == 'lakh_range':
                return {"min": float(match.group(1)) * 100000, "max": float(match.group(2)) * 100000,
                        "text": f"{match.group(1)}-{match.group(2)} Lakhs"}
            elif ptype == 'crore_range':
                return {"min": float(match.group(1)) * 10000000, "max": float(match.group(2)) * 10000000,
                        "text": f"{match.group(1)}-{match.group(2)} Crores"}
            elif ptype == 'lakh':
                val = float(match.group(1)) * 100000
                return {"min": val * 0.8, "max": val * 1.2, "text": f"{match.group(1)} Lakhs"}
            elif ptype == 'crore':
                val = float(match.group(1)) * 10000000
                return {"min": val * 0.8, "max": val * 1.2, "text": f"{match.group(1)} Crores"}
            elif ptype == 'thousand':
                val = float(match.group(1)) * 1000
                return {"min": val * 0.8, "max": val * 1.2, "text": f"{match.group(1)}K"}
    return None


def extract_property_type(message: str) -> Optional[str]:
    """Extract property type from message"""
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["plot", "plots", "land", "site", "sites"]):
        return "plot"
    if any(w in msg_lower for w in ["villa", "villas", "house", "independent house"]):
        return "villa"
    if any(w in msg_lower for w in ["flat", "flats", "apartment", "apartments", "2bhk", "3bhk"]):
        return "flat"
    if any(w in msg_lower for w in ["commercial", "shop", "office", "warehouse"]):
        return "commercial"
    if any(w in msg_lower for w in ["residential", "property", "properties"]):
        return "residential"
    return None


def is_exit_message(message: str) -> bool:
    """Check if user wants to exit"""
    msg_lower = message.lower().strip()
    return any(kw in msg_lower for kw in EXIT_KEYWORDS)


def is_option_selection(message: str) -> Optional[int]:
    """Check if user selected an option (1, 2, 3)"""
    msg = message.strip()
    if msg in ["1", "2", "3"]:
        return int(msg)
    if msg.lower() in ["call", "talk", "phone"]:
        return 1
    if msg.lower() in ["visit", "site visit", "see", "schedule"]:
        return 2
    if msg.lower() in ["details", "more info", "information", "brochure"]:
        return 3
    return None


class SalesEngine:
    """
    DB-First Real Estate Sales Engine.
    Single smart agent that checks DB first, then closes deals.
    """

    def __init__(self, db, llm_key: Optional[str] = None):
        self.db = db
        self.llm_key = llm_key or os.getenv("EMERGENT_LLM_KEY")

    async def process(
        self,
        tenant_id: str,
        lead_id: str,
        phone: str,
        message: str,
        conversation: Dict[str, Any],
        message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main sales engine entry point.
        Returns dict with response, next_state, action, etc.
        """
        context = conversation.get("context", {})
        state = conversation.get("state", "new_lead")
        questions_asked = context.get("questions_asked", 0)

        # --- EXIT CHECK ---
        if is_exit_message(message):
            return {
                "success": True,
                "response": "Thank you! Reach us anytime. Have a great day!",
                "next_state": "closed",
                "action": "conversation_closed",
                "context_update": {"status": "closed"}
            }

        # --- EXTRACT INFO FROM MESSAGE ---
        location = extract_location(message) or context.get("location")
        budget = extract_budget(message)
        prop_type = extract_property_type(message) or context.get("property_type")

        # Update context with new info
        new_context = dict(context)
        if location and not context.get("location"):
            new_context["location"] = location
        if budget:
            new_context["budget"] = budget
            new_context["budget_text"] = budget["text"]
        if prop_type and not context.get("property_type"):
            new_context["property_type"] = prop_type

        # --- OPTION SELECTION (after projects shown) ---
        if state == "project_discussion":
            option = is_option_selection(message)
            if option:
                return await self._handle_option_selection(
                    option, tenant_id, lead_id, phone, new_context
                )

        # --- SITE VISIT SCHEDULING ---
        if state == "site_visit_offer":
            return await self._handle_site_visit_scheduling(
                message, tenant_id, lead_id, phone, new_context, conversation
            )

        # --- DB SEARCH (always check first if we have location) ---
        current_location = new_context.get("location")
        if current_location:
            matches = await self._search_db(tenant_id, current_location, new_context.get("budget"))
            if matches["projects"] or matches["properties"]:
                response = self._format_matches(matches, current_location, new_context)
                return {
                    "success": True,
                    "response": response,
                    "next_state": "project_discussion",
                    "action": "projects_shown",
                    "context_update": {
                        **new_context,
                        "matches_found": True,
                        "match_count": len(matches["projects"]) + len(matches["properties"])
                    }
                }

        # --- NO MATCH / NOT ENOUGH INFO → SMART LEAD CAPTURE ---
        return await self._smart_lead_capture(
            message, tenant_id, lead_id, phone, new_context, questions_asked, state
        )

    async def _search_db(
        self, tenant_id: str, location: str, budget: Optional[Dict] = None
    ) -> Dict[str, List]:
        """Search projects and properties by location and budget"""
        loc_lower = location.lower()

        # Search projects
        project_query = {
            "tenant_id": tenant_id,
            "deleted_at": None,
            "$or": [
                {"location": {"$regex": loc_lower, "$options": "i"}},
                {"city": {"$regex": loc_lower, "$options": "i"}},
                {"name": {"$regex": loc_lower, "$options": "i"}},
                {"address": {"$regex": loc_lower, "$options": "i"}}
            ]
        }
        projects = await self.db.projects.find(
            project_query, {"_id": 0}
        ).limit(5).to_list(5)

        # Search properties
        prop_query = {
            "tenant_id": tenant_id,
            "deleted_at": None,
            "$or": [
                {"location": {"$regex": loc_lower, "$options": "i"}},
                {"location_text": {"$regex": loc_lower, "$options": "i"}},
                {"city": {"$regex": loc_lower, "$options": "i"}},
                {"address": {"$regex": loc_lower, "$options": "i"}}
            ]
        }
        if budget:
            prop_query["$and"] = [
                {"$or": [
                    {"total_price": {"$gte": budget.get("min", 0), "$lte": budget.get("max", 999999999)}},
                    {"price": {"$gte": budget.get("min", 0), "$lte": budget.get("max", 999999999)}}
                ]}
            ]

        properties = await self.db.properties.find(
            prop_query, {"_id": 0}
        ).limit(10).to_list(10)

        # Also try without budget filter if no results
        if not properties and budget:
            properties = await self.db.properties.find(
                {k: v for k, v in prop_query.items() if k != "$and"},
                {"_id": 0}
            ).limit(10).to_list(10)

        return {"projects": projects, "properties": properties}

    def _format_matches(
        self, matches: Dict, location: str, context: Dict
    ) -> str:
        """Format matching projects/properties as a sales-ready response"""
        parts = []
        parts.append(f"We have properties in {location} matching your requirement!\n")

        # Show projects
        for i, proj in enumerate(matches["projects"][:3], 1):
            name = proj.get("name", "Project")
            loc = proj.get("location", "")
            total = proj.get("total_units", "")
            status = proj.get("status", "")
            parts.append(f"{i}. *{name}*")
            if loc:
                parts.append(f"   Location: {loc}")
            if total:
                parts.append(f"   Total Units: {total}")

        # Show properties if no projects
        if not matches["projects"] and matches["properties"]:
            for i, prop in enumerate(matches["properties"][:3], 1):
                plot_num = prop.get("plot_number", prop.get("property_number", f"Property {i}"))
                area = prop.get("area_sqft") or prop.get("total_area", "")
                price = prop.get("total_price") or prop.get("price", "")
                facing = prop.get("facing", "")
                loc = prop.get("location", prop.get("location_text", ""))

                parts.append(f"{i}. *Plot {plot_num}*")
                if area:
                    parts.append(f"   Area: {area} sqft")
                if price:
                    parts.append(f"   Price: Rs.{price:,.0f}" if isinstance(price, (int, float)) else f"   Price: {price}")
                if facing:
                    parts.append(f"   Facing: {facing}")

        parts.append("\nWould you like to:")
        parts.append("1. Talk to our expert")
        parts.append("2. Schedule site visit")
        parts.append("3. Get full project details")
        parts.append("\n_Reply 1, 2 or 3_")

        return "\n".join(parts)

    async def _handle_option_selection(
        self, option: int, tenant_id: str, lead_id: str, phone: str, context: Dict
    ) -> Dict[str, Any]:
        """Handle user's option selection after seeing projects"""
        if option == 1:
            # CALL REQUEST
            await self._update_lead(tenant_id, lead_id, {
                "status": "hot",
                "notes": f"WhatsApp: Requested callback. Location: {context.get('location', 'N/A')}, Budget: {context.get('budget_text', 'N/A')}",
                "follow_up_date": datetime.now(timezone.utc).isoformat()
            })
            return {
                "success": True,
                "response": "Our property expert will call you shortly!\n\nIs there a preferred time for the call?",
                "next_state": "qualification",
                "action": "callback_requested",
                "context_update": {**context, "callback_requested": True},
                "human_followup_required": True
            }

        elif option == 2:
            # SITE VISIT
            return {
                "success": True,
                "response": "Great choice! Let's schedule your site visit.\n\nPlease share your preferred date and time.\n\n_Example: Tomorrow 10 AM, Saturday 3 PM_",
                "next_state": "site_visit_offer",
                "action": "site_visit_flow",
                "context_update": {**context, "visit_requested": True}
            }

        elif option == 3:
            # PROJECT DETAILS
            location = context.get("location", "")
            matches = await self._search_db(tenant_id, location) if location else {"projects": [], "properties": []}
            detail_parts = [f"Project details for {location}:\n"]

            for proj in matches.get("projects", [])[:2]:
                detail_parts.append(f"*{proj.get('name', '')}*")
                if proj.get("description"):
                    detail_parts.append(f"{proj['description'][:200]}")
                if proj.get("amenities"):
                    amenities = proj["amenities"][:5] if isinstance(proj["amenities"], list) else []
                    if amenities:
                        detail_parts.append(f"Amenities: {', '.join(amenities)}")
                if proj.get("rera_number"):
                    detail_parts.append(f"RERA: {proj['rera_number']}")
                detail_parts.append("")

            if not matches.get("projects"):
                for prop in matches.get("properties", [])[:3]:
                    detail_parts.append(f"*Plot {prop.get('plot_number', '')}*")
                    area = prop.get("area_sqft") or prop.get("total_area", "")
                    if area:
                        detail_parts.append(f"Area: {area} sqft")
                    price = prop.get("total_price") or prop.get("price")
                    if price:
                        detail_parts.append(f"Price: Rs.{price:,.0f}" if isinstance(price, (int, float)) else f"Price: {price}")
                    detail_parts.append("")

            detail_parts.append("Would you like to schedule a site visit?")
            detail_parts.append("_Reply 'yes' or '2' to book visit_")

            return {
                "success": True,
                "response": "\n".join(detail_parts),
                "next_state": "project_discussion",
                "action": "details_sent",
                "context_update": {**context, "details_sent": True}
            }

        return {"success": True, "response": "Please reply 1, 2 or 3.", "action": "invalid_option"}

    async def _handle_site_visit_scheduling(
        self, message: str, tenant_id: str, lead_id: str, phone: str,
        context: Dict, conversation: Dict
    ) -> Dict[str, Any]:
        """Handle site visit date/time from user"""
        # Save site visit
        visit_id = str(uuid.uuid4())
        visit = {
            "id": visit_id,
            "tenant_id": tenant_id,
            "lead_id": lead_id,
            "phone": phone,
            "location": context.get("location", ""),
            "preferred_time": message,
            "status": "scheduled",
            "source": "whatsapp_bot",
            "created_at": datetime.now(timezone.utc)
        }
        await self.db.site_visits.insert_one(visit)

        await self._update_lead(tenant_id, lead_id, {
            "status": "hot",
            "notes": f"WhatsApp: Site visit scheduled - {message}. Location: {context.get('location', 'N/A')}"
        })

        return {
            "success": True,
            "response": f"Your site visit is confirmed!\n\nTime: {message}\nLocation: {context.get('location', 'N/A')}\n\nOur team will contact you to confirm. Thank you!",
            "next_state": "site_visit_scheduled",
            "action": "visit_scheduled",
            "site_visit_id": visit_id,
            "context_update": {**context, "visit_scheduled": True, "visit_time": message},
            "human_followup_required": True
        }

    async def _smart_lead_capture(
        self, message: str, tenant_id: str, lead_id: str, phone: str,
        context: Dict, questions_asked: int, state: str
    ) -> Dict[str, Any]:
        """
        Smart lead capture - ask only what's missing, max 3 questions.
        Uses LLM for natural conversation but with strict rules.
        """
        location = context.get("location")
        budget = context.get("budget")
        prop_type = context.get("property_type")

        # If we've asked 3+ questions already, just capture and close
        if questions_asked >= 3:
            await self._update_lead(tenant_id, lead_id, {
                "status": "warm",
                "preferred_location": location or "",
                "budget": budget.get("max") if budget else None,
                "property_type": prop_type or "",
                "notes": f"WhatsApp lead capture: Location={location}, Budget={context.get('budget_text','N/A')}, Type={prop_type}"
            })
            return {
                "success": True,
                "response": "Thank you! Our property expert will call you shortly with suitable options.",
                "next_state": "qualification",
                "action": "lead_captured",
                "context_update": {**context, "lead_captured": True},
                "human_followup_required": True
            }

        # Determine what to ask
        missing = []
        if not location:
            missing.append("location")
        if not prop_type:
            missing.append("property_type")
        if not budget:
            missing.append("budget")

        # Generate natural response with LLM
        response = await self._generate_sales_response(
            message, context, missing, questions_asked, state
        )

        return {
            "success": True,
            "response": response,
            "next_state": "qualification",
            "action": "lead_qualifying",
            "context_update": {
                **context,
                "questions_asked": questions_asked + 1,
                "last_asked": missing[0] if missing else None
            }
        }

    async def _generate_sales_response(
        self, message: str, context: Dict, missing: List[str], questions_asked: int, state: str
    ) -> str:
        """Generate a natural sales response using LLM"""
        known_info = []
        if context.get("location"):
            known_info.append(f"Location: {context['location']}")
        if context.get("budget_text"):
            known_info.append(f"Budget: {context['budget_text']}")
        if context.get("property_type"):
            known_info.append(f"Type: {context['property_type']}")

        known_str = ", ".join(known_info) if known_info else "Nothing known yet"
        missing_str = ", ".join(missing) if missing else "All info collected"

        system_prompt = f"""You are a smart real estate sales agent for Eloniot Software Solutions.
You are chatting on WhatsApp. Be concise, friendly, and professional.

STRICT RULES:
- Ask ONLY ONE question at a time
- NEVER repeat a question if info is already known
- Keep response under 3 lines
- Use natural Telugu-English mix if customer seems Telugu
- NO emojis except minimal (1-2 max)
- NEVER ask more than what's missing
- If greeting (hi/hello), welcome briefly and ask about location preference

KNOWN CUSTOMER INFO: {known_str}
MISSING INFO NEEDED: {missing_str}
QUESTIONS ASKED SO FAR: {questions_asked}

If no info is missing, say: "Thank you! Our expert will call you shortly with the best options."
If only location is missing, ask: "Which area/city are you looking for properties?"
If only budget is missing, ask: "What's your budget range?"
If only type is missing, ask: "Are you looking for plots, villa, or flat?"
"""
        try:
            chat = LlmChat(
                api_key=self.llm_key,
                session_id=f"sales_{context.get('phone', 'unknown')}_{questions_asked}",
                system_message=system_prompt
            ).with_model("anthropic", "claude-sonnet-4-20250514")

            response = await chat.send_message(UserMessage(text=message))
            return response.strip()
        except Exception as e:
            logger.error(f"LLM error in sales engine: {e}")
            # Fallback: ask the first missing item
            if "location" in missing:
                return "Which area are you looking for properties?"
            elif "budget" in missing:
                return "What's your budget range?"
            elif "property_type" in missing:
                return "Looking for plots, villa, or flat?"
            return "Thank you! Our expert will call you shortly."

    async def _update_lead(self, tenant_id: str, lead_id: str, updates: Dict):
        """Update lead in database"""
        try:
            await self.db.leads.update_one(
                {"tenant_id": tenant_id, "id": lead_id},
                {"$set": {**updates, "updated_at": datetime.now(timezone.utc)}}
            )
        except Exception as e:
            logger.error(f"Failed to update lead: {e}")
