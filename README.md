# MeMantra

> **Project Summary**  
> _MeMantra_ is a guided affirmation app that helps users identify negative thought patterns, select or generate targeted mantras, and track what actually works for them over time. It blends CBT-inspired prompts with data-driven recommendations (what helped, when, and why) and delivers mantras via reminders and contextual triggers.

---

# RELEASE 1

## Release 1 Presentation/Demo

[Release 1 Demo](https://drive.google.com/file/d/1zlSbubmLPZzgIaNzuCQcqTayMiFuy-BO/view)

## Release 1 Slides

[Google Slides](https://docs.google.com/presentation/d/1B_yGGz45U3VtYcofy7UCkZXOGydh3oSp_TiewtZS_YI/edit?slide=id.g2c6345cecf5_0_45#slide=id.g2c6345cecf5_0_45)

## Important files (Release 1)

### Top 5 files

| File path with clickable link                                                                                        | Purpose (1 line description)                                                     |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [apps/backend/src/app.ts](https://github.com/MeMantraa/MeMantra/blob/main/apps/backend/src/app.ts)                   | Configures Express app with security middleware, API routes, and error handling. |
| [apps/backend/database/init.sql](https://github.com/MeMantraa/MeMantra/blob/main/apps/backend/database/init.sql)     | Defines the complete PostgreSQL database schema.                                 |
| [apps/backend/src/db/index.ts](https://github.com/MeMantraa/MeMantra/blob/main/apps/backend/src/db/index.ts)         | Establishes the type-safe Kysely database connection.                            |
| [apps/backend/src/routes/index.ts](https://github.com/MeMantraa/MeMantra/blob/main/apps/backend/src/routes/index.ts) | Route registry that maps API resources to respective controllers                 |
| [docker-compose.yaml](https://github.com/MeMantraa/MeMantra/blob/main/docker-compose.yaml)                           | Orchestrates the development environment                                         |

### Top 5 Tests

| File path with clickable link                                                                                                                                                                             | Purpose (1 line description)                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [apps/backend/test/controllers/auth.controller.test.ts](https://github.com/YFrancis10/MeMantra/blob/doc-enhanced-documentation/apps/backend/test/controllers/auth.controller.test.ts)                     | Exercises register/login/me/googleAuth endpoints covering conflicts, hashing, and JWT issuance so account access stays reliable.                            |
| [apps/backend/test/controllers/recommendation.controller.test.ts](https://github.com/YFrancis10/MeMantra/blob/doc-enhanced-documentation/apps/backend/test/controllers/recommendation.controller.test.ts) | Validates every recommendation feed (basic, detailed, recent, stats) enforces auth, pagination, and error handling for personalized content.                |
| [apps/backend/test/controllers/mantra.controller.test.ts](https://github.com/YFrancis10/MeMantra/blob/doc-enhanced-documentation/apps/backend/test/controllers/mantra.controller.test.ts)                 | Confirms mantra discovery, search, and CRUD endpoints honor pagination, category filters, and not-found flows that power the mantra library.                |
| [apps/mobile/test/screens/login.test.tsx](https://github.com/YFrancis10/MeMantra/blob/doc-enhanced-documentation/apps/mobile/test/screens/login.test.tsx)                                                 | Guards the React Native login screen against empty submissions, surfaces backend errors, and wires Google sign-in plus navigation.                          |
| [apps/mobile/test/services/auth.service.test.ts](https://github.com/YFrancis10/MeMantra/blob/doc-enhanced-documentation/apps/mobile/test/services/auth.service.test.ts)                                   | Ensures the mobile auth service calls `/auth/login`, `/auth/register`, `/auth/me`, and `/auth/google` with proper payloads/headers and returns parsed data. |

---

## Quick Links

- **[Project Board](https://github.com/users/YFrancis10/projects/1)**
- **[Wiki](https://github.com/YFrancis10/MeMantra/wiki)**
- **Milestones (Iterations):** <ADD LINK TO /milestones>
- **Latest Release:** <ADD LINK AFTER FIRST TAG>
- **Issue Tracker:** <ADD LINK TO /issues>

---

## Continuous Integration

We use **GitHub Actions** to maintain quality and stability:

- **Build & Test:** Every push and pull request runs linting, type checks, and Jest/React Native tests.
- **E2E Testing:** Maestro workflows run on pull requests for UI flows.
- **Code Reviews:** All pull requests require at least one peer review before merging.
- **Branching Strategy:**
  - `story-[issue#]-description` (features)
  - `bug-[issue#]-description` (fixes)
  - `refactor-[issue#]-description` (refactors)
  - `devops-[issue#]-description` (infra/CI work)
- **Release Tags:** Each iteration is tagged (`Iteration1`, `Iteration2`, `Release1`) for traceability.

---

## Release Demos

Add video links (YouTube/Drive/Zoom) for each release:

- [Release 1 Demo](https://drive.google.com/file/d/1zlSbubmLPZzgIaNzuCQcqTayMiFuy-BO/view)
- **Release 2 Demo:** _coming soon_
- **Release 3 (Release 1) Demo:** _coming soon_
- **Final Release Demo:** _coming soon_

---

## Repository Layout

| Path                    | Notes                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `apps/mobile`           | Expo app (screens, components, services, NativeWind styles, Jest + Maestro tests).   |
| `apps/backend`          | Express API, Kysely models, validators, database docs, Jest tests.                   |
| `apps/backend/database` | SQL schema, reset scripts, and DB onboarding guide.                                  |
| `docs/`                 | Docker guides, prototypes, diagrams, and supplemental docs created for this request. |
| `maestro/`              | E2E scripts (`test.yaml`).                                                           |
| `docker-compose.yaml`   | Local stack (backend + Postgres + optional pgAdmin + containerized tests).           |
| `turbo.json`            | Pipeline definitions for `build`, `test`, `lint`, `dev`, etc.                        |

---

## Local Development Quick Start

### Prerequisites

- Node.js 22 LTS + pnpm `9.15.9` (install via `corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- Watchman (macOS) & Xcode CLT for iOS, Android SDK/Emulator for Android
- Expo CLI (`npm i -g expo` optional but handy)
- PostgreSQL (local or hosted Neon). Docker Desktop is recommended for running the Compose stack.
- Git + curl + openssl (for scripts/tests)

### Bootstrap the monorepo

```bash
git clone https://github.com/YFrancis10/MeMantra.git
cd MeMantra
pnpm install          # installs all workspaces via Turbo
cp apps/backend/.env.example apps/backend/.env
# fill in DB + OAuth credentials (see Environment Configuration below)
```

### Make sure Postgres is reachable

- **Local DB:** start PostgreSQL and load `apps/backend/database/init.sql`.
- **Hosted Neon:** paste the shared `DATABASE_URL` into `apps/backend/.env`.
- **Dockerized:** run `docker compose up -d` to boot backend + Postgres.

---

## App Runtimes

### Mobile app (Expo)

```bash
pnpm dev:mobile         # expo start
pnpm --filter mobile ios    # run on iOS simulator
pnpm --filter mobile android
pnpm --filter mobile test   # jest + RTL
pnpm --filter mobile typecheck
```

### Backend API

```bash
pnpm --filter backend dev      # nodemon + ts-node
pnpm --filter backend build
pnpm --filter backend start    # runs dist build
pnpm --filter backend test     # Jest + Supertest
pnpm --filter backend typecheck
```

---

## Tooling & Scripts

| Scope   | Command                                                                  | Description                                                  |
| ------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Root    | `pnpm dev`                                                               | Runs all `dev` pipelines (mobile + backend when configured). |
| Root    | `pnpm lint` / `pnpm test` / `pnpm typecheck`                             | Turbo fan-out across workspaces.                             |
| Backend | `pnpm --filter backend db:generate-types`                                | Runs `kysely-codegen` against the configured DB.             |
| Backend | `pnpm --filter backend build && pnpm --filter backend start`             | Production build.                                            |
| Mobile  | `pnpm --filter mobile setup:android && pnpm --filter mobile run:android` | Clean native build for Android.                              |
| Mobile  | `pnpm --filter mobile web`                                               | Launch web/devtools view.                                    |
| Repo    | `maestro test maestro/test.yaml`                                         | Run E2E smoke using the Maestro script.                      |

---

pnpm --filter backend dev # nodemon + ts-node
pnpm --filter backend build
pnpm --filter backend start # runs dist build
pnpm --filter backend test # Jest + Supertest
pnpm --filter backend typecheck

---

## Wiki Table of Contents

- [Meeting Minutes](https://github.com/YFrancis10/MeMantra/wiki/Meeting-Minutes)
- [Risks](https://github.com/YFrancis10/MeMantra/wiki/Risks)
- [User Consent & EULA](https://github.com/YFrancis10/MeMantra/wiki/User-Consent-&-EULA)
- [Legal & Ethical Issues](https://github.com/YFrancis10/MeMantra/wiki/Legal-&-Ethical-Issues)
- [Economic Model](https://github.com/YFrancis10/MeMantra/wiki/Economic-Model)
- [Budget](https://github.com/YFrancis10/MeMantra/wiki/Budget)
- [Personas](https://github.com/YFrancis10/MeMantra/wiki/Personas)
- [Diversity Statement](https://github.com/YFrancis10/MeMantra/wiki/Diversity-Statement)
- [Overall Architecture & Class Diagrams](https://github.com/YFrancis10/MeMantra/wiki/Overall-Architecture-&-Class-Diagrams)
- [Infrastructure & Tools](https://github.com/YFrancis10/MeMantra/wiki/Infrastructure-&-Tools)
- [Naming Conventions](https://github.com/YFrancis10/MeMantra/wiki/Naming-Conventions)
- [Testing Plan & Continuous Integration](https://github.com/YFrancis10/MeMantra/wiki/Testing-Plan-&-Continuous-Integration)
- [Security](https://github.com/YFrancis10/MeMantra/wiki/Security)
- [Performance](https://github.com/YFrancis10/MeMantra/wiki/Performance)
- [Deployment Plan & Infrastructure](https://github.com/YFrancis10/MeMantra/wiki/Deployment-Plan-&-Infrastructure)
- [Missing Knowledge & Independent Learning](https://github.com/YFrancis10/MeMantra/wiki/Missing-Knowledge-&-Independent-Learning)
- [Iteration & Release Notes](https://github.com/YFrancis10/MeMantra/wiki/Iteration-&-Release-Notes)
- [Overall Summary](https://github.com/YFrancis10/MeMantra/wiki/Overall-Summary) _(later in project)_
- [Velocity & Contractor Estimate](https://github.com/YFrancis10/MeMantra/wiki/Velocity-&-Contractor-Estimate) _(later in project)_
- [Retrospective](https://github.com/YFrancis10/MeMantra/wiki/Retrospective)
- [Breakdown by Individual](https://github.com/YFrancis10/MeMantra/wiki/Breakdown-by-Individual)
- [Designs & Mockups](https://github.com/YFrancis10/MeMantra/wiki/Designs-&-Mockups)

