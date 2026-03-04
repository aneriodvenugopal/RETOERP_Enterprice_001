"""
RealApex Demo Video API Routes - SaaS Demo Content Generation
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import Response, FileResponse
from typing import Optional, Literal, List
from pydantic import BaseModel
import os
import uuid
import json
import base64

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


class GeneratePresentationRequest(BaseModel):
    concept_title: str
    script: str
    language: str = "english"
    theme: str = "professional"  # professional, modern, minimal
    include_screenshots: bool = True
    screenshot_urls: Optional[List[str]] = []


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



@router.post("/generate-presentation")
async def generate_presentation(
    request: GeneratePresentationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate PowerPoint presentation from script (FREE - python-pptx)"""
    check_admin(current_user)
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        from pptx import Presentation
        from pptx.util import Inches, Pt
        from pptx.dml.color import RGBColor
        from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
        import re
        
        EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', '')
        
        # Step 1: Use Claude to extract slide structure from script
        slide_prompt = f"""Analyze this demo video script and create a PowerPoint presentation structure.

SCRIPT:
{request.script}

Create exactly 6-8 slides for a professional SaaS demo presentation.

Return a JSON array with this exact format (no other text):
[
  {{
    "slide_number": 1,
    "type": "title",
    "title": "Main title text",
    "subtitle": "Subtitle or tagline",
    "notes": "Speaker notes for this slide"
  }},
  {{
    "slide_number": 2,
    "type": "content",
    "title": "Slide title",
    "bullets": ["Point 1", "Point 2", "Point 3"],
    "notes": "Speaker notes"
  }},
  {{
    "slide_number": 3,
    "type": "screenshot",
    "title": "Feature Screenshot",
    "caption": "What this screenshot shows",
    "notes": "Speaker notes"
  }}
]

Slide types: "title", "content", "screenshot", "benefits", "cta"
Include 2-3 "screenshot" type slides where app screenshots should go.
Make content concise - max 4-5 bullet points per slide.
Language: {request.language}"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ppt-{uuid.uuid4()}",
            system_message="You are a presentation designer. Output only valid JSON."
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        response = await chat.send_message(UserMessage(text=slide_prompt))
        
        # Parse JSON from response
        try:
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            if json_start >= 0 and json_end > json_start:
                slides_json = response[json_start:json_end]
                slides_data = json.loads(slides_json)
            else:
                slides_data = json.loads(response)
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            # Fallback to basic structure
            slides_data = [
                {"slide_number": 1, "type": "title", "title": request.concept_title, "subtitle": "RealApex Demo", "notes": ""},
                {"slide_number": 2, "type": "content", "title": "Overview", "bullets": ["Feature overview", "Key benefits", "How it works"], "notes": ""},
                {"slide_number": 3, "type": "screenshot", "title": "Live Demo", "caption": "Application screenshot", "notes": ""},
                {"slide_number": 4, "type": "cta", "title": "Get Started", "bullets": ["Visit RealApex.in", "Request a demo", "Contact us"], "notes": ""}
            ]
        
        # Step 2: Create PowerPoint presentation
        prs = Presentation()
        prs.slide_width = Inches(16)
        prs.slide_height = Inches(9)
        
        # Theme colors based on selection
        themes = {
            "professional": {"bg": RGBColor(15, 23, 42), "accent": RGBColor(249, 115, 22), "text": RGBColor(255, 255, 255)},
            "modern": {"bg": RGBColor(30, 41, 59), "accent": RGBColor(168, 85, 247), "text": RGBColor(255, 255, 255)},
            "minimal": {"bg": RGBColor(255, 255, 255), "accent": RGBColor(59, 130, 246), "text": RGBColor(15, 23, 42)}
        }
        theme = themes.get(request.theme, themes["professional"])
        
        screenshot_index = 0
        
        for slide_info in slides_data:
            slide_type = slide_info.get("type", "content")
            
            # Add blank slide
            blank_layout = prs.slide_layouts[6]  # Blank layout
            slide = prs.slides.add_slide(blank_layout)
            
            # Set background color
            background = slide.background
            fill = background.fill
            fill.solid()
            fill.fore_color.rgb = theme["bg"]
            
            if slide_type == "title":
                # Title slide
                title_box = slide.shapes.add_textbox(Inches(1), Inches(3), Inches(14), Inches(1.5))
                tf = title_box.text_frame
                tf.word_wrap = True
                p = tf.paragraphs[0]
                p.text = slide_info.get("title", "")
                p.font.size = Pt(54)
                p.font.bold = True
                p.font.color.rgb = theme["text"]
                p.alignment = PP_ALIGN.CENTER
                
                if slide_info.get("subtitle"):
                    sub_box = slide.shapes.add_textbox(Inches(1), Inches(4.7), Inches(14), Inches(1))
                    tf2 = sub_box.text_frame
                    p2 = tf2.paragraphs[0]
                    p2.text = slide_info.get("subtitle", "")
                    p2.font.size = Pt(28)
                    p2.font.color.rgb = theme["accent"]
                    p2.alignment = PP_ALIGN.CENTER
                    
            elif slide_type == "screenshot":
                # Screenshot placeholder slide
                title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(15), Inches(1))
                tf = title_box.text_frame
                p = tf.paragraphs[0]
                p.text = slide_info.get("title", "Feature Demo")
                p.font.size = Pt(36)
                p.font.bold = True
                p.font.color.rgb = theme["text"]
                
                # Placeholder for screenshot
                placeholder_box = slide.shapes.add_textbox(Inches(2), Inches(2), Inches(12), Inches(5))
                tf2 = placeholder_box.text_frame
                p2 = tf2.paragraphs[0]
                p2.text = f"📸 Screenshot {screenshot_index + 1}\n\n{slide_info.get('caption', 'Add your app screenshot here')}"
                p2.font.size = Pt(24)
                p2.font.color.rgb = RGBColor(148, 163, 184)
                p2.alignment = PP_ALIGN.CENTER
                
                # Add actual screenshot if provided
                if request.screenshot_urls and screenshot_index < len(request.screenshot_urls):
                    # Note: For actual screenshots, would need to download and embed
                    pass
                
                screenshot_index += 1
                
            elif slide_type in ["content", "benefits"]:
                # Content slide with bullets
                title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(15), Inches(1))
                tf = title_box.text_frame
                p = tf.paragraphs[0]
                p.text = slide_info.get("title", "")
                p.font.size = Pt(40)
                p.font.bold = True
                p.font.color.rgb = theme["text"]
                
                # Bullets
                bullets = slide_info.get("bullets", [])
                if bullets:
                    bullet_box = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(14), Inches(6))
                    tf2 = bullet_box.text_frame
                    tf2.word_wrap = True
                    
                    for i, bullet in enumerate(bullets):
                        if i == 0:
                            p2 = tf2.paragraphs[0]
                        else:
                            p2 = tf2.add_paragraph()
                        p2.text = f"• {bullet}"
                        p2.font.size = Pt(28)
                        p2.font.color.rgb = theme["text"]
                        p2.space_after = Pt(20)
                        
            elif slide_type == "cta":
                # Call to action slide
                title_box = slide.shapes.add_textbox(Inches(1), Inches(2.5), Inches(14), Inches(1.5))
                tf = title_box.text_frame
                p = tf.paragraphs[0]
                p.text = slide_info.get("title", "Get Started Today")
                p.font.size = Pt(48)
                p.font.bold = True
                p.font.color.rgb = theme["accent"]
                p.alignment = PP_ALIGN.CENTER
                
                # CTA details
                bullets = slide_info.get("bullets", ["Visit RealApex.in", "Request a Free Demo"])
                cta_box = slide.shapes.add_textbox(Inches(1), Inches(4.5), Inches(14), Inches(3))
                tf2 = cta_box.text_frame
                for i, bullet in enumerate(bullets):
                    if i == 0:
                        p2 = tf2.paragraphs[0]
                    else:
                        p2 = tf2.add_paragraph()
                    p2.text = bullet
                    p2.font.size = Pt(32)
                    p2.font.color.rgb = theme["text"]
                    p2.alignment = PP_ALIGN.CENTER
                    p2.space_after = Pt(15)
            
            # Add speaker notes
            notes_slide = slide.notes_slide
            notes_slide.notes_text_frame.text = slide_info.get("notes", "")
        
        # Save presentation
        filename = f"presentation_{request.concept_title.replace(' ', '_').replace(':', '')}_{uuid.uuid4().hex[:8]}.pptx"
        filepath = f"/tmp/{filename}"
        prs.save(filepath)
        
        file_size = os.path.getsize(filepath)
        
        print(f"✅ Presentation generated: {filename} ({file_size} bytes, {len(slides_data)} slides)")
        
        return {
            "success": True,
            "filename": filename,
            "filepath": filepath,
            "size_bytes": file_size,
            "slides_count": len(slides_data),
            "download_url": f"/api/realapex-demos/download-presentation/{filename}",
            "slides_structure": slides_data
        }
        
    except Exception as e:
        print(f"❌ Presentation generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-presentation/{filename}")
async def download_presentation(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Download generated PowerPoint presentation"""
    check_admin(current_user)
    
    filepath = f"/tmp/{filename}"
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Presentation file not found")
    
    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=filename
    )


