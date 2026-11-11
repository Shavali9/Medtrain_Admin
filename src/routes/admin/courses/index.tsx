import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { canAccess, useSession } from "@/admin/session";
import { useAdmin } from "@/admin/store";
import { fmtDate } from "@/admin/format";
import { EmptyState, FilterSelect, Loading, NoAccess, PageHeader, Pager, Panel, Pill, SearchBox } from "@/admin/components/kit";
import { btnPrimary, btnSecondary } from "@/admin/components/dialogs";
import { courseStatus, priceSummary } from "@/lib/courses";
import { formatStart } from "@/lib/format";
import { cn } from "@/lib/utils";

type Search = { q?: string; category?: string; vis?: "published" | "draft"; page?: number; view?: "grid" };
const PAGE = 12;
export const Route = createFileRoute("/admin/courses/")({
  validateSearch: (raw: Record<string, unknown>): Search => ({ ...(typeof raw["q"] === "string" && raw["q"] ? { q: raw["q"] } : {}), ...(typeof raw["category"] === "string" && raw["category"] ? { category: raw["category"] } : {}), ...(raw["vis"] === "published" || raw["vis"] === "draft" ? { vis: raw["vis"] } : {}), ...(raw["view"] === "grid" ? { view: "grid" as const } : {}), ...(Number(raw["page"]) > 1 ? { page: Math.floor(Number(raw["page"])) } : {}) }),
  component: Courses,
});

