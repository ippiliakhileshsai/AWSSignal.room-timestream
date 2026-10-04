import { useEffect, useRef } from "react";

export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const trail = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = root.current;
    const dotEl = dot.current;
    const ringEl = ring.current;
    const trailEl = trail.current;
    if (!node || !dotEl || !ringEl || !trailEl) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("has-cursor");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let tx = x;
    let ty = y;
    let frame = 0;

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      const target = event.target instanceof Element ? event.target.closest("[data-tone]") : null;
      node.dataset.tone = target?.getAttribute("data-tone") ?? "ink";
      node.dataset.hot = target?.getAttribute("data-hot") ?? "0";
      const clickable = event.target instanceof Element ? event.target.closest("a, button") : null;
      node.dataset.press = clickable ? "1" : "0";
    };

    const loop = () => {
      rx += (x - rx) * 0.22;
      ry += (y - ry) * 0.22;
      tx += (x - tx) * 0.07;
      ty += (y - ty) * 0.07;
      dotEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ringEl.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      trailEl.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", move);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div ref={root} className="cursor" data-tone="ink" aria-hidden="true">
      <span ref={trail} className="cursor-trail" />
      <span ref={ring} className="cursor-ring" />
      <span ref={dot} className="cursor-dot" />
    </div>
  );
}
