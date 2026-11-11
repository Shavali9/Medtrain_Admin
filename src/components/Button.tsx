import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "light" | "outline-light";

type Props = { children: ReactNode; variant?: ButtonVariant; className?: string | undefined; onClick?: () => void; type?: "button" | "submit"; ariaLabel?: string; ariaExpanded?: boolean; ariaControls?: string; buttonRef?: React.Ref<HTMLButtonElement> } & ({ to: "/admin"; href?: never } | { href: string; to?: never } | { to?: never; href?: never });

const styles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-strong",
  secondary: "border border-primary/30 bg-background text-primary-strong hover:border-primary hover:bg-brand-soft",
  light: "bg-primary-foreground text-primary-strong hover:bg-brand-soft",
  "outline-light": "border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10",
};

export const buttonClasses = (variant: ButtonVariant = "primary", className?: string) =>
  cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", styles[variant], className);

export function Button({ children, variant = "primary", className, onClick, type = "button", ariaLabel, ariaExpanded, ariaControls, buttonRef, ...props }: Props) {
  const classes = buttonClasses(variant, className);
  if (props.to) return <Link to={props.to} className={classes}>{children}</Link>;
  if (props.href) return <a href={props.href} className={classes}>{children}</a>;
  return <button ref={buttonRef} type={type} onClick={onClick} aria-label={ariaLabel} aria-expanded={ariaExpanded} aria-controls={ariaControls} className={classes}>{children}</button>;
}
