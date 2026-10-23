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
const streamForPeople = process.env.SSR_STREAMING !== "false";

const BOT_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|embedly|pinterest|redditbot|discordbot|semrush|ahrefs|mj12bot|petalbot|gptbot|claudebot|perplexity/i;

const isBot = (userAgent) => BOT_PATTERN.test(userAgent || "");

const app = express();

// --- TMDB proxy: keeps the API key on the server ---
app.all("/api/tmdb/*", async (req, res) => {
  try {
    const target = new URL(
      "https://api.themoviedb.org/3" + req.path.replace(/^\/api\/tmdb/, "")
    );
    Object.entries(req.query || {}).forEach(([key, value]) => {
      target.searchParams.set(key, Array.isArray(value) ? value[0] : value);
    });
    const key = process.env.TMDB_API_KEY || process.env.REACT_APP_TMDB_API_KEY;
    if (key) target.searchParams.set("api_key", key);
    if (!target.searchParams.has("language")) {
      target.searchParams.set("language", "en-US");
    }

    const upstream = await fetch(target.toString(), {
      method: req.method,
      headers: { accept: "application/json" },
    });
    const body = await upstream.text();
    res
      .status(upstream.status)
      .set("content-type", upstream.headers.get("content-type") || "application/json")
      .send(body);
  } catch (error) {
    res.status(502).json({ message: error?.message || "Upstream error" });
  }
});

function stateScript(state) {
  return `<script>window.__REACT_QUERY_STATE__=${state};</script>`;
}

async function sendPage(req, res, template, renderStream) {
  const [head, tail] = template.split("<!--ssr-outlet-->");
  const [beforeState, afterState = ""] = tail.split("<!--ssr-state-->");

  renderStream(req.originalUrl, {
    waitForAllReady: !streamForPeople || isBot(req.headers["user-agent"]),
    onReady({ styles, stream, getState, abort }) {
      res.status(200).set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        Vary: "User-Agent",
      });

      res.write(head.replace("<!--ssr-styles-->", styles));

      res.on("close", () => {
        if (!res.writableEnded) abort();
      });

      stream.on("error", (error) => {
        console.error("SSR stream error:", error);
        if (!res.writableEnded) res.end();
      });

      stream.on("end", () => {
        if (res.writableEnded) return;

        let state = "{}";
        try {
          state = getState();
        } catch (error) {
          console.error("Could not serialize query state:", error);
        }

        res.end(`</div>${beforeState}${stateScript(state)}${afterState}`);
      });

      stream.pipe(res, { end: false });
    },
    onShellError(error) {
      console.error("SSR shell error:", error);
      if (!res.headersSent) res.status(500).send("Server error");
    },
  });
}

if (isProd) {
  // --- Production: serve built assets + streamed HTML ---
  const clientDir = path.join(root, "dist", "client");
  app.use(express.static(clientDir, { index: false }));

  const entry = await import("../dist/server/entry-server.js");
  const template = fs.readFileSync(path.join(clientDir, "index.html"), "utf-8");

  app.get("*", async (req, res) => {
    try {
      await sendPage(req, res, template, entry.renderStream);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) res.status(500).send("Server error");
    }
  });
} else {
  // --- Development: Vite middleware + on-the-fly SSR ---
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.get("*", async (req, res) => {
    try {
      const template = await vite.transformIndexHtml(
        req.originalUrl,
        fs.readFileSync(path.join(root, "index.html"), "utf-8")
      );
      const entry = await vite.ssrLoadModule("/server/entry-server.jsx");

      await sendPage(req, res, template, entry.renderStream);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      console.error(error);
      if (!res.headersSent) res.status(500).send(String(error));
    }
  });
}

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
