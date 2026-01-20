# System Governance Admin Dashboard

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/react-18.x-61DAFB) ![Next.js](https://img.shields.io/badge/next.js-14.x-black) ![Status](https://img.shields.io/badge/status-active-brightgreen)

A comprehensive web-based admin dashboard for system governance, user role management, permission control, audit logging, and operational oversight. Built for organizations that need a centralized control plane for managing access, policy enforcement, and compliance tracking.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Key Modules](#key-modules)
- [API Integration](#api-integration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This dashboard gives administrators a unified interface to manage system-wide governance. Rather than bouncing between separate tools for users, permissions, and logs, everything lives in one place with consistent filtering, search, and export capabilities.

Designed with role separation in mind — super admins see everything, team admins see their scope, and read-only viewers can audit without risking accidental changes.

---

## Features

### User and Team Management
- Create, update, suspend, and delete user accounts
- Assign users to one or more teams
- Bulk import users via CSV
- User activity timeline showing logins, changes, and actions

### Role-Based Access Control (RBAC)
- Define custom roles with granular permission sets
- Assign roles at user or team level
- Permission inheritance with override capability
- Visual permission matrix for quick review

### Audit Logs
- Immutable log of every system action (who did what, when, from where)
- Filter by user, action type, date range, resource, and IP address
- Export logs to CSV or JSON for compliance reporting
- Real-time log streaming via WebSocket

### System Health
- Service status cards with uptime indicators
- Resource utilization charts (CPU, memory, request rate)
- Alert thresholds with configurable notification rules
- Incident history timeline

### Policy Management
- Create and version governance policies
- Assign policies to roles or teams
- Track policy acknowledgement by users
- Expiry and review date reminders

---

## Tech Stack

| Area | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| UI Library | React | 18.x |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui | Latest |
| Charts | Recharts | 2.x |
| State Management | Zustand | 4.x |
| Data Fetching | React Query (TanStack) | 5.x |
| Auth | NextAuth.js | 5.x |
| Tables | TanStack Table | 8.x |
| Form Handling | React Hook Form + Zod | Latest |
| Icons | Lucide React | Latest |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [npm](https://www.npmjs.com/) >= 9.0.0 or [pnpm](https://pnpm.io/) >= 8.0.0
- A backend API (REST or GraphQL) or mock server for local development

---

## Installation

```bash
git clone https://github.com/Salmanahmed1078/System-Governance-Admin-Dashboard.git
cd System-Governance-Admin-Dashboard
npm install
```

---

## Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Governance Dashboard

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Auth (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# OAuth providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## Running the App

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint

# Type check
npm run type-check
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Mock API (local development without a backend)

```bash
npm run mock-server
```

This starts a JSON Server instance at `http://localhost:5000` with seeded test data covering users, roles, logs, and policies.

---

## Project Structure

```
System-Governance-Admin-Dashboard/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Auth routes (login, etc.)
│   ├── dashboard/              # Main dashboard
│   ├── users/                  # User management
│   ├── roles/                  # Role and permission management
│   ├── audit/                  # Audit logs
│   ├── policies/               # Policy management
│   ├── system/                 # System health
│   └── layout.tsx
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── dashboard/              # Dashboard-specific widgets
│   ├── users/                  # User table, modals, forms
│   ├── roles/                  # Permission matrix, role editor
│   ├── audit/                  # Log viewer, filters
│   └── charts/                 # Recharts wrappers
├── lib/
│   ├── api/                    # API client and hooks
│   ├── auth/                   # Auth configuration
│   ├── store/                  # Zustand stores
│   └── utils/                  # Shared utilities
├── types/                      # TypeScript type definitions
├── public/
├── .env.example
└── README.md
```

---

## User Roles and Permissions

| Role | Users | Roles | Policies | Audit Logs | System Health |
|---|---|---|---|---|---|
| Super Admin | Full | Full | Full | Full | Full |
| Admin | Full | Read + Assign | Full | Full | Read |
| Team Admin | Own Team | Read | Read | Own Team | Read |
| Viewer | Read | Read | Read | Read | Read |

---

## Key Modules

### Permission Matrix

The permission matrix page shows a grid of every role vs. every resource action. Toggle permissions inline — changes are saved immediately with an optimistic UI update and rolled back on error.

### Audit Log Viewer

Logs are paginated with virtual scrolling for large datasets. Each log entry shows:
- Timestamp (local and UTC)
- Actor (user, system, or API key)
- Action type (create, update, delete, login, export)
- Resource type and ID
- Before/after values for update events
- IP address and user agent

### System Health

The health page polls a `/health` endpoint every 30 seconds and displays:
- Per-service status (up/degraded/down)
- Response time trend (sparkline)
- Error rate over the last hour
- Uptime percentage for the last 30 days

---

## API Integration

The dashboard expects a REST API with the following shape. Replace the base URL in `.env.local` to point at your backend.

**Users:** `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`

**Roles:** `GET /api/roles`, `POST /api/roles`, `PUT /api/roles/:id`

**Permissions:** `GET /api/permissions`, `PUT /api/roles/:id/permissions`

**Audit:** `GET /api/audit?page=1&limit=50&userId=&action=&from=&to=`

**System:** `GET /api/health`, `GET /api/metrics`

All authenticated endpoints expect a Bearer token: `Authorization: Bearer <token>`

---

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Set the same environment variables in the Vercel dashboard under Project Settings > Environment Variables.

### Docker

```bash
docker build -t governance-dashboard .
docker run -p 3000:3000 --env-file .env.local governance-dashboard
```

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Follow the existing component and naming conventions
3. Run `npm run lint` and `npm run type-check` before committing
4. Open a pull request with a clear description of the change

---

## License

MIT © Salman Ahmed
