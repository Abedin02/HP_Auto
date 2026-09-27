import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/admin/lib/supabase";

/** A session exists but the JWT's app_metadata.role is not "admin". */
export function NotAuthorisedScreen() {
  const handleSignOut = () => {
    void getSupabaseClient().auth.signOut();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="eyebrow text-champagne">Access denied</p>
      <h1 className="font-display text-3xl">Not authorised</h1>
      <p className="text-muted-foreground">
        This account is signed in but does not have admin access to the HP Auto inventory.
      </p>
      <Button type="button" variant="luxe-outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
