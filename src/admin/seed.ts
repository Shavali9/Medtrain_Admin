import { applicationDocuments, courses, courseStatus } from "@/lib/courses";
import { documentFields, indianStates } from "@/lib/application";
import type { ActivityEntry, AdminDoc, Application, AppStatus, DocStatus, Enquiry, HistoryEntry, StaffUser, Student } from "@/admin/types";

/** Everything below is fictional sample data for demo mode. Emails use example.com (reserved, never delivers). */
export const STAFF: StaffUser[] = [
  { id: "u-admin", name: "Demo Admin", email: "admin@example.com", role: "admin" },
  { id: "u-rev1", name: "Demo Reviewer A", email: "reviewer.a@example.com", role: "reviewer" },
  { id: "u-rev2", name: "Demo Reviewer B", email: "reviewer.b@example.com", role: "reviewer" },
];

const FIRST = ["Aarav", "Ananya", "Vikram", "Meera", "Rohan", "Priya", "Karthik", "Sneha", "Arjun", "Divya", "Nikhil", "Pooja", "Rahul", "Kavya", "Suresh", "Lakshmi", "Amit", "Neha", "Sanjay", "Deepa", "Manoj", "Rekha", "Harish", "Swati", "Varun", "Nisha", "Gopal", "Anjali", "Mohan", "Shruti"];
const LAST = ["Rao", "Iyer", "Nair", "Sharma", "Reddy", "Menon", "Kulkarni", "Patil", "Gowda", "Joshi", "Shetty", "Bhat", "Desai", "Kapoor", "Pillai", "Hegde"];
const QUALS = ["Diploma", "MD", "DNB", "MD", "DNB", "Other"];
const PROFS = ["Doctor", "Doctor", "Doctor", "Nurse"];
const REFERRALS = ["Colleague recommendation", "MedTrain website", "Social media", "Conference", "WhatsApp group", "Email newsletter"];
const EXPERIENCE = ["Consultant pediatrician in a private hospital, 8 years of practice.", "Allergy clinic physician, 5 years; completing PG thesis on asthma.", "Senior resident in respiratory medicine.", "Family physician in a nursing home, 12 years.", "ENT specialist with an interest in allergic rhinitis.", "Neonatal ICU registrar, 3 years."];

// Deterministic pseudo-random so the sample data is stable between resets.
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const day = 86_400_000;
const iso = (t: number) => new Date(t).toISOString();

export type Seed = { applications: Application[]; students: Student[]; enquiries: Enquiry[]; activity: ActivityEntry[] };

