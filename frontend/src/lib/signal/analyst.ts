import { fmt, show, stats, type LiveRoom, type RoomId } from "@/lib/signal/model";

export type Answer = {
  kind: "answer" | "refusal" | "unknown";
  sentence: string;
  query: string;
  focus: RoomId[];
  measure: number;
  rows: { id: RoomId; place: string; primary: string; secondary: string }[];
};

const REFUSAL = "I only read these five rooms and the measures on their sensors, over a time window.";

const SUGGEST =
  "Ask which climate room is warmest, how the farmhouse soil and tank look, factory vibration or power, penthouse air and noise, humidity across all five, or a full data list for one room.";

export const PROMPTS = [
  "Which climate room is warmest?",
  "Which climate room is coldest?",
  "How is the farmhouse soil and tank?",
  "Wind at the farmhouse.",
  "Is the factory vibrating?",
  "Factory power and line speed.",
  "Air quality in the penthouse.",
  "Noise in the penthouse.",
  "Humidity across all five rooms.",
  "Which room is driest?",
  "Full data list for the conservatory.",
  "Did anyone cross a watch line?",
  "How many readings arrived since this page opened?",
  "Should I worry about the conservatory?",
];

function roomOf(q: string): RoomId | "all" {
  if (/penthouse|room-1/.test(q)) return "penthouse";
  if (/atelier|studio/.test(q)) return "atelier";
  if (/conservatory|glasshouse|greenhouse/.test(q)) return "conservatory";
  if (/farm|farmhouse/.test(q)) return "farmhouse";
  if (/factory|machine hall|plant/.test(q)) return "factory";
  return "all";
}

function fieldOn(room: LiveRoom, q: string): number | null {
  const byKey = room.fields.findIndex((f) => q.includes(f.key));
  if (byKey >= 0) return byKey;
  if (/humid/.test(q)) return room.fields.findIndex((f) => f.key === "humidity");
  if (/vibrat/.test(q)) return room.fields.findIndex((f) => f.key === "vibration");
  if (/tank/.test(q)) return room.fields.findIndex((f) => f.key === "tank");
  if (/soil/.test(q)) return room.fields.findIndex((f) => f.key === "soil");
  if (/wind/.test(q)) return room.fields.findIndex((f) => f.key === "wind");
  if (/air|aqi/.test(q)) return room.fields.findIndex((f) => f.key === "air");
  if (/noise|loud/.test(q)) return room.fields.findIndex((f) => f.key === "noise");
  if (/co2|carbon/.test(q)) return room.fields.findIndex((f) => f.key === "co2");
  if (/\bvoc\b/.test(q)) return room.fields.findIndex((f) => f.key === "voc");
  if (/light|lux|bright/.test(q)) return room.fields.findIndex((f) => f.key === "light");
  if (/presence|occupied|people/.test(q)) return room.fields.findIndex((f) => f.key === "presence");
  if (/power|kilowatt/.test(q)) return room.fields.findIndex((f) => f.key === "power");
  if (/line speed|\bspeed\b/.test(q)) return room.fields.findIndex((f) => f.key === "speed");
  if (/canopy/.test(q)) return room.fields.findIndex((f) => f.key === "canopy");
  if (/machine/.test(q)) return room.fields.findIndex((f) => f.key === "machine");
  return null;
}

export function factsFor(rooms: LiveRoom[], counts: Record<RoomId, number>) {
  const lines = rooms.map((room) => {
    const s = stats(room);
    const measures = room.fields
      .map((f, i) => `${f.label} ${show(f, s.latest.v[i])} (15-min avg ${fmt(s.avgs[i], f.decimals)})`)
      .join(", ");
    return `${room.place}: ${measures}. Mood ${s.mood}. Points ${s.points}. Consecutive readings over a watch line: ${s.hot}.`;
  });
  const total = rooms.reduce((sum, room) => sum + counts[room.id], 0);
  return `${lines.join(" ")} Readings since this page opened: ${total}. Feed is simulated. Each room has its own watch line. Bucket estate-signal.`;
}

