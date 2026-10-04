import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/signal/shell";
import { useSignal } from "@/lib/signal/store";
import { show, stats } from "@/lib/signal/model";

export const Route = createFileRoute("/alert")({ component: AlertPage });

function AlertPage() {
  const rooms = useSignal((s) => s.rooms);
  const ready = useSignal((s) => s.ready);
  const rows = rooms.map((room) => ({ room, ...stats(room) }));
  const firing = rows.some((row) => row.hot >= 2);
  const peak = rows.reduce((best, row) => {
    const score = row.latest.v[0] / (row.room.fields[0].watch ?? 1);
    const bestScore = best ? best.latest.v[0] / (best.room.fields[0].watch ?? 1) : -1;
    return score > bestScore ? row : best;
  }, rows[0]);

  return (
    <Shell title="Alert" kicker="ONE RULE">
      {!ready || !peak ? (
        <p className="text-lg">Checking the line.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl bg-panel p-6 shadow-card" data-tone={firing ? "heat" : "violet"} data-hot={firing ? "1" : "0"}>
            <p className="font-mono text-xs tracking-[0.18em] text-muted">THE RULE</p>
            <h2 className="mt-2 max-w-md font-display text-4xl leading-tight">A measure stays past its own watch line for two readings in a row.</h2>
            <ol className="mt-8 grid gap-3 sm:grid-cols-3">
              <Step n="01" title="First read" body="A measure touches its own line." done={rows.some((row) => row.hot > 0)} />
              <Step n="02" title="Next read" body="The following 10-second sample is still there." done={firing} />
              <Step n="03" title="Firing" body="A mail would be planned. It is not sent from this screen." done={firing} />
            </ol>
            <p className="mt-8 text-lg">
              {firing
                ? "Status: FIRING. The mail is planned, not sent."
                : `Status: WATCH. ${peak.room.place} is at ${show(peak.room.fields[0], peak.latest.v[0])}. Its line is ${peak.room.fields[0].watch}. Not firing.`}
            </p>
          </section>

          <div className="flex flex-col gap-4">
            <img src="/rooms/factory.jpg" alt="The factory hall, the loudest machine in the estate" className="h-52 w-full rounded-3xl object-cover shadow-card" />
            <div className="overflow-x-auto rounded-3xl bg-panel shadow-card">
              <table className="w-full text-left text-sm">
                <thead className="font-mono text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Room</th>
                    <th className="px-4 py-3 font-medium">Now</th>
                    <th className="px-4 py-3 font-medium">Line</th>
                    <th className="px-4 py-3 font-medium">Over</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.room.id} data-tone={row.room.tone} className="border-t border-stone">
                      <td className="px-4 py-3">{row.room.place}</td>
                      <td className="px-4 py-3 font-mono">{show(row.room.fields[0], row.latest.v[0])}</td>
                      <td className="px-4 py-3 font-mono">{row.room.fields[0].watch}</td>
                      <td className="px-4 py-3 font-mono">{row.hot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Step({ n, title, body, done }: { n: string; title: string; body: string; done: boolean }) {
  return (
    <li className={`rounded-2xl px-4 py-4 ${done ? "bg-ink text-cream" : "bg-cream text-ink"}`}>
      <p className="font-mono text-xs">{n}</p>
      <p className="mt-2 font-display text-xl">{title}</p>
      <p className={`mt-1 text-sm ${done ? "text-stone" : "text-muted"}`}>{body}</p>
    </li>
  );
}
