import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Clock3, FileQuestion, Inbox, Search as SearchIcon, X, XCircle, type LucideIcon } from "lucide-react";
import { appStatusLabels, type AppStatus } from "@/admin/types";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { to: string; label: string } }) {
  return <div className="mb-6">
    {back && <Link to={back.to} className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary-strong hover:underline"><ArrowLeft size={16} aria-hidden="true" />{back.label}</Link>}
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="min-w-0"><h1 className="text-2xl font-extrabold text-balance md:text-3xl">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>}</div>{actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}</div>
  </div>;
}

export function Panel({ title, description, actions, children, className, pad = true }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={cn("min-w-0 rounded-card border border-border bg-background shadow-card", className)}>
    {(title || actions) && <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="text-base font-bold">{title}</h2>{description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}</div>{actions}</header>}
    <div className={cn(pad && "p-5")}>{children}</div>
  </section>;
}

export function StatCard({ label, value, hint, icon: Icon, tone = "blue" }: { label: string; value: ReactNode; hint?: string; icon: LucideIcon; tone?: "blue" | "orange" | "green" | "red" }) {
  const tones = { blue: "bg-brand-soft text-primary-strong", orange: "bg-accent/15 text-foreground", green: "bg-success/12 text-success-strong", red: "bg-destructive/10 text-destructive" };
  return <div className="rounded-card border border-border bg-background p-5 shadow-card"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-extrabold tabular-nums">{value}</p></div><span className={cn("grid h-11 w-11 place-items-center rounded-full", tones[tone])} aria-hidden="true"><Icon size={21} /></span></div>{hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}</div>;
}

const statusMeta: Record<AppStatus, { icon: LucideIcon; cls: string }> = {
  submitted: { icon: Inbox, cls: "bg-brand-soft text-primary-strong" },
  in_review: { icon: Clock3, cls: "bg-accent/15 text-foreground" },
  info_requested: { icon: FileQuestion, cls: "bg-accent/15 text-foreground" },
  eligible: { icon: CheckCircle2, cls: "bg-success/12 text-success-strong" },
  not_eligible: { icon: XCircle, cls: "bg-destructive/10 text-destructive" },
};
/** Status is always icon + text, never colour alone. */
export function AppStatusPill({ status, className }: { status: AppStatus; className?: string }) {
  const { icon: Icon, cls } = statusMeta[status];
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", cls, className)}><Icon size={13} aria-hidden="true" />{appStatusLabels[status]}</span>;
}

export function Pill({ tone = "neutral", children, icon: Icon }: { tone?: "neutral" | "green" | "orange" | "red" | "blue"; children: ReactNode; icon?: LucideIcon }) {
  const tones = { neutral: "bg-muted text-muted-foreground", green: "bg-success/12 text-success-strong", orange: "bg-accent/15 text-foreground", red: "bg-destructive/10 text-destructive", blue: "bg-brand-soft text-primary-strong" };
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>{Icon && <Icon size={13} aria-hidden="true" />}{children}</span>;
}
export const DocIcon = { pending: CircleDashed, verified: CheckCircle2, rejected: AlertTriangle } as const;

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="rounded-card border border-dashed border-border bg-muted/50 px-6 py-14 text-center"><h2 className="text-lg font-bold">{title}</h2>{children && <p className="mx-auto mt-2 max-w-md text-base leading-7 text-muted-foreground">{children}</p>}{action && <div className="mt-5">{action}</div>}</div>;
}

export function Chip({ active, count, onClick, children }: { active: boolean; count?: number; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn("inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-primary-strong hover:border-primary/50 hover:bg-brand-soft")}>{children}{count !== undefined && <span className={cn("rounded-full px-1.5 py-0.5 text-xs tabular-nums", active ? "bg-primary-foreground text-primary-strong" : "bg-brand-soft text-primary-strong")}>{count}</span>}</button>;
}

export function Loading() { return <div className="space-y-4" role="status" aria-label="Loading"><div className="h-9 w-56 animate-pulse rounded-md bg-muted" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-card bg-muted" />)}</div></div>; }

export function NoAccess({ what }: { what: string }) {
  return <div className="mx-auto max-w-lg py-16"><EmptyState title="You don’t have access to this area" action={<Link to="/admin" className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-strong">Back to overview</Link>}>{what} is available to admins only. Ask an admin if you need this changed.</EmptyState></div>;
}

/** Native select (reliable on mobile and with screen readers) styled like the rest of the site. */
export function FilterSelect({ id, label, value, onChange, children, className }: { id: string; label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return <div className={cn("relative", className)}><label htmlFor={id} className="sr-only">{label}</label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn("h-12 w-full appearance-none rounded-md border bg-background pl-4 pr-10 text-base outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring", value ? "border-primary/50 bg-brand-soft font-semibold text-primary-strong" : "border-border")}>{children}</select>
    <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-[18px] -translate-y-1/2 fill-none stroke-primary stroke-2"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>;
}

/** Search box with a short debounce; writes the settled value to `onSearch`. */
export function SearchBox({ id, value, onSearch, placeholder }: { id: string; value: string; onSearch: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  useEffect(() => { if (text.trim() === value) return; const t = setTimeout(() => onSearch(text.trim()), 250); return () => clearTimeout(t); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="relative"><label htmlFor={id} className="sr-only">{placeholder}</label><SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" aria-hidden="true" />
    <input id={id} type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-md border border-border bg-background pl-11 pr-10 text-base outline-none placeholder:text-muted-foreground hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring [&::-webkit-search-cancel-button]:hidden" />
    {text && <button type="button" onClick={() => { setText(""); onSearch(""); }} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X size={16} /></button>}</div>;
}

export function Pager({ page, pages, total, from, to, onPage }: { page: number; pages: number; total: number; from: number; to: number; onPage: (p: number) => void }) {
  if (total === 0) return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground" role="status">Showing <strong className="text-foreground">{from}–{to}</strong> of {total}</p>
    <div className="flex items-center gap-2"><button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page" className="grid size-10 place-items-center rounded-md border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft size={18} /></button><span className="min-w-20 text-center text-sm font-semibold tabular-nums">Page {page} / {pages}</span><button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page" className="grid size-10 place-items-center rounded-md border border-border hover:bg-muted disabled:opacity-40"><ChevronRight size={18} /></button></div></div>;
}
