"""Automated scheduler service for reminders and notifications"""
import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.notification_service import NotificationService
from services.notification_templates import NotificationTemplates
from typing import Dict, Any
import os

class SchedulerService:
    """Service for automated reminders and scheduled tasks"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.notification_service = NotificationService()
    
    async def send_payment_reminders(self) -> Dict[str, Any]:
        """Send payment reminders for upcoming due dates"""
        print("🔔 Checking payment reminders...")
        
        # Get reminder settings
        reminder_days = int(os.getenv('PAYMENT_REMINDER_DAYS', '3'))
        
        # Calculate target date (X days from now)
        target_date = (datetime.now(timezone.utc) + timedelta(days=reminder_days)).date()
        target_date_str = target_date.isoformat()
        
        # Find payment schedules due on target date
        schedules = await self.db.payment_schedules.find({
            'due_date': {
                '$gte': target_date_str,
                '$lt': (target_date + timedelta(days=1)).isoformat()
            },
            'status': 'pending',
            'deleted_at': None
        }, {'_id': 0}).to_list(length=None)
        
        sent_count = 0
        
        for schedule in schedules:
            # Get booking details
            booking = await self.db.bookings.find_one(
                {'id': schedule['booking_id']}, 
                {'_id': 0}
            )
            
            if not booking:
                continue
            
            # Get property details
            property_doc = await self.db.properties.find_one(
                {'id': booking['property_id']}, 
                {'_id': 0}
            )
            
            if not property_doc:
                continue
            
            # Send SMS reminder
            if booking.get('customer_phone'):
                try:
                    sms_response = await self.notification_service.send_sms(
                        booking['customer_phone'],
                        NotificationTemplates.get_payment_reminder_sms(
                            booking['customer_name'],
                            schedule['amount'],
                            schedule['due_date'],
                            property_doc.get('property_number', 'Property')
                        )
                    )
                    
                    # Log notification
                    await self.notification_service.log_notification(
                        self.db,
                        booking['customer_phone'],
                        'sms',
                        'payment_reminder',
                        f"Payment reminder: ₹{schedule['amount']}",
                        sms_response
                    )
                    
                    sent_count += 1
                except Exception as e:
                    print(f"Error sending SMS reminder: {e}")
            
            # Send Email reminder if email exists
            if booking.get('customer_email'):
                try:
                    email_html = NotificationTemplates.get_payment_reminder_email_html(
                        booking['customer_name'],
                        property_doc.get('property_number', 'Property'),
                        schedule['due_date'],
                        schedule['amount'],
                        0  # Not overdue yet
                    )
                    
                    email_response = await self.notification_service.send_email(
                        booking['customer_email'],
                        f"Payment Reminder - Due on {schedule['due_date']}",
                        email_html,
                        html=True
                    )
                    
                    # Log notification
                    await self.notification_service.log_notification(
                        self.db,
                        booking['customer_email'],
                        'email',
                        'payment_reminder',
                        f"Payment reminder: ₹{schedule['amount']}",
                        email_response
                    )
                    
                except Exception as e:
                    print(f"Error sending email reminder: {e}")
        
        print(f"✅ Sent {sent_count} payment reminders")
        return {
            'total_schedules': len(schedules),
            'reminders_sent': sent_count,
            'target_date': target_date_str
        }
    
    async def send_overdue_alerts(self) -> Dict[str, Any]:
        """Send alerts for overdue payments"""
        print("⚠️  Checking overdue payments...")
        
        today = datetime.now(timezone.utc).date().isoformat()
        
        # Find overdue payment schedules
        overdue_schedules = await self.db.payment_schedules.find({
            'due_date': {'$lt': today},
            'status': 'pending',
            'deleted_at': None
        }, {'_id': 0}).to_list(length=None)
        
        sent_count = 0
        
        for schedule in overdue_schedules:
            # Calculate days overdue
            due_date = datetime.fromisoformat(schedule['due_date']).date()
            days_overdue = (datetime.now(timezone.utc).date() - due_date).days
            
            # Get booking details
            booking = await self.db.bookings.find_one(
                {'id': schedule['booking_id']}, 
                {'_id': 0}
            )
            
            if not booking:
                continue
            
            # Get property details
            property_doc = await self.db.properties.find_one(
                {'id': booking['property_id']}, 
                {'_id': 0}
            )
            
            if not property_doc:
                continue
            
            # Send URGENT SMS
            if booking.get('customer_phone'):
                try:
                    sms_message = f"URGENT: Payment of ₹{schedule['amount']:,.2f} for {property_doc.get('property_number', 'Property')} is OVERDUE by {days_overdue} days. Please pay immediately to avoid penalties. - RETOERP"
                    
                    sms_response = await self.notification_service.send_sms(
                        booking['customer_phone'],
                        sms_message
                    )
                    
                    await self.notification_service.log_notification(
                        self.db,
                        booking['customer_phone'],
                        'sms',
                        'overdue_alert',
                        sms_message,
                        sms_response
                    )
                    
                    sent_count += 1
                except Exception as e:
                    print(f"Error sending overdue SMS: {e}")
            
            # Send URGENT Email
            if booking.get('customer_email'):
                try:
                    email_html = NotificationTemplates.get_payment_reminder_email_html(
                        booking['customer_name'],
                        property_doc.get('property_number', 'Property'),
                        schedule['due_date'],
                        schedule['amount'],
                        days_overdue
                    )
                    
                    email_response = await self.notification_service.send_email(
                        booking['customer_email'],
                        f"URGENT: Payment Overdue - {days_overdue} Days",
                        email_html,
                        html=True
                    )
                    
                    await self.notification_service.log_notification(
                        self.db,
                        booking['customer_email'],
                        'email',
                        'overdue_alert',
                        f"Overdue: ₹{schedule['amount']}, {days_overdue} days",
                        email_response
                    )
                    
                except Exception as e:
                    print(f"Error sending overdue email: {e}")
        
        print(f"✅ Sent {sent_count} overdue alerts")
        return {
            'total_overdue': len(overdue_schedules),
            'alerts_sent': sent_count
        }
    
    async def send_follow_up_reminders(self) -> Dict[str, Any]:
        """Send follow-up reminders to staff"""
        print("📞 Checking follow-up reminders...")
        
        today = datetime.now(timezone.utc).date().isoformat()
        
        # Find follow-ups scheduled for today that are not completed
        follow_ups = await self.db.follow_ups.find({
            'scheduled_date': {
                '$gte': today,
                '$lt': (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
            },
            'completed': False,
            'deleted_at': None
        }, {'_id': 0}).to_list(length=None)
        
        sent_count = 0
        
        for follow_up in follow_ups:
            # Get staff details
            staff = await self.db.users.find_one(
                {'id': follow_up.get('assigned_to')}, 
                {'_id': 0}
            )
            
            if not staff:
                continue
            
            # Get lead details
            lead = await self.db.leads.find_one(
                {'id': follow_up['lead_id']}, 
                {'_id': 0}
            )
            
            if not lead:
                continue
            
            # Get follow-up type
            follow_up_type = await self.db.categories.find_one(
                {'id': follow_up.get('type_id')}, 
                {'_id': 0}
            )
            
            type_name = follow_up_type['name'] if follow_up_type else 'Follow-up'
            
            # Send SMS to staff
            if staff.get('phone'):
                try:
                    sms_message = NotificationTemplates.get_follow_up_reminder_sms(
                        staff['name'],
                        lead['name'],
                        type_name
                    )
                    
                    sms_response = await self.notification_service.send_sms(
                        staff['phone'],
                        sms_message
                    )
                    
                    await self.notification_service.log_notification(
                        self.db,
                        staff['phone'],
                        'sms',
                        'follow_up_reminder',
                        sms_message,
                        sms_response
                    )
                    
                    sent_count += 1
                except Exception as e:
                    print(f"Error sending follow-up reminder: {e}")
        
        print(f"✅ Sent {sent_count} follow-up reminders")
        return {
            'total_follow_ups': len(follow_ups),
            'reminders_sent': sent_count
        }
    
    async def run_all_tasks(self) -> Dict[str, Any]:
        """Run all scheduled tasks"""
        print("🚀 Starting scheduled tasks...")
        print("=" * 60)
        
        results = {}
        
        # Run payment reminders
        try:
            results['payment_reminders'] = await self.send_payment_reminders()
        except Exception as e:
            print(f"Error in payment reminders: {e}")
            results['payment_reminders'] = {'error': str(e)}
        
        # Run overdue alerts
        try:
            results['overdue_alerts'] = await self.send_overdue_alerts()
        except Exception as e:
            print(f"Error in overdue alerts: {e}")
            results['overdue_alerts'] = {'error': str(e)}
        
        # Run follow-up reminders
        try:
            results['follow_up_reminders'] = await self.send_follow_up_reminders()
        except Exception as e:
            print(f"Error in follow-up reminders: {e}")
            results['follow_up_reminders'] = {'error': str(e)}
        
        print("=" * 60)
        print("✅ All scheduled tasks completed")
        
        return results
