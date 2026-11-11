import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Copy, ImageOff, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCourse, saveCourse, useAdmin } from "@/admin/store";
import type { AdminCourse, CourseSeo, SaleChannel, StaffUser, WelcomeEmail } from "@/admin/types";
import { fmtDate } from "@/admin/format";
import { Panel, PageHeader, Pill } from "@/admin/components/kit";
import { AreaField, CheckField, F, ImageField, TextField, answerToText, textToAnswer, textInput } from "@/admin/components/formkit";
import { btnPrimary, btnSecondary, ConfirmDialog } from "@/admin/components/dialogs";
import { priceSummary, type CourseStatus, type Faq, type Module, type PricingTier } from "@/lib/courses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const STATUS_OVERRIDES: (CourseStatus | "")[] = ["", "Ongoing", "Coming Soon", "Upcoming", "Featured", "Popular", "New"];
const GST = [{ v: "+ 18% GST", l: "+ 18% GST (added on top)" }, { v: "incl. 18% GST", l: "incl. 18% GST" }, { v: "", l: "No tax note" }];

export function blankCourse(): AdminCourse {
  return { id: "", slug: "", title: "", category: "", specialty: "", image: "", imageAlt: "", instructors: "MedTrain faculty", featured: false, internationalOnly: false, appOnly: false, facts: [], pricing: [], overview: [], whyChoose: [], outline: [], curriculum: [], eligibility: [], completion: [], faqs: [], partners: [], facultyGroups: [], certification: {}, visibility: "draft" };
}
const slugify = (t: string) => t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const MAIL_VARS = ["site-url", "site-name", "site-android-app-url", "site-ios-app-url", "site-support-email", "course-name", "course-link", "learner-name"];
const DEFAULT_MAIL: WelcomeEmail = { enabled: true, subject: "You are now enrolled in {{course-name}}", body: "Hi {{learner-name}},\n\nYou are now enrolled in {{course-name}}.\n\nIf you have any questions, write to us at {{site-support-email}}." };
const NAV: [string, string][] = [["basics", "Details"], ["schedule", "Schedule & status"], ["pricing", "Pricing"], ["curriculum", "Curriculum"], ["faqs", "FAQs"], ["seo", "Page & SEO"], ["advanced", "Advanced"]];
const CHANNELS: [SaleChannel, string][] = [["website", "Website"], ["android", "Android"], ["ios", "iOS"], ["private", "Private"], ["none", "None"]];
const DATE_OK = /^\d{4}-\d{2}(-\d{2})?$/;

type Errors = Partial<Record<"title" | "slug" | "category" | "startsOn", string>>;

