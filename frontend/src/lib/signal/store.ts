import { create } from "zustand";
import { createSnapshot, emptyCounts, nextReading, STEP_MS, type LiveRoom, type RoomId } from "@/lib/signal/model";

type SignalState = {
  ready: boolean;
  rooms: LiveRoom[];
  nextTick: number;
  sessionCounts: Record<RoomId, number>;
  seed: number;
  boot: () => void;
  tick: () => void;
};

function mix(seed: number) {
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return { rand, seed: s };
}

export const useSignal = create<SignalState>((set, get) => ({
  ready: false,
  rooms: [],
  nextTick: 0,
  sessionCounts: emptyCounts(),
  seed: 88421,
  boot: () => {
    if (get().ready) return;
    const now = Date.now();
    set({
      ready: true,
      rooms: createSnapshot(now),
      nextTick: now + STEP_MS,
    });
  },
  tick: () => {
    const now = Date.now();
    const { rand, seed } = mix(get().seed + (now & 0xffff));
    set({
      seed,
      nextTick: now + STEP_MS,
      rooms: get().rooms.map((room) => {
        const prev = room.points[room.points.length - 1];
        const point = nextReading(room, prev, rand, now);
        const points = [...room.points, point].filter((p) => p.t > now - 35 * 60 * 1000);
        return { ...room, points, pulse: room.pulse + 1 };
      }),
      sessionCounts: (Object.keys(get().sessionCounts) as RoomId[]).reduce(
        (acc, id) => {
          acc[id] = get().sessionCounts[id] + 1;
          return acc;
        },
        {} as Record<RoomId, number>,
      ),
    });
  },
}));
