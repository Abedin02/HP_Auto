import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { CarImage } from "@/components/vehicle/CarImage";
import { PHOTOS } from "@/data/photos";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { SHOWROOM_EMAIL, SHOWROOM_PHONE, SHOWROOMS, telHref } from "@/lib/contact";
import { unsplash } from "@/lib/images";
import type { ImageSource } from "@/types/vehicle";

/** Full-bleed header backdrop; fades in once loaded (CarImage) under the same Ken Burns drift as the home hero. */
const HERO_MEDIA: { source: ImageSource; alt: string } = {
  source: unsplash(PHOTOS.audiEtronGtShowroom),
  alt: "Rear light bar of a black Audi e-tron GT in a showroom",
};

/** Showroom mood photography, shown as a gallery under the (single) Medford showroom. */
const SHOWROOM_GALLERY: readonly { source: ImageSource; alt: string }[] = [
  { source: unsplash(PHOTOS.porscheGt2RsShowroom), alt: "White Porsche GT2 RS inside a glass-walled showroom" },
  { source: unsplash(PHOTOS.laFerrariShowroom), alt: "Red Ferrari LaFerrari in a white gallery space" },
];

const GALLERY_ASPECT = 4 / 3;

export function ConciergePage() {
  useDocumentTitle("Visit — HP Auto");

  return (
    <>
      <header className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <CarImage
            source={HERO_MEDIA.source}
            alt={HERO_MEDIA.alt}
            priority
            className="animate-kenburns size-full"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_40%,transparent_0%,oklch(0.145_0.004_70/0.55)_60%,oklch(0.145_0.004_70/0.95)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink via-ink/60 to-transparent" />

        {/* All copy stays in the left column so the car (plate, badge) on the right is never covered. */}
        <div className="mx-auto w-full max-w-[1600px] px-5 pt-40 pb-16 md:px-10 lg:pb-20">
          <p className="eyebrow animate-fade-up text-champagne">Visit</p>
          <h1 className="animate-fade-up mt-6 max-w-5xl font-display text-[clamp(3rem,7.5vw,7.5rem)] leading-[0.93] [animation-delay:120ms]">
            One contact, <em className="text-gilded">for every car</em> you'll ever own.
          </h1>
          <p className="animate-fade-up mt-10 max-w-xl text-lg text-ivory/75 [animation-delay:240ms]">
            Viewings, sourcing, storage or a straight answer about a car: your concierge handles all of it, with no call
            centre and no scripts. Call or email — there's no form to fill in.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap gap-x-12 gap-y-4 [animation-delay:320ms]">
            <div>
              <p className="eyebrow text-[0.6rem] text-mist">Direct line</p>
              <a href={telHref(SHOWROOM_PHONE)} className="mt-1 block font-display text-3xl hover:text-champagne">
                {SHOWROOM_PHONE}
              </a>
            </div>
            <div>
              <p className="eyebrow text-[0.6rem] text-mist">Email</p>
              <a href={`mailto:${SHOWROOM_EMAIL}`} className="mt-1 block font-display text-3xl hover:text-champagne">
                {SHOWROOM_EMAIL}
              </a>
            </div>
          </div>
          <div className="animate-fade-up mt-10 flex flex-wrap gap-4 [animation-delay:400ms]">
            <Button asChild variant="luxe" size="xl">
              <a href={telHref(SHOWROOM_PHONE)}>
                <Phone className="size-4" /> Call the showroom
              </a>
            </Button>
            <Button asChild variant="luxe-outline" size="xl" className="text-ivory">
              <a href={`mailto:${SHOWROOM_EMAIL}`}>
                <Mail className="size-4" /> Email us
              </a>
            </Button>
          </div>
        </div>
      </header>

      <section aria-label="Showrooms" className="mx-auto max-w-[1600px] px-5 pt-4 pb-16 md:px-10 md:pb-20">
        {SHOWROOMS.map((showroom, i) => (
          <Reveal key={showroom.city} delay={i * 120}>
            <article className="grid gap-8 border-t border-line py-10 md:grid-cols-12 md:items-end">
              <div className="md:col-span-7">
                <p className="eyebrow text-champagne">{showroom.city}</p>
                <h2 className="mt-3 font-display text-5xl italic md:text-6xl">{showroom.name}</h2>
              </div>
              <div className="md:col-span-5">
                <p className="text-lg text-ivory/75">{showroom.address}</p>
                <p className="mt-1 text-sm text-mist">{showroom.hours}</p>
                <a
                  href={showroom.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm text-champagne hover:text-champagne-bright"
                >
                  Get directions <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </article>
          </Reveal>
        ))}

        <div className="grid gap-5 md:grid-cols-2">
          {SHOWROOM_GALLERY.map((photo, i) => (
            <Reveal key={photo.alt} delay={i * 120}>
              <figure className="group aspect-[4/3] overflow-hidden">
                <CarImage
                  source={photo.source}
                  alt={photo.alt}
                  aspect={GALLERY_ASPECT}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="size-full transition-transform duration-[1800ms] ease-(--ease-luxe) group-hover:scale-105"
                />
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
