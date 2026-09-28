# CH1SA Workspace

**CH1SA Workspace** is a personal productivity and workspace management application featuring a clean, modular design.

Built to be a minimal and flexible alternative to cluttered dashboards, CH1SA focuses strictly on what you need for managing your workspace and personal tasks efficiently.

## Features

- **Modern Tech Stack**: Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and Shadcn UI.
- **Responsive Design**: Fully responsive and mobile-friendly interface.
- **Customizable Themes**: Built-in support for light and dark modes with customizable theme presets.
- **Flexible Layouts**: Includes a collapsible sidebar and variable content widths.
- **Workspace Modules**: Productivity, Kanban Board, and Calendar.
- **Personal Modules**: Notes and File Manager.

## Modules

### Available
- **Default Dashboard**: Overview of your workspace.
- **Productivity**: Tools to track and manage your daily output.
- **Kanban Board**: Drag-and-drop task management.
- **Calendar**: Manage your schedule and events.
- **Notes**: Capture your thoughts and ideas.
- **File Manager**: Organize your documents and assets.
- **Profile & Settings**: Manage your personal account details.
- **Authentication**: Secure login and registration flows.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **UI Components**: Shadcn UI
- **Validation**: Zod
- **Forms & State Management**: React Hook Form, Zustand
- **Tables & Data Handling**: TanStack Table
- **Tooling & DX**: Biome, Husky

### Backend
- **Language**: Go
- **Framework**: Gin Web Framework
- **Database**: PostgreSQL
- **Migrations**: golang-migrate
- **AI Integration**: NineRouter / OpenAI Compatible APIs

## External APIs

This workspace integrates the following third-party APIs to enhance its functionality:

- **NineRouter / OpenAI Compatible**: Powers the CH1SA Assistant for AI-driven task management and conversational capabilities.
- **APIHariLibur_V2**: An open-source JSON API by *guangrei* used by the Calendar module to fetch and display Indonesian national holidays automatically.

## Getting Started

You can run this project locally by following these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/hawwinrmdhn67/CH1SA-Workspace.git
   ```
   
2. **Navigate into the project**
   ```bash
   cd CH1SA-Workspace
   ```
   
3. **Configure and Start the Backend**
   The workspace and CH1SA Assistant require the Go backend to run. Open a new terminal:
   ```bash
   cd backend
   ```
   *(Ensure you have configured the `.env` inside the `backend` folder first and run migrations/seeders. See `backend/README.md` for more details)*
   ```bash
   go run ./cmd/server
   ```

4. **Configure the Frontend Environment**
   Open another terminal for the frontend:
   ```bash
   cd frontend
   cp .env.example .env
   ```
   Ensure `.env` inside `frontend/` points to your backend:
   ```env
   # Konfigurasi Backend API
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

5. **Install Frontend Dependencies and Run**
   ```bash
   npm install
   npm run dev
   ```

Your app will be running at [http://localhost:3000](http://localhost:3000).

## Formatting and Linting

Format, lint, and organize imports using Biome:
```bash
npm run check:fix
```
> For more information on available rules, fixes, and CLI options, refer to the [Biome documentation](https://biomejs.dev/).

---

*