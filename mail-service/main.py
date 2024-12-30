import os
import sys
import ssl
import smtplib
import logging
import signal
import json
import threading
import pika

from email.message import EmailMessage
from pydantic_settings import BaseSettings
from typing import Optional, Union, List

logger = logging.getLogger(__name__)


class EmailSender:
    def __init__(
        self,
        smtp_server: str,
        smtp_port: int,
        username: str,
        password: str,
        use_tls: bool = True,
    ) -> None:
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.use_tls = use_tls

        logger.debug("Initialized EmailSender with TLS=%s", use_tls)

    def send_email(
        self, subject: str, body: str, from_addr: str, to_addrs: List[str]
    ) -> None:
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
                    logger.debug(
                        "Started TLS connection with %s:%s",
                        self.smtp_server,
                        self.smtp_port,
                    )
                    server.login(self.username, self.password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.login(self.username, self.password)
                    server.send_message(msg)
            logger.info("Email successfully sent from %s to %s", from_addr, to_addrs)
        except Exception as e:
            logger.error("Failed to send email: %s", e, exc_info=True)


class EmailConsumer:
    def __init__(
        self,
        amqp_url: str,
        exchange_name: str,
        exchange_type: str,
        queue_name: str,
        routing_keys: List[str],
        email_sender: EmailSender,
        prefetch_count: int = 1,
    ) -> None:
        self.amqp_url = amqp_url
        self.exchange_name = exchange_name
        self.exchange_type = exchange_type
        self.queue_name = queue_name
        self.routing_keys = routing_keys
        self.email_sender = email_sender
        self.prefetch_count = prefetch_count

        self.connection = None
        self.channel = None
        self.should_stop = False
        self.consume_thread = None

        logger.debug(
            "Initialized EmailConsumer for exchange '%s', queue '%s' with routing keys %s",
            self.exchange_name,
            self.queue_name,
            self.routing_keys,
        )

    def connect(self) -> None:
        parameters = pika.URLParameters(self.amqp_url)
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()

        self.channel.exchange_declare(
            exchange=self.exchange_name, exchange_type=self.exchange_type, durable=True
        )
        logger.debug(
            "Declared exchange '%s' of type '%s'",
            self.exchange_name,
            self.exchange_type,
        )

        self.channel.queue_declare(queue=self.queue_name, durable=True)
        logger.debug("Declared queue '%s'", self.queue_name)

        for rk in self.routing_keys:
            self.channel.queue_bind(
                exchange=self.exchange_name, queue=self.queue_name, routing_key=rk
            )
            logger.debug(
                "Bound queue '%s' to exchange '%s' with routing_key '%s'",
                self.queue_name,
                self.exchange_name,
                rk,
            )

        self.channel.basic_qos(prefetch_count=self.prefetch_count)
        logger.info(
            "Connected to RabbitMQ at %s, exchange: '%s', queue: '%s'",
            self.amqp_url,
            self.exchange_name,
            self.queue_name,
        )

    def start_consuming(self) -> None:
        if self.connection is None or self.channel is None:
            self.connect()

        self.consume_thread = threading.Thread(target=self._consume)
        self.consume_thread.start()
        logger.info("Started consuming thread")

    def _consume(self) -> None:
        try:
            for method_frame, properties, body in self.channel.consume(
                self.queue_name, inactivity_timeout=1
            ):
                if self.should_stop:
                    break
                if method_frame:
                    self.process_message(method_frame, properties, body)
        except Exception as e:
            logger.error("Error during consuming messages: %s", e, exc_info=True)
        finally:
            self.channel.close()
            self.connection.close()
            logger.info("RabbitMQ connection closed")

    def process_message(self, method_frame, properties, body):
       try:
           message = json.loads(body.decode())
           data = message.get("data", {})
           subject = data.get("subject")
           body_text = data.get("body")
           from_addr = data.get("from_addr")
           to_addrs = data.get("to_addrs")

           if not all([subject, body_text, from_addr, to_addrs]):
               logger.error("Invalid message format: %s", message)
               self.channel.basic_nack(
                   delivery_tag=method_frame.delivery_tag, requeue=False
               )
               return

           logger.debug("Received message: %s", message)
           self.email_sender.send_email(subject, body_text, from_addr, to_addrs)
           self.channel.basic_ack(delivery_tag=method_frame.delivery_tag)
       except json.JSONDecodeError as e:
           logger.error("Failed to decode JSON message: %s", e)
           self.channel.basic_nack(
               delivery_tag=method_frame.delivery_tag, requeue=False
           )
       except Exception as e:
           logger.error("Error processing message: %s", e, exc_info=True)
           self.channel.basic_nack(
               delivery_tag=method_frame.delivery_tag, requeue=True
           )

    def stop_consuming(self) -> None:
        logger.info("Stopping consumption...")
        self.should_stop = True
        if self.consume_thread and self.consume_thread.is_alive():
            self.consume_thread.join()
        logger.info("Consumption stopped")


# def get_env_variable(
#     var_name: str,
#     default: Optional[str] = None,
#     required: bool = True,
#     parse_int: bool = False,
# ) -> Optional[Union[str, int]]:
#     value = os.getenv(var_name, default)
#     if required and not value:
#         logger.error("Environment variable %s is not set.", var_name)
#         sys.exit(1)

#     if parse_int and value:
#         try:
#             value = int(value)
#         except ValueError:
#             logger.error("Environment variable %s must be an integer. Got '%s' instead.", var_name, value)
#             sys.exit(1)

#     return value


class Settings(BaseSettings):
    smtp_hostname: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    amqp_url: str
    exchange_name: str = "direct_exchange"
    queue_name: str = "email_queue"
    routing_key: str = "amqp.email"

    class Config:
        env_file = ".env"


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler()],
    )

    # # SMTP settings
    # smtp_server = get_env_variable("SMTP_HOSTNAME")
    # smtp_port = get_env_variable("SMTP_PORT", default="587", parse_int=True)
    # username = get_env_variable("SMTP_USERNAME")
    # password = get_env_variable("SMTP_PASSWORD")
    # # AMQP settings
    # amqp_url = get_env_variable("AMQP_URL")
    # exchange_name = get_env_variable("EXCHANGE_NAME", default="direct_exchange", required=False)
    # queue_name = get_env_variable("QUEUE_NAME", default="email_queue", required=False)
    # routing_key = get_env_variable("ROUTING_KEY", default="amqp.email", required=False)

    conf = Settings()
    exchange_type = "direct"

    email_sender = EmailSender(
        conf.smtp_hostname,
        conf.smtp_port,
        conf.smtp_username,
        conf.smtp_password,
        use_tls=True,
    )
    email_consumer = EmailConsumer(
        conf.amqp_url,
        conf.exchange_name,
        exchange_type,
        conf.queue_name,
        [conf.routing_key],
        email_sender,
    )

    def signal_handler(sig, frame):
        logger.info("Received signal %s, initiating graceful shutdown...", sig)
        email_consumer.stop_consuming()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        email_consumer.start_consuming()
        logger.info("EmailConsumer is running. Press Ctrl+C to exit.")
        # Keep the main thread alive to continue processing signals
        while True:
            signal.pause()
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt received, shutting down.")
        email_consumer.stop_consuming()
    except Exception as e:
        logger.error("An unexpected error occurred: %s", e, exc_info=True)
        email_consumer.stop_consuming()
        sys.exit(1)


if __name__ == "__main__":
    main()