export function buildSeed(now = Date.now()): Seed {
  const r = rng(20261111);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)] as T;
  // Courses that realistically take applications (not app-only, not "Coming Soon").
  const applicable = courses.filter((c) => !c.appOnly && courseStatus(c, new Date(now)) !== "Coming Soon" && !c.slug.endsWith("-ongoing")).slice(0, 8);
  const weights = [4, 3, 3, 2, 2, 2, 1, 1];
  const weighted = applicable.flatMap((c, i) => Array<string>(weights[i] ?? 1).fill(c.slug));

  const applications: Application[] = []; const students: Student[] = [];
  const statusFor = (ageDays: number): AppStatus => { const x = r(); if (ageDays < 3) return x < 0.8 ? "submitted" : "in_review"; if (ageDays < 10) return x < 0.35 ? "submitted" : x < 0.7 ? "in_review" : x < 0.85 ? "info_requested" : "eligible"; return x < 0.1 ? "in_review" : x < 0.2 ? "info_requested" : x < 0.75 ? "eligible" : "not_eligible"; };

  for (let i = 0; i < 26; i++) {
    const fn = pick(FIRST), ln = pick(LAST); const ageDays = Math.floor(Math.pow(r(), 1.5) * 50); const submittedAt = now - ageDays * day - Math.floor(r() * 20) * 3_600_000;
    const status = statusFor(ageDays); const name = `${fn} ${ln}`;
    const home = `${Math.floor(r() * 400) + 1}, ${pick(["Lake View Road", "Temple Street", "Garden Layout", "Station Road", "Park Avenue"])}, ${pick(["Bengaluru", "Mysuru", "Hyderabad", "Chennai", "Pune", "Kochi"])}`;
    const id = `APP-${1042 + i}`; const rev = status === "submitted" ? null : pick(["u-rev1", "u-rev2", "u-admin"]);
    const docs: AdminDoc[] = documentFields.map((d, k) => {
      let st: DocStatus = "pending", note: string | undefined;
      if (status === "eligible") st = "verified";
      else if (status === "not_eligible") { st = k === 2 ? "rejected" : "verified"; if (k === 2) note = "PG certificate does not show a qualifying specialty."; }
      else if (status === "in_review") st = k < 3 ? "verified" : "pending";
      else if (status === "info_requested") { st = k === 4 ? "rejected" : k < 3 ? "verified" : "pending"; if (k === 4) note = "Photo is not clear. Please upload a recent passport-size photo."; }
      return { key: d.name, label: d.label, fileName: `${d.name.replace(/([A-Z])/g, "-$1").toLowerCase()}.${k === 4 ? "jpg" : "pdf"}`, sizeKB: 180 + Math.floor(r() * 1500), status: st, ...(note ? { note } : {}) };
    });
    const history: HistoryEntry[] = [{ id: `${id}-h0`, at: iso(submittedAt), actor: name, kind: "submitted", text: "Application submitted" }];
    let t = submittedAt;
    const step = (kind: HistoryEntry["kind"], text: string, actor: string) => { t += (3 + Math.floor(r() * 30)) * 3_600_000; if (t > now) t = now - 60_000; history.push({ id: `${id}-h${history.length}`, at: iso(t), actor, kind, text }); };
    if (status !== "submitted") step("assigned", `Assigned to ${STAFF.find((s) => s.id === rev)?.name ?? "reviewer"}`, "Demo Admin");
    if (status !== "submitted") step("status", "Status changed to In review", STAFF.find((s) => s.id === rev)?.name ?? "Reviewer");
    if (status === "info_requested") step("status", "More information requested: photo is not clear", STAFF.find((s) => s.id === rev)?.name ?? "Reviewer");
    if (status === "eligible") step("status", "Eligibility confirmed. All documents verified.", STAFF.find((s) => s.id === rev)?.name ?? "Reviewer");
    if (status === "not_eligible") step("status", "Marked not eligible: PG certificate does not show a qualifying specialty.", STAFF.find((s) => s.id === rev)?.name ?? "Reviewer");

    applications.push({
      id, submittedAt: iso(submittedAt), courseSlug: pick(weighted), status, assignedTo: rev, history,
      ...(status === "not_eligible" ? { decisionReason: "PG certificate does not show a qualifying specialty." } : {}), docs,
      applicant: { prefix: r() < 0.8 ? "Dr." : "Ms.", firstName: fn, lastName: ln, age: 28 + Math.floor(r() * 30), gender: pick(["Female", "Male"]), phone: `+91 9${Math.floor(100000000 + r() * 899999999)}`, nationality: "Indian", state: pick(indianStates.slice(0, 20)), profession: pick(PROFS), registrationNumber: `DEMO-${String(1000 + i).padStart(4, "0")}`, qualification: pick(QUALS), mbbsYear: 1996 + Math.floor(r() * 20), experience: pick(EXPERIENCE), referral: pick(REFERRALS), permanentAddress: home, shippingAddress: home },
    });
    students.push({ id: `STU-${200 + i}`, name: `${fn} ${ln}`, email: `${fn}.${ln}${i}@example.com`.toLowerCase(), phone: `+91 9${Math.floor(100000000 + r() * 899999999)}`, registeredAt: iso(submittedAt - Math.floor(r() * 12) * day), status: "active" });
  }
  for (let i = 0; i < 8; i++) { const fn = pick(FIRST), ln = pick(LAST); students.push({ id: `STU-${300 + i}`, name: `${fn} ${ln}`, email: `${fn}.${ln}${40 + i}@example.com`.toLowerCase(), phone: `+91 9${Math.floor(100000000 + r() * 899999999)}`, registeredAt: iso(now - Math.floor(r() * 60) * day), status: "active" }); }
  students[3] = { ...(students[3] as Student), status: "suspended" };

  const MSGS = ["Could you share the exact start date for the next batch?", "Is the course open to nurses with a postgraduate qualification?", "Can I attend the personal contact session on a different date?", "Do you offer an instalment option for the full fee?", "I have an MBBS and 3 years of clinical practice. Am I eligible?", "Where is the personal contact session held?", "Please confirm if a certificate is issued on completion.", "I could not upload my photo on the application form."];
  const enquiries: Enquiry[] = MSGS.map((message, i) => { const fn = pick(FIRST), ln = pick(LAST); const c = applicable[i % applicable.length]; const status = i < 4 ? "new" : i < 6 ? "replied" : "closed"; return { id: `ENQ-${500 + i}`, name: `${fn} ${ln}`, email: `${fn}.${ln}${70 + i}@example.com`.toLowerCase(), ...(i % 2 ? { phone: `+91 9${Math.floor(100000000 + r() * 899999999)}` } : {}), ...(c ? { courseSlug: c.slug } : {}), message, createdAt: iso(now - (i * 1.4 + 0.2) * day), status, assignedTo: status === "new" ? null : "u-admin", ...(status !== "new" ? { reply: "Thanks for reaching out. We have emailed you the details." } : {}) }; });

  const activity: ActivityEntry[] = applications.filter((a) => a.status !== "submitted").slice(0, 8).map((a, i) => ({ id: `ACT-${i}`, at: a.history[a.history.length - 1]?.at ?? iso(now), actor: STAFF.find((s) => s.id === a.assignedTo)?.name ?? "Demo Admin", role: (STAFF.find((s) => s.id === a.assignedTo)?.role ?? "admin"), action: (a.history[a.history.length - 1]?.text ?? "Updated application"), target: a.id })).sort((x, y) => y.at.localeCompare(x.at));
  return { applications: applications.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), students, enquiries, activity };
}

export { applicationDocuments };
