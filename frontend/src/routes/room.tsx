import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/signal/shell";
import { Trace } from "@/components/signal/charts";
import { LiveNumber } from "@/components/signal/number";
import { useSignal } from "@/lib/signal/store";
import { useNow } from "@/lib/signal/use-clock";
import { fmt, isRoomId, show, stats, streamWord } from "@/lib/signal/model";

export const Route = createFileRoute("/room")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: isRoomId(search.id) ? search.id : ("penthouse" as const),
  }),
  component: RoomPage,
});

function RoomPage() {
  const { id } = Route.useSearch();
  const rooms = useSignal((s) => s.rooms);
  const ready = useSignal((s) => s.ready);
  const room = rooms.find((item) => item.id === id) ?? rooms[0];
  const now = useNow();

  return (
    <Shell title={room?.place ?? "Room"} kicker="SINGLE ROOM">
      {!ready || !room ? (
        <p className="text-lg text-ink-soft">Opening the room.</p>
      ) : (
        <RoomBody roomId={room.id} now={now || Date.now()} />
      )}
    </Shell>
  );
}

function RoomBody({ roomId, now }: { roomId: string; now: number }) {
  const rooms = useSignal((s) => s.rooms);
  const room = rooms.find((item) => item.id === roomId)!;
  const s = stats(room);
  const word = streamWord(s.latest.t, now);
  const watch = s.mood === "Near the line" || s.mood === "Over the line";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {rooms.map((item) => (
          <Link
            key={item.id}
            to="/room"
            search={{ id: item.id }}
            data-tone={item.tone}
            className={`press min-h-11 rounded-full px-4 py-2 font-mono text-sm ${item.id === room.id ? "bg-ink text-cream" : "bg-panel text-ink"}`}
          >
            {item.place}
          </Link>
        ))}
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]" data-tone={room.tone}>
        <article className="relative min-h-80 overflow-hidden rounded-3xl bg-ink text-cream shadow-card">
          {room.pulse > 0 ? <span key={room.pulse} className="pulse-ring" /> : null}
          <img src={room.image} alt={`${room.place} interior`} className="h-80 w-full object-cover sm:absolute sm:inset-0 sm:h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="font-mono text-xs tracking-[0.18em] text-stone">{word}</p>
            <p className="font-display text-5xl leading-none sm:text-7xl">
              <LiveNumber value={s.latest.v[0]} suffix={room.fields[0].unit} decimals={room.fields[0].decimals} />
            </p>
            <p className="mt-2 max-w-xs text-stone">{room.line}</p>
          </div>
        </article>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {room.fields.slice(1).map((field, index) => (
              <Stat key={field.key} label={field.label} value={`${s.latest.v[index + 1].toFixed(field.decimals)}${field.unit}`} />
            ))}
            <Stat label="State" value={s.mood} />
          </div>
          <section className="rounded-3xl bg-panel p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{room.fields[0].label} · 15 min</h2>
              {watch ? (
                <span data-tone="heat" data-hot="1" className="rounded-full bg-heat/10 px-3 py-1 font-mono text-xs text-heat">
                  Watch
                </span>
              ) : null}
            </div>
            <Trace room={room} field={0} threshold={room.fields[0].watch} />
          </section>
          <section className="rounded-3xl bg-panel p-5 shadow-card">
            <h2 className="font-display text-2xl">{room.fields[1].label} · 15 min</h2>
            <Trace room={room} field={1} />
          </section>
        </div>
      </section>

      <section className="rounded-3xl bg-panel p-5 shadow-card">
        <h2 className="font-display text-2xl">The list</h2>
        <ul className="mt-2">
          {room.fields.map((field, index) => (
            <li key={field.key} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-t border-stone py-3 sm:grid-cols-[1.2fr_auto_auto]">
              <span>{field.label}</span>
              <span className="font-mono">{show(field, s.latest.v[index])}</span>
              <span className="col-span-2 font-mono text-xs text-muted sm:col-span-1">
                avg {fmt(s.avgs[index], field.decimals)}
                {field.watch != null ? ` · line ${field.watch}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="font-mono text-xs text-muted">
        estate-signal · {room.topic} · every 10s · {s.points} points in 15 minutes
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-panel px-3 py-3 shadow-card">
      <p className="font-mono text-[11px] tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-xl leading-tight">{value}</p>
    </div>
  );
}
