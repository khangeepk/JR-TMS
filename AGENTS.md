# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, Turbopack) + Prisma + PostgreSQL app — "JR Arcade TMS", a tenant management system. Package manager is **npm** (see `package-lock.json`). Standard scripts live in `package.json` (`dev`, `build`, `start`, `lint`, `db:push`).

### Database (required, non-obvious)
- The app requires PostgreSQL; `prisma/schema.prisma` uses Postgres arrays (`String[]`), so SQLite / the committed `dev.db` will NOT work.
- A **local Postgres 16** cluster is provisioned in the VM with a `jrtms` role/database. It is not started automatically — start it each session with:
  `sudo pg_ctlcluster 16 main start`
- Local dev credentials live in a gitignored `.env` at the repo root (`DATABASE_URL`/`DIRECT_URL` → `postgresql://jrtms:jrtms@127.0.0.1:5432/jrtms`, plus `NEXTAUTH_SECRET`/`NEXTAUTH_URL`). If `.env` is missing, recreate it with those vars.
- After a fresh DB, sync schema and seed the admin user: `npm run db:push` then `node scripts/create-admin.cjs`.
- Login credentials: username `admin`, password `admin123`.
- `test-db.js` contains committed live Supabase credentials pointing at the production DB — do NOT use it for local dev; use the local Postgres above.

### Running / testing
- Run the app with `npm run dev` (binds `0.0.0.0`, port 3000). This is the reliable path for local work.
- `npm run build` runs `prisma db push --accept-data-loss` (mutates the DB) and currently FAILS on a Next.js generated type-validator error for the `/admin` layout route — prefer `npm run dev` over `build` locally.
- `npm run lint` (eslint) reports many pre-existing errors/warnings unrelated to setup; the tooling works.
