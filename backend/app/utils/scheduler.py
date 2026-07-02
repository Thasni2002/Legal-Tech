import asyncio
from datetime import datetime
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.advocate.case_management.models import Case
from app.utils.email import send_email

# Configure logging
logger = logging.getLogger("app.scheduler")

scheduler = BackgroundScheduler()


def check_hearing_reminders():
    logger.info("Running scheduled hearing reminders check...")
    db = SessionLocal()
    today = datetime.now().date()

    try:
        cases = db.query(Case).all()
    except Exception as e:
        logger.error(f"Error fetching cases from database: {e}")
        db.close()
        return

    for case in cases:
        if not case.next_hearing_date:
            continue

        try:
            # Clean date string and split in case time is appended
            date_str = case.next_hearing_date.strip().split()[0].split('T')[0]
            if not date_str:
                continue

            hearing_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            days_left = (hearing_date - today).days

            # Send reminders exactly 5, 2, or 1 day before the hearing
            if days_left in [5, 2, 1]:
                subject = f"🔔 Hearing Reminder: {case.case_title}"

                # Professional, premium styled HTML email
                body = f"""
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #1E293B;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
                        <!-- Header Banner -->
                        <div style="background: linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%); padding: 30px; text-align: center; color: #FFFFFF;">
                            <h2 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Upcoming Court Hearing</h2>
                            <p style="margin: 5px 0 0 0; opacity: 0.85; font-size: 14px;">Case Reminder Alert</p>
                        </div>
                        
                        <!-- Content Body -->
                        <div style="padding: 30px 40px;">
                            <p style="font-size: 16px; line-height: 24px; color: #475569; margin-top: 0;">
                                Dear {case.client_name or 'Client'},
                            </p>
                            <p style="font-size: 16px; line-height: 24px; color: #475569;">
                                This is an automated reminder that your case has an upcoming hearing scheduled in <strong>{days_left} day(s)</strong>.
                            </p>
                            
                            <!-- Case Details Card -->
                            <div style="background-color: #F1F5F9; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #4F46E5;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748B; width: 130px; vertical-align: top;">Case Title:</td>
                                        <td style="padding: 6px 0; font-size: 14px; color: #1E293B; font-weight: 500;">{case.case_title}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748B; vertical-align: top;">Case Number:</td>
                                        <td style="padding: 6px 0; font-size: 14px; color: #1E293B; font-weight: 500;">{case.case_no}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748B; vertical-align: top;">Court Name:</td>
                                        <td style="padding: 6px 0; font-size: 14px; color: #1E293B; font-weight: 500;">{case.court_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748B; vertical-align: top;">Hearing Date:</td>
                                        <td style="padding: 6px 0; font-size: 14px; color: #E11D48; font-weight: 700;">{hearing_date.strftime("%B %d, %Y")}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p style="font-size: 14px; line-height: 20px; color: #64748B; margin-bottom: 0;">
                                Please ensure you have coordinated with your advocate beforehand and prepared all necessary documents. If you have any questions, please contact our office directly.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                                This is an automated email notification from Legal Tech lawfirm management. Please do not reply directly to this email.
                            </p>
                        </div>
                    </div>
                </div>
                """

                # Send client email
                if case.email_id:
                    try:
                        logger.info(f"Sending hearing reminder to client {case.email_id} for case: {case.case_title}")
                        asyncio.run(send_email(case.email_id, subject, body))
                        logger.info(f"Hearing reminder email successfully sent to client: {case.email_id}")
                    except Exception as email_err:
                        logger.error(f"Failed to send email to client {case.email_id}: {email_err}")

                # Send junior advocate email
                if hasattr(case, "junior_advocate_email") and case.junior_advocate_email:
                    try:
                        logger.info(f"Sending hearing reminder to junior advocate {case.junior_advocate_email} for case: {case.case_title}")
                        asyncio.run(send_email(case.junior_advocate_email, subject, body))
                        logger.info(f"Hearing reminder email successfully sent to junior advocate: {case.junior_advocate_email}")
                    except Exception as email_err:
                        logger.error(f"Failed to send email to junior advocate {case.junior_advocate_email}: {email_err}")

        except ValueError as parse_err:
            logger.warning(f"Could not parse next_hearing_date '{case.next_hearing_date}' for case ID {case.id}: {parse_err}")
        except Exception as case_err:
            logger.error(f"Error processing case ID {case.id}: {case_err}")

    db.close()


def start_scheduler():
    # Runs the check_hearing_reminders job immediately once, then schedules it daily
    scheduler.add_job(check_hearing_reminders, "interval", days=1)
    scheduler.start()
    logger.info("Hearing reminder scheduler started successfully.")