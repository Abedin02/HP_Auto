import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/admin/lib/supabase";
import { Link } from "@/lib/router";

/** Persistent top bar for every authenticated admin screen. */
export function AdminHeader() {
  const handleSignOut = () => {
    void getSupabaseClient().auth.signOut();
  };

  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-5 md:px-10">
      <Link to="/admin" className="eyebrow text-champagne">
        HP Auto — Admin
      </Link>
      <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  );
}
