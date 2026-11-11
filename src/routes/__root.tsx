import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import manropeLatin from "@/assets/fonts/manrope-latin.woff2?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Button } from "@/components/Button";

function NotFoundComponent() { return <div className="flex min-h-screen items-center justify-center bg-muted px-4"><div className="max-w-md text-center"><h1 className="text-3xl font-bold">Page not found</h1><p className="mt-3 text-muted-foreground">That admin page does not exist.</p><div className="mt-7 flex justify-center"><Link to="/admin" className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground">Go to dashboard</Link></div></div></div>; }
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) { console.error(error); const router = useRouter(); useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]); return <div className="flex min-h-screen items-center justify-center bg-muted px-4"><div className="max-w-md text-center"><h1 className="text-3xl font-bold">This page didn’t load</h1><p className="mt-3 text-muted-foreground">Please try again or return to the dashboard.</p><div className="mt-7 flex justify-center gap-3"><Button onClick={() => { router.invalidate(); reset(); }}>Try again</Button><Link to="/admin" className="inline-flex min-h-11 items-center rounded-md border border-primary/30 px-5 font-semibold text-primary">Go to dashboard</Link></div></div></div>; }

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { name: "theme-color", content: "#2F73B7" }, { name: "robots", content: "noindex, nofollow" }], links: [{ rel: "stylesheet", href: appCss }, { rel: "preload", href: manropeLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" }, { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }, { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" }, { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }] }),
  shellComponent: ({ children }: { children: ReactNode }) => <html lang="en"><head><HeadContent/></head><body suppressHydrationWarning>{children}<Scripts/></body></html>, component: () => { const { queryClient } = Route.useRouteContext(); return <QueryClientProvider client={queryClient}><Outlet/></QueryClientProvider>; }, notFoundComponent: NotFoundComponent, errorComponent: ErrorComponent,
});
