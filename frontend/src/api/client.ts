// Thin HTTP client for the backend. All server calls live here.
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export type AskResult =
  | { ok: true; sentence: string; query: string }
  | { ok: false; error: string };

export type Turn = { id: number; question: string; sentence: string; query: string };

export const askAnalyst = (body: { question: string; facts: string }) =>
  request<AskResult>("/ask", { method: "POST", body: JSON.stringify(body) });

export const listTurns = () => request<Turn[]>("/turns");

export const saveTurn = (body: { question: string; sentence: string; query: string }) =>
  request<{ ok: true }>("/turns", { method: "POST", body: JSON.stringify(body) });
