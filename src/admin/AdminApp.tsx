import { useEffect, type ReactNode } from "react";
import { AuthGuard } from "@/admin/components/AuthGuard";
import { SupabaseSetupNotice } from "@/admin/components/SupabaseSetupNotice";
import { isSupabaseConfigured } from "@/admin/lib/supabase";
import { VehicleEditorPage } from "@/admin/pages/VehicleEditorPage";
import { VehicleListPage } from "@/admin/pages/VehicleListPage";
import { matchRoute, scrollToInitialHash, usePathname, type RouteParams } from "@/lib/router";
import "@/index.css";

type Route = { path: string; render: (params: RouteParams) => ReactNode };

/**
 * Protected routes only — `/admin/login` is handled directly inside `AuthGuard` (it needs
 * different logic: redirect away when already an authenticated admin, not a session check).
 */
const ROUTES: readonly Route[] = [
  { path: "/admin", render: () => <VehicleListPage /> },
  // Keys force a remount (fresh state) when navigating between "new" and different "edit" ids.
  { path: "/admin/vehicles/new", render: () => <VehicleEditorPage key="new" mode="new" /> },
  {
    path: "/admin/vehicles/:id",
    render: params => <VehicleEditorPage key={params.id ?? ""} mode="edit" id={params.id ?? ""} />,
  },
];

function renderRoute(pathname: string): ReactNode {
  for (const route of ROUTES) {
    const params = matchRoute(route.path, pathname);
    if (params) return route.render(params);
  }
  return <p className="p-10 text-muted-foreground">Not found.</p>;
}

export function AdminApp() {
  const pathname = usePathname();
  useEffect(scrollToInitialHash, []);

  if (!isSupabaseConfigured) return <SupabaseSetupNotice />;

  return <AuthGuard pathname={pathname}>{renderRoute(pathname)}</AuthGuard>;
}
