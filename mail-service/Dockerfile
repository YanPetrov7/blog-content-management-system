FROM python:3.12.8-alpine3.21

RUN apk update && \
    apk add --no-cache openssl ca-certificates

RUN update-ca-certificates

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ADD . ./opt/mail-service

WORKDIR /opt/mail-service

RUN uv sync --frozen

CMD ["uv", "run", "main.py"]
