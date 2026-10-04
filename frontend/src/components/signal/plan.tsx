import { stats, streamWord, type LiveRoom } from "@/lib/signal/model";

export function BuildingPlan({ rooms, now }: { rooms: LiveRoom[]; now: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-3xl bg-panel p-5 shadow-card" data-tone="ink">
        <p className="font-mono text-xs tracking-[0.18em] text-muted">FLOOR PLATE</p>
        <p className="mt-1 font-display text-2xl">Five rooms, one clock</p>
        <svg viewBox="0 0 920 250" className="mt-4 h-auto w-full" role="img" aria-label="Plan of the five rooms">
          <rect x="12" y="20" width="896" height="210" rx="28" fill="var(--color-cream)" stroke="var(--color-ink)" strokeWidth="1.5" />
          {rooms.map((room, index) => {
            const x = 24 + index * 176;
            const s = stats(room);
            const live = streamWord(s.latest.t, now) === "Live";
            return (
              <g key={room.id}>
                <rect x={x} y="40" width="160" height="170" rx="18" fill="var(--color-panel)" />
                <rect x={x} y="40" width="8" height="170" rx="4" fill={`var(--color-${room.tone})`} />
                <text x={x + 18} y="68" fill="var(--color-muted)" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                  {room.fields[0].label}
                </text>
                <text x={x + 18} y="98" fill="var(--color-ink)" fontSize="16" fontFamily="Fraunces, Georgia, serif">
                  {room.place}
                </text>
                <text x={x + 18} y="132" fill="var(--color-ink)" fontSize="18" fontFamily="IBM Plex Mono, monospace">
                  {s.latest.v[0].toFixed(room.fields[0].decimals)}
                  {room.fields[0].unit}
                </text>
                <circle cx={x + 132} cy="186" r={live ? 7 : 4} fill={`var(--color-${room.tone})`}>
                  {live ? <animate attributeName="r" values="5;8;5" dur="1.8s" repeatCount="indefinite" /> : null}
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rounded-3xl bg-ink p-5 text-cream shadow-card" data-tone="apricot">
        <p className="font-mono text-xs tracking-[0.18em] text-stone">THE PIPE</p>
        <p className="mt-1 font-display text-2xl">A reading on its way</p>
        <svg viewBox="0 0 280 150" className="mt-6 h-auto w-full" aria-hidden="true">
          <path id="pipe" d="M16 110 C 70 110, 70 36, 140 36 S 210 110, 264 40" fill="none" stroke="var(--color-stone)" strokeWidth="1.5" />
          <circle r="5" fill="var(--color-apricot)" className="packet" style={{ offsetPath: 'path("M16 110 C 70 110, 70 36, 140 36 S 210 110, 264 40")' }} />
          <circle r="5" fill="var(--color-violet)" className="packet lag" style={{ offsetPath: 'path("M16 110 C 70 110, 70 36, 140 36 S 210 110, 264 40")' }} />
          <circle r="5" fill="var(--color-sea)" className="packet lag2" style={{ offsetPath: 'path("M16 110 C 70 110, 70 36, 140 36 S 210 110, 264 40")' }} />
          <circle r="4" fill="var(--color-gold)" className="packet lag3" style={{ offsetPath: 'path("M16 110 C 70 110, 70 36, 140 36 S 210 110, 264 40")' }} />
          <circle r="4" fill="var(--color-copper)" className="packet lag4" style={{ offsetPath: 'path("M16 110 C 70 110, 70 36, 140 36 S 210 110, 264 40")' }} />
          <text x="8" y="138" fill="var(--color-stone)" fontSize="11" fontFamily="IBM Plex Mono, monospace">Rooms</text>
          <text x="112" y="24" fill="var(--color-stone)" fontSize="11" fontFamily="IBM Plex Mono, monospace">IoT Core</text>
          <text x="196" y="64" fill="var(--color-stone)" fontSize="11" fontFamily="IBM Plex Mono, monospace">Timestream</text>
        </svg>
        <p className="mt-2 text-sm text-stone">Each color is one room. They leave together, ten seconds apart from the last departure.</p>
      </div>
    </div>
  );
}
