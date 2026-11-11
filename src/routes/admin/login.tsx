import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, ShieldCheck } from "lucide-react";
import logoUrl from "@/assets/medtrain-logo.svg";
import { signIn, STAFF } from "@/admin/session";
import { Notice } from "@/components/form";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

const roleCopy = { admin: { icon: ShieldCheck, title: "Admin", text: "Everything: applications, courses, faculty, gallery, students, enquiries and the activity log." }, reviewer: { icon: ClipboardCheck, title: "Reviewer", text: "Overview and applications only: review documents and decide eligibility." } } as const;

function AdminLogin() {
  const picks = [STAFF.find((s) => s.role === "admin"), STAFF.find((s) => s.id === "u-rev1")].filter((s): s is NonNullable<typeof s> => !!s);
  return <main id="main" className="grid min-h-dvh place-items-center bg-brand-soft px-4 py-10"><div className="w-full max-w-xl">
    <div className="flex justify-center"><img src={logoUrl} alt="MedTrain" width={160} height={50} className="h-12 w-auto" /></div>
    <div className="mt-6 rounded-card border border-border bg-background p-6 shadow-card-hover sm:p-8">
      <h1 className="text-2xl font-extrabold">Admin sign-in</h1>
      <p className="mt-2 text-base leading-7 text-muted-foreground">Choose a role to explore the dashboard.</p>
      <div className="mt-5"><Notice tone="warn" title="Demo mode">There are no accounts or passwords yet. The dashboard uses sample data stored in this browser, and roles only change what is shown. Connect a login service and backend before using it with real applicants.</Notice></div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">{picks.map((u) => { const c = roleCopy[u.role]; return <li key={u.id}><button type="button" onClick={() => signIn(u.id)} className="flex h-full w-full flex-col items-start rounded-card border border-border bg-background p-5 text-left transition hover:border-primary hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-primary" aria-hidden="true"><c.icon size={22} /></span>
        <span className="mt-4 text-lg font-bold">Continue as {c.title}</span><span className="mt-1.5 text-sm leading-6 text-muted-foreground">{c.text}</span><span className="mt-3 text-xs font-semibold text-muted-foreground">{u.name}</span>
      </button></li>; })}</ul>
    </div>
  </div></main>;
}
