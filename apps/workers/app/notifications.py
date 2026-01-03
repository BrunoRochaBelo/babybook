import asyncio
import logging
import os
from typing import Any

from jinja2 import Environment, FileSystemLoader

try:
    import resend
except ImportError:
    resend = None

logger = logging.getLogger(__name__)

# Configuração Jinja2 - Path relativo ao CWD (raiz do worker)
TEMPLATE_DIR = os.getenv("WORKER_TEMPLATES_DIR", "apps/workers/templates")
# Fallback to local 'templates' if running from inside apps/workers without subfolder context
if not os.path.exists(TEMPLATE_DIR) and os.path.exists("templates"):
    TEMPLATE_DIR = "templates"

env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


async def process_notification_job(payload: dict[str, Any], metadata: dict[str, Any]) -> None:
    logger.info("Processing notification job: %s", payload)

    channel = payload.get("channel")
    if channel == "email":
        await _send_email(payload)
    else:
        logger.warning("Unsupported notification channel: %s", channel)


async def _send_email(payload: dict[str, Any]) -> None:
    to = payload.get("to")
    template_name = payload.get("template")
    context = payload.get("context", {})

    if not to or not template_name:
        raise ValueError("Missing 'to' or 'template' in payload")
    
    if resend is None:
        logger.error("Resend library not installed.")
        raise RuntimeError("Resend library missing")

    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        logger.error("RESEND_API_KEY not configured.")
        # We don't raise here to avoid retrying forever if key is missing? 
        # But for queue system, raising causes retry. 
        # If config is missing, it will always fail. 
        # Better to fail and let it DLQ or retry until config is fixed.
        raise RuntimeError("RESEND_API_KEY missing")

    resend.api_key = api_key

    try:
        template = env.get_template(f"{template_name}.html")
        html_content = template.render(**context)
    except Exception as e:
        logger.error("Template rendering failed: %s", e)
        raise e

    params = {
        "from": os.getenv("EMAIL_FROM", "Baby Book <oi@babybook.com>"),
        "to": to,
        "subject": _get_subject(template_name, context),
        "html": html_content,
    }

    # Resend SDK is synchronous, run in executor
    loop = asyncio.get_running_loop()
    try:
        await loop.run_in_executor(None, lambda: resend.Emails.send(params))
        logger.info("Email sent to %s (template: %s)", to, template_name)
    except Exception as e:
        logger.exception("Failed to call Resend API")
        raise e


def _get_subject(template_name: str, context: dict[str, Any]) -> str:
    if template_name == "guestbook_invite":
        inviter = context.get("inviter_name", "Alguém")
        child = context.get("child_name", "o bebê")
        return f"{inviter} convidou você para deixar uma mensagem no livro do(a) {child}"
    return "Nova notificação Baby Book"
