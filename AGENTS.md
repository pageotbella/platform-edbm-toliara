# AGENTS.md

Guidance for AI coding agents working in this repository. The detailed project guide is [CLAUDE.md](CLAUDE.md); read it before changing code. The functional spec is [projet-context.md](projet-context.md).

## Stack

- `client/`: React + Vite + TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Zustand, React Hook Form + Zod.
- `server/`: Node.js + Express 5, Drizzle ORM, PostgreSQL, Better Auth, Zod.
- No Docker. PostgreSQL is reached through `DATABASE_URL` in `server/.env`. This is not a Next.js project: do not add `app/` routes, `proxy.ts`, tRPC or server components.

## Rules that matter

- UI copy, enum values and code comments are in French.
- Authorization is enforced on the server (`requireAuth`, `requireRole`, `requirePermission`). Client-side route guards are UX only.
- Validate every input with a Zod schema (`validate` middleware on the server, `zodResolver` in forms). Keep client and server schemas aligned.
- Every state-changing endpoint calls `logAudit`; add a display label in `client/src/features/audit-logs/audit-labels.ts` for each new action.
- Better Auth stays mounted before `express.json()`. `cookieCache` stays disabled. `role` and `status` stay `input: false`.
- Run database scripts from `server/` (`db:generate`, `db:migrate`, `db:seed`). Keep Drizzle `casing: "snake_case"` identical in `drizzle.config.ts` and `db/index.ts`.
- Server data goes through TanStack Query hooks (`features/<name>/hooks.ts`); Zustand is for UI state only; catalogue filters live in the URL.
- Show only real schema data in the UI, even when a design mockup contains decorative figures.
