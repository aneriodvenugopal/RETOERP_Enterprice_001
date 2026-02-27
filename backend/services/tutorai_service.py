"""
TutorAI Service - AI Educational Video Generation
Uses Claude for script generation, HeyGen for video creation
"""

import os
import httpx
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Database setup
MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# API Keys
HEYGEN_API_KEY = os.getenv('HEYGEN_API_KEY', '')
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', '')

# HeyGen Avatar Configuration
HEYGEN_AVATARS = {
    "male_teacher": {
        "avatar_id": "josh_lite3_20230714",  # Default male avatar
        "voice_id": {
            "telugu": "te-IN-MohanNeural",
            "hindi": "hi-IN-MadhurNeural", 
            "english": "en-US-DavisNeural"
        }
    },
    "female_teacher": {
        "avatar_id": "anna_costume1_20210906",  # Default female avatar
        "voice_id": {
            "telugu": "te-IN-ShrutiNeural",
            "hindi": "hi-IN-SwaraNeural",
            "english": "en-US-JennyNeural"
        }
    }
}


class TutorAIService:
    """Service for generating educational video content"""
    
    @staticmethod
    async def generate_script(
        concept_name: str,
        class_level: str,
        subject: str,
        language: str
    ) -> Dict[str, Any]:
        """Generate educational video script using Claude"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            prompt = f"""Create a 5-minute {language} video script for {class_level} students on: {concept_name} (Subject: {subject}).

Structure the script exactly like this:
1. HOOK (30 seconds): Start with an engaging question or real-life scenario
2. DEFINITION + ANALOGY (1 minute): Explain the concept simply with a relatable analogy
3. THREE EXAMPLES (2 minutes): Provide 3 clear examples with step-by-step explanations
4. SUMMARY (30 seconds): Recap the key points
5. QUIZ (1 minute): End with 5 multiple choice questions (4 options each, mark correct answer)

Style Guidelines:
- Use simple, friendly language appropriate for {class_level}
- Be exam-focused - mention what's important for exams
- Include memory tricks or mnemonics where helpful
- Use "{language}" language naturally throughout
- Keep sentences short and clear

