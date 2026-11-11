import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { canAccess, useSession } from "@/admin/session";
import { addGalleryPhotos, deleteGalleryPhoto, moveGalleryPhoto, saveGallerySection, updateGalleryPhoto, uniqueId, useAdmin } from "@/admin/store";
import type { GalleryPhotoRec, GallerySectionRec, StaffUser } from "@/admin/types";
import { imageToDataUrl } from "@/admin/format";
import { Chip, EmptyState, Loading, NoAccess, PageHeader, Panel } from "@/admin/components/kit";
import { TextField, F, textInput } from "@/admin/components/formkit";
import { btnPrimary, btnSecondary, ConfirmDialog } from "@/admin/components/dialogs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { courses as catalogue } from "@/lib/courses";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/gallery")({
  validateSearch: (raw: Record<string, unknown>): { program?: string } => (typeof raw["program"] === "string" && raw["program"] ? { program: raw["program"] } : {}),
  component: Gallery,
});

function Gallery() {
  const { program } = Route.useSearch(); const navigate = useNavigate({ from: Route.fullPath }); const { user } = useSession(); const data = useAdmin();
  const file = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [section, setSection] = useState<{ item: GallerySectionRec; isNew: boolean } | null>(null); const [del, setDel] = useState<{ sid: string; photo: GalleryPhotoRec } | null>(null);
  if (!data || !user) return <Loading />;
  if (!canAccess(user.role, "gallery")) return <NoAccess what="Gallery" />;
  const group = data.gallery.find((g) => g.section.id === program) ?? data.gallery[0];
  if (!group) return <><PageHeader title="Gallery" /><EmptyState title="No programs yet" action={<button type="button" className={btnPrimary} onClick={() => setSection({ item: { id: "", title: "", short: "" }, isNew: true })}>Add program</button>}>Add a program to start uploading photos.</EmptyState></>;
  const sid = group.section.id;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return; setBusy(true); const made: GalleryPhotoRec[] = []; let failed = 0;
    for (const f of Array.from(files)) { try { made.push({ id: uniqueId("up"), src: await imageToDataUrl(f, 1600), alt: `Photo ${group.photos.length + made.length + 1} from the ${group.section.short} personal contact sessions`, kind: "photo" }); } catch { failed++; } }
    if (made.length) { addGalleryPhotos(sid, made, user); toast.success(`${made.length} photo${made.length === 1 ? "" : "s"} uploaded.`); }
    if (failed) toast.error(`${failed} file${failed === 1 ? "" : "s"} could not be used. Choose images under 15 MB.`); setBusy(false);
  };

  return <>
    <PageHeader title="Gallery" description="Photos from personal contact sessions, grouped by program. Add alt text so everyone can understand each photo." actions={<><button type="button" className={btnSecondary} onClick={() => setSection({ item: { id: "", title: "", short: "" }, isNew: true })}><Plus size={17} aria-hidden="true" />Add program</button></>} />
    <div role="group" aria-label="Program" className="mb-6 flex flex-wrap gap-2">{data.gallery.map((g) => <Chip key={g.section.id} active={g.section.id === sid} count={g.photos.length} onClick={() => navigate({ search: { program: g.section.id }, replace: true })}>{g.section.short}</Chip>)}</div>

    <Panel title={group.section.title} description={`${group.photos.length} photos${group.section.course ? " · linked to a course page" : ""}`} actions={<div className="flex flex-wrap gap-2"><button type="button" className={cn(btnSecondary, "!min-h-10")} onClick={() => setSection({ item: group.section, isNew: false })}><Pencil size={15} aria-hidden="true" />Edit program</button>
      <input ref={file} type="file" accept="image/*" multiple className="sr-only" id="gal-up" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} /><label htmlFor="gal-up" className={cn(btnPrimary, "!min-h-10 cursor-pointer", busy && "pointer-events-none opacity-60")}><ImagePlus size={16} aria-hidden="true" />{busy ? "Uploading…" : "Upload photos"}</label></div>}>
      {group.photos.length === 0 ? <EmptyState title="No photos in this program yet">Upload photos to show them on the gallery page.</EmptyState> : <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{group.photos.map((p, i) => <PhotoCard key={p.id} p={p} index={i} total={group.photos.length} user={user} sid={sid} all={group.photos} onDelete={() => setDel({ sid, photo: p })} />)}</ul>}
    </Panel>

    {section && <SectionDialog key={section.item.id || "new"} initial={section.item} isNew={section.isNew} user={user} existing={data.gallery.map((g) => g.section.id)} onClose={(id) => { setSection(null); if (id) navigate({ search: { program: id }, replace: true }); }} />}
    <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger title="Delete this photo?" description="It will be removed from this program. Use Reset sample data to restore the original photos." confirmLabel="Delete photo" onConfirm={() => { if (del) { deleteGalleryPhoto(del.sid, del.photo.id, user); toast.success("Photo deleted."); } setDel(null); }} />
  </>;
}

