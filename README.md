# DTMS - Developer Team Management System

![CI Status](https://github.com/yourusername/dtms/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

## Overview

DTMS (Developer Team Management System) is an internal management platform designed for small developer teams (6–20 members). It operates entirely within a Local Area Network (LAN), requiring no internet connectivity. The system centralizes task tracking, reporting, financial management, time tracking, and knowledge sharing.

---

## Core Objectives

- Provide a self-contained team management system
- Enable offline-first operation within LAN environments
- Maintain simplicity in deployment and maintenance
- Ensure type safety and structured data flow across the stack

---

## Technology Stack

### Backend

- **Framework:** NestJS (TypeScript-based)
- **Database:** SQLite (file-based, no server required)
- **ORM:** Prisma (type-safe queries and schema management)
- **Authentication:** JSON Web Token (JWT) with Passport.js
- **Validation:** class-validator
- **Architecture:** Modular (feature-based separation)

### Frontend

- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **State Management:**
  - Zustand (client state)
  - TanStack Query (server state)
- **UI Library:** Material-UI (MUI) v5
- **Forms:** React Hook Form with Zod validation
- **Charts:** Recharts

---

## Architecture

### Backend Structure

- **Modules:** Each feature (users, tasks, reports, etc.) is isolated
- **Controller:** Handles HTTP requests
- **Service:** Contains business logic
- **DTOs (Data Transfer Objects):** Define request/response schemas
- **Common Layer:** Guards, decorators, shared interfaces
- **Prisma Layer:** Schema definition and migrations

### Frontend Structure

- **components/** — Feature-specific UI components
- **pages/** — Route-level views
- **services/** — API interaction layer
- **store/** — Zustand state stores
- **types/** — Shared TypeScript definitions
- **utils/** — Helper functions
- **common/** — Reusable UI elements

---

## Database Design

### Core Entities

- **User:** Authentication, profile, role (admin/member)
- **Report:** Daily submissions with approval workflow
- **Task:** Assignment, status tracking, financial attributes
- **TimeEntry:** Time logs linked to users and tasks
- **Transaction:** Income/expense records
- **BlogPost:** Knowledge sharing with tags and metadata

### Relationships

- Users ↔ Reports (one-to-many)
- Users ↔ Tasks (creator and assignee roles)
- Tasks ↔ TimeEntries
- Users ↔ Transactions
- Users ↔ BlogPosts

---

## Authentication & Authorization

### Flow

1. User registers → password hashed using bcrypt
2. User logs in → receives JWT
3. Frontend stores token in localStorage
4. Token attached to API requests via interceptor
5. Backend validates token using global guard

### Access Control

- Global JWT protection on all routes
- Public routes marked explicitly
- Role-based guards enforce permissions

---

## Features

### User Management

- Admin-only CRUD operations
- Role assignment and activation control
- Search and pagination support

### Report System

- Daily report submission by members
- Approval/rejection workflow by admins
- Status tracking (pending, approved, rejected)

### Task Management

- Kanban and list views
- Status workflow:
  - To Do → Assigned → In Progress → Review → Completed/Cancelled
- Task ownership and permission rules
- Integrated time tracking

### Time Tracking

- Manual and live timer modes
- Task association
- Aggregated summaries and distribution

### Financial Tracking

- Income and expense tracking
- Optional task linkage
- User-level and team-level views
- Trend visualization

### Blog System

- Internal knowledge sharing
- Categories and tagging
- Code snippets and external links
- View tracking and popularity sorting

### Dashboard

- Aggregated metrics (tasks, reports, time, finances)
- Trend charts (daily/weekly/monthly)
- Recent activity feed

---

## Data Flow

1. User interaction via UI
2. Form validation (Zod + React Hook Form)
3. API request via service layer (Axios)
4. Backend controller → service → Prisma
5. Database interaction
6. Response returned
7. React Query updates cache
8. UI re-renders accordingly

---

## Security

- Password hashing with bcrypt (10 salt rounds)
- JWT-based authentication
- Input validation on frontend and backend
- Prisma prevents SQL injection via parameterized queries
- CORS restricted to frontend origin
- Rate limiting to mitigate brute-force attacks
- Role-based authorization checks

---

## Deployment

### Environment

- LAN-only deployment
- No Docker required

### Services

- Backend: Node.js (port 3000)
- Frontend: Vite preview server (port 80)

### Backup Strategy

- Scheduled SQLite file backups
- Retention: last 30 days

---

## Development Workflow

### Backend part

1. Create new NestJS module
2. Implement controller and service
3. Define DTOs
4. Update Prisma schema if required

### Frontend part

1. Create service layer methods
2. Build feature components
3. Add route integration
4. Define TypeScript types

### Principles

- Strict type safety across stack
- Feature-based modularity
- Clear separation of concerns

---

## Limitations

- Designed for small teams only (6–20 users)
- SQLite limits concurrent write scalability
- No internet-based integrations
- Not suitable for distributed or cloud-native environments

---

## Summary

DTMS is a fully self-contained, type-safe, modular system for managing small developer teams within a LAN environment. It prioritizes simplicity, maintainability, and structured data flow while covering essential operational needs such as task management, reporting, financial tracking, and internal knowledge sharing.
