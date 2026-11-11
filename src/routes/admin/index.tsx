import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck, Clock3, FileQuestion, Inbox, MessageSquare, BookOpen, UserCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSession } from "@/admin/session";
import { useAdmin } from "@/admin/store";
import { appStatusLabels, appStatusOrder, openStatuses } from "@/admin/types";
import { daysSince, fmtDate, fullName, timeAgo } from "@/admin/format";
import { AppStatusPill, Loading, PageHeader, Panel, StatCard } from "@/admin/components/kit";
import { courses as catalogue } from "@/lib/courses";

export const Route = createFileRoute("/admin/")({ component: Overview });

const WEEK = 7 * 86_400_000;

function Overview() {
  const { user } = useSession(); const data = useAdmin();
  if (!data || !user) return <Loading />;
  const now = Date.now(); const apps = data.applications;
  const count = (s: string) => apps.filter((a) => a.status === s).length;
  const mine = apps.filter((a) => a.assignedTo === user.id && openStatuses.includes(a.status)).length;
  const decided30 = apps.filter((a) => (a.status === "eligible" || a.status === "not_eligible") && now - new Date(a.history[a.history.length - 1]?.at ?? a.submittedAt).getTime() < 30 * 86_400_000).length;
  const weeks = Array.from({ length: 8 }, (_, i) => { const start = now - (7 - i) * WEEK; const n = apps.filter((a) => { const t = new Date(a.submittedAt).getTime(); return t > start - WEEK && t <= start; }).length; return { label: new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), applications: n }; });
  const waiting = apps.filter((a) => openStatuses.includes(a.status)).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)).slice(0, 5);
  const title = (slug: string) => catalogue.find((c) => c.slug === slug)?.title ?? slug;
  const hour = new Date().getHours(); const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return <>
    <PageHeader title={`${hello}, ${user.name.split(" ").slice(-1)[0] ?? user.name}`} description="Here is where applications stand today." actions={<Link to="/admin/applications" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-strong">Review applications <ArrowRight size={16} aria-hidden="true" /></Link>} />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="New applications" value={count("submitted")} hint="Not yet picked up" icon={Inbox} tone="blue" />
      <StatCard label="In review" value={count("in_review")} hint="Being checked by a reviewer" icon={Clock3} tone="orange" />
      <StatCard label="Waiting on applicant" value={count("info_requested")} hint="More information requested" icon={FileQuestion} tone="orange" />
      <StatCard label="Decided in 30 days" value={decided30} hint="Eligible or not eligible" icon={UserCheck} tone="green" />
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <Panel title="Applications per week" description="Last 8 weeks" className="xl:col-span-2">
        <figure aria-label="Bar chart of applications received per week over the last 8 weeks"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeks} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} /><Tooltip cursor={{ fill: "var(--color-brand-soft)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} /><Bar dataKey="applications" name="Applications" fill="var(--color-primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          <figcaption className="sr-only">{weeks.map((w) => `${w.label}: ${w.applications}`).join(". ")}</figcaption></figure>
      </Panel>

      <Panel title="By status" description={`${apps.length} applications in total`}>
        <ul className="space-y-4">{appStatusOrder.map((s) => { const n = count(s); const pct = apps.length ? Math.round((n / apps.length) * 100) : 0; return <li key={s}><div className="mb-1.5 flex items-center justify-between gap-3"><AppStatusPill status={s} /><span className="text-sm font-bold tabular-nums">{n} <span className="font-medium text-muted-foreground">({pct}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-muted" role="presentation"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div></li>; })}</ul>
      </Panel>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <Panel title="Waiting the longest" description="Oldest applications still open" className="xl:col-span-2" pad={false}>
        {waiting.length ? <ul className="divide-y divide-border">{waiting.map((a) => <li key={a.id}><Link to="/admin/applications/$id" params={{ id: a.id }} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
          <div className="min-w-0"><p className="font-bold">{fullName(a.applicant)}</p><p className="truncate text-sm text-muted-foreground">{title(a.courseSlug)}</p></div>
          <div className="flex items-center gap-4"><span className="text-sm tabular-nums text-muted-foreground">{daysSince(a.submittedAt, now)} days · {fmtDate(a.submittedAt)}</span><AppStatusPill status={a.status} /></div></Link></li>)}</ul>
          : <p className="p-5 text-base text-muted-foreground">Nothing is waiting. Every application has a decision.</p>}
      </Panel>

      <div className="space-y-6">
        <Panel title="For you"><ul className="space-y-3">
          <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2.5 text-base"><ClipboardCheck size={18} className="text-primary" aria-hidden="true" />Assigned to you</span><strong className="tabular-nums">{mine}</strong></li>
          {user.role === "admin" && <><li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2.5 text-base"><MessageSquare size={18} className="text-primary" aria-hidden="true" />New enquiries</span><Link to="/admin/enquiries" className="font-bold text-primary-strong hover:underline tabular-nums">{data.enquiries.filter((e) => e.status === "new").length}</Link></li>
          <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2.5 text-base"><BookOpen size={18} className="text-primary" aria-hidden="true" />Draft courses</span><Link to="/admin/courses" className="font-bold text-primary-strong hover:underline tabular-nums">{data.courses.filter((c) => c.visibility === "draft").length}</Link></li></>}
        </ul></Panel>
        <Panel title="Recent activity" pad={false}><ul className="divide-y divide-border">{data.activity.slice(0, 5).map((a) => <li key={a.id} className="px-5 py-3.5"><p className="text-sm leading-6"><strong>{a.actor}</strong> · {a.action}</p><p className="text-xs text-muted-foreground">{a.target} · {timeAgo(a.at, now)}</p></li>)}{!data.activity.length && <li className="px-5 py-4 text-sm text-muted-foreground">No activity yet.</li>}</ul></Panel>
      </div>
    </div>
    <p className="sr-only">{appStatusOrder.map((s) => `${appStatusLabels[s]}: ${count(s)}`).join(". ")}</p>
  </>;
}
