import { useCallback, useEffect, useRef, useState } from "react";
import type { HTMLAttributes, KeyboardEvent, MouseEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Connected carousel: one large active card with the neighbouring cards peeking on either side.
 * Adapted from the supplied reference (Next.js / customer quotes) for TanStack Start and faculty profiles:
 * plain <img>, no autoplay (people read bios at their own pace), visible previous/next buttons.
 */
export interface CarouselItem {
  id: string | number;
  title: string;
  /** Short label shown as a badge under the title (e.g. a designation). */
  badge?: string | undefined;
  /** Supporting lines, one per row (e.g. qualifications). */
  lines?: string[] | undefined;
  image?: string | undefined;
  alt?: string | undefined;
}

export interface ConnectedCarouselProps extends HTMLAttributes<HTMLDivElement> {
  items: CarouselItem[];
  label: string;
}

type Tier = "mobile" | "tablet" | "desktop";
const VISIBLE_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4] as const;

// Same "connector" shape as the reference: a concave notch that joins the peeking cards to the active card.
const NOTCH_L = "M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z";
const NOTCH_S = "M0 0C0 0 0.993759 10.1818 8 10.1818C15.0062 10.1818 16 0 16 0V28C16 28 15.0062 17.8182 8 17.8182C0.993759 17.8182 0 28 0 28V0Z";

function Portrait({ item, className }: { item: CarouselItem; className?: string }) {
  return item.image
    ? <img src={item.image} alt={item.alt ?? item.title} draggable={false} loading="lazy" className={cn("size-full object-cover object-[50%_18%]", className)} />
    : <div className="grid size-full place-items-center text-primary/30" role="img" aria-label={`Photo of ${item.title} to be added`}><UserRound className="size-1/2" strokeWidth={1.25} aria-hidden="true" /></div>;
}

function Notch({ side, small }: { side: "left" | "right"; small?: boolean }) {
  return <div aria-hidden="true" className="pointer-events-none absolute bottom-0 top-0 z-[100] flex items-center text-card" style={{ width: small ? 18 : 22, height: small ? 28 : 42, margin: "auto 0", [side === "left" ? "left" : "right"]: "calc(100% - 1px)" }}>
    <svg viewBox={small ? "0 0 16 28" : "0 0 20 37.3338"} preserveAspectRatio="none" className="block size-full overflow-visible fill-current"><path d={small ? NOTCH_S : NOTCH_L} /></svg>
  </div>;
}