Output the complete script ready for video narration."""

            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"tutorai-{uuid.uuid4()}",
                system_message="You are an expert educational content creator specializing in creating engaging video scripts for school students."
            ).with_model("anthropic", "claude-sonnet-4-20250514")
            
            user_message = UserMessage(text=prompt)
            script = await chat.send_message(user_message)
            
            return {
                "success": True,
                "script": script,
                "concept_name": concept_name,
                "class_level": class_level,
                "subject": subject,
                "language": language
            }
            
        except Exception as e:
            print(f"❌ Script generation error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def generate_video(
        script: str,
        language: str,
        avatar_style: str,
        concept_name: str,
        class_level: str,
        subject: str
    ) -> Dict[str, Any]:
        """Generate video using HeyGen API"""
        try:
            if not HEYGEN_API_KEY:
                return {"success": False, "error": "HEYGEN_API_KEY not configured"}
            
            avatar_config = HEYGEN_AVATARS.get(avatar_style, HEYGEN_AVATARS["male_teacher"])
            avatar_id = avatar_config["avatar_id"]
            voice_id = avatar_config["voice_id"].get(language.lower(), avatar_config["voice_id"]["english"])
            
            # HeyGen API v2 video generation
            payload = {
                "video_inputs": [{
                    "character": {
                        "type": "avatar",
                        "avatar_id": avatar_id,
                        "avatar_style": "normal"
                    },
                    "voice": {
                        "type": "text",
                        "input_text": script,
                        "voice_id": voice_id
                    }
                }],
                "dimension": {
                    "width": 1280,
                    "height": 720
                },
                "aspect_ratio": "16:9",
                "test": False  # Set to True for testing without consuming credits
            }
            
            headers = {
                "X-Api-Key": HEYGEN_API_KEY,
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=60.0) as http_client:
                response = await http_client.post(
                    "https://api.heygen.com/v2/video/generate",
                    json=payload,
                    headers=headers
                )
                
                print(f"📹 HeyGen Response: {response.status_code} - {response.text[:500]}")
                
                if response.status_code == 200:
                    data = response.json()
                    video_id = data.get("data", {}).get("video_id")
                    
                    if video_id:
                        # Save to MongoDB
                        doc = {
                            "id": str(uuid.uuid4()),
                            "concept_name": concept_name,
                            "class_level": class_level,
                            "subject": subject,
                            "language": language,
                            "avatar_style": avatar_style,
                            "script": script,
                            "heygen_video_id": video_id,
                            "video_url": None,
                            "download_url": None,
                            "pdf_url": None,
                            "status": "processing",
                            "youtube_uploaded": False,
                            "youtube_url": None,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                        await db.tutorai_generated_videos.insert_one(doc)
                        
                        return {
                            "success": True,
                            "video_id": video_id,
                            "doc_id": doc["id"],
                            "status": "processing",
                            "message": "Video generation started"
                        }
                    
                return {
                    "success": False,
                    "error": f"HeyGen API error: {response.text}"
                }
                
        except Exception as e:
            print(f"❌ Video generation error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def check_video_status(heygen_video_id: str) -> Dict[str, Any]:
        """Check video generation status from HeyGen"""
        try:
            if not HEYGEN_API_KEY:
                return {"success": False, "error": "HEYGEN_API_KEY not configured"}
            
            headers = {
                "X-Api-Key": HEYGEN_API_KEY
            }
            
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                response = await http_client.get(
                    f"https://api.heygen.com/v1/video_status.get?video_id={heygen_video_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    video_data = data.get("data", {})
                    status = video_data.get("status", "unknown")
                    
                    result = {
                        "success": True,
                        "status": status,
                        "video_id": heygen_video_id
                    }
                    
                    if status == "completed":
                        video_url = video_data.get("video_url")
                        thumbnail_url = video_data.get("thumbnail_url")
                        duration = video_data.get("duration")
                        
                        result.update({
                            "video_url": video_url,
                            "thumbnail_url": thumbnail_url,
                            "duration": duration,
                            "download_url": video_url
                        })
                        
                        # Update MongoDB
                        await db.tutorai_generated_videos.update_one(
                            {"heygen_video_id": heygen_video_id},
                            {"$set": {
                                "status": "completed",
                                "video_url": video_url,
                                "download_url": video_url,
                                "thumbnail_url": thumbnail_url,
                                "duration": duration,
                                "completed_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                    elif status == "failed":
                        error_msg = video_data.get("error", {}).get("message", "Unknown error")
                        result["error"] = error_msg
                        
                        await db.tutorai_generated_videos.update_one(
                            {"heygen_video_id": heygen_video_id},
                            {"$set": {"status": "failed", "error": error_msg}}
                        )
                    
                    return result
                
                return {
                    "success": False,
                    "error": f"Status check failed: {response.text}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def generate_quiz_pdf(
        script: str,
        concept_name: str,
        class_level: str,
        subject: str,
        language: str
    ) -> Dict[str, Any]:
        """Generate quiz PDF from script using Claude + ReportLab"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.units import inch
            import json
            
            # Extract quiz questions using Claude
            quiz_prompt = f"""From the following educational script, extract exactly 5 multiple choice questions.

Script:
{script}

Return ONLY a JSON array with this exact format (no other text):
[
  {{
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct": "A"
  }}
]

Make sure questions test key concepts from the script."""

            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"quiz-{uuid.uuid4()}",
                system_message="You are a quiz generator. Output only valid JSON."
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            quiz_response = await chat.send_message(UserMessage(text=quiz_prompt))
            
            # Parse JSON from response
            try:
                # Try to find JSON in response
                json_start = quiz_response.find('[')
                json_end = quiz_response.rfind(']') + 1
                if json_start >= 0 and json_end > json_start:
                    quiz_json = quiz_response[json_start:json_end]
                    questions = json.loads(quiz_json)
                else:
                    questions = json.loads(quiz_response)
            except json.JSONDecodeError:
                return {"success": False, "error": "Failed to parse quiz questions"}
            
            # Generate PDF
            pdf_filename = f"quiz_{concept_name.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.pdf"
            pdf_path = f"/tmp/{pdf_filename}"
            
            doc = SimpleDocTemplate(pdf_path, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Title
            title_style = ParagraphStyle(
                'Title',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=20
            )
            story.append(Paragraph(f"Quiz: {concept_name}", title_style))
            story.append(Paragraph(f"Class: {class_level} | Subject: {subject}", styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
            
            # Questions
            for i, q in enumerate(questions, 1):
                story.append(Paragraph(f"<b>Q{i}. {q['question']}</b>", styles['Normal']))
                story.append(Spacer(1, 0.1*inch))
                for opt in q.get('options', []):
                    story.append(Paragraph(f"    {opt}", styles['Normal']))
                story.append(Spacer(1, 0.2*inch))
            
            # Answer key
            story.append(Spacer(1, 0.5*inch))
            story.append(Paragraph("<b>Answer Key:</b>", styles['Heading2']))
            answers = " | ".join([f"Q{i+1}: {q.get('correct', '?')}" for i, q in enumerate(questions)])
            story.append(Paragraph(answers, styles['Normal']))
            
            doc.build(story)
            
            # Return PDF path (would need file serving endpoint)
            return {
                "success": True,
                "pdf_path": pdf_path,
                "pdf_filename": pdf_filename,
                "questions_count": len(questions)
            }
            
        except Exception as e:
            print(f"❌ Quiz PDF generation error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_all_videos(limit: int = 50, skip: int = 0) -> List[Dict]:
        """Get all generated videos"""
        cursor = db.tutorai_generated_videos.find(
            {}, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        videos = await cursor.to_list(length=limit)
        return videos
    
    @staticmethod
    async def update_video(video_id: str, update_data: Dict) -> bool:
        """Update video record (e.g., youtube_uploaded status)"""
        result = await db.tutorai_generated_videos.update_one(
            {"id": video_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    async def process_batch_csv(rows: List[Dict]) -> List[Dict]:
        """Process batch of concepts from CSV"""
        results = []
        
        for row in rows:
            concept_name = row.get('concept_name', '')
            class_level = row.get('class_level', '')
            subject = row.get('subject', '')
            language = row.get('language', 'English')
            
            if not all([concept_name, class_level, subject]):
                results.append({
                    "concept_name": concept_name,
                    "status": "error",
                    "error": "Missing required fields"
                })
                continue
            
            # Generate script first
            script_result = await TutorAIService.generate_script(
                concept_name, class_level, subject, language
            )
            
            if not script_result.get("success"):
                results.append({
                    "concept_name": concept_name,
                    "status": "script_failed",
                    "error": script_result.get("error")
                })
                continue
            
            results.append({
                "concept_name": concept_name,
                "class_level": class_level,
                "subject": subject,
                "language": language,
                "status": "script_ready",
                "script": script_result.get("script")
            })
        
        return results
