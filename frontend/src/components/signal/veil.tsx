import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export function RouteVeil() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const first = useRef(true);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setOn(true);
    const id = window.setTimeout(() => setOn(false), 920);
    return () => window.clearTimeout(id);
  }, [path]);

  return (
    <div className={on ? "veil veil-on" : "veil"} aria-hidden="true">
      <span className="veil-slab veil-a" />
      <span className="veil-slab veil-b" />
      <span className="veil-mark">Signal</span>
    </div>
  );
}
