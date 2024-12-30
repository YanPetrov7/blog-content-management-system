FROM python:3.12.8-slim-bookworm

RUN apt-get update && \
    apt-get install -y --no-install-recommends clang gcc build-essential libssl-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ADD . ./opt/mail-service

WORKDIR /opt/mail-service

RUN uv sync --frozen

CMD ["uv", "run", "main.py"]
