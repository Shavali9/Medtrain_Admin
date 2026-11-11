import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { STAFF, useSession } from "@/admin/session";
import { useAdmin } from "@/admin/store";
import { appStatusLabels, appStatusOrder, type AppStatus } from "@/admin/types";
import { daysSince, fmtDate, fullName } from "@/admin/format";
import { AppStatusPill, Chip, EmptyState, FilterSelect, Loading, PageHeader, Pager, Panel, SearchBox } from "@/admin/components/kit";
import { btnSecondary } from "@/admin/components/dialogs";
import { courses as catalogue } from "@/lib/courses";

type Search = { status?: AppStatus; course?: string; q?: string; who?: "me" | "none"; sort?: "oldest"; page?: number };
const PAGE = 10;

export const Route = createFileRoute("/admin/applications/")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    ...(appStatusOrder.includes(raw["status"] as AppStatus) ? { status: raw["status"] as AppStatus } : {}),
    ...(typeof raw["course"] === "string" && raw["course"] ? { course: raw["course"] } : {}),
    ...(typeof raw["q"] === "string" && raw["q"] ? { q: raw["q"] } : {}),
    ...(raw["who"] === "me" || raw["who"] === "none" ? { who: raw["who"] } : {}),
    ...(raw["sort"] === "oldest" ? { sort: "oldest" as const } : {}),
    ...(Number(raw["page"]) > 1 ? { page: Math.floor(Number(raw["page"])) } : {}),
  }),
  component: Applications,
});

const courseTitle = (slug: string) => catalogue.find((c) => c.slug === slug)?.title ?? slug;
const staffName = (id: string | null) => (id ? STAFF.find((s) => s.id === id)?.name ?? "Unknown" : "Unassigned");

