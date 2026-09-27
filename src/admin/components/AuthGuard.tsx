import { useEffect, type ReactNode } from "react";
import { AdminHeader } from "@/admin/components/AdminHeader";
import { LoadingScreen } from "@/admin/components/LoadingScreen";
import { NotAuthorisedScreen } from "@/admin/components/NotAuthorisedScreen";
import { isAdmin, useSession } from "@/admin/hooks/use-session";
import { LoginPage } from "@/admin/pages/LoginPage";
import { navigate } from "@/lib/router";

const LOGIN_PATH = "/admin/login";

type AuthGuardProps = { pathname: string; children: ReactNode };

/**
 * Single gate for every /admin/* route: redirects unauthenticated visitors to
 * /admin/login, redirects already-signed-in admins away from /admin/login, and
 * shows "Not authorised" for a session that isn't an admin.
 */
export function AuthGuard({ pathname, children }: AuthGuardProps) {
  const { session, loading } = useSession();
  const isLoginRoute = pathname === LOGIN_PATH;
  const admin = isAdmin(session);

  useEffect(() => {
    if (loading) return;
    if (isLoginRoute) {
      if (session && admin) navigate("/admin", { replace: true });
      return;
    }
    if (!session) navigate(LOGIN_PATH, { replace: true });
  }, [loading, isLoginRoute, session, admin]);

  if (loading) return <LoadingScreen />;

  if (isLoginRoute) {
    // Redirect is in flight; render nothing so the login form doesn't flash.
    if (session && admin) return null;
    return <LoginPage />;
  }

  if (!session) return null;
  if (!admin) return <NotAuthorisedScreen />;

  return (
    <>
      <AdminHeader />
      <main id="admin-main" className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        {children}
      </main>
    </>
  );
}
