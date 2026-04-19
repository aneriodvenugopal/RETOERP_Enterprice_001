"""
Sales Engine v2 - RealApex Property Expert
Cost-optimized WhatsApp AI with Gemini primary + GPT-4o-mini fallback.

FLOW:
  User message -> Parse location/budget/intent
  -> RAG: Pull tenant's project data, plots, FAQs, location highlights
  -> Check DB for matching projects/properties
  -> Match Found? -> Show projects + location highlights -> Close (visit/call/booking)
  -> No Match? -> Ask max 3 questions -> Capture lead -> "Our team will call"

RULES:
  - Max 3 questions total
  - Never repeat questions
  - DB check FIRST, then ask
  - Fast conversion (visit/call/booking)
  - Exit on bye/not interested
  - Multi-tenant: use only current tenant's data
  - NEVER reveal customer private data
"""

import os
import re
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid

from .llm_router import llm_router
from .knowledge_retriever import KnowledgeRetriever

logger = logging.getLogger(__name__)

# Location keywords for Indian cities/areas
LOCATION_KEYWORDS = {
    "hyderabad": ["hyderabad", "hyd", "secunderabad", "shamirpet", "adibatla", "tukkuguda",
                   "kompally", "medchal", "miyapur", "gachibowli", "kondapur", "madhapur",
                   "kukatpally", "bachupally", "nizampet", "pragathi nagar", "patancheru",
                   "mokila", "shankarpally", "shadnagar", "maheshwaram", "ibrahimpatnam",
                   "ghatkesar", "uppal", "nagole", "lb nagar", "dilsukhnagar", "vanasthalipuram",
                   "hayathnagar", "balapur", "meerpet", "bandlaguda", "narsingi", "kokapet",
                   "financial district", "nanakramguda", "tellapur", "ameenpur", "isnapur",
                   "dundigal", "sangareddy", "sadashivpet", "chevella", "moinabad",
                   "srisailam highway", "airport", "shamshabad", "kothur", "sagar highway",
                   "gandipet", "osman sagar", "himayat sagar", "jubilee hills", "banjara hills",
                   "film nagar", "manikonda", "puppalaguda", "rajendra nagar",
                   "mehdipatnam", "attapur", "pillar no", "tolichowki"],
    "vijayawada": ["vijayawada", "vjw", "bezawada", "mangalagiri", "guntur", "amaravati",
                   "tadepalli", "undavalli", "sattenapalli", "tenali", "narasaraopet",
                   "santhinagar", "poranki", "kanuru", "gannavaram", "kanchikacherla",
                   "nunna", "jaggaiahpet", "ibrahimpatnam"],
    "visakhapatnam": ["visakhapatnam", "vizag", "vishakhapatnam", "madhurawada",
                      "gajuwaka", "anakapalle", "pendurthi", "simhachalam"],
    "bangalore": ["bangalore", "bengaluru", "blr", "whitefield", "electronic city",
                  "sarjapur", "hsr layout", "koramangala", "marathahalli"],
    "chennai": ["chennai", "madras", "tambaram", "velachery", "adyar", "anna nagar",
                "omr", "ecr", "sholinganallur"],
    "warangal": ["warangal", "hanamkonda", "kazipet"],
    "karimnagar": ["karimnagar"],
    "khammam": ["khammam"],
    "nalgonda": ["nalgonda"],
    "nizamabad": ["nizamabad"],
    "tirupati": ["tirupati"],
    "nellore": ["nellore"],
    "rajahmundry": ["rajahmundry", "rajamahendravaram"],
    "kakinada": ["kakinada"],
}

EXIT_KEYWORDS = ["bye", "not interested", "no thanks", "no need", "stop", "cancel",
                 "leave me", "dont want", "don't want", "no more", "exit"]

# Location highlights for Telangana/Hyderabad areas
LOCATION_HIGHLIGHTS = {
    "shamirpet": "RRR Road proximity, Genome Valley, IIT Hyderabad nearby, HMDA approved layouts",
    "adibatla": "Near Rajiv Gandhi International Airport, Aerospace SEZ, HMDA approved, RRR connectivity",
    "tukkuguda": "ORR Exit 14, Airport proximity, Growing residential hub, HMDA approved",
    "kompally": "Medchal-Malkajgiri district, NH-44 access, Metro expansion planned",
    "shadnagar": "Srisailam Highway, RRR connectivity, HMDA approved, Affordable pricing",
    "maheshwaram": "Near ORR, LB Nagar connectivity, HMDA approved, Pharma City nearby",
    "mokila": "Gachibowli proximity, IT corridor access, Peaceful residential area",
    "patancheru": "Industrial hub, NH-65 access, Affordable land rates",
    "kokapet": "Financial District adjacent, Premium location, Metro connectivity planned",
    "narsingi": "ORR access, Gachibowli IT hub nearby, Premium residential area",
    "tellapur": "Near Gachibowli, Rapid development, Metro planned",
    "shamshabad": "Airport Road, Logistics hub, HMDA approved",
    "mangalagiri": "Amaravati Capital Region, NH-16 access, Growing city",
    "guntur": "AP major city, Medical hub, Education center",
    "tadepalli": "Krishna River front, Capital Region, NH connectivity",
}


