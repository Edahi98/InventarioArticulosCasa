from flask import Flask, jsonify, request

from src.agent.chat_agent import AgentChat
from src.backend import Backend
from src.utilerias.util_codec import Codec


class ApiServer:
    """Aplicación Flask: /health, /chat (agente + fichas en imagen) y /upload."""

    def __init__(self, chat: AgentChat, api: Backend) -> None:
        self._chat = chat
        self._api = api
        self.app = Flask(__name__)
        self.app.add_url_rule("/health", view_func=self.health, methods=["GET"])
        self.app.add_url_rule("/chat", view_func=self.chat, methods=["POST"])
        self.app.add_url_rule("/upload", view_func=self.upload, methods=["POST"])

    def health(self):
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
