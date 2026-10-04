import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/signal/shell";
import { Comparison } from "@/components/signal/charts";
import { BuildingPlan } from "@/components/signal/plan";
import { LiveNumber } from "@/components/signal/number";
import { useSignal } from "@/lib/signal/store";
import { useNow } from "@/lib/signal/use-clock";
import { show, stats, streamWord, type LiveRoom } from "@/lib/signal/model";

export const Route = createFileRoute("/floor")({ component: Floor });

function Floor() {
  const rooms = useSignal((s) => s.rooms);
  const ready = useSignal((s) => s.ready);
  const now = useNow();
  const climate = rooms.filter((room) => room.id !== "factory");

  return (
    <Shell title="Floor" kicker="LIVE INSTRUMENTS">
      {!ready ? (
        <p className="text-lg text-ink-soft">The rooms are taking their first breath.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {rooms.map((room, index) => (
              <Instrument key={room.id} room={room} index={index} now={now || Date.now()} />
            ))}
          </section>

          <section className="rounded-3xl bg-panel p-5 shadow-card sm:p-6" data-tone="ink">
            <div className="mb-2 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs tracking-[0.18em] text-muted">LAST 15 MINUTES</p>
                <h2 className="font-display text-2xl">Climate, four rooms</h2>
              </div>
              <p className="font-mono text-xs text-muted">{stats(rooms[0]).points} points</p>
            </div>
            <Comparison rooms={climate} />
            <p className="mt-3 font-mono text-xs text-muted">Factory machine heat stays on its own card. A different scale.</p>
          </section>

          <BuildingPlan rooms={rooms} now={now || Date.now()} />
        </div>
      )}
    </Shell>
  );
}

function Instrument({ room, index, now }: { room: LiveRoom; index: number; now: number }) {
  const s = stats(room);
  const word = streamWord(s.latest.t, now);
  return (
    <Link
      to="/room"
      search={{ id: room.id }}
      data-tone={room.tone}
      data-hot={s.mood === "Near the line" || s.mood === "Over the line" ? "1" : "0"}
      className={`press group relative block overflow-hidden rounded-3xl bg-panel shadow-card rise d${index + 1}`}
    >
      {room.pulse > 0 ? <span key={room.pulse} className="pulse-ring" /> : null}
      <div className="relative h-40 overflow-hidden">
        <img src={room.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        <span className="sensor-pip absolute top-4 left-4 size-2.5 rounded-full" style={{ background: `var(--color-${room.tone})` }} />
        <span className="absolute top-3 right-3 rounded-full bg-cream/90 px-2 py-1 font-mono text-xs text-ink">{word}</span>
      </div>
      <div className="p-4">
        <p className="font-mono text-xs tracking-[0.16em] text-muted">{room.place}</p>
        <p className="font-display text-4xl leading-none tracking-tight">
          <LiveNumber value={s.latest.v[0]} suffix={room.fields[0].unit.trim() || ""} decimals={room.fields[0].decimals} />
        </p>
        <p className="mt-2 font-mono text-sm text-ink-soft">{show(room.fields[1], s.latest.v[1])}</p>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          <span className="text-muted">{s.mood}</span>
          <span className="font-mono text-muted">{show(room.fields[2], s.latest.v[2])}</span>
        </div>
      </div>
    </Link>
  );
}

