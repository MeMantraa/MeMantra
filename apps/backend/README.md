cd apps/backend

Commands:
pnpm dev - Start development server
pnpm build - Build for production
pnpm start - Run production build
pnpm typecheck - Check TypeScript types

1. Update .env with credentials
2. Run: pnpm dev (or from the root directory: pnpm --filter backend dev)
3. curl http://localhost:{process.env.PORT}/health
