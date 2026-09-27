import { useEffect, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { matchRoute, scrollToInitialHash, usePathname, type RouteParams } from "@/lib/router";
import { ConciergePage } from "@/pages/ConciergePage";
import { FinancePage } from "@/pages/FinancePage";
import { GaragePage } from "@/pages/GaragePage";
import { HomePage } from "@/pages/HomePage";
import { InventoryPage } from "@/pages/InventoryPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { VehiclePage } from "@/pages/VehiclePage";
import "./index.css";

type Route = { path: string; render: (params: RouteParams) => ReactNode };

const ROUTES: readonly Route[] = [
  { path: "/", render: () => <HomePage /> },
  { path: "/inventory", render: () => <InventoryPage /> },
  { path: "/vehicle/:id", render: params => <VehiclePage id={params.id ?? ""} /> },
  { path: "/finance", render: () => <FinancePage /> },
  { path: "/concierge", render: () => <ConciergePage /> },
  { path: "/garage", render: () => <GaragePage /> },
];

function renderRoute(pathname: string): ReactNode {
  for (const route of ROUTES) {
    const params = matchRoute(route.path, pathname);
    if (params) return route.render(params);
  }
  return <NotFoundPage />;
}

export function App() {
  const pathname = usePathname();
  useEffect(scrollToInitialHash, []);

  return (
    <>
      <a
        href="#main"
        className="eyebrow fixed top-3 left-3 z-[70] -translate-y-20 bg-champagne px-4 py-3 text-ink transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteHeader />
      {/* Opacity-only transition: a transform here would break position:fixed descendants. */}
      <main id="main" key={pathname} className="animate-page-in">
        <ErrorBoundary>{renderRoute(pathname)}</ErrorBoundary>
      </main>
      <SiteFooter />
    </>
  );
}