export function CourseEditor({ initial, isNew, user }: { initial: AdminCourse; isNew: boolean; user: StaffUser }) {
  const navigate = useNavigate(); const data = useAdmin();
  const [c, setC] = useState<AdminCourse>(initial); const [errors, setErrors] = useState<Errors>({}); const [slugTouched, setSlugTouched] = useState(!isNew); const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = useMemo(() => JSON.stringify(c) !== JSON.stringify(initial), [c, initial]);
  const patch = (p: Partial<AdminCourse>) => setC((x) => ({ ...x, ...p }));
  const seo: CourseSeo = c.seo ?? {}; const mail: WelcomeEmail = c.welcomeEmail ?? DEFAULT_MAIL;
  const setSeo = (k: keyof CourseSeo, v: string) => setC((x) => { const cur = { ...(x.seo ?? {}) }; if (v) cur[k] = v; else delete cur[k]; return { ...x, seo: cur }; });
  const setMail = (p: Partial<WelcomeEmail>) => setC((x) => ({ ...x, welcomeEmail: { ...(x.welcomeEmail ?? DEFAULT_MAIL), ...p } }));
  const duplicate = () => {
    const taken = new Set((data?.courses ?? []).map((x) => x.slug)); let slug = `${c.slug}-copy`; for (let i = 2; taken.has(slug); i++) slug = `${c.slug}-copy-${i}`;
    saveCourse({ ...c, id: slug, slug, title: `${c.title} (copy)`, visibility: "draft" }, user, true); toast.success("Copy created as a draft."); void navigate({ to: "/admin/courses/$slug", params: { slug } });
  };
  const channels: SaleChannel[] = c.saleChannels ?? ["none"];
  const toggleChannel = (v: SaleChannel) => setC((x) => { const cur = x.saleChannels ?? ["none"]; let next: SaleChannel[] = v === "none" ? ["none"] : cur.includes(v) ? cur.filter((y) => y !== v) : [...cur.filter((y) => y !== "none"), v]; if (!next.length) next = ["none"]; return { ...x, saleChannels: next }; });
  const setTax = (p: Partial<NonNullable<AdminCourse["tax"]>>) => setC((x) => { const t = { rate: "", inclusive: true, ...(x.tax ?? {}), ...p }; if (!t.invoiceNote) delete t.invoiceNote; return { ...x, tax: t }; });
  const categories = Array.from(new Set((data?.courses ?? []).map((x) => x.category)));
  const formats = Array.from(new Set((data?.courses ?? []).map((x) => x.format).filter((f): f is string => !!f)));

  const save = (publish?: boolean) => {
    const e: Errors = {};
    if (!c.title.trim()) e.title = "Enter the course title.";
    if (!c.slug.trim()) e.slug = "Enter a web address for the course."; else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug)) e.slug = "Use lowercase letters, numbers and hyphens only.";
    else if (isNew && data?.courses.some((x) => x.slug === c.slug)) e.slug = "Another course already uses this address.";
    if (!c.category.trim()) e.category = "Choose or enter a category.";
    if (c.startsOn && !DATE_OK.test(c.startsOn)) e.startsOn = "Use YYYY-MM-DD, or YYYY-MM if only the month is known.";
    setErrors(e);
    if (Object.keys(e).length) { toast.error("Some details need attention."); return; }
    const next: AdminCourse = { ...c, updatedAt: new Date().toISOString(), id: c.slug, title: c.title.trim(), imageAlt: c.imageAlt || `${c.title.trim()} — course artwork`, ...(publish !== undefined ? { visibility: publish ? "published" : "draft" } : {}) };
    saveCourse(next, user, isNew); toast.success(isNew ? "Course created." : "Changes saved."); void navigate({ to: "/admin/courses" });
  };

  return <>
    <PageHeader back={{ to: "/admin/courses", label: "All courses" }} title={isNew ? "Add course" : c.title || "Edit course"} description={isNew ? "Start as a draft; publish when it is ready." : `/${c.slug}`}
      actions={<><Pill tone={c.visibility === "published" ? "green" : "orange"}>{c.visibility === "published" ? "Published" : "Draft"}</Pill></>} />
    <p className="mb-6 rounded-md border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">In demo mode, changes are saved in this browser only and do not change the public website.</p>

    <Tabs defaultValue="basics" orientation="vertical" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4 lg:sticky lg:top-4">
        <div className="hidden overflow-hidden rounded-card border border-border bg-background shadow-card lg:block">
          <div className="aspect-[16/10] bg-muted">{c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><ImageOff size={28} aria-hidden="true" /></div>}</div>
          <div className="space-y-1.5 p-4"><p className="line-clamp-3 text-sm font-bold leading-snug">{c.title || "Untitled course"}</p><p className="text-xs text-muted-foreground">{c.updatedAt ? `Last saved ${fmtDate(c.updatedAt)}` : isNew ? "Not saved yet" : "No edits yet"}</p></div>
        </div>
        <TabsList aria-label="Course sections" className="h-auto w-full max-w-full justify-start gap-1 overflow-x-auto rounded-card bg-background p-1.5 shadow-card lg:flex-col lg:items-stretch lg:overflow-visible">{NAV.map(([v, l]) => <TabsTrigger key={v} value={v} className="min-h-11 shrink-0 justify-start px-4 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{l}</TabsTrigger>)}</TabsList>
      </div>
      <div className="min-w-0">
      <TabsContent value="basics" className="mt-0"><div className="grid gap-6 2xl:grid-cols-[1fr_22rem]">
        <Panel title="Course details"><div className="grid gap-5 sm:grid-cols-2">
          <TextField className="sm:col-span-2" label="Title" required value={c.title} error={errors.title} onChange={(v) => patch({ title: v, ...(slugTouched ? {} : { slug: slugify(v) }) })} />
          <TextField label="Web address" required value={c.slug} error={errors.slug} hint={isNew ? "Appears in the page address: /courses/…" : "Fixed once a course exists."} onChange={(v) => { setSlugTouched(true); patch({ slug: v }); }} {...(!isNew ? {} : {})} />
          <TextField label="Category" required value={c.category} error={errors.category} list="categories" onChange={(v) => patch({ category: v })} />
          <datalist id="categories">{categories.map((x) => <option key={x} value={x} />)}</datalist>
          <TextField label="Specialty" value={c.specialty} onChange={(v) => patch({ specialty: v })} />
          <TextField label="Instructor display name" value={c.instructors} hint="Shown on course cards and the course page." onChange={(v) => patch({ instructors: v })} />
          <TextField className="sm:col-span-2" label="Tags" value={(c.tags ?? []).join(", ")} hint="Comma separated. Helps you find and group courses." onChange={(v) => setC((x) => { const t = v.split(",").map((y) => y.trim()).filter(Boolean); const { tags: _t, ...rest } = x; void _t; return t.length ? { ...rest, tags: t } : rest; })} />
          <AreaField className="sm:col-span-2" label="Short description" rows={3} value={c.tagline ?? ""} hint="One or two sentences. Appears under the title and in search results." onChange={(v) => patch({ tagline: v })} />
        </div></Panel>
        <div className="space-y-6">
          <Panel title="Course image"><ImageField label="Artwork" value={c.image || undefined} alt={c.imageAlt || c.title} onChange={(v) => patch({ image: v ?? "" })} hint="16:10 works best. Large images are resized for you." /></Panel>
          <Panel title="Visibility"><div className="space-y-4">
            <fieldset><legend className="mb-2 text-sm font-semibold">Status on the site</legend>{(["published", "draft"] as const).map((v) => <label key={v} className="flex min-h-11 cursor-pointer items-center gap-3"><input type="radio" name="vis" checked={c.visibility === v} onChange={() => patch({ visibility: v })} className="size-5 accent-[var(--color-primary)]" /><span className="text-base font-semibold">{v === "published" ? "Published" : "Draft"}</span><span className="text-sm text-muted-foreground">{v === "published" ? "Visible to everyone" : "Hidden from visitors"}</span></label>)}</fieldset>
            <CheckField label="Featured on the home page" checked={c.featured} onChange={(v) => patch({ featured: v })} />
          </div></Panel>
        </div></div></TabsContent>

      <TabsContent value="schedule" className="mt-0"><Panel title="Schedule and status"><div className="grid max-w-3xl gap-5 sm:grid-cols-2">
        <TextField label="Duration" value={c.duration ?? ""} placeholder="e.g. 12 months" onChange={(v) => patch({ duration: v })} />
        <TextField label="Learning format" value={c.format ?? ""} list="formats" placeholder="e.g. Online (recorded + live sessions)" onChange={(v) => patch({ format: v })} />
        <datalist id="formats">{formats.map((x) => <option key={x} value={x} />)}</datalist>
        <TextField label="Start date" value={c.startsOn ?? ""} error={errors.startsOn} placeholder="YYYY-MM-DD" hint="Courses with a future date show as Upcoming automatically." onChange={(v) => patch({ startsOn: v })} />
        <F label="Status label" hint="Leave on Automatic unless you need to force a label.">{(p) => <select {...p} value={c.status ?? ""} onChange={(e) => setC((x) => { const { status: _s, ...rest } = x; void _s; return e.target.value ? { ...rest, status: e.target.value as CourseStatus } : rest; })} className={textInput()}>{STATUS_OVERRIDES.map((s) => <option key={s} value={s}>{s || "Automatic"}</option>)}</select>}</F>
        <div className="space-y-4 sm:col-span-2"><CheckField label="Exclusively for international students" checked={c.internationalOnly} onChange={(v) => patch({ internationalOnly: v })} /><CheckField label="Free course delivered on the MedTrain app" hint="Shows “Get the MedTrain app” instead of the eligibility application." checked={c.appOnly} onChange={(v) => patch({ appOnly: v })} /></div>
      </div></Panel></TabsContent>

      <TabsContent value="pricing" className="mt-0"><div className="space-y-6">
        <Panel title="List course for sale" description="Where this course is offered. Nothing is charged or listed in demo mode."><fieldset><legend className="sr-only">Sales channels</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-1">{CHANNELS.map(([v, l]) => <label key={v} className="flex min-h-11 cursor-pointer items-center gap-2.5"><input type="checkbox" checked={channels.includes(v)} onChange={() => toggleChannel(v)} className="size-5 accent-[var(--color-primary)]" /><span className="text-base font-semibold">{l}</span></label>)}</div>
          <p className="mt-2 text-sm text-muted-foreground">Choose None to keep the course out of every store. Private courses are shared only with a direct link. Publishing is set under Details.</p></fieldset></Panel>
        <p className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">Course cards will show: <strong className="text-foreground">{priceSummary(c as never)?.text ?? "To be announced"}</strong>. This is the first fee option below.</p>
        <ListEditor<PricingTier> title="Fees" addLabel="Add fee option" empty="No fees yet. Add one, or leave empty to show “To be announced”." items={c.pricing} onChange={(pricing) => patch({ pricing })} make={() => ({ inr: { amount: "", note: "+ 18% GST" } })}
        render={(t, set) => <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Option name" value={t.label ?? ""} placeholder="e.g. Essential · 12 weeks (optional)" onChange={(v) => set({ ...t, label: v })} />
          <div className="flex items-end pb-2"><CheckField label="Free" checked={!!t.free} onChange={(v) => set({ ...t, free: v })} /></div>
          {!t.free && <>
            <TextField label="Fee in ₹" value={t.inr?.amount ?? ""} placeholder="₹25,000" onChange={(v) => set({ ...t, inr: { amount: v, ...(t.inr?.note ? { note: t.inr.note } : {}) } })} />
            <F label="Tax note">{(p) => <select {...p} value={t.inr?.note ?? ""} onChange={(e) => set({ ...t, inr: { amount: t.inr?.amount ?? "", ...(e.target.value ? { note: e.target.value } : {}) } })} className={textInput()}>{GST.map((g) => <option key={g.l} value={g.v}>{g.l}</option>)}</select>}</F>
            <TextField label="Instalments (₹, comma separated)" value={(t.installments ?? []).join(", ")} placeholder="₹96,571, ₹64,381" hint="Amounts include GST. Leave empty for single payment." onChange={(v) => { const list = v.split(",").map((x) => x.trim()).filter(Boolean); const { installments: _i, ...rest } = t; void _i; set(list.length ? { ...rest, installments: list } : rest); }} />
            <TextField label="International fee" value={t.usd ?? ""} placeholder="2,400 USD" onChange={(v) => { const { usd: _u, ...rest } = t; void _u; set(v ? { ...rest, usd: v } : rest); }} />
          </>}
          {t.free && <TextField label="Original fee (struck through)" value={t.struck ?? ""} placeholder="₹10,000" onChange={(v) => { const { struck: _s, ...rest } = t; void _s; set(v ? { ...rest, struck: v } : rest); }} />}
          <TextField className="sm:col-span-2" label="Payment note" value={t.payment ?? ""} placeholder="e.g. Single payment only" onChange={(v) => { const { payment: _p, ...rest } = t; void _p; set(v ? { ...rest, payment: v } : rest); }} />
        </div>} />
        <Panel title="Tax settings"><div className="grid max-w-3xl gap-5 sm:grid-cols-2">
          <TextField label="Tax rate (%)" value={c.tax?.rate ?? ""} placeholder="18" hint="Used when a fee has no tax note of its own." onChange={(v) => setTax({ rate: v.replace(/[^0-9.]/g, "") })} />
          <fieldset><legend className="mb-1 text-sm font-semibold">Show prices including tax</legend><div className="flex gap-6">{([true, false] as const).map((v) => <label key={String(v)} className="flex min-h-11 cursor-pointer items-center gap-2"><input type="radio" name="inclusive" checked={(c.tax?.inclusive ?? true) === v} onChange={() => setTax({ inclusive: v })} className="size-5 accent-[var(--color-primary)]" /><span className="text-base">{v ? "Yes" : "No"}</span></label>)}</div></fieldset>
          <TextField className="sm:col-span-2" label="Invoice description (optional)" value={c.tax?.invoiceNote ?? ""} hint="A line printed on invoices for this course." onChange={(v) => setTax({ invoiceNote: v })} />
        </div></Panel>
        <Panel title="Purchase and listing options"><div className="grid max-w-3xl gap-5">
          <fieldset><legend className="mb-1 text-sm font-semibold">Course purchase options</legend>
            {([["single", "Single course checkout", "One-click checkout without a cart. Learner details are taken after purchase. Best for landing pages."], ["cart", "Purchase with cart", "Learners can add this course to a cart with other courses. Details are taken before purchase."]] as const).map(([v, l, d]) => <label key={v} className="flex cursor-pointer items-start gap-3 py-2"><input type="radio" name="purchase" checked={(c.purchaseMode ?? "cart") === v} onChange={() => patch({ purchaseMode: v })} className="mt-1 size-5 accent-[var(--color-primary)]" /><span><span className="block text-base font-semibold">{l}</span><span className="block text-sm text-muted-foreground">{d}</span></span></label>)}</fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Sub categories" value={c.subCategories ?? ""} hint="Comma separated. Letters, numbers, spaces and hyphens." onChange={(v) => setC((x) => { const { subCategories: _s, ...rest } = x; void _s; return v ? { ...rest, subCategories: v } : rest; })} />
            <F label="Featured course priority" hint="0 to 10. Higher shows earlier on the home page.">{(p) => <input {...p} type="number" min={0} max={10} step={1} value={c.featuredPriority ?? 0} onChange={(e) => patch({ featuredPriority: Math.min(10, Math.max(0, Math.round(Number(e.target.value) || 0))) })} className={textInput()} />}</F>
          </div>
        </div></Panel>
      </div></TabsContent>

      <TabsContent value="curriculum" className="mt-0"><ListEditor<Module> title="Modules" addLabel="Add module" empty="No modules yet." items={c.curriculum} onChange={(curriculum) => patch({ curriculum })} make={() => ({ label: `Module ${String(c.curriculum.length + 1).padStart(2, "0")}`, title: "", lessons: [] })}
        render={(m, set) => <div className="grid gap-4"><div className="grid gap-4 sm:grid-cols-[10rem_1fr]"><TextField label="Label" value={m.label ?? ""} onChange={(v) => { const { label: _l, ...rest } = m; void _l; set(v ? { ...rest, label: v } : rest); }} /><TextField label="Title" value={m.title} onChange={(v) => set({ ...m, title: v })} /></div>
          <AreaField label="Lessons" rows={4} value={m.lessons.join("\n")} hint="One lesson per line." onChange={(v) => set({ ...m, lessons: v.split("\n").map((x) => x.trim()).filter(Boolean) })} /></div>} /></TabsContent>

      <TabsContent value="faqs" className="mt-0"><ListEditor<Faq> title="Questions" addLabel="Add question" empty="No questions yet. Default questions about applying are shown on the site when this is empty." items={c.faqs} onChange={(faqs) => patch({ faqs })} make={() => ({ question: "", paragraphs: [""] })}
        render={(f, set) => <div className="grid gap-4"><TextField label="Question" value={f.question} onChange={(v) => set({ ...f, question: v })} /><AreaField label="Answer" rows={5} value={answerToText(f)} hint="Separate paragraphs with a blank line. Start a line with “- ” for a bullet." onChange={(v) => set({ question: f.question, ...textToAnswer(v) })} /></div>} /></TabsContent>
      <TabsContent value="seo" className="mt-0"><div className="grid gap-6 2xl:grid-cols-[1fr_20rem]">
        <Panel title="Page address and search listing"><div className="grid gap-5">
          <TextField label="Page address" value={c.slug} disabled={!isNew} hint={isNew ? "Lowercase letters, numbers and hyphens. Include the course name." : "Fixed once the course exists, so links keep working."} onChange={(v) => { setSlugTouched(true); patch({ slug: v }); }} error={errors.slug} />
          <TextField label="Search title" value={seo.title ?? ""} placeholder={c.title} hint={`${(seo.title ?? c.title).length} characters. About 60 or fewer shows in full on Google.`} onChange={(v) => setSeo("title", v)} />
          <AreaField label="Search description" rows={3} value={seo.description ?? ""} placeholder={c.tagline ?? ""} hint={`${(seo.description ?? "").length} characters. About 160 or fewer shows in full. Left empty, the short description is used.`} onChange={(v) => setSeo("description", v)} />
          <TextField label="Keywords" value={seo.keywords ?? ""} hint="Comma separated. Optional." onChange={(v) => setSeo("keywords", v)} />
          <TextField label="Canonical URL" value={seo.canonicalUrl ?? ""} placeholder="https://…" hint="Only if this course page is also published somewhere else." onChange={(v) => setSeo("canonicalUrl", v)} />
        </div></Panel>
        <Panel title="Search preview" description="Roughly how this page can appear in search."><div className="rounded-md border border-border bg-muted/30 p-4">
          <p className="truncate text-xs text-muted-foreground">med-train.com › courses › {c.slug || "…"}</p>
          <p className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-primary-strong">{seo.title || c.title || "Course title"}</p>
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">{seo.description || c.tagline || "Add a short description so search engines have something to show."}</p>
        </div></Panel>
      </div></TabsContent>

      <TabsContent value="advanced" className="mt-0"><div className="space-y-6">
        <Panel title="Welcome email" description="Sent to a learner once they are enrolled. Demo mode does not send email.">
          <div className="grid max-w-3xl gap-5">
            <CheckField label="Send this email when a learner is enrolled" checked={mail.enabled} onChange={(v) => setMail({ enabled: v })} />
            <TextField label="Subject" value={mail.subject} disabled={!mail.enabled} onChange={(v) => setMail({ subject: v })} />
            <TextField label="Copy to (optional)" value={mail.cc ?? ""} disabled={!mail.enabled} placeholder="name@example.com" hint="Separate several addresses with commas." onChange={(v) => setMail({ cc: v })} />
            <AreaField label="Message" rows={8} value={mail.body} disabled={!mail.enabled} onChange={(v) => setMail({ body: v })} />
            <div><p className="mb-2 text-sm font-semibold">Insert a detail</p><div className="flex flex-wrap gap-2">{MAIL_VARS.map((v) => <button key={v} type="button" disabled={!mail.enabled} onClick={() => setMail({ body: `${mail.body}{{${v}}}` })} className="min-h-9 rounded-md border border-border bg-muted px-2.5 font-mono text-xs hover:bg-brand-soft disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{v}</button>)}</div><p className="mt-2 text-sm text-muted-foreground">Adds the detail at the end of the message. Each one is replaced with the real value when the email is sent.</p></div>
          </div>
        </Panel>
        {!isNew && <Panel title="Copy this course" description="Makes a draft with the same content and a new address. You can then edit it."><button type="button" onClick={duplicate} className={btnSecondary}><Copy size={16} aria-hidden="true" />Make a copy</button></Panel>}
        {!isNew && <section className="rounded-card border border-destructive/40 bg-background p-5 shadow-card"><h2 className="text-base font-bold text-destructive">Delete this course</h2><p className="mt-1 text-base text-muted-foreground">Removes it from the course list. In demo mode, Reset sample data brings it back.</p><button type="button" onClick={() => setConfirmDelete(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border border-destructive/50 px-4 text-sm font-semibold text-destructive hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 size={16} aria-hidden="true" />Delete course</button></section>}
      </div></TabsContent>
      </div>
    </Tabs>

    <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-3">{!isNew && <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-destructive hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 size={16} aria-hidden="true" />Delete</button>}{dirty && <span className="text-sm font-semibold text-muted-foreground" role="status">Unsaved changes</span>}</div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => navigate({ to: "/admin/courses" })} className={btnSecondary}>{dirty ? "Discard" : "Close"}</button>
        {c.visibility === "draft" && <button type="button" onClick={() => save(true)} className={btnSecondary}>Save and publish</button>}
        <button type="button" onClick={() => save()} className={btnPrimary}><Save size={17} aria-hidden="true" />{isNew ? "Create course" : "Save changes"}</button></div>
    </div>
    <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} danger title="Delete this course?" description={<>“{c.title}” will be removed from the course list. In demo mode you can bring it back with <strong>Reset sample data</strong>.</>} confirmLabel="Delete course" onConfirm={() => { deleteCourse(c.id, c.title, user); toast.success("Course deleted."); void navigate({ to: "/admin/courses" }); }} />
  </>;
}

/** Ordered list of editable items with add, remove and reorder. */
function ListEditor<T>({ title, items, onChange, make, render, addLabel, empty }: { title: string; items: T[]; onChange: (v: T[]) => void; make: () => T; render: (item: T, set: (v: T) => void) => React.ReactNode; addLabel: string; empty: string }) {
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j] as T, n[i] as T]; onChange(n); };
  return <Panel title={title} actions={<button type="button" onClick={() => onChange([...items, make()])} className={cn(btnSecondary, "!min-h-10")}><Plus size={16} aria-hidden="true" />{addLabel}</button>}>
    {items.length === 0 ? <p className="text-base text-muted-foreground">{empty}</p> : <ol className="space-y-4">{items.map((it, i) => <li key={i} className="rounded-md border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-2"><span className="text-sm font-bold text-muted-foreground">{title.replace(/s$/, "")} {i + 1}</span>
        <div className="flex gap-1"><button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move item ${i + 1} up`} className="grid size-9 place-items-center rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40"><ArrowUp size={15} /></button><button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move item ${i + 1} down`} className="grid size-9 place-items-center rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40"><ArrowDown size={15} /></button><button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label={`Remove item ${i + 1}`} className="grid size-9 place-items-center rounded-md border border-destructive/40 bg-background text-destructive hover:bg-destructive/5"><Trash2 size={15} /></button></div></div>
      {render(it, (v) => onChange(items.map((x, k) => (k === i ? v : x))))}</li>)}</ol>}
  </Panel>;
}
