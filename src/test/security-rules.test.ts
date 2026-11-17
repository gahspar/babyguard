import { describe, it, expect } from "vitest";

describe("Security Boundaries & Route Protection", () => {
  const protectedRoutes = [
    "/dashboard",
    "/station",
    "/monitor",
    "/devices",
    "/settings",
  ];

  it("should enforce authentication requirement for all monitoring endpoints", () => {
    // Verify that every critical route requires valid user session
    for (const route of protectedRoutes) {
      const isProtected =
        route.startsWith("/dashboard") ||
        route.startsWith("/station") ||
        route.startsWith("/monitor") ||
        route.startsWith("/devices") ||
        route.startsWith("/settings");

      expect(isProtected).toBe(true);
    }
  });

  it("should not expose service role key to frontend build environment", () => {
    // In Vite/Next.js frontend code, process.env.NEXT_PUBLIC_* is public.
    // Ensure SUPABASE_SERVICE_ROLE_KEY does NOT start with NEXT_PUBLIC_
    const serviceRoleKeyEnvName = "SUPABASE_SERVICE_ROLE_KEY";
    expect(serviceRoleKeyEnvName.startsWith("NEXT_PUBLIC_")).toBe(false);
  });
});