function Applications() {
  const s = Route.useSearch(); const navigate = useNavigate({ from: Route.fullPath }); const { user } = useSession(); const data = useAdmin();
  const set = (patch: Partial<Record<keyof Search, string | undefined>>) => navigate({ search: (prev: Search) => { const next: Record<string, unknown> = { ...prev, page: undefined, ...patch }; for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === "") delete next[k]; return next as Search; }, replace: true });

  const rows = useMemo(() => {
    if (!data || !user) return [];
    const q = (s.q ?? "").toLowerCase();
    return data.applications.filter((a) => (!s.status || a.status === s.status) && (!s.course || a.courseSlug === s.course) && (s.who !== "me" || a.assignedTo === user.id) && (s.who !== "none" || !a.assignedTo)
      && (!q || [a.id, fullName(a.applicant), a.applicant.registrationNumber, a.applicant.phone].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => (s.sort === "oldest" ? a.submittedAt.localeCompare(b.submittedAt) : b.submittedAt.localeCompare(a.submittedAt)));
  }, [data, user, s.status, s.course, s.q, s.who, s.sort]);

  if (!data || !user) return <Loading />;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)); const page = Math.min(s.page ?? 1, pages); const slice = rows.slice((page - 1) * PAGE, page * PAGE);
  const count = (st?: AppStatus) => data.applications.filter((a) => !st || a.status === st).length;
  const usedCourses = Array.from(new Set(data.applications.map((a) => a.courseSlug)));
  const filtered = !!(s.status || s.course || s.q || s.who);
  const go = (p: number) => navigate({ search: (prev: Search) => { const { page: _p, ...rest } = prev; void _p; return (p > 1 ? { ...rest, page: p } : rest) as Search; }, replace: true });
  const now = Date.now();

  return <>
    <PageHeader title="Applications" description="Eligibility applications from the apply form. Open one to check documents and decide." />
    <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2"><Chip active={!s.status} count={count()} onClick={() => set({ status: undefined })}>All</Chip>{appStatusOrder.map((st) => <Chip key={st} active={s.status === st} count={count(st)} onClick={() => set({ status: st })}>{appStatusLabels[st]}</Chip>)}</div>

    <Panel pad={false}>
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-[1fr_16rem_12rem_11rem]">
        <SearchBox id="app-search" value={s.q ?? ""} onSearch={(v) => set({ q: v || undefined })} placeholder="Search name, ID, registration or phone" />
        <FilterSelect id="f-course" label="Course" value={s.course ?? ""} onChange={(v) => set({ course: v || undefined })}><option value="">All courses</option>{usedCourses.map((c) => <option key={c} value={c}>{courseTitle(c)}</option>)}</FilterSelect>
        <FilterSelect id="f-who" label="Assigned to" value={s.who ?? ""} onChange={(v) => set({ who: v || undefined })}><option value="">Anyone</option><option value="me">Assigned to me</option><option value="none">Unassigned</option></FilterSelect>
        <FilterSelect id="f-sort" label="Sort" value={s.sort ?? ""} onChange={(v) => set({ sort: v || undefined })}><option value="">Newest first</option><option value="oldest">Oldest first</option></FilterSelect>
      </div>

      {slice.length === 0
        ? <div className="p-6"><EmptyState title="No applications match" action={filtered ? <button type="button" onClick={() => navigate({ search: {}, replace: true })} className={btnSecondary}>Clear filters</button> : undefined}>{filtered ? "Try removing a filter or searching for something else." : "New applications from the apply form will appear here."}</EmptyState></div>
        : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[56rem] text-left text-sm"><caption className="sr-only">Applications</caption>
            <thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground"><tr><th scope="col" className="px-4 py-3">Applicant</th><th scope="col" className="px-4 py-3">Course</th><th scope="col" className="px-4 py-3">Submitted</th><th scope="col" className="px-4 py-3">Documents</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Assigned</th></tr></thead>
            <tbody className="divide-y divide-border">{slice.map((a) => { const ok = a.docs.filter((d) => d.status === "verified").length; return <tr key={a.id} className="relative hover:bg-muted/50 has-[a:focus-visible]:bg-muted/50">
              <td className="px-4 py-3.5"><Link to="/admin/applications/$id" params={{ id: a.id }} className="font-bold text-primary-strong outline-none after:absolute after:inset-0 hover:underline">{fullName(a.applicant)}</Link><p className="text-muted-foreground">{a.id} · {a.applicant.registrationNumber}</p></td>
              <td className="max-w-[18rem] px-4 py-3.5"><span className="line-clamp-2">{courseTitle(a.courseSlug)}</span></td>
              <td className="whitespace-nowrap px-4 py-3.5">{fmtDate(a.submittedAt)}<p className="text-muted-foreground">{daysSince(a.submittedAt, now)} days ago</p></td>
              <td className="px-4 py-3.5"><span className="font-semibold tabular-nums">{ok}/{a.docs.length}</span> <span className="text-muted-foreground">verified</span><div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-muted" role="presentation"><div className="h-full rounded-full bg-success" style={{ width: `${(ok / a.docs.length) * 100}%` }} /></div></td>
              <td className="px-4 py-3.5"><AppStatusPill status={a.status} /></td>
              <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{staffName(a.assignedTo)}</td></tr>; })}</tbody></table></div>

          <ul className="divide-y divide-border md:hidden">{slice.map((a) => <li key={a.id} className="relative px-4 py-4 hover:bg-muted/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link to="/admin/applications/$id" params={{ id: a.id }} className="font-bold text-primary-strong outline-none after:absolute after:inset-0">{fullName(a.applicant)}</Link><p className="text-sm text-muted-foreground">{a.id} · {fmtDate(a.submittedAt)}</p></div><AppStatusPill status={a.status} /></div><p className="mt-2 line-clamp-2 text-sm">{courseTitle(a.courseSlug)}</p><p className="mt-1 text-sm text-muted-foreground">{a.docs.filter((d) => d.status === "verified").length}/{a.docs.length} documents verified · {staffName(a.assignedTo)}</p></li>)}</ul>
          <Pager page={page} pages={pages} total={rows.length} from={(page - 1) * PAGE + 1} to={Math.min(page * PAGE, rows.length)} onPage={go} />
        </>}
    </Panel>
  </>;
}
