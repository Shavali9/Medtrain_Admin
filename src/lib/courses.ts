import raw from "@/data/courses.json";
import { faculty, type Faculty } from "@/lib/faculty";
import { APP_LINKS } from "@/lib/site";

export const courseStatuses = ["Featured", "Popular", "New", "Upcoming", "Ongoing", "Coming Soon"] as const;
export type CourseStatus = (typeof courseStatuses)[number];

/** A run of content: optional heading, paragraphs, and/or a bullet list. Mirrors how med-train.com structures its tabs. */
export type Block = { heading?: string; paragraphs?: string[]; items?: string[] };
export type Fact = { label: string; values: string[] };
export type Faq = { question: string; paragraphs?: string[]; items?: string[] };
export type Money = { amount: string; note?: string };
export type PricingTier = { label?: string; inr?: Money; installments?: string[]; usd?: string; payment?: string; free?: boolean; struck?: string };
export type Partner = { group: string; name: string; image: string };
export type Module = { label?: string; title: string; lessons: string[] };

export type Course = {
  slug: string;
  title: string;
  tagline?: string;
  category: string;
  specialty: string;
  image: string;
  imageAlt: string;
  instructors: string;
  featured: boolean;
  /** Set explicitly for Ongoing / Coming Soon; otherwise derived from startsOn. */
  status?: CourseStatus;
  /** ISO date (or YYYY-MM) when a fixed start date is published. */
  startsOn?: string;
  duration?: string;
  format?: string;
  internationalOnly: boolean;
  /** Free, delivered on the MedTrain app (no eligibility application). */
  appOnly: boolean;
  facts: Fact[];
  pricing: PricingTier[];
  overview: Block[];
  whyChoose: Block[];
  outline: string[];
  curriculum: Module[];
  eligibility: Block[];
  completion: Block[];
  faqs: Faq[];
  partners: Partner[];
  facultyGroups: { title: string; ids: string[] }[];
  certification: { label?: string };
  sourceUrl?: string;
};

type RawCourse = Partial<Course> & { slug: string; title: string; category: string; specialty: string; image: string; instructors: string; pricing: PricingTier[] };

const images = import.meta.glob("/src/assets/courses/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const partnerImages = import.meta.glob("/src/assets/partners/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

/** The application form asks every applicant for these (see ApplicationForm). */
export const applicationDocuments = ["Medical Council certificate", "MBBS certificate", "PG certificate", "Aadhaar / PAN or passport", "Passport-size photo"];

export const applicationProcess = [
  { title: "Apply", text: "Submit your application and professional details." },
  { title: "Verification", text: "MedTrain reviews your submitted details." },
  { title: "Eligibility confirmed", text: "You are told whether you are eligible." },
  { title: "Payment", text: "Pay in full or through an available instalment option." },
  { title: "Enrollment", text: "Enroll and begin the program." },
] as const;

const certificationLabel = (title: string) => (/diploma/i.test(title) ? "Diploma" : /fellowship/i.test(title) ? "Fellowship" : /certificate|certification/i.test(title) ? "Certificate" : undefined);

/** Fallback FAQs for courses whose page publishes none. Only states MedTrain's application process. */
function fallbackFaqs(c: Course): Faq[] {
  return [
    { question: "Who can apply?", paragraphs: [factValue(c, "eligibility") ? `Eligibility for this course: ${factValue(c, "eligibility")}. MedTrain confirms eligibility when it reviews your application.` : "MedTrain confirms eligibility for each course when it reviews your application."] },
    { question: "What documents are required?", paragraphs: ["You are asked to upload:"], items: applicationDocuments },
    { question: "How does eligibility verification work?", paragraphs: ["After you apply, the MedTrain team reviews your eligibility and the details you submit. You move to payment and enrollment only once your eligibility is confirmed."] },
    { question: "What happens after I submit my application?", paragraphs: ["MedTrain verifies your details, confirms your eligibility, and then invites you to pay and enroll. Nothing is charged when you apply."] },
  ];
}

export const factValue = (c: Pick<Course, "facts">, label: string) => c.facts.find((f) => f.label.toLowerCase().includes(label))?.values.join(" · ");

function define(r: RawCourse): Course {
  const img = images[`/src/assets/courses/${r.image}`] ?? "";
  const c: Course = {
    tagline: undefined, featured: false, internationalOnly: false, appOnly: false, facts: [], overview: [], whyChoose: [], outline: [], curriculum: [], eligibility: [], completion: [], faqs: [], partners: [], facultyGroups: [],
    ...r,
    image: img,
    imageAlt: `${r.title} — MedTrain course artwork`,
    certification: { ...(certificationLabel(r.title) ? { label: certificationLabel(r.title) } : {}) },
  } as Course;
  c.partners = (r.partners ?? []).map((p) => ({ ...p, image: partnerImages[`/src/assets/partners/${p.image}`] ?? "" })).filter((p) => p.image);
  if (!c.faqs.length) c.faqs = fallbackFaqs(c);
  return c;
}

export const courses: Course[] = (raw as unknown as RawCourse[]).map(define);

/** Runtime status: explicit status wins, otherwise "Upcoming" when a published start date is in the future. */
export function courseStatus(c: Course, now = new Date()): CourseStatus | undefined {
  if (c.status) return c.status;
  if (c.startsOn) { const d = new Date(c.startsOn.length === 7 ? `${c.startsOn}-01` : c.startsOn); if (d > now) return "Upcoming"; }
  return undefined;
}

export const appStoreUrl = APP_LINKS.android;

export const featuredSlug = "diploma-in-allergy-asthma-clinical-immunology";
/** Featured courses shown on the home page (editorial choice, flagged in the data). */
export const featuredCourses = courses.filter((c) => c.featured).slice(0, 3);
export const categories = Array.from(new Set(courses.map((c) => c.category)));

/** Returns undefined for unknown slugs so routes can 404 instead of showing the wrong course. */
export const findCourse = (slug: string) => courses.find((c) => c.slug === slug);

export const facetValue = (value: string | undefined) => value ?? "To be confirmed";
export const TBC = "To be confirmed";

export type CourseFacultyGroup = { title?: string; people: Faculty[] };
export const courseFaculty = (course: Course): CourseFacultyGroup[] =>
  course.facultyGroups.map((g) => ({ title: g.title, people: g.ids.map((id) => faculty[id]).filter((f): f is Faculty => !!f) })).filter((g) => g.people.length);

/** One-line price for cards: "₹25,000", "From ₹25,000", "2,400 USD" or "Free". */
export function priceSummary(c: Course): { text: string; note?: string } | undefined {
  const first = c.pricing[0];
  if (!first) return undefined;
  if (first.free) return { text: "Free" };
  const label = (t: PricingTier) => t.inr?.amount ?? t.usd;
  const text = label(first);
  if (!text) return undefined;
  const multi = c.pricing.length > 1 && c.pricing.some((t) => label(t) !== text);
  return { text: multi ? `From ${text}` : text, ...(first.inr?.note ? { note: first.inr.note } : {}) };
}