@router.post("/upload-screenshots")
async def upload_screenshots(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload screenshots for presentation"""
    check_admin(current_user)
    
    uploaded_files = []
    
    for file in files:
        if not file.content_type.startswith('image/'):
            continue
            
        # Save file
        file_id = uuid.uuid4().hex[:12]
        filename = f"screenshot_{file_id}_{file.filename}"
        filepath = f"/tmp/{filename}"
        
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        
        uploaded_files.append({
            "filename": filename,
            "filepath": filepath,
            "original_name": file.filename,
            "size": len(content),
            "url": f"/api/realapex-demos/screenshot/{filename}"
        })
    
    return {
        "success": True,
        "uploaded_count": len(uploaded_files),
        "files": uploaded_files
    }


@router.get("/screenshot/{filename}")
async def get_screenshot(filename: str):
    """Get uploaded/generated screenshot - public endpoint for image display"""
    # Made public so images can load in <img> tags without auth headers
    
    filepath = f"/tmp/{filename}"
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    # Determine content type
    if filename.lower().endswith('.png'):
        media_type = "image/png"
    elif filename.lower().endswith(('.jpg', '.jpeg')):
        media_type = "image/jpeg"
    else:
        media_type = "image/png"
    
    return FileResponse(filepath, media_type=media_type)



class AutoGenerateImagesRequest(BaseModel):
    concept_title: str
    script: Optional[str] = ""
    category_name: Optional[str] = ""
    num_images: int = 3


@router.post("/auto-generate-images")
async def auto_generate_images(
    request: AutoGenerateImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Auto-generate relevant images using OpenAI Image Generation (FREE with Emergent Key)"""
    check_admin(current_user)
    
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', '')
        
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
        
        # Generate image prompts based on concept
        image_prompts = []
        
        # Create relevant prompts based on the concept
        base_context = f"Professional SaaS software dashboard screenshot, clean modern UI design, dark theme"
        
        if "layout" in request.concept_title.lower() or "plot" in request.concept_title.lower():
            image_prompts = [
                f"{base_context}, real estate property layout map with colored plots showing available (green), booked (yellow), and sold (red) status, interactive grid view",
                f"{base_context}, property management dashboard showing plot details, pricing information, customer data in a sidebar panel",
                f"{base_context}, mobile-responsive real estate app showing property gallery with images and status indicators"
            ]
        elif "payment" in request.concept_title.lower() or "emi" in request.concept_title.lower() or "fintech" in request.concept_title.lower():
            image_prompts = [
                f"{base_context}, payment dashboard showing EMI schedule, due dates, payment history with charts and graphs",
                f"{base_context}, financial analytics dashboard with revenue graphs, collection reports, payment gateway integration",
                f"{base_context}, customer payment portal showing balance, upcoming payments, receipt download options"
            ]
        elif "lead" in request.concept_title.lower() or "sales" in request.concept_title.lower() or "crm" in request.concept_title.lower():
            image_prompts = [
                f"{base_context}, CRM lead management dashboard showing lead pipeline, conversion funnel, priority scores",
                f"{base_context}, sales analytics dashboard with charts showing lead sources, conversion rates, agent performance",
                f"{base_context}, customer profile page showing contact details, interaction history, follow-up reminders"
            ]
        elif "analytics" in request.concept_title.lower() or "dashboard" in request.concept_title.lower() or "report" in request.concept_title.lower():
            image_prompts = [
                f"{base_context}, executive dashboard with KPI cards, revenue charts, sales metrics, performance indicators",
                f"{base_context}, analytics page with pie charts, bar graphs, trend lines showing business performance",
                f"{base_context}, report generation interface with filters, date range selectors, export options"
            ]
        elif "sms" in request.concept_title.lower() or "whatsapp" in request.concept_title.lower() or "notification" in request.concept_title.lower():
            image_prompts = [
                f"{base_context}, notification center showing SMS templates, WhatsApp messages, delivery status",
                f"{base_context}, messaging dashboard with template editor, recipient list, send history",
                f"{base_context}, communication settings page with channel configuration, automation rules"
            ]
        else:
            # Generic SaaS dashboard prompts
            image_prompts = [
                f"{base_context}, main dashboard overview with key metrics cards, quick action buttons, recent activity feed",
                f"{base_context}, feature showcase screen with step-by-step workflow, highlighted UI elements",
                f"{base_context}, settings and configuration page with form inputs, toggle switches, save buttons"
            ]
        
        # Limit to requested number
        image_prompts = image_prompts[:request.num_images]
        
        # Generate images
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        
        generated_images = []
        
        for i, prompt in enumerate(image_prompts):
            print(f"🎨 Generating image {i+1}/{len(image_prompts)}")
            
            try:
                # generate_images returns List[bytes]
                image_bytes_list = await image_gen.generate_images(
                    prompt=prompt,
                    model="gpt-image-1",
                    number_of_images=1,
                    quality="low"  # Use low for faster generation
                )
                
                if image_bytes_list and len(image_bytes_list) > 0:
                    # Save image to file
                    img_filename = f"generated_img_{uuid.uuid4().hex[:8]}.png"
                    img_filepath = f"/tmp/{img_filename}"
                    
                    with open(img_filepath, "wb") as f:
                        f.write(image_bytes_list[0])
                    
                    generated_images.append({
                        "url": f"/api/realapex-demos/screenshot/{img_filename}",
                        "filename": img_filename,
                        "prompt": prompt[:100],
                        "index": i + 1
                    })
                    print(f"✅ Image {i+1} generated and saved: {img_filename}")
            except Exception as img_error:
                print(f"⚠️ Image {i+1} failed: {str(img_error)}")
                import traceback
                traceback.print_exc()
                continue
        
        return {
            "success": True,
            "images": generated_images,
            "total_requested": request.num_images,
            "total_generated": len(generated_images)
        }
        
    except Exception as e:
        print(f"❌ Auto-generate images error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
