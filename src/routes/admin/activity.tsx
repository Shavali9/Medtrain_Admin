import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { canAccess, useSession } from "@/admin/session";
import { useAdmin } from "@/admin/store";
import { fmtDateTime } from "@/admin/format";
import { EmptyState, Loading, NoAccess, PageHeader, Pager, Panel, Pill, SearchBox } from "@/admin/components/kit";

export const Route = createFileRoute("/admin/activity")({ component: Activity });
const PAGE = 20;

function Activity() {
  const { user } = useSession(); const data = useAdmin(); const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const rows = useMemo(() => (data?.activity ?? []).filter((a) => !q || [a.actor, a.action, a.target].join(" ").toLowerCase().includes(q.toLowerCase())), [data, q]);
  if (!data || !user) return <Loading />;
  if (!canAccess(user.role, "activity")) return <NoAccess what="The activity log" />;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)); const p = Math.min(page, pages); const slice = rows.slice((p - 1) * PAGE, p * PAGE);
  return <>
    <PageHeader title="Activity" description="A record of who changed what. The most recent 300 actions are kept." />
    <Panel pad={false}>
      <div className="border-b border-border p-4 md:max-w-md"><SearchBox id="act-search" value={q} onSearch={(v) => { setQ(v); setPage(1); }} placeholder="Search by person, action or item" /></div>
      {slice.length === 0 ? <div className="p-6"><EmptyState title="No activity found">Actions such as approving an application or editing a course are recorded here.</EmptyState></div> : <>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Activity log table"><table className="w-full min-w-[40rem] text-left text-sm"><caption className="sr-only">Activity log</caption><thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground"><tr><th scope="col" className="px-4 py-3">When</th><th scope="col" className="px-4 py-3">Who</th><th scope="col" className="px-4 py-3">Action</th><th scope="col" className="px-4 py-3">Item</th></tr></thead>
          <tbody className="divide-y divide-border">{slice.map((a) => <tr key={a.id}><td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDateTime(a.at)}</td><td className="whitespace-nowrap px-4 py-3 font-semibold">{a.actor} <Pill tone={a.role === "admin" ? "blue" : "neutral"}>{a.role}</Pill></td><td className="px-4 py-3">{a.action}</td><td className="px-4 py-3 text-muted-foreground">{a.target}</td></tr>)}</tbody></table></div>
        <Pager page={p} pages={pages} total={rows.length} from={(p - 1) * PAGE + 1} to={Math.min(p * PAGE, rows.length)} onPage={setPage} /></>}
    </Panel>
  </>;
}
