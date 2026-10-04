import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/signal/model";

export function LiveNumber({ value, suffix, decimals = 1 }: { value: number; suffix: string; decimals?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (reduce.current) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 420);
      const eased = 1 - (1 - k) ** 3;
      setShown(origin + (value - origin) * eased);
      if (k < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className="tabular-nums">
      {fmt(shown, decimals)}
      <span className="unit">{suffix}</span>
    </span>
  );
}
