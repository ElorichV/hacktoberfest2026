import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMojoSession } from "@/lib/benchmark";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const mojo = getMojoSession();
    if (mojo?.email) return;
    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
