"""
Hybrid Advisory Service
Combines: AI insights (50-100 words) + Real location data
Cost: Minimal (max 150 tokens per request)
Speed: Fast (parallel API calls)
"""
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
from pathlib import Path
from services.location_insights_service import location_insights_service
import asyncio

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

class HybridAdvisoryService:
    """
    Ultra-fast, ultra-cheap advisory
    - AI: 50-100 word crispy insights (max 150 tokens)
    - Real Data: Google Places location info
    - Total cost: ~₹0.50-1 per advisory
    """
    
    def __init__(self):
        self.api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found")
    
    async def get_advisory(self, category: str, user_inputs: dict, projects: list) -> str:
        """
        Get hybrid advisory with AI + real data
        """
        
        # Run AI and location insights in parallel for speed
        ai_task = self._get_ai_insights(category, user_inputs, projects)
        location_task = self._get_location_insights(user_inputs)
        
        ai_insights, location_data = await asyncio.gather(ai_task, location_task)
        
        # Combine AI insights with real data
        response = self._format_response(category, user_inputs, ai_insights, location_data, projects)
        
        return response
    
    async def _get_ai_insights(self, category: str, user_inputs: dict, projects: list) -> str:
        """
        Get expert AI analysis - personalized and analytical
        150-200 words for quality insights (still cheap with mini)
        """
        
        try:
            # Analytical prompt with context
            prompt = self._get_analytical_prompt(category, user_inputs, projects)
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"advisory_{category}",
                system_message="You are an experienced real estate consultant. Analyze the client's specific situation and give personalized advice. Be conversational, analytical, and actionable. 150-200 words max. Avoid generic advice - be specific to their inputs."
            ).with_model("openai", "gpt-4o-mini")  # Mini is cheap but smart enough
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Limit to 200 words max for cost control
            words = response.split()
            if len(words) > 200:
                response = ' '.join(words[:200]) + '...'
            
            return response
            
        except Exception as e:
            print(f"AI insights error: {e}")
            return self._get_fallback_insights(category)
    
    def _get_short_prompt(self, category: str, user_inputs: dict, projects: list) -> str:
        """Ultra-short prompts to save tokens"""
        
        if category == "budget":
            budget = user_inputs.get('budget', 'Not specified')
            location = user_inputs.get('location', 'Not specified')
            return f"Budget: {budget}, Location: {location}. Give 3 key tips for property buying. 50 words max."
        
        elif category == "location":
            location = user_inputs.get('location', 'Not specified')
            return f"Location: {location}. Why good for investment? 3 key points. 50 words max."
        
        elif category == "numerology":
            lucky_nums = user_inputs.get('lucky_numbers', 'Not specified')
            return f"Lucky numbers: {lucky_nums}. Property selection tips based on numerology. 50 words max."
        
        elif category == "best_project":
            requirements = user_inputs.get('requirements', 'Quality property')
            return f"Need: {requirements}. Top 3 factors for project selection. 50 words max."
        
        elif category == "investment":
            amount = user_inputs.get('investment_amount', 'Not specified')
            timeline = user_inputs.get('timeline', 'Not specified')
            return f"Investment: {amount}, Timeline: {timeline}. Best strategy? 3 key points. 50 words max."
        
        return "Real estate investment tips. 50 words max."
    
    def _get_fallback_insights(self, category: str) -> str:
        """Fallback insights if AI fails"""
        
        fallbacks = {
            "budget": "Key tips: 1) Compare 3-4 projects before deciding 2) Keep 20-30% ready for down payment + registration 3) Check RERA approval and builder reputation 4) Negotiate for 5-10% discount",
            "location": "Investment factors: 1) Check connectivity (metro, roads) 2) Upcoming infrastructure projects boost value 3) Social amenities (schools, hospitals) matter 4) Research 3-year appreciation history",
            "numerology": "Property selection: 1) Choose flat/plot numbers with your lucky digits 2) Preferred direction entrance matters 3) House number sum should match favorable numbers 4) Consider Vastu along with numerology",
            "best_project": "Selection criteria: 1) RERA registration mandatory 2) Builder track record and on-time delivery 3) Quality of construction materials 4) Compare price per sqft with locality average",
            "investment": "Investment strategy: 1) Diversify across locations if possible 2) Research appreciation potential 3) Check rental yield if planning to rent 4) Keep 6-12 month emergency fund separate"
        }
        
        return fallbacks.get(category, "Contact our experts for personalized guidance on your real estate investment.")
    
    async def _get_location_insights(self, user_inputs: dict) -> dict:
        """Get real location data if location provided"""
        
        location = user_inputs.get('location') or user_inputs.get('work_location')
        
        if not location:
            return None
        
        try:
            return await location_insights_service.get_location_insights(location)
        except:
            return None
    
    def _format_response(self, category: str, user_inputs: dict, ai_insights: str, location_data: dict, projects: list) -> str:
        """Format final response with AI + real data"""
        
        # Category icons and titles
        titles = {
            "budget": "💰 Budget Advisory",
            "location": "📍 Location Analysis",
            "numerology": "🔢 Numerology Guidance",
            "best_project": "⭐ Project Recommendations",
            "investment": "📈 Investment Strategy"
        }
        
        title = titles.get(category, "🏡 Real Estate Advisory")
        
        # Start with user inputs summary
        response = f"**{title}**\n\n"
        response += self._format_user_inputs(category, user_inputs)
        
        # AI Insights (50-100 words)
        response += f"\n\n**💡 Expert Insights:**\n{ai_insights}\n"
        
        # Real location data (if available)
        if location_data and location_data.get('coordinates'):
            location_text = location_insights_service.format_insights_for_advisory(location_data)
            if location_text:
                response += location_text
        
        # Matched projects
        if projects:
            response += self._format_projects(projects, user_inputs.get('location'))
        
        # Call to action
        response += "\n\n**📞 Next Steps:** Talk to our sales team for site visits and detailed project information.\n"
        
        return response
    
    def _format_user_inputs(self, category: str, inputs: dict) -> str:
        """Format user inputs section"""
        
        text = "**Your Requirements:**\n"
        
        if category == "budget":
            text += f"• Budget: {inputs.get('budget', 'Not specified')}\n"
            text += f"• Location: {inputs.get('location', 'Any')}\n"
            text += f"• Property Type: {inputs.get('property_type', 'Any')}\n"
        
        elif category == "location":
            text += f"• Interested Location: {inputs.get('location', 'Not specified')}\n"
            text += f"• Work Location: {inputs.get('work_location', 'Not specified')}\n"
            text += f"• Priorities: {inputs.get('priorities', 'Not specified')}\n"
        
        elif category == "numerology":
            text += f"• Date of Birth: {inputs.get('dob', 'Not provided')}\n"
            text += f"• Lucky Numbers: {inputs.get('lucky_numbers', 'Not specified')}\n"
            text += f"• Preferred Direction: {inputs.get('direction', 'Any')}\n"
        
        elif category == "best_project":
            text += f"• Requirements: {inputs.get('requirements', 'Quality property')}\n"
            text += f"• Timeline: {inputs.get('timeline', 'Flexible')}\n"
            text += f"• Priorities: {inputs.get('priorities', 'Investment value')}\n"
        
        elif category == "investment":
            text += f"• Investment Amount: {inputs.get('investment_amount', 'Not specified')}\n"
            text += f"• Timeline: {inputs.get('timeline', 'Not specified')}\n"
            text += f"• Expected ROI: {inputs.get('roi_expectations', 'Market standard')}\n"
        
        # Add description if provided
        description = inputs.get('description', '').strip()
        if description:
            text += f"• Additional Details: {description}\n"
        
        return text
    
    def _format_projects(self, projects: list, location: str = None) -> str:
        """Format projects section"""
        
        if not projects:
            return ""
        
        # Filter by location if provided
        if location:
            location_lower = location.lower()
            matched = [p for p in projects if location_lower in str(p.get('location', '')).lower()]
            if matched:
                projects = matched
        
        text = "\n\n**🏘️ Available Projects:**\n"
        
        for i, project in enumerate(projects[:3], 1):
            text += f"{i}. **{project.get('name', 'Project')}**"
            if project.get('location'):
                text += f" - {project.get('location')}"
            if project.get('property_count'):
                text += f" ({project.get('property_count')} units)"
            text += "\n"
        
        if len(projects) > 3:
            text += f"\n*+{len(projects) - 3} more projects available*\n"
        
        return text

# Singleton
hybrid_advisory_service = HybridAdvisoryService()
