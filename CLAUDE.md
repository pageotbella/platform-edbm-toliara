# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See also [AGENTS.md](AGENTS.md) (short, tool-agnostic summary of the rules below).

## Project

Web platform for EDBM Toliara (Economic Development Board of Madagascar) to publish and promote investment opportunities. The full functional spec (in French) is [projet-context.md](projet-context.md): roles, user journeys, opportunity workflow, dashboards, data model. Read the relevant section before implementing a feature. UI copy, enum values, and code comments are in French.

Four roles: **visiteur** (anonymous, browses published opportunities), **investisseur** (favorites, interest requests, dashboard), **agent** EDBM (manages opportunities and handles interest requests, with optional extra permissions), **admin** (users, roles, sectors, regions, audit logs). The role matrix is in section 7 of the spec.

Four spaces, all in the React client (`client/src/routes/index.tsx`): public portal (`/`, `/opportunites`, `/carte`, `/connexion`…), investor (`/investisseur`), agent EDBM (`/edbm`, open to agents and admins) and admin (`/admin`).

## Current state (read first)

The app is a port of the previous Next.js version (`E:\Stage\projet\edbm-platform-v1`, tRPC). Every screen and every API procedure has been ported; the v1 remains the reference for behavior.

- **API contract**: `client/src/features/*/api.ts` lists every endpoint the UI calls, with the response types in `client/src/types/index.ts`. Each one maps to a v1 tRPC procedure (`v1/src/server/api/routers/*.ts`) implemented in the matching `server/src/modules/*` module. When changing a response shape, update the module, `types/index.ts` and the consuming component together.
- **Existing database**: the local DB predates this repo's migrations. `drizzle/0000_baseline.sql` reproduces it exactly and is recorded as applied in `drizzle.__drizzle_migrations`. Generate later schema changes as new migrations on top of it. The seed data in `server/src/db/seed-data/*.json` was exported from that DB.

Update this section as pieces land, and delete it once the code matches the guide.

## Repository layout

npm monorepo with two independent packages (no Docker, no workspaces): a React SPA and an Express API. The root `package.json` only runs both together (`concurrently`).

```
edbm-platform/
├─ package.json               # dev / install:all
├─ client/                    # React + Vite + TypeScript SPA
│  ├─ components.json         # shadcn config
│  ├─ vite.config.ts          # alias @ → src, proxy /api → http://localhost:3000
│  └─ src/
│     ├─ main.tsx  index.css
│     ├─ lib/                 # utils (cn), api (axios), query (useApiMutation), auth-client, format, catalog-params…
│     ├─ config/              # constants (roles, statuses, labels)
│     ├─ routes/              # index.tsx (createBrowserRouter), protected-route.tsx
│     ├─ components/
│     │  ├─ ui/               # shadcn primitives
│     │  ├─ layouts/          # public-layout, site-header/footer, app-shell (private spaces), nav-config
│     │  └─ common/           # opportunity-card, status-badge, kpi-card, page-header, panel, pager…
│     ├─ features/            # one folder per module: api.ts, hooks.ts, schemas.ts, components/, pages/
│     │  ├─ auth/  opportunities/  map/  favorites/  interest-requests/
│     │  ├─ sectors/  regions/  documents/  notifications/
│     │  └─ users/  stats/  audit-logs/  settings/
│     ├─ pages/               # home, about, contact, not-found
│     └─ types/               # API response types
└─ server/                    # Express 5 + Drizzle + Better Auth
   ├─ drizzle.config.ts  drizzle/ (generated migrations)  uploads/ (git-ignored)
   └─ src/
      ├─ server.ts  app.ts
      ├─ config/              # env.ts (Zod-validated env), constants.ts
      ├─ db/                  # index.ts, seed.ts, schema/{auth,domain,index}.ts
      ├─ lib/                 # auth.ts, audit.ts, notify.ts, mailer.ts, email-templates.ts, permissions.ts, opportunity-workflow.ts, slugify.ts
      ├─ middlewares/         # auth.ts, validate.ts, error-handler.ts, upload.ts, rate-limit.ts
      ├─ modules/             # one folder per module: *.routes.ts, *.controller.ts, *.service.ts, *.schemas.ts
      │  └─ opportunities/ sectors/ regions/ favorites/ interest-requests/ documents/
      │     notifications/ users/ permissions/ settings/ stats/ audit-logs/
      ├─ routes/index.ts      # mounts every module router under /api
      ├─ scripts/make-admin.ts
      ├─ types/express.d.ts   # req.user typing
      └─ utils/http-error.ts
```

