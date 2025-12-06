"""
Email service - Gui email qua Gmail SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = settings.SMTP_EMAIL
        self.sender_password = settings.SMTP_PASSWORD

    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Gui email"""
        try:
            msg = MIMEMultipart()
            msg["From"] = f"Sweet Bakery <{self.sender_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject

            msg.attach(MIMEText(body, "html"))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, msg.as_string())

            print(f"[Email] Sent to {to_email}")
            return True
        except Exception as e:
            print(f"[Email] Error: {e}")
            return False

    def send_reset_password_email(self, to_email: str, otp_code: str) -> bool:
        """Gui email reset password voi OTP 6 so"""
        
        subject = "Sweet Bakery - Ma OTP dat lai mat khau"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Dat lai mat khau</h2>
            <p>Xin chao,</p>
            <p>Ban da yeu cau dat lai mat khau cho tai khoan Sweet Bakery.</p>
            <p>Ma OTP cua ban la:</p>
            <p style="font-size: 32px; font-weight: bold; color: #d4a574; 
                      letter-spacing: 5px; text-align: center; padding: 20px;">
                {otp_code}
            </p>
            <p>Ma nay se het han sau 5 phut.</p>
            <p>Neu ban khong yeu cau, vui long bo qua email nay.</p>
            <br>
            <p>Sweet Bakery</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, body)


email_service = EmailService()
