# MeMantra

> **Project Summary**  
> *MeMantra* is a guided affirmation app that helps users identify negative thought patterns, select or generate targeted mantras, and track what actually works for them over time. It blends CBT-inspired prompts with data-driven recommendations (what helped, when, and why) and delivers mantras via reminders and contextual triggers.

---

## Quick Links
- **[Project Board](https://github.com/users/YFrancis10/projects/1)**
- **[Wiki (Table of Contents)](https://github.com/YFrancis10/MeMantra/wiki)**
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
