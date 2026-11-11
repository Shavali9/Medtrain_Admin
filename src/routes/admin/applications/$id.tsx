import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, BadgeCheck, CheckCircle2, CircleDashed, Eye, FileText, MessageSquarePlus, PlayCircle, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { STAFF, useSession } from "@/admin/session";
import { addApplicationNote, assignApplication, setApplicationStatus, setDocumentStatus, useAdmin } from "@/admin/store";
import type { AdminDoc, Application, StaffUser } from "@/admin/types";
import { fmtDateTime, fullName } from "@/admin/format";
import { AppStatusPill, EmptyState, FilterSelect, Loading, PageHeader, Panel, Pill } from "@/admin/components/kit";
import { btnDanger, btnPrimary, btnSecondary, ConfirmDialog, InfoDialog, inputCls, ReasonDialog } from "@/admin/components/dialogs";
import { factValue, courses as catalogue } from "@/lib/courses";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/applications/$id")({ component: ApplicationDetail });

function ApplicationDetail() {
  const { id } = Route.useParams(); const { user } = useSession(); const data = useAdmin();
  if (!data || !user) return <Loading />;
  const app = data.applications.find((a) => a.id === id);
  if (!app) return <><PageHeader title="Application not found" back={{ to: "/admin/applications", label: "All applications" }} /><EmptyState title="We can’t find that application">It may have been removed, or the link is out of date.</EmptyState></>;
  return <Detail app={app} user={user} />;
}

const Dl = ({ rows }: { rows: [string, string | undefined][] }) => <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-sm text-muted-foreground">{k}</dt><dd className="mt-0.5 whitespace-pre-line font-semibold">{v}</dd></div>)}</dl>;

