import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { CarImage } from "@/components/vehicle/CarImage";
import { PHOTOS } from "@/data/photos";
import { unsplash } from "@/lib/images";
import { Link } from "@/lib/router";

const SERVICES = [
  { title: "Sourcing on request", body: "Tell us the spec, down to the stitching. Our network finds the car, often before it's listed anywhere." },
  { title: "Inspection pass", body: "Nothing reaches the lot until it clears our 172-point inspection, and the report is on every car's page." },
  { title: "Delivery", body: "Collect it in Medford, or we'll bring it to your driveway, anywhere in the lower 48." },
];

export function Atelier() {
  return (
    <section aria-labelledby="atelier-title" className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-36">
      <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="relative lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden">
            <CarImage
              source={unsplash(PHOTOS.slkBlackStreet)}
              alt="Black Mercedes-Benz SLK parked on a tree-lined street"
              aspect={4 / 5}
              focus={{ x: 0.45, y: 0.8, z: 1 }}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="parallax-image size-full"
            />
          </div>
          <Reveal
            delay={200}
            className="absolute -right-2 -bottom-10 w-[46%] border-8 border-ink shadow-2xl md:-right-10 lg:-right-16"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <CarImage
                source={unsplash(PHOTOS.slkSilverStudio)}
                alt="Front quarter of a silver Mercedes-Benz SLK roadster in low light"
                aspect={3 / 4}
                focus={{ x: 0.72, y: 0.6, z: 1 }}
                sizes="25vw"
                className="size-full"
              />
            </div>
          </Reveal>
          <p className="eyebrow absolute top-0 -left-7 rotate-180 text-[0.6rem] text-ivory/60 [writing-mode:vertical-rl] max-lg:hidden">
            SLK 55 AMG · Est. Medford, New York
          </p>
        </div>

        <div className="flex flex-col justify-center lg:col-span-5 lg:col-start-8">
          <Reveal>
            <p className="eyebrow flex items-center gap-4 text-champagne">
              <span className="h-px w-10 bg-champagne/50" />
              SLK 55 AMG
            </p>
            <h2 id="atelier-title" className="mt-6 font-display text-[clamp(2.6rem,5vw,4.8rem)] leading-[1.02]">
              We don't sell cars.
              <br />
              <em className="text-gilded">We place them.</em>
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-ivory/70">
              Every car in the collection was chosen by someone who would happily own it. We turn down far more cars than we
              buy, and we'd rather miss a sale than sell you the wrong car.
            </p>
          </Reveal>

          <ul className="mt-12 divide-y divide-line border-y border-line">
            {SERVICES.map((service, i) => (
              <Reveal as="li" key={service.title} delay={i * 90} className="group grid grid-cols-[3rem_1fr] gap-4 py-6">
                <span className="font-display text-lg text-champagne italic">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-2xl transition-colors group-hover:text-champagne-bright">{service.title}</h3>
                  <p className="mt-2 text-ivory/60">{service.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Link
            to="/concierge"
            className="eyebrow mt-10 inline-flex items-center gap-3 self-start text-ivory hover:text-champagne"
          >
            Meet the concierge <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
