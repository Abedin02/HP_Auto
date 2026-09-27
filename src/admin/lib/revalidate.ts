/**
 * After every admin mutation we ask the Bun server to drop its 60s `/api/vehicles` cache
 * so the public site reflects the change immediately. This is best-effort: the cache
 * expires on its own, so a failure here should only surface as a small, non-blocking notice.
 */
const REVALIDATE_PATH = "/api/admin/revalidate";

export type RevalidateResult = { ok: true } | { ok: false; message: string };

export async function requestRevalidate(accessToken: string): Promise<RevalidateResult> {
  try {
    const response = await fetch(REVALIDATE_PATH, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return { ok: false, message: `Revalidate request failed (${response.status}).` };
    return { ok: true };
  } catch {
    return { ok: false, message: "Revalidate request failed — the change is saved, cache updates within 60s." };
  }
}

/** Fire-and-forget: never blocks the caller's mutation flow, only reports failures. */
export function fireRevalidate(accessToken: string, onFailure: (message: string) => void): void {
  void requestRevalidate(accessToken).then(result => {
    if (!result.ok) onFailure(result.message);
  });
}
