"""
AI Chatbot Service using OpenAI GPT-5 via Emergent LLM Key
Handles intelligent conversations, lead capture, and multi-language support
"""
import os
from typing import List, Dict, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()


class ChatbotService:
    """AI-powered chatbot service"""
    
    def __init__(self, 
                 tenant_id: Optional[str] = None,
                 system_prompt: Optional[str] = None,
                 use_custom_key: bool = False,
                 custom_api_key: Optional[str] = None):
        """
        Initialize chatbot service
        
        Args:
            tenant_id: Tenant ID for tenant-specific bot
            system_prompt: Custom system prompt for bot personality
            use_custom_key: Whether to use tenant's own API key
            custom_api_key: Tenant's OpenAI API key
        """
        self.tenant_id = tenant_id
        
        # Determine which API key to use
        if use_custom_key and custom_api_key:
            self.api_key = custom_api_key
        else:
            self.api_key = os.getenv('EMERGENT_LLM_KEY')
        
        # Default system prompt for real estate assistant
        self.default_system_prompt = """You are a helpful and friendly real estate assistant for RETOERP platform.

Your goals:
1. Help customers find their perfect property
2. Answer questions about real estate, projects, and properties
3. Naturally capture lead information (name, phone, email) during conversation
4. Provide helpful information about buying, investing, or renting properties

Guidelines:
- Be warm, professional, and conversational
- Ask clarifying questions to understand customer needs
- When appropriate, ask for contact details naturally (e.g., "I'd love to send you more details. May I have your name and phone number?")
- Support both English and Telugu languages
- Keep responses concise and helpful
- If asked about specific properties or projects, encourage them to share contact details for personalized assistance

Remember: You're here to help customers and capture quality leads for the sales team."""
        
        self.system_prompt = system_prompt or self.default_system_prompt
    
    
    async def send_message(self, 
                          conversation_id: str,
                          user_message: str,
                          conversation_history: List[Dict[str, str]] = None,
                          user_context: Optional[Dict] = None) -> str:
        """
        Send message to AI and get response
        
        Args:
            conversation_id: Unique conversation ID
            user_message: User's message text
            conversation_history: Previous messages [{"role": "user"/"assistant", "content": "..."}]
            user_context: Additional context (name, phone, interest, etc.)
        
        Returns:
            AI assistant's response
        """
        try:
            # Enhance system prompt with user context if available
            enhanced_system_prompt = self.system_prompt
            if user_context:
                context_info = []
                if user_context.get('name'):
                    context_info.append(f"Customer name: {user_context['name']}")
                if user_context.get('phone'):
                    context_info.append(f"Phone: {user_context['phone']}")
                if user_context.get('interest'):
                    context_info.append(f"Interested in: {user_context['interest']}")
                
                if context_info:
                    enhanced_system_prompt += "\n\nCustomer Context:\n" + "\n".join(context_info)
            
            # Initialize LLM chat
            chat = LlmChat(
                api_key=self.api_key,
                session_id=conversation_id,
                system_message=enhanced_system_prompt
            ).with_model("openai", "gpt-5")
            
            # If we have conversation history, we need to manually build context
            # Note: emergentintegrations manages session history internally,
            # but we can prepend history if needed
            
            # Create user message
            message = UserMessage(text=user_message)
            
            # Send message and get response
            response = await chat.send_message(message)
            
            return response
            
        except Exception as e:
            print(f"Error in chatbot service: {str(e)}")
            # Fallback response
            return "I apologize, but I'm having trouble processing your message right now. Please try again in a moment, or feel free to contact our team directly."
    
    
    def should_capture_lead(self, user_message: str, assistant_response: str) -> bool:
        """
        Determine if the conversation indicates lead information was shared
        
        Args:
            user_message: User's message
            assistant_response: AI's response
        
        Returns:
            Boolean indicating if lead capture should be triggered
        """
        # Check if user message contains phone number or email patterns
        import re
        
        # Phone pattern (Indian numbers)
        phone_pattern = r'\b[6-9]\d{9}\b'
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        has_phone = bool(re.search(phone_pattern, user_message))
        has_email = bool(re.search(email_pattern, user_message))
        
        return has_phone or has_email
    
    
    def extract_contact_info(self, message: str) -> Dict[str, Optional[str]]:
        """
        Extract contact information from message
        
        Args:
            message: Message text
        
        Returns:
            Dict with extracted name, phone, email
        """
        import re
        
        result = {
            'name': None,
            'phone': None,
            'email': None
        }
        
        # Extract phone number (Indian format)
        phone_pattern = r'\b([6-9]\d{9})\b'
        phone_match = re.search(phone_pattern, message)
        if phone_match:
            result['phone'] = phone_match.group(1)
        
        # Extract email
        email_pattern = r'\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b'
        email_match = re.search(email_pattern, message)
        if email_match:
            result['email'] = email_match.group(1)
        
        # Name extraction is complex, so we'll let the frontend handle it
        # or ask explicitly in the next message
        
        return result
    
    
    def detect_language(self, text: str) -> str:
        """
        Detect language of text (simple heuristic)
        
        Args:
            text: Text to detect language
        
        Returns:
            Language code: 'en', 'te', 'hi'
        """
        # Simple Telugu unicode range detection
        telugu_chars = sum(1 for char in text if '\u0C00' <= char <= '\u0C7F')
        
        # Simple Hindi/Devanagari unicode range detection
        hindi_chars = sum(1 for char in text if '\u0900' <= char <= '\u097F')
        
        total_chars = len(text.replace(' ', ''))
        
        if total_chars > 0:
            telugu_ratio = telugu_chars / total_chars
            hindi_ratio = hindi_chars / total_chars
            
            if telugu_ratio > 0.3:
                return 'te'
            elif hindi_ratio > 0.3:
                return 'hi'
        
        return 'en'
