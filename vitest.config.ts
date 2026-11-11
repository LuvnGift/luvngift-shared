import { defineConfig } from 'vitest/config';

// Tests live outside src/ so they are never built into dist/ or published.
// Globals on, so suites ported from the apps' Jest runs need no rewriting.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], globals: true },
});
