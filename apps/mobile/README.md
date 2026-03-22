# MeMantra Mobile App

---

## Setup

```bash
cd ../../   # repo root
pnpm install
# copy env template if needed
cp apps/mobile/.env.example apps/mobile/.env
```

> Always install dependencies from the repo root so Turbo can share caches across packages.

---

## Running the App

```bash
pnpm dev:mobile          # expo start
```

From the Expo Dev Tools:

- Press `i` for the iOS simulator.
- Press `a` for the Android emulator.
- Scan the QR code using the Expo Go app for physical devices.

If you prefer per-platform scripts:

```bash
pnpm --filter mobile ios
pnpm --filter mobile android
```

---

## Project Structure

```
apps/mobile
├─ App.tsx                 # Expo entry, splash animation
├─ app/index.tsx           # Navigation container (login/signup → tabs)
├─ components/             # Reusable UI widgets (carousel, buttons, tabs)
├─ context/ThemeContext.tsx
├─ screens/                # Login, SignUp, Home
├─ services/               # API clients (auth, mantra)
├─ utils/storage.ts        # AsyncStorage helpers for token/user data
├─ styles/ + global.css    # NativeWind config and shared styles
├─ test/                   # Jest + RTL suites
└─ assets/                 # Images (logo, etc.)
```

Refer to `docs/designs` and `docs/prototypes` for visual guidance when adding new screens.

---

## Available Scripts

| Command                                        | Description                                               |
| ---------------------------------------------- | --------------------------------------------------------- |
| `pnpm dev:mobile`                              | Expo dev server with Metro bundler.                       |
| `pnpm --filter mobile ios` / `android`         | Launch Expo pointing directly to platform simulators.     |
| `pnpm --filter mobile setup:android`           | Clean prebuild + Gradle clean (use before native builds). |
| `pnpm --filter mobile run:android` / `run:ios` | Run the native build via Expo.                            |
| `pnpm --filter mobile build`                   | `expo export` (web build).                                |
| `pnpm --filter mobile lint`                    | ESLint across the mobile workspace.                       |
| `pnpm --filter mobile typecheck`               | TypeScript check.                                         |
| `pnpm --filter mobile test`                    | Jest + Testing Library suites with coverage.              |

These can also be invoked through root scripts defined in `package.json`.

## Docker

The repo now includes a dedicated [`Dockerfile`](/c:/Users/Philippe/MeMantra/apps/mobile/Dockerfile) for the mobile app:

- `docker-compose.yaml` runs the mobile workspace in its own development container with Expo web.
- `docker-compose.staging.yml` and `docker-compose.prod.yml` build a static web artifact and serve it from its own runtime container.

Set `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env`, or use the staging/production example env files as templates for environment-specific builds.
