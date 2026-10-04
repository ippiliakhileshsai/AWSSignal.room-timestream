import { Router } from "express";
import { z } from "zod";
import { env } from "../env.js";

const Input = z.object({
  question: z.string().trim().min(1).max(400),
  facts: z.string().trim().min(1).max(4000),
});

type AskResult = { ok: true; sentence: string; query: string } | { ok: false; error: string };

const SYSTEM_PROMPT =
  "You are the analyst in Signal Room, five spaces: Penthouse, Atelier, Conservatory, Farmhouse, Factory. Use only the facts. Never invent a reading or a sent email. If the question is outside these rooms and their measures, refuse in one sentence. Return JSON only with keys sentence and query. sentence is one or two short sentences, no emoji. query is one InfluxQL select against bucket estate-signal.";

export const askRouter = Router();

askRouter.post("/", async (req, res) => {
  const parsed = Input.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid question." } satisfies AskResult);
    return;
  }
  const { question, facts } = parsed.data;
  if (!env.xaiApiKey) {
    res.json({ ok: false, error: "The analyst is resting." } satisfies AskResult);
    return;
  }

  try {
    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.xaiApiKey}` },
      body: JSON.stringify({
        model: "grok-3",
        temperature: 0.2,
        max_tokens: 256,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Facts:\n${facts}\n\nQuestion: ${question}` },
        ],
      }),
    });
    if (!upstream.ok) {
      console.error(`[ask] upstream error: ${upstream.status}`);
      res.json({ ok: false, error: "The analyst could not answer just now." } satisfies AskResult);
      return;
    }
    const body = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = body.choices?.[0]?.message?.content?.trim() ?? "";
    const json = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    try {
      const out = JSON.parse(json) as { sentence?: string; query?: string };
      if (!out.sentence) {
        res.json({ ok: false, error: "Empty answer." } satisfies AskResult);
        return;
      }
      res.json({ ok: true, sentence: out.sentence.slice(0, 500), query: (out.query ?? "").slice(0, 400) } satisfies AskResult);
    } catch {
      res.json({ ok: false, error: "The analyst spoke out of format." } satisfies AskResult);
    }
  } catch (err) {
    console.error("[ask] upstream failed:", err);
    res.json({ ok: false, error: "The analyst could not answer just now." } satisfies AskResult);
  }
});
