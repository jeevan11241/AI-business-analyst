from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

_mail_configured = bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD)

if _mail_configured:
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True
    )
else:
    logger.warning("⚠️  MAIL_USERNAME or MAIL_PASSWORD not set in .env — emails will NOT be sent.")
    conf = None

async def send_alert_email(to_email: str, username: str, business_name: str, predicted_label: str, risk_level: str, suggestions: list):
    sugs_html = ""
    if not suggestions:
        if risk_level == "High":
            sugs_html = "<li>IMMEDIATE: Reduce inventory and salary costs by 15% minimum.</li><li>Urgent: Audit operational expenses.</li>"
        elif risk_level == "Medium":
            sugs_html = "<li>Review labor costs.</li><li>Monitor sales trends closely.</li>"
        else:
            sugs_html = "<li>Operations stable. Maintain current strategy.</li>"
    else:
        sugs_html = "".join([f"<li>{s.suggestion_text} (Reason: {s.reason_text})</li>" for s in suggestions])
    
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #ef4444;">Mind Profit: AI Analysis Report</h2>
        <p>Hello Executive,</p>
        <p>Your analysis for <b>{business_name}</b> is complete.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><b>Risk Assessment:</b> <span style="font-size: 1.2rem; color: #ef4444;">{risk_level}</span></p>
            <p><b>Prediction Outcome:</b> {predicted_label}</p>
        </div>
        <h3>AI Recommendations:</h3>
        <ul>{sugs_html}</ul>
        <hr>
        <p style="font-size: 0.8rem; color: #64748b;">This is a data-driven prediction from Mind Profit AI. Please consult with financial advisors before making major shifts.</p>
    </div>
    """
    
    message = MessageSchema(
        subject=f"Mind Profit: Analysis Report for {business_name}",
        recipients=[to_email],
        body=html,
        subtype=MessageType.html
    )
    
    if not _mail_configured or conf is None:
        logger.error("❌ Email not sent: MAIL_USERNAME / MAIL_PASSWORD missing in .env file.")
        return

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        logger.info(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
        raise

class AlertPayload(BaseModel):
    email: str
    business: str
    sales: float
    risk_level: str
    label: str

@router.post("/send-report")
async def send_report(payload: AlertPayload, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        send_alert_email,
        payload.email, 
        "Executive", 
        payload.business, 
        payload.label, 
        payload.risk_level, 
        []
    )
    return {"message": "Email analysis report is being dispatched in the background."}
