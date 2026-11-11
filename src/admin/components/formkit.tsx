import { useId, useRef, type ReactNode } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FieldError } from "@/components/form";
import { imageToDataUrl } from "@/admin/format";
import { inputCls } from "@/admin/components/dialogs";
import { cn } from "@/lib/utils";

/** A labelled control that wires up its own id, hint and error message. */
export function F({ label, hint, error, required, className, children }: { label: string; hint?: string | undefined; error?: string | undefined; required?: boolean | undefined; className?: string | undefined; children: (p: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode }) {
  const id = useId(); const errId = `${id}-err`; const hintId = `${id}-hint`;
  return <div className={className}><label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}{required && <span className="text-destructive" aria-hidden="true"> *</span>}{required && <span className="sr-only"> (required)</span>}</label>
    {children({ id, "aria-invalid": !!error, "aria-describedby": [error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined })}
    {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}<FieldError id={errId} message={error} /></div>;
}

export const textInput = (invalid = false) => cn("h-12 w-full rounded-md border bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring", invalid ? "border-destructive" : "border-border");

export function TextField({ label, value, onChange, error, hint, required, placeholder, className, list, disabled }: { disabled?: boolean | undefined; label: string; value: string; onChange: (v: string) => void; error?: string | undefined; hint?: string | undefined; required?: boolean | undefined; placeholder?: string | undefined; className?: string | undefined; list?: string | undefined }) {
  return <F label={label} error={error} hint={hint} required={required} className={className}>{(p) => <input {...p} {...(list ? { list } : {})} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={cn(textInput(!!error), disabled && "cursor-not-allowed bg-muted text-muted-foreground")} />}</F>;
}
export function AreaField({ label, value, onChange, rows = 4, hint, error, placeholder, className, disabled }: { disabled?: boolean | undefined; label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string | undefined; error?: string | undefined; placeholder?: string | undefined; className?: string | undefined }) {
  return <F label={label} hint={hint} error={error} className={className}>{(p) => <textarea {...p} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={cn(inputCls, disabled && "cursor-not-allowed bg-muted text-muted-foreground")} />}</F>;
}
export function CheckField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return <div className="flex items-start gap-3"><input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]" /><label htmlFor={id} className="min-w-0 cursor-pointer"><span className="block text-base font-semibold">{label}</span>{hint && <span className="block text-sm text-muted-foreground">{hint}</span>}</label></div>;
}

/** Image picker: resizes in the browser before storing. */
export function ImageField({ label, value, onChange, aspect = "aspect-[16/10]", maxWidth = 1000, alt, hint }: { label: string; value?: string | undefined; onChange: (dataUrl: string | undefined) => void; aspect?: string; maxWidth?: number; alt: string; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null); const id = useId();
  const pick = async (f?: File) => { if (!f) return; try { onChange(await imageToDataUrl(f, maxWidth)); } catch (e) { toast.error(e instanceof Error ? e.message : "That image could not be used."); } };
  return <div><p className="mb-1.5 text-sm font-semibold">{label}</p>
    <div className={cn("relative overflow-hidden rounded-md border border-border bg-muted", aspect)}>{value ? <img src={value} alt={alt} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-sm text-muted-foreground">No image yet</div>}</div>
    <input ref={ref} id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
    <div className="mt-2 flex flex-wrap items-center gap-2"><label htmlFor={id} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-primary/30 px-3 text-sm font-semibold text-primary-strong hover:bg-brand-soft focus-within:ring-2 focus-within:ring-ring"><ImagePlus size={16} aria-hidden="true" />{value ? "Replace image" : "Upload image"}</label>{value && <button type="button" onClick={() => onChange(undefined)} className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-destructive hover:underline"><Trash2 size={15} aria-hidden="true" />Remove</button>}</div>
    {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}</div>;
}

/** Text <-> structured FAQ answers: blank-line separated paragraphs, "- " prefixed bullets. */
export function answerToText(a: { paragraphs?: string[] | undefined; items?: string[] | undefined }) { return [...(a.paragraphs ?? []).map((p) => p), ...(a.items?.length ? [a.items.map((i) => `- ${i}`).join("\n")] : [])].join("\n\n"); }
export function textToAnswer(t: string): { paragraphs?: string[]; items?: string[] } {
  const paragraphs: string[] = []; const items: string[] = [];
  for (const block of t.split(/\n{2,}/)) { const lines = block.split("\n").map((l) => l.trim()).filter(Boolean); if (!lines.length) continue; if (lines.every((l) => l.startsWith("- "))) items.push(...lines.map((l) => l.slice(2).trim())); else paragraphs.push(lines.join(" ")); }
  return { ...(paragraphs.length ? { paragraphs } : {}), ...(items.length ? { items } : {}) };
}
