import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { canAccess, useSession } from "@/admin/session";
import { setStudentStatus, useAdmin } from "@/admin/store";
import type { Student } from "@/admin/types";
import { fmtDate, fullName, initialsOf } from "@/admin/format";
import { AppStatusPill, EmptyState, FilterSelect, Loading, NoAccess, PageHeader, Pager, Panel, Pill, SearchBox } from "@/admin/components/kit";
import { btnPrimary, btnSecondary, ConfirmDialog } from "@/admin/components/dialogs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { courses as catalogue } from "@/lib/courses";

export const Route = createFileRoute("/admin/students")({ component: Students });
const PAGE = 12;

function Students() {
  const { user } = useSession(); const data = useAdmin(); const [q, setQ] = useState(""); const [st, setSt] = useState(""); const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Student | null>(null); const [confirm, setConfirm] = useState<Student | null>(null);
  const rows = useMemo(() => (data?.students ?? []).filter((s) => (!st || s.status === st) && (!q || [s.name, s.email, s.phone, s.id].join(" ").toLowerCase().includes(q.toLowerCase()))), [data, q, st]);
  if (!data || !user) return <Loading />;
  if (!canAccess(user.role, "students")) return <NoAccess what="Students" />;
  const appsOf = (s: Student) => data.applications.filter((a) => fullName(a.applicant).replace(/^(Dr\.|Ms\.|Mr\.)\s+/, "") === s.name);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)); const p = Math.min(page, pages); const slice = rows.slice((p - 1) * PAGE, p * PAGE);
  const current = open ? data.students.find((s) => s.id === open.id) ?? open : null;

  return <>
    <PageHeader title="Students" description="People who have registered an account." />
    <Panel pad={false}>
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_12rem]"><SearchBox id="stu-search" value={q} onSearch={(v) => { setQ(v); setPage(1); }} placeholder="Search name, email or phone" /><FilterSelect id="stu-st" label="Status" value={st} onChange={(v) => { setSt(v); setPage(1); }}><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></FilterSelect></div>
      {slice.length === 0 ? <div className="p-6"><EmptyState title="No students match">Try a different search.</EmptyState></div> : <>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Students table"><table className="w-full min-w-[44rem] text-left text-sm"><caption className="sr-only">Students</caption><thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground"><tr><th scope="col" className="px-4 py-3">Student</th><th scope="col" className="px-4 py-3">Contact</th><th scope="col" className="px-4 py-3">Registered</th><th scope="col" className="px-4 py-3">Applications</th><th scope="col" className="px-4 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-border">{slice.map((s) => <tr key={s.id} className="relative hover:bg-muted/50 has-[button:focus-visible]:bg-muted/50"><td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-primary-strong" aria-hidden="true">{initialsOf(s.name)}</span><div><button type="button" onClick={() => setOpen(s)} className="font-bold text-primary-strong outline-none after:absolute after:inset-0 hover:underline">{s.name}</button><p className="text-muted-foreground">{s.id}</p></div></div></td>
            <td className="px-4 py-3.5">{s.email}<p className="text-muted-foreground">{s.phone}</p></td><td className="whitespace-nowrap px-4 py-3.5">{fmtDate(s.registeredAt)}</td><td className="px-4 py-3.5 tabular-nums">{appsOf(s).length}</td><td className="px-4 py-3.5"><Pill tone={s.status === "active" ? "green" : "red"}>{s.status === "active" ? "Active" : "Suspended"}</Pill></td></tr>)}</tbody></table></div>
        <Pager page={p} pages={pages} total={rows.length} from={(p - 1) * PAGE + 1} to={Math.min(p * PAGE, rows.length)} onPage={setPage} /></>}
    </Panel>

    <Sheet open={!!current} onOpenChange={(o) => !o && setOpen(null)}><SheetContent className="w-full overflow-y-auto sm:max-w-md">{current && <>
      <SheetHeader><SheetTitle className="text-xl font-bold">{current.name}</SheetTitle><SheetDescription>{current.id} · Registered {fmtDate(current.registeredAt)}</SheetDescription></SheetHeader>
      <dl className="mt-6 space-y-4"><div><dt className="text-sm text-muted-foreground">Email</dt><dd className="font-semibold">{current.email}</dd></div><div><dt className="text-sm text-muted-foreground">Phone</dt><dd className="font-semibold">{current.phone}</dd></div><div><dt className="text-sm text-muted-foreground">Account status</dt><dd className="mt-1"><Pill tone={current.status === "active" ? "green" : "red"}>{current.status === "active" ? "Active" : "Suspended"}</Pill></dd></div></dl>
      <h3 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wider text-muted-foreground">Applications</h3>
      {appsOf(current).length ? <ul className="space-y-2">{appsOf(current).map((a) => <li key={a.id}><Link to="/admin/applications/$id" params={{ id: a.id }} className="block rounded-md border border-border p-3 hover:bg-muted"><span className="flex items-center justify-between gap-2"><span className="font-bold">{a.id}</span><AppStatusPill status={a.status} /></span><span className="mt-1 block text-sm text-muted-foreground">{catalogue.find((c) => c.slug === a.courseSlug)?.title}</span></Link></li>)}</ul> : <p className="text-base text-muted-foreground">No applications yet.</p>}
      <div className="mt-8">{current.status === "active" ? <button type="button" className={btnSecondary} onClick={() => setConfirm(current)}>Suspend account</button> : <button type="button" className={btnPrimary} onClick={() => { setStudentStatus(current.id, "active", user); toast.success("Account reactivated."); }}>Reactivate account</button>}</div></>}
    </SheetContent></Sheet>
    <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} danger title="Suspend this account?" description={<>{confirm?.name} will not be able to sign in while suspended. You can reactivate the account at any time.</>} confirmLabel="Suspend account" onConfirm={() => { if (confirm) { setStudentStatus(confirm.id, "suspended", user); toast.success("Account suspended."); } setConfirm(null); }} />
  </>;
}
