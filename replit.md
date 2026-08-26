# Movability Homepage + CMS

A premium mobility consulting homepage for Lars Christian Grødem-Olsen (movability.io), plus a full CMS admin panel for managing Blog Posts and Articles.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/movability-site run dev` — run the site (port 23387)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + cookie-parser
- DB (CMS): `node:sqlite` built-in (Node 24) — stored at `database.sqlite` in workspace root
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (ESM bundle)
- Frontend: React + Vite + Tailwind v4 + Framer Motion + Wouter + Tiptap rich text editor

## Where things live

- `artifacts/movability-site/src/pages/` — all page routes
  - `home.tsx` → `/` (V1)
  - `home-v2.tsx` → `/v2`
  - `home-v3.tsx` → `/v3`
  - `home-final.tsx` → `/final` (primary concept)
  - `admin/login.tsx` → `/admin/login`
  - `admin/list.tsx` → `/admin/blog`, `/admin/articles`
  - `admin/editor.tsx` → `/admin/blog/new`, `/admin/blog/:id`, etc.
- `artifacts/movability-site/src/components/tiptap-editor.tsx` — Tiptap rich text editor component
- `artifacts/movability-site/src/lib/admin-api.ts` — admin API client
- `artifacts/api-server/src/routes/admin.ts` — all CMS routes (auth + CRUD)
- `artifacts/api-server/src/lib/cms-db.ts` — SQLite setup and migrations
- `database.sqlite` — SQLite DB at workspace root (created on first run)

## CMS Access

- URL: `/admin/login`
- Credentials come from env vars only — there is no default password in production.
  Generate them with `node artifacts/api-server/hash-password.mjs 'new password'`,
  which prints `ADMIN_PASSWORD_HASH` (scrypt) and a `SESSION_SECRET`.
- In production the server refuses to boot without `SESSION_SECRET` (32+ chars) and
  `ADMIN_PASSWORD_HASH` (or `ADMIN_PASSWORD`). In development it falls back to the
  password `dev-password` and a per-boot random secret.
- Session: HMAC-SHA256 signed cookie (`cms_session`), 12h expiry, `HttpOnly`,
  `SameSite=Lax`, `Secure` in production.
- Signing out revokes every existing session (revocation watermark in `auth_state`);
  changing the password does the same on next boot.
- Login is rate limited per IP: 5 failures per 15 min, then escalating lockout.
- Uploads accept PNG/JPEG/GIF/WebP/AVIF only, detected from file bytes (not the
  declared MIME type or filename). SVG is rejected on purpose — it can carry script.
- See `.env.example` for the full list of settings.

## API Routes

All admin routes are under `/api/admin/*`:
- `POST /api/admin/login` — authenticate
- `POST /api/admin/logout` — clear session
- `GET  /api/admin/me` — check auth
- `GET/POST /api/admin/blog` — list / create blog posts
- `GET/PUT/DELETE /api/admin/blog/:id` — single blog post
- `GET/POST /api/admin/articles` — list / create articles
- `GET/PUT/DELETE /api/admin/articles/:id` — single article

## Architecture decisions

- Used Node.js 24 built-in `node:sqlite` instead of `better-sqlite3` because native compilation (node-gyp + Python) was unavailable in the Replit sandbox. `better-sqlite3` remains installed but unused.
- Admin auth uses stateless HMAC-SHA256 signed cookies — no session store needed.
- CMS DB is fully separate from the Postgres/Drizzle ORM setup (different concern, simpler).
- Tiptap editor uses `@tiptap/react` + StarterKit with custom toolbar.

## Product

- `/final` — primary homepage concept (video hero, marquee verticals, reports section, auto-rotating testimonials, articles slider, Lars story, dark CTA footer)
- `/admin` → CMS for managing Blog Posts and Articles with rich text editor

## User preferences

- Brand blue: `#4B5CF0`
- DM Sans font throughout the public site
- Lars photo: `@assets/Lars_photo_1778244138811.webp`

## Gotchas

- `node:sqlite` shows an ExperimentalWarning on startup — harmless, it's stable in Node 24.
- The `database.sqlite` file is created at the workspace root on first server start.
- esbuild externalizes `better-sqlite3` — don't import it (use `node:sqlite` instead).
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec.
