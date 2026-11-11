import { z } from "zod";
import type { Course } from "@/lib/courses";

/** Mirrors the fields on MedTrain's current eligibility / enrollment form. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png";

// Option lists the current form doesn't publish are marked "assumed" — confirm with MedTrain.
export const prefixes = ["Dr.", "Mr.", "Mrs.", "Ms."]; // assumed
export const professions = ["Doctor", "Nurse", "Other"]; // assumed
export const genders = ["Female", "Male", "Other"]; // assumed
export const nationalities = ["Indian", "International"]; // assumed
export const qualifications = ["Diploma", "MD", "DNB", "Other"]; // assumed, from the course's stated eligibility
export const indianStates = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];

export const documentFields = [
  { name: "medicalCouncilCertificate", label: "Medical Council certificate" },
  { name: "mbbsCertificate", label: "MBBS certificate" },
  { name: "pgCertificate", label: "PG certificate" },
  { name: "idProof", label: "Aadhaar / PAN or passport" },
  { name: "photo", label: "Photo" },
] as const;
export type DocumentName = (typeof documentFields)[number]["name"];

const required = (label: string) => z.string({ required_error: `${label} is required` }).trim().min(1, `${label} is required`);
const oneOf = (label: string, list: string[]) => z.string({ required_error: `Select ${label.toLowerCase()}` }).refine((v) => list.includes(v), `Select ${label.toLowerCase()}`);
const file = z.custom<File>((v) => v instanceof File, "Upload this document")
  .refine((f) => f.size <= MAX_FILE_BYTES, "File must be 2 MB or smaller")
  .refine((f) => ACCEPTED_TYPES.includes(f.type), "Use a PDF, JPG or PNG file");
const thisYear = new Date().getFullYear();

const baseSchema = z.object({
  prefix: oneOf("Prefix", prefixes),
  firstName: required("First name"),
  lastName: required("Last name"),
  name: required("Name"),
  age: required("Age").refine((v) => /^\d{2,3}$/.test(v) && +v >= 21 && +v <= 100, "Enter a valid age"),
  profession: oneOf("Profession", professions),
  registrationNumber: required("Registration number"),
  phone: required("Phone number").refine((v) => /^\+?[\d\s-]{7,16}$/.test(v), "Enter a valid phone number"),
  gender: oneOf("Gender", genders),
  nationality: oneOf("Nationality", nationalities),
  gstNumber: z.string().trim().toUpperCase().optional().refine((v) => !v || /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(v), "Enter a valid 15-character GST number"),
  referral: required("This"),
  permanentAddress: required("Permanent address"),
  shippingAddress: required("Shipping address"),
  qualification: oneOf("Qualification", qualifications),
  mbbsYear: required("Year of passing").refine((v) => /^\d{4}$/.test(v) && +v >= 1950 && +v <= thisYear, `Enter a year between 1950 and ${thisYear}`),
  experience: required("Work position and experience"),
  medicalCouncilCertificate: file, mbbsCertificate: file, pgCertificate: file, idProof: file, photo: file,
});
// Separate schema so the State check runs alongside the field checks, not only after they pass.
const stateSchema = z.object({ nationality: z.string().optional(), state: z.string().optional() }).superRefine((v, ctx) => {
  if (v.nationality === "Indian" && !(v.state && indianStates.includes(v.state))) ctx.addIssue({ code: "custom", path: ["state"], message: "Select your state" });
});
export const applicationSchema = baseSchema.and(stateSchema);
export type ApplicationValues = z.infer<typeof applicationSchema>;

export class NotConnectedError extends Error { constructor() { super("Application service not connected"); } }

/**
 * Sends the application to the receiving service.
 * Set VITE_APPLICATION_ENDPOINT to a URL that accepts multipart/form-data (POST).
 * Without it nothing is sent — the UI says so instead of pretending.
 */
export async function submitApplication(values: ApplicationValues, course: Course, turnstileToken?: string | null) {
  const endpoint = import.meta.env["VITE_APPLICATION_ENDPOINT"] as string | undefined;
  if (!endpoint) throw new NotConnectedError();
  const body = new FormData();
  if (turnstileToken) body.append("cf-turnstile-response", turnstileToken);
  body.append("courseSlug", course.slug); body.append("courseTitle", course.title);
  for (const [key, value] of Object.entries(values)) if (value !== undefined) body.append(key, value as string | Blob);
  const res = await fetch(endpoint, { method: "POST", body });
  if (!res.ok) throw new Error(`Submission failed (${res.status})`);
}