Path alias `@/*` → `client/src/*` in the client and `server/src/*` in the server (each package has its own tsconfig).

## Commands

```bash
# From the repo root
npm install && npm run install:all   # first install (root + server + client)
npm run dev                          # API on :3000 (tsx watch) + client on :5173 (Vite)

# Server (cd server, or add --prefix server)
npm run dev
npm run build                        # tsup → dist/
npm run start                        # node dist/server.js
npm run typecheck                    # tsc --noEmit
npm run db:generate                  # drizzle-kit: generate migration into server/drizzle
npm run db:migrate
npm run db:push                      # push schema directly (dev)
npm run db:studio
npm run db:seed                      # reference + demo data, idempotent (never updates existing rows)
npm run db:seed -- --no-demo         # reference data only (sectors, regions, contact)
npm run make-admin -- email@x.mg     # promote an existing user to admin

# Client (cd client)
npm run dev
npm run build                        # tsc -b && vite build (this is the type check)
npm run lint
npm run preview
```

No test framework is set up. There is no `docker-compose.yml`: PostgreSQL runs locally (or hosted) and is reached through `DATABASE_URL`.

Demo accounts created by the full seed: `admin@edbm.mg` / `Admin1234!`, `agent@edbm.mg` / `Agent1234!` (canPublish + canManageSectors), `agent2@edbm.mg` / `Agent1234!`, `investisseur@demo.mg` / `Invest1234!`. The current local DB no longer has these demo accounts: it holds three real accounts (one admin, one agent with canPublish + canManageSectors, one investor) whose e-mails receive the platform's mail, and every opportunity is attributed to the admin. Running the full seed would add the demo accounts back next to them; the seed doesn't reset existing rows.

Env vars in `server/.env` (validated by `server/src/config/env.ts`): `NODE_ENV`, `PORT` (3000), `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥ 32 chars), `BETTER_AUTH_URL` (`http://localhost:3000`), `CLIENT_URL` (`http://localhost:5173`, also the origin of every link in e-mails), `RESEND_API_KEY` (optional: without it e-mails are printed to the console), `MAIL_FROM` (sender; `onboarding@resend.dev` only delivers to the Resend account owner, so production needs a verified domain). The client needs no env var: it calls `/api` on its own origin.

## Stack and conventions

