# Stage 1: Build stage
FROM golang:1.27-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source files
COPY . .

# Build statically linked binaries with debug symbols stripped
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /app/bin/api ./cmd/api && \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /app/bin/migrate ./cmd/migrate && \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /app/bin/seed ./cmd/seed

# Stage 2: Minimal production runtime
FROM alpine:3.21 AS runner

# Install essential runtime tools (certificates, timezone data, curl for healthchecks)
RUN apk --no-cache add ca-certificates tzdata curl && \
    addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

# Copy compiled binaries, migration files, and entrypoint
COPY --from=builder /app/bin/api ./api
COPY --from=builder /app/bin/migrate ./migrate
COPY --from=builder /app/bin/seed ./seed
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Ensure executables have correct permissions and assign ownership to non-root user
RUN chmod +x ./docker-entrypoint.sh ./api ./migrate ./seed && \
    chown -R appuser:appgroup /app

USER appuser

ENV PORT=8080 \
    GIN_MODE=release

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

