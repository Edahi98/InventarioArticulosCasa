class Valor:
    """Utilidades sobre valores que llegan opcionales desde el LLM."""

    @staticmethod
    def given(value) -> bool:
        """Cuenta como indicado si no es None ni un string en blanco (0 y False sí cuentan)."""
        return value is not None and not (isinstance(value, str) and not value.strip())
