import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AdminShell } from "@/admin/components/AdminShell";
import { Loading } from "@/admin/components/kit";
import { useSession } from "@/admin/session";

/** Layout for everything under /admin: signed-out visitors go to the login screen; the admin area is never indexed. */
export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MedTrain" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, ready } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const onLogin = pathname === "/admin/login";
  useEffect(() => {
    if (!ready) return;
    if (!user && !onLogin) void navigate({ to: "/admin/login", replace: true });
    if (user && onLogin) void navigate({ to: "/admin", replace: true });
  }, [ready, user, onLogin, navigate]);

  if (onLogin) return <><Outlet /><Toaster richColors position="top-right" /></>;
  if (!ready || !user) return <div className="min-h-dvh bg-muted p-8"><Loading /></div>;
  return <><AdminShell user={user}><Outlet /></AdminShell><Toaster richColors position="top-right" /></>;
}
