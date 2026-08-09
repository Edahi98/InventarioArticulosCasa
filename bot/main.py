import logging
import os
from dotenv import load_dotenv
from telegram.ext import ApplicationBuilder, MessageHandler, filters

from src.infrastructure.agent_client import AgentClient
from src.handlers.text_handler import build_text_handler
from src.handlers.photo_handler import build_photo_handler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

load_dotenv()


def main() -> None:
    token = os.environ["TELEGRAM_TOKEN"]
    agent_url = os.getenv("AGENT_URL", "http://localhost:5000")

    agent = AgentClient(agent_url)

    app = ApplicationBuilder().token(token).build()
    app.add_handler(MessageHandler(filters.PHOTO, build_photo_handler(agent)))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, build_text_handler(agent)))

    logging.getLogger(__name__).info("Bot iniciado. AGENT_URL=%s", agent_url)
    app.run_polling()


if __name__ == "__main__":
    main()