def extract_location(message: str) -> Optional[str]:
    """Extract location/city from user message"""
    msg_lower = message.lower()
    for city, keywords in LOCATION_KEYWORDS.items():
        for kw in keywords:
            if kw in msg_lower:
                if kw != city:
                    return kw.title()
                return city.title()
    return None


def extract_budget(message: str) -> Optional[Dict[str, Any]]:
    """Extract budget from message. Returns dict with min/max and raw text"""
    msg_lower = message.lower()
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
    if any(w in msg_lower for w in ["plot", "plots", "land", "site", "sites", "open plot"]):
        return "plot"
    if any(w in msg_lower for w in ["villa", "villas", "house", "independent house", "duplex"]):
        return "villa"
    if any(w in msg_lower for w in ["flat", "flats", "apartment", "apartments", "2bhk", "3bhk", "1bhk"]):
        return "flat"
    if any(w in msg_lower for w in ["commercial", "shop", "office", "warehouse", "godown"]):
        return "commercial"
    if any(w in msg_lower for w in ["farm", "farm land", "agricultural", "agriculture"]):
        return "farmland"
    if any(w in msg_lower for w in ["residential", "property", "properties"]):
        return "residential"
    return None


def is_exit_message(message: str) -> bool:
    msg_lower = message.lower().strip()
    return any(kw in msg_lower for kw in EXIT_KEYWORDS)


def is_option_selection(message: str) -> Optional[int]:
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


def get_location_highlights(location: str) -> str:
    """Get location highlights for a given area"""
    loc_lower = location.lower()
    for area, highlights in LOCATION_HIGHLIGHTS.items():
        if area in loc_lower or loc_lower in area:
            return highlights
    return ""


# System prompt for the RealApex Property Expert
REALAPEX_EXPERT_PROMPT = """You are "RealApex Property Expert" – a warm, highly experienced, and professional real estate advisor for builders in Telangana/Hyderabad.

You work inside RealApex SaaS (multi-tenant system). Each tenant (builder) uploads their own project data, properties, layouts, availability status, gallery images, YouTube links, location details, FAQs, brochures, website content, and additional information into the database.

Always use the latest tenant-specific/project-specific data from the Knowledge Base below for the current chat.

Key Rules:
1. Identify the tenant_id / project_id / builder from the conversation context and use ONLY that tenant's data.
2. Provide accurate, up-to-date information about:
   - Project details, property types, layouts, pricing, availability status
   - Brochures (share direct links if available)
   - Specific layout links / floor plans
   - Gallery images and YouTube video links
   - Location highlights, amenities, FAQs, website content
3. Share brochures, layouts, gallery, or website links naturally when relevant.
4. STRICT PRIVACY: NEVER reveal, mention, or hint at any customer personal data, purchase history, buyer names, payment details, or any hidden/sensitive information of previous customers. If asked, politely say you cannot share private customer information.

Personality & Style:
- Speak like a senior, caring real estate consultant who genuinely wants the best for the customer's family.
- Use empathy, excitement about the project, and emotional intelligence.
- Build trust and gently guide the lead towards site visit or booking.
- Never sound robotic. Keep replies natural, warm, and professional.
- If the customer speaks Telugu, respond with natural Telugu-English mix.
- Keep WhatsApp messages concise (3-5 lines max).

STRICT RULES:
- Ask ONLY ONE question at a time
- NEVER repeat a question if info is already known
- Keep response under 5 lines
- NO emojis except minimal (1-2 max)
- NEVER ask more than what's missing

Goal:
Make the customer feel they are talking to a real, knowledgeable project-specific expert so they confidently book a site visit and move towards booking/payment.

Always end with a clear next step question to move the conversation forward.

{knowledge_context}

{location_highlights}

KNOWN CUSTOMER INFO: {known_info}
MISSING INFO: {missing_info}
QUESTIONS ASKED: {questions_asked}
"""