- **Client**: React 19 + Vite + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`, `@import "tailwindcss"` in `index.css`), shadcn/ui, React Router (`createBrowserRouter`), TanStack Query, Zustand, React Hook Form + Zod, axios, sonner, lucide-react. It is a client-only SPA: there is no server rendering, so no `"use client"` or Suspense-for-params constraints.
- **Server**: Node.js + Express 5 (async handler errors are caught automatically, no `try/catch` or `asyncHandler` needed), Drizzle ORM with the `postgres` driver, Better Auth, Zod, helmet, cors, morgan, multer.
- **Dev networking**: Vite proxies `/api` to the Express server, so the browser sees a single origin (no CORS or cross-site cookie issue). In production serve `client/dist` and the API from the same origin (`express.static` or a reverse proxy) and keep that property.
- **Database**: `server/src/db/index.ts` exports a singleton `db` with `casing: "snake_case"`: write camelCase column names in TS and Drizzle maps them to snake_case. Keep `casing` identical in `drizzle.config.ts` and `db/index.ts`.
- **Schema** lives in `server/src/db/schema/`:
  - `auth.ts`: Better Auth tables (`user`, `session`, `account`, `verification`). `user` has extra `role` (`investisseur | agent | admin`) and `status` (`actif | desactive`) text columns. User IDs are `text`; all domain tables use `uuid` PKs.
  - `domain.ts`: reference data (`sectors`, `regions` → `districts` → `communes`), `investorProfiles`, `agentPermissions` (per-agent flags `canPublish`, `canManageSectors`, `canManageRegions`), `opportunities` with `opportunityMedia` and `opportunityDocuments` (`isPublic=false` means logged-in users only), `favorites`, `interestRequests`, `notifications`, `auditLogs`, `opportunityViews`, plus the `settings` table (key/value, key `contact`).
  - Status enums are exported both as `const` arrays (`opportunityStatusValues`, `requestStatusValues`) and as `pgEnum`s. Reuse the arrays for Zod validation on the server instead of duplicating the literals. The client keeps its own copy in `client/src/config/constants.ts`: update both when a status changes.
  - Opportunity lifecycle: `brouillon → en_verification → validee → publiee → suspendue / archivee`. Only `publiee` opportunities are visible to the public.
  - Interest request lifecycle: `nouvelle → en_cours → contact_etabli → en_attente → traitee → cloturee`.
- **Auth** (`server/src/lib/auth.ts`): Better Auth with the Drizzle adapter, email/password, `trustedOrigins: [CLIENT_URL]`. `role` and `status` are `additionalFields` with `input: false` (can't be set at signup; `phone` is settable). A `databaseHooks.user.create.after` hook auto-creates the `investorProfiles` row, and a `databaseHooks.session.create.before` hook refuses sign-in for non-`actif` users. `cookieCache` is deliberately disabled so that deleting a user's sessions (deactivation, role change, password reset) cuts access immediately — don't enable it. The seed inserts users directly with `hashPassword` from `better-auth/crypto`. `requireEmailVerification` is on: sign-up opens no session, sign-in of an unverified user returns 403 `EMAIL_NOT_VERIFIED` and re-sends the link, and the link (rewritten to the client origin) lands on `/connexion?verifie=1` (`&error=…` if invalid) with the session open. Password reset mails link straight to the client page `/reinitialiser-mot-de-passe?token=…`, which calls `resetPassword`. Users inserted directly (seed, admin) must have `emailVerified: true` or they can't sign in.
  - The handler is mounted in `app.ts` with `app.all("/api/auth/*splat", toNodeHandler(auth))` **before** `express.json()` (Better Auth reads the raw body itself). Never move it below the JSON parser.
  - Client: `client/src/lib/auth-client.ts` (`createAuthClient` without `baseURL`, `inferAdditionalFields` for `role` / `status`; exports `signIn`, `signUp`, `signOut`, `useSession`).
- **Route protection is two-layer, and only the server layer is a security boundary**: the client `ProtectedRoute` (`client/src/routes/protected-route.tsx`) reads `useSession()` and redirects to `/connexion` (keeping `state.from`) or to `/` on a wrong role — UX only. Real enforcement is in Express middlewares (`server/src/middlewares/auth.ts`): `requireAuth` (loads the session with `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`, rejects non-`actif` users, sets `req.user`) and `requireRole("agent", "admin")` / `requirePermission(...)` on each route. Never rely on the client to hide an action.
- **API layering**: `routes` (path + middlewares) → `controller` (thin: reads `req`/`res`, calls the service) → `service` (Drizzle queries and business rules) → `*.schemas.ts` (Zod). Register each module router in `server/src/routes/index.ts`. Validate with `validate(schema, "body" | "query" | "params")`: the parsed body replaces `req.body`; parsed query/params go to `res.locals.query` / `res.locals.params` (`req.query` is read-only in Express 5). Throw `HttpError(status, message)`; `error-handler.ts` turns it into JSON `{ message }`. Paginated lists return `{ items, total, pageCount }`.
- **State-changing endpoints call `logAudit`** (`server/src/lib/audit.ts`). Notifications are created through `notify` / `notifyStaff` (`server/src/lib/notify.ts`); `notify(ids, n, { email: true })` also e-mails the active recipients, and `notifyStaff` always does. E-mails go through `sendMail` / `sendMailLater` (`server/src/lib/mailer.ts`, Resend, one message per recipient; `sendMailLater` never fails the request) with the templates of `server/src/lib/email-templates.ts` (escape every user-provided value, links built with `appUrl`). Sent today: verification, password reset, account created by an admin, interest request confirmation, request status/response updates, staff alerts (new request, opportunity to validate), and the public contact form (`POST /api/contact`, rate-limited, honeypot field `website`, sent to the contact settings e-mail with `replyTo` the visitor). Interest request status history is rebuilt from `audit_logs` (`interest.status` entries), so status changes must keep calling `logAudit`.
- **Opportunity cards**: `selectCards(db)` / `cardColumns` (`server/src/modules/opportunities/opportunity-card.ts`) is the shared select + joins for every card list (catalogue, home, favorites, map); `coverKey` is a subquery on `opportunity_media`.
- **Files**: uploads live in `server/uploads/` (never served statically) and are served by `GET /api/files/*key`, which looks the key up in `opportunity_documents` / `opportunity_media` and enforces access (unpublished → staff only, `isPublic=false` → logged-in only). Use `fileUrl(key)` from `client/src/lib/format.ts`. Uploads go through `POST /api/upload` (multer, staff only; extension + size + magic-byte check; random key; inserts the media/document row); deleting a row must also call `deleteUpload`.
- **Client data fetching**: one axios instance (`lib/api.ts`, `baseURL: "/api"`, `withCredentials: true`). Each feature has `api.ts` (raw calls) and `hooks.ts` (TanStack Query hooks; query keys start with the feature name, e.g. `["opportunities", filters]`). Hooks mirror the v1 tRPC calls: query hooks are `useX(input?, options?)` and mutation hooks `useX(options?)`, where `options` are TanStack options (`enabled`, `onSuccess`…). Mutations are built with `useApiMutation(fn, keysToInvalidate, options)` (`lib/query.ts`), which invalidates the related key prefixes before calling the caller's `onSuccess`. Axios errors are rewritten to `Error(message)` from the server's `{ message }`. The shared `QueryClient` (`lib/query-client.ts`) uses `staleTime: 60_000`.
- **Forms and validation**: React Hook Form + `zodResolver`; the schema sits in `features/<feature>/schemas.ts`. The server validates again with its own Zod schema (`modules/<module>/<module>.schemas.ts`); the two are not shared, so keep field names and rules aligned. Zod 4 syntax (`z.uuid()`, `z.email()`, `z.flattenError`). Optional number inputs need `setValueAs` to turn `""` into `undefined`.
- **Zustand** is for UI state only, if a piece of state ever needs to be shared across components (none does today: the sidebar sheet and wizard steps use local state). Server data stays in TanStack Query. Catalogue filters live in the URL (`useSearchParams`, helper in `client/src/lib/catalog-params.ts`) so that links are shareable — not in a store.
- **Private spaces** (`/investisseur`, `/edbm`, `/admin`): `ProtectedRoute roles={…} space={…}` (`client/src/routes/protected-route.tsx`) renders `AppShell` (sidebar + top bar; menus in `components/layouts/nav-config.ts`, entries with `perm` only shown once `GET /api/staff/me` confirms it) and redirects to `/connexion?next=…` without a session. Private screens are lazy-loaded routes (`routes/index.tsx`) so the public portal bundle stays small. Account pages (notifications, profile) are reusable by every role.
- **Agent space**: staff views live in `client/src/features/*/components/` and every view takes a `base` prop (default `/edbm`) so the admin space can mount the same screens with `base="/admin"`. Permissions « selon permission » come from `getPermissions` / `requirePermission` (`server/src/lib/permissions.ts`; admin = all) and are exposed to the UI by `GET /api/staff/me`. The opportunity lifecycle (allowed transitions, which ones need `canPublish`) is defined in `server/src/lib/opportunity-workflow.ts` and enforced by the status-change endpoint; the client only mirrors it to show/hide buttons. The opportunity update endpoint takes the full input object and sets missing optional fields to NULL. `interest_requests.internal_note` and `handledBy` are staff-only: investor endpoints pass rows through `forInvestor()`.
- **Admin space**: admin-only screens (dashboard, users, roles & permissions, audit log, settings) live in the `features/` folders of the matching modules; the other `/admin/*` pages mount the staff views with `base="/admin"`. Admin endpoints (`users`, `permissions`, `audit-logs`, `settings`, `stats`) use `requireRole("admin")`. Admins create accounts by inserting `user` + `account` (random, never-shared password) + `investorProfiles` directly, because `role` / `status` are `input: false` and cannot be set through `auth.api.signUpEmail`; the user then receives a « Définir mon mot de passe » link (a Better Auth `reset-password:<token>` verification value valid 72 h, re-sendable with `POST /api/users/:id/invite`). An admin can't change their own role or deactivate themselves. Audit action labels for display are in `client/src/features/audit-logs/audit-labels.ts`: add a label there when introducing a new `logAudit` action. Contact settings (`settings` table, key `contact`) feed the public header/footer through `GET /api/settings/contact`.
- **Constants and formatting**: labels and enums (statuses, roles, project types, tranches, default contact) in `client/src/config/constants.ts`; formatting helpers in `client/src/lib/format.ts`.
- **UI**: shadcn primitives are in `client/src/components/ui/`; add more with `npx shadcn@latest add <name>` from `client/`. Check `client/components.json` for the style: the previous version of the project used `base-nova`, built on **Base UI** (`@base-ui/react`), not Radix — keep the same style if components are ported. Icons: `lucide-react`. Charts: Recharts via `components/ui/chart.tsx`. Map: Leaflet / react-leaflet (import `leaflet/dist/leaflet.css`, set the marker icon explicitly). Toasts: sonner. Shared components (`StatusBadge`, `KpiCard`, `OpportunityCard`, `FavoriteButton`, `Pager`, `PageHeader`…) go in `components/common/`.

## Design references

`design/stitch_investmadagascar_edbm_platform_design/` (local temporary folder, git-ignored: it may be missing from a clone) contains HTML mockups and screenshots for each screen (public home, catalogue/map, opportunity detail, investor dashboard/favorites/requests, agent pipeline and opportunity form, admin screens). The design system is in `toliara_regional_investment_gateway/DESIGN.md`: Material-3-style color tokens (primary `#004225` deep green, secondary slate blue, tertiary brown) and Plus Jakarta Sans typography. The mockups are green, but the app follows the real EDBM charter (edbm.mg and its logo): purple. The shadcn CSS variables in `client/src/index.css` hold it (primary `#7a3f7a`, `primary-dark` `#4a2858`, `brand-light` `#ecc8e6` for accents on purple, logo gradient `#5d3b6e → #974d92` via the `.bg-brand-gradient` utility for large brand surfaces, secondary `#1f2937`, extra `ochre`, `surface-low`, `border-strong` colors, `shadow-card/hover/overlay`, `.label-caps`, `.tabular`, `.container-page` utilities). Use these tokens, never raw brand hex values (exceptions: Leaflet `divIcon` HTML and e-mail templates, which can't read CSS variables). Green stays only as a state color (success, active, public, completed step). The logo is `client/public/logo-edbm-96.png` (header) with favicons generated from the same image. Mockups contain decorative data with no backing field (IRR, payback, backups, SOC…); keep the layout but show real schema data only.
