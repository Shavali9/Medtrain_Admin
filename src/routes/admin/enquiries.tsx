import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { STAFF, canAccess, useSession } from "@/admin/session";
import { updateEnquiry, useAdmin } from "@/admin/store";
import type { Enquiry, EnquiryStatus } from "@/admin/types";
import { fmtDateTime, timeAgo } from "@/admin/format";
import { Chip, EmptyState, FilterSelect, Loading, NoAccess, PageHeader, Panel, Pill } from "@/admin/components/kit";
import { btnPrimary, btnSecondary, inputCls } from "@/admin/components/dialogs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { courses as catalogue } from "@/lib/courses";

export const Route = createFileRoute("/admin/enquiries")({ component: Enquiries });
const tones: Record<EnquiryStatus, "blue" | "green" | "neutral"> = { new: "blue", replied: "green", closed: "neutral" };
const labels: Record<EnquiryStatus, string> = { new: "New", replied: "Replied", closed: "Closed" };

function Enquiries() {
  const { user } = useSession(); const data = useAdmin(); const [filter, setFilter] = useState<EnquiryStatus | "">(""); const [openId, setOpenId] = useState<string | null>(null); const [reply, setReply] = useState("");
  if (!data || !user) return <Loading />;
  if (!canAccess(user.role, "enquiries")) return <NoAccess what="Enquiries" />;
  const list = data.enquiries.filter((e) => !filter || e.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (s?: EnquiryStatus) => data.enquiries.filter((e) => !s || e.status === s).length;
  const current = data.enquiries.find((e) => e.id === openId) ?? null;
  const courseOf = (e: Enquiry) => catalogue.find((c) => c.slug === e.courseSlug)?.title;

  return <>
    <PageHeader title="Enquiries" description="Questions sent from course pages and the contact links." />
    <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2"><Chip active={!filter} count={count()} onClick={() => setFilter("")}>All</Chip>{(Object.keys(labels) as EnquiryStatus[]).map((s) => <Chip key={s} active={filter === s} count={count(s)} onClick={() => setFilter(s)}>{labels[s]}</Chip>)}</div>
    {list.length === 0 ? <EmptyState title="No enquiries here">Nothing matches this filter.</EmptyState> : <Panel pad={false}><ul className="divide-y divide-border">{list.map((e) => <li key={e.id}><button type="button" onClick={() => { setOpenId(e.id); setReply(e.reply ?? ""); }} className="flex w-full flex-col gap-1.5 px-5 py-4 text-left hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none">
      <span className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{e.name}</span><span className="flex items-center gap-3 text-sm text-muted-foreground">{timeAgo(e.createdAt)}<Pill tone={tones[e.status]}>{labels[e.status]}</Pill></span></span>
      <span className="line-clamp-2 text-base text-muted-foreground">{e.message}</span>{courseOf(e) && <span className="text-sm font-semibold text-primary-strong">{courseOf(e)}</span>}</button></li>)}</ul></Panel>}

    <Sheet open={!!current} onOpenChange={(o) => !o && setOpenId(null)}><SheetContent className="w-full overflow-y-auto sm:max-w-lg">{current && <>
      <SheetHeader><SheetTitle className="text-xl font-bold">{current.name}</SheetTitle><SheetDescription>{current.id} · {fmtDateTime(current.createdAt)}</SheetDescription></SheetHeader>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"><a href={`mailto:${current.email}`} className="inline-flex items-center gap-1.5 font-semibold text-primary-strong hover:underline"><Mail size={15} aria-hidden="true" />{current.email}</a>{current.phone && <span className="inline-flex items-center gap-1.5"><Phone size={15} aria-hidden="true" />{current.phone}</span>}<Pill tone={tones[current.status]}>{labels[current.status]}</Pill></div>
      {courseOf(current) && <p className="mt-3 text-sm text-muted-foreground">About: <strong className="text-foreground">{courseOf(current)}</strong></p>}
      <blockquote className="mt-5 rounded-md bg-muted p-4 text-base leading-7">{current.message}</blockquote>
      <div className="mt-6"><FilterSelect id="enq-assign" label="Assigned to" value={current.assignedTo ?? ""} onChange={(v) => { updateEnquiry(current.id, { assignedTo: v || null }, user, v ? "Assigned enquiry" : "Unassigned enquiry"); }}><option value="">Unassigned</option>{STAFF.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</FilterSelect></div>
      <div className="mt-6"><label htmlFor="enq-reply" className="mb-1.5 block text-sm font-semibold">Reply note</label><textarea id="enq-reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} className={inputCls} placeholder="What you told the person. Kept for the team." />
        <p className="mt-1.5 text-sm text-muted-foreground">Demo mode does not send email. Reply from your own mailbox, then record it here.</p></div>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" className={btnPrimary} disabled={reply.trim().length < 3} onClick={() => { updateEnquiry(current.id, { status: "replied", reply: reply.trim(), assignedTo: current.assignedTo ?? user.id }, user, "Replied to enquiry"); toast.success("Marked as replied."); }}>Mark as replied</button><button type="button" className={btnSecondary} onClick={() => { updateEnquiry(current.id, { status: current.status === "closed" ? "new" : "closed" }, user, current.status === "closed" ? "Reopened enquiry" : "Closed enquiry"); toast.success(current.status === "closed" ? "Enquiry reopened." : "Enquiry closed."); }}>{current.status === "closed" ? "Reopen" : "Close enquiry"}</button></div></>}
    </SheetContent></Sheet>
  </>;
}
