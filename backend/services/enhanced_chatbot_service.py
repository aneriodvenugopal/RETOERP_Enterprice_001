"""
Enhanced RETOERP Chatbot Service
Complete conversation flow with lead capture, verification, advisory, and scheduling
100% FREE for all users
"""
import os
import random
import re
from typing import Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class EnhancedChatbotService:
    """
    Smart chatbot with complete conversation flow:
    1. Feature guidance (free)
    2. Requirement gathering
    3. Feedback collection
    4. Contact information capture
    5. Mobile verification (OTP)
    6. Instant advisory
    7. Expert appointment scheduling
    """
    
    def __init__(self):
        self.conversation_states = {}
    
    async def chat(self, 
                   conversation_id: str,
                   user_message: str,
                   conversation_history: List[Dict] = None,
                   user_context: Dict = None) -> Dict:
        """
        Main chat function with intelligent flow
        
        Returns:
            {
                "message": str,
                "action": str,  # "continue", "send_otp", "verify_otp", "show_advisory", "schedule_appointment"
                "data": dict
            }
        """
        
        msg = user_message.lower().strip()
        
        # Get current conversation state
        state = self.conversation_states.get(conversation_id, {
            "stage": "initial",
            "user_data": {},
            "requirements": {},
            "feedback": None,
            "verified": False
        })
        
        # Stage 1: Initial greeting & feature guidance
        if state["stage"] == "initial":
            return await self._handle_initial_stage(msg, conversation_id, state)
        
        # Stage 2: Requirement gathering
        elif state["stage"] == "gathering_requirements":
            return await self._handle_requirements_stage(msg, conversation_id, state)
        
        # Stage 3: Feedback collection
        elif state["stage"] == "collecting_feedback":
            return await self._handle_feedback_stage(msg, conversation_id, state)
        
        # Stage 4: Contact information
        elif state["stage"] == "requesting_contact":
            return await self._handle_contact_stage(msg, conversation_id, state)
        
        # Stage 5: OTP verification
        elif state["stage"] == "verifying_otp":
            return await self._handle_otp_stage(msg, conversation_id, state)
        
        # Stage 6: Provide advisory
        elif state["stage"] == "providing_advisory":
            return await self._handle_advisory_stage(msg, conversation_id, state)
        
        # Stage 7: Schedule expert call
        elif state["stage"] == "scheduling_call":
            return await self._handle_scheduling_stage(msg, conversation_id, state)
        
        # Default: Answer questions
        return await self._handle_general_query(msg, conversation_id, state)
    
    async def _handle_initial_stage(self, msg: str, conv_id: str, state: Dict) -> Dict:
        """Stage 1: Greet and offer help"""
        
        # Check if asking about features
        if any(word in msg for word in ["feature", "what can", "help", "how does", "what is"]):
            response = """Hello! 👋 I'm your RETOERP Assistant!

I can help you with:

🏠 **Property Management** - Browse projects, layouts, availability
💰 **Payment Tracking** - Check payment schedules, EMI plans
📊 **Analytics Dashboard** - Real-time business insights
👥 **Lead Management** - Never miss a customer
📱 **Mobile App** - Manage on-the-go
🤖 **AI Advisory** - Get expert property advice

What would you like to know about?"""
            
            state["stage"] = "gathering_requirements"
            self.conversation_states[conv_id] = state
            
            return {
                "message": response,
                "action": "continue",
                "data": {}
            }
        
        # Default greeting
        response = """Hello! 👋 Welcome to RETOERP!

I'm here to help you explore our real estate ERP platform.

Would you like to:
1️⃣ Learn about our features
2️⃣ Get property advisory
3️⃣ See how we can help your business

What interests you?"""
        
        state["stage"] = "gathering_requirements"
        self.conversation_states[conv_id] = state
        
        return {
            "message": response,
            "action": "continue",
            "data": {}
        }
    
    async def _handle_requirements_stage(self, msg: str, conv_id: str, state: Dict) -> Dict:
        """Stage 2: Gather requirements"""
        
        # Save requirement
        if "requirements" not in state:
            state["requirements"] = {}
        
        state["requirements"]["user_query"] = msg
        
        # Check what they're interested in
        if any(word in msg for word in ["property", "buy", "invest", "flat", "plot", "villa"]):
            response = """Great! I can help you with property advisory. 🏡

Before we proceed, I'd love to understand your needs better:

• What's your budget range?
• Preferred location?
• Looking for residential or commercial?

Feel free to share any specific requirements!"""
            
            state["stage"] = "collecting_feedback"
            
        elif any(word in msg for word in ["business", "company", "manage", "crm", "erp"]):
            response = """Perfect! RETOERP can streamline your real estate business. 📈

We'd love to show you how we can help!

Quick question - What's the biggest challenge you face in your business right now?
• Lead management?
• Payment tracking?
• Team coordination?
• Reporting?"""
            
            state["stage"] = "collecting_feedback"
        
        else:
            response = f"""Got it! You're interested in: {msg}

That's great! We have comprehensive solutions for that.

Before I provide detailed information, may I know:
• Are you a real estate professional or a property buyer?
• What specific information would help you most?"""
            
            state["stage"] = "collecting_feedback"
        
        self.conversation_states[conv_id] = state
        
        return {
            "message": response,
            "action": "continue",
            "data": {}
        }
    
    async def _handle_feedback_stage(self, msg: str, conv_id: str, state: Dict) -> Dict:
        """Stage 3: Collect feedback and request contact"""
        
        state["feedback"] = msg
        
        response = """Thank you for sharing! 😊

I have some great insights and recommendations for you.

To provide personalized assistance and keep you updated, could you please share:

📱 **Your mobile number**
📧 **Your name** (optional)

Don't worry - we respect your privacy and will only use this to help you better!"""
        
        state["stage"] = "requesting_contact"
        self.conversation_states[conv_id] = state
        
        return {
            "message": response,
            "action": "continue",
            "data": {}
        }
    
    async def _handle_contact_stage(self, msg: str, conv_id: str, state: Dict) -> Dict:
        """Stage 4: Extract and verify contact information"""
        
        # Extract phone number
        phone_match = re.search(r'\b[6-9]\d{9}\b', msg)
        
        if phone_match:
            phone = phone_match.group()
            state["user_data"]["phone"] = phone
            
            # Extract name if provided
            words = msg.split()
            potential_name = " ".join([w for w in words if not w.isdigit() and len(w) > 2])
            if potential_name:
                state["user_data"]["name"] = potential_name.strip()
            
            # Generate OTP
            otp = str(random.randint(100000, 999999))
            state["otp"] = otp
            state["otp_verified"] = False
            
            name_part = f"{state['user_data'].get('name', 'there')}, " if state['user_data'].get('name') else ""
            
            response = f"""Perfect! {name_part}Thank you! 🎉

I've sent a verification code to **{phone}**.

**OTP: {otp}** (Demo mode - showing OTP directly)

Please enter the 6-digit OTP to verify your number."""
            
            state["stage"] = "verifying_otp"
            self.conversation_states[conv_id] = state
            
            return {
                "message": response,
                "action": "send_otp",
                "data": {
                    "phone": phone,
                    "otp": otp,
                    "name": state["user_data"].get("name")
                }
            }
        else:
            response = """I couldn't find a valid mobile number. 📱

Please share your 10-digit mobile number.

Example: 9876543210"""
            
            return {
                "message": response,
                "action": "continue",
                "data": {}
            }
    
    async def _handle_otp_stage(self, msg: str, conv_id: str, state: Dict) -> Dict:
        """Stage 5: Verify OTP"""
        
        # Extract OTP from message
        otp_match = re.search(r'\b\d{6}\b', msg)
        
        if otp_match:
            entered_otp = otp_match.group()
            
            if entered_otp == state.get("otp"):
                state["otp_verified"] = True
                state["verified_at"] = datetime.now().isoformat()
                
                name_part = f"{state['user_data'].get('name', 'there')}, " if state['user_data'].get('name') else ""
                
                response = f"""✅ **Verified Successfully!** {name_part}

Great news! I can now provide you with:

1️⃣ **Instant Advisory** - Based on your requirements
2️⃣ **Personalized Consultation** - Schedule a call with our experts

Would you like to:
• Get instant advisory now (type "advisory")
• Schedule a call with our expert (type "schedule")
• Both (type "both")"""
                
                state["stage"] = "providing_advisory"
                self.conversation_states[conv_id] = state
                
                return {
                    "message": response,
                    "action": "verify_otp",
                    "data": {
                        "verified": True,
                        "user_data": state["user_data"]
                    }
                }
            else:
                response = f"""❌ Invalid OTP!

The code you entered doesn't match. Please try again.

Expected: {state.get('otp')}
(Demo mode - showing correct OTP)"""
                
                return {
                    "message": response,
                    "action": "continue",
                    "data": {"verified": False}
                }
        else:
            response = """Please enter the 6-digit OTP sent to your mobile number.

Example: 123456"""
            
            return {
                "message": response,
                "action": "continue",
                "data": {}
            }
    
    async def _handle_advisory_stage(self, msg: str, conv_id: str, state: Dict) -> Dict:
        """Stage 6: Provide advisory or move to scheduling"""
        
        if "advisory" in msg.lower() or "both" in msg.lower():
            # Trigger advisory (will be handled by frontend to call advisory API)
            response = f"""📊 **Preparing Your Advisory...**

Based on your requirements:
• {state.get('requirements', {}).get('user_query', 'Property search')}
• Budget and location preferences

I'll generate a detailed advisory for you now!

*(This will open the advisory form with your details pre-filled)*"""
            
            if "both" in msg.lower():
                state["stage"] = "scheduling_call"
                response += "\n\nAfter reviewing the advisory, we can schedule an expert call!"
            
            self.conversation_states[conv_id] = state
            
            return {
                "message": response,
                "action": "show_advisory",
                "data": {
                    "requirements": state.get("requirements"),
                    "user_data": state.get("user_data")
                }
            }
        
        elif "schedule" in msg.lower() or "call" in msg.lower() or "both" in msg.lower():
            response = """📞 **Schedule Expert Consultation**

Our property experts are ready to help you!

Please share your preferred:

🗓️ **Date** (e.g., 15 December or Tomorrow)
⏰ **Time** (e.g., 3 PM or Evening)
📝 **Any special request?** (Optional)

Example: "Tomorrow at 3 PM, want to discuss budget options"

"""
            
            state["stage"] = "scheduling_call"
            self.conversation_states[conv_id] = state
            
            return {
                "message": response,
                "action": "continue",
                "data": {}
            }
        
        else:
            response = """I can help you with:

1️⃣ **Instant Advisory** - Get property recommendations now
2️⃣ **Expert Call** - Speak with our consultants

What would you prefer?"""
            
            return {
                "message": response,
                "action": "continue",
                "data": {}
            }
    
    async def _handle_scheduling_stage(self, msg: str, conv_id: str, state: Dict) -> Dict:
        """Stage 7: Schedule expert appointment"""
        
        # Extract date and time from message
        schedule_info = {
            "raw_request": msg,
            "date": "Not specified",
            "time": "Not specified",
            "special_request": ""
        }
        
        # Simple date extraction
        if any(word in msg.lower() for word in ["tomorrow", "today", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]):
            words = msg.lower().split()
            for word in words:
                if word in ["tomorrow", "today", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
                    schedule_info["date"] = word.capitalize()
                    break
        
        # Simple time extraction
        time_match = re.search(r'\b(\d{1,2})\s*(am|pm|AM|PM)\b', msg)
        if time_match:
            schedule_info["time"] = time_match.group()
        elif any(word in msg.lower() for word in ["morning", "afternoon", "evening", "night"]):
            for word in ["morning", "afternoon", "evening", "night"]:
                if word in msg.lower():
                    schedule_info["time"] = word.capitalize()
                    break
        
        # Extract special request
        schedule_info["special_request"] = msg
        
        state["appointment"] = schedule_info
        state["stage"] = "completed"
        self.conversation_states[conv_id] = state
        
        name = state["user_data"].get("name", "there")
        phone = state["user_data"].get("phone", "your number")
        
        response = f"""✅ **Appointment Scheduled!**

Thank you, {name}! Your consultation is booked.

📋 **Details:**
• 📅 Date: {schedule_info['date']}
• ⏰ Time: {schedule_info['time']}
• 📱 Contact: {phone}
• 📝 Request: {schedule_info['special_request'][:100]}

**What happens next:**
1. Our expert will review your requirements
2. You'll receive a confirmation call
3. We'll contact you at your preferred time

**You can also:**
• Get instant advisory (type "advisory")
• Ask any questions (I'm here to help!)

Looking forward to helping you find your perfect property! 🏡"""
        
        return {
            "message": response,
            "action": "schedule_appointment",
            "data": {
                "appointment": schedule_info,
                "user_data": state["user_data"],
                "requirements": state.get("requirements")
            }
        }
    
    async def _handle_general_query(self, msg: str, conv_id: str, state: Dict) -> Dict:
        """Handle general questions at any stage"""
        
        # Feature questions
        if any(word in msg for word in ["feature", "what can", "how does", "price", "cost"]):
            response = """RETOERP offers comprehensive features:

🏠 **Property Management** - Visual layouts, availability tracking
💰 **Payment Automation** - Razorpay/Stripe integration
📊 **Analytics** - Real-time BI dashboards
👥 **CRM** - Smart lead management
📱 **Mobile App** - iOS & Android PWA
🤖 **AI Advisory** - Property recommendations

Want to know more about any specific feature?"""
            
        else:
            response = """I'm here to help! You can ask me about:

• RETOERP features and pricing
• Property advisory
• Scheduling an expert call
• How our platform works

What would you like to know?"""
        
        return {
            "message": response,
            "action": "continue",
            "data": {}
        }

# Singleton
enhanced_chatbot = EnhancedChatbotService()
