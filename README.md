# FaultLine

**“Root-cause analysis for AI decisions.”**

---

Monorepo for FaultLine: flight-recorder + causal reconstruction for AI systems.

- **apps/web** — Next.js app (ingest API + forensic report UI)
- **apps/worker** — BullMQ worker (forensics pipeline, Gemini analysis)
- **packages/sdk** — Instrumentation SDK to emit trace events from your app/agent
- **packages/shared** — Shared types, event schemas, constants

## Quick start

```bash
# Install (use npm or pnpm)
npm install
# or: pnpm install

cp .env.example .env
# Edit .env (Redis, Postgres, R2/S3, Gemini API key)

# Optional: start Redis + Postgres + MinIO for local dev
docker compose up -d

# Build and run
npm run build
npm run dev:web          # Next.js on http://localhost:3000
# In another terminal:
npm run dev:worker       # BullMQ forensics worker (needs Redis)
```

- **Ingest API:** `POST http://localhost:3000/api/ingest` (body: `{ "events": [...] }`, optional `trace_id`).
- **Report UI:** http://localhost:3000 (home), http://localhost:3000/runs (run list).

Each app has its own `.env.example`; copy to `.env` and fill in values.
