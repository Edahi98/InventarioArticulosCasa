import os
import sys
from dotenv import load_dotenv

from src.infrastructure.http.base_client import BaseHttpClient
from src.infrastructure.http.auth_client import AuthHttpClient
from src.infrastructure.http.article_client import ArticleHttpClient
from src.infrastructure.http.category_client import CategoryHttpClient
from src.infrastructure.http.image_client import ImageHttpClient
from src.infrastructure.http.note_client import NoteHttpClient
from src.application.services.auth_service import AuthService
from src.application.services.article_service import ArticleService
from src.application.services.category_service import CategoryService
from src.application.services.image_service import ImageService
from src.application.services.note_service import NoteService
from src.application.services.search_service import SearchService
from src.agent.builder import build_agent

load_dotenv()


def _wire():
    backend_url = os.environ["BACKEND_URL"]
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2")

    http = BaseHttpClient(backend_url)

    article_client = ArticleHttpClient(http)
    category_client = CategoryHttpClient(http)
    note_client = NoteHttpClient(http)

    auth_service = AuthService(AuthHttpClient(http))
    article_service = ArticleService(article_client)
    category_service = CategoryService(category_client)
    note_service = NoteService(note_client)
    search_service = SearchService(article_client, category_client, note_client)
    image_service = ImageService(ImageHttpClient(http))

    username = os.getenv("INVENTARIO_USER", "")
    password = os.getenv("INVENTARIO_PASS", "")
    if username and password:
        auth_service.login(username, password)
        print("Sesión iniciada correctamente.")
    else:
        print("Sin credenciales (INVENTARIO_USER / INVENTARIO_PASS). Solicitudes sin auth.")

    agent = build_agent(
        article_service, category_service, note_service,
        search_service, image_service, ollama_url, ollama_model,
    )
    return agent, image_service


def run_server() -> None:
    from src.api.server import create_app
    agent, image_service = _wire()
    app = create_app(agent, image_service)
    port = int(os.getenv("PORT", "5000"))
    print(f"Servidor Flask escuchando en :{port}")
    app.run(host="0.0.0.0", port=port)


def run_cli() -> None:
    agent, _ = _wire()
    print("Agente de inventario listo. Escribe 'salir' para terminar.\n")
    while True:
        try:
            user_input = input("Tú: ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not user_input or user_input.lower() in ("salir", "exit", "quit"):
            break
        result = agent.invoke({"messages": [{"role": "user", "content": user_input}]})
        print(f"Agente: {result['messages'][-1].content}\n")


if __name__ == "__main__":
    mode = os.getenv("MODE", "cli")
    if "server" in sys.argv or mode == "server":
        run_server()
    else:
        run_cli()
