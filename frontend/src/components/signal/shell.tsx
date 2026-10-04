import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Activity, Bell, BookOpen, LayoutGrid, MessageCircle, Thermometer } from "lucide-react";
import { useSignal } from "@/lib/signal/store";
import { useNow } from "@/lib/signal/use-clock";

const NAV = [
  { to: "/floor", label: "Floor", icon: LayoutGrid },
  { to: "/room", label: "Room", icon: Thermometer },
  { to: "/ask", label: "Ask", icon: MessageCircle },
  { to: "/alert", label: "Alert", icon: Bell },
  { to: "/method", label: "Method", icon: BookOpen },
] as const;

function onPath(path: string, to: string) {
  return path === to || (to === "/room" && path.startsWith("/room"));
}

function Countdown() {
  const next = useSignal((s) => s.nextTick);
  const ready = useSignal((s) => s.ready);
  const now = useNow(200);
  const left = ready && now ? Math.max(0, Math.ceil((next - now) / 1000)) : 10;
  return <span className="font-mono tabular-nums">{left}s</span>;
}

export function Shell({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-cream text-ink lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="hidden border-r border-stone bg-panel lg:flex lg:flex-col lg:px-5 lg:py-7">
        <Link to="/" className="press block" data-tone="ink">
          <p className="font-mono text-xs tracking-[0.22em] text-muted">SIGNAL</p>
          <p className="font-display text-3xl leading-none">Room</p>
        </Link>
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const on = onPath(path, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                data-tone="ink"
                className={`press flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm ${on ? "bg-ink text-cream" : "text-ink-soft hover:bg-stone"}`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <p className="mt-4 flex items-center gap-2 font-mono text-xs text-muted">
            <Activity size={14} />
            10-second clock
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-24 lg:pb-0">
        <header className="flex items-end justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-muted">{kicker}</p>
            <h1 className="font-display text-3xl leading-none sm:text-4xl">{title}</h1>
          </div>
          <p className="rounded-full bg-panel px-3 py-2 font-mono text-xs text-ink shadow-card">
            Next <Countdown />
          </p>
        </header>
        <main className="page-enter px-5 pb-10 sm:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-stone bg-panel/95 px-1 py-1 backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const on = onPath(path, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`press flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] ${on ? "bg-ink text-cream" : "text-ink-soft"}`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

