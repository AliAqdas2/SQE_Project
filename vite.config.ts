import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import type { Plugin } from "vite";

// Security plugin to validate and sanitize requests (prevents ZAP attacks)
function securityValidationPlugin(): Plugin {
  return {
    name: "security-validation",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        
        // Decode URL to catch encoded attacks
        let decodedUrl = url;
        try {
          decodedUrl = decodeURIComponent(url);
        } catch (e) {
          // Invalid URL encoding
          console.warn(`[Security] Blocked malformed request: ${url}`);
          res.statusCode = 400;
          res.end("Bad Request");
          return;
        }

        // Suspicious patterns to block
        const suspiciousPatterns = [
          // File extensions that shouldn't be loaded (excluding sitemap.xml and robots.txt)
          /\.(ini|conf|config|env|log|bak|old|tmp|swp|properties|yaml|yml)(\?|$|%)/i,
          /web\.xml/i, // Block web.xml specifically
          // Path traversal
          /\.\.\//g,
          /\.\.%2[fF]/g,
          /\.\.%5[cC]/g,
          // Absolute paths (Windows)
          /[cC]:(\/|\\|%2[fF]|%5[cC])/g,
          // Absolute paths (Unix)
          /\/etc\//i,
          /\/proc\//i,
          /\/sys\//i,
          /\/dev\//i,
          /\/var\//i,
          /\/boot\//i,
          // Specific files
          /system\.ini/i,
          /boot\.ini/i,
          /passwd/i,
          /\.htaccess/i,
          /\.git/i,
          /\.env/i,
          // Java/Web paths
          /WEB-INF/i,
          /META-INF/i,
        ];

        // Check if URL contains suspicious patterns
        const isSuspicious = suspiciousPatterns.some(pattern => 
          pattern.test(url) || pattern.test(decodedUrl)
        );
        
        // Allow legitimate SEO and static files
        const allowedPaths = [
          /^\/sitemap\.xml$/i,
          /^\/robots\.txt$/i,
          /^\/favicon\.ico$/i,
        ];
        
        const isAllowedPath = allowedPaths.some(pattern => pattern.test(url.split('?')[0]));
        if (isAllowedPath) {
          next();
          return;
        }
        
        // Additional check: validate query parameter 'v' specifically
        if (url.includes("?v=") || url.includes("&v=")) {
          const vParamMatch = url.match(/[?&]v=([^&]*)/);
          if (vParamMatch) {
            const vValue = vParamMatch[1];
            // 'v' should only contain alphanumeric, dash, underscore, or be empty
            if (!/^[a-zA-Z0-9_-]*$/.test(vValue)) {
              console.warn(`[Security] Blocked suspicious 'v' parameter: ${url}`);
              res.statusCode = 400;
              res.end("Bad Request: Invalid version parameter");
              return;
            }
          }
        }
        
        if (isSuspicious) {
          console.warn(`[Security] Blocked suspicious request: ${url}`);
          res.statusCode = 400;
          res.end("Bad Request: Invalid file path");
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    securityValidationPlugin(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: [
        "**/.*",
        "**/*.env",
        "**/*.ini",
        "**/*.conf",
        "**/*.config",
        "**/node_modules/**/.env*",
      ],
      allow: [
        path.resolve(import.meta.dirname, "client"),
        path.resolve(import.meta.dirname, "shared"),
        path.resolve(import.meta.dirname, "attached_assets"),
      ],
    },
    // Additional security headers
    cors: true,
    hmr: {
      overlay: true,
    },
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
  test: {
    environment: "jsdom",
    setupFiles: path.resolve(import.meta.dirname, "client", "src", "test", "setup.ts"),
    /** Paths are relative to `root` (`client/`). */
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/**/*.d.ts",
      ],
    },
  },
});
