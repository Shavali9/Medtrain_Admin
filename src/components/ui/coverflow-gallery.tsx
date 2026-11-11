import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { A11y, EffectCoverflow, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { cn } from "@/lib/utils";

/**
 * Coverflow gallery, adapted from the supplied Skiper 49 reference:
 *  - slides are 16:9 (the reference used 1:1) to match MedTrain's photos
 *  - own previous / next controls and a position indicator, using the site's design tokens
 *  - keyboard and screen-reader support; clicking a side slide brings it to the centre,
 *    clicking the centre slide opens it full size
 * Slide sizes live in styles.css (.coverflow-gallery).
 */
export interface CoverflowPhoto { id: string; src: string; alt: string; fit: "cover" | "contain" }

export function CoverflowGallery({ photos, label, onOpen, className, eagerCount = 0 }: { photos: CoverflowPhoto[]; label: string; onOpen: (index: number) => void; className?: string; eagerCount?: number }) {
  const reduce = useReducedMotion();
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  const total = photos.length;
  // Loop needs more slides than fit on screen; short sets stay linear.
  const loop = total > 6;

  const go = (i: number) => (loop ? swiper?.slideToLoop(i) : swiper?.slideTo(i));
  const onSlide = (i: number) => (i === active ? onOpen(i) : go(i));
  const many = total > 9;

  return <div className={cn("relative", className)} role="group" aria-roledescription="carousel" aria-label={label}>
    <Swiper modules={[EffectCoverflow, Keyboard, A11y]} onSwiper={setSwiper} onSlideChange={(s) => setActive(s.realIndex)}
      effect="coverflow" grabCursor centeredSlides slidesPerView="auto" loop={loop} speed={reduce ? 0 : 450} keyboard={{ enabled: true, onlyInViewport: true }}
      coverflowEffect={{ rotate: 32, stretch: 0, depth: 110, modifier: 1, slideShadows: true }}
      a11y={{ enabled: true, prevSlideMessage: "Previous photo", nextSlideMessage: "Next photo" }} className="coverflow-gallery">
      {photos.map((p, i) => <SwiperSlide key={p.id}>
        <button type="button" onClick={() => onSlide(i)} aria-label={i === active ? `Open photo ${i + 1} of ${total} full size` : `Show photo ${i + 1} of ${total}`}
          className="group relative block size-full overflow-hidden rounded-card bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <img src={p.src} alt={p.alt} width={960} height={540} loading={i < eagerCount ? "eager" : "lazy"} draggable={false}
            className={cn("size-full transition-transform duration-500 group-hover:scale-[1.02]", p.fit === "cover" ? "object-cover object-[50%_35%]" : "bg-brand-soft object-contain")} />
        </button>
      </SwiperSlide>)}
    </Swiper>

    <div className="mt-2 flex items-center justify-center gap-4">
      <button type="button" onClick={() => swiper?.slidePrev()} aria-label="Previous photo" className="grid size-11 place-items-center rounded-full border border-border bg-background text-primary transition-colors hover:border-primary hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft size={20} aria-hidden="true" /></button>
      {many
        ? <p className="min-w-16 text-center text-sm font-semibold tabular-nums" aria-live="polite">{active + 1} <span className="text-muted-foreground">/ {total}</span></p>
        : <div className="flex items-center gap-1.5" aria-hidden="true">{photos.map((p, i) => <span key={p.id} className={cn("h-2 rounded-[3px] transition-[width,background-color] duration-300", i === active ? "w-10 bg-primary" : "w-2 bg-primary/25")} />)}</div>}
      <button type="button" onClick={() => swiper?.slideNext()} aria-label="Next photo" className="grid size-11 place-items-center rounded-full border border-border bg-background text-primary transition-colors hover:border-primary hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight size={20} aria-hidden="true" /></button>
    </div>
  </div>;
}
