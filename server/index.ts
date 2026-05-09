import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedData, ensureDefaultPlatformAdmin } from "./seed";
import { startEmailScheduler } from "./emailScheduler";

const app = express();
const PgSession = connectPgSimple(session);

// Trust proxy for secure cookies behind reverse proxy (e.g., nginx, load balancer)
app.set('trust proxy', 1);

// Session configuration
app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "plegit-secret-key-change-in-production",
    resave: true, // Force save on every request to ensure cookie is set
    saveUninitialized: true, // Save uninitialized sessions to ensure cookie is created
    name: 'plegit.sid', // Explicit session cookie name
    cookie: {
      secure: false, // Disable secure for development (allows HTTP)
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax', // Use 'lax' for development (most permissive without requiring secure)
      path: '/', // Ensure cookie is available for all paths
    },
  })
);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
// Middleware to capture raw body for file uploads and Stripe webhooks before JSON parsing
app.use((req, res, next) => {
  // Capture raw body for file uploads
  if (req.method === 'PUT' && req.path === '/api/files/upload') {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      (req as any).rawBodyBuffer = Buffer.concat(chunks);
      next();
    });
    req.on('error', (err) => {
      next(err);
    });
  } 
  // Capture raw body for Stripe webhooks (must be before JSON parsing)
  else if (req.method === 'POST' && req.path === '/api/stripe-webhook') {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      (req as any).rawBody = Buffer.concat(chunks);
      next();
    });
    req.on('error', (err) => {
      next(err);
    });
  } else {
    next();
  }
});

// JSON parsing middleware - skip for webhook endpoint to preserve raw body
app.use((req, res, next) => {
  // Skip JSON parsing for Stripe webhook - we need the raw body for signature verification
  if (req.method === 'POST' && req.path === '/api/stripe-webhook') {
    return next();
  }
  // For all other routes, parse JSON
  express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
      // Store raw body for other endpoints that might need it
      (req as any).rawBody = buf;
  }
  })(req, res, next);
});
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure default platform admin exists
  await ensureDefaultPlatformAdmin();
  
  // Seed initial data for demo
  await seedData();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port
  }, () => {
    log(`serving on port ${port}`);
    
    // Start email scheduler for automated sending
    startEmailScheduler();
  });
})();
