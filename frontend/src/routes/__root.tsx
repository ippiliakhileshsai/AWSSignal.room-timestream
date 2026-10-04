import { createRootRoute, Outlet } from "@tanstack/react-router";
import { SignalProvider } from "@/components/signal/provider";
import { Cursor } from "@/components/signal/cursor";
import { RouteVeil } from "@/components/signal/veil";

export const Route = createRootRoute({
  component: () => (
    <SignalProvider>
      <Cursor />
      <RouteVeil />
      <Outlet />
    </SignalProvider>
  ),
});
