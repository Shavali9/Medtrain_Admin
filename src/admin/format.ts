const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
export const fmtDate = (iso: string) => date.format(new Date(iso));
export const fmtDateTime = (iso: string) => dateTime.format(new Date(iso));
export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now"; const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`; const d = Math.round(h / 24); return d < 30 ? `${d} day${d === 1 ? "" : "s"} ago` : fmtDate(iso);
}
export const daysSince = (iso: string, now = Date.now()) => Math.floor((now - new Date(iso).getTime()) / 86_400_000);
export const fullName = (a: { prefix: string; firstName: string; lastName: string }) => `${a.prefix} ${a.firstName} ${a.lastName}`.trim();
export const initialsOf = (name: string) => name.replace(/^(Dr\.?|Ms\.?|Mr\.?|Mrs\.?)\s+/i, "").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

/** Reads an image file and returns a resized JPEG/WebP data URL (max width), so browser storage stays small. */
export function imageToDataUrl(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Choose an image file (JPG, PNG or WebP)."));
    if (file.size > 15 * 1024 * 1024) return reject(new Error("That image is over 15 MB. Choose a smaller file."));
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { const scale = Math.min(1, maxWidth / img.width); const c = document.createElement("canvas"); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale); c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL("image/webp", quality)); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That image could not be read.")); };
    img.src = url;
  });
}
