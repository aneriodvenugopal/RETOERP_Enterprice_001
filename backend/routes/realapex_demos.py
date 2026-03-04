"""
RealApex Demo Video API Routes - SaaS Demo Content Generation
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from typing import Optional, Literal
from pydantic import BaseModel
import os
import uuid

router = APIRouter(prefix="/realapex-demos", tags=["RealApex Demos"])

# Import auth middleware
from middleware.auth import get_current_user


# Pydantic Models
class GenerateDemoScriptRequest(BaseModel):
    concept_title: str
    concept_subtitle: Optional[str] = ""
    category_name: Optional[str] = ""
    video_type: str
    video_type_description: Optional[str] = ""
    target_audience: str
    language: str
    custom_notes: Optional[str] = ""


class GenerateVoiceoverRequest(BaseModel):
    script: str
    voice: Literal["alloy", "ash", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"] = "nova"
    speed: float = 1.0
    model: Literal["tts-1", "tts-1-hd"] = "tts-1-hd"
    concept_title: Optional[str] = "voiceover"


# Admin check helper
def check_admin(current_user: dict):
    """Check if user is admin or super_admin"""
    role = current_user.get("role", "")
    if role not in ["admin", "super_admin", "tenant_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return True


@router.post("/generate-script")
async def generate_demo_script(
    request: GenerateDemoScriptRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate RealApex SaaS demo video script using Claude AI"""
    check_admin(current_user)
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import uuid
        
        EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', '')
        
        # Build comprehensive prompt for SaaS demo
        prompt = f"""You are creating a professional YouTube demo video script for RealApex - a PropTech SaaS platform for Indian Real Estate developers and agents.

**VIDEO DETAILS:**
- Feature/Concept: {request.concept_title}
- Feature Description: {request.concept_subtitle}
- Category: {request.category_name}
- Video Type: {request.video_type} ({request.video_type_description})
- Target Audience: {request.target_audience}
- Language: {request.language}
{f"- Additional Notes: {request.custom_notes}" if request.custom_notes else ""}

**SCRIPT STRUCTURE (3-5 minutes video):**

1. **HOOK (15-20 seconds)**
   - Start with a pain point or challenge that {request.target_audience} face
   - Create curiosity about the solution

2. **INTRODUCTION (30 seconds)**
   - Introduce RealApex and this specific feature
   - Explain why this feature matters in 2026's competitive market

3. **FEATURE DEMONSTRATION (2-3 minutes)**
   - Step-by-step walkthrough of the feature
   - Highlight key UI elements and workflows
   - Use phrases like "As you can see on screen..." or "Notice how..."
   - Include specific benefits for {request.target_audience}

4. **KEY BENEFITS (30 seconds)**
   - List 3-4 concrete benefits
   - Include time savings, cost reduction, or efficiency gains
   - Mention ROI or competitive advantage

5. **CALL TO ACTION (20 seconds)**
   - Invite to try RealApex
   - Mention free demo or trial
   - Include website: RealApex.in

**STYLE GUIDELINES:**
- Use {request.language} naturally (if bilingual, mix smoothly)
- Professional but conversational tone
- Include pauses for screen transitions (mark as [PAUSE])
- Use phrases suitable for avatar/TTS narration
- Avoid complex technical jargon - explain simply
- Include enthusiasm appropriate for a product demo

**OUTPUT FORMAT:**
Write the complete script with clear section markers. Include [SCREEN: description] notes for what should appear on screen during that part.

Generate the script now:"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"realapex-demo-{uuid.uuid4()}",
            system_message="You are an expert SaaS product marketing scriptwriter specializing in PropTech and Real Estate software demos for the Indian market."
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        user_message = UserMessage(text=prompt)
        script = await chat.send_message(user_message)
        
        return {
            "success": True,
            "script": script,
            "concept_title": request.concept_title,
            "video_type": request.video_type,
            "target_audience": request.target_audience,
            "language": request.language
        }
        
    except Exception as e:
        print(f"❌ Demo script generation error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/videos")
async def get_demo_videos(
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get all generated RealApex demo videos"""
    check_admin(current_user)
    
    from motor.motor_asyncio import AsyncIOMotorClient
    
    MONGO_URL = os.getenv('MONGO_URL')
    DB_NAME = os.getenv('DB_NAME', 'test_database')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Filter for RealApex Demo videos
    cursor = db.tutorai_generated_videos.find(
        {"subject": "RealApex Demo"}, 
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    videos = await cursor.to_list(length=limit)
    return {"success": True, "videos": videos, "count": len(videos)}


@router.get("/concepts")
async def get_all_concepts(
    current_user: dict = Depends(get_current_user)
):
    """Get all RealApex demo concepts categorized"""
    check_admin(current_user)
    
    # This returns the concept structure for reference
    return {
        "success": True,
        "categories": [
            {
                "id": "proptech_foundation",
                "name": "PropTech Foundation",
                "concepts": ["Digital Property Management", "Smart Layout Mapping", "Multi-Project Portfolio", "Property Gallery & Tours", "Geo-Tagged Locations"]
            },
            {
                "id": "ai_sales_marketing", 
                "name": "AI-Powered Sales & Marketing",
                "concepts": ["AI Lead Scoring", "Automated Follow-ups", "Agent Performance Analytics", "Predictive Forecasting", "AI Video Generation", "Smart Segmentation"]
            },
            {
                "id": "customer_experience",
                "name": "Smart Customer Experience", 
                "concepts": ["Public Layout Portal", "Real-Time Status", "Self-Service Booking", "Payment Dashboard", "Site Visit Scheduling", "Document Center"]
            },
            {
                "id": "fintech_integration",
                "name": "FinTech & Payment Solutions",
                "concepts": ["Multi-Gateway Payments", "EMI Tracking", "Payment Reminders", "Bank Reconciliation", "Digital Receipts", "Revenue Analytics"]
            },
            {
                "id": "compliance_transparency",
                "name": "RERA Compliance & Transparency",
                "concepts": ["DLT SMS Templates", "Legal Document Management", "Booking Audit Trail", "KYC Verification", "Handover Documentation"]
            },
            {
                "id": "omnichannel_communication",
                "name": "Omnichannel Communication",
                "concepts": ["WhatsApp Integration", "SMS Campaigns", "Email Notifications", "Web Push", "In-App Notifications"]
            },
            {
                "id": "analytics_insights",
                "name": "Data Analytics & Insights",
                "concepts": ["Executive Dashboard", "Sales Pipeline", "Agent Reports", "Financial Health", "Customer Behavior", "Market Trends"]
            },
            {
                "id": "operational_efficiency",
                "name": "Operational Efficiency",
                "concepts": ["Role-Based Access", "Calendar Sync", "Workflow Automation", "Bulk Import/Export", "Multi-Branch Management"]
            }
        ]
    }


@router.post("/generate-voiceover")
async def generate_voiceover(
    request: GenerateVoiceoverRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate high-quality voiceover audio using OpenAI TTS (FREE with Emergent Key)"""
    check_admin(current_user)
    
    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        
        EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', '')
        
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
        
        # Clean script - remove [SCREEN:...] and [PAUSE] markers for TTS
        import re
        clean_script = re.sub(r'\[SCREEN:[^\]]*\]', '', request.script)
        clean_script = re.sub(r'\[PAUSE\]', '...', clean_script)
        clean_script = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_script)  # Remove markdown bold
        clean_script = re.sub(r'#{1,6}\s*', '', clean_script)  # Remove markdown headers
        clean_script = clean_script.strip()
        
        # Check text length limit (4096 chars per request)
        if len(clean_script) > 4096:
            # Split into chunks if too long
            chunks = []
            current_chunk = ""
            sentences = clean_script.replace('\n', ' ').split('. ')
            
            for sentence in sentences:
                if len(current_chunk) + len(sentence) + 2 < 4000:
                    current_chunk += sentence + ". "
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + ". "
            if current_chunk:
                chunks.append(current_chunk.strip())
        else:
            chunks = [clean_script]
        
        # Initialize TTS
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        
        # Generate audio for each chunk
        all_audio_bytes = b""
        for i, chunk in enumerate(chunks):
            print(f"🎙️ Generating voiceover chunk {i+1}/{len(chunks)} ({len(chunk)} chars)")
            audio_bytes = await tts.generate_speech(
                text=chunk,
                model=request.model,
                voice=request.voice,
                speed=request.speed,
                response_format="mp3"
            )
            all_audio_bytes += audio_bytes
        
        # Save to temp file
        filename = f"voiceover_{request.concept_title.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.mp3"
        filepath = f"/tmp/{filename}"
        
        with open(filepath, "wb") as f:
            f.write(all_audio_bytes)
        
        print(f"✅ Voiceover generated: {filename} ({len(all_audio_bytes)} bytes)")
        
        return {
            "success": True,
            "filename": filename,
            "filepath": filepath,
            "size_bytes": len(all_audio_bytes),
            "chunks_processed": len(chunks),
            "download_url": f"/api/realapex-demos/download-voiceover/{filename}"
        }
        
    except Exception as e:
        print(f"❌ Voiceover generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-voiceover/{filename}")
async def download_voiceover(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Download generated voiceover MP3 file"""
    check_admin(current_user)
    
    filepath = f"/tmp/{filename}"
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Voiceover file not found")
    
    with open(filepath, "rb") as f:
        audio_bytes = f.read()
    
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/voice-options")
async def get_voice_options(
    current_user: dict = Depends(get_current_user)
):
    """Get available voice options for voiceover generation"""
    check_admin(current_user)
    
    return {
        "success": True,
        "voices": [
            {"id": "alloy", "name": "Alloy", "description": "Neutral, balanced - Good for formal content"},
            {"id": "ash", "name": "Ash", "description": "Clear, articulate - Good for tutorials"},
            {"id": "coral", "name": "Coral", "description": "Warm, friendly - Good for customer-facing"},
            {"id": "echo", "name": "Echo", "description": "Smooth, calm - Good for explainers"},
            {"id": "fable", "name": "Fable", "description": "Expressive, storytelling - Good for narratives"},
            {"id": "nova", "name": "Nova", "description": "Energetic, upbeat - Good for demos (Recommended)"},
            {"id": "onyx", "name": "Onyx", "description": "Deep, authoritative - Good for enterprise"},
            {"id": "sage", "name": "Sage", "description": "Wise, measured - Good for educational"},
            {"id": "shimmer", "name": "Shimmer", "description": "Bright, cheerful - Good for marketing"}
        ],
        "models": [
            {"id": "tts-1", "name": "Standard", "description": "Fast generation, good quality"},
            {"id": "tts-1-hd", "name": "HD Quality", "description": "Slower but higher quality (Recommended)"}
        ],
        "speed_range": {"min": 0.25, "max": 4.0, "default": 1.0}
    }
