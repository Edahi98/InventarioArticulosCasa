from flask import Blueprint, request, jsonify
from ...application.services.image_service import ImageService

upload_bp = Blueprint("upload", __name__)
_image_service: ImageService


def init_upload(image_service: ImageService) -> None:
    global _image_service
    _image_service = image_service


@upload_bp.post("/upload")
def upload():
    if "image" not in request.files:
        return jsonify({"error": "Campo 'image' requerido."}), 400
    f = request.files["image"]
    url = _image_service.upload(f.read(), f.filename or "image.jpg")
    return jsonify({"url": url})
