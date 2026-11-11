import { useSyncExternalStore } from "react";
import { courses as baseCourses } from "@/lib/courses";
import { faculty as baseFaculty } from "@/lib/faculty";
import { gallerySections as baseGallery } from "@/lib/gallery";
import { buildSeed } from "@/admin/seed";
import { emptyPatches, remove, resolvePatches, upsert, type Patches } from "@/admin/patches";
import type { ActivityEntry, AdminCourse, AdminDoc, AdminFaculty, Application, AppStatus, DocStatus, Enquiry, GalleryPhotoRec, GallerySectionRec, HistoryEntry, HistoryKind, StaffUser, Student } from "@/admin/types";
import { appStatusLabels } from "@/admin/types";

/**
 * Demo-mode data layer. State lives in this browser's localStorage and is NOT shared, secured or sent anywhere.
 * Every screen reads and writes through the functions in this file; to connect a real backend, reimplement
 * these functions (and `useAdmin`) against your API — the screens do not need to change.
 */
const KEY = "medtrain-admin-demo-v1";

type Raw = {
  v: 1; applications: Application[]; students: Student[]; enquiries: Enquiry[]; activity: ActivityEntry[];
  courses: Patches<AdminCourse>; faculty: Patches<AdminFaculty>; gallerySections: Patches<GallerySectionRec>; galleryPhotos: Record<string, Patches<GalleryPhotoRec>>;
};
export type GalleryGroup = { section: GallerySectionRec; photos: GalleryPhotoRec[] };
export type AdminView = { applications: Application[]; students: Student[]; enquiries: Enquiry[]; activity: ActivityEntry[]; courses: AdminCourse[]; faculty: AdminFaculty[]; gallery: GalleryGroup[]; persistFailed: boolean };

// ---- base (code-defined) data
const baseAdminCourses = (): AdminCourse[] => baseCourses.map((c) => ({ ...c, id: c.slug, visibility: "published" as const }));
const baseAdminFaculty = (): AdminFaculty[] => Object.values(baseFaculty).map((f) => ({ id: f.id, name: f.name, ...(f.designation ? { designation: f.designation } : {}), details: f.details ?? [], ...(f.photo ? { photo: f.photo } : {}) }));
const baseSections = (): GallerySectionRec[] => baseGallery.map((s) => ({ id: s.id, title: s.title, short: s.short, ...(s.course ? { course: s.course } : {}) }));
const basePhotos = (sectionId: string): GalleryPhotoRec[] => (baseGallery.find((s) => s.id === sectionId)?.photos ?? []).map((p) => ({ id: p.id, src: p.thumb, alt: p.alt, kind: p.kind }));

const fresh = (): Raw => ({ v: 1, ...buildSeed(), courses: emptyPatches(), faculty: emptyPatches(), gallerySections: emptyPatches(), galleryPhotos: {} });

// ---- state
let raw: Raw | null = null; let view: AdminView | null = null; let persistFailed = false;
const listeners = new Set<() => void>();

function compute(r: Raw): AdminView {
  const sections = resolvePatches(baseSections(), r.gallerySections);
  return {
    applications: r.applications, students: r.students, enquiries: r.enquiries, activity: r.activity, persistFailed,
    courses: resolvePatches(baseAdminCourses(), r.courses), faculty: resolvePatches(baseAdminFaculty(), r.faculty),
    gallery: sections.map((section) => ({ section, photos: resolvePatches(basePhotos(section.id), r.galleryPhotos[section.id] ?? emptyPatches()) })),
  };
}
function load(): Raw { try { const s = localStorage.getItem(KEY); if (s) { const p = JSON.parse(s) as Raw; if (p.v === 1) return p; } } catch { /* fall through to fresh data */ } return fresh(); }
function commit(next: Raw) {
  raw = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); persistFailed = false; } catch { persistFailed = true; } // e.g. storage full after large image uploads
  view = compute(next); listeners.forEach((l) => l());
}
function ensure(): AdminView { if (!view) { raw = load(); view = compute(raw); } return view; }
const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
/** The current data, or null while rendering on the server / before the browser has loaded it. */
export function useAdmin(): AdminView | null { return useSyncExternalStore(subscribe, () => (typeof window === "undefined" ? null : ensure()), () => null); }
const R = (): Raw => { ensure(); return raw as Raw; };

let seq = Date.now();
const uid = (p: string) => `${p}-${(seq++).toString(36)}`;
const nowIso = () => new Date().toISOString();
const entry = (actor: StaffUser, kind: HistoryKind, text: string): HistoryEntry => ({ id: uid("h"), at: nowIso(), actor: actor.name, kind, text });
const logAct = (r: Raw, actor: StaffUser, action: string, target: string): ActivityEntry[] => [{ id: uid("act"), at: nowIso(), actor: actor.name, role: actor.role, action, target }, ...r.activity].slice(0, 300);

