from flask import Flask
from langgraph.pregel import Pregel as CompiledGraph

from ..application.services.image_service import ImageService
from .routes.chat import chat_bp, init_chat
from .routes.health import health_bp
from .routes.upload import init_upload, upload_bp


def create_app(agent: CompiledGraph, image_service: ImageService) -> Flask:
    app = Flask(__name__)

    init_chat(agent)
    init_upload(image_service)

    app.register_blueprint(health_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(upload_bp)

    return app
