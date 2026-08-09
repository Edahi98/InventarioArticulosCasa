import base64
import json
from dataclasses import dataclass
from typing import Callable
from flask import Blueprint, request, jsonify
from langchain_core.messages import ToolMessage
from langgraph.pregel import Pregel as CompiledGraph
from ...services.image_renderer import (
    render_articles, render_single_article,
    render_categories, render_single_category,
)

chat_bp = Blueprint("chat", __name__)
_agent: CompiledGraph


def init_chat(agent: CompiledGraph) -> None:
    global _agent
    _agent = agent


# ── Renderer registry ─────────────────────────────────────────────────────────

@dataclass
class _Renderer:
    match: Callable[[object], bool]
    render: Callable[[object], list[bytes]]


def _is_article(d: dict) -> bool:
    return isinstance(d, dict) and ("categoryId" in d or "needsRepair" in d)


def _is_category(d: dict) -> bool:
    return isinstance(d, dict) and "id" in d and "name" in d and not _is_article(d)


def _list_of(pred: Callable) -> Callable[[object], bool]:
    return lambda d: isinstance(d, list) and bool(d) and isinstance(d[0], dict) and pred(d[0])


_RENDERERS: list[_Renderer] = [
    _Renderer(_list_of(_is_article),   render_articles),
    _Renderer(_list_of(_is_category),  render_categories),
    _Renderer(_is_article,             lambda d: [render_single_article(d)]),
    _Renderer(_is_category,            lambda d: [render_single_category(d)]),
]


def _render(data: object) -> list[bytes]:
    for r in _RENDERERS:
        if r.match(data):
            return r.render(data)
    return []


# ── Pipeline ──────────────────────────────────────────────────────────────────

def _parse(content: str) -> object:
    try:
        return json.loads(content)
    except Exception:
        pass
    try:
        import ast
        return ast.literal_eval(content)
    except Exception:
        return content


def _process(messages) -> tuple[str, list[str]]:
    texts, images = [], []
    for msg in messages:
        if not isinstance(msg, ToolMessage):
            continue
        data = _parse(msg.content)
        rendered = _render(data)
        if rendered:
            images.extend(base64.b64encode(img).decode() for img in rendered)
        elif isinstance(data, str):
            texts.append(data)
        elif isinstance(data, list) and not data:
            texts.append("No se encontraron resultados.")
    reply = " ".join(texts) if texts and not images else ""
    return reply, images


@chat_bp.post("/chat")
def chat():
    body = request.get_json(silent=True) or {}
    message = body.get("message", "").strip()
    if not message:
        return jsonify({"error": "Campo 'message' requerido."}), 400

    result = _agent.invoke({"messages": [{"role": "user", "content": message}]})
    msgs = result["messages"]
    tool_msgs = [m for m in msgs if isinstance(m, ToolMessage)]

    reply, images = _process(msgs) if tool_msgs else (msgs[-1].content, [])
    return jsonify({"reply": reply, "images": images})
