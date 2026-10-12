from flask import Flask, jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from src.agent.chat_agent import AgentChat
from src.backend import Backend
from src.constantes.constantes_limites import (
    CHAT_LIMIT,
    DEFAULT_LIMITS,
    STORAGE_URI,
    TOO_MANY_REQUESTS,
    UPLOAD_LIMIT,
)
from src.utilerias.util_codec import Codec


class ApiServer:
    """Aplicación Flask con límite de peticiones por IP: /health, /chat (agente + fichas) y /upload."""

    def __init__(self, chat: AgentChat, api: Backend) -> None:
        self._chat = chat
        self._api = api
        self.app = Flask(__name__)
        self._limiter = Limiter(
            get_remote_address,
            app=self.app,
            default_limits=DEFAULT_LIMITS,
            storage_uri=STORAGE_URI,
            headers_enabled=True,
        )
        self.app.register_error_handler(429, self.too_many_requests)
        self.app.add_url_rule("/health", view_func=self._limiter.exempt(self.health), methods=["GET"])
        self.app.add_url_rule("/chat", view_func=self._limiter.limit(CHAT_LIMIT)(self.chat), methods=["POST"])
        self.app.add_url_rule("/upload", view_func=self._limiter.limit(UPLOAD_LIMIT)(self.upload), methods=["POST"])

    @staticmethod
    def health():
        return jsonify({"status": "ok"})

    def chat(self):
        message = (request.get_json(silent=True) or {}).get("message", "").strip()
        if not message:
            return jsonify({"error": "Campo 'message' requerido."}), 400

        reply, images = self._chat.ask(message)
        return jsonify({"reply": reply, "images": [Codec.to_base64(img) for img in images]})

    def upload(self):
        if "image" not in request.files:
            return jsonify({"error": "Campo 'image' requerido."}), 400
        file = request.files["image"]
        return jsonify({"url": self._api.upload_image(file.read(), file.filename or "image.jpg")})

    def too_many_requests(self, error):
        return jsonify({"error": TOO_MANY_REQUESTS}), 429
