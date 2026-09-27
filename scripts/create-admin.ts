/**
 * Creates (or promotes) the single HP Auto admin user via the Supabase service-role key.
 * This is the ONLY place in the codebase that uses SUPABASE_SECRET_KEY — never the server,
 * never the browser. Run with `bun run create-admin -- --email you@example.com --password '...'`.
 *
 * Interactive prompts are intentionally not supported: args or env vars only, so this can
 * run non-interactively (CI, scripts) without a password ever being echoed to a prompt.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Args = { email: string; password: string };

function readFlag(argv: string[], name: string): string | undefined {
  const flag = `--${name}`;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === flag) return argv[i + 1];
    if (arg?.startsWith(`${flag}=`)) return arg.slice(flag.length + 1);
  }
  return undefined;
}

function parseArgs(argv: string[]): Args {
  const email = readFlag(argv, "email") ?? process.env.CREATE_ADMIN_EMAIL;
  const password = readFlag(argv, "password") ?? process.env.CREATE_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Usage: bun run create-admin -- --email you@example.com --password 'a-strong-password'\n" +
        "(or set CREATE_ADMIN_EMAIL / CREATE_ADMIN_PASSWORD). Interactive prompts are not supported.",
    );
    process.exit(1);
  }
  return { email, password };
}

async function findUserIdByEmail(client: SupabaseClient, email: string): Promise<string | undefined> {
  const target = email.trim().toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < perPage) return undefined;
  }
  return undefined;
}

async function main(): Promise<void> {
  const { email, password } = parseArgs(process.argv.slice(2));

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    console.error("SUPABASE_URL and SUPABASE_SECRET_KEY must both be set.");
    process.exit(1);
  }

  const client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const created = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });

  if (!created.error) {
    console.info(`[create-admin] created admin user ${email}.`);
    return;
  }

  const alreadyExists = /already.*registered|already.*exists/i.test(created.error.message);
  if (!alreadyExists) {
    console.error(`[create-admin] failed to create user: ${created.error.message}`);
    process.exit(1);
  }

  const existingId = await findUserIdByEmail(client, email);
  if (!existingId) {
    console.error("[create-admin] user reported as existing but could not be found by email.");
    process.exit(1);
  }

  const updated = await client.auth.admin.updateUserById(existingId, {
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });
  if (updated.error) {
    console.error(`[create-admin] failed to update existing user: ${updated.error.message}`);
    process.exit(1);
  }

  console.info(`[create-admin] updated existing user ${email} to admin.`);
}

await main();
