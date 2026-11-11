import raw from "@/data/gallery.json";

/** Photos imported from med-train.com/gallery.php (43 photos, 5 programs), resized for the web. */
export type GalleryPhoto = {
  id: string;
  thumb: string;
  large: string;
  /** Size of the large version, for the lightbox. */
  w: number;
  h: number;
  /** "cover" fills the 16:9 frame; "contain" shows panoramas whole instead of cropping them. */
  fit: "cover" | "contain";
  kind: "photo" | "graphic";
  alt: string;
};
export type GallerySection = { id: string; short: string; title: string; course?: string; photos: GalleryPhoto[] };

const thumbs = import.meta.glob("/src/assets/gallery/thumb/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const larges = import.meta.glob("/src/assets/gallery/large/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

type RawSection = { id: string; short: string; title: string; course?: string; photos: { id: string; w: number; h: number; fit: "cover" | "contain"; kind: "photo" | "graphic"; alt: string }[] };

export const gallerySections: GallerySection[] = (raw as unknown as RawSection[]).map((s) => ({
  ...s,
  photos: s.photos.map((p) => ({ ...p, thumb: thumbs[`/src/assets/gallery/thumb/${p.id}.webp`] ?? "", large: larges[`/src/assets/gallery/large/${p.id}.webp`] ?? "" })).filter((p) => p.thumb && p.large),
}));

export const galleryTotal = gallerySections.reduce((n, s) => n + s.photos.length, 0);