function Detail({ app, user }: { app: Application; user: StaffUser }) {
  const a = app.applicant; const course = catalogue.find((c) => c.slug === app.courseSlug);
  const verified = app.docs.filter((d) => d.status === "verified").length; const allVerified = verified === app.docs.length; const anyRejected = app.docs.some((d) => d.status === "rejected");
  const decided = app.status === "eligible" || app.status === "not_eligible";
  const [dialog, setDialog] = useState<null | "info" | "reject" | "approve">(null); const [preview, setPreview] = useState<AdminDoc | null>(null); const [note, setNote] = useState("");
  const apply = (fn: () => void, msg: string) => { fn(); toast.success(msg); };

  return <>
    <PageHeader back={{ to: "/admin/applications", label: "All applications" }} title={fullName(a)} description={`${app.id} · ${course?.title ?? app.courseSlug}`}
      actions={<div className="flex items-center gap-3"><AppStatusPill status={app.status} className="!px-3 !py-1.5 !text-sm" /><FilterSelect id="assign" label="Assigned to" value={app.assignedTo ?? ""} onChange={(v) => { const s = STAFF.find((x) => x.id === v); apply(() => assignApplication(app.id, v || null, user, s?.name ?? ""), s ? `Assigned to ${s.name}` : "Unassigned"); }} className="w-56"><option value="">Unassigned</option>{STAFF.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</FilterSelect></div>} />

    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-6">
        <Panel title="Eligibility check" description="Compare the applicant against what the course requires.">
          <div className="grid gap-6 md:grid-cols-2">
            <div><h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Course requires</h3>
              <p className="mt-2 text-base font-semibold">{(course && factValue(course, "eligib")) ?? "Not specified"}</p>
              {course?.eligibility.map((b, i) => <div key={i} className="mt-3 text-sm leading-6 text-muted-foreground">{b.heading && <p className="font-semibold text-foreground">{b.heading}</p>}{b.paragraphs?.map((p) => <p key={p}>{p}</p>)}{b.items && <ul className="mt-1 list-disc space-y-0.5 pl-5">{b.items.map((it) => <li key={it}>{it}</li>)}</ul>}</div>)}</div>
            <div><h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Applicant has</h3>
              <Dl rows={[["Qualification", a.qualification], ["Year of passing MBBS", String(a.mbbsYear)], ["Medical Council registration", a.registrationNumber], ["Profession", a.profession]]} /></div>
          </div>
        </Panel>

        <Panel title="Documents" description={`${verified} of ${app.docs.length} verified. Open each file, then verify or reject it.`} pad={false}>
          <ul className="divide-y divide-border">{app.docs.map((d) => <DocRow key={d.key} doc={d} onPreview={() => setPreview(d)} onSet={(st, n) => apply(() => setDocumentStatus(app.id, d.key, st, user, n), st === "verified" ? `${d.label} verified` : st === "rejected" ? `${d.label} rejected` : `${d.label} reset`)} />)}</ul>
        </Panel>

        <Panel title="Applicant details">
          <div className="space-y-6">
            <div><h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Personal</h3><Dl rows={[["Name", fullName(a)], ["Age", String(a.age)], ["Gender", a.gender], ["Phone", a.phone], ["Nationality", a.nationality], ["State", a.state], ["GST number", a.gstNumber]]} /></div>
            <div><h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Professional</h3><Dl rows={[["Work position and experience", a.experience], ["Heard about the course via", a.referral]]} /></div>
            <div><h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Addresses</h3><Dl rows={[["Permanent address", a.permanentAddress], ["Shipping address", a.shippingAddress]]} /></div>
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Decision" description={decided ? "A decision has been recorded." : "Verify the documents, then decide."}>
          <div className="space-y-3">
            {app.decisionReason && <p className="rounded-md bg-muted p-3 text-sm leading-6"><strong>Reason:</strong> {app.decisionReason}</p>}
            {app.status === "submitted" && <button type="button" className={cn(btnPrimary, "w-full")} onClick={() => apply(() => setApplicationStatus(app.id, "in_review", user), "Review started")}><PlayCircle size={17} aria-hidden="true" />Start review</button>}
            {!decided && <>
              <button type="button" className={cn(btnPrimary, "w-full")} disabled={!allVerified} onClick={() => setDialog("approve")} aria-describedby="approve-help"><BadgeCheck size={17} aria-hidden="true" />Approve eligibility</button>
              <p id="approve-help" className="text-sm leading-6 text-muted-foreground">{allVerified ? "All documents are verified." : anyRejected ? "A rejected document must be replaced and verified first." : `Verify all documents to approve (${app.docs.length - verified} left).`}</p>
              <button type="button" className={cn(btnSecondary, "w-full")} onClick={() => setDialog("info")}><MessageSquarePlus size={17} aria-hidden="true" />Request more information</button>
              <button type="button" className={cn(btnSecondary, "w-full !border-destructive/40 !text-destructive hover:!bg-destructive/5")} onClick={() => setDialog("reject")}><XCircle size={17} aria-hidden="true" />Mark not eligible</button></>}
            {decided && <button type="button" className={cn(btnSecondary, "w-full")} onClick={() => apply(() => setApplicationStatus(app.id, "in_review", user), "Application reopened")}><RotateCcw size={17} aria-hidden="true" />Reopen for review</button>}
          </div>
        </Panel>

        <Panel title="Internal notes" description="Only staff can see these.">
          <label htmlFor="note" className="sr-only">Add a note</label><textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team" className={inputCls} />
          <button type="button" disabled={!note.trim()} onClick={() => { apply(() => addApplicationNote(app.id, note.trim(), user), "Note added"); setNote(""); }} className={cn(btnSecondary, "mt-3 w-full")}>Add note</button>
        </Panel>

        <Panel title="History" pad={false}><ol className="divide-y divide-border">{[...app.history].reverse().map((h) => <li key={h.id} className="px-5 py-3.5"><p className="text-sm leading-6">{h.kind === "note" && <Pill tone="blue">Note</Pill>} {h.text}</p><p className="mt-0.5 text-xs text-muted-foreground">{h.actor} · {fmtDateTime(h.at)}</p></li>)}</ol></Panel>
      </div>
    </div>

    <ConfirmDialog open={dialog === "approve"} onOpenChange={(o) => !o && setDialog(null)} title="Approve eligibility?" description={<>{fullName(a)} will be marked <strong>Eligible</strong> for {course?.title ?? "this course"}. Payment and enrollment follow this step.</>} confirmLabel="Approve eligibility" onConfirm={() => apply(() => setApplicationStatus(app.id, "eligible", user), "Eligibility approved")} />
    <ReasonDialog open={dialog === "info"} onOpenChange={(o) => !o && setDialog(null)} title="Request more information" description="Tell the applicant exactly what is missing or unclear." label="Message to the applicant" placeholder="For example: The PG certificate is cut off. Please upload the full page." confirmLabel="Request information" onConfirm={(t) => apply(() => setApplicationStatus(app.id, "info_requested", user, t), "Information requested")} />
    <ReasonDialog open={dialog === "reject"} onOpenChange={(o) => !o && setDialog(null)} title="Mark as not eligible" description="This records the decision and the reason. You can reopen the application later." label="Reason" placeholder="For example: The qualification is not one of the specialties listed for this course." confirmLabel="Mark not eligible" danger onConfirm={(t) => apply(() => setApplicationStatus(app.id, "not_eligible", user, t), "Marked not eligible")} />
    <InfoDialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)} title={preview?.label ?? "Document"}><p><strong>{preview?.fileName}</strong> · {preview?.sizeKB} KB</p><p className="mt-3 text-muted-foreground">File preview isn’t available in demo mode. Once uploads are connected to a backend, the applicant’s file opens here.</p></InfoDialog>
  </>;
}

