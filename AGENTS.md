# Cambliss SaaS Platform - Project Rules & Context

## Project Architecture
- **Monorepo / Platform Directory Structure:**
  - `cambliss-frontend`: Next.js 16 (React 19, Tailwind CSS) running on port `3000`.
  - `cambliss-backend`: Express + TypeScript + Prisma ORM (PostgreSQL) running on port `5000`.
  - `cambliss-cv-service`: Python FastAPI computer vision service.
  - `cambliss-marketplace`: Marketplace integrations and webhooks.

## Core Conventions & Rules
1. **Repository & Remotes:**
   - Active Git Remote: `https://github.com/cambliss/office-connect-full-product.git` on branch `main`.
   - Never reference or push to `office-connect-mvp.git`.

2. **Environment & Connections:**
   - Backend API URL: `http://127.0.0.1:5000` (mapped via Next.js rewrites/proxies).
   - Frontend URL: `http://localhost:3000`.
   - Database: PostgreSQL (`cambliss_db`) managed via Prisma.

3. **Seeded Test Accounts:**
   - `admin@camblissstudio.com` / `SecureAdminPassword123!` (Super Admin)
   - `bhaskeradv1@gmail.com` / `Embpython@2020` (Standard User)
   - `newadmin@camblissstudio.com` / `Password123!` (Admin)
   - `newuser@camblissstudio.com` / `Password123!` (Standard User - linked to `Cambliss Enterprise Demo` Org)

4. **Development Guidelines:**
   - Always verify dependencies in `node_modules` before diagnosing server startup issues.
   - When modifying backend users, ensure every non-superadmin user has an `organizationId` and membership role assigned to prevent `403 Forbidden` errors.
