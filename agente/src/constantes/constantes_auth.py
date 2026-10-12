JWKS_PATH = "/.well-known/jwks.json"
JWT_ALGORITHMS = ["RS256"]
JWT_AUDIENCE = "inventario-agente"
DEFAULT_JWT_ISSUER = "inventario-backend"
JWT_LEEWAY_SECONDS = 10
JWKS_CACHE_SECONDS = 300
BEARER_PREFIX = "Bearer "
REQUIRED_CLAIMS = ["exp", "iss", "aud", "sub"]

MISSING_TOKEN = "Token de autenticación no proporcionado."
INVALID_TOKEN = "Token de autenticación inválido o expirado."
KEYS_UNAVAILABLE = "No se pudo verificar el token: el backend no entregó su clave pública."
