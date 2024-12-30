import os
import sys
import ssl
import smtplib
import logging

from email.message import EmailMessage
from typing import Optional, Union

logger = logging.getLogger(__name__)

class EmailSender:
    def __init__(self, smtp_server, smtp_port, username, password, use_tls = True):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.use_tls = use_tls

        logger.debug("Initialized EmailSender with TLS=%s", use_tls)

    def send_email(self, subject, body, from_addr, to_addrs):
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = ", ".join(to_addrs)
        msg.set_content(body)

        try:
            if self.use_tls:
                context = ssl.create_default_context()
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls(context=context)
                    logger.debug("Started TLS connection with %s:%s", self.smtp_server, self.smtp_port)
                    server.login(self.username, self.password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.login(self.username, self.password)
                    server.send_message(msg)
            logger.info("Email successfully sent from %s to %s", from_addr, to_addrs)
        except Exception as e:
            logger.error("Failed to send email: %s", e, exc_info=True)

def get_env_variable(
    var_name: str,
    default: Optional[str] = None,
    required: bool = True,
    parse_int: bool = False,
) -> Optional[Union[str, int]]:
    value = os.getenv(var_name, default)
    if required and not value:
        logger.error("Environment variable %s is not set.", var_name)
        sys.exit(1)

    if parse_int and value:
        try:
            value = int(value)
        except ValueError:
            logger.error("Environment variable %s must be an integer. Got '%s' instead.", var_name, value)
            sys.exit(1)

    return value

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler()
        ],
    )

    smtp_server = get_env_variable("SMTP_HOSTNAME")
    smtp_port = get_env_variable("SMTP_PORT", default="587", parse_int=True)
    username = get_env_variable("SMTP_USERNAME")
    password = get_env_variable("SMTP_PASSWORD")

    email_sender = EmailSender(smtp_server, smtp_port, username, password, use_tls=True)

    subject = "Привет от EmailSender"
    body = "Это тестовое письмо, отправленное с помощью класса EmailSender."
    from_addr = "nikitos.dev@example.io"
    to_addrs = ["nvnedu2120@gmail.com"]

    email_sender.send_email(subject, body, from_addr, to_addrs)
