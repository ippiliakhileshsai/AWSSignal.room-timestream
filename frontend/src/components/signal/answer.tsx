import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { MiniTrace } from "@/components/signal/charts";
import { useSignal } from "@/lib/signal/store";
import type { Answer } from "@/lib/signal/analyst";

export function AnswerView({ answer }: { answer: Answer }) {
  const rooms = useSignal((s) => s.rooms);
  const [copied, setCopied] = useState(false);
  const focus = rooms.filter((room) => answer.focus.includes(room.id));

  return (
    <div>
      <p className="max-w-2xl text-lg leading-snug">{answer.sentence}</p>
      <p className="mt-2 font-mono text-xs text-muted">Last 15 minutes. Only these five rooms.</p>
      {answer.query ? (
        <div className="mt-4 rounded-2xl bg-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs tracking-[0.14em] text-muted">QUERY</p>
            <button
              type="button"
              className="press inline-flex min-h-10 items-center gap-1 font-mono text-xs"
              onClick={() => {
                void navigator.clipboard.writeText(answer.query);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-ink-soft">{answer.query}</pre>
        </div>
      ) : null}
      {answer.rows.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {answer.rows.map((row) => (
            <div
              key={`${row.id}-${row.place}`}
              data-tone={rooms.find((room) => room.id === row.id)?.tone}
              className="rounded-2xl border border-stone bg-panel px-3 py-3"
            >
              <p className="font-mono text-[11px] text-muted">{row.place}</p>
              <p className="font-display text-2xl">{row.primary}</p>
              <p className="font-mono text-xs text-muted">{row.secondary}</p>
            </div>
          ))}
        </div>
      ) : null}
      {focus.length === 1 ? (
        <div className="mt-3">
          <MiniTrace room={focus[0]} field={answer.measure} />
        </div>
      ) : null}
    </div>
  );
}
