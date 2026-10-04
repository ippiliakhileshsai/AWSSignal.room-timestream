import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Arrival });

function Arrival() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-cream">
      <img
        src="/rooms/estate.jpg"
        alt="The estate at dusk, seen across the reflecting pool"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-6 py-12 sm:px-10 sm:py-16">
        <p className="rise font-mono text-xs tracking-[0.22em] text-stone">FIVE ROOMS · EVERY 10 SECONDS</p>
        <h1 className="rise d1 mt-4 max-w-xl font-display text-6xl leading-[0.9] sm:text-8xl">Signal Room</h1>
        <p className="rise d2 mt-6 max-w-lg text-lg text-stone">
          A penthouse, an atelier, a conservatory, a farmhouse, and a factory. Each one reports a handful of measures, not just heat.
        </p>
        <div className="rise d3 mt-8 flex min-h-12 items-center">
          <Link to="/floor" data-tone="apricot" data-hot="1" className="press inline-flex min-h-12 items-center rounded-full bg-cream px-7 text-ink">
            Enter the floor
          </Link>
        </div>
      </div>
    </main>
  );
}