class SalesEngine:
    """
    DB-First Real Estate Sales Engine v2.
    Uses Gemini (primary) + GPT-4o-mini (fallback) for cost optimization.
    Full long-term conversation memory via chat history from DB.
    """

    # Max recent messages to send in full to LLM
    MAX_RECENT_MESSAGES = 5
    # Messages older than this get summarized
    SUMMARIZE_THRESHOLD = 50

    def __init__(self, db):
        self.db = db
        self.knowledge_retriever = KnowledgeRetriever(db)

    async def _load_chat_history(
        self, conversation_id: str, phone: str
    ) -> List[Dict[str, str]]:
        """
        Load full chat history for this phone/conversation from DB.
        Returns list of {"role": "user"|"assistant", "content": "..."}.

        Memory management:
        - Last 30 messages: sent in full
        - Older messages: auto-summarized into a single context block
        """
        # Load all messages for this conversation, oldest first
        all_messages = await self.db.whatsapp_messages.find(
            {"conversation_id": conversation_id},
            {"_id": 0, "role": 1, "content": 1, "timestamp": 1}
        ).sort("timestamp", 1).to_list(500)

        if not all_messages:
            return []

        # Filter to user/assistant only (skip system messages)
        chat_msgs = [
            m for m in all_messages
            if m.get("role") in ("user", "assistant") and m.get("content")
        ]

        total = len(chat_msgs)

        if total <= self.MAX_RECENT_MESSAGES:
            # All messages fit — return as-is
            return [{"role": m["role"], "content": m["content"]} for m in chat_msgs]

        # Split: old messages get summarized, recent messages kept in full
        old_msgs = chat_msgs[: total - self.MAX_RECENT_MESSAGES]
        recent_msgs = chat_msgs[total - self.MAX_RECENT_MESSAGES :]

        # Check if a summary already exists for this conversation
        existing_summary = await self.db.whatsapp_conversation_summaries.find_one(
            {"conversation_id": conversation_id, "message_count": {"$gte": len(old_msgs)}},
            {"_id": 0, "summary": 1}
        )

        if existing_summary:
            summary_text = existing_summary["summary"]
        else:
            # Generate summary of old messages
            summary_text = self._build_summary(old_msgs)
            # Cache the summary
            await self.db.whatsapp_conversation_summaries.update_one(
                {"conversation_id": conversation_id},
                {"$set": {
                    "conversation_id": conversation_id,
                    "summary": summary_text,
                    "message_count": len(old_msgs),
                    "updated_at": datetime.now(timezone.utc),
                }},
                upsert=True,
            )

        # Build final history: summary as first "assistant" context + recent messages
        history = []
        if summary_text:
            history.append({
                "role": "user",
                "content": "[Previous conversation summary — customer context]"
            })
            history.append({
                "role": "assistant",
                "content": summary_text
            })

        for m in recent_msgs:
            history.append({"role": m["role"], "content": m["content"]})

        logger.info(f"Chat history loaded: {total} total msgs, {len(old_msgs)} summarized, {len(recent_msgs)} recent")
        return history

    def _build_summary(self, messages: List[Dict]) -> str:
        """Build a text summary of old messages (without LLM — fast extraction)."""
        parts = ["PREVIOUS CONVERSATION SUMMARY:"]
        customer_topics = set()
        customer_locations = set()
        customer_budget = ""

        for m in messages:
            content = m.get("content", "")
            role = m.get("role", "")

            if role == "user":
                # Extract key info from customer messages
                loc = extract_location(content)
                if loc:
                    customer_locations.add(loc)
                budget = extract_budget(content)
                if budget:
                    customer_budget = budget.get("text", "")
                prop_type = extract_property_type(content)
                if prop_type:
                    customer_topics.add(prop_type)
                # Keep first few customer messages as context
                if len(parts) < 8:
                    parts.append(f"Customer: {content[:100]}")
            elif role == "assistant" and len(parts) < 10:
                parts.append(f"Agent: {content[:100]}")

        if customer_locations:
            parts.append(f"Customer interested in: {', '.join(customer_locations)}")
        if customer_budget:
            parts.append(f"Budget mentioned: {customer_budget}")
        if customer_topics:
            parts.append(f"Property types discussed: {', '.join(customer_topics)}")

        return "\n".join(parts)

    async def process(
        self,
        tenant_id: str,
        lead_id: str,
        phone: str,
        message: str,
        conversation: Dict[str, Any],
        message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Main sales engine entry point."""
        context = conversation.get("context", {})
        state = conversation.get("state", "new_lead")
        questions_asked = context.get("questions_asked", 0)

        # --- STALE CONVERSATION RESET ---
        if context.get("lead_captured") or questions_asked > 3:
            logger.info(f"Resetting stale conversation for {phone} (lead_captured={context.get('lead_captured')}, questions={questions_asked})")
            context = {
                "location": context.get("location"),
                "budget": context.get("budget"),
                "budget_text": context.get("budget_text"),
                "property_type": context.get("property_type"),
                "questions_asked": 0,
                "lead_captured": False,
            }
            questions_asked = 0
            state = "new_lead"

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

        new_context = dict(context)
        if location and not context.get("location"):
            new_context["location"] = location
        if budget:
            new_context["budget"] = budget
            new_context["budget_text"] = budget["text"]
        if prop_type and not context.get("property_type"):
            new_context["property_type"] = prop_type

        # --- LOAD FULL CHAT HISTORY (long-term memory) ---
        conv_id = conversation.get("id", "")
        chat_history = await self._load_chat_history(conv_id, phone)

        # --- OPTION SELECTION (after projects shown) ---
        if state == "project_discussion":
            option = is_option_selection(message)
            if option:
                return await self._handle_option_selection(
                    option, tenant_id, lead_id, phone, new_context, chat_history
                )

        # --- SITE VISIT SCHEDULING ---
        if state == "site_visit_offer":
            return await self._handle_site_visit_scheduling(
                message, tenant_id, lead_id, phone, new_context, conversation
            )

        # --- ALWAYS LOAD TENANT KNOWLEDGE (RAG) ---
        knowledge = await self.knowledge_retriever.get_project_knowledge(tenant_id)
        knowledge_text = self.knowledge_retriever.format_knowledge_for_llm(knowledge)

        # FALLBACK: If current tenant has no data, find the data-rich tenant
        if not knowledge.get("projects") and not knowledge.get("available_plots"):
            logger.warning(f"Tenant {tenant_id} has no project data, searching for data-rich tenant...")
            pipeline = [
                {"$match": {"deleted_at": None}},
                {"$group": {"_id": "$tenant_id", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 1}
            ]
            async for doc in self.db.projects.aggregate(pipeline):
                if doc["count"] > 0:
                    rich_tenant = doc["_id"]
                    logger.info(f"Using data-rich tenant: {rich_tenant}")
                    knowledge = await self.knowledge_retriever.get_project_knowledge(rich_tenant)
                    knowledge_text = self.knowledge_retriever.format_knowledge_for_llm(knowledge)
                    # Override tenant_id for DB searches in this session
                    tenant_id = rich_tenant
                    break

        # --- CHECK: Is this a project inquiry? ---
        is_project_inquiry = self._is_project_inquiry(message)

        # --- SEARCH BY PROJECT NAME (fuzzy/partial match) ---
        name_match = await self._search_by_project_name(tenant_id, message)
        if name_match:
            response = await self._format_project_detail(name_match, tenant_id, message, new_context, chat_history)
            return {
                "success": True,
                "response": response,
                "next_state": "project_discussion",
                "action": "project_detail_shown",
                "context_update": {
                    **new_context,
                    "matched_project_id": name_match.get("id"),
                    "matched_project_name": name_match.get("name"),
                }
            }

        # --- DB SEARCH BY LOCATION (if location available) ---
        current_location = new_context.get("location")
        if current_location:
            matches = await self._search_db(tenant_id, current_location, new_context.get("budget"))
            if matches["projects"] or matches["properties"]:
                response = await self._format_matches_with_ai(
                    matches, current_location, new_context, tenant_id, message, chat_history
                )
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

        # --- PROJECT INQUIRY WITHOUT LOCATION ---
        # User asks "project names", "show projects", "availability" etc.
        if is_project_inquiry:
            return await self._handle_project_inquiry(
                message, tenant_id, new_context, knowledge, knowledge_text, chat_history
            )

        # --- SMART AI RESPONSE WITH KNOWLEDGE ---
        # For any message, use LLM with full project knowledge to answer
        return await self._smart_response_with_knowledge(
            message, tenant_id, lead_id, phone, new_context, questions_asked, state,
            knowledge_text, chat_history
        )

    async def _search_by_project_name(self, tenant_id: str, message: str) -> Optional[Dict]:
        """
        Smart project name search — fuzzy, partial, token matching.
        Extracts potential project name tokens from user message and searches DB.
        """
        msg_lower = message.lower().strip()

        # Skip very short or generic messages
        if len(msg_lower) < 3 or msg_lower in ["hi", "hello", "hey", "ok", "yes", "no", "1", "2", "3"]:
            return None

        # Remove common filler words to extract project name tokens
        filler_words = {
            "show", "me", "the", "about", "tell", "give", "details", "of", "in",
            "what", "is", "are", "do", "you", "have", "any", "data", "project",
            "projects", "plots", "plot", "available", "status", "price", "layout",
            "unda", "undi", "cheppu", "kavali", "kosam", "lo", "ki", "ni", "na",
            "i", "want", "need", "looking", "for", "a", "can", "get", "info",
            "information", "property", "properties", "how", "many",
            "my", "and", "was", "were", "or", "no", "yes", "ok", "it", "its",
            "this", "that", "to", "at", "on", "with", "from", "by", "be",
            "not", "but", "so", "if", "he", "she", "we", "they", "your",
            "our", "has", "had", "will", "would", "could", "should", "did",
            "name", "called", "which", "where", "when", "who", "there",
        }
        tokens = [w for w in msg_lower.split() if w not in filler_words and len(w) > 1]
        if not tokens:
            return None

        # Build search query: try matching project name with extracted tokens
        search_patterns = []
        # Full token string
        token_str = " ".join(tokens)
        if len(token_str) > 2:
            search_patterns.append({"name": {"$regex": token_str, "$options": "i"}})

        # Individual tokens (for partial match)
        for token in tokens:
            if len(token) > 2:
                search_patterns.append({"name": {"$regex": token, "$options": "i"}})

        if not search_patterns:
            return None

        # Search projects
        projects = await self.db.projects.find(
            {"tenant_id": tenant_id, "deleted_at": None, "$or": search_patterns},
            {"_id": 0}
        ).limit(5).to_list(5)

        if not projects:
            return None

        # Score matches by how many tokens match
        best_match = None
        best_score = 0
        for proj in projects:
            proj_name_lower = proj.get("name", "").lower()
            score = sum(1 for t in tokens if t in proj_name_lower)
            # Bonus for exact substring match
            if token_str in proj_name_lower:
                score += 5
            if score > best_score:
                best_score = score
                best_match = proj

        # Only return if at least 2 tokens matched OR exact substring match
        if best_match and best_score >= 2:
            logger.info(f"Project name match: '{best_match.get('name')}' (score={best_score}, tokens={tokens})")
            return best_match

        return None

    async def _format_project_detail(
        self, project: Dict, tenant_id: str, message: str, context: Dict,
        chat_history: Optional[List[Dict]] = None
    ) -> str:
        """Format a specific project's full details with plot availability table"""
        project_id = project.get("id", "")
        project_name = project.get("name", "Project")
        base_url = "https://realapex.in"

        # Get all properties for this project
        properties = await self.db.properties.find(
            {"project_id": project_id, "deleted_at": None},
            {"_id": 0}
        ).to_list(200)

        # Count by status
        available = [p for p in properties if str(p.get("status", "")).lower() in ["available", ""]]
        sold = [p for p in properties if str(p.get("status", "")).lower() in ["sold", "booked", "reserved"]]
        total = len(properties)

        # Build plot availability table
        table_lines = []
        for p in properties[:30]:  # Limit to 30 for WhatsApp
            plot_num = p.get("plot_number") or p.get("property_number") or "N/A"
            area = p.get("area_sqft") or p.get("total_area") or ""
            area_str = f"{area}" if area else "-"
            facing = p.get("facing") or "-"
            status = p.get("status") or "available"
            price = p.get("total_price") or p.get("price") or ""
            price_str = f"₹{price:,.0f}" if isinstance(price, (int, float)) and price else "-"

            status_icon = "✅" if status.lower() in ["available", ""] else "❌"
            table_lines.append(f"{status_icon} Plot {plot_num} | {area_str} sqft | {facing} | {price_str}")

        # Get layout info
        await self.db.layouts.find(
            {"project_id": project_id, "deleted_at": None},
            {"_id": 0, "id": 1, "name": 1}
        ).to_list(5)

        # Build response
        parts = []
        parts.append(f"*{project_name}*")
        parts.append(f"📍 Location: {project.get('location', 'N/A')}, {project.get('city', '')}")
        if project.get("status"):
            parts.append(f"Status: {project['status']}")
        if project.get("rera_number"):
            parts.append(f"RERA: {project['rera_number']}")
        if project.get("total_units"):
            parts.append(f"Total Units: {project['total_units']}")

        parts.append(f"\n📊 *Plot Availability*: {len(available)} Available / {len(sold)} Sold / {total} Total")

        if table_lines:
            parts.append("")
            parts.append("```")
            parts.append("Status | Plot | Area | Facing | Price")
            parts.append("─" * 35)
            for line in table_lines[:20]:
                parts.append(line)
            if len(table_lines) > 20:
                parts.append(f"... +{len(table_lines)-20} more plots")
            parts.append("```")

        # Links
        project_link = f"{base_url}/projects/{project_id}"
        layout_link = f"{base_url}/public/projects/{project_id}/layout"
        parts.append(f"\n🔗 Project: {project_link}")
        parts.append(f"📐 Layout: {layout_link}")

        if project.get("brochure_url"):
            brochure = project["brochure_url"]
            if not brochure.startswith("http"):
                brochure = f"{base_url}{brochure}"
            parts.append(f"📄 Brochure: {brochure}")

        parts.append("\nWould you like to:")
        parts.append("1. Talk to our expert")
        parts.append("2. Schedule site visit")
        parts.append("3. Get more details")
        parts.append("\n_Reply 1, 2 or 3_")

        return "\n".join(parts)

    def _is_project_inquiry(self, message: str) -> bool:
        """Detect if user is asking about projects, availability, or property details"""
        msg_lower = message.lower()
        inquiry_keywords = [
            "project", "projects", "project name", "project details",
            "available", "availability", "show me", "show properties",
            "what do you have", "what properties", "list", "names",
            "plots available", "how many", "which projects",
            "tell me about", "give me details", "brochure", "layout",
            "price", "pricing", "rate", "cost", "sqft rate",
            "amenities", "features", "rera", "status",
            "property details", "plot details", "units",
            "floor plan", "gallery", "images", "photos",
            "youtube", "video", "website", "link",
            "where is", "address", "total units",
        ]
        return any(kw in msg_lower for kw in inquiry_keywords)

    async def _handle_project_inquiry(
        self, message: str, tenant_id: str, context: Dict,
        knowledge: Dict, knowledge_text: str, chat_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Handle project inquiry - show ALL tenant projects/properties"""
        # Fetch ALL projects for this tenant
        all_projects = await self.db.projects.find(
            {"tenant_id": tenant_id, "deleted_at": None}, {"_id": 0}
        ).limit(10).to_list(10)

        # Count properties
        available_count = await self.db.properties.count_documents(
            {"tenant_id": tenant_id, "deleted_at": None,
             "status": {"$in": ["available", "Available", "AVAILABLE"]}}
        )
        total_count = await self.db.properties.count_documents(
            {"tenant_id": tenant_id, "deleted_at": None}
        )

        # FALLBACK: If current tenant has NO data, find tenant with most data
        if not all_projects and total_count == 0:
            logger.warning(f"Tenant {tenant_id} has no project data! Searching for data-rich tenant...")
            pipeline = [
                {"$match": {"deleted_at": None}},
                {"$group": {"_id": "$tenant_id", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 1}
            ]
            async for doc in self.db.projects.aggregate(pipeline):
                if doc["count"] > 0:
                    rich_tenant = doc["_id"]
                    logger.info(f"Found data-rich tenant: {rich_tenant} with {doc['count']} projects")
                    all_projects = await self.db.projects.find(
                        {"tenant_id": rich_tenant, "deleted_at": None}, {"_id": 0}
                    ).limit(10).to_list(10)
                    available_count = await self.db.properties.count_documents(
                        {"tenant_id": rich_tenant, "deleted_at": None,
                         "status": {"$in": ["available", "Available", "AVAILABLE"]}}
                    )
                    total_count = await self.db.properties.count_documents(
                        {"tenant_id": rich_tenant, "deleted_at": None}
                    )
                    # Also refresh knowledge from rich tenant
                    knowledge = await self.knowledge_retriever.get_project_knowledge(rich_tenant)
                    knowledge_text = self.knowledge_retriever.format_knowledge_for_llm(knowledge)
                    break

        # Build project summary for AI
        proj_summary = []
        for proj in all_projects:
            proj_summary.append(
                f"- *{proj.get('name', 'N/A')}*: {proj.get('location', '')}, "
                f"{proj.get('city', '')}, Status: {proj.get('status', 'N/A')}, "
                f"Units: {proj.get('total_units', 'N/A')}, "
                f"RERA: {proj.get('rera_number', 'N/A')}"
            )

        # Get sample properties
        await self.db.properties.find(
            {"tenant_id": tenant_id, "deleted_at": None},
            {"_id": 0, "plot_number": 1, "property_number": 1, "area_sqft": 1,
             "total_area": 1, "total_price": 1, "price": 1, "facing": 1,
             "status": 1, "location": 1, "location_text": 1, "city": 1}
        ).limit(5).to_list(5)

        try:
            prompt = f"""You are RealApex Property Expert. The customer is asking about projects/properties.
Answer their question using ONLY the data below. Be specific, share names, numbers, details.

TENANT'S PROJECTS ({len(all_projects)} total):
{chr(10).join(proj_summary) if proj_summary else 'No projects uploaded yet.'}

PROPERTY STATS: {available_count} available out of {total_count} total properties

FULL KNOWLEDGE BASE:
{knowledge_text[:3000]}

CUSTOMER MESSAGE: {message}

RULES:
- Share ACTUAL project names, locations, status, units, RERA numbers
- Share availability count and property details
- Share brochure/layout links if available in knowledge base
- If the customer asks about a specific project, give detailed info
- Keep it concise but INFORMATIVE (share real data, not vague statements)
- End with a question to move towards site visit/booking
- Max 10 lines"""

            result = await llm_router.generate(
                system_prompt=prompt,
                user_message=message,
                context=context,
                chat_history=chat_history,
            )
            if result.get("text"):
                return {
                    "success": True,
                    "response": result["text"].strip(),
                    "next_state": "project_discussion",
                    "action": "project_info_shared",
                    "context_update": {**context, "projects_shown": True}
                }
        except Exception as e:
            logger.error(f"AI project inquiry failed: {e}")

        # Fallback: show projects as plain text
        if all_projects:
            parts = [f"Here are our projects ({len(all_projects)}):\n"]
            for i, proj in enumerate(all_projects[:5], 1):
                parts.append(f"{i}. *{proj.get('name', 'Project')}*")
                if proj.get("location"):
                    parts.append(f"   Location: {proj['location']}, {proj.get('city', '')}")
                if proj.get("total_units"):
                    parts.append(f"   Units: {proj['total_units']}")
                if proj.get("status"):
                    parts.append(f"   Status: {proj['status']}")
            parts.append(f"\nAvailable properties: {available_count}/{total_count}")
            parts.append("\nWould you like to:")
            parts.append("1. Talk to our expert")
            parts.append("2. Schedule site visit")
            parts.append("3. Get detailed project info")
            parts.append("\n_Reply 1, 2 or 3_")
            return {
                "success": True,
                "response": "\n".join(parts),
                "next_state": "project_discussion",
                "action": "project_info_shared",
                "context_update": {**context, "projects_shown": True}
            }

        return {
            "success": True,
            "response": "We are currently updating our project listings. Which area are you interested in? Our team can share the latest options with you.",
            "next_state": "qualification",
            "action": "no_projects_found",
            "context_update": context
        }

    async def _smart_response_with_knowledge(
        self, message: str, tenant_id: str, lead_id: str, phone: str,
        context: Dict, questions_asked: int, state: str, knowledge_text: str,
        chat_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Smart AI response with full project knowledge.
        Answers questions informationally FIRST, then guides to conversion.
        Falls back to lead capture only after max questions.
        """
        location = context.get("location")
        budget = context.get("budget")
        prop_type = context.get("property_type")

        # If we've asked 3+ questions already, capture and close
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

        # Determine what's missing
        missing = []
        if not location:
            missing.append("location")
        if not prop_type:
            missing.append("property_type")
        if not budget:
            missing.append("budget")

        # Build known info
        known_info = []
        if location:
            known_info.append(f"Location: {location}")
        if context.get("budget_text"):
            known_info.append(f"Budget: {context['budget_text']}")
        if prop_type:
            known_info.append(f"Type: {prop_type}")

        known_str = ", ".join(known_info) if known_info else "Nothing known yet"
        missing_str = ", ".join(missing) if missing else "All info collected"

        # Truncate knowledge for prompt
        k_text = knowledge_text[:2500] if knowledge_text else "No project data available."

        loc_highlights = ""
        if location:
            highlights = get_location_highlights(location)
            if highlights:
                loc_highlights = f"\nLOCATION HIGHLIGHTS for {location}: {highlights}"

        system_prompt = REALAPEX_EXPERT_PROMPT.format(
            knowledge_context=f"\n--- KNOWLEDGE BASE ---\n{k_text}",
            location_highlights=loc_highlights,
            known_info=known_str,
            missing_info=missing_str,
            questions_asked=questions_asked,
        )

        try:
            result = await llm_router.generate(
                system_prompt=system_prompt,
                user_message=message,
                context=context,
                chat_history=chat_history,
            )
            if result.get("text"):
                logger.info(f"LLM response via {result['model']}, cost~${result['cost_estimate']:.6f}, latency={result['latency_ms']}ms")
                return {
                    "success": True,
                    "response": result["text"].strip(),
                    "next_state": "qualification",
                    "action": "lead_qualifying",
                    "context_update": {
                        **context,
                        "questions_asked": questions_asked + 1,
                        "last_asked": missing[0] if missing else None
                    }
                }
        except Exception as e:
            logger.error(f"LLM error in sales engine: {e}")

        # Fallback
        if "location" in missing:
            return {
                "success": True,
                "response": "Which area are you looking for properties?",
                "next_state": "qualification",
                "action": "lead_qualifying",
                "context_update": {**context, "questions_asked": questions_asked + 1}
            }
        elif "budget" in missing:
            return {
                "success": True,
                "response": "What's your budget range?",
                "next_state": "qualification",
                "action": "lead_qualifying",
                "context_update": {**context, "questions_asked": questions_asked + 1}
            }
        elif "property_type" in missing:
            return {
                "success": True,
                "response": "Looking for plots, villa, or flat?",
                "next_state": "qualification",
                "action": "lead_qualifying",
                "context_update": {**context, "questions_asked": questions_asked + 1}
            }
        return {
            "success": True,
            "response": "Thank you! Our expert will call you shortly.",
            "next_state": "qualification",
            "action": "lead_captured",
            "context_update": {**context, "lead_captured": True},
            "human_followup_required": True
        }

    async def _search_db(
        self, tenant_id: str, location: str, budget: Optional[Dict] = None
    ) -> Dict[str, List]:
        """Search projects and properties by location and budget"""
        loc_lower = location.lower()

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

        if not properties and budget:
            properties = await self.db.properties.find(
                {k: v for k, v in prop_query.items() if k != "$and"},
                {"_id": 0}
            ).limit(10).to_list(10)

        return {"projects": projects, "properties": properties}

    async def _format_matches_with_ai(
        self, matches: Dict, location: str, context: Dict, tenant_id: str,
        user_message: str, chat_history: Optional[List[Dict]] = None
    ) -> str:
        """Format matches using AI for a natural, expert response"""
        # Build knowledge context from matches
        knowledge_parts = []
        for proj in matches["projects"][:3]:
            knowledge_parts.append(
                f"Project: {proj.get('name', '')}, Location: {proj.get('location', '')}, "
                f"Status: {proj.get('status', '')}, Units: {proj.get('total_units', '')}, "
                f"RERA: {proj.get('rera_number', 'N/A')}, "
                f"Amenities: {', '.join(proj.get('amenities', [])[:5])}"
            )

        if not matches["projects"]:
            for prop in matches["properties"][:5]:
                price = prop.get("total_price") or prop.get("price", "")
                price_str = f"Rs.{price:,.0f}" if isinstance(price, (int, float)) and price else "Contact"
                knowledge_parts.append(
                    f"Plot #{prop.get('plot_number', prop.get('property_number', 'N/A'))}: "
                    f"Area {prop.get('area_sqft') or prop.get('total_area', 'N/A')} sqft, "
                    f"Facing: {prop.get('facing', 'N/A')}, Price: {price_str}, "
                    f"Status: {prop.get('status', 'Available')}"
                )

        loc_highlights = get_location_highlights(location)

        # Use AI for natural formatting
        try:
            format_prompt = f"""You are RealApex Property Expert. Format this property data as a warm, 
exciting WhatsApp message for a customer looking in {location}.

DATA:
{chr(10).join(knowledge_parts)}

LOCATION HIGHLIGHTS: {loc_highlights if loc_highlights else 'N/A'}

RULES:
- Start with an excited but professional greeting about finding matching properties
- List properties briefly with key details (2-3 lines each)
- Mention location advantages (RRR, Metro, HMDA if applicable)
- End with: "Would you like to:\n1. Talk to our expert\n2. Schedule site visit\n3. Get full project details\n\n_Reply 1, 2 or 3_"
- Keep total message under 15 lines
- Use natural Telugu-English mix if appropriate
- Max 2 emojis"""

            result = await llm_router.generate(
                system_prompt=format_prompt,
                user_message=user_message,
                context=context,
                force_model="gemini",
                chat_history=chat_history,
            )
            if result.get("text"):
                return result["text"]
        except Exception as e:
            logger.warning(f"AI formatting failed, using template: {e}")

        # Fallback: template format
        return self._format_matches_template(matches, location, context)

    def _format_matches_template(
        self, matches: Dict, location: str, context: Dict
    ) -> str:
        """Fallback template formatting"""
        parts = [f"We have properties in {location} matching your requirement!\n"]

        for i, proj in enumerate(matches["projects"][:3], 1):
            name = proj.get("name", "Project")
            loc = proj.get("location", "")
            parts.append(f"{i}. *{name}*")
            if loc:
                parts.append(f"   Location: {loc}")

        if not matches["projects"] and matches["properties"]:
            for i, prop in enumerate(matches["properties"][:3], 1):
                plot_num = prop.get("plot_number", prop.get("property_number", f"Property {i}"))
                area = prop.get("area_sqft") or prop.get("total_area", "")
                price = prop.get("total_price") or prop.get("price", "")
                facing = prop.get("facing", "")
                parts.append(f"{i}. *Plot {plot_num}*")
                if area:
                    parts.append(f"   Area: {area} sqft")
                if price:
                    parts.append(f"   Price: Rs.{price:,.0f}" if isinstance(price, (int, float)) else f"   Price: {price}")
                if facing:
                    parts.append(f"   Facing: {facing}")

        loc_highlights = get_location_highlights(location)
        if loc_highlights:
            parts.append(f"\nLocation Highlights: {loc_highlights}")

        parts.append("\nWould you like to:")
        parts.append("1. Talk to our expert")
        parts.append("2. Schedule site visit")
        parts.append("3. Get full project details")
        parts.append("\n_Reply 1, 2 or 3_")

        return "\n".join(parts)

    async def _handle_option_selection(
        self, option: int, tenant_id: str, lead_id: str, phone: str, context: Dict,
        chat_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        if option == 1:
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
            return {
                "success": True,
                "response": "Great choice! Let's schedule your site visit.\n\nPlease share your preferred date and time.\n\n_Example: Tomorrow 10 AM, Saturday 3 PM_",
                "next_state": "site_visit_offer",
                "action": "site_visit_flow",
                "context_update": {**context, "visit_requested": True}
            }
        elif option == 3:
            location = context.get("location", "")
            matches = await self._search_db(tenant_id, location) if location else {"projects": [], "properties": []}

            # Get full knowledge from RAG
            knowledge = await self.knowledge_retriever.get_project_knowledge(tenant_id)
            knowledge_text = self.knowledge_retriever.format_knowledge_for_llm(knowledge)

            try:
                detail_prompt = f"""You are RealApex Property Expert. A customer asked for full project details about properties in {location}.

KNOWLEDGE BASE:
{knowledge_text[:3000]}

RULES:
- Share project name, location, total units, RERA, key amenities
- Share brochure/layout links if available
- Mention location highlights (RRR, Metro, HMDA)
- Keep it informative but concise (10-15 lines max)
- End with "Would you like to schedule a site visit? Reply 'yes' or '2'"
- Natural, warm tone"""

                result = await llm_router.generate(
                    system_prompt=detail_prompt,
                    user_message=f"Tell me full details about properties in {location}",
                    context=context,
                    chat_history=chat_history,
                )
                if result.get("text"):
                    return {
                        "success": True,
                        "response": result["text"],
                        "next_state": "project_discussion",
                        "action": "details_sent",
                        "context_update": {**context, "details_sent": True}
                    }
            except Exception as e:
                logger.warning(f"AI details generation failed: {e}")

            # Fallback template
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

    async def _update_lead(self, tenant_id: str, lead_id: str, updates: Dict):
        try:
            await self.db.leads.update_one(
                {"tenant_id": tenant_id, "id": lead_id},
                {"$set": {**updates, "updated_at": datetime.now(timezone.utc)}}
            )
        except Exception as e:
            logger.error(f"Failed to update lead: {e}")
