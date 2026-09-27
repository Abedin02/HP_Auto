import { Atelier } from "@/components/home/Atelier";
import { CharacterBento } from "@/components/home/CharacterBento";
import { Hero } from "@/components/home/Hero";
import { MarqueMarquee } from "@/components/home/MarqueMarquee";
import { QuickSearch } from "@/components/home/QuickSearch";
import { ShowroomRail } from "@/components/home/ShowroomRail";
import { Testimonials } from "@/components/home/Testimonials";
import { TheStandard } from "@/components/home/TheStandard";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function HomePage() {
  useDocumentTitle("HP Auto — The Collection");
  return (
    <>
      <Hero />
      <QuickSearch />
      <ShowroomRail />
      <MarqueMarquee />
      <CharacterBento />
      <TheStandard />
      <Atelier />
      <Testimonials />
    </>
  );
}
