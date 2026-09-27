import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Link } from "@/lib/router";

export function NotFoundPage({ message = "This road doesn't lead anywhere." }: { message?: string }) {
  useDocumentTitle("Not found — HP Auto");
  return (
    <section className="relative flex min-h-[90svh] flex-col items-center justify-center overflow-hidden px-5 pt-20 text-center">
      <p aria-hidden className="text-outline pointer-events-none absolute font-display text-[40vw] leading-none italic select-none">
        404
      </p>
      <p className="eyebrow relative text-champagne">Wrong turn</p>
      <h1 className="relative mt-5 max-w-3xl font-display text-5xl leading-tight md:text-7xl">{message}</h1>
      <Button asChild variant="luxe" size="xl" className="relative mt-12">
        <Link to="/inventory">Return to the collection</Link>
      </Button>
    </section>
  );
}
