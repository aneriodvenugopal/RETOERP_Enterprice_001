"""Notification templates for different types of messages"""
from typing import Dict, Any
from datetime import datetime

class NotificationTemplates:
    """Pre-defined templates for various notifications"""
    
    @staticmethod
    def get_otp_sms(otp: str) -> str:
        """OTP SMS template"""
        return f"Your RETOERP verification code is: {otp}. Valid for 10 minutes. Do not share this code with anyone."
    
    @staticmethod
    def get_payment_reminder_sms(customer_name: str, amount: float, due_date: str, property_name: str) -> str:
        """Payment reminder SMS template"""
        return (
            f"Dear {customer_name}, reminder: Payment of ₹{amount:,.2f} for {property_name} "
            f"is due on {due_date}. Please make payment to avoid penalties. - RETOERP"
        )
    
    @staticmethod
    def get_booking_confirmation_sms(customer_name: str, property_name: str, booking_id: str) -> str:
        """Booking confirmation SMS template"""
        return (
            f"Dear {customer_name}, your booking for {property_name} is confirmed! "
            f"Booking ID: {booking_id}. Thank you for choosing us. - RETOERP"
        )
    
    @staticmethod
    def get_follow_up_reminder_sms(staff_name: str, lead_name: str, follow_up_type: str) -> str:
        """Follow-up reminder SMS template"""
        return (
            f"Hi {staff_name}, reminder: {follow_up_type} scheduled with {lead_name}. "
            f"Please follow up today. - RETOERP"
        )
    
    @staticmethod
    def get_welcome_email_html(customer_name: str, login_url: str) -> str:
        """Welcome email HTML template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to RETOERP!</h1>
                </div>
                <div class="content">
                    <p>Dear {customer_name},</p>
                    <p>Welcome to RETOERP - Your Complete Real Estate Automation Solution!</p>
                    <p>We're excited to have you on board. You can now:</p>
                    <ul>
                        <li>Track your property bookings</li>
                        <li>View payment schedules</li>
                        <li>Access property documents</li>
                        <li>Get updates on your investments</li>
                    </ul>
                    <p style="text-align: center;">
                        <a href="{login_url}" class="button">Login to Your Account</a>
                    </p>
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    <p>Best regards,<br>The RETOERP Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 RETOERP. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    @staticmethod
    def get_booking_confirmation_email_html(
        customer_name: str,
        property_name: str,
        booking_id: str,
        booking_date: str,
        total_amount: float,
        booking_amount: float,
        payment_plan: str
    ) -> str:
        """Booking confirmation email HTML template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .details {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                .details-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
                .label {{ font-weight: bold; color: #666; }}
                .value {{ color: #333; }}
                .highlight {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Booking Confirmed!</h1>
                </div>
                <div class="content">
                    <p>Dear {customer_name},</p>
                    <p>Congratulations! Your booking has been confirmed successfully.</p>
                    
                    <div class="details">
                        <h3 style="margin-top: 0;">Booking Details</h3>
                        <div class="details-row">
                            <span class="label">Booking ID:</span>
                            <span class="value">{booking_id}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Property:</span>
                            <span class="value">{property_name}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Booking Date:</span>
                            <span class="value">{booking_date}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Total Amount:</span>
                            <span class="value">₹{total_amount:,.2f}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Booking Amount Paid:</span>
                            <span class="value">₹{booking_amount:,.2f}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Payment Plan:</span>
                            <span class="value">{payment_plan}</span>
                        </div>
                    </div>
                    
                    <div class="highlight">
                        <strong>Next Steps:</strong>
                        <ul>
                            <li>You will receive your payment schedule shortly</li>
                            <li>Property documents will be shared within 2-3 business days</li>
                            <li>Our team will contact you for further documentation</li>
                        </ul>
                    </div>
                    
                    <p>Thank you for choosing us. We look forward to serving you!</p>
                    <p>Best regards,<br>The RETOERP Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 RETOERP. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    @staticmethod
    def get_payment_receipt_email_html(
        customer_name: str,
        property_name: str,
        payment_date: str,
        amount: float,
        payment_mode: str,
        receipt_no: str,
        balance_amount: float
    ) -> str:
        """Payment receipt email HTML template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .receipt {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px dashed #667eea; }}
                .receipt-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
                .amount-paid {{ font-size: 24px; color: #28a745; font-weight: bold; text-align: center; padding: 20px; background: #d4edda; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💳 Payment Receipt</h1>
                </div>
                <div class="content">
                    <p>Dear {customer_name},</p>
                    <p>Thank you for your payment. This is to confirm that we have received your payment.</p>
                    
                    <div class="receipt">
                        <h3 style="margin-top: 0; text-align: center; color: #667eea;">PAYMENT RECEIPT</h3>
                        <div class="receipt-row">
                            <span>Receipt No:</span>
                            <span><strong>{receipt_no}</strong></span>
                        </div>
                        <div class="receipt-row">
                            <span>Date:</span>
                            <span>{payment_date}</span>
                        </div>
                        <div class="receipt-row">
                            <span>Property:</span>
                            <span>{property_name}</span>
                        </div>
                        <div class="receipt-row">
                            <span>Payment Mode:</span>
                            <span>{payment_mode}</span>
                        </div>
                    </div>
                    
                    <div class="amount-paid">
                        Amount Paid: ₹{amount:,.2f}
                    </div>
                    
                    <p><strong>Remaining Balance:</strong> ₹{balance_amount:,.2f}</p>
                    
                    <p>This is a system-generated receipt. Please keep it for your records.</p>
                    <p>Best regards,<br>The RETOERP Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 RETOERP. All rights reserved.</p>
                    <p>This is an automatically generated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    @staticmethod
    def get_payment_reminder_email_html(
        customer_name: str,
        property_name: str,
        due_date: str,
        amount: float,
        overdue_days: int = 0
    ) -> str:
        """Payment reminder email HTML template"""
        is_overdue = overdue_days > 0
        subject_prefix = "URGENT: " if is_overdue else ""
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {'#dc3545' if is_overdue else '#ffc107'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .alert {{ background: {'#f8d7da' if is_overdue else '#fff3cd'}; padding: 15px; border-left: 4px solid {'#dc3545' if is_overdue else '#ffc107'}; margin: 20px 0; }}
                .amount {{ font-size: 24px; font-weight: bold; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{'⚠️ Payment Overdue!' if is_overdue else '⏰ Payment Reminder'}</h1>
                </div>
                <div class="content">
                    <p>Dear {customer_name},</p>
                    <p>This is a {'friendly' if not is_overdue else 'urgent'} reminder about your upcoming payment for {property_name}.</p>
                    
                    <div class="alert">
                        <strong>{'Payment Overdue!' if is_overdue else 'Payment Due Soon'}</strong><br>
                        {'Your payment is overdue by ' + str(overdue_days) + ' days.' if is_overdue else 'Please ensure timely payment to avoid penalties.'}
                    </div>
                    
                    <div class="amount">
                        Amount Due: ₹{amount:,.2f}
                    </div>
                    
                    <p><strong>Due Date:</strong> {due_date}</p>
                    
                    <p>Please make the payment at your earliest convenience. You can make payment through:</p>
                    <ul>
                        <li>Bank Transfer</li>
                        <li>UPI</li>
                        <li>Cheque</li>
                        <li>Card Payment</li>
                    </ul>
                    
                    <p>For any queries, please contact our accounts team.</p>
                    <p>Best regards,<br>The RETOERP Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 RETOERP. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    @staticmethod
    def get_property_details_whatsapp(property_name: str, property_type: str, size: str, price: float, location: str) -> str:
        """Property details WhatsApp message template"""
        return f"""
🏠 *Property Details*

*Name:* {property_name}
*Type:* {property_type}
*Size:* {size}
*Price:* ₹{price:,.2f}
*Location:* {location}

For more details, please contact us or visit our office.

*RETOERP* - Your Real Estate Partner
        """.strip()
