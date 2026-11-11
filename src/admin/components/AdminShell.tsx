import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck, GraduationCap, History, Images, LayoutDashboard, LogOut, Menu, MessageSquare, RotateCcw, UserRound, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import logoWhiteUrl from "@/assets/medtrain-logo-white.svg";
import { canAccess, signOut, type Area } from "@/admin/session";
import { resetDemoData, useAdmin } from "@/admin/store";
import type { StaffUser } from "@/admin/types";
import { initialsOf } from "@/admin/format";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV: { area: Area; label: string; to: string; icon: LucideIcon }[] = [
  { area: "overview", label: "Overview", to: "/admin", icon: LayoutDashboard },
  { area: "applications", label: "Applications", to: "/admin/applications", icon: ClipboardCheck },
  { area: "courses", label: "Courses", to: "/admin/courses", icon: BookOpen },
  { area: "faculty", label: "Faculty", to: "/admin/faculty", icon: GraduationCap },
  { area: "gallery", label: "Gallery", to: "/admin/gallery", icon: Images },
  { area: "students", label: "Students", to: "/admin/students", icon: UserRound },
  { area: "enquiries", label: "Enquiries", to: "/admin/enquiries", icon: MessageSquare },
  { area: "activity", label: "Activity", to: "/admin/activity", icon: History },
];

function NavList({ user, onNavigate }: { user: StaffUser; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const data = useAdmin();
  const counts: Partial<Record<Area, number>> = { applications: data?.applications.filter((a) => a.status === "submitted").length ?? 0, enquiries: data?.enquiries.filter((e) => e.status === "new").length ?? 0 };
  return <nav aria-label="Admin" className="flex flex-col gap-1">
    {NAV.filter((n) => canAccess(user.role, n.area)).map(({ label, to, icon: Icon, area }) => {
      const active = to === "/admin" ? pathname === "/admin" : pathname.startsWith(to); const n = counts[area];
      return <Link key={to} to={to} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-primary-foreground/75 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground", active && "bg-primary-foreground/12 text-primary-foreground before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r before:bg-accent")}>
        <Icon size={18} aria-hidden="true" /><span className="flex-1">{label}</span>{!!n && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-ink" aria-label={`${n} new`}>{n}</span>}
      </Link>;
    })}
  </nav>;
}

const Brand = () => <Link to="/admin" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground" aria-label="MedTrain admin home"><img src={logoWhiteUrl} alt="MedTrain" width={118} height={37} className="h-9 w-auto" /><span className="rounded bg-primary-foreground/15 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">Admin</span></Link>;

export function AdminShell({ user, children }: { user: StaffUser; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-dvh bg-muted lg:grid lg:grid-cols-[16rem_1fr]">
    <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto bg-ink p-4 lg:flex"><div className="px-2 pt-2"><Brand /></div><NavList user={user} /><div className="mt-auto"><Link to="/" className="flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-primary-foreground/70 hover:text-primary-foreground">← View public site</Link></div></aside>

    <div className="min-w-0">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="grid size-11 place-items-center rounded-md border border-border text-primary-strong hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"><Menu size={20} /></button><span className="text-sm font-semibold text-muted-foreground lg:hidden">MedTrain Admin</span></div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right leading-tight sm:block"><span className="block text-sm font-bold">{user.name}</span><span className="block text-xs capitalize text-muted-foreground">{user.role}</span></span>
          <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-sm font-bold text-primary-strong" aria-hidden="true">{initialsOf(user.name)}</span>
          <button type="button" onClick={() => signOut()} aria-label="Sign out" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LogOut size={16} aria-hidden="true" /><span className="hidden sm:inline">Sign out</span></button>
        </div>
      </header>
      <DemoBanner user={user} />
      <main id="main" className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>

    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 border-0 bg-ink p-4 text-primary-foreground [&>button]:text-primary-foreground">
        <SheetTitle className="sr-only">Admin menu</SheetTitle>
        <div className="mb-6 mt-1 px-2"><Brand /></div><NavList user={user} onNavigate={() => setOpen(false)} />
        <Link to="/" onClick={() => setOpen(false)} className="mt-6 flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-primary-foreground/70 hover:text-primary-foreground">← View public site</Link>
        <button type="button" onClick={() => setOpen(false)} className="sr-only"><X />Close</button>
      </SheetContent>
    </Sheet>
  </div>;
}

function DemoBanner({ user }: { user: StaffUser }) {
  const data = useAdmin();
  return <section aria-label="Demo mode notice" className="border-b border-accent/40 bg-accent/10 px-4 py-2.5 text-sm sm:px-6 lg:px-8"><div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-1">
    <p className="leading-6"><strong className="font-bold">Demo mode.</strong> Sample data, stored only in this browser. Nothing here is secured, shared or sent to the public site.{data?.persistFailed && <span className="font-bold text-destructive"> Browser storage is full: recent changes may not be saved.</span>}</p>
    {user.role === "admin" && <button type="button" onClick={() => { resetDemoData(user); toast.success("Sample data reset."); }} className="inline-flex min-h-9 items-center gap-1.5 font-bold text-primary-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw size={14} aria-hidden="true" />Reset sample data</button>}
  </div></section>;
}
