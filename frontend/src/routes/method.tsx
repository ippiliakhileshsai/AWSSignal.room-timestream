import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/signal/shell";

export const Route = createFileRoute("/method")({ component: MethodPage });

const BLOCKS = [
  {
    title: "The pipe",
    body: "A simulator, or later a sensor, publishes to an MQTT topic. IoT Core accepts it. A rule writes the message. Timestream for InfluxDB keeps it. This screen only reads.",
  },
  {
    title: "The time model",
    body: "device_id is a tag. Each room carries five fields — heat, humidity, and three of its own. Every question is a window, never a full scan.",
  },
  {
    title: "The security habit",
    body: "One Thing, one certificate, a policy that can only publish to its own topic. The AWS root user stays unused. The browser never holds a database credential.",
  },
  {
    title: "The cost habit",
    body: "Smallest instance. A budget alarm. Stop and delete after the lab. This demo keeps about half an hour, not a year.",
  },
];

function MethodPage() {
  return (
    <Shell title="Method" kicker="HOW IT RUNS">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <p className="font-display text-3xl leading-snug sm:text-4xl">Rooms → IoT Core → Rule → Timestream → Ask → Floor</p>
        <div className="grid gap-4">
          {BLOCKS.map((block, index) => (
            <article key={block.title} className={`rise d${index + 1} rounded-3xl bg-panel p-6 shadow-card`}>
              <h2 className="font-display text-2xl">{block.title}</h2>
              <p className="mt-2 max-w-2xl text-ink-soft">{block.body}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted">
          This screen reads a 10-second feed and keeps the questions you ask. A physical device, the mail, and Timestream itself are the next connection.
        </p>
      </div>
    </Shell>
  );
}
