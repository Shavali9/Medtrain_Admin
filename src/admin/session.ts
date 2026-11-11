import { useSyncExternalStore } from "react";
import { STAFF } from "@/admin/seed";
import type { Role, StaffUser } from "@/admin/types";

/**
 * Demo sign-in. There is no password and no server: choosing a role just stores it in this browser.
 * ROLES ONLY CONTROL WHAT THE UI SHOWS here. Real access control needs a backend that checks the user's
 * role on every request — replace `signIn`/`signOut`/`useSession` with your auth provider when you connect one.
 */
const KEY = "medtrain-admin-session";
const EVENT = "medtrain:admin-session";
export type Area = "overview" | "applications" | "courses" | "faculty" | "gallery" | "students" | "enquiries" | "activity";
const ACCESS: Record<Role, Area[]> = {
  admin: ["overview", "applications", "courses", "faculty", "gallery", "students", "enquiries", "activity"],
  reviewer: ["overview", "applications"],
};
export const canAccess = (role: Role | undefined, area: Area) => !!role && ACCESS[role].includes(area);

let cache: { raw: string | null; user: StaffUser | null } = { raw: null, user: null };
function read(): StaffUser | null {
  let raw: string | null = null; try { raw = localStorage.getItem(KEY); } catch { /* storage blocked */ }
  if (raw === cache.raw) return cache.user;
  const user = STAFF.find((s) => s.id === raw) ?? null; cache = { raw, user }; return user;
}
const subscribe = (fn: () => void) => { window.addEventListener(EVENT, fn); window.addEventListener("storage", fn); return () => { window.removeEventListener(EVENT, fn); window.removeEventListener("storage", fn); }; };

export function signIn(id: string) { try { localStorage.setItem(KEY, id); } catch { /* storage blocked */ } window.dispatchEvent(new Event(EVENT)); }
export function signOut() { try { localStorage.removeItem(KEY); } catch { /* storage blocked */ } window.dispatchEvent(new Event(EVENT)); }

/** `ready` is false until the browser has read the stored session, so guards don't redirect prematurely. */
export function useSession(): { user: StaffUser | null; ready: boolean } {
  const user = useSyncExternalStore(subscribe, () => (typeof window === "undefined" ? null : read()), () => null);
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  return { user, ready };
}
export { STAFF };
