import { defineConfig } from "vitest/config";

// Standalone Vitest config for signed-URL access tests. Kept out of the
// default `bun run test` include glob so laptops without Lovable Cloud
// credentials are not forced to skip the suite on every run. CI invokes
// this explicitly via `bun run test:signed-urls`.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["supabase/tests/signed-urls/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
