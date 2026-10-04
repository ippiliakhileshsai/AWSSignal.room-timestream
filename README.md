# Signal Room — split into frontend + backend

```
signal-room/
├── frontend/   React + Vite + TanStack Router + Tailwind  (runs in the browser)
└── backend/    Express + TypeScript + Postgres/PGLite      (API + chatbot + DB)
```

## Run it

Two terminals:

```bash
# 1) backend  → http://localhost:3001
cd backend
cp .env.example .env        # add XAI_API_KEY for the LLM chatbot (optional)
npm install
npm run dev

# 2) frontend → http://localhost:5173   (proxies /api to the backend)
cd frontend
npm install
npm run dev
```

Production: `npm run build` in each folder. Serve `frontend/dist` as static files and
route `/api/*` to the backend (same origin keeps the cookie working).

## What lives where

### frontend/
| Path | What |
|---|---|
| `src/routes/*` | Pages: index, floor, room, ask, alert, method |
| `src/components/signal/*` | UI: shell, charts, plan, answer view, cursor… |
| `src/lib/signal/model.ts, store.ts` | Simulated 10-second sensor feed (runs in the browser) |
| `src/lib/signal/analyst.ts` | **Rule-based NLP chatbot** — answers known questions instantly from live room data |
| `src/api/client.ts` | **The only place that talks to the backend** (`/api/ask`, `/api/turns`) |

### backend/
| Path | What |
|---|---|
| `src/routes/ask.ts` | **LLM chatbot** (`POST /api/ask`) — fallback when the rule-based NLP doesn't know the question; calls xAI using `XAI_API_KEY` (key never reaches the browser) |
| `src/routes/turns.ts` | Saved Q&A history (`GET/POST /api/turns`), scoped per visitor |
| `src/middleware/auth.ts` | Anonymous per-browser identity (httpOnly cookie). **Swap real sign-in in here.** |
| `src/db/index.ts` | Postgres via `DATABASE_URL`, or embedded PGLite if unset; runs `migrations/*.sql` on start |
| `migrations/0002_signal.sql` | `signal_turns` table |

## How the chatbot flow works
1. User asks a question in the **frontend**.
2. `analyst.ts` (rule-based NLP) tries to answer from the live room data.
3. If it's unknown, the frontend calls `POST /api/ask` → **backend** asks the LLM.
4. Every answer is saved through `POST /api/turns`.

## What changed vs. the original zip
- The original was one TanStack Start app where server code was hidden inside
  `createServerFn(...)` calls. Those became real REST endpoints.
- The Grok-platform sign-in (better-auth, gate identity, preview bridge, PWA plugin)
  was **not** carried over — it is tied to that sandbox. The app now uses a simple
  cookie identity; the login page and sign-in gates were removed.
- Not copied (build output / tooling, not app code): `.grok/`, `.vercel/`, `screenshots/`,
  `attachments/`, `scripts/`, `AGENTS.md`, `package-lock.json`, `src/lib/app-data`,
  `src/lib/multiplayer`, `migrations/0001_auth.sql`.
