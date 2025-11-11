# MeMantra

> **Project Summary**  
> _MeMantra_ is a guided affirmation app that helps users identify negative thought patterns, select or generate targeted mantras, and track what actually works for them over time. It blends CBT-inspired prompts with data-driven recommendations (what helped, when, and why) and delivers mantras via reminders and contextual triggers.

---

# RELEASE 1

## Release 1 Presentation/Demo
(insert link here when ready)

## Release 1 powerpoint slides

(make the google slides view-only and paste it here)

## Important files (Release 1)
### Top 5 files
  
| File path with clickable link | Purpose (1 line description) |
|------|------------|
|[apps/backend/src/app.ts](https://github.com/MeMantraa/MeMantra/blob/main/apps/backend/src/app.ts)|Configures Express app with security middleware, API routes, and error handling.|
|[apps/backend/database/init.sql](https://github.com/MeMantraa/MeMantra/blob/main/apps/backend/database/init.sql)|Defines the complete PostgreSQL database schema.|
|[apps/backend/src/db/index.ts](https://github.com/MeMantraa/MeMantra/blob/main/apps/backend/src/db/index.ts)|Establishes the type-safe Kysely database connection.|
|[apps/backend/src/routes/index.ts](https://github.com/MeMantraa/MeMantra/blob/main/apps/backend/src/routes/index.ts)|Route registry that maps API resources to respective controllers|
|[docker-compose.yaml](https://github.com/MeMantraa/MeMantra/blob/main/docker-compose.yaml)|Orchestrates the development environment|
### Top 5 Tests
| File path with clickable link | Purpose (1 line description) |
|------|------------|

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

- **Release 1 Demo:** _coming soon_
- **Release 2 Demo:** _coming soon_
- **Release 3 (Release 1) Demo:** _coming soon_
- **Final Release Demo:** _coming soon_

---

## Developer Getting Started

### Prerequisites

- Node.js v22 LTS
- pnpm (preferred) or npm
- Git & Expo CLI
- PostgreSQL (local or managed e.g., Supabase/Neon)
- (Optional) Docker & Docker Compose

### Setup (Local)

```bash
# 1) Clone repo
git clone https://github.com/YFrancis10/MeMantra.git
cd MeMantra

# 2) Install dependencies
pnpm i   # or npm ci

# 3) Configure env
cp .env.example .env
# Fill in required variables (DB URI, JWT secret, Firebase keys, etc.)

# 4) Run frontend
cd apps/mobile
pnpm run start

to run in production mode (only in android for now):
pnpm setup:android
pnpm run:android


```

### Setup (Local backend)

```bash
#MAKE SURE TO HAVE DATABASE SETUP (Check read me in backend/database)
# 1) Navigate to backend directory and create .env file with your database configuration
cd apps/backend

# 2) Install dependencies from root (if not already done so from frontend setup)
cd .. #to memantra root folder
pnpm install

# 3) Run backend
cd apps/backend
pnpm build
pnpm start


```

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