export function ConnectedCarousel({ items, label, className, ...props }: ConnectedCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [page, setPage] = useState(0);
  const [tier, setTier] = useState<Tier | null>(null);
  const [width, setWidth] = useState(1200);
  const total = items.length;
  const activeIndex = ((page % total) + total) % total;

  // Layout follows the container's width (not the window), so it stays correct inside any page grid.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => { const w = el.clientWidth; setWidth(w); setTier(w >= 1200 ? "desktop" : w >= 820 ? "tablet" : "mobile"); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback((delta: number) => setPage((p) => p + delta), []);
  const onTab = (e: MouseEvent<HTMLButtonElement>) => {
    const target = Number(e.currentTarget.dataset["index"]);
    let diff = target - activeIndex;
    if (diff > total / 2) diff -= total; else if (diff < -total / 2) diff += total;
    go(diff);
  };
  const onCard = (e: MouseEvent<HTMLDivElement>) => { const o = Number(e.currentTarget.dataset["offset"]); if (o !== 0) go(o); };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => { if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } else if (e.key === "ArrowRight") { e.preventDefault(); go(1); } };

  const t: Tier = tier ?? "desktop";
  const dims = { desktop: { width: 762, height: 513 }, tablet: { width: 560, height: 540 }, mobile: { width: Math.min(340, width - 56), height: 620 } }[t];
  const spring = reduce ? { duration: 0 } : ({ type: "spring", stiffness: 220, damping: 26, mass: 0.75 } as const);

  const variant = (offset: number) => {
    const hidden = (x: number, h: number, w: number) => ({ x, y: -h / 2, width: w, height: h, opacity: 0, zIndex: 0, pointerEvents: "none" as const });
    const show = (x: number, h: number, w: number, z = 100) => ({ x, y: -h / 2, width: w, height: h, opacity: 1, zIndex: z, pointerEvents: "auto" as const });
    const { width: aw, height: ah } = dims;
    if (offset === 0) return show(-aw / 2, ah, aw, 0);
    if (t === "mobile") { const gap = 12, pw = 44, ph = 420; if (offset === -1) return show(-aw / 2 - gap - pw, ph, pw); if (offset === 1) return show(aw / 2 + gap, ph, pw); return hidden(offset < 0 ? -aw / 2 - 220 : aw / 2 + 220, ph, pw); }
    if (t === "tablet") { const gap = 18, sw = 100, sh = 360; if (offset === -1) return show(-aw / 2 - gap - sw, sh, sw); if (offset === 1) return show(aw / 2 + gap, sh, sw); return hidden(offset < 0 ? -aw / 2 - 240 : aw / 2 + 240, sh, 74); }
    switch (offset) {
      case -1: return show(-506, 344, 105);
      case 1: return show(401, 344, 105);
      case -2: return show(-596, 205, 74);
      case 2: return show(522, 205, 74);
      case -3: return hidden(-720, 205, 74);
      case 3: return hidden(646, 205, 74);
      default: return hidden(offset < 0 ? -860 : 860, 205, 74);
    }
  };

  const many = total > 9;

  return <div ref={containerRef} role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0} onKeyDown={onKey}
    className={cn("relative mx-auto flex w-full max-w-[1240px] select-none flex-col items-center overflow-hidden py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...props}>
    <div id="carousel-view-panel" role="tabpanel" aria-live="polite" className={cn("relative flex w-full items-center justify-center", tier === null && "invisible")} style={{ height: dims.height }}>
      {VISIBLE_OFFSETS.map((offset) => {
        const virtual = page + offset;
        const item = items[((virtual % total) + total) % total]!;
        const isActive = offset === 0;
        return <motion.div key={virtual} data-offset={offset} onClick={onCard} initial={false} animate={variant(offset)} transition={spring}
          role={isActive ? undefined : "button"} aria-label={isActive ? undefined : `Show ${item.title}`} aria-hidden={Math.abs(offset) > 2 ? true : undefined}
          style={{ position: "absolute", left: "50%", top: "50%", willChange: "transform" }}
          className={cn("overflow-visible rounded-[28px] bg-card text-card-foreground shadow-card sm:rounded-[32px]", !isActive && "cursor-pointer")}>
          {offset === -1 && <Notch side="left" />}
          {offset === 1 && <Notch side="right" />}
          {offset === -2 && t === "desktop" && <Notch side="left" small />}
          {offset === 2 && t === "desktop" && <Notch side="right" small />}

          <div className="relative size-full overflow-hidden" style={{ borderRadius: "inherit" }}>
            {/* Collapsed state: just the portrait */}
            <motion.div aria-hidden={isActive} initial={false} animate={{ opacity: isActive ? 0 : 1 }} transition={{ duration: reduce ? 0 : 0.22, ease: "easeOut" }} className={cn("absolute inset-0 p-2", isActive && "pointer-events-none")}>
              <div className="relative size-full overflow-hidden rounded-[20px] bg-brand-soft sm:rounded-[24px]"><Portrait item={item} /></div>
            </motion.div>

            {/* Expanded state: profile */}
            <div className="absolute" style={{ left: "50%", top: "50%", width: dims.width, height: dims.height, transform: "translate(-50%, -50%)" }}>
              <motion.div inert={!isActive} initial={false} animate={{ opacity: isActive ? 1 : 0, x: reduce ? 0 : isActive ? 0 : offset < 0 ? -822 : 822 }} transition={spring}
                className={cn("flex size-full flex-col-reverse gap-4 p-4 sm:p-5 md:flex-row md:gap-6 md:p-6 lg:p-7", !isActive && "pointer-events-none")}>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold leading-tight tracking-tight text-foreground md:text-2xl lg:text-3xl">{item.title}</h3>
                    {item.badge && <p className="mt-2 inline-flex w-fit max-w-full rounded-md bg-brand-soft px-2.5 py-1 text-xs font-bold text-primary-strong sm:text-sm">{item.badge}</p>}
                  </div>
                  {item.lines?.length ? <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto border-l-2 border-primary/25 pl-4 pr-1 text-sm leading-6 text-muted-foreground md:text-base md:leading-7" tabIndex={0} aria-label={`${item.title} — background`}>{item.lines.map((l) => <li key={l}>{l}</li>)}</ul> : null}
                </div>
                <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-[18px] bg-brand-soft sm:rounded-[22px] md:h-full md:w-[clamp(180px,42%,320px)]"><Portrait item={item} /></div>
              </motion.div>
            </div>
          </div>
        </motion.div>;
      })}
    </div>

    <div className="mt-5 flex items-center gap-4">
      <button type="button" onClick={() => go(-1)} aria-label="Previous" className="grid size-11 place-items-center rounded-full border border-border bg-background text-primary transition-colors hover:border-primary hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft size={20} /></button>
      {many
        ? <p className="min-w-16 text-center text-sm font-semibold tabular-nums" aria-live="polite">{activeIndex + 1} <span className="text-muted-foreground">/ {total}</span></p>
        : <div role="tablist" aria-label={`${label} — choose a profile`} className="flex items-center gap-1.5">
          {items.map((item, idx) => { const sel = idx === activeIndex; return <button key={item.id} type="button" role="tab" data-index={idx} aria-controls="carousel-view-panel" onClick={onTab} aria-selected={sel} aria-label={item.title} tabIndex={sel ? 0 : -1}
            className={cn("h-2 rounded-[3px] border-0 p-0 transition-[width,background-color] duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring", sel ? "w-10 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/50")} />; })}
        </div>}
      <button type="button" onClick={() => go(1)} aria-label="Next" className="grid size-11 place-items-center rounded-full border border-border bg-background text-primary transition-colors hover:border-primary hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight size={20} /></button>
    </div>
  </div>;
}
