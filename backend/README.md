# CH1SA Assistant Backend

This is the backend service for the CH1SA Assistant, built with Go and PostgreSQL. It powers the conversational AI, workspace management, and the policy-based execution engine that safely modifies your workspace data based on AI intents.

## Tech Stack

- **Go 1.22+**: Core backend logic and HTTP server.
- **Gin Web Framework**: Fast and lightweight HTTP routing.
- **PostgreSQL**: Relational database for storing workspace entities (Tasks, Notes, Calendar, Files, Users).
- **NineRouter / OpenAI Compatible API**: LLM inference for the CH1SA conversational AI.
- **Golang Migrate**: Database schema migrations.

## Key Features

1. **AI Assistant Integration**: Connects with NineRouter / OpenAI compatible APIs to provide a contextual conversational experience.
2. **Policy Engine**: An intelligent validation layer (`INTENT → SCOPE → RISK → PLAN → POLICY → EXECUTION`) that ensures the AI cannot perform unauthorized or destructive actions without explicit user confirmation.
3. **Workspace Management API**: Full CRUD endpoints for Tasks (Kanban), Calendar Events, Notes, and a Virtual File System.
4. **Tool Calling**: Allows the AI to autonomously query the database and prepare workspace mutations.

## Getting Started

### Prerequisites

- Go (1.22 or newer)
- PostgreSQL (Running locally or via Docker)
- An API Key (NineRouter or other OpenAI-compatible providers)

### Configuration

Create a `.env` file in the root of the `backend` directory. You can copy the provided example:

```bash
cp .env.example .env
```

Ensure the following variables are set correctly:

```env
NINEROUTER_API_KEY=your_api_key_here
NINEROUTER_MODEL=my-combo
NINEROUTER_BASE_URL=http://localhost:20128/v1
PORT=8080
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
DATABASE_URL=postgres://postgres:password@localhost:5432/chisa?sslmode=disable
```

### Database Migrations

Before running the server, ensure your PostgreSQL instance is running and the database specified in `DATABASE_URL` is created.

We use `golang-migrate` to manage schema changes. If you haven't installed the CLI, you can run migrations manually or use the built-in migrate command:

**To create the tables (Up):**
```bash
go run ./cmd/migrate up
```

**To drop all tables (Down / Reset):**
```bash
go run ./cmd/migrate down
```

*(Note: Ensure your database matches the schema described in `migrations/000001_init_schema.up.sql`)*

### Database Seeding

To populate the database with an initial `admin` account and some dummy workspace data, you can use the built-in seed script. The script uses flags to determine what data to seed:

```bash
# Seed the admin user only (username: admin, password: admin123)
go run ./scripts/seed.go -admin

# Seed dummy workspace data (tasks, notes, folders) for the admin user
go run ./scripts/seed.go -dummy

# Seed both admin and dummy data at once
go run ./scripts/seed.go -all
```

### Running the Server

Start the backend server using the Go CLI:

```bash
go run ./cmd/server
```

The server will start on port `8080` (or the port defined in your `.env` file) and connect to the database.

## Architecture & Structure

- **`cmd/`**: Entry points for the application (`server` and `migrate`).
- **`scripts/`**: Utility and operational scripts (e.g., `seed.go` for database seeding).
- **`internal/`**: Core application logic.
  - **`assistant/`**: Handles the AI integration, conversational state, tool execution, and the Policy Engine.
  - **`models/`**: Go structs representing the database schema (Task, Note, Event, etc.).
  - **`tasks/`, `notes/`, `calendar/`, `files/`**: Domain-specific handlers and repositories.
- **`migrations/`**: SQL files containing the up/down schemas for PostgreSQL.

## Contributing

- Follow idiomatic Go guidelines.
- Ensure all AI tools and actions are properly gated by the confirmation Policy Engine. Destructive actions (like `delete_file` or `cancel_task`) must require explicit user approval.
