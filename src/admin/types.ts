import type { DocumentName } from "@/lib/application";
import type { Course } from "@/lib/courses";

export type Role = "admin" | "reviewer";
export type StaffUser = { id: string; name: string; email: string; role: Role };

/** Application lifecycle as seen by staff. Payment and enrollment come after "eligible" and are out of scope here. */
export type AppStatus = "submitted" | "in_review" | "info_requested" | "eligible" | "not_eligible";
export const appStatusLabels: Record<AppStatus, string> = { submitted: "New", in_review: "In review", info_requested: "More info needed", eligible: "Eligible", not_eligible: "Not eligible" };
export const appStatusOrder: AppStatus[] = ["submitted", "in_review", "info_requested", "eligible", "not_eligible"];
export const openStatuses: AppStatus[] = ["submitted", "in_review", "info_requested"];

export type DocStatus = "pending" | "verified" | "rejected";
export type AdminDoc = { key: DocumentName; label: string; fileName: string; sizeKB: number; status: DocStatus; note?: string };

export type Applicant = {
  prefix: string; firstName: string; lastName: string; age: number; gender: string; phone: string;
  nationality: string; state?: string; profession: string; registrationNumber: string; qualification: string; mbbsYear: number;
  experience: string; referral: string; permanentAddress: string; shippingAddress: string; gstNumber?: string;
};

export type HistoryKind = "submitted" | "status" | "note" | "document" | "assigned";
export type HistoryEntry = { id: string; at: string; actor: string; kind: HistoryKind; text: string };

export type Application = {
  id: string; submittedAt: string; courseSlug: string; applicant: Applicant; docs: AdminDoc[]; status: AppStatus;
  assignedTo: string | null; decisionReason?: string; history: HistoryEntry[];
};

export type Student = { id: string; name: string; email: string; phone: string; registeredAt: string; status: "active" | "suspended" };

export type EnquiryStatus = "new" | "replied" | "closed";
export type Enquiry = { id: string; name: string; email: string; phone?: string; courseSlug?: string; message: string; createdAt: string; status: EnquiryStatus; assignedTo: string | null; reply?: string };

export type AdminFaculty = { id: string; name: string; designation?: string; details: string[]; photo?: string };

export type GalleryPhotoRec = { id: string; src: string; alt: string; kind: "photo" | "graphic" };
export type GallerySectionRec = { id: string; title: string; short: string; course?: string };

export type CourseVisibility = "published" | "draft";
export type CourseSeo = { title?: string; description?: string; keywords?: string; canonicalUrl?: string };
export type WelcomeEmail = { enabled: boolean; subject: string; cc?: string; body: string };
export type AdminCourse = Course & { id: string; visibility: CourseVisibility; tags?: string[]; seo?: CourseSeo; welcomeEmail?: WelcomeEmail; updatedAt?: string;
  saleChannels?: SaleChannel[]; tax?: { rate: string; inclusive: boolean; invoiceNote?: string }; purchaseMode?: "single" | "cart"; featuredPriority?: number; subCategories?: string };
export type SaleChannel = "website" | "android" | "ios" | "private" | "none";

export type ActivityEntry = { id: string; at: string; actor: string; role: Role; action: string; target: string };
