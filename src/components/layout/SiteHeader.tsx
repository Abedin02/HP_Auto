import { Heart, Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGarage } from "@/hooks/use-garage";
import { useScrolled } from "@/hooks/use-scrolled";
import { SHOWROOM_PHONE, telHref } from "@/lib/contact";
import { Link, usePathname } from "@/lib/router";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./MobileMenu";
import { NAV_LINKS } from "./nav-links";
import { Wordmark } from "./Wordmark";

const SCROLL_THRESHOLD = 40;

export function SiteHeader() {
  const pathname = usePathname();
  const isScrolled = useScrolled(SCROLL_THRESHOLD);
  const { ids } = useGarage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => setIsMenuOpen(false), [pathname]);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <>
      <header
        data-site-header
        className={cn(
          "fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-[background-color,border-color,backdrop-filter] duration-700 ease-(--ease-luxe)",
          isScrolled || isMenuOpen
            ? "border-b border-line bg-ink/75 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-ink/70 to-transparent",
        )}
      >
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-6 px-5 md:px-10">
          <Wordmark />

          <nav aria-label="Main navigation" className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {NAV_LINKS.map(link => {
                const isActive = pathname.startsWith(link.to);
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "eyebrow relative py-2 text-[0.66rem] transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-champagne after:transition-transform after:duration-500 after:ease-(--ease-luxe) hover:text-ivory",
                        isActive ? "text-ivory after:scale-x-100" : "text-ivory/65 after:scale-x-0 hover:after:scale-x-100",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="/garage"
              aria-label={`My garage, ${ids.length} saved`}
              className="relative grid size-11 place-items-center rounded-full text-ivory/80 transition-colors hover:bg-ivory/5 hover:text-ivory"
            >
              <Heart className="size-[18px]" strokeWidth={1.5} />
              {ids.length > 0 && (
                <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-champagne text-[0.6rem] font-bold text-ink">
                  {ids.length}
                </span>
              )}
            </Link>
            <Button asChild variant="luxe" className="hidden h-11 px-6 md:inline-flex">
              <a href={telHref(SHOWROOM_PHONE)} aria-label={`Call the showroom, ${SHOWROOM_PHONE}`}>
                Call · {SHOWROOM_PHONE}
              </a>
            </Button>
            <button
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(open => !open)}
              className="grid size-11 place-items-center rounded-full text-ivory transition-colors hover:bg-ivory/5 lg:hidden"
            >
              {isMenuOpen ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>
      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  );
}
