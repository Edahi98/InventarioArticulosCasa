from flask import Flask, g, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman

from src.agent.chat_agent import AgentChat
from src.backend import Backend
from src.errors.error_filtro import InstructionRejected
from src.services.gate_instruction import InstructionGate
from src.constantes.constantes_limites import (
    CHAT_LIMIT,
    DEFAULT_LIMITS,
    STORAGE_URI,
    TOO_MANY_REQUESTS,
    UPLOAD_LIMIT,
)
from src.constantes.constantes_seguridad import (
    CONTENT_SECURITY_POLICY,
    FRAME_OPTIONS,
    HSTS_MAX_AGE,
    PERMISSIONS_POLICY,
    REFERRER_POLICY,
)
from src.constantes.constantes_validacion import MAX_UPLOAD_BYTES
from src.decorators.decorator_dto_validator import DtoValidator
from src.decorators.decorator_jwt_required import JwtRequired
from src.dtos.dto_chat import ChatDto
from src.dtos.dto_upload import UploadDto
from src.services.verifier_jwt import TokenVerifier
from src.utilerias.util_codec import Codec


class ApiServer:
    """
    Flask con JWT del backend, cabeceras de seguridad, DTO y límite por IP:
    /health (público), /chat (agente + fichas) y /upload (ambos exigen el token).
    """

    def __init__(
        self, chat: AgentChat, api: Backend, verifier: TokenVerifier, gate: InstructionGate, force_https: bool = False
    ) -> None:
        self._chat = chat
        self._gate = gate
        self._api = api
        self._verifier = verifier
        self.app = Flask(__name__)
        self.app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES + 1024
        self._talisman = Talisman(
            self.app,
            force_https=force_https,
            frame_options=FRAME_OPTIONS,
            content_security_policy=CONTENT_SECURITY_POLICY,
            referrer_policy=REFERRER_POLICY,
            permissions_policy=PERMISSIONS_POLICY,
            strict_transport_security_max_age=HSTS_MAX_AGE,
        )
        self._limiter = Limiter(
            get_remote_address,
            app=self.app,
            default_limits=DEFAULT_LIMITS,
            storage_uri=STORAGE_URI,
            headers_enabled=True,
        )
        self.app.register_error_handler(429, self.too_many_requests)
        self.app.register_error_handler(413, self.too_large)
        health = self._limiter.exempt(self._talisman(force_https=False)(self.health))
        self.app.add_url_rule("/health", view_func=health, methods=["GET"])
        self.app.add_url_rule("/chat", view_func=self._limiter.limit(CHAT_LIMIT)(self.chat), methods=["POST"])
        self.app.add_url_rule("/upload", view_func=self._limiter.limit(UPLOAD_LIMIT)(self.upload), methods=["POST"])

    @staticmethod
    def health():
        return jsonify({"status": "ok"})

    @JwtRequired.endpoint
    @DtoValidator.json(ChatDto)
    def chat(self, dto: ChatDto):
        try:
            self._gate.review(f"api:{g.auth['sub']}", dto.message)
        except InstructionRejected as rejected:
            return jsonify({"error": str(rejected)}), rejected.status
        reply, images = self._chat.ask(dto.message)
        return jsonify({"reply": reply, "images": [Codec.to_base64(img) for img in images]})

    @JwtRequired.endpoint
    @DtoValidator.upload(UploadDto)
    def upload(self, dto: UploadDto):
        return jsonify({"url": self._api.upload_image(dto.data, dto.filename)})

    def too_many_requests(self, error):
        return jsonify({"error": TOO_MANY_REQUESTS}), 429

    def too_large(self, error):
        return jsonify({"error": "El archivo supera el tamaño máximo permitido."}), 413