// ---- applications
function updateApp(id: string, actor: StaffUser, fn: (a: Application) => Application, action: string) {
  const r = R(); const target = r.applications.find((a) => a.id === id); if (!target) return;
  commit({ ...r, applications: r.applications.map((a) => (a.id === id ? fn(a) : a)), activity: logAct(r, actor, action, id) });
}
export function setApplicationStatus(id: string, status: AppStatus, actor: StaffUser, reason?: string) {
  const text = status === "info_requested" ? `More information requested: ${reason}` : status === "not_eligible" ? `Marked not eligible: ${reason}` : status === "eligible" ? "Eligibility confirmed" : `Status changed to ${appStatusLabels[status]}`;
  updateApp(id, actor, (a) => ({ ...a, status, ...(reason ? { decisionReason: reason } : {}), assignedTo: a.assignedTo ?? actor.id, history: [...a.history, entry(actor, "status", text)] }), text);
}
export function setDocumentStatus(id: string, key: AdminDoc["key"], status: DocStatus, actor: StaffUser, note?: string) {
  updateApp(id, actor, (a) => {
    const doc = a.docs.find((d) => d.key === key); if (!doc) return a;
    const { note: _old, ...rest } = doc; void _old;
    const next: AdminDoc = { ...rest, status, ...(note ? { note } : {}) };
    return { ...a, docs: a.docs.map((d) => (d.key === key ? next : d)), history: [...a.history, entry(actor, "document", `${doc.label}: ${status === "verified" ? "verified" : status === "rejected" ? `rejected${note ? ` (${note})` : ""}` : "reset to pending"}`)] };
  }, `Document ${status}: ${key}`);
}
export function assignApplication(id: string, userId: string | null, actor: StaffUser, name: string) { updateApp(id, actor, (a) => ({ ...a, assignedTo: userId, history: [...a.history, entry(actor, "assigned", userId ? `Assigned to ${name}` : "Unassigned")] }), userId ? `Assigned to ${name}` : "Unassigned"); }
export function addApplicationNote(id: string, text: string, actor: StaffUser) { updateApp(id, actor, (a) => ({ ...a, history: [...a.history, entry(actor, "note", text)] }), "Added a note"); }

// ---- students & enquiries
export function setStudentStatus(id: string, status: Student["status"], actor: StaffUser) { const r = R(); commit({ ...r, students: r.students.map((s) => (s.id === id ? { ...s, status } : s)), activity: logAct(r, actor, status === "suspended" ? "Suspended student" : "Reactivated student", id) }); }
export function updateEnquiry(id: string, patch: Partial<Enquiry>, actor: StaffUser, action: string) { const r = R(); commit({ ...r, enquiries: r.enquiries.map((e) => (e.id === id ? { ...e, ...patch } : e)), activity: logAct(r, actor, action, id) }); }

// ---- courses
export function saveCourse(course: AdminCourse, actor: StaffUser, isNew = false) { const r = R(); commit({ ...r, courses: upsert(r.courses, baseAdminCourses(), course), activity: logAct(r, actor, isNew ? "Created course" : "Edited course", course.title) }); }
export function deleteCourse(id: string, title: string, actor: StaffUser) { const r = R(); commit({ ...r, courses: remove(r.courses, id), activity: logAct(r, actor, "Deleted course", title) }); }

// ---- faculty
export function saveFaculty(f: AdminFaculty, actor: StaffUser, isNew = false) { const r = R(); commit({ ...r, faculty: upsert(r.faculty, baseAdminFaculty(), f), activity: logAct(r, actor, isNew ? "Added faculty member" : "Edited faculty member", f.name) }); }
export function deleteFaculty(id: string, name: string, actor: StaffUser) { const r = R(); commit({ ...r, faculty: remove(r.faculty, id), activity: logAct(r, actor, "Removed faculty member", name) }); }

// ---- gallery
const photoPatches = (r: Raw, sid: string) => r.galleryPhotos[sid] ?? emptyPatches<GalleryPhotoRec>();
export function addGalleryPhotos(sid: string, photos: GalleryPhotoRec[], actor: StaffUser) { const r = R(); let p = photoPatches(r, sid); const base = basePhotos(sid); for (const ph of photos) p = upsert(p, base, ph); commit({ ...r, galleryPhotos: { ...r.galleryPhotos, [sid]: p }, activity: logAct(r, actor, `Uploaded ${photos.length} photo${photos.length === 1 ? "" : "s"}`, sid) }); }
export function updateGalleryPhoto(sid: string, photo: GalleryPhotoRec, actor: StaffUser) { const r = R(); commit({ ...r, galleryPhotos: { ...r.galleryPhotos, [sid]: upsert(photoPatches(r, sid), basePhotos(sid), photo) }, activity: logAct(r, actor, "Edited photo details", `${sid}/${photo.id}`) }); }
export function deleteGalleryPhoto(sid: string, id: string, actor: StaffUser) { const r = R(); commit({ ...r, galleryPhotos: { ...r.galleryPhotos, [sid]: remove(photoPatches(r, sid), id) }, activity: logAct(r, actor, "Deleted photo", `${sid}/${id}`) }); }
export function moveGalleryPhoto(sid: string, id: string, dir: -1 | 1, current: GalleryPhotoRec[], actor: StaffUser) {
  const ids = current.map((p) => p.id); const i = ids.indexOf(id); const j = i + dir; if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j] as string, ids[i] as string]; const r = R();
  commit({ ...r, galleryPhotos: { ...r.galleryPhotos, [sid]: { ...photoPatches(r, sid), order: ids } }, activity: logAct(r, actor, "Reordered photos", sid) });
}
export function saveGallerySection(s: GallerySectionRec, actor: StaffUser, isNew = false) { const r = R(); commit({ ...r, gallerySections: upsert(r.gallerySections, baseSections(), s), activity: logAct(r, actor, isNew ? "Created gallery program" : "Edited gallery program", s.title) }); }

// ---- demo utilities
export function resetDemoData(actor: StaffUser) { const f = fresh(); commit({ ...f, activity: logAct(f, actor, "Reset demo data", "all") }); }
export const uniqueId = uid;
