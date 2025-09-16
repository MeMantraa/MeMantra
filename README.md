# MeMantra

> **Project Summary (≤1 paragraph)**  
> MeMantra is a guided affirmation app that helps users identify negative thought patterns, select or generate targeted mantras, and track what actually works for them over time. It blends CBT-inspired prompts with data-driven recommendations (what helped, when, and why) and delivers mantras via reminders and contextual triggers.

---

## Quick Links
- **Project Board:** <ADD LINK TO GITHUB PROJECT>
- **Wiki (Table of Contents):** <ADD LINK TO WIKI HOME>
- **Milestones (Iterations):** <ADD LINK TO /milestones>
- **Latest Release:** <ADD LINK AFTER FIRST TAG>
- **Issue Tracker:** <ADD LINK TO /issues>

---

## Release Demos
> Add video links each iteration (YouTube/Drive/Zoom).
- **Iteration 1 Demo:** _link coming soon_
- **Iteration 2 Demo:** _link coming soon_
- **Iteration 3 (Release 1) Demo:** _link coming soon_

---

## Developer Getting Started

### Prerequisites
- Node.js v20+  
- npm (bundled with Node)  
- MongoDB (local or cloud)  
- (Optional) Docker & Docker Compose

### Setup (Local)
```bash
# 1) Clone
git clone https://github.com/YFrancis10/MeMantra.git
cd MeMantra

# 2) Install
npm ci

# 3) Configure env
cp .env.example .env
# Fill in required variables (DB URI, JWT secret, etc.)

# 4) Run
npm run dev
