import { createFileRoute, redirect } from "@tanstack/react-router";

/** This app is the admin only; send the root address to the dashboard. */
export const Route = createFileRoute("/")({ beforeLoad: () => { throw redirect({ to: "/admin", replace: true }); } });
