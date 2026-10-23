# SSR Streaming Explained (For a Complete Beginner)

This document explains how we turned `tmovies` from a normal Create React App (client-only) into a **Vite + Express** app that does **Server-Side Rendering (SSR) with streaming**.

The goal is to make it easy to understand: what changed, why, and how the pieces fit together.

---

## 1. What is SSR and "streaming SSR"?

- **Client-Side Rendering (CSR)**: The browser downloads an empty HTML file and a big JavaScript bundle. React runs in the browser, fetches data, and builds the page there.
- **Server-Side Rendering (SSR)**: The server runs React for you, builds HTML on the server, and sends that HTML to the browser. The browser can show something useful faster.
- **Streaming SSR**: Instead of waiting for the *entire* page to be ready on the server, the server sends parts of the page as soon as they are ready.

Think of it like this:

- **Old way (CSR)**: You order a pizza, and the shop only gives you the box once it's *fully* baked.
- **SSR (non-streaming)**: The shop pre-bakes the whole pizza at the restaurant and gives you the full box right away.
- **Streaming SSR**: The shop starts handing you slices as soon as they finish baking. You can eat the crust/slices while the rest is still in the oven. This feels faster to the user.

---

## 2. Big Picture: Before vs After

| Part | Before (CRA) | After (Vite + Express SSR) |
|---|---|---|
| **How app runs** | `react-scripts start/build` | `node server.js` runs an Express server. Vite handles dev, or prebuilt files handle prod. |
| **Where React renders** | Only in the browser (`createRoot`) | **On the server first** (to produce HTML), then **hydrated in the browser** (`hydrateRoot`). |
| **Data fetching** | Mixed (some effects) | **Suspense-first**. We use `useSuspenseQuery` so React knows "this part is not ready yet". |
| **Styling (MUI + Emotion)** | Emotion adds `<style>` tags in the browser/React tree | On the server, we collect all Emotion CSS and inject it into the `<head>` at the right time so styles load before content appears. |
| **Routing** | `BrowserRouter` | On server: `StaticRouter`. On client: `BrowserRouter` (via Vite entry). |
| **Caching data** | Client QueryClient only | **New QueryClient per request** on the server (so users don't share data). State is sent to the browser as `window.__REACT_QUERY_STATE__`. |

---

## 3. File Map (What does what?)

| File | Purpose | Beginner Explanation |
|---|---|---|
| `server.js` | Entry point | Just imports `server/index.js`. Like `index.js` but for the server. |
| `server/index.js` | Express server | Handles requests. Decides "is this a bot?" or "normal user?". Runs dev mode with Vite, or prod with built files. Proxies TMDB calls. |
| `server/entry-server.jsx` | Server renderer | Uses `renderToPipeableStream` to render our React app on the server. Creates a fresh QueryClient + Emotion cache per request. |
| `server/emotionStream.js` | CSS injector during stream | The "magic" file. Watches React's stream and inserts MUI/Emotion CSS right before React shows hidden content. |
| `src/entry-client.jsx` | Browser entry | If server sent HTML, it "hydrates" (attaches React to existing HTML). If not, it just mounts from scratch. |
| `src/AppProviders.jsx` | Shared providers | Puts everything React needs (Theme, CSS reset, React Query, Emotion cache) in one place. Used by BOTH server and client. |
| `src/createQueryClient.js` | QueryClient factory | Makes a QueryClient. On server, retries are off (fail faster). On client, normal retries. |
| `src/createEmotionCache.js` | Emotion cache factory | Creates the cache Emotion uses to track CSS. |
| `index.html` | HTML shell | Has 3 placeholders: `<!--ssr-styles-->`, `<!--ssr-outlet-->`, `<!--ssr-state-->`. Server fills them in. |

---

## 4. Step by Step: What Happens When You Visit a Page

Let's trace a normal visit to `http://localhost:5173/`

### Step 1: Express receives the request
In `server/index.js`:

1. Check User-Agent against `BOT_PATTERN`. 
   - If it's a bot (Googlebot etc) -> we want **full HTML now** (`onAllReady`)
   - If it's a human -> we want to **stream quickly** (`onShellReady`)
2. Load the HTML template (`index.html`)
3. Call `sendPage(req, res, template, entry.renderStream)`

### Step 2: Server prepares to render React
In `server/entry-server.jsx` -> `renderStream()`:

1. **New QueryClient** - fresh for this request only
2. **New Emotion cache** - tracks CSS used
3. **`createEmotionServer(emotionCache)`** - tells Emotion "don't dump style tags into the React output, I'll handle them"
4. **Call `renderToPipeableStream()`** - React starts rendering our app as a stream

Our app is wrapped like this:
```jsx
<AppProviders queryClient={queryClient} emotionCache={emotionCache}>
  <StaticRouter location={url}>
    <App />
  </StaticRouter>
</AppProviders>
```

- `StaticRouter` is the server version of `BrowserRouter` (no browser history)
- `AppProviders` gives the same theme/query/emotion setup as client

### Step 3: Decide when to start streaming
`renderToPipeableStream` gives us hooks:

- `onShellReady` - "The basic layout is ready (header, etc). Suspense parts might still be loading."
- `onAllReady` - "Everything is done including all Suspense fallbacks resolved."

```js
reactStream = renderToPipeableStream(renderApp(...), {
  onShellReady() {
    if (!options.waitForAllReady) start(); // normal user
  },
  onAllReady() {
    if (options.waitForAllReady) start(); // bot
  },
  ...
});
```

So humans see the shell faster. Bots get the complete page.

### Step 4: Start sending HTML
In `start()`:

1. Look at `emotionCache.inserted` (CSS collected so far)
2. Run `buildStyleTags()` to turn them into real `<style>` tags
3. Create `createEmotionStream()` (our CSS transformer)
4. Call `onReady({ styles, stream, getState, abort })`
5. Pipe: `reactStream` -> `emotionStream` -> `res`

In `sendPage()`:

1. Split template: `head + <!--ssr-outlet--> + tail`
2. Write `head` with `<!--ssr-styles-->` replaced by shell CSS
3. Pipe the transformed stream to response
4. On stream end: get React Query state with `dehydrate()`, escape `<` to avoid XSS, add `<script>window.__REACT_QUERY_STATE__=...</script>`, write rest of HTML

---

## 5. The CSS Streaming Trick (Most Important Part)

This is the hardest part to understand. Here's why it exists:

**Problem:** MUI uses Emotion. Emotion needs to know which CSS rules to apply. If we don't put CSS in `<head>` before the elements appear, we get a flash of unstyled content (FOUC). Also, React needs to know the CSS matches on both server and client (hydration).

**Old CSR way:** Emotion injects `<style>` tags as components render. That doesn't work well for streaming HTML.

**Our solution:** Tell Emotion `compat = true` (so it won't write styles into the React tree). Instead, we watch the HTML stream and insert styles ourselves at the right moment.

### How `server/emotionStream.js` works

React's streaming output for Suspense looks like this (simplified):

```html
<!-- hidden content that isn't ready yet -->
<div hidden id="S:0">...</div>
<!-- script that will reveal it -->
<script>$RC("B:0","S:0")</script>
```

Or if an error happens:
```html
<script>$RX("B:1","S:1")</script>
```

Our transformer does this:

1. **Buffer chunks** - We read from React in pieces (streams come in chunks)
2. **Find reveal markers** - Look for `$RC(` or `$RX(` using `revealIndex()`
3. **Don't cut scripts in half** - If a reveal script is split across chunks, wait until we see the full `<script>...</script>`
4. **Find new CSS** - `flushStyles()` checks `cache.inserted` for CSS IDs we haven't sent yet
5. **Inject before reveal** - Push all HTML up to the reveal script, then push our style-injecting script, then push the reveal script
6. **Self-removing** - Our injected script does `document.head.insertAdjacentHTML(...)` then calls `document.currentScript.remove()`. This keeps the DOM clean for hydration.

Our injected script looks like this (simplified):
```js
(function(){
  var head = document.head;
  head.insertAdjacentHTML("beforeend", "<style data-emotion=...>...</style>");
  var script = document.currentScript;
  if(script) script.remove();
})();
```

### Why group styles?
`buildStyleTags()` mimics how Emotion normally organizes styles:
- **Global styles** (like resets) -> separate tag with `data-emotion="<key>-global ..."`
- **Component styles** -> combined into one tag with `data-emotion="<key> ..."`

This matches what Emotion expects on the client side.

---

## 6. Client Side: Hydration

In `src/entry-client.jsx`:

```js
const rootElement = document.getElementById("root");
const queryClient = createQueryClient(); // client query client
const app = (
  <AppProviders queryClient={queryClient} emotionCache={createEmotionCache()}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppProviders>
);

if (rootElement.hasChildNodes()) {
  // Server already rendered HTML - attach React to it
  hydrateRoot(rootElement, app);
} else {
  // No server HTML - render from scratch (CSR fallback)
  createRoot(rootElement).render(app);
}
```

**Hydration** means: React takes the HTML the server sent, checks it matches what it would generate, and attaches event listeners without re-creating all the DOM nodes.

We send the React Query cache via `window.__REACT_QUERY_STATE__`. The client can pick this up so it doesn't refetch everything on page load.

---

## 7. Suspense & Error Boundaries (Making Streaming Work)

Traditional `useEffect` fetching doesn't tell React "I'm not ready yet" to `renderToPipeableStream`. **Suspense does**.

We created `src/Components/UI/AsyncSection/AsyncSection.jsx`:

```jsx
function AsyncSection({ children, fallback, errorFallback, resetKeys }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          resetKeys={resetKeys}
          fallbackRender={({ error, resetErrorBoundary }) =>
            errorFallback({ error, retry: resetErrorBoundary })
          }
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

**What this does:**
1. `Suspense` - Shows `fallback` (like skeleton) while child is loading
2. `ErrorBoundary` - Catches errors and shows `errorFallback` with a retry button
3. `QueryErrorResetBoundary` - Tells React Query "reset this failed query" when user clicks retry

**How we use it:**

- **Banner** (`Banner.jsx`): `BannerData` uses `useSuspenseQuery(trendingDayQuery(...))`. Wrapped in `AsyncSection`. Server can stream shell, then inject CSS + reveal banner when data arrives.
- **Home shelves** (`Home.jsx`): Each shelf is its own `AsyncSection`. They can stream independently.
- **InfoPage** (`InfoPage.jsx`): Film details and similar movies are in separate `AsyncSection`s. If similar movies fail, the main film still shows.
- **Search** (`SearchResults.jsx`): Uses `useQuery` with `suspense: true` only when searching, and `keepPreviousData` to avoid flicker.

---

## 8. Dev vs Prod Flow

### Development (`npm run dev` or `npm start`)
```text
node server.js
  -> loads dotenv
  -> creates Vite dev server with middlewareMode
  -> app.use(vite.middlewares)
  -> on any request: transform index.html, vite.ssrLoadModule('/server/entry-server.jsx'), renderStream
```
Vite compiles on-the-fly. Changes reflect quickly.

### Production (`npm run build` then `npm run preview`)
```text
npm run build
  -> vite build              (builds client to dist/client/)
  -> vite build --ssr ...    (builds server to dist/server/entry-server.js)
  
npm run preview (NODE_ENV=production)
  -> serve static files from dist/client (index: false)
  -> import dist/server/entry-server.js
  -> read dist/client/index.html as template
  -> renderStream for all routes
```

---

## 9. Key Decisions We Made (Simplified)

| Decision | Explanation |
|---|---|
| **One renderer** | We removed the old non-streaming `renderToString` path. Even with `SSR_STREAMING=false`, we use the streaming renderer but wait for everything (`onAllReady`). Less code to maintain. |
| **Per-request clients** | Never share QueryClient or Emotion cache between requests. This prevents user A from seeing user B's data. |
| **Stream for humans, wait for bots** | Humans want to see *something* fast. Bots (search engines) need the *complete* HTML to index properly. |
| **Handle `$RX` too** | Originally we only handled `$RC` (success). When API fails and error boundaries kick in, React uses `$RX`. We had to add support so error states get styled too. |
| **Abort on disconnect** | If user closes tab mid-stream, we call `abort()` to stop React from doing unnecessary work. |
| **Escape state** | When putting JSON in a script tag, we replace `<` with `\u003c` to prevent breaking out of the script tag. |

---

## 10. Testing What We Did

We added/updated tests to make sure nothing broke:

| Test | What it checks |
|---|---|
| `src/AppProviders.test.jsx` | Shared providers work correctly, server uses `retry: 0` |
| `src/test-utils/emotionStream.test.js` | CSS grouping works, `$RC` handled, `$RX` handled, split scripts don't break |
| `src/Pages/Movies/Movies.test.jsx` | Clearing search shows "No results found" |
| `src/Pages/InfoPage/InfoPage.test.jsx` | Missing title/backdrop handled gracefully |
| All existing tests (129 total) | Still pass with the new Suspense-based architecture |

We also manually tested:
- **Dev server** starts correctly on port 5173
- **Prod build** creates both client and SSR bundles
- **Streaming** works (we can see `$RC`/`$RX` reveals in HTML)
- **Error states** get CSS injected properly
- **Hydration** works (no obvious mismatches)

---

## 11. Simple Mental Model

Imagine the server as a "movie theatre projector operator":

1. **Ticket check (request)** - Express sees who you are (bot or human)
2. **Prep stage** - Create fresh popcorn machine (QueryClient) and fresh screen settings (Emotion cache)
3. **Start playing** - React starts rendering the film (page)
4. **Show trailer first** - Send header + shell CSS immediately (so it looks good)
5. **Roll reels as ready** - As each scene (component) finishes loading data, inject its costumes/props (CSS) and reveal it
6. **Hand out program** - At the end, give the program booklet (`__REACT_QUERY_STATE__`) so the browser knows what was shown
7. **Audience takes over** - Browser hydrates and now you can click around

The CSS transformer is like making sure each scene has the right lighting/effects before the curtain opens for that scene.

---

## Quick Commands

```bash
npm run dev      # Start dev server with hot reload + SSR
npm run build    # Build client + SSR bundles
npm run preview  # Run production server with built files
npm test         # Run tests
npm run test:ci  # Run tests in CI mode
```

---

**TL;DR:** We moved rendering to the server, send HTML in chunks (streaming), collect MUI/Emotion CSS on-the-fly and inject it before content reveals, use Suspense to coordinate loading, and hydrate on the client. The trickiest bit is `server/emotionStream.js` making sure CSS arrives before each revealed chunk so everything looks correct from the very first paint.
