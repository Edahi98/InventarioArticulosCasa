class Chat:
    """Texto de respuesta del chat a partir de los resultados de las tools."""

    _TEXT_OF = {
        str: lambda data: data,
        list: lambda data: "" if data else "No se encontraron resultados.",
    }

    @classmethod
    def as_text(cls, data) -> str:
        """Texto de un resultado que no es ficha: strings tal cual y listas vacías como 'sin resultados'."""
        return cls._TEXT_OF.get(type(data), lambda d: "")(data)
