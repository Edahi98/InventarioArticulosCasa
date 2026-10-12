class InstructionRejected(Exception):
    """La instrucción no se le pasa al agente: el mensaje se devuelve a la persona y `status` es el código HTTP."""

    def __init__(self, message: str, status: int) -> None:
        super().__init__(message)
        self.status = status


class DecisionsError(Exception):
    """La API de decisions respondió con algo que no se puede interpretar."""
