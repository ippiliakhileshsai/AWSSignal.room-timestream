import { Router } from "express";
import { z } from "zod";
import { getSql } from "../db/index.js";

const TurnInput = z.object({
  question: z.string().trim().min(1).max(400),
  sentence: z.string().trim().min(1).max(800),
  query: z.string().max(500),
});

export const turnsRouter = Router();

turnsRouter.post("/", async (req, res, next) => {
  try {
    const data = TurnInput.safeParse(req.body);
    if (!data.success) {
      res.status(400).json({ error: "Invalid turn." });
      return;
    }
    const sql = await getSql();
    await sql`insert into signal_turns (user_id, question, sentence, query) values (${req.userId}, ${data.data.question}, ${data.data.sentence}, ${data.data.query})`;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

turnsRouter.get("/", async (req, res, next) => {
  try {
    const sql = await getSql();
    const rows = await sql<{ id: number; question: string; sentence: string; query: string }>`
      select id, question, sentence, query
      from signal_turns
      where user_id = ${req.userId}
      order by id desc
      limit 12
    `;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});