const docMeta = { pending: { icon: CircleDashed, tone: "text-muted-foreground", label: "Not checked" }, verified: { icon: CheckCircle2, tone: "text-success-strong", label: "Verified" }, rejected: { icon: AlertTriangle, tone: "text-destructive", label: "Rejected" } } as const;

function DocRow({ doc, onPreview, onSet }: { doc: AdminDoc; onPreview: () => void; onSet: (s: AdminDoc["status"], note?: string) => void }) {
  const [rejecting, setRejecting] = useState(false); const [reason, setReason] = useState(""); const m = docMeta[doc.status]; const Icon = m.icon;
  return <li className="px-5 py-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><FileText size={20} className="shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="font-bold">{doc.label}</p><p className="truncate text-sm text-muted-foreground">{doc.fileName} · {doc.sizeKB} KB</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 text-sm font-bold", m.tone)}><Icon size={16} aria-hidden="true" />{m.label}</span>
        <button type="button" onClick={onPreview} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Eye size={15} aria-hidden="true" />Open</button>
        {doc.status !== "verified" && <button type="button" onClick={() => { setRejecting(false); onSet("verified"); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-success px-3 text-sm font-semibold text-primary-foreground hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><CheckCircle2 size={15} aria-hidden="true" />Verify</button>}
        {doc.status !== "rejected" && <button type="button" onClick={() => setRejecting((v) => !v)} aria-expanded={rejecting} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-sm font-semibold text-destructive hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ShieldAlert size={15} aria-hidden="true" />Reject</button>}
        {doc.status !== "pending" && <button type="button" onClick={() => onSet("pending")} className="inline-flex min-h-10 items-center rounded-md px-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Reset</button>}
      </div></div>
    {doc.note && <p className="mt-2 rounded-md bg-destructive/5 px-3 py-2 text-sm leading-6"><strong>Note:</strong> {doc.note}</p>}
    {rejecting && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><label htmlFor={`rej-${doc.key}`} className="sr-only">Why is this document rejected?</label><input id={`rej-${doc.key}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is it rejected? The applicant sees this." className={cn(inputCls, "!py-2.5")} /><button type="button" disabled={reason.trim().length < 3} onClick={() => { onSet("rejected", reason.trim()); setRejecting(false); setReason(""); }} className={cn(btnDanger, "shrink-0")}>Reject document</button></div>}
  </li>;
}
