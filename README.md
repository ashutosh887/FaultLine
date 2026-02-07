# FaultLine

**Root-cause analysis for AI decisions.**

Flight recorder + forensics engine for agentic / AI-driven systems. Capture every step, then produce an evidence-backed incident report: timeline → root cause → contributing factors → fixes.

---

## Architecture

```mermaid
flowchart LR
  subgraph SDK
    A[Agent / App]
  end
  subgraph Web
    B[POST /api/ingest]
    C[GET /api/runs]
    D[GET /api/runs/:id/report]
  end
  subgraph Redis
    Q[BullMQ Queue]
  end
  subgraph Worker
    W[Forensics Worker]
  end
  A -->|events| B
  B -->|enqueue| Q
  Q --> W
  W -->|verdict + graph| D
  C --> D
```

---

## Monorepo

- **apps/web** — Next.js (Ingest API + Report UI)
- **apps/worker** — BullMQ worker (forensics pipeline)
- **packages/sdk** — instrumentation SDK
- **packages/shared** — event schemas + shared types

---

## Quick start

```bash
npm install
cp .env.example .env
```

Edit `.env`. Then:

```bash
docker compose up -d
npm run build
npm run dev:web
```

In another terminal:

```bash
npm run dev:worker
```

- **UI:** http://localhost:3000
- **Runs:** http://localhost:3000/runs

Each app has its own `.env.example`; copy to `.env` where needed.

## Demo Setup

After starting services, seed demo data:

```bash
npm run seed
```

This creates two demo traces:

- `demo-bad-run`: Failed flight booking (tool error)
- `demo-fixed-run`: Successful flight booking

See `DEMO.md` for the 3-minute demo script.

## Gemini Integration

FaultLine uses **Gemini 2.0 Flash Experimental** for automated root-cause analysis. See `GEMINI_INTEGRATION.md` for details on how Gemini 3 features are used.
