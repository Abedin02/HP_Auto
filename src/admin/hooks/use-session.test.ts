import { describe, expect, test } from "bun:test";
import { isAdmin } from "./use-session";

describe("isAdmin", () => {
  test("returns true when app_metadata.role is exactly 'admin'", () => {
    expect(isAdmin({ user: { app_metadata: { role: "admin" } } })).toBe(true);
  });

  test("returns false when there is no session", () => {
    expect(isAdmin(null)).toBe(false);
  });

  test("returns false when the role is missing", () => {
    expect(isAdmin({ user: { app_metadata: {} } })).toBe(false);
  });

  test("returns false when app_metadata is missing", () => {
    expect(isAdmin({ user: {} })).toBe(false);
  });

  test("returns false when user is missing", () => {
    expect(isAdmin({})).toBe(false);
  });

  test("never trusts user_metadata for the admin role", () => {
    expect(isAdmin({ user: { app_metadata: {}, user_metadata: { role: "admin" } } })).toBe(false);
  });

  test("rejects roles that are merely admin-like", () => {
    expect(isAdmin({ user: { app_metadata: { role: "super-admin" } } })).toBe(false);
    expect(isAdmin({ user: { app_metadata: { role: "Admin" } } })).toBe(false);
  });
});
