---
name: verify-saas-stack
description: Run verification health checks across backend API, database, and seeded user credentials when starting or checking session health.
---

# SaaS Stack Verification Workflow

When activated or requested, run the following verification steps:

1. **Check Backend Server Health:**
   - Verify port 5000 TCP listener status.
   - Run a HTTP test request to `http://127.0.0.1:5000/api/auth/login`.

2. **Verify User Seeding:**
   - Run `npx tsx scripts/seed-credentials.ts` or `npx tsx scripts/create-users.ts` if user database records need updating.

3. **Check Frontend Server:**
   - Ensure `cambliss-frontend` is running on `http://localhost:3000`.
