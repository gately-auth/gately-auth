import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    pool: "forks",
    include: ["packages/*/src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/__tests__/**", "**/dist/**", "**/node_modules/**"],
    },
  },
  resolve: {
    // Resolve .js imports to .ts source files (TypeScript ESM convention)
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
    conditions: ["node", "import", "default"],
  },
});
