import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { STATIC_DIR, UPLOADS_DIR } from "./lib/config";
import { revokeSessionsIfCredentialChanged } from "./lib/auth";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { metaForPath, renderMetaTags, robotsTxt, sitemapXml } from "./lib/seo";

// Strict by default — see the note in lib/auth.ts.
const IS_PRODUCTION = process.env["NODE_ENV"] !== "development";

const app: Express = express();

// Behind Railway/Render/cPanel the client address arrives in X-Forwarded-For.
// One hop only — trusting the whole chain would let a caller spoof its IP and
// walk around the login rate limiter.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

/* ── security headers ───────────────────────────────────────── */
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (IS_PRODUCTION) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

/* ── CORS ───────────────────────────────────────────────────────────────
 * The site and the API are served from one origin, so cross-origin requests
 * are not needed at all. Only origins named in ALLOWED_ORIGINS are allowed,
 * plus localhost during development. Reflecting arbitrary origins with
 * credentials is exactly how a hostile page reads an admin's data.
 * -------------------------------------------------------------------- */
const allowedOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Same-origin and server-to-server requests send no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (!IS_PRODUCTION && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* ── uploaded images ────────────────────────────────────────────────────
 * Uploads are already restricted to real image files, but they are served
 * with a locked-down CSP and no sniffing as a second line of defence: even
 * if something unexpected lands here, the browser will not execute it.
 * -------------------------------------------------------------------- */
app.use(
  "/api/uploads",
  (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  },
  express.static(UPLOADS_DIR, {
    dotfiles: "deny",
    index: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

app.use("/api", router);

/* ── the built site ─────────────────────────────────────────────────────
 * One service serves the site and the API from a single origin, which is
 * what makes SameSite cookies and a closed CORS policy enough.
 * -------------------------------------------------------------------- */
const indexHtml = path.join(STATIC_DIR, "index.html");

if (existsSync(indexHtml)) {
  const shell = readFileSync(indexHtml, "utf8");

  /* ── crawler-facing files ───────────────────────────────────────────── */
  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send(robotsTxt());
  });

  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(sitemapXml());
  });

  app.use(
    express.static(STATIC_DIR, {
      index: false,
      dotfiles: "ignore",
      setHeaders: (res, filePath) => {
        // Hashed asset filenames can be cached forever; everything else is
        // revalidated so a deploy is visible immediately.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  /* ── the app shell, with per-page metadata written in ───────────────── */
  app.get(/^\/(?!api\/).*/, (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();
    try {
      const meta = metaForPath(req.path);
      const html = shell.replace(
        /<!--seo-->[\s\S]*?<!--\/seo-->/,
        `<!--seo-->\n    ${renderMetaTags(meta)}\n    <!--/seo-->`,
      );
      res.type("html").set("Cache-Control", "no-cache").send(html);
    } catch (err) {
      logger.error({ err, path: req.path }, "Could not build page metadata");
      res.sendFile(indexHtml);
    }
  });
} else {
  logger.warn(
    { path: STATIC_DIR },
    "No built frontend found — serving the API only. Run `pnpm run build` first.",
  );
}

// Unknown API routes answer with JSON, not an HTML error page.
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

/* ── error handler ──────────────────────────────────────────────────────
 * Express's default handler returns the stack trace to the caller unless
 * NODE_ENV is production. This one never does, and logs it instead.
 * -------------------------------------------------------------------- */
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.url }, "Unhandled request error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Something went wrong" });
});

// If the admin password changed since last boot, drop existing sessions.
revokeSessionsIfCredentialChanged();

export default app;
