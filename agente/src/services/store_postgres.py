import threading

import psycopg
from psycopg.types.json import Jsonb

from src.constantes.constantes_estado import STATE_SCHEMA, STATE_TABLE


class StorePostgres:
    """
    Almacén clave-valor con caducidad en un esquema propio de Postgres (`agente`, aparte del `public` del
    backend). Reutiliza una conexión mientras la instancia de la función siga viva y la reabre si el pooler la
    cerró, para no pagar un handshake TLS por cada operación.
    """

    _TABLE = f"{STATE_SCHEMA}.{STATE_TABLE}"
    _BROKEN = (psycopg.OperationalError, psycopg.InterfaceError)

    def __init__(self, database_url: str) -> None:
        self._url = database_url
        self._conn: psycopg.Connection | None = None
        self._lock = threading.Lock()

    def get(self, namespace: str, key: str):
        """El valor vigente o None si no existe o ya caducó."""
        row = self._execute(
            f"SELECT value FROM {self._TABLE} WHERE namespace = %s AND key = %s AND expires_at > now()",
            (namespace, key),
        ).fetchone()
        return None if row is None else row[0]

    def put(self, namespace: str, key: str, value, ttl_seconds: float) -> None:
        self._execute(
            f"INSERT INTO {self._TABLE} (namespace, key, value, expires_at) "
            "VALUES (%s, %s, %s, now() + make_interval(secs => %s)) "
            "ON CONFLICT (namespace, key) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at",
            (namespace, key, Jsonb(value), ttl_seconds),
        )
        self._execute(f"DELETE FROM {self._TABLE} WHERE expires_at <= now()")

    def delete(self, namespace: str, key: str) -> None:
        self._execute(f"DELETE FROM {self._TABLE} WHERE namespace = %s AND key = %s", (namespace, key))

    def _execute(self, sql: str, params: tuple | None = None) -> psycopg.Cursor:
        """Ejecuta con la conexión viva; si estaba rota la reabre y reintenta una vez."""
        with self._lock:
            try:
                return self._connection().execute(sql, params)
            except self._BROKEN:
                self._conn = None
                return self._connection().execute(sql, params)

    def _connection(self) -> psycopg.Connection:
        """Conexión abierta (autocommit, sin sentencias preparadas por el pooler); crea el esquema al abrirla."""
        if self._conn is None or self._conn.closed:
            conn = psycopg.connect(self._url, autocommit=True, prepare_threshold=None)
            self._create(conn)
            self._conn = conn
        return self._conn

    def _create(self, conn: psycopg.Connection) -> None:
        conn.execute(f"CREATE SCHEMA IF NOT EXISTS {STATE_SCHEMA}")
        conn.execute(
            f"CREATE TABLE IF NOT EXISTS {self._TABLE} ("
            "namespace text NOT NULL, key text NOT NULL, value jsonb NOT NULL, expires_at timestamptz NOT NULL, "
            "PRIMARY KEY (namespace, key))"
        )
