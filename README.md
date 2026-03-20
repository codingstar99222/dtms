# DTMS - Developer Team Management System

[![DTMS CI Pipeline](https://github.com/codingstar99222/dtms/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/codingstar99222/dtms/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

## 📄 Overview

DTMS (Developer Team Management System) is an internal management platform designed for small developer teams (6–20 members). It operates entirely within a Local Area Network (LAN), requiring no internet connectivity. The system centralizes task tracking, reporting, financial management, time tracking, and knowledge sharing.

---

## 🎯 Core Objectives

- Provide a self-contained team management system
- Enable offline-first operation within LAN environments
- Maintain simplicity in deployment and maintenance
- Ensure type safety and structured data flow across the stack

---

## ⚙️ Technology Stack

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

## 🏗️ Architecture

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

## 🗄️ Database Design

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

## 🔐 Authentication & Authorization

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

## 🧩 Features

### User Management

- Admin-only CRUD operations
- Role assignment and activation control
- Search and pagination support

### Report System

- Daily report submission by members
- Approval/rejection workflow by admins
- Status tracking (pending, approved, rejected)

### Task Management

- Role-based workflow: Admins create/assign tasks, members work on them
- Kanban board (members): To Do → In Progress → Review → Completed/Cancelled
- Admin table view: Full CRUD with filters for status, priority, assignee
- Permission rules:
  - Admins: Full control (create, edit, assign, delete any task)
  - Members: Start, review, complete, cancel own tasks; delete own completed/cancelled only
- Unassigned tracking: Admin dashboard shows count of unassigned tasks
- Time tracking: Hours logged when completing tasks

### Time Tracking

- Manual and live timer modes
- Task association
- Aggregated summaries and distribution

### Financial Tracking

- **Income-only system** (expense tracking reserved for future)
- **Admin-only entry**: Admins create income records for members
- **Member view**: Members see their own income history
- **Key fields**:
  - **Source**: Client/company name (free text)
  - **Payment Method**: Free text (e.g., Bank Transfer, Payoneer, Crypto)
  - **Amount**: Numeric value with currency formatting
  - **Description**: Work or payment details
  - **Date**: Payment date (YYYY-MM-DD)
- **Admin features**:
  - Full CRUD operations on all income records
  - Filter by date range and source
  - View total income across all members
  - Top 3 earners leaderboard
- **Dashboard integration**: Income trends and top performers shown in main dashboard

### Blog System

- **Internal knowledge sharing**: Team members share tutorials, tips, and experiences
- **Categories**: Tutorial, Tip, Resource, Code Snippet, Experience
- **Tagging**: Multiple tags per post for better organization
- **Code snippets**: Dedicated field with monospace formatting
- **External links**: Optional URL field for resources
- **Permission rules**:
  - **Members**: Create, edit, and delete their own posts
  - **Admins**: Full CRUD access to all posts
- **Organization**:
  - Search by title, content, or tags
  - Filter by category
  - Sort by newest/oldest
- **Clean UI**: Card-based grid layout with action icons (Edit/Delete for owners, View for all)
- **No view tracking**: Removed view counts and popularity features for simplicity

### Dashboard

- Aggregated metrics (tasks, reports, time, finances)
- Trend charts (daily/weekly/monthly)
- Recent activity feed

---

## 🔄 Data Flow

1. User interaction via UI
2. Form validation (Zod + React Hook Form)
3. API request via service layer (Axios)
4. Backend controller → service → Prisma
5. Database interaction
6. Response returned
7. React Query updates cache
8. UI re-renders accordingly

---

## 🛡️ Security

- Password hashing with bcrypt (10 salt rounds)
- JWT-based authentication
- Input validation on frontend and backend
- Prisma prevents SQL injection via parameterized queries
- CORS restricted to frontend origin
- Rate limiting to mitigate brute-force attacks
- Role-based authorization checks

---

## ⏰ Date & Time Handling

DTMS uses a **strict, timezone-safe approach** for all date/time operations:

### Calendar Dates (Reports, Deadlines)

- **Stored as strings** in `YYYY-MM-DD` format (e.g., `"2026-03-19"`)
- **Never** converted to Date objects in the database
- **Display** by parsing the string directly (no timezone conversion)
- **Comparisons** use string comparison (works because of YYYY-MM-DD format)

### Timestamps (Time Tracking, Approvals, Audits)

- **Stored as UTC** `DateTime` in database
- **Generated** using `TimeService.now()` on the backend
- **Display** in user's local timezone using `formatDateTime()`

### Safety Rules

1. **No future reports** - Cannot submit reports for dates > today
2. **No duplicate dates** - One report per user per day
3. **String comparison** for date ranges (gte/lte work with YYYY-MM-DD)

### Adding New Modules with Dates

When adding a new feature that uses dates:

1. **If it's a calendar date** (like deadline, birthdate):
   - Store as `String` in Prisma schema
   - Use `TimeService` helpers for conversion
   - Frontend: send as `YYYY-MM-DD` string

2. **If it's a timestamp** (like createdAt, updatedAt):
   - Store as `DateTime` in Prisma schema
   - Use `TimeService.now()` to generate
   - Frontend: display with `formatDateTime()`

3. **Always use `TimeService`** - Never use `new Date()` directly

## 🚀 Deployment

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
