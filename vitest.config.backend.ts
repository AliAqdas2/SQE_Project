import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: path.resolve(import.meta.dirname, "server", "test", "setup.ts"),
    include: ["server/test/**/*.test.ts"],
    globals: false,
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["server/**/*.ts"],
      exclude: [
        "server/test/**",
        "server/**/*.test.ts",
        "server/index.ts",
        "server/seed*.ts",
        "server/vite.ts",
        "server/routes.ts",
      ],
      reportsDirectory: "./coverage-backend",
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
});
