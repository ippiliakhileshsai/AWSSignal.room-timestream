import { useEffect, type ReactNode } from "react";
import { useSignal } from "@/lib/signal/store";

export function SignalProvider({ children }: { children: ReactNode }) {
  const boot = useSignal((s) => s.boot);

  useEffect(() => {
    boot();
    const id = window.setInterval(() => useSignal.getState().tick(), 10_000);
    return () => window.clearInterval(id);
  }, [boot]);

  return children;
}
