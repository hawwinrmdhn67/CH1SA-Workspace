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

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **UI Components**: Shadcn UI
- **Validation**: Zod
- **Forms & State Management**: React Hook Form, Zustand
- **Tables & Data Handling**: TanStack Table
- **Tooling & DX**: Biome, Husky

## Getting Started

You can run this project locally by following these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/hawwinrmdhn67/CH1SA-Workspace.git
   ```
   
2. **Navigate into the project**
   ```bash
   cd CH1SA Workspace
   ```
   
3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the Go Backend**
   The workspace and CH1SA Assistant require the Go backend to run. Open a new terminal:
   ```bash
   cd backend
   go run ./cmd/server
   ```
   *(Ensure you have configured the `.env` inside the `backend` folder first. See `backend/README.md` for more details)*

5. **Start the Next.js development server**
   In your main terminal (root directory):
   ```bash
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

**hawwinrmdhn67**