export function analyze(question: string, rooms: LiveRoom[], counts: Record<RoomId, number>): Answer {
  const q = question.toLowerCase().replace(/[?!.,]/g, "").trim();
  const empty: Answer = {
    kind: "unknown",
    sentence: SUGGEST,
    query: "",
    focus: [],
    measure: 0,
    rows: [],
  };
  if (!q || !rooms.length) return empty;

  if (/(delete|drop|remove|erase|hack|password|email|send a mail|predict tomorrow|outside weather|write code|sixth room|new room)/.test(q)) {
    return { ...empty, kind: "refusal", sentence: REFUSAL };
  }

  const focusRoom = roomOf(q);
  const picked = focusRoom === "all" ? rooms : rooms.filter((room) => room.id === focusRoom);
  const ids = picked.map((room) => room.id);
  const specific = picked.some((room) => fieldOn(room, q) != null);

  if (/(how many|count|since this page|since i opened|arrived)/.test(q)) {
    const total = rooms.reduce((sum, room) => sum + counts[room.id], 0);
    const sentence =
      total === 0
        ? "None yet. Each of the five rooms speaks every 10 seconds, together."
        : `${total} readings since this page opened. ${rooms.map((room) => `${counts[room.id]} from the ${room.place.toLowerCase()}`).join(", ")}.`;
    return {
      kind: "answer",
      sentence,
      query: `SELECT count(*) FROM "estate-signal"\nWHERE time > session_start\nGROUP BY device_id`,
      focus: rooms.map((room) => room.id),
      measure: 0,
      rows: rooms.map((room) => ({
        id: room.id,
        place: room.place,
        primary: `${counts[room.id]}`,
        secondary: "this visit",
      })),
    };
  }

  if (/(watch line|threshold|cross|alert|firing|over the line)/.test(q) && !specific) {
    const hot = rooms.map((room) => ({ room, ...stats(room) }));
    const over = hot.filter((item) => item.hot > 0 || item.room.fields.some((f, i) => f.watch != null && item.max >= (f.watch ?? 0) && i === 0));
    const nearest = [...hot].sort((a, b) => b.latest.v[0] / (b.room.fields[0].watch ?? 1) - a.latest.v[0] / (a.room.fields[0].watch ?? 1))[0];
    const sentence = over.some((item) => item.hot > 0)
      ? `${over.filter((item) => item.hot > 0).map((item) => item.room.place).join(" and ")} crossed a watch line.`
      : `No. Closest is the ${nearest.room.place.toLowerCase()} at ${show(nearest.room.fields[0], nearest.latest.v[0])}. Its line is ${nearest.room.fields[0].watch}.`;
    return {
      kind: "answer",
      sentence,
      query: `SELECT max(value) FROM "estate-signal"\nWHERE time > now() - 15m\nGROUP BY device_id, measure`,
      focus: rooms.map((room) => room.id),
      measure: 0,
      rows: hot.map((item) => ({
        id: item.room.id,
        place: item.room.place,
        primary: show(item.room.fields[0], item.latest.v[0]),
        secondary: item.hot ? `${item.hot} over` : "under",
      })),
    };
  }

  if (/(average|avg|mean)/.test(q) || specific) {
    const parts = picked.map((room) => {
      const i = fieldOn(room, q) ?? 0;
      const f = room.fields[i];
      const s = stats(room);
      return `${room.place} ${f.label.toLowerCase()} is ${show(f, s.latest.v[i])}, averaging ${fmt(s.avgs[i], f.decimals)}${f.unit}`;
    });
    const sampleRoom = picked[0];
    const sampleIndex = fieldOn(sampleRoom, q) ?? 0;
    const field = sampleRoom.fields[sampleIndex];
    return {
      kind: "answer",
      sentence: `${parts.join(". ")}.`,
      query: `SELECT mean(${field.key}) FROM "estate-signal"\nWHERE time > now() - 15m${focusRoom === "all" ? "" : ` AND device_id = '${focusRoom}'`}\nGROUP BY device_id`,
      focus: ids,
      measure: sampleIndex,
      rows: picked.map((room) => {
        const i = fieldOn(room, q) ?? 0;
        const f = room.fields[i];
        const s = stats(room);
        return {
          id: room.id,
          place: room.place,
          primary: show(f, s.latest.v[i]),
          secondary: `avg ${fmt(s.avgs[i], f.decimals)}`,
        };
      }),
    };
  }

  if (/(hottest|warmest|coldest|which room|right now|latest|current|compare)/.test(q)) {
    const climate = rooms.filter((room) => room.id !== "factory");
    const pool = /factory/.test(q) ? rooms : climate;
    const ranked = [...pool].sort((a, b) =>
      /coldest/.test(q) ? stats(a).latest.v[0] - stats(b).latest.v[0] : stats(b).latest.v[0] - stats(a).latest.v[0],
    );
    if (focusRoom !== "all" && !/(hottest|warmest|coldest|which|compare)/.test(q)) {
      const room = picked[0];
      const s = stats(room);
      return {
        kind: "answer",
        sentence: `${room.place} is ${show(room.fields[0], s.latest.v[0])}, ${room.fields[1].label.toLowerCase()} ${show(room.fields[1], s.latest.v[1])}. ${s.mood}.`,
        query: `SELECT last(*) FROM "estate-signal"\nWHERE device_id = '${room.id}'`,
        focus: [room.id],
        measure: 0,
        rows: room.fields.slice(0, 4).map((f, i) => ({
          id: room.id,
          place: f.label,
          primary: show(f, s.latest.v[i]),
          secondary: `avg ${fmt(s.avgs[i], f.decimals)}`,
        })),
      };
    }
    const top = ranked[0];
    const s = stats(top);
    const aside = /factory/.test(q)
      ? ""
      : " The factory stays off this list — its machine runs much hotter by design.";
    const lead = /coldest/.test(q) ? "coolest climate room" : "warmest climate room";
    return {
      kind: "answer",
      sentence: `${top.place} is the ${lead}, at ${show(top.fields[0], s.latest.v[0])}. ${ranked
        .slice(1)
        .map((room) => `${room.place} ${show(room.fields[0], stats(room).latest.v[0])}`)
        .join(". ")}.${aside}`,
      query: `SELECT device_id, last(primary) FROM "estate-signal"\nWHERE time > now() - 1m\nGROUP BY device_id`,
      focus: ranked.map((room) => room.id),
      measure: 0,
      rows: ranked.map((room) => ({
        id: room.id,
        place: room.place,
        primary: show(room.fields[0], stats(room).latest.v[0]),
        secondary: stats(room).mood,
      })),
    };
  }

  if (/(every measure|all measures|data list|full reading|overview)/.test(q)) {
    if (focusRoom === "all") {
      return {
        kind: "answer",
        sentence: rooms
          .map((room) => {
            const s = stats(room);
            return `${room.place} ${show(room.fields[0], s.latest.v[0])}, ${room.fields[1].label.toLowerCase()} ${show(room.fields[1], s.latest.v[1])}, ${room.fields[2].label.toLowerCase()} ${show(room.fields[2], s.latest.v[2])}`;
          })
          .join(". ") + ". Name one room for its full list.",
        query: `SELECT last(*) FROM "estate-signal"\nWHERE time > now() - 1m\nGROUP BY device_id`,
        focus: rooms.map((room) => room.id),
        measure: 0,
        rows: rooms.map((room) => ({
          id: room.id,
          place: room.place,
          primary: show(room.fields[0], stats(room).latest.v[0]),
          secondary: stats(room).mood,
        })),
      };
    }
    const room = picked[0];
    const s = stats(room);
    return {
      kind: "answer",
      sentence: `${room.place}. ${room.fields.map((f, i) => `${f.label} ${show(f, s.latest.v[i])}`).join(", ")}.`,
      query: `SELECT last(*) FROM "estate-signal"\nWHERE device_id = '${room.id}'`,
      focus: [room.id],
      measure: 0,
      rows: room.fields.map((f, i) => ({
        id: room.id,
        place: f.label,
        primary: show(f, s.latest.v[i]),
        secondary: f.watch != null ? `line ${f.watch}` : `avg ${fmt(s.avgs[i], f.decimals)}`,
      })),
    };
  }

  if (/(driest|wettest|most humid)/.test(q)) {
    const ranked = [...rooms].sort((a, b) => stats(a).latest.v[1] - stats(b).latest.v[1]);
    const order = /driest/.test(q) ? ranked : [...ranked].reverse();
    const top = order[0];
    return {
      kind: "answer",
      sentence: `${top.place} is the ${/driest/.test(q) ? "driest" : "most humid"}, at ${show(top.fields[1], stats(top).latest.v[1])}. ${order
        .slice(1)
        .map((room) => `${room.place} ${show(room.fields[1], stats(room).latest.v[1])}`)
        .join(". ")}.`,
      query: `SELECT mean(humidity) FROM "estate-signal"\nWHERE time > now() - 15m\nGROUP BY device_id`,
      focus: order.map((room) => room.id),
      measure: 1,
      rows: order.map((room) => ({
        id: room.id,
        place: room.place,
        primary: show(room.fields[1], stats(room).latest.v[1]),
        secondary: "humidity",
      })),
    };
  }

  if (/(climb|worry|watch|near|okay|ok\b|status)/.test(q)) {
    const notes = picked.map((room) => `${room.place}: ${stats(room).mood.toLowerCase()} at ${show(room.fields[0], stats(room).latest.v[0])}`);
    const worry = picked.find((room) => {
      const state = stats(room).mood;
      return state === "Near the line" || state === "Over the line";
    });
    return {
      kind: "answer",
      sentence: worry ? `${worry.place} is the one to watch. ${notes.join(". ")}.` : `Nothing is against its line. ${notes.join(". ")}.`,
      query: `SELECT last(primary) FROM "estate-signal"\nWHERE time > now() - 15m\nGROUP BY device_id`,
      focus: ids,
      measure: 0,
      rows: picked.map((room) => ({
        id: room.id,
        place: room.place,
        primary: show(room.fields[0], stats(room).latest.v[0]),
        secondary: stats(room).mood,
      })),
    };
  }

  return empty;
}
