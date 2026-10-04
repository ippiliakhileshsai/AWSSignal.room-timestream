export const STEP_MS = 10_000;
export const WINDOW_MS = 15 * 60 * 1000;
const HISTORY = 120;

export type RoomId = "penthouse" | "atelier" | "conservatory" | "farmhouse" | "factory";
export type Tone = "apricot" | "violet" | "sea" | "gold" | "copper";
export type Five = [number, number, number, number, number];

export type Field = {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  base: number;
  amp: number;
  min: number;
  max: number;
  step: number;
  watch: number | null;
};

export type Reading = { t: number; v: Five };

export type RoomMeta = {
  id: RoomId;
  place: string;
  tone: Tone;
  image: string;
  topic: string;
  line: string;
  fields: [Field, Field, Field, Field, Field];
};

function field(
  key: string,
  label: string,
  unit: string,
  decimals: number,
  base: number,
  amp: number,
  min: number,
  max: number,
  step: number,
  watch: number | null = null,
): Field {
  return { key, label, unit, decimals, base, amp, min, max, step, watch };
}

export const ROOMS: RoomMeta[] = [
  {
    id: "penthouse",
    place: "Penthouse",
    tone: "apricot",
    image: "/rooms/penthouse.jpg",
    topic: "sensors/penthouse",
    line: "High glass, low noise, the city kept at a distance.",
    fields: [
      field("temperature", "Temperature", "°C", 1, 23.4, 0.45, 21.5, 26.5, 0.18, 27),
      field("humidity", "Humidity", "%", 1, 46, 1.6, 40, 55, 0.4),
      field("air", "Air quality", " AQI", 0, 28, 4, 12, 60, 2, 80),
      field("light", "Light", " lx", 0, 180, 40, 40, 420, 12),
      field("noise", "Noise", " dB", 0, 32, 2, 26, 48, 1, 55),
    ],
  },
  {
    id: "atelier",
    place: "Atelier",
    tone: "violet",
    image: "/rooms/atelier.jpg",
    topic: "sensors/atelier",
    line: "North light. The room stays even so the work can.",
    fields: [
      field("temperature", "Temperature", "°C", 1, 21.6, 0.35, 20, 24.2, 0.14, 26),
      field("humidity", "Humidity", "%", 1, 49, 1.4, 42, 58, 0.35),
      field("voc", "VOC", " ppb", 0, 90, 12, 40, 180, 6, 300),
      field("light", "Light", " lx", 0, 640, 80, 200, 980, 20),
      field("presence", "Presence", "", 0, 1, 0.4, 0, 3, 0.4),
    ],
  },
  {
    id: "conservatory",
    place: "Conservatory",
    tone: "sea",
    image: "/rooms/conservatory.jpg",
    topic: "sensors/conservatory",
    line: "Glass, ferns, and a climate that has to be persuaded.",
    fields: [
      field("temperature", "Temperature", "°C", 1, 26.2, 0.7, 23, 30.5, 0.22, 32),
      field("humidity", "Humidity", "%", 1, 68, 2.2, 58, 80, 0.5),
      field("soil", "Soil", "%", 1, 44, 2, 30, 62, 0.6, 25),
      field("co2", "CO₂", " ppm", 0, 620, 40, 420, 900, 15, 1200),
      field("light", "Light", " µmol", 0, 340, 50, 80, 700, 18),
    ],
  },
  {
    id: "farmhouse",
    place: "Farmhouse",
    tone: "gold",
    image: "/rooms/farmhouse.jpg",
    topic: "sensors/farmhouse",
    line: "The field starts at the table. Soil and tank matter here.",
    fields: [
      field("canopy", "Canopy", "°C", 1, 27.8, 0.8, 22, 34, 0.28, 36),
      field("humidity", "Humidity", "%", 1, 61, 2, 48, 78, 0.5),
      field("soil", "Soil", "%", 1, 38, 1.8, 24, 55, 0.5, 22),
      field("tank", "Tank", "%", 1, 72, 1.2, 40, 96, 0.4, 20),
      field("wind", "Wind", " m/s", 1, 2.4, 0.6, 0.2, 7, 0.25),
    ],
  },
  {
    id: "factory",
    place: "Factory",
    tone: "copper",
    image: "/rooms/factory.jpg",
    topic: "sensors/factory",
    line: "One hall, one machine, a line that should stay smooth.",
    fields: [
      field("machine", "Machine", "°C", 1, 64.5, 1.1, 58, 74, 0.35, 80),
      field("humidity", "Humidity", "%", 1, 42, 1.2, 32, 55, 0.3),
      field("vibration", "Vibration", " mm/s", 2, 1.8, 0.25, 0.6, 4.2, 0.08, 6),
      field("power", "Power", " kW", 1, 18.4, 0.8, 12, 26, 0.3),
      field("speed", "Line speed", " m/min", 1, 12.5, 0.4, 8, 16, 0.15),
    ],
  },
];

