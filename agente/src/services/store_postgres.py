import threading

import psycopg
from psycopg.types.json import Jsonb

from src.constantes.constantes_estado import STATE_SCHEMA, STATE_TABLE


class StorePostgres:
    """
    Almacén clave-valor con caducidad en un esquema propio de Postgres (`agente`, aparte del `public` del
    backend). Abre una conexión por operación para funcionar en funciones serverless, donde no hay memoria
    compartida entre peticiones.
    """

    _TABLE = f"{STATE_SCHEMA}.{STATE_TABLE}"

    def __init__(self, database_url: str) -> None:
        self._url = database_url
        self._ready = False
        self._lock = threading.Lock()

    def get(self, namespace: str, key: str):
        """El valor vigente o None si no existe o ya caducó."""
        with self._connect() as conn:
            row = conn.execute(
                f"SELECT value FROM {self._TABLE} WHERE namespace = %s AND key = %s AND expires_at > now()",
                (namespace, key),
            ).fetchone()
        return None if row is None else row[0]

    def put(self, namespace: str, key: str, value, ttl_seconds: float) -> None:
        with self._connect() as conn:
            conn.execute(f"DELETE FROM {self._TABLE} WHERE expires_at <= now()")
            conn.execute(
                f"INSERT INTO {self._TABLE} (namespace, key, value, expires_at) "
                "VALUES (%s, %s, %s, now() + make_interval(secs => %s)) "
                "ON CONFLICT (namespace, key) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at",
                (namespace, key, Jsonb(value), ttl_seconds),
            )

    def delete(self, namespace: str, key: str) -> None:
        with self._connect() as conn:
            conn.execute(f"DELETE FROM {self._TABLE} WHERE namespace = %s AND key = %s", (namespace, key))

    def _connect(self) -> psycopg.Connection:
        """Conexión nueva (autocommit, sin sentencias preparadas por el pooler); crea el esquema la primera vez."""
        conn = psycopg.connect(self._url, autocommit=True, prepare_threshold=None)
        with self._lock:
            if not self._ready:
                self._create(conn)
                self._ready = True
        return conn

    def _create(self, conn: psycopg.Connection) -> None:
        conn.execute(f"CREATE SCHEMA IF NOT EXISTS {STATE_SCHEMA}")
        conn.execute(
            f"CREATE TABLE IF NOT EXISTS {self._TABLE} ("
            "namespace text NOT NULL, key text NOT NULL, value jsonb NOT NULL, expires_at timestamptz NOT NULL, "
            "PRIMARY KEY (namespace, key))"
        )
