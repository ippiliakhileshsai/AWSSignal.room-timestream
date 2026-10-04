import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/signal/shell";
import { AnswerView } from "@/components/signal/answer";
import { useSignal } from "@/lib/signal/store";
import { analyze, factsFor, PROMPTS, type Answer } from "@/lib/signal/analyst";
import { askAnalyst, listTurns, saveTurn } from "@/api/client";
import { show, stats } from "@/lib/signal/model";

export const Route = createFileRoute("/ask")({ component: AskPage });

type DialogTurn = {
  id: string;
  question: string;
  answer: Answer | null;
  pending: boolean;
};

function AskPage() {
  const rooms = useSignal((s) => s.rooms);
  const counts = useSignal((s) => s.sessionCounts);
  const ready = useSignal((s) => s.ready);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<DialogTurn[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listTurns()
      .then((rows) => {
        if (!rows?.length) return;
        setTurns(
          [...rows].reverse().map((row) => ({
            id: `saved-${row.id}`,
            question: row.question,
            pending: false,
            answer: {
              kind: "answer" as const,
              sentence: row.sentence,
              query: row.query,
              focus: [],
              measure: 0,
              rows: [],
            },
          })),
        );
      })
      .catch(() => undefined);
  }, []);

  function keep(question: string, sentence: string, query: string) {
    void saveTurn({ question, sentence, query }).catch(() => undefined);
  }

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy || !rooms.length) return;
    setDraft("");
    const local = analyze(text, rooms, counts);
    const id = crypto.randomUUID();
    const known = local.kind !== "unknown";
    setTurns((prev) => [...prev, { id, question: text, answer: known ? local : null, pending: !known }]);
    if (known) {
      keep(text, local.sentence, local.query);
      return;
    }

    setBusy(true);
    try {
      const result = await askAnalyst({ question: text, facts: factsFor(rooms, counts) });
      setTurns((prev) =>
        prev.map((turn) => {
          if (turn.id !== id) return turn;
          if (!result.ok) {
            keep(text, local.sentence, local.query);
            return { ...turn, pending: false, answer: local };
          }
          keep(text, result.sentence, result.query || local.query);
          return {
            ...turn,
            pending: false,
            answer: {
              ...local,
              kind: "answer",
              sentence: result.sentence,
              query: result.query || local.query,
              focus: rooms.map((room) => room.id),
            },
          };
        }),
      );
    } catch {
      setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, pending: false, answer: local } : turn)));
      keep(text, local.sentence, local.query);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Ask" kicker="ROOM ANALYST">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {ready ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {rooms.map((room) => (
              <div key={room.id} data-tone={room.tone} className="rounded-2xl bg-panel px-3 py-3 shadow-card">
                <p className="font-mono text-[11px] text-muted">{room.place}</p>
                <p className="font-display text-2xl">{show(room.fields[0], stats(room).latest.v[0])}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex min-h-72 flex-col gap-3 rounded-3xl bg-panel p-4 shadow-card sm:p-6">
          {turns.length === 0 ? (
            <div className="my-auto max-w-md">
              <p className="font-display text-3xl leading-tight">Ask the rooms.</p>
              <p className="mt-3 text-ink-soft">Soil, tank, wind, vibration, power, air, noise, light. A known question answers at once.</p>
            </div>
          ) : (
            turns.map((turn) => (
              <div key={turn.id} className="flex flex-col gap-2">
                <p className="ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-ink px-4 py-3 text-sm text-cream">{turn.question}</p>
                {turn.pending || !turn.answer ? (
                  <p className="dots mr-auto rounded-3xl rounded-bl-md bg-cream px-4 py-4">
                    <span />
                    <span />
                    <span />
                  </p>
                ) : (
                  <article className="rise mr-auto w-full max-w-[95%] rounded-3xl rounded-bl-md bg-cream px-4 py-4">
                    <AnswerView answer={turn.answer} />
                  </article>
                )}
              </div>
            ))
          )}
        </div>

        <form
          className="rounded-3xl bg-ink p-4 text-cream shadow-card sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(draft);
          }}
        >
          <label htmlFor="question" className="font-mono text-xs tracking-[0.16em] text-stone">
            ASK ABOUT THESE FIVE ROOMS
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="question"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Soil, vibration, air, or which room to watch"
              className="min-h-12 flex-1 rounded-2xl bg-cream px-4 text-ink outline-none placeholder:text-muted"
            />
            <button type="submit" data-tone="apricot" className="press min-h-12 rounded-2xl bg-cream px-5 text-ink" disabled={busy}>
              {busy ? "Reading" : "Ask"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {PROMPTS.map((chip) => (
              <button
                key={chip}
                type="button"
                data-tone="apricot"
                className="press rounded-full bg-cream/10 px-3 py-2 text-left text-sm text-cream hover:bg-cream/20"
                onClick={() => void ask(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </form>
      </div>
    </Shell>
  );
}
