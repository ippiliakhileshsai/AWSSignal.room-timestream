import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { requireUser } from "./middleware/auth.js";
import { askRouter } from "./routes/ask.js";
import { turnsRouter } from "./routes/turns.js";
import { getSql } from "./db/index.js";

const app = express();
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: "16kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/ask", requireUser, askRouter);
app.use("/api/turns", requireUser, turnsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

getSql()
  .then(() => app.listen(env.port, () => console.log(`[api] listening on http://localhost:${env.port}`)))
  .catch((err) => {
    console.error("[api] startup failed:", err);
    process.exit(1);
  });
