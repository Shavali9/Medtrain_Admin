import raw from "@/data/faculty.json";

/**
 * MedTrain faculty, imported from med-train.com. Single source for the home page and course pages.
 * Portraits live in src/assets/faculty/ (real photos only — no stock or generated faces).
 */
export type Faculty = {
  id: string;
  name: string;
  designation?: string;
  /** Qualifications, roles and affiliations, one per line, as published by MedTrain. */
  details?: string[];
  photo?: string;
};

type RawFaculty = { id: string; name: string; designation?: string; details?: string[]; photo?: string };

const photos = import.meta.glob("/src/assets/faculty/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const photoUrl = (file?: string) => (file ? photos[`/src/assets/faculty/${file}`] : undefined);

export const faculty: Record<string, Faculty> = Object.fromEntries(
  Object.entries(raw as unknown as Record<string, RawFaculty>).map(([id, f]) => {
    const photo = photoUrl(f.photo);
    return [id, { id, name: f.name, ...(f.designation ? { designation: f.designation } : {}), ...(f.details?.length ? { details: f.details } : {}), ...(photo ? { photo } : {}) }];
  }),
);

/** MedTrain directors shown on the home page. */
export const homeFaculty: Faculty[] = ["balachandra", "vedanthan", "jagdish", "aruna"].map((id) => faculty[id]).filter((f): f is Faculty => !!f);
