ARG GO_VERSION=1.23.3

# Build stage
FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /app

RUN apk update && apk add --no-cache ca-certificates

COPY go.mod ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o load-balancer

# Final stage
FROM scratch AS final

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

COPY --from=builder /app/load-balancer /

EXPOSE 8090

ENTRYPOINT ["/load-balancer"]
