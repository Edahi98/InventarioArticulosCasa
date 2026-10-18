import os

from src.constantes.constantes_agente import (
    LLAMA_CONTEXT_TOKENS,
    LLAMA_MISSING,
    LLAMA_TEMPERATURE,
    LLM_MAX_RETRIES,
    LLM_PROVIDER_LLAMA,
    LLM_PROVIDER_OPENROUTER,
    LLM_PROVIDER_UNKNOWN,
    LLM_REASONING,
    LLM_TIMEOUT_MS,
)
from src.services.adapter_llm_lazy import LazyLlm


class LlmAdapter:
    """
    Adaptador del modelo de lenguaje: según LLM_PROVIDER entrega el chat de OpenRouter (nube) o el de llama.cpp
    (local, con un modelo .gguf). Ambos son chats de LangChain, así que el grafo del agente no cambia.
    """

    @staticmethod
    def provider() -> str:
        """Proveedor de LLM_PROVIDER; si no está definido, openrouter cuando hay OPENROUTER_MODEL y llama si no."""
        default = LLM_PROVIDER_OPENROUTER if os.getenv("OPENROUTER_MODEL") else LLM_PROVIDER_LLAMA
        return (os.getenv("LLM_PROVIDER") or default).strip().lower()

    @classmethod
    def from_env(cls):
        """Crea el chat del proveedor que indica LLM_PROVIDER (ver `provider`)."""
        provider = cls.provider()
        builders = {LLM_PROVIDER_OPENROUTER: cls._openrouter, LLM_PROVIDER_LLAMA: cls._llama}
        if provider not in builders:
            raise ValueError(LLM_PROVIDER_UNKNOWN.format(provider=provider))
        return builders[provider]()

    @staticmethod
    def _openrouter():
        """Chat de OpenRouter con el modelo de OPENROUTER_MODEL y la clave de OPENROUTER_API_KEY."""
        from langchain_openrouter import ChatOpenRouter

        return ChatOpenRouter(
            model=os.environ["OPENROUTER_MODEL"],
            api_key=os.environ["OPENROUTER_API_KEY"],
            request_timeout=LLM_TIMEOUT_MS,
            max_retries=LLM_MAX_RETRIES,
            reasoning=LLM_REASONING,
        )

    @classmethod
    def _llama(cls) -> LazyLlm:
        """Chat de llama.cpp que carga el modelo hasta la primera interacción, no al arrancar."""
        return LazyLlm(cls._load_llama)

    @staticmethod
    def _load_llama():
        """Carga el modelo .gguf de LLAMA_MODEL_PATH; sus dependencias son del extra `local`."""
        try:
            from langchain_community.chat_models import ChatLlamaCpp
        except ImportError as error:
            raise RuntimeError(LLAMA_MISSING) from error
        return ChatLlamaCpp(
            model_path=os.environ["LLAMA_MODEL_PATH"],
            n_ctx=int(os.getenv("LLAMA_CONTEXT", LLAMA_CONTEXT_TOKENS)),
            n_gpu_layers=int(os.getenv("LLAMA_GPU_LAYERS", "0")),
            temperature=LLAMA_TEMPERATURE,
            verbose=False,
        )