export type LiveRoom = RoomMeta & { points: Reading[]; pulse: number };

export function isRoomId(value: unknown): value is RoomId {
  return ROOMS.some((room) => room.id === value);
}

export function roomById(id: RoomId) {
  const room = ROOMS.find((item) => item.id === id);
  if (!room) throw new Error("Unknown room");
  return room;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundTo(n: number, decimals: number) {
  const m = 10 ** decimals;
  return Math.round(n * m) / m;
}

function sample(meta: RoomMeta, u: number, n: number): Five {
  const values = meta.fields.map((f, i) => {
    const wave = Math.sin(u * Math.PI * (2.2 + i * 0.35)) * f.amp;
    const drift = (u - 0.5) * f.amp * 0.35;
    const value = Math.min(f.max, Math.max(f.min, f.base + wave + drift + n * f.amp * 0.2));
    return roundTo(value, f.decimals);
  });
  return values as Five;
}

export function createSnapshot(now: number): LiveRoom[] {
  const rand = mulberry32(3632026);
  return ROOMS.map((meta) => {
    const points: Reading[] = [];
    for (let i = 0; i < HISTORY; i++) {
      const u = i / (HISTORY - 1);
      points.push({ t: now - (HISTORY - 1 - i) * STEP_MS, v: sample(meta, u, rand() - 0.5) });
    }
    return { ...meta, points, pulse: 0 };
  });
}

export function nextReading(room: LiveRoom, prev: Reading, rand: () => number, t: number): Reading {
  const values = prev.v.map((value, i) => {
    const f = room.fields[i];
    const next = Math.min(f.max, Math.max(f.min, value + (rand() - 0.48) * f.step));
    return roundTo(next, f.decimals);
  });
  return { t, v: values as Five };
}

export function windowOf(points: Reading[]) {
  const end = points[points.length - 1]?.t ?? 0;
  return points.filter((p) => p.t > end - WINDOW_MS);
}

export function mean(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function fmt(n: number, decimals = 1) {
  return n.toFixed(decimals);
}

export function show(fieldSpec: Field, value: number) {
  return `${fmt(value, fieldSpec.decimals)}${fieldSpec.unit}`;
}

export function crossed(room: LiveRoom, reading: Reading) {
  return room.fields.some((f, i) => f.watch != null && reading.v[i] >= f.watch);
}

export function consecutiveHot(room: LiveRoom) {
  let count = 0;
  for (let i = room.points.length - 1; i >= 0; i--) {
    if (crossed(room, room.points[i])) count += 1;
    else break;
  }
  return count;
}

export function mood(room: LiveRoom) {
  const last = room.points[room.points.length - 1];
  const prev = room.points[room.points.length - 2];
  if (!last || !prev) return "Holding";
  if (crossed(room, last)) return "Over the line";
  const watch = room.fields[0].watch;
  const rising = last.v[0] > prev.v[0] + room.fields[0].step * 0.2;
  if (watch != null && last.v[0] >= watch * 0.9 && rising) return "Near the line";
  if (last.v[0] > prev.v[0] + room.fields[0].step * 0.35) return "Climbing";
  if (last.v[0] + room.fields[0].step * 0.35 < prev.v[0]) return "Easing";
  return "Holding";
}

export function streamWord(latest: number, now: number) {
  const gap = now - latest;
  if (gap <= 12_000) return "Live";
  if (gap <= 30_000) return "Late";
  return "Quiet";
}

export type RoomStats = {
  latest: Reading;
  avg: number;
  max: number;
  points: number;
  hot: number;
  mood: string;
  avgs: Five;
};

export function stats(room: LiveRoom): RoomStats {
  const slice = windowOf(room.points);
  const latest = room.points[room.points.length - 1] ?? { t: 0, v: [0, 0, 0, 0, 0] as Five };
  const hero = slice.map((p) => p.v[0]);
  const avgs = room.fields.map((_, i) => mean(slice.map((p) => p.v[i]))) as Five;
  return {
    latest,
    avg: mean(hero),
    max: hero.length ? Math.max(...hero) : latest.v[0],
    points: slice.length,
    hot: consecutiveHot(room),
    mood: mood(room),
    avgs,
  };
}

export function emptyCounts(): Record<RoomId, number> {
  return {
    penthouse: 0,
    atelier: 0,
    conservatory: 0,
    farmhouse: 0,
    factory: 0,
  };
}
