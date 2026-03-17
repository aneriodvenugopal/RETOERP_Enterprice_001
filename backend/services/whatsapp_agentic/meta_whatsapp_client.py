"""
Meta WhatsApp Cloud API Client
Official Meta Graph API for WhatsApp Business
https://developers.facebook.com/docs/whatsapp/cloud-api
"""

import os
import httpx
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
from dotenv import load_dotenv
import json

load_dotenv()


class MetaWhatsAppClient:
    """
    Client for Meta WhatsApp Cloud API (Official)
    """
    
    def __init__(self):
        self.base_url = "https://graph.facebook.com/v25.0"
        self.access_token = os.getenv("META_WHATSAPP_ACCESS_TOKEN", "")
        self.phone_number_id = os.getenv("META_WHATSAPP_PHONE_NUMBER_ID", "")
        self.waba_id = os.getenv("META_WHATSAPP_WABA_ID", "")
        self.timeout = 30
        
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers with Bearer token"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    async def send_text_message(
        self, 
        phone: str, 
        message: str,
        tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a text message via WhatsApp Cloud API
        
        Endpoint: POST /{phone_number_id}/messages
        """
        phone = self._normalize_phone(phone)
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/{self.phone_number_id}/messages",
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json() if response.status_code in [200, 201] else {}
                
                print(f"📤 WhatsApp Send Response: {response.status_code} - {result}")
                
                if response.status_code not in [200, 201]:
                    error_data = response.json() if response.text else {}
                    return {
                        "success": False,
                        "status_code": response.status_code,
                        "error": error_data.get("error", {}).get("message", "Unknown error"),
                        "response": error_data
                    }
                
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "message_id": result.get("messages", [{}])[0].get("id") if result.get("messages") else None,
                    "wamid": result.get("messages", [{}])[0].get("id") if result.get("messages") else None,
                    "response": result
                }
                
        except httpx.TimeoutException:
            print(f"⚠️ WhatsApp timeout sending to {phone}")
            return {"success": False, "error": "timeout", "message": "Request timed out"}
        except Exception as e:
            print(f"❌ WhatsApp error: {e}")
            return {"success": False, "error": "exception", "message": str(e)}
    
    async def send_template_message(
        self,
        phone: str,
        template_name: str,
        template_params: List[str] = None,
        language: str = "en_US",
        header_params: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Send a pre-approved template message
        
        Endpoint: POST /{phone_number_id}/messages
        """
        phone = self._normalize_phone(phone)
        
        # Build components with parameters
        components = []
        
        # Header parameters (if any)
        if header_params:
            components.append({
                "type": "header",
                "parameters": header_params
            })
        
        # Body parameters
        if template_params:
            body_params = [{"type": "text", "text": param} for param in template_params]
            components.append({
                "type": "body",
                "parameters": body_params
            })
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language
                }
            }
        }
        
        if components:
            payload["template"]["components"] = components
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/{self.phone_number_id}/messages",
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json() if response.status_code in [200, 201] else {}
                
                print(f"📤 Template Send Response: {response.status_code} - {result}")
                
                return {
                    "success": response.status_code in [200, 201],
                    "status_code": response.status_code,
                    "message_id": result.get("messages", [{}])[0].get("id") if result.get("messages") else None,
                    "response": result
                }
                
        except Exception as e:
            print(f"❌ Template send error: {e}")
            return {"success": False, "error": "exception", "message": str(e)}
    
    async def send_image_message(
        self,
        phone: str,
        image_url: str,
        caption: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send image message
        """
        phone = self._normalize_phone(phone)
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "image",
            "image": {
                "link": image_url
            }
        }
        
        if caption:
            payload["image"]["caption"] = caption
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/{self.phone_number_id}/messages",
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json() if response.status_code in [200, 201] else {}
                
                return {
                    "success": response.status_code in [200, 201],
                    "status_code": response.status_code,
                    "message_id": result.get("messages", [{}])[0].get("id") if result.get("messages") else None,
                    "response": result
                }
                
        except Exception as e:
            return {"success": False, "error": "exception", "message": str(e)}
    
    async def send_document_message(
        self,
        phone: str,
        document_url: str,
        filename: str,
        caption: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send document message (PDF, etc.)
        """
        phone = self._normalize_phone(phone)
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "document",
            "document": {
                "link": document_url,
                "filename": filename
            }
        }
        
        if caption:
            payload["document"]["caption"] = caption
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/{self.phone_number_id}/messages",
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json() if response.status_code in [200, 201] else {}
                
                return {
                    "success": response.status_code in [200, 201],
                    "status_code": response.status_code,
                    "message_id": result.get("messages", [{}])[0].get("id") if result.get("messages") else None,
                    "response": result
                }
                
        except Exception as e:
            return {"success": False, "error": "exception", "message": str(e)}
    
    async def send_location_message(
        self,
        phone: str,
        latitude: float,
        longitude: float,
        name: str,
        address: str
    ) -> Dict[str, Any]:
        """
        Send location message
        """
        phone = self._normalize_phone(phone)
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "location",
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "name": name,
                "address": address
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/{self.phone_number_id}/messages",
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json() if response.status_code in [200, 201] else {}
                
                return {
                    "success": response.status_code in [200, 201],
                    "status_code": response.status_code,
                    "message_id": result.get("messages", [{}])[0].get("id") if result.get("messages") else None,
                    "response": result
                }
                
        except Exception as e:
            return {"success": False, "error": "exception", "message": str(e)}
    
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
        
        buttons format: [{"id": "btn_1", "title": "Button 1"}, ...]
        Max 3 buttons allowed
        """
        phone = self._normalize_phone(phone)
        
        interactive = {
            "type": "button",
            "body": {
                "text": body_text
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {
                            "id": btn.get("id", f"btn_{i}"),
                            "title": btn.get("title", "Button")[:20]  # Max 20 chars
                        }
                    }
                    for i, btn in enumerate(buttons[:3])  # Max 3 buttons
                ]
            }
        }
        
        if header:
            interactive["header"] = {"type": "text", "text": header}
        if footer:
            interactive["footer"] = {"text": footer}
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "interactive",
            "interactive": interactive
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/{self.phone_number_id}/messages",
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json() if response.status_code in [200, 201] else {}
                
                return {
                    "success": response.status_code in [200, 201],
                    "status_code": response.status_code,
                    "message_id": result.get("messages", [{}])[0].get("id") if result.get("messages") else None,
                    "response": result
                }
                
        except Exception as e:
            return {"success": False, "error": "exception", "message": str(e)}
    
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
        """
        phone = self._normalize_phone(phone)
        
        interactive = {
            "type": "list",
            "body": {
                "text": body_text
            },
            "action": {
                "button": button_text[:20],
                "sections": sections
            }
        }
        
        if header:
            interactive["header"] = {"type": "text", "text": header}
        if footer:
            interactive["footer"] = {"text": footer}
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "interactive",
            "interactive": interactive
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/{self.phone_number_id}/messages",
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json() if response.status_code in [200, 201] else {}
                
                return {
                    "success": response.status_code in [200, 201],
                    "status_code": response.status_code,
                    "message_id": result.get("messages", [{}])[0].get("id") if result.get("messages") else None,
                    "response": result
                }
                
        except Exception as e:
            return {"success": False, "error": "exception", "message": str(e)}
    
    async def get_templates(self) -> Dict[str, Any]:
        """
        Get all message templates for the WABA
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/{self.waba_id}/message_templates",
                    headers=self._get_headers()
                )
                
                result = response.json() if response.status_code == 200 else {}
                
                return {
                    "success": response.status_code == 200,
                    "templates": result.get("data", []),
                    "response": result
                }
                
        except Exception as e:
            return {"success": False, "error": "exception", "message": str(e)}
    
    async def get_phone_number_info(self) -> Dict[str, Any]:
        """
        Get information about the registered phone number
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/{self.phone_number_id}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,is_official_business_account,account_mode,is_pin_enabled,status",
                    headers=self._get_headers()
                )
                
                result = response.json() if response.status_code == 200 else {}
                
                return {
                    "success": response.status_code == 200,
                    "phone_info": result,
                    "response": result
                }
                
        except Exception as e:
            return {"success": False, "error": "exception", "message": str(e)}
    
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
            
            # Don't retry on permanent errors
            if result.get("status_code") in [400, 403, 404]:
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
        phone = ''.join(filter(str.isdigit, str(phone)))
        
        if len(phone) == 10:
            phone = f"91{phone}"
        
        return phone
    
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse incoming webhook payload from Meta Cloud API
        
        Meta webhook payload structure:
        {
            "object": "whatsapp_business_account",
            "entry": [{
                "id": "WABA_ID",
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {...},
                        "contacts": [...],
                        "messages": [{
                            "from": "PHONE",
                            "id": "MSG_ID",
                            "timestamp": "TIMESTAMP",
                            "text": {"body": "MESSAGE"},
                            "type": "text"
                        }]
                    },
                    "field": "messages"
                }]
            }]
        }
        """
        try:
            # Check if this is a Meta webhook payload
            if payload.get("object") == "whatsapp_business_account":
                entries = payload.get("entry", [])
                if not entries:
                    return {"error": "No entries in payload", "raw": payload}
                
                changes = entries[0].get("changes", [])
                if not changes:
                    return {"error": "No changes in entry", "raw": payload}
                
                value = changes[0].get("value", {})
                messages = value.get("messages", [])
                
                if not messages:
                    # This might be a status update, not a message
                    statuses = value.get("statuses", [])
                    if statuses:
                        return {
                            "type": "status_update",
                            "status": statuses[0].get("status"),
                            "message_id": statuses[0].get("id"),
                            "recipient": statuses[0].get("recipient_id"),
                            "raw": payload
                        }
                    return {"error": "No messages in payload", "raw": payload}
                
                msg = messages[0]
                msg_type = msg.get("type", "text")
                
                # Extract text based on message type
                text = ""
                if msg_type == "text":
                    text = msg.get("text", {}).get("body", "")
                elif msg_type == "interactive":
                    interactive = msg.get("interactive", {})
                    if interactive.get("type") == "button_reply":
                        text = interactive.get("button_reply", {}).get("title", "")
                    elif interactive.get("type") == "list_reply":
                        text = interactive.get("list_reply", {}).get("title", "")
                elif msg_type == "button":
                    text = msg.get("button", {}).get("text", "")
                
                # Get contact info
                contacts = value.get("contacts", [])
                contact_name = contacts[0].get("profile", {}).get("name", "") if contacts else ""
                
                return {
                    "phone": msg.get("from", ""),
                    "message_id": msg.get("id", ""),
                    "text": text,
                    "timestamp": msg.get("timestamp", ""),
                    "type": msg_type,
                    "contact_name": contact_name,
                    "button_reply": msg.get("interactive", {}).get("button_reply", {}) if msg_type == "interactive" else None,
                    "list_reply": msg.get("interactive", {}).get("list_reply", {}) if msg_type == "interactive" else None,
                    "image": msg.get("image", {}) if msg_type == "image" else None,
                    "document": msg.get("document", {}) if msg_type == "document" else None,
                    "audio": msg.get("audio", {}) if msg_type == "audio" else None,
                    "video": msg.get("video", {}) if msg_type == "video" else None,
                    "location": msg.get("location", {}) if msg_type == "location" else None,
                    "raw": payload
                }
            
            # Fallback: Try to parse as direct message (for testing)
            message_data = payload.get("message", payload)
            
            text = ""
            if isinstance(message_data.get("text"), dict):
                text = message_data["text"].get("body", "")
            elif isinstance(message_data.get("text"), str):
                text = message_data["text"]
            elif message_data.get("body"):
                text = message_data["body"]
            
            return {
                "phone": message_data.get("from", message_data.get("phone", "")),
                "message_id": message_data.get("id", message_data.get("message_id", "")),
                "text": text,
                "timestamp": message_data.get("timestamp", datetime.utcnow().isoformat()),
                "type": message_data.get("type", "text"),
                "raw": payload
            }
            
        except Exception as e:
            print(f"⚠️ Webhook parse error: {e}")
            return {
                "error": str(e),
                "raw": payload
            }


# Singleton instance
meta_whatsapp_client = MetaWhatsAppClient()