function Courses() {
  const s = Route.useSearch(); const navigate = useNavigate({ from: Route.fullPath }); const { user } = useSession(); const data = useAdmin();
  const set = (patch: Partial<Record<keyof Search, string | undefined>>) => navigate({ search: (prev: Search) => { const next: Record<string, unknown> = { ...prev, page: undefined, ...patch }; for (const k of Object.keys(next)) if (!next[k]) delete next[k]; return next as Search; }, replace: true });
  const rows = useMemo(() => (data?.courses ?? []).filter((c) => (!s.category || c.category === s.category) && (!s.vis || c.visibility === s.vis) && (!s.q || [c.title, c.slug, c.specialty].join(" ").toLowerCase().includes(s.q.toLowerCase()))), [data, s.q, s.category, s.vis]);
  if (!data || !user) return <Loading />;
  if (!canAccess(user.role, "courses")) return <NoAccess what="Courses" />;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)); const page = Math.min(s.page ?? 1, pages); const slice = rows.slice((page - 1) * PAGE, page * PAGE);
  const view = s.view ?? "list";
  const cats = Array.from(new Set(data.courses.map((c) => c.category)));
  const go = (p: number) => navigate({ search: (prev: Search) => { const { page: _p, ...rest } = prev; void _p; return (p > 1 ? { ...rest, page: p } : rest) as Search; }, replace: true });

  return <>
    <PageHeader title="Courses" description={`${data.courses.length} courses. Edit details, fees, batches and content, or add a new course.`} actions={<Link to="/admin/courses/new" className={btnPrimary}><Plus size={17} aria-hidden="true" />Add course</Link>} />
    <Panel pad={false}>
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_16rem_11rem_auto]">
        <SearchBox id="course-search" value={s.q ?? ""} onSearch={(v) => set({ q: v })} placeholder="Search courses" />
        <FilterSelect id="c-cat" label="Category" value={s.category ?? ""} onChange={(v) => set({ category: v })}><option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</FilterSelect>
        <FilterSelect id="c-vis" label="Visibility" value={s.vis ?? ""} onChange={(v) => set({ vis: v })}><option value="">Any visibility</option><option value="published">Published</option><option value="draft">Draft</option></FilterSelect>
        <div role="group" aria-label="Course layout" className="flex h-12 items-center gap-1 rounded-md border border-border bg-background p-1">{([["list", "List", List], ["grid", "Grid", LayoutGrid]] as const).map(([v, l, Icon]) => <button key={v} type="button" aria-pressed={view === v} onClick={() => set({ view: v === "grid" ? "grid" : undefined })} className={cn("inline-flex h-full items-center gap-2 rounded px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-brand-soft hover:text-primary-strong")}><Icon size={17} aria-hidden="true" />{l}<span className="sr-only"> view</span></button>)}</div>
      </div>
      {slice.length === 0 ? <div className="p-6"><EmptyState title="No courses match" action={<button type="button" onClick={() => navigate({ search: {}, replace: true })} className={btnSecondary}>Clear filters</button>}>Try a different search or filter.</EmptyState></div> : <>
        {view === "grid" && <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{slice.map((c) => { const st = courseStatus(c); const price = priceSummary(c); return <li key={c.id} className="relative flex flex-col overflow-hidden rounded-card border border-border bg-background transition hover:border-primary/40 hover:shadow-card has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
          <div className="aspect-[16/10] bg-muted">{c.image && <img src={c.image} alt="" className="h-full w-full object-cover" loading="lazy" />}</div>
          <div className="flex flex-1 flex-col gap-2 p-4"><div className="flex items-center justify-between gap-2"><Pill tone={c.visibility === "published" ? "green" : "orange"}>{c.visibility === "published" ? "Published" : "Draft"}</Pill>{st && <Pill tone="blue">{st}</Pill>}</div>
            <Link to="/admin/courses/$slug" params={{ slug: c.id }} className="line-clamp-2 font-bold leading-snug text-primary-strong outline-none after:absolute after:inset-0 hover:underline">{c.title}</Link>
            <p className="truncate text-sm text-muted-foreground">{c.category}</p>
            <p className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm"><span className="font-semibold">{price?.text ?? <span className="font-normal text-muted-foreground">Fee not set</span>}</span><span className="text-muted-foreground">{formatStart(c.startsOn) ? `Starts ${formatStart(c.startsOn)}` : c.duration ?? ""}</span></p></div></li>; })}</ul>}
        {view === "list" && <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[52rem] text-left text-sm"><caption className="sr-only">Courses</caption>
          <thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground"><tr><th scope="col" className="px-4 py-3">Course</th><th scope="col" className="px-4 py-3">Category</th><th scope="col" className="px-4 py-3">Schedule</th><th scope="col" className="px-4 py-3">Fee</th><th scope="col" className="px-4 py-3">Visibility</th></tr></thead>
          <tbody className="divide-y divide-border">{slice.map((c) => { const st = courseStatus(c); const price = priceSummary(c); return <tr key={c.id} className="relative hover:bg-muted/50 has-[a:focus-visible]:bg-muted/50">
            <td className="px-4 py-3.5"><div className="flex items-center gap-3">{c.image ? <img src={c.image} alt="" className="h-10 w-16 shrink-0 rounded object-cover" loading="lazy" /> : <span className="h-10 w-16 shrink-0 rounded bg-muted" />}<div className="min-w-0"><Link to="/admin/courses/$slug" params={{ slug: c.id }} className="line-clamp-2 font-bold text-primary-strong outline-none after:absolute after:inset-0 hover:underline">{c.title}</Link><p className="truncate text-muted-foreground">/{c.slug}</p></div></div></td>
            <td className="px-4 py-3.5">{c.category}</td>
            <td className="whitespace-nowrap px-4 py-3.5">{st ? <Pill tone="blue">{st}</Pill> : <span className="text-muted-foreground">—</span>}<p className="mt-1 text-muted-foreground">{formatStart(c.startsOn) ? `Starts ${formatStart(c.startsOn)}` : c.duration ?? ""}</p></td>
            <td className="whitespace-nowrap px-4 py-3.5 font-semibold">{price?.text ?? <span className="font-normal text-muted-foreground">Not set</span>}</td>
            <td className="px-4 py-3.5"><Pill tone={c.visibility === "published" ? "green" : "orange"}>{c.visibility === "published" ? "Published" : "Draft"}</Pill></td></tr>; })}</tbody></table></div>
        <ul className="divide-y divide-border md:hidden">{slice.map((c) => <li key={c.id} className="relative px-4 py-4"><div className="flex items-start justify-between gap-3"><Link to="/admin/courses/$slug" params={{ slug: c.id }} className="font-bold text-primary-strong outline-none after:absolute after:inset-0">{c.title}</Link><Pill tone={c.visibility === "published" ? "green" : "orange"}>{c.visibility === "published" ? "Published" : "Draft"}</Pill></div><p className="mt-1 text-sm text-muted-foreground">{c.category}{c.startsOn ? ` · Starts ${fmtDate(c.startsOn.length === 7 ? `${c.startsOn}-01` : c.startsOn)}` : ""}</p></li>)}</ul></>}
        <Pager page={page} pages={pages} total={rows.length} from={(page - 1) * PAGE + 1} to={Math.min(page * PAGE, rows.length)} onPage={go} /></>}
    </Panel>
  </>;
}
