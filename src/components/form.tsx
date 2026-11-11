import type { ReactNode } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const control = (invalid: boolean) => cn("h-12 w-full rounded-md border bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring", invalid ? "border-destructive" : "border-border");

export const Req = () => <span className="text-destructive" aria-hidden="true"> *</span>;

export function Field({ name, label, hint, required, error, wide, children }: { name: string; label: string; hint?: string | undefined; required?: boolean; error?: string | undefined; wide?: boolean; children: ReactNode }) {
  return <div className={cn(wide && "sm:col-span-2")}><label htmlFor={name} className="mb-1.5 block text-sm font-semibold">{label}{required && <Req />}{hint && <span className="font-normal text-muted-foreground"> ({hint})</span>}</label>{children}<FieldError id={`${name}-err`} message={error} /></div>;
}

export function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  return message ? <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-destructive"><AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{message}</p> : null;
}

export function Select({ placeholder, options, ...props }: React.ComponentProps<"select"> & { placeholder?: string; options: string[] }) {
  return <div className="relative"><select {...props} className={cn(props.className, "appearance-none pr-10")}>{placeholder && <option value="">{placeholder}</option>}{options.map((o) => <option key={o} value={o}>{o}</option>)}</select><ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary" aria-hidden="true" /></div>;
}

export function Notice({ tone, title, children }: { tone: "warn" | "error" | "success"; title: string; children: ReactNode }) {
  return <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-card border p-4 text-sm leading-6", tone === "warn" ? "border-accent/50 bg-accent/10" : tone === "success" ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/5")}><AlertCircle size={20} className={cn("mt-0.5 shrink-0", tone === "warn" ? "text-accent" : tone === "success" ? "text-success" : "text-destructive")} aria-hidden="true" /><div><p className="font-bold">{title}</p><p className="mt-0.5 text-muted-foreground">{children}</p></div></div>;
}
