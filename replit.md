# Scripto Frame AI

An AI-powered anime character studio for creating characters, generating portraits and videos, and chatting with characters.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string. Clerk keys are provisioned through Replit-managed Clerk. Gemini-powered chat and generation routes use `GEMINI_API_KEY`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/anime-ai-studio` — React + Vite app and public assets
- `artifacts/api-server/src/routes` — conversations, image/video generation, text-to-speech, and billing routes
- `lib/api-spec/openapi.yaml` — source API contract; regenerate clients with the codegen command above
- `lib/db/src/schema` — Drizzle database schema

## Architecture decisions

- Keep the imported frontend and backend as separate artifacts/services in the pnpm workspace.
- Use the shared OpenAPI-generated client for conversation and history operations; streaming chat and media-generation requests retain their existing endpoint flow.
- Use Replit-managed Clerk for user authentication.

## Product

Users can create and edit anime characters, generate character images and videos, chat with characters, review conversation history, and adjust studio settings.

## User preferences

The user asked to import the public GitHub repository `theprogang35-ux/Scripto-frame-ai`.

## Gotchas

- Keep `/api` available on the API service for REST endpoints and the Clerk frontend proxy.
- Gemini-backed chat and media-generation features require a configured Gemini API key; billing also depends on the repository's Stripe connection flow.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
