import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { SHOWROOM_EMAIL, SHOWROOM_PHONE, SHOWROOMS, telHref } from "@/lib/contact";
import { Link } from "@/lib/router";
import { NAV_LINKS } from "./nav-links";

export function SiteFooter() {
  return (
    <footer data-site-footer className="border-t border-line bg-ink">
      <div className="mx-auto grid max-w-[1600px] gap-14 px-5 py-20 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <p className="eyebrow text-champagne">Visit or call</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-5xl">
            Come see the collection
            <br />
            <em className="text-gilded">in person.</em>
          </h2>
          <ul className="mt-8 space-y-4">
            <li>
              <a
                href={telHref(SHOWROOM_PHONE)}
                className="inline-flex items-center gap-3 text-lg text-ivory/85 transition-colors hover:text-champagne-bright"
              >
                <Phone className="size-4 text-champagne" strokeWidth={1.5} /> {SHOWROOM_PHONE}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${SHOWROOM_EMAIL}`}
                className="inline-flex items-center gap-3 text-lg text-ivory/85 transition-colors hover:text-champagne-bright"
              >
                <Mail className="size-4 text-champagne" strokeWidth={1.5} /> {SHOWROOM_EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 md:col-span-6 md:col-start-7">
          <div>
            <p className="eyebrow mb-5 text-mist">Explore</p>
            <ul className="space-y-3">
              {NAV_LINKS.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-ivory/80 transition-colors hover:text-champagne-bright">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/garage" className="text-ivory/80 transition-colors hover:text-champagne-bright">
                  My Garage
                </Link>
              </li>
            </ul>
          </div>
          {SHOWROOMS.map(showroom => (
            <div key={showroom.city}>
              <p className="eyebrow mb-5 text-mist">{showroom.city}</p>
              <p className="text-ivory/80">{showroom.name}</p>
              <p className="mt-1 text-ivory/50">{showroom.hours}</p>
              <a
                href={showroom.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm text-champagne hover:text-champagne-bright"
              >
                Get directions <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 border-t border-line px-5 py-6 text-xs text-ivory/45 md:flex-row md:justify-between md:px-10">
        <p>© {new Date().getFullYear()} HP Auto. Independent dealer. Not affiliated with any manufacturer.</p>
        <p>
          Concierge · <span className="text-ivory/70">{SHOWROOM_PHONE}</span>
        </p>
      </div>
    </footer>
  );
}
