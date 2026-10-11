from os import getenv

BACKEND_INTERNAL_URL = getenv("BACKEND_URL", "http://inventario-backend:4000")
BACKEND_PUBLIC_URL = getenv("PUBLIC_URL", "http://localhost:4000")

LOGIN_PATH = "/auth/login"
