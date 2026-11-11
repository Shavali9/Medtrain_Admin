/** Site-wide constants. Set VITE_SITE_URL to the production origin (no trailing slash). */
export const SITE_URL = ((import.meta.env["VITE_SITE_URL"] as string | undefined) ?? "https://www.med-train.com").replace(/\/$/, "");
export const SITE_NAME = "MedTrain";
export const DEFAULT_DESCRIPTION = "Evidence-based courses and expert-led professional education for doctors and healthcare professionals.";
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** Contact details, as published on med-train.com. */
export const CONTACT_EMAIL = "contact@med-train.com";
export const CONTACT = {
  legalName: "Bangalore MedTrain LLP",
  addressLines: ["#14/1, 25th A Cross, 24th Main Road,", "2nd Sector, HSR Layout, Bengaluru – 560102, KA, IN"],
  address: { street: "#14/1, 25th A Cross, 24th Main Road, 2nd Sector, HSR Layout", city: "Bengaluru", postalCode: "560102", region: "KA", country: "IN" },
  phone: { label: "+91 79757 64489", tel: "+917975764489" },
  whatsapp: [{ label: "+91 79757 64489", wa: "917975764489" }, { label: "+91 88614 42531", wa: "918861442531" }],
  gst: "29AAUFB1204D1ZP",
  tagline: "Enhancing knowledge through values and experience.",
} as const;

export const SOCIAL = [
  { name: "X (Twitter)", href: "https://twitter.com/MedTrain2" },
  { name: "Facebook", href: "https://www.facebook.com/themedtrain" },
  { name: "Instagram", href: "https://www.instagram.com/med_train/" },
  { name: "YouTube", href: "https://www.youtube.com/channel/UCNSnWtEBTk3TTIbALatNZlQ" },
  { name: "LinkedIn", href: "https://in.linkedin.com/company/themedtrain" },
] as const;

export const APP_LINKS = {
  android: "https://play.google.com/store/apps/details?id=com.medtrain.learners",
  ios: "https://apps.apple.com/us/app/medtrain/id1625258075",
} as const;
