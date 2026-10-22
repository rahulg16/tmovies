# Unit Test Plan — `tmovies`

Behaviour-first test plan for the `tmovies` React app. Every scenario asserts what a
person can see or do, not which internal function was called.

- **Scope:** API layer → hooks → components → screens → routing.
- **Style:** screen-level and component-level test files, MSW as the only HTTP seam.
- **Not in scope:** production-code changes. Known issues are documented, not fixed
  (see [§7](#7-known-issues--not-fixed)).

---

## Table of contents

1. [Principles](#1-principles)
2. [The MSW + jsdom blocker and its fix](#2-the-msw--jsdom-blocker-and-its-fix)
3. [Dependencies](#3-dependencies)
4. [Setup (Phase 0)](#4-setup-phase-0)
5. [Test files and scenarios](#5-test-files-and-scenarios)
6. [Shared, parametrised suite](#6-shared-parametrised-suite)
7. [Known issues (not fixed)](#7-known-issues--not-fixed)
8. [Deliberately not tested](#8-deliberately-not-tested)
9. [Efficiency mechanics](#9-efficiency-mechanics)
10. [Exit criteria](#10-exit-criteria)

---

## 1. Principles

1. **Assert perceptions, not calls.** Text, roles, links, images, counts of things a user sees.
2. **The network is the only seam.** MSW handlers. Never `jest.mock("../api/tmdb")`, never assert
   that a function was called.
3. **Plumbing is proven by the request *and* the render** — not by query keys or by spying on
   internal functions.
4. **One scenario = one test**, grouped as one user journey. No re-render per assertion.
5. **Query by role or label** (`getByRole`, `getByLabelText`, `within`) — never by class name
   or test id.
6. **No snapshot tests.** Brittle, zero signal, huge diffs.
7. **Never test the same behaviour twice.** Component files own rendered branches; screen files
   own wiring.
8. **Real timers everywhere.** Avoids the MSW + fake-timers minefield.

### 1.1 Anti-patterns → replacements

| ❌ Function test | ✅ Behaviour test |
|---|---|
| `expect(movieDetailsQuery("550").queryKey).toEqual(["movie","550"])` | Open `/movie/550`; assert TMDB received `/movie/550` **and** that film's title is on screen |
| `expect(fetchPopularMovies).toHaveBeenCalled()` | Assert the "Popular Movies" shelf shows the fixture's titles |
| `expect(query.staleTime).toBe(600000)` | Revisit a screen → content is already there, no loading state |
| `expect(selectTrending).toHaveReturnedWith(8 items)` | Assert the hero shows exactly 8 "Watch Now" links |
| `expect(Cast).toHaveBeenCalledWith(cast)` | Assert the five cast names are on screen |
| `expect(container.querySelector(".content-slider")).toBeTruthy()` | Assert the shelf's links exist and point at the right screens |
| `expect(usePopularMovies).toHaveBeenCalledWith(...)` | Assert the Popular Movies shelf is populated |

### 1.2 Ownership rule (prevents duplication)

| Layer | Owns |
|---|---|
| **Component file** | The component's own *rendered branches* (loading, error, empty, truncation, fallbacks) |
| **Screen file** | The *wiring* — which resource feeds this screen, what it requests, where links point, cross-screen isolation |

---

## 2. The MSW + jsdom blocker and its fix

MSW v2 needs `fetch`, `Request`, `Response`, `TextEncoder`, `ReadableStream`.

Jest 27's `jest-environment-jsdom` provides **none** of them. Verified in this repo:

| Global in jsdom 16.7 | Value |
|---|---|
| `fetch` | `undefined` |
| `Request` / `Response` | `undefined` |
| `TextEncoder` / `TextDecoder` | `undefined` |
| `ReadableStream` / `TransformStream` | `undefined` |
| `structuredClone` | `undefined` |
| `AbortController` | `function` (jsdom's) |
| `Headers` | `function` (jsdom's, XHR-based) |

MSW's own migration guide calls this out and points at `jest-fixed-jsdom` — but that package
requires `jest-environment-jsdom >= 28` and this repo is on `27.5.1`, so it would nest a
conflicting copy of the environment.

### 2.1 Fix: a local Jest environment

`src/test-utils/jestEnv.js` extends `jest-environment-jsdom@27` and copies Node's **real**
globals (not polyfills) into the jsdom sandbox in `setup()`:

```js
const JSDOMEnvironment = require("jest-environment-jsdom");

class FixedJsdomEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    const g = this.global;
    g.fetch = globalThis.fetch;
    g.Headers = globalThis.Headers;
    g.Request = globalThis.Request;
    g.Response = globalThis.Response;
    g.FormData = globalThis.FormData;
    g.Blob = globalThis.Blob;
    g.TextEncoder = globalThis.TextEncoder;
    g.TextDecoder = globalThis.TextDecoder;
    g.ReadableStream = globalThis.ReadableStream;
    g.TransformStream = globalThis.TransformStream;
    g.WritableStream = globalThis.WritableStream;
    g.structuredClone = globalThis.structuredClone;
    g.BroadcastChannel = globalThis.BroadcastChannel;
    g.AbortController = globalThis.AbortController;
    g.AbortSignal = globalThis.AbortSignal;
  }
}

module.exports = FixedJsdomEnvironment;
```

### 2.2 Wiring it up

CRA hard-codes `testEnvironment: 'jsdom'` in `react-scripts/scripts/utils/createJestConfig.js`
and does **not** allow overriding `testEnvironment` through the `package.json` `jest` key.
`react-scripts test` does, however, parse and re-push `--env`
(`react-scripts/scripts/test.js:100-127`), so the environment is applied through the npm script:

```json
"test":          "react-scripts test --env=./src/test-utils/jestEnv.js",
"test:ci":       "CI=true react-scripts test --env=./src/test-utils/jestEnv.js --watchAll=false",
"test:coverage": "CI=true react-scripts test --env=./src/test-utils/jestEnv.js --watchAll=false --coverage"
```

All three wirings were verified working in this toolchain:

| Wiring | Result |
|---|---|
| `testEnvironment: "<rootDir>/src/..."` in a `jest.config.js` | ✅ passes |
| `jest --env=./src/...` (relative, resolved against rootDir) | ✅ passes |
| `react-scripts test --env=./src/...` | ✅ CRA parses and re-pushes the flag |

---

## 3. Dependencies

```bash
npm i -D msw@2.15.0
```

**Must be pinned to 2.x.**

| Version | Why not / why |
|---|---|
| `msw@3.0.3` (latest) | `"type": "module"` — ESM only. Jest 27's resolver would load it as ESM and fail. |
| `msw@2.15.0` ✅ | `"type": "commonjs"`, `main: ./lib/core/index.js`. Jest 27's resolver ignores the `exports` field, so `msw/node` resolves through the shipped `node/package.json` shim — `{ "type": "commonjs", "main": "../lib/node/index.js" }` — which points at the CJS build. `engines.node >= 18`. |

Notes:

- `msw@2.15.0` declares `peerDependencies: { typescript: ">= 4.8.x" }`, but that peer is
  **optional** (`peerDependenciesMeta`), so it does not conflict with the existing
  `typescript@4.7.2` peer entry in `package-lock.json`. No TypeScript changes needed.
- No `jest-fixed-jsdom`, no `undici`, no polyfill packages.

---

## 4. Setup (Phase 0)

| File | Purpose |
|---|---|
| `src/test-utils/jestEnv.js` | Custom Jest environment (see [§2.1](#21-fix-a-local-jest-environment)). |
| `src/test-utils/env.js` | Sets `process.env.REACT_APP_TMDB_API_KEY = "test-api-key"`. **Must** run before `APIConfig.js` is imported — `src/api/APIConfig.js:6` **throws at module load** when the key is missing and `NODE_ENV !== "production"`, and CRA sets `NODE_ENV=test` (`react-scripts/scripts/test.js:13`). |
| `src/setupTests.js` | `import "@testing-library/jest-dom"` first, then `./test-utils/env`, then the MSW lifecycle (`server.listen` / `resetHandlers` / `close`). Also stubs `window.scrollTo` — jsdom logs "Not implemented" for it, and `src/Pages/InfoPage/InfoPage.jsx:15` calls it. |
| `src/test-utils/mswServer.js` | `setupServer(...handlers)` from `msw/node`. |
| `src/test-utils/handlers.js` | Handlers for all 12 TMDB paths from `src/api/endpoints.js` → `HttpResponse.json(fixtures)`. |
| `src/test-utils/fixtures.js` | TMDB-shaped fixture factories: `movieFixture({ id, title })`, `tvFixture(...)`, `trendingResults(n)`, `creditsFixture(n)`, `videosFixture(key)`. |
| `src/test-utils/renderWithProviders.jsx` | `QueryClientProvider` (a fresh client with `retry: false`, `gcTime: 0`) + `MemoryRouter`; returns `{ user, queryClient, ...renderResult }`. |
| `src/test-utils/searchScenarios.js` | The shared, parametrised search-screen suite (see [§6](#6-shared-parametrised-suite)). |

### 4.1 MSW lifecycle

```js
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`onUnhandledRequest: "error"` makes an un-mocked request fail loudly instead of silently
hitting the network.

### 4.2 Asserting requests (not calls)

```js
const requests = [];
server.events.on("request:start", ({ request }) => requests.push(request.url));
```

Used for: which TMDB path a screen hit (S1, I1), one request per settled search term (S3),
no request until the trailer modal opens (T1), parallel shelf loading (H5).

### 4.3 Per-scenario overrides

```js
server.use(http.get("https://api.themoviedb.org/3/movie/popular", () => HttpResponse.json({ results: [] })));
```

`server.use` installs a runtime handler for one test — no new file, no re-render.

---

## 5. Test files and scenarios

11 files. Every source file in `src/` is exercised by at least one scenario.

| # | File | Type | Scenarios |
|---|---|---|---|
| 1 | `src/App.test.jsx` | screen | 8 |
| 2 | `src/Pages/Home/Home.test.jsx` | screen | 6 |
| 3 | `src/Pages/Home/SearchedMovies.test.jsx` | component | 5 |
| 4 | `src/Pages/Movies/Movies.test.jsx` | screen | 7 (shared) + 1 delta |
| 5 | `src/Pages/Tv Series/TvSeries.test.jsx` | screen | 7 (shared) + 2 deltas |
| 6 | `src/Pages/InfoPage/InfoPage.test.jsx` | screen | 13 |
| 7 | `src/Components/Layout/Main/Banner.test.jsx` | component | 8 |
| 8 | `src/Components/Layout/Main/MoviesList.test.jsx` | component | 7 |
| 9 | `src/Components/Layout/Main/MovieInfo.test.jsx` | component | 8 |
| 10 | `src/Components/UI/ButtonModal/ButtonModal.test.jsx` | component | 5 |
| 11 | `src/api/client.test.js` | boundary | 3 |

Leaf components (`Badge`, `SimpleButton/Button`, `SimpleCard`, `Card`, `Cast`,
`TrailerSection`, `NavBar`) get **no file of their own** — they are covered through the
screen or component that uses them. `ButtonModal` earns a file because it owns a modal
and a lazy network call.

### 5.1 `src/App.test.jsx` — routing & navigation

| # | Scenario | Observable assertion |
|---|---|---|
| R1 | `/` opens home | "Popular Movies" heading present |
| R2 | `/movies` opens movie search | input labelled "Search movies" present |
| R3 | `/tv-series` opens TV search | input labelled "Search tv series" present |
| R4 | `/movie/550` opens that film's details | heading = the title of the film TMDB returned for `550` |
| R5 | `/tv/1399` opens that series' details | heading = that series' `original_name` |
| R6 | Navbar "Movies" navigates | click → "Search movies" input appears |
| R7 | Navbar "Tv Series" navigates | click → "Search tv series" input appears |
| R8 | Navbar logo returns home | click → "Popular Movies" heading appears |

R4/R5 also prove deep links work on a first load — no client-side history is needed.

### 5.2 `src/Pages/Home/Home.test.jsx`

| # | Scenario | Observable assertion |
|---|---|---|
| H1 | The five shelves appear with their headings | Popular Movies / Top Rated Movies / Upcoming Movies In Theatres / Popular TV Series / Top TV Series |
| H2 | Each shelf is wired to the right media type | the three movie shelves' links are `/movie/…`, the two TV shelves' links are `/tv/…` |
| H3 | The hero and the shelves render together | hero title + all five shelf headings visible |
| H4 | One failing shelf does not break the others | failed shelf shows its error message; a sibling shelf is still populated |
| H5 | All five lists load together, not one after another | the request log shows all five requests, none gated on another finishing |
| H6 | Revisiting home shows content immediately | second visit → headings + items present, no loading state, no second request |

### 5.3 `src/Pages/Home/SearchedMovies.test.jsx`

| # | Scenario | Observable assertion |
|---|---|---|
| SM1 | While loading, no results appear | no result links on screen |
| SM2 | A failed search shows a readable error | TMDB's message visible |
| SM3 | Each result renders as a card | one card per fixture result |
| SM4 | A result with no poster uses the placeholder | image `src` is the bundled placeholder, not empty |
| SM5 | While refreshing, a hint is shown | "Updating results..." visible |

### 5.4 `src/Pages/Movies/Movies.test.jsx` and `src/Pages/Tv Series/TvSeries.test.jsx` — search

Both files call the shared suite (see [§6](#6-shared-parametrised-suite)) and add only their
deltas.

| # | Scenario | Observable assertion |
|---|---|---|
| S1 | The screen opens already showing results | fixture titles visible; TMDB received `query=<initialTerm>` |
| S2 | Typing a term searches for it | clear + type → new titles visible; the request carried the new term |
| S3 | Typing quickly fires one request, not one per keystroke | the request log holds a single search request, for the final term only |
| S4 | Results link to their detail screen | href `/movie/…` (movies) or `/tv/…` (TV) |
| S5 | Each result shows its title | card names visible |
| S6 | A search with no results shows no cards and no error | no result links, no error text |
| S7 | Pressing "Search" does not reload the page | no navigation; results unchanged |

Deltas:

| File | Delta | Observable assertion |
|---|---|---|
| `Movies.test.jsx` | The screen starts on **"batman"** | request `query=batman` |
| `TvSeries.test.jsx` | The screen starts on **"Dexter"** | request `query=Dexter` |
| `TvSeries.test.jsx` | TV results link to the TV screen | href `/tv/…` (covered by the shared suite's `linkPrefix`) |

### 5.5 `src/Pages/InfoPage/InfoPage.test.jsx`

| # | Scenario | Observable assertion |
|---|---|---|
| I1 | The film shown is the one named in the URL | request path `/movie/550` **and** heading = that film's title |
| I2 | Genres are listed | "Action", "Crime" visible |
| I3 | The synopsis is shown | overview text visible |
| I4 | The cast is shown | cast names visible |
| I5 | The trailer is embedded when there is one | iframe `src` = `youtube.com/embed/<key>`; trailer name as heading |
| I6 | No trailer section when the film has no videos | no iframe on the page |
| I7 | Similar titles are listed and link onward | heading "Similar Movies"; links `/movie/…` |
| I8 | The screen says it is loading, then shows the film | "Loading details..." → title |
| I9 | A failing film request shows a readable error | TMDB's message visible |
| I10 | A failing similar-titles request does not hide the film | film title still visible; the error shows in the similar row |
| I11 | Opening a new film scrolls the page to the top | `window.scrollTo` called with `top: 0` |
| I12 | Revisiting a film shows it immediately | title present, no "Loading details...", no second request |
| I13 | The TV variant shows the series' name, TV links, "Similar Tv Series" | heading = `original_name`; similar links `/tv/…`; heading text "Similar Tv Series" |

### 5.6 `src/Components/Layout/Main/Banner.test.jsx`

| # | Scenario | Observable assertion |
|---|---|---|
| B1 | The trending title and synopsis are shown | heading + overview text |
| B2 | At most eight trending items are shown | exactly 8 "Watch Now" links (the fixture returns 10) |
| B3 | "Watch Now" points at the item's screen | `/movie/550` for a movie item, `/tv/1399` for a TV item |
| B4 | Every item offers a trailer | one "Watch Trailer" button per item |
| B5 | While loading, no trending title is shown | no title text on screen |
| B6 | A failed request shows the message and a retry | error message + "Try again" visible |
| B7 | "Try again" re-requests and shows the hero | click → the title appears and the request log grows by one |
| B8 | A TV item is labelled with its name, a movie with its title | both name forms rendered |

### 5.7 `src/Components/Layout/Main/MoviesList.test.jsx`

| # | Scenario | Observable assertion |
|---|---|---|
| ML1 | The shelf heading is shown | heading text |
| ML2 | Each item links to `/{type}/{id}` | hrefs correct |
| ML3 | Each item shows its name | names visible |
| ML4 | While loading, no item names appear (the heading still does) | names absent, heading present |
| ML5 | A failed request shows the error message | message visible |
| ML6 | With no items, the shelf shows no links | no links |
| ML7 | The name falls back correctly per media type | `name` for TV items, `title` for movies |

### 5.8 `src/Components/Layout/Main/MovieInfo.test.jsx`

| # | Scenario | Observable assertion |
|---|---|---|
| MI1 | With no film, nothing is shown | the container is empty |
| MI2 | The film's title is shown | heading |
| MI3 | Genres are shown | "Action", "Crime" |
| MI4 | The synopsis is shown | text |
| MI5 | A long synopsis is shortened | text ends with "…" and is 533 characters |
| MI6 | At most five cast members are shown | 5 names visible, the 6th absent |
| MI7 | A film with no `credits` data shows no cast section | no "Casts" heading |
| MI8 | The poster is shown | image present |

### 5.9 `src/Components/UI/ButtonModal/ButtonModal.test.jsx`

| # | Scenario | Observable assertion |
|---|---|---|
| T1 | Nothing is requested until the button is pressed | the request log is empty before the click |
| T2 | Pressing it shows the trailer video | an iframe with the trailer key |
| T3 | A film with no trailer says so | "No trailer available." visible |
| T4 | A failed request shows a message | "Could not load the trailer." visible |
| T5 | The modal can be dismissed | Escape → the iframe is gone from the page |

### 5.10 `src/api/client.test.js` — failure channel

Covers what the app shows when TMDB misbehaves, beyond the per-screen error scenarios.

| # | Scenario | Observable assertion |
|---|---|---|
| F1 | A request that never answers ends as a cancellation, not a hang | the app-facing error is "The request was cancelled or timed out.", with no status |
| F2 | TMDB's own error message reaches the caller verbatim | `status_message` from the response body is the message |
| F3 | A caller-cancelled request ends as a cancellation | a cancellation error, not a hung promise |

---

## 6. Shared, parametrised suite

The main efficiency lever. Seven scenarios are written once and executed twice.

```js
// src/test-utils/searchScenarios.js
export const runSearchScreenScenarios = ({
  type,
  initialTerm,
  results,
  linkPrefix,
  inputLabel,
}) => {
  describe(`${type} search screen`, () => {
    // S1 … S7
  });
};
```

```js
// src/Pages/Movies/Movies.test.jsx
runSearchScreenScenarios({
  type: "movie",
  initialTerm: "batman",
  results: movieResults,
  linkPrefix: "/movie",
  inputLabel: "Search movies",
});

// src/Pages/Tv Series/TvSeries.test.jsx
runSearchScreenScenarios({
  type: "tv",
  initialTerm: "Dexter",
  results: tvResults,
  linkPrefix: "/tv",
  inputLabel: "Search tv series",
});
```

The same shape applies to the movie/TV variants of the detail screen: one parametrised body,
two sets of expectations for the type-specific differences (title source `original_title` vs
`original_name`, similar-list heading and link prefix).

---

## 7. Known issues (not fixed)

Per the decision to keep this task test-only, these are **documented rather than corrected**.
Each has a test that asserts the *current* behaviour, so a future fix shows up as a deliberate,
visible test change.

| Issue | Location | Behaviour |
|---|---|---|
| `<Link>` wraps `<li>` outside a `<ul>` child — invalid HTML nesting | `src/Components/Layout/NavBar/NavBar.js:15-27` | Navbar items still render and are clickable, so navigation tests pass; the markup is invalid |
| `poster_path !== null` means `undefined` yields a broken image | `src/Components/UI/Card/Card.js:13` | Only an explicit `null` falls back to the placeholder. `undefined` reaches `apiConfig.originalImage()`, which returns `""` for a falsy path, so the `<img>` gets `src=""` |
| `<Link>` wraps a `<button>` — invalid nesting | `src/Components/Layout/Main/Banner.js:67` | "Watch Now" is a button inside an anchor, so its accessible name is still exposed |
| Malformed ternary formatting | `src/Components/Layout/Main/MovieInfo.jsx:27-29` | No behavioural effect |

---

## 8. Deliberately not tested

| Not tested | Why |
|---|---|
| `endpoints` / `queryKeys` helper functions | Pure plumbing — proven by the URLs the screens actually request (S1, I1) |
| React Query internals (query keys, `gcTime`, `staleTime`, dedup) | Only its user-visible face is tested (H6, I12) |
| Class names, DOM structure, skeleton counts | White-box; no user meaning |
| Leaf components in isolation | Covered through their screen or component file |
| MUI internals | Third-party |
| Debounce internals (timer counts) | Only the outcome matters (S3) |
| Snapshot tests | Brittle, low signal |

---

## 9. Efficiency mechanics

- **11 files covering all 31 source files**; every source file is exercised by ≥1 scenario.
- **Request assertions via MSW events**, not spies (§4.2).
- **Per-scenario overrides** with `server.use(...)` — no new file, no re-render.
- **Fixture factories** (`movieFixture({ id, title })`) instead of large static blobs.
- **One render helper** returning `{ user, ...renderResult }` so each test is 3–6 lines.
- **Shared parametrised suite** → 7 scenarios written once, run twice.
- **Real timers**; the only timing assertions are outcome-based (S3), never timer-count-based.
- ≈77 scenario instances across 11 files.

### 9.1 Gotchas to respect while writing the tests

| Gotcha | Consequence |
|---|---|
| CRA sets `resetMocks: true` | Install every mock implementation in `beforeEach`, never `beforeAll` |
| CRA sets `roots: ['<rootDir>/src']` | All helpers must live under `src/`; `src/test-utils/` (not `__tests__/`) so they are not collected as test files |
| `src/Pages/Tv Series/` has a space | Quote the path in shell commands |
| `user-event` v13 | No `.setup()`; `userEvent.type(...)` returns a promise and must be awaited |
| React Query v5 | `isLoading = isPending && isFetching`; a disabled query is *not* loading |
| The test QueryClient | Must use `retry: false`, or error scenarios stall for seconds |
| `HashRouter` in `src/index.js` | `App.js` only exports `<Routes>`, so tests wrap in `MemoryRouter` and control `initialEntries` |
| `src/api/APIConfig.js:6` | Throws at import when the key is missing — `src/test-utils/env.js` must be imported before anything that reaches it |

---

## 10. Exit criteria

- `npm run test:ci` is green.
- `npm run test:coverage` is green and meets the thresholds in [`CI_PLAN.md`](./CI_PLAN.md).
- Every screen has a happy path, a loading path, an error path and an empty path covered.
- No test asserts an internal call, a class name, or a snapshot.
- Every test name states a user-visible symptom.

### 10.1 Verification commands

```bash
npm i -D msw@2.15.0
npm run test:ci
npm run test:coverage
npm run build          # confirm test files do not leak into the bundle
```

### 10.2 Known risk

If `require("msw/node")` fails to resolve under Jest 27's legacy resolver, the fallback is
`require("msw/lib/node/index.js")` — a one-line change in `src/test-utils/mswServer.js`. The
published tarball ships a `node/package.json` shim, so normal resolution is expected.
