FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml uv.lock* ./

RUN pip install uv && uv sync --frozen --no-dev

COPY main.py .
COPY src/ ./src/

CMD ["uv", "run", "python", "main.py", "server"]