function PhotoCard({ p, index, total, user, sid, all, onDelete }: { p: GalleryPhotoRec; index: number; total: number; user: StaffUser; sid: string; all: GalleryPhotoRec[]; onDelete: () => void }) {
  const [alt, setAlt] = useState(p.alt);
  const commit = () => { const v = alt.trim(); if (v && v !== p.alt) { updateGalleryPhoto(sid, { ...p, alt: v }, user); toast.success("Alt text saved."); } else setAlt(p.alt); };
  return <li className="overflow-hidden rounded-card border border-border bg-background">
    <div className="aspect-video bg-muted"><img src={p.src} alt={p.alt} loading="lazy" className={cn("size-full", p.kind === "graphic" ? "object-contain" : "object-cover")} /></div>
    <div className="space-y-3 p-3">
      <F label="Alt text" hint="Describe the photo for people who can’t see it.">{(a) => <textarea {...a} rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} onBlur={commit} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring" />}</F>
      <div className="flex items-center justify-between gap-2">
        <F label="Type" className="w-36">{(a) => <select {...a} value={p.kind} onChange={(e) => updateGalleryPhoto(sid, { ...p, kind: e.target.value as GalleryPhotoRec["kind"] }, user)} className={cn(textInput(), "!h-10 text-sm")}><option value="photo">Photo</option><option value="graphic">Graphic</option></select>}</F>
        <div className="flex items-end gap-1 self-end"><button type="button" disabled={index === 0} onClick={() => moveGalleryPhoto(sid, p.id, -1, all, user)} aria-label={`Move photo ${index + 1} earlier`} className="grid size-10 place-items-center rounded-md border border-border hover:bg-muted disabled:opacity-40"><ArrowLeft size={16} /></button><button type="button" disabled={index === total - 1} onClick={() => moveGalleryPhoto(sid, p.id, 1, all, user)} aria-label={`Move photo ${index + 1} later`} className="grid size-10 place-items-center rounded-md border border-border hover:bg-muted disabled:opacity-40"><ArrowRight size={16} /></button><button type="button" onClick={onDelete} aria-label={`Delete photo ${index + 1}`} className="grid size-10 place-items-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/5"><Trash2 size={16} /></button></div></div>
    </div></li>;
}

function SectionDialog({ initial, isNew, user, existing, onClose }: { initial: GallerySectionRec; isNew: boolean; user: StaffUser; existing: string[]; onClose: (id?: string) => void }) {
  const [s, setS] = useState(initial); const [err, setErr] = useState<{ title?: string; short?: string }>({});
  const save = () => {
    const e: typeof err = {}; if (!s.title.trim()) e.title = "Enter the program name."; if (!s.short.trim()) e.short = "Enter a short label (for the filter chip).";
    setErr(e); if (Object.keys(e).length) return;
    let id = s.id; if (isNew) { id = s.short.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uniqueId("program"); if (existing.includes(id)) id = `${id}-${Date.now().toString(36)}`; }
    saveGallerySection({ ...s, id, title: s.title.trim(), short: s.short.trim() }, user, isNew); toast.success(isNew ? "Program added." : "Program saved."); onClose(id);
  };
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="text-xl font-bold">{isNew ? "Add program" : "Edit program"}</DialogTitle><DialogDescription>Programs group photos on the gallery page.</DialogDescription></DialogHeader>
    <div className="space-y-4"><TextField label="Program name" required value={s.title} error={err.title} onChange={(v) => setS({ ...s, title: v })} placeholder="e.g. Neonatal Ventilation Certification Course" /><TextField label="Short label" required value={s.short} error={err.short} hint="Shown on the filter chip, e.g. “Neovent”." onChange={(v) => setS({ ...s, short: v })} />
      <F label="Linked course" hint="Adds a “View course” link on the gallery page.">{(a) => <select {...a} value={s.course ?? ""} onChange={(e) => setS((x) => { const { course: _c, ...rest } = x; void _c; return e.target.value ? { ...rest, course: e.target.value } : rest; })} className={textInput()}><option value="">No linked course</option>{catalogue.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>}</F></div>
    <DialogFooter className="gap-2 sm:gap-2"><button type="button" className={btnSecondary} onClick={() => onClose()}>Cancel</button><button type="button" className={btnPrimary} onClick={save}>{isNew ? "Add program" : "Save"}</button></DialogFooter></DialogContent></Dialog>;
}
