import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { windowOf, type LiveRoom } from "@/lib/signal/model";

const TONE: Record<string, string> = {
  apricot: "var(--color-apricot)",
  violet: "var(--color-violet)",
  sea: "var(--color-sea)",
  gold: "var(--color-gold)",
  copper: "var(--color-copper)",
};

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-cream shadow-card">
      <p className="font-mono text-xs text-stone">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="font-mono text-sm">
          <span style={{ color: item.color }}>{item.name}</span> {Number(item.value).toFixed(1)}
        </p>
      ))}
    </div>
  );
}

export function Comparison({ rooms }: { rooms: LiveRoom[] }) {
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setAnimate(false), 900);
    return () => window.clearTimeout(id);
  }, []);

  const data = useMemo(() => {
    if (!rooms.length) return [];
    const span = windowOf(rooms[0].points);
    return span.map((point) => {
      const row: Record<string, string | number> = { label: format(point.t, "HH:mm") };
      for (const room of rooms) {
        const match = room.points.find((item) => item.t === point.t);
        if (match) row[room.place] = match.v[0];
      }
      return row;
    });
  }, [rooms]);

  if (!data.length) return <div className="h-56" />;

  return (
    <div className="w-full">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-stone)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={Math.max(0, Math.floor(data.length / 5) - 1)}
            />
            <YAxis hide domain={["dataMin - 0.6", "dataMax + 0.6"]} />
            <Tooltip content={<Tip />} />
            {rooms.map((room) => (
              <Line
                key={room.id}
                type="monotone"
                dataKey={room.place}
                stroke={TONE[room.tone]}
                strokeWidth={2.25}
                dot={false}
                isAnimationActive={animate}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {rooms.map((room) => (
          <li key={room.id} className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="size-2 rounded-full" style={{ background: TONE[room.tone] }} />
            {room.place}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Trace({
  room,
  field,
  threshold,
}: {
  room: LiveRoom;
  field: number;
  threshold?: number | null;
}) {
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setAnimate(false), 800);
    return () => window.clearTimeout(id);
  }, [room.id, field]);

  const data = useMemo(() => {
    return windowOf(room.points).map((point) => ({
      label: format(point.t, "HH:mm"),
      value: point.v[field],
    }));
  }, [room, field]);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-stone)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(data.length / 4) - 1)}
          />
          <YAxis hide domain={threshold ? ["auto", "auto"] : ["dataMin - 1", "dataMax + 1"]} />
          <Tooltip content={<Tip />} />
          {threshold ? (
            <ReferenceLine y={threshold} stroke="var(--color-heat)" strokeDasharray="4 4" />
          ) : null}
          <Line type="monotone" dataKey="value" name={room.place} stroke={TONE[room.tone]} strokeWidth={2.4} dot={false} isAnimationActive={animate} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniTrace({ room, field }: { room: LiveRoom; field: number }) {
  const data = useMemo(() => {
    return windowOf(room.points).map((point) => ({
      label: format(point.t, "HH:mm"),
      value: point.v[field] ?? point.v[0],
    }));
  }, [room, field]);

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" name={room.place} stroke={TONE[room.tone]} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
