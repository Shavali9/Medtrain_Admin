import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/form";
import { cn } from "@/lib/utils";

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
export const btnPrimary = cn(btn, "bg-primary text-primary-foreground hover:bg-primary-strong");
export const btnSecondary = cn(btn, "border border-primary/30 bg-background text-primary-strong hover:border-primary hover:bg-brand-soft");
export const btnDanger = cn(btn, "bg-destructive text-primary-foreground hover:bg-destructive/90");
export const inputCls = "w-full rounded-md border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring";

/** Asks for a written reason/message before an action (e.g. rejecting, requesting information). */
export function ReasonDialog({ open, onOpenChange, title, description, label, placeholder, confirmLabel, danger, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: ReactNode; label: string; placeholder?: string; confirmLabel: string; danger?: boolean; onConfirm: (text: string) => void }) {
  const [text, setText] = useState(""); const [err, setErr] = useState<string>();
  const submit = () => { const t = text.trim(); if (t.length < 5) { setErr("Write at least a short sentence so the reason is clear."); return; } onConfirm(t); setText(""); setErr(undefined); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={(o) => { if (!o) { setText(""); setErr(undefined); } onOpenChange(o); }}>
    <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="text-xl font-bold">{title}</DialogTitle><DialogDescription className="text-base leading-7">{description}</DialogDescription></DialogHeader>
      <div><label htmlFor="reason-text" className="mb-1.5 block text-sm font-semibold">{label}</label><textarea id="reason-text" rows={4} value={text} onChange={(e) => { setText(e.target.value); setErr(undefined); }} placeholder={placeholder} aria-invalid={!!err} aria-describedby={err ? "reason-err" : undefined} className={inputCls} /><FieldError id="reason-err" message={err} /></div>
      <DialogFooter className="gap-2 sm:gap-2"><button type="button" onClick={() => onOpenChange(false)} className={btnSecondary}>Cancel</button><button type="button" onClick={submit} className={danger ? btnDanger : btnPrimary}>{confirmLabel}</button></DialogFooter>
    </DialogContent></Dialog>;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, danger, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void }) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle><AlertDialogDescription className="text-base leading-7">{description}</AlertDialogDescription></AlertDialogHeader>
    <AlertDialogFooter><AlertDialogCancel className={btnSecondary}>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm} className={danger ? btnDanger : btnPrimary}>{confirmLabel}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

export function InfoDialog({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="text-xl font-bold">{title}</DialogTitle><DialogDescription asChild><div className="text-base leading-7">{children}</div></DialogDescription></DialogHeader><DialogFooter><button type="button" onClick={() => onOpenChange(false)} className={btnPrimary}>Close</button></DialogFooter></DialogContent></Dialog>;
}
