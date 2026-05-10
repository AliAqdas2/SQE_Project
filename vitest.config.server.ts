import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    setupFiles: path.resolve(import.meta.dirname, "server", "test", "setup.ts"),
    include: ["server/test/**/*.test.ts"],
    globals: false,
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "server/analytics.ts",
        "server/memberCount.ts",
        "server/objectAcl.ts",
        "server/stripeConfig.ts",
        "server/emailSender.ts",
      ],
      exclude: [
        "server/test/**",
        "server/**/*.test.ts",
        "server/seed*.ts",
        "server/index.ts",
        "server/vite.ts",
      ],
      reportsDirectory: "./coverage-server",
    },
  },
});
