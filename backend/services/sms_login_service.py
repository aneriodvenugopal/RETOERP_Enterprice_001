"""
SMS Login API Integration Service
Real SMS provider: smslogin.co
"""

import os
import httpx
import random
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# SMS Login API Configuration
SMS_LOGIN_BASE_URL = "https://smslogin.co/v3/api.php"
SMS_LOGIN_USERNAME = os.getenv('SMS_LOGIN_USERNAME', 'Eloniot')
SMS_LOGIN_API_KEY = os.getenv('SMS_LOGIN_API_KEY', '6abb40963b99b1475d58')
SMS_LOGIN_SENDER_ID = os.getenv('SMS_LOGIN_SENDER_ID', 'ELNIOT')
SMS_LOGIN_OTP_TEMPLATE_ID = os.getenv('SMS_LOGIN_OTP_TEMPLATE_ID', '1707176871449969835')

# OTP Message Template: {#var#} is your OTP for RETORP login. Valid for {#var#} minutes. Do not share this OTP with anyone.ELNIOT

MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME')
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


class SMSLoginService:
    """Service for SMS Login API operations"""
    
    @staticmethod
    async def send_otp(phone: str, otp: str, validity_minutes: int = 10) -> Dict[str, Any]:
        """
        Send OTP SMS using SMS Login API
        Template: {#var#} is your OTP for RETORP login. Valid for {#var#} minutes. Do not share this OTP with anyone.ELNIOT
        """
        try:
            # Format message with OTP and validity
            # The template has two {#var#} placeholders - OTP and minutes
            message = f"{otp} is your OTP for RETORP login. Valid for {validity_minutes} minutes. Do not share this OTP with anyone.ELNIOT"
            
            # Build API URL with parameters
            params = {
                "username": SMS_LOGIN_USERNAME,
                "apikey": SMS_LOGIN_API_KEY,
                "senderid": SMS_LOGIN_SENDER_ID,
                "mobile": phone,
                "message": message,
                "templateid": SMS_LOGIN_OTP_TEMPLATE_ID
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(SMS_LOGIN_BASE_URL, params=params)
                response_text = response.text.strip()
                
                print(f"\n{'='*60}")
                print(f"📱 SMS LOGIN API - SEND OTP")
                print(f"{'='*60}")
                print(f"To: {phone}")
                print(f"OTP: {otp}")
                print(f"API Response: {response_text}")
                print(f"Status Code: {response.status_code}")
                print(f"{'='*60}\n")
                
                # Parse response - SMS Login returns JSON with campid on success
                # Success response: {"campid":"xxxxx"} or just numeric message ID
                is_success = response.status_code == 200
                message_id = None
                
                if is_success:
                    # Try to parse JSON response
                    try:
                        import json
                        resp_json = json.loads(response_text.replace("'", '"'))
                        message_id = resp_json.get("campid")
                    except:
                        # If not JSON, check if numeric
                        if response_text.isdigit():
                            message_id = response_text
                        elif "campid" in response_text:
                            is_success = True
                
                result = {
                    "success": is_success,
                    "phone": phone,
                    "message_id": message_id,
                    "provider": "smslogin",
                    "response": response_text,
                    "status_code": response.status_code,
                    "sent_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Log to database
                await db.sms_logs.insert_one({
                    "id": str(uuid.uuid4()),
                    "type": "otp",
                    "phone": phone,
                    "message": message,
                    "otp": otp,
                    "provider_message_id": result["message_id"],
                    "provider_response": response_text,
                    "success": is_success,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                
                return result
                
        except Exception as e:
            print(f"❌ SMS Login API Error: {str(e)}")
            return {
                "success": False,
                "phone": phone,
                "error": str(e),
                "provider": "smslogin"
            }
    
    @staticmethod
    async def send_bulk_sms(
        phone_numbers: List[str],
        message: str,
        template_id: str
    ) -> Dict[str, Any]:
        """
        Send bulk SMS to multiple numbers (up to 500)
        """
        try:
            # Comma-separated phone numbers
            mobile_list = ",".join(phone_numbers[:500])  # Max 500
            
            params = {
                "username": SMS_LOGIN_USERNAME,
                "apikey": SMS_LOGIN_API_KEY,
                "senderid": SMS_LOGIN_SENDER_ID,
                "mobile": mobile_list,
                "message": message,
                "templateid": template_id
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(SMS_LOGIN_BASE_URL, params=params)
                response_text = response.text.strip()
                
                print(f"\n{'='*60}")
                print(f"📱 SMS LOGIN API - BULK SMS")
                print(f"{'='*60}")
                print(f"To: {len(phone_numbers)} numbers")
                print(f"API Response: {response_text}")
                print(f"{'='*60}\n")
                
                is_success = response.status_code == 200
                
                # Log to database
                await db.sms_logs.insert_one({
                    "id": str(uuid.uuid4()),
                    "type": "bulk",
                    "phone_count": len(phone_numbers),
                    "phones": phone_numbers,
                    "message": message,
                    "template_id": template_id,
                    "provider_response": response_text,
                    "success": is_success,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                
                return {
                    "success": is_success,
                    "sent_count": len(phone_numbers),
                    "message_id": response_text if is_success else None,
                    "response": response_text,
                    "provider": "smslogin"
                }
                
        except Exception as e:
            print(f"❌ SMS Login Bulk API Error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "provider": "smslogin"
            }
    
    @staticmethod
    async def check_delivery_status(message_id: str) -> Dict[str, Any]:
        """
        Check delivery status of a sent message
        """
        try:
            params = {
                "username": SMS_LOGIN_USERNAME,
                "apikey": SMS_LOGIN_API_KEY,
                "campid": message_id
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(SMS_LOGIN_BASE_URL, params=params)
                response_text = response.text.strip()
                
                print(f"\n📱 SMS Delivery Status for {message_id}: {response_text}")
                
                return {
                    "success": response.status_code == 200,
                    "message_id": message_id,
                    "status": response_text,
                    "provider": "smslogin"
                }
                
        except Exception as e:
            return {
                "success": False,
                "message_id": message_id,
                "error": str(e),
                "provider": "smslogin"
            }
    
    @staticmethod
    async def get_credit_balance() -> Dict[str, Any]:
        """
        Get SMS credit balance
        """
        try:
            # Note: SMS Login balance check might use different endpoint
            # This is a placeholder - adjust based on actual API docs
            params = {
                "username": SMS_LOGIN_USERNAME,
                "apikey": SMS_LOGIN_API_KEY
            }
            
            # Try balance endpoint
            balance_url = "https://smslogin.co/v3/getbalance.php"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(balance_url, params=params)
                response_text = response.text.strip()
                
                print(f"\n📱 SMS Credit Balance: {response_text}")
                
                return {
                    "success": response.status_code == 200,
                    "balance": response_text,
                    "provider": "smslogin"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "provider": "smslogin"
            }
    
    @staticmethod
    async def generate_and_send_otp(phone: str) -> Dict[str, Any]:
        """
        Generate OTP and send via SMS Login API
        Returns OTP for verification (store securely)
        """
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Store OTP in database with expiry
        otp_record = {
            "id": str(uuid.uuid4()),
            "phone": phone,
            "otp": otp,
            "expires_at": datetime.now(timezone.utc).timestamp() + (10 * 60),  # 10 minutes
            "verified": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Delete any existing OTP for this phone
        await db.otp_records.delete_many({"phone": phone})
        
        # Store new OTP
        await db.otp_records.insert_one(otp_record)
        
        # Send OTP via SMS
        send_result = await SMSLoginService.send_otp(phone, otp, validity_minutes=10)
        
        return {
            "success": send_result.get("success", False),
            "phone": phone,
            "otp": otp,  # Return OTP for demo/testing - in production, don't return this
            "message_id": send_result.get("message_id"),
            "provider_response": send_result.get("response"),
            "expires_in_minutes": 10
        }
    
    @staticmethod
    async def verify_otp(phone: str, otp: str) -> Dict[str, Any]:
        """
        Verify OTP entered by user
        """
        # Find OTP record
        otp_record = await db.otp_records.find_one({
            "phone": phone,
            "otp": otp,
            "verified": False
        }, {"_id": 0})
        
        if not otp_record:
            return {
                "success": False,
                "error": "Invalid OTP"
            }
        
        # Check expiry
        if datetime.now(timezone.utc).timestamp() > otp_record.get("expires_at", 0):
            return {
                "success": False,
                "error": "OTP expired"
            }
        
        # Mark as verified
        await db.otp_records.update_one(
            {"phone": phone, "otp": otp},
            {"$set": {"verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "success": True,
            "message": "OTP verified successfully"
        }
