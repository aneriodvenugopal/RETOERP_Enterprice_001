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
    
    def _get_analytical_prompt(self, category: str, user_inputs: dict, projects: list) -> str:
        """Analytical prompts that ask AI to actually think about the case"""
        
        if category == "budget":
            budget = user_inputs.get('budget', 'Not specified')
            location = user_inputs.get('location', 'Not specified')
            prop_type = user_inputs.get('property_type', 'Any')
            description = user_inputs.get('description', '')
            
            # Build context about available projects
            project_context = ""
            if projects:
                matching = [p for p in projects if location.lower() in str(p.get('location', '')).lower()][:2]
                if matching:
                    project_context = f"\n\nAvailable projects: {', '.join([p.get('name', 'Project') for p in matching])} in {location}."
            
            prompt = f"""Analyze this property buyer's situation:
- Budget: {budget}
- Preferred Location: {location}
- Property Type: {prop_type}"""
            
            if description:
                prompt += f"\n- Additional Context: {description}"
            
            prompt += project_context
            
            prompt += f"""

Based on this, provide your expert analysis:
1. Is this budget realistic for {location}? What can they expect?
2. Specific financial strategy (down payment, loan, hidden costs)
3. What to prioritize in their search given their budget and location
4. One critical thing they might be missing

Be specific to their {budget} budget and {location} location. Conversational tone."""
            
            return prompt
        
        elif category == "location":
            location = user_inputs.get('location', 'Not specified')
            work_location = user_inputs.get('work_location', 'Not specified')
            priorities = user_inputs.get('priorities', 'Not specified')
            description = user_inputs.get('description', '')
            
            prompt = f"""Analyze this location choice for a property buyer:
- Interested Location: {location}
- They work at: {work_location}
- Priorities: {priorities}"""
            
            if description:
                prompt += f"\n- Additional Context: {description}"
            
            prompt += f"""

Provide expert analysis:
1. Is {location} smart choice given they work at {work_location}? Commute reality?
2. Current market status in {location} - hot or cooling?
3. 3-5 year outlook - will their investment appreciate?
4. Hidden factors about {location} they should know
5. Better alternatives if any?

Be honest and specific. Don't sugarcoat if location has issues."""
            
            return prompt
        
        elif category == "numerology":
            dob = user_inputs.get('dob', 'Not provided')
            lucky_nums = user_inputs.get('lucky_numbers', 'Not specified')
            direction = user_inputs.get('direction', 'Any')
            description = user_inputs.get('description', '')
            
            prompt = f"""Client seeking numerology guidance for property:
- Date of Birth: {dob}
- Lucky Numbers: {lucky_nums}
- Preferred Direction: {direction}"""
            
            if description:
                prompt += f"\n- Additional Context: {description}"
            
            prompt += f"""

Provide numerological analysis:
1. Based on {dob}, what's their life path number and its property significance?
2. How to practically use lucky numbers {lucky_nums} in property selection?
3. {direction} direction - is it compatible with their numerology?
4. Timing - is current period auspicious for them to buy?
5. One practical tip to balance numerology with real estate reality

Blend mystical with practical advice."""
            
            return prompt
        
        elif category == "best_project":
            requirements = user_inputs.get('requirements', 'Quality property')
            timeline = user_inputs.get('timeline', 'Flexible')
            priorities = user_inputs.get('priorities', 'Investment value')
            description = user_inputs.get('description', '')
            
            # Get actual project data
            project_context = ""
            if projects:
                top_projects = projects[:3]
                project_context = f"\n\nAvailable options: " + ", ".join([
                    f"{p.get('name', 'Project')} ({p.get('location', 'Location')})"
                    for p in top_projects
                ])
            
            prompt = f"""Client seeking best project recommendation:
- Requirements: {requirements}
- Timeline: {timeline}
- Priorities: {priorities}"""
            
            if description:
                prompt += f"\n- Additional Context: {description}"
            
            prompt += project_context
            
            prompt += f"""

Provide project selection analysis:
1. Given their '{requirements}' need and '{timeline}' timeline - what type of project suits?
2. Red flags to watch for when evaluating projects
3. How to verify builder credibility (specific steps)
4. Price negotiation strategy - how much discount realistic?
5. One insider tip for getting best deal

Be practical and specific to their timeline and priorities."""
            
            return prompt
        
        elif category == "investment":
            amount = user_inputs.get('investment_amount', 'Not specified')
            timeline = user_inputs.get('timeline', 'Not specified')
            roi = user_inputs.get('roi_expectations', 'Market standard')
            description = user_inputs.get('description', '')
            
            prompt = f"""Analyze this real estate investment plan:
- Investment Amount: {amount}
- Investment Timeline: {timeline}
- ROI Expectation: {roi}"""
            
            if description:
                prompt += f"\n- Additional Context: {description}"
            
            prompt += f"""

Provide investment analysis:
1. Is {roi} expectation realistic for {timeline}? Be honest.
2. Best strategy given their {amount} and {timeline}
3. Biggest risk they're not considering
4. Tax optimization specific to their case
5. Exit strategy - when and how to book profits

Be specific to their {amount} investment and {timeline}. Include current market reality."""
            
            return prompt
        
        # Generic fallback
        return f"Analyze this client's real estate situation and provide specific, actionable advice in 150-200 words: {user_inputs}"
    
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
        """Format final response - conversational, not template-like"""
        
        # Category icons and titles
        titles = {
            "budget": "💰 Your Budget Analysis",
            "location": "📍 Location Deep-Dive",
            "numerology": "🔢 Your Numerology Profile",
            "best_project": "⭐ Project Selection Guide",
            "investment": "📈 Investment Breakdown"
        }
        
        title = titles.get(category, "🏡 Your Property Advisory")
        
        # Start conversationally
        response = f"**{title}**\n\n"
        
        # Quick summary of their situation (conversational)
        response += self._format_situation_summary(category, user_inputs)
        
        # AI Expert Analysis (main content - 150-200 words)
        response += f"\n\n**📊 Our Analysis:**\n\n{ai_insights}\n"
        
        # Real location data (if available) - positioned as "Ground Reality"
        if location_data and location_data.get('coordinates'):
            location_text = location_insights_service.format_insights_for_advisory(location_data)
            if location_text:
                response += f"\n**🔍 Ground Reality - What's Actually There:**\n"
                response += location_text
        
        # Available projects - positioned as "Your Options"
        if projects:
            response += self._format_projects(projects, user_inputs.get('location'))
        
        # Personal call to action
        response += "\n\n**💬 Want to discuss this further?** Our property consultants are available to dive deeper into your specific situation.\n"
        
        return response
    
    def _format_situation_summary(self, category: str, inputs: dict) -> str:
        """Format situation summary - conversational style"""
        
        if category == "budget":
            budget = inputs.get('budget', 'your budget')
            location = inputs.get('location', 'preferred location')
            prop_type = inputs.get('property_type', 'property')
            text = f"Looking for a **{prop_type}** in **{location}** with a budget of **{budget}**"
            
        elif category == "location":
            location = inputs.get('location', 'location')
            work_loc = inputs.get('work_location', 'work location')
            text = f"Evaluating **{location}** as a potential location (commuting from **{work_loc}**)"
            
        elif category == "numerology":
            dob = inputs.get('dob', 'your birth date')
            lucky = inputs.get('lucky_numbers', 'your lucky numbers')
            text = f"Birth date: **{dob}**, Lucky numbers: **{lucky}**"
            
        elif category == "best_project":
            reqs = inputs.get('requirements', 'quality property')
            timeline = inputs.get('timeline', 'flexible timeline')
            text = f"Searching for: **{reqs}** with **{timeline}**"
            
        elif category == "investment":
            amount = inputs.get('investment_amount', 'investment amount')
            timeline = inputs.get('timeline', 'investment horizon')
            text = f"Planning to invest **{amount}** with **{timeline}**"
        
        else:
            return ""
        
        # Add description if provided
        description = inputs.get('description', '').strip()
        if description:
            text += f"\n\n*Your note: \"{description}\"*"
        
        return text
    
    def _format_projects(self, projects: list, location: str = None) -> str:
        """Format projects section - conversational"""
        
        if not projects:
            return ""
        
        # Filter by location if provided
        if location:
            location_lower = location.lower()
            matched = [p for p in projects if location_lower in str(p.get('location', '')).lower()]
            if matched:
                projects = matched
        
        if not projects:
            return ""
        
        text = "\n\n**🏘️ Projects Worth Checking Out:**\n\n"
        
        for i, project in enumerate(projects[:3], 1):
            text += f"**{i}. {project.get('name', 'Project')}**"
            if project.get('location'):
                text += f" • {project.get('location')}"
            if project.get('property_count'):
                text += f" • {project.get('property_count')} units available"
            text += "\n"
        
        if len(projects) > 3:
            text += f"\n*Plus {len(projects) - 3} more options we can show you*\n"
        
        return text

# Singleton
hybrid_advisory_service = HybridAdvisoryService()
