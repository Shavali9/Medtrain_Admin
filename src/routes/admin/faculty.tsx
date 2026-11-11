import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { canAccess, useSession } from "@/admin/session";
import { deleteFaculty, saveFaculty, useAdmin } from "@/admin/store";
import type { AdminFaculty, StaffUser } from "@/admin/types";
import { EmptyState, Loading, NoAccess, PageHeader, Pager, Panel, SearchBox } from "@/admin/components/kit";
import { AreaField, ImageField, TextField } from "@/admin/components/formkit";
import { btnPrimary, btnSecondary, ConfirmDialog } from "@/admin/components/dialogs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/faculty")({ component: Faculty });
const PAGE = 24;

function Faculty() {
  const { user } = useSession(); const data = useAdmin();
  const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<{ item: AdminFaculty; isNew: boolean } | null>(null); const [del, setDel] = useState<AdminFaculty | null>(null);
  const rows = useMemo(() => (data?.faculty ?? []).filter((f) => !q || [f.name, f.designation ?? "", ...f.details].join(" ").toLowerCase().includes(q.toLowerCase())), [data, q]);
  if (!data || !user) return <Loading />;
  if (!canAccess(user.role, "faculty")) return <NoAccess what="Faculty" />;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)); const p = Math.min(page, pages); const slice = rows.slice((p - 1) * PAGE, p * PAGE);

  return <>
    <PageHeader title="Faculty" description={`${data.faculty.length} faculty profiles shown across the site and on course pages.`} actions={<button type="button" className={btnPrimary} onClick={() => setEdit({ item: { id: "", name: "", details: [] }, isNew: true })}><Plus size={17} aria-hidden="true" />Add faculty member</button>} />
    <div className="mb-4 max-w-md"><SearchBox id="fac-search" value={q} onSearch={(v) => { setQ(v); setPage(1); }} placeholder="Search by name or qualification" /></div>
    {slice.length === 0 ? <EmptyState title="No faculty match">Try a different search.</EmptyState> : <Panel pad={false}>
      <ul className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">{slice.map((f) => <li key={f.id} className="flex gap-4 bg-background p-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-full bg-brand-soft">{f.photo ? <img src={f.photo} alt="" loading="lazy" className="size-full object-cover object-top" /> : <span className="grid size-full place-items-center text-primary/40" aria-hidden="true"><UserRound size={32} /></span>}</div>
        <div className="min-w-0 flex-1"><p className="font-bold leading-snug">{f.name}</p>{f.designation && <p className="text-sm font-semibold text-primary-strong">{f.designation}</p>}<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.details.join(" · ") || "No details yet"}</p>
          <div className="mt-2 flex gap-1"><button type="button" onClick={() => setEdit({ item: f, isNew: false })} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-primary-strong hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Pencil size={14} aria-hidden="true" />Edit<span className="sr-only"> {f.name}</span></button><button type="button" onClick={() => setDel(f)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-destructive hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 size={14} aria-hidden="true" />Remove<span className="sr-only"> {f.name}</span></button></div></div></li>)}</ul>
      <Pager page={p} pages={pages} total={rows.length} from={(p - 1) * PAGE + 1} to={Math.min(p * PAGE, rows.length)} onPage={setPage} /></Panel>}

    {edit && <FacultyDialog key={edit.item.id || "new"} initial={edit.item} isNew={edit.isNew} user={user} existingIds={data.faculty.map((f) => f.id)} onClose={() => setEdit(null)} />}
    <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger title="Remove this faculty member?" description={<><strong>{del?.name}</strong> will no longer appear in the faculty list. Use Reset sample data to restore.</>} confirmLabel="Remove" onConfirm={() => { if (del) { deleteFaculty(del.id, del.name, user); toast.success("Faculty member removed."); } setDel(null); }} />
  </>;
}

function FacultyDialog({ initial, isNew, user, existingIds, onClose }: { initial: AdminFaculty; isNew: boolean; user: StaffUser; existingIds: string[]; onClose: () => void }) {
  const [f, setF] = useState(initial); const [err, setErr] = useState<string>();
  const save = () => {
    if (!f.name.trim()) { setErr("Enter the person’s name."); return; }
    let id = f.id; if (isNew) { id = f.name.toLowerCase().replace(/^dr\.?\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `member-${Date.now()}`; if (existingIds.includes(id)) id = `${id}-${Date.now().toString(36)}`; }
    saveFaculty({ ...f, id, name: f.name.trim(), details: f.details.map((d) => d.trim()).filter(Boolean) }, user, isNew); toast.success(isNew ? "Faculty member added." : "Changes saved."); onClose();
  };
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="text-xl font-bold">{isNew ? "Add faculty member" : "Edit faculty member"}</DialogTitle><DialogDescription>Real photos only. Leave the photo empty and a neutral placeholder is shown.</DialogDescription></DialogHeader>
    <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
      <ImageField label="Photo" aspect="aspect-[4/5]" maxWidth={640} value={f.photo} alt={`Portrait of ${f.name}`} onChange={(v) => setF((x) => { const { photo: _p, ...rest } = x; void _p; return v ? { ...rest, photo: v } : rest; })} />
      <div className="space-y-4"><TextField label="Name" required value={f.name} error={err} onChange={(v) => { setErr(undefined); setF({ ...f, name: v }); }} placeholder="Dr. Full Name" />
        <TextField label="Designation" value={f.designation ?? ""} placeholder="e.g. Program Director" onChange={(v) => setF((x) => { const { designation: _d, ...rest } = x; void _d; return v ? { ...rest, designation: v } : rest; })} />
        <AreaField label="Qualifications and roles" rows={5} value={f.details.join("\n")} hint="One line per item." onChange={(v) => setF({ ...f, details: v.split("\n") })} /></div></div>
    <DialogFooter className="gap-2 sm:gap-2"><button type="button" className={btnSecondary} onClick={onClose}>Cancel</button><button type="button" className={btnPrimary} onClick={save}>{isNew ? "Add member" : "Save changes"}</button></DialogFooter></DialogContent></Dialog>;
}
