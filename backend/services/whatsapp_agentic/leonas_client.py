"""
Leonas WhatsApp BSP Client
Handles sending and receiving WhatsApp messages via Leonas API
"""

import os
import httpx
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
from dotenv import load_dotenv
import json

load_dotenv()


class LeonasWhatsAppClient:
    """
    Client for Leonas WhatsApp Business API
    https://wapp.leonas.in/
    """
    
    def __init__(self):
        self.base_url = os.getenv("LEONAS_API_URL", "https://wapp.leonas.in/api")
        self.api_key = os.getenv("LEONAS_API_KEY", "")
        self.sender_id = os.getenv("LEONAS_SENDER_ID", "")
        self.timeout = 30
        
    async def send_text_message(
        self, 
        phone: str, 
        message: str,
        tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a text message via WhatsApp
        
        Args:
            phone: Recipient phone number (with country code)
            message: Message text
            tenant_id: For logging purposes
            
        Returns:
            API response dict
        """
        # Normalize phone number
        phone = self._normalize_phone(phone)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/send-message",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "phone": phone,
                        "message": message,
                        "sender_id": self.sender_id
                    }
                )
                
                result = response.json() if response.status_code == 200 else {}
                
                return {
                    "success": response.status_code == 200,
                    "status_code": response.status_code,
                    "message_id": result.get("message_id"),
                    "response": result
                }
                
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "timeout",
                "message": "Request timed out"
            }
        except Exception as e:
            return {
                "success": False,
                "error": "exception",
                "message": str(e)
            }
    
    async def send_template_message(
        self,
        phone: str,
        template_name: str,
        template_params: List[str],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Send a pre-approved template message
        
        Args:
            phone: Recipient phone number
            template_name: Name of approved template
            template_params: List of parameter values
            language: Template language code
        """
        phone = self._normalize_phone(phone)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/send-template",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "phone": phone,
                        "template_name": template_name,
                        "template_params": template_params,
                        "language": language,
                        "sender_id": self.sender_id
                    }
                )
                
                result = response.json() if response.status_code == 200 else {}
                
                return {
                    "success": response.status_code == 200,
                    "status_code": response.status_code,
                    "message_id": result.get("message_id"),
                    "response": result
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": "exception",
                "message": str(e)
            }
    
    async def send_media_message(
        self,
        phone: str,
        media_url: str,
        media_type: str = "image",
        caption: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send media (image, video, document)
        
        Args:
            phone: Recipient phone number
            media_url: URL of the media file
            media_type: Type of media (image, video, document)
            caption: Optional caption for the media
        """
        phone = self._normalize_phone(phone)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "phone": phone,
                    "media_url": media_url,
                    "media_type": media_type,
                    "sender_id": self.sender_id
                }
                
                if caption:
                    payload["caption"] = caption
                
                response = await client.post(
                    f"{self.base_url}/send-media",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                
                result = response.json() if response.status_code == 200 else {}
                
                return {
                    "success": response.status_code == 200,
                    "status_code": response.status_code,
                    "message_id": result.get("message_id"),
                    "response": result
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": "exception",
                "message": str(e)
            }
    
    async def send_interactive_buttons(
        self,
        phone: str,
        body_text: str,
        buttons: List[Dict[str, str]],
        header: Optional[str] = None,
        footer: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send interactive message with buttons
        
        Args:
            phone: Recipient phone number
            body_text: Main message body
            buttons: List of button dicts with 'id' and 'title'
            header: Optional header text
            footer: Optional footer text
        """
        phone = self._normalize_phone(phone)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "phone": phone,
                    "type": "button",
                    "body": body_text,
                    "buttons": buttons[:3],  # WhatsApp allows max 3 buttons
                    "sender_id": self.sender_id
                }
                
                if header:
                    payload["header"] = header
                if footer:
                    payload["footer"] = footer
                
                response = await client.post(
                    f"{self.base_url}/send-interactive",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                
                result = response.json() if response.status_code == 200 else {}
                
                return {
                    "success": response.status_code == 200,
                    "status_code": response.status_code,
                    "message_id": result.get("message_id"),
                    "response": result
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": "exception",
                "message": str(e)
            }
    
    async def send_list_message(
        self,
        phone: str,
        body_text: str,
        button_text: str,
        sections: List[Dict[str, Any]],
        header: Optional[str] = None,
        footer: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send interactive list message
        
        Args:
            phone: Recipient phone number
            body_text: Main message body
            button_text: Text for the list button
            sections: List of sections with rows
            header: Optional header
            footer: Optional footer
        """
        phone = self._normalize_phone(phone)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "phone": phone,
                    "type": "list",
                    "body": body_text,
                    "button": button_text,
                    "sections": sections,
                    "sender_id": self.sender_id
                }
                
                if header:
                    payload["header"] = header
                if footer:
                    payload["footer"] = footer
                
                response = await client.post(
                    f"{self.base_url}/send-interactive",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                
                result = response.json() if response.status_code == 200 else {}
                
                return {
                    "success": response.status_code == 200,
                    "status_code": response.status_code,
                    "message_id": result.get("message_id"),
                    "response": result
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": "exception",
                "message": str(e)
            }
    
    async def send_with_retry(
        self,
        phone: str,
        message: str,
        max_retries: int = 3,
        delay: float = 1.0
    ) -> Dict[str, Any]:
        """
        Send message with retry mechanism
        """
        for attempt in range(max_retries):
            result = await self.send_text_message(phone, message)
            
            if result.get("success"):
                return result
            
            if attempt < max_retries - 1:
                await asyncio.sleep(delay * (attempt + 1))
        
        return {
            "success": False,
            "error": "max_retries_exceeded",
            "message": f"Failed after {max_retries} attempts"
        }
    
    def _normalize_phone(self, phone: str) -> str:
        """
        Normalize phone number to international format
        """
        # Remove all non-digit characters
        phone = ''.join(filter(str.isdigit, str(phone)))
        
        # Add India country code if not present
        if len(phone) == 10:
            phone = f"91{phone}"
        elif not phone.startswith("91") and len(phone) == 12:
            pass  # Already has country code
        
        return phone
    
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse incoming webhook payload from Leonas
        
        Returns standardized message dict
        """
        try:
            # Leonas webhook format (adjust based on actual API docs)
            message_data = payload.get("message", payload)
            
            return {
                "phone": message_data.get("from", ""),
                "message_id": message_data.get("id", ""),
                "text": message_data.get("text", {}).get("body", "") or message_data.get("body", ""),
                "timestamp": message_data.get("timestamp", datetime.utcnow().isoformat()),
                "type": message_data.get("type", "text"),
                "media_url": message_data.get("media", {}).get("url"),
                "button_reply": message_data.get("button", {}).get("payload"),
                "list_reply": message_data.get("list_reply", {}).get("id"),
                "raw": payload
            }
        except Exception as e:
            return {
                "error": str(e),
                "raw": payload
            }


# Singleton instance
leonas_client = LeonasWhatsAppClient()
