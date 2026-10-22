import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

// Load .env in development (server needs the API key for the TMDB proxy)
if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;

const app = express();

// --- TMDB proxy: keeps the API key on the server ---
app.all("/api/tmdb/*", async (req, res) => {
  try {
    const target = new URL("https://api.themoviedb.org/3" + req.path.replace(/^\/api\/tmdb/, ""));
    Object.entries(req.query || {}).forEach(([key, value]) => {
      target.searchParams.set(key, Array.isArray(value) ? value[0] : value);
    });
    const key = process.env.TMDB_API_KEY || process.env.REACT_APP_TMDB_API_KEY;
    if (key) target.searchParams.set("api_key", key);
    if (!target.searchParams.has("language")) target.searchParams.set("language", "en-US");

    const upstream = await fetch(target.toString(), {
      method: req.method,
      headers: { accept: "application/json" },
    });
    const body = await upstream.text();
    res.status(upstream.status)
      .set("content-type", upstream.headers.get("content-type") || "application/json")
      .send(body);
  } catch (error) {
    res.status(502).json({ message: error?.message || "Upstream error" });
  }
});

if (isProd) {
  // --- Production: serve built assets + SSR-rendered HTML ---
  const clientDir = path.join(root, "dist", "client");
  app.use(express.static(clientDir, { index: false }));

  const { render } = await import("../dist/server/entry-server.js");

  app.get("*", async (req, res) => {
    try {
      const { html, styles, state } = await render(req.originalUrl);
      const template = fs.readFileSync(path.join(clientDir, "index.html"), "utf-8");
      const page = template
        .replace("<!--ssr-styles-->", styles)
        .replace("<!--ssr-outlet-->", html)
        .replace("</head>", `<script>window.__REACT_QUERY_STATE__=${state};</script></head>`);
      res.type("html").send(page);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  });
} else {
  // --- Development: Vite dev server, client-side rendering only ---
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom" });
  app.use(vite.middlewares);

  app.get("*", async (req, res) => {
    try {
      const template = await vite.transformIndexHtml(
        req.originalUrl,
        fs.readFileSync(path.join(root, "index.html"), "utf-8")
      );
      res.type("html").send(template.replace("<!--ssr-styles-->", "").replace("<!--ssr-outlet-->", ""));
    } catch (error) {
      vite.ssrFixStacktrace(error);
      console.error(error);
      res.status(500).send(String(error));
    }
  });
}

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
