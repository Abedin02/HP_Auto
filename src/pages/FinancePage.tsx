import { Mail, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { FinanceCalculator } from "@/components/finance/FinanceCalculator";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { CarImage } from "@/components/vehicle/CarImage";
import { PHOTOS } from "@/data/photos";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { SHOWROOM_EMAIL, SHOWROOM_PHONE, telHref } from "@/lib/contact";
import { unsplash } from "@/lib/images";

const OPTIONS = [
  { title: "Finance", body: "Terms from 36 to 84 months, with rates from lenders who specialise in getting the best deals." },
  {
    title: "Trade-in",
    body: "Bring your current car in for a free appraisal. You get a written offer, and its value comes straight off the price.",
  },
  {
    title: "Protection plans",
    body: "Extended service contracts, GAP cover and tire & wheel protection, arranged when you sign. Always optional.",
  },
];

const FAQ = [
  {
    q: "Can I get finance with less-than-perfect credit?",
    a: "Often, yes. We work with several lenders, including ones who help first-time buyers and people rebuilding their credit. The finance desk finds the best rate you qualify for.",
  },
  {
    q: "Do you work with out-of-state buyers?",
    a: "Yes, in all 48 contiguous states. Registration and taxes are handled for you and included in the delivery.",
  },
  {
    q: "How do I lock in real terms?",
    a: "Call or email the finance desk with the car you have in mind. A specialist takes it from there — no forms, no online application.",
  },
];

export function FinancePage() {
  useDocumentTitle("Finance — HP Auto");
  const [price, setPrice] = useState(150_000);

  return (
    <>
      <header className="relative flex min-h-[80svh] items-end overflow-hidden">
        <CarImage
          source={unsplash(PHOTOS.porscheGtsProfile)}
          alt="White Porsche 911 Carrera 4 GTS in profile against a white studio wall"
          priority
          className="animate-kenburns absolute inset-0 size-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10" />
        <div className="relative mx-auto w-full max-w-[1600px] px-5 pt-40 pb-20 md:px-10">
          <p className="eyebrow animate-fade-up text-champagne">Finance & trade-ins</p>
          <h1 className="animate-fade-up mt-5 max-w-3xl font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] [animation-delay:120ms]">
            Finance for the car, <em className="text-gilded">not the paperwork.</em>
          </h1>
          <p className="animate-fade-up mt-8 max-w-xl text-lg text-ivory/75 [animation-delay:240ms]">
            Work out your monthly payment below, then call or email the finance desk for terms from lenders who
            understand collector cars. Sign it all from your phone.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" aria-labelledby="calc-title">
        <SectionHeading index="01" eyebrow="Calculator" title={<span id="calc-title">Work out your monthly payment.</span>} />
        <FinanceCalculator price={price} onPriceChange={setPrice} className="mt-14" />
      </section>

      <section className="border-y border-line bg-surface/40" aria-label="Ways to own">
        <ul className="mx-auto grid max-w-[1600px] gap-px bg-line md:grid-cols-3">
          {OPTIONS.map((option, i) => (
            <Reveal as="li" key={option.title} delay={i * 100} className="bg-ink p-10 md:p-14">
              <p className="font-display text-sm text-champagne italic">0{i + 1}</p>
              <h2 className="mt-6 font-display text-4xl">{option.title}</h2>
              <p className="mt-4 leading-relaxed text-ivory/65">{option.body}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-16 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-2" aria-labelledby="talk-title">
        <div>
          <SectionHeading index="02" eyebrow="Get in touch" title={<span id="talk-title">Talk to the finance desk.</span>} />
          <div className="mt-12 space-y-6">
            <p className="max-w-md text-ivory/65">
              No application forms — a specialist puts terms together once they know the car and your budget.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="luxe" size="xl">
                <a href={telHref(SHOWROOM_PHONE)}>
                  <Phone className="size-4" /> Call the finance desk
                </a>
              </Button>
              <Button asChild variant="luxe-outline" size="xl" className="text-ivory">
                <a href={`mailto:${SHOWROOM_EMAIL}`}>
                  <Mail className="size-4" /> Email us
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div>
          <p className="eyebrow text-mist">Questions</p>
          <ul className="mt-6 border-t border-line">
            {FAQ.map(item => (
              <li key={item.q} className="border-b border-line">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-2xl [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus className="size-5 shrink-0 text-champagne transition-transform duration-500 group-open:rotate-45" />
                  </summary>
                  <p className="pb-6 leading-relaxed text-ivory/65">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
