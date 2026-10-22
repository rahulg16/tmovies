# AGENTS.md — `tmovies`

Agent-facing context for the `tmovies` React app. Read Part 1 to orient; jump to Part 2 for
the detail you need.

---

# Part 1 — Read this first

**What it is.** A single-page React app that browses TMDB movies and TV series. It shows a
trending hero, five cached content shelves, debounced search, and detail pages with cast,
trailers and similar titles. Plain JavaScript — no TypeScript, no state library.

### Stack

| Concern | Choice |
|---|---|
| UI | React 18.1, plain JSX |
| Build | Create React App 5.0.1 (`react-scripts`) |
| Server state | TanStack Query 5.104.5 (`@tanstack/react-query`) |
| Routing | react-router-dom 6.3, `HashRouter` |
| Styling | MUI 5.18 via `sx` + a dark theme — no CSS files |
| Tests | Jest 27.5.1 + jsdom 16.7 + React Testing Library 13 |

### Commands

```bash
npm start          # dev server on :3000
npm run test:ci    # run the suite once (after the test plan lands)
npm run build      # production bundle -> build/
```

There is **no** `lint` or `typecheck` script. `react-scripts build` runs ESLint and fails on
lint errors.

### Architecture

```
Page/Component  ->  hook (*Query factory + useQuery)  ->  api/tmdb.js  ->  api/client.js  ->  TMDB
      ^                    |
      |                    +--> api/queryKeys.js (cache identity)
      +--> api/endpoints.js (path builders, used by api/tmdb.js)
```

### Four rules

1. **Server state lives in React Query only.** No Redux, no context, no manual `useEffect` fetch.
2. **No `fetch` outside `src/api/`.** `src/api/client.js` owns the network; everything else calls it.
3. **Hooks forward `options` last.** Every `*Query` factory spreads `...options` last, so a
   call site can override `staleTime`, `enabled`, `select`, etc. Never break that order.
4. **The API key is env-only, and `src/api/APIConfig.js:6` throws at import** when it is
   missing outside production. Any new entry point must have the key set before that import.

### File map

```
src/
  index.js            ReactDOM root: ThemeProvider + CssBaseline + QueryClientProvider + HashRouter
  App.js              <Routes> only — no provider, no router
  queryClient.js      shared QueryClient defaults
  theme/              theme.js (dark tokens) index.js hideScrollbar.js visuallyHidden.js
  api/                APIConfig.js client.js endpoints.js queryKeys.js tmdb.js videos.js
  hooks/              useDebouncedValue.js useDetails.js useMovieLists.js
                      useSearch.js useTrending.js useTvLists.js
  Components/
    Layout/NavBar/NavBar.js
    Layout/Main/Banner.js MovieInfo.jsx MoviesList.jsx
    UI/Badge/GenreChip.jsx  UI/ButtonModal/ButtonModal.js
    UI/Card/Card.js  UI/Card/SimpleCard.js
    UI/Cast/Cast.jsx  UI/SimpleButton/Button.js
    UI/ErrorState/ErrorState.jsx  UI/Skeleton/PosterSkeleton.jsx
    UI/VideoEmbed/VideoEmbed.jsx
  Pages/
    Home/Home.jsx  Home/Header.jsx  Home/SearchedMovies.jsx
    InfoPage/InfoPage.jsx  InfoPage/TrailerSection.jsx
    Movies/Movies.jsx
    Tv Series/TvSeries.jsx      <- folder name contains a space
  Assets/            placeholder.png, high-resolution-black-background-09.jpg
```

### "I want to change X → edit Y"

| I want to… | Edit |
|---|---|
| Add a TMDB endpoint | `api/endpoints.js` → `api/tmdb.js` → `api/queryKeys.js` → a `*Query` factory in `hooks/` → the component |
| Change a list's cache window | the `staleTime` in the relevant `hooks/use*.js` factory, or pass `{ staleTime }` at the call site |
| Change image sizing | `api/APIConfig.js` (`originalImage` / `w500` / `posterImage` / `backdropImage`) |
| Change colours, fonts or component defaults | `src/theme/theme.js` |
| Change the request timeout | `REQUEST_TIMEOUT` in `api/client.js:3` |
| Change global cache defaults | `src/queryClient.js` |
| Add or change a route | `src/App.js:12-18` |
| Add a shelf to Home | `src/Pages/Home/Home.jsx` (a `*Query` + a `<MoviesList>`) |
| Change the search debounce delay | `useDebouncedValue(term, 400)` in `Pages/Movies/Movies.jsx:10` and `Pages/Tv Series/TvSeries.jsx:10` |
| Change what a list shows when empty | `Components/Layout/Main/MoviesList.jsx` |
| Change the hero's item count | `selectTrending` in `Components/Layout/Main/Banner.js:11` |
| Change the hero's slide duration | `AUTOPLAY_INTERVAL` in `Components/Layout/Main/Banner.js:22` |
| Change which trailer is shown | `selectPrimaryTrailer` / `selectTrailerList` in `api/videos.js` |
| Change how long a video may load before the fallback appears | `VIDEO_LOAD_TIMEOUT` in `Components/UI/VideoEmbed/VideoEmbed.jsx` |
| Add a test | the owning test file — see the testing map in §13 |
| Change CI | `.github/workflows/test.yml` (planned — see `plans/CI_PLAN.md`) |

### Further reading

| Document | What it covers |
|---|---|
| [`plans/UNIT_TEST_PLAN.md`](plans/UNIT_TEST_PLAN.md) | The behaviour-first test strategy, the test files, and every scenario |
| [`plans/CI_PLAN.md`](plans/CI_PLAN.md) | The GitHub Actions workflow, coverage gate, and secrets handling |
| [`plans/MUI_MIGRATION_PLAN.md`](plans/MUI_MIGRATION_PLAN.md) | The completed CSS → MUI `sx`/theme migration, bug register and verification notes |
| [`plans/REACT_QUERY_OPTIMIZATION_PLAN.md`](plans/REACT_QUERY_OPTIMIZATION_PLAN.md) | Proposed cache and prefetch optimisations (not yet implemented) |
| [`README.md`](README.md) | Setup, deployment and security notes for the TMDB key |

---

# Part 2 — Full reference

## 1. What this is

`tmovies` is a browser for the TMDB catalogue. It is a client-only static app: no backend,
no server rendering, no auth. Everything it shows comes from the TMDB REST API at
`https://api.themoviedb.org/3/`.

Features:

- **Home** — a trending hero (`/trending/all/day`, first 8 items) plus five shelves:
  Popular Movies, Top Rated Movies, Upcoming Movies In Theatres, Popular TV Series, Top TV Series.
  All five load in parallel via `useQueries`.
- **Search** — `/movies` (starts on `batman`) and `/tv-series` (starts on `Dexter`), with a
  400 ms debounced input.
- **Details** — `/movie/:id` and `/tv/:id`: backdrop, genres, synopsis, up to 5 cast members,
  YouTube trailers, and a similar-titles shelf.
- **States** — every data-driven region has a loading state and an error state.

## 2. Quick start and scripts

```bash
npm install
cp .env.example .env      # then paste your key
npm start
```

| Script | Description |
|---|---|
| `npm start` | Dev server on `http://localhost:3000` |
| `npm run build` | Production bundle into `build/` |
| `npm run deploy` | `predeploy` builds, then `gh-pages -d build` publishes |
| `npm test` | Jest in watch mode (CRA default) |
| `npm run test:ci` | Run the suite once, non-interactive |
| `npm run test:coverage` | Run the suite with coverage and the threshold gate |
| `npm run eject` | One-way; removes the CRA build config |

There is no `lint` or `typecheck` script. CRA's `eslintConfig` in `package.json` extends
`react-app` and `react-app/jest`; `react-scripts build` treats lint errors as build errors.

## 3. Stack

### Installed

| Package | Version |
|---|---|
| `react` / `react-dom` | ^18.1.0 |
| `react-router-dom` | ^6.3.0 |
| `@tanstack/react-query` | ^5.104.5 |
| `@tanstack/react-query-devtools` | ^5.104.5 (devDependency) |
| `@mui/material`, `@emotion/react`, `@emotion/styled` | ^5.8.1, ^11.9.0, ^11.8.1 |
| `react-scripts` | 5.0.1 (pinned) |
| `gh-pages` | ^4.0.0 |
| `web-vitals` | ^2.1.4 |
| `@testing-library/react` | ^13.2.0 |
| `@testing-library/jest-dom` | ^5.16.4 |
| `@testing-library/user-event` | ^13.5.0 |
| `typescript` | 4.7.2 — **peer only**, transitively pulled in; the app has no TS |

### Implicit toolchain (what `react-scripts` 5.0.1 brings)

| Tool | Version | Consequence |
|---|---|---|
| Jest | 27.5.1 | Legacy (non-ESM) resolver. Node polyfills are **not** available. |
| `jest-environment-jsdom` | 27.5.1 | jsdom 16.7 — **no** `fetch`, `Response`, `Request`, `TextEncoder`, `ReadableStream`, `structuredClone`. `AbortController` and `Headers` exist. |
| Babel | `babel-preset-react-app` | Transpiles JSX; no TypeScript transform in play. |
| ESLint | 5-ish, `eslint-config-react-app` | Runs as part of `start` and `build`. |

CRA hard-codes the Jest config in `react-scripts/scripts/utils/createJestConfig.js`:
`roots: ['<rootDir>/src']`, `resetMocks: true`, `testEnvironment: 'jsdom'`.
`testEnvironment` cannot be overridden through the `package.json` `jest` key, but `coverageThreshold`,
`collectCoverageFrom`, `resetMocks` and `testMatch` can.

## 4. Directory map

| File | Purpose |
|---|---|
| `src/index.js` | Entry point. `createRoot`, `StrictMode`, `QueryClientProvider`, `HashRouter`, and the React Query devtools in development only. |
| `src/App.js` | The `<Routes>` table. Contains no provider and no router, so it is testable in isolation. |
| `src/queryClient.js` | The app's `QueryClient` and its default options. |
| `src/App.css`, `src/index.css` | Global styles. |
| `src/api/APIConfig.js` | Base URL, API key, image URL builders. Throws at import if the key is missing outside production. |
| `src/api/client.js` | `apiGet` — URL building, `api_key`/`language` defaults, 15 s timeout, `AbortController` wiring, error normalisation into `ApiError`. |
| `src/api/endpoints.js` | 12 TMDB path builders. |
| `src/api/queryKeys.js` | 13 query-key factories plus `normaliseTerm` (trim + lowercase). |
| `src/api/tmdb.js` | One `fetch*` function per endpoint; the only module that composes `endpoints` + `client`. |
| `src/hooks/useDebouncedValue.js` | Generic debounce hook, default delay 400 ms. |
| `src/hooks/useTrending.js` | `trendingDayQuery` / `useTrendingDay` (default export too). |
| `src/hooks/useMovieLists.js` | `popularMoviesQuery`, `upcomingMoviesQuery`, `topRatedMoviesQuery` + their hooks. `LIST_STALE_TIME = 10 min`. |
| `src/hooks/useTvLists.js` | `popularTvQuery`, `topRatedTvQuery` + their hooks. Reuses `LIST_STALE_TIME` from `useMovieLists`. |
| `src/hooks/useSearch.js` | `searchMoviesQuery`, `searchTvQuery` + their hooks. `SEARCH_STALE_TIME = 1 min`. |
| `src/hooks/useDetails.js` | Detail + similar queries. `DETAILS_STALE_TIME = 10 min`. Also the type-aware `useFilmDetails(type, id)` / `useSimilarFilms(type, id)`. |
| `src/Pages/Home/Home.jsx` | The home screen: `useQueries` over five list queries, plus `NavBar`, `Banner`, five `MoviesList`s. |
| `src/Pages/Home/Header.jsx` | The search header: image, title, input with `aria-label={`Search ${title.toLowerCase()}`}`, and a "Search" submit button. |
| `src/Pages/Home/SearchedMovies.jsx` | Search results grid: skeleton / error / results + an "Updating results..." hint while refetching, and a "No results found." empty state. |
| `src/Pages/Movies/Movies.jsx` | Movie search screen. `useState("batman")` + 400 ms debounce. |
| `src/Pages/Tv Series/TvSeries.jsx` | TV search screen. `useState("Dexter")` + 400 ms debounce. |
| `src/Pages/InfoPage/InfoPage.jsx` | Detail screen for both media types. Scrolls to top on `id`/`type` change. |
| `src/Pages/InfoPage/TrailerSection.jsx` | Renders up to three YouTube trailers, chosen by `selectTrailerList`. Returns `null` when there is none. |
| `src/Components/Layout/NavBar/NavBar.js` | Logo ("T Movies") plus Home / Movies / Tv Series links. |
| `src/Components/Layout/Main/Banner.js` | The trending hero: a horizontal carousel that advances every `AUTOPLAY_INTERVAL` (6 s), with a pause/play control. Loading skeleton, error + "Try again", and the slides. |
| `src/Components/Layout/Main/MoviesList.jsx` | A titled shelf of poster links. Skeleton / error (with optional `onRetry`) / items. |
| `src/Components/Layout/Main/MovieInfo.jsx` | The detail block: title, genre badges, truncated synopsis, cast. |
| `src/Components/UI/Card/Card.js` | A linked poster card with a title. Used by search results. |
| `src/Components/UI/Card/SimpleCard.js` | A bare poster image. |
| `src/Components/UI/Badge/GenreChip.jsx` | A genre pill. |
| `src/Components/UI/ErrorState/ErrorState.jsx` | Shared error message (`role="alert"`) + optional retry. `isRetrying` disables the button and shows "Retrying...". |
| `src/Components/UI/Skeleton/PosterSkeleton.jsx` | Shared poster/name skeleton block. |
| `src/Components/UI/VideoEmbed/VideoEmbed.jsx` | Responsive 16:9 YouTube embed with `loading \| ready \| delayed \| error` states and a `VIDEO_LOAD_TIMEOUT` fallback link. |
| `src/Components/UI/Cast/Cast.jsx` | The "Casts" block, first 5 people. |
| `src/Components/UI/SimpleButton/Button.js` | A plain `<button>` with a label. |
| `src/Components/UI/ButtonModal/ButtonModal.js` | The MUI modal that lazily fetches a film's trailer when opened. |
| `src/api/videos.js` | Pure selectors for TMDB videos: `selectPrimaryTrailer`, `selectTrailerList`, `youtubeEmbedUrl`. |
| `src/theme/visuallyHidden.js` | `visuallyHiddenSx`, shared by the screen-reader-only status text. |
| `src/Assets/placeholder.png` | Poster placeholder, used by `apiConfig.posterImage` when a poster is missing. |
| `src/Assets/high-resolution-black-background-09.jpg` | The search header background. |

`src/Pages/Tv Series/` contains a space — quote the path in shell commands. There are no CSS
files: styling lives in `src/theme/` and inline `sx` props.

## 5. Architecture and data flow

Four layers, strictly one-directional:

1. **Pages** (`src/Pages/`) — compose components, own route params, own the little local state.
2. **Components** (`src/Components/`) — receive data as props and render it. `ButtonModal` is the
   one component that fetches for itself, because it needs to defer a request until it is opened.
3. **Hooks** (`src/hooks/`) — one file per data family. Each exports a `*Query` factory (a plain
   object of query options) and a `use*` hook that calls `useQuery` with it.
4. **API** (`src/api/`) — `endpoints` builds paths, `tmdb.js` composes path + params,
   `client.js` performs the request, `APIConfig.js` holds the base URL, key and image helpers.

### Request lifecycle

```
Component renders
  -> hook called -> *Query factory builds { queryKey, queryFn, staleTime, ... }
  -> useQuery decides whether to fetch (enabled, stale, cache hit)
  -> queryFn({ signal }) -> fetch*() in api/tmdb.js
  -> apiGet() -> buildUrl() -> fetch(url, { signal })
  -> React Query caches the result under queryKey
  -> component re-renders with data | isLoading | isError | error
```

### State ownership

| State | Owner |
|---|---|
| Server data (films, lists, search results) | React Query cache |
| Search term | `useState` in `Movies.jsx` / `TvSeries.jsx` |
| Trailer modal open flag | `useState` in `ButtonModal.js` |
| Route params (`id`) | `useParams` in `InfoPage.jsx` |

There is no Redux, no React Context, and no global UI store.

### Query defaults

`src/queryClient.js`:

```js
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

Per-family overrides: lists and details 10 min, search 1 min, trending 5 min.

## 6. API layer reference

### `src/api/APIConfig.js`

| Export | Notes |
|---|---|
| `baseUrl` | `https://api.themoviedb.org/3/` |
| `apiKey` | `process.env.REACT_APP_TMDB_API_KEY` |
| `originalImage(path)` | `https://image.tmdb.org/t/p/original/<path>` |
| `w500(path)` | `https://image.tmdb.org/t/p/w500/<path>` |
| `posterImage(path)` | w500 poster, falls back to the bundled placeholder |
| `backdropImage(path)` | `original` backdrop, `""` when TMDB has none |

`buildImageUrl` (`:15-19`) returns `""` for a falsy path, and normalises a missing leading
slash. Line 6 throws when the key is missing and `NODE_ENV !== "production"`; in production it
only `console.error`s.

### `src/api/client.js`

| Export | Notes |
|---|---|
| `REQUEST_TIMEOUT` | `15000` ms |
| `ApiError` | `Error` subclass carrying a `status` |
| `apiGet(path, { params, signal })` | The only place `fetch` is called |

`buildUrl` (`:13-25`):

- joins `path` (leading slash stripped) onto `baseUrl`;
- always adds `api_key` and `language=en-US`;
- drops any param whose value is `undefined`, `null` or `""`.

Error handling:

| Situation | Result |
|---|---|
| `!response.ok` | `ApiError(body.status_message \|\| statusText \|\| "Request failed with status N", response.status)` |
| Body is not JSON | the status-based message is kept |
| `AbortError` (timeout or caller cancel) | `ApiError("The request was cancelled or timed out.", 0)` |
| Any other network error | `ApiError(error.message \|\| "Network error while talking to TMDB.", 0)` |

An external `signal` is linked to an internal `AbortController`, and an already-aborted signal
aborts immediately. The timeout is always cleared in `finally`.

### `src/api/endpoints.js` — 12 builders

`trending(window = "day")`, `popularMovies()`, `upcomingMovies()`, `topRatedMovies()`,
`popularTv()`, `topRatedTv()`, `movieDetails(id)`, `tvDetails(id)`, `similarMovies(id)`,
`similarTv(id)`, `searchMovies()`, `searchTv()`.

### `src/api/queryKeys.js` — 13 factories

`trending.day()` · `trending.week()` · `movies.popular()` · `movies.upcoming()` ·
`movies.topRated()` · `movies.details(id)` · `movies.similar(id)` · `movies.search(term)` ·
`tv.popular()` · `tv.topRated()` · `tv.details(id)` · `tv.similar(id)` · `tv.search(term)`.

`normaliseTerm` = `term?.trim().toLowerCase()`. Search keys are normalised, so `" Batman "`
and `"batman"` share one cache entry.

### `src/api/tmdb.js` — 12 fetchers

Each takes an optional `{ signal }`. Extra params: lists and trending send `page: 1`; details
send `append_to_response: "videos,credits"`; search sends `query`, `page: 1`,
`include_adult: false`.

## 7. Hooks reference

| Hook | Factory | Stale time | Notes |
|---|---|---|---|
| `useTrendingDay(options)` | `trendingDayQuery` | 5 min | `trending/all/day?page=1`. Also the default export of the file. |
| `usePopularMovies(options)` | `popularMoviesQuery` | 10 min | |
| `useUpcomingMovies(options)` | `upcomingMoviesQuery` | 10 min | |
| `useTopRatedMovies(options)` | `topRatedMoviesQuery` | 10 min | |
| `usePopularTv(options)` | `popularTvQuery` | 10 min | |
| `useTopRatedTv(options)` | `topRatedTvQuery` | 10 min | |
| `useSearchMovies(keyword, options)` | `searchMoviesQuery` | 1 min | `enabled: !!keyword.trim()` |
| `useSearchTv(keyword, options)` | `searchTvQuery` | 1 min | `enabled: !!keyword.trim()` |
| `useMovieDetails(id, options)` | `movieDetailsQuery` | 10 min | `enabled: !!id` |
| `useTvDetails(id, options)` | `tvDetailsQuery` | 10 min | `enabled: !!id` |
| `useSimilarMovies(id, options)` | `similarMoviesQuery` | 10 min | `enabled: !!id` |
| `useSimilarTv(id, options)` | `similarTvQuery` | 10 min | `enabled: !!id` |
| `useFilmDetails(type, id, options)` | picks movie or tv | 10 min | Type-aware, so a component can branch without conditional hooks. |
| `useSimilarFilms(type, id, options)` | picks movie or tv | 10 min | Same idea. |

### The options-forwarding pattern

Every factory ends with `...options`, so a call site wins:

```js
export const popularMoviesQuery = (options = {}) => ({
  queryKey: queryKeys.movies.popular(),
  queryFn: ({ signal }) => fetchPopularMovies({ signal }),
  staleTime: LIST_STALE_TIME,
  ...options,
});
```

```jsx
const { data } = usePopularMovies({
  staleTime: 60 * 1000,
  select: (data) => data.results.slice(0, 10),
});
```

**Keep `...options` last.** Moving it earlier would silently break
`useFilmDetails(type, id, { enabled: open })` in `ButtonModal.js:34-36` and
`useTrendingDay({ select: selectTrending })` in `Banner.js:20`.

`useDebouncedValue(value, delay = 400)` (`src/hooks/useDebouncedValue.js`) returns the value
immediately on mount and then only after the delay has elapsed without a change.

## 8. Routes and screens

`src/App.js:12-18`:

| Path | Component | Loads | Notes |
|---|---|---|---|
| `/` | `Home` | trending + 5 lists | `exact` |
| `/movie/:id` | `InfoPage type="movie"` | details (`videos,credits`) + similar movies | |
| `/tv/:id` | `InfoPage type="tv"` | details (`videos,credits`) + similar TV | |
| `/movies` | `Movies` | search (`batman`) | `exact` |
| `/tv-series` | `TvSeries` | search (`Dexter`) | `exact` |

`HashRouter` lives in `src/index.js:16`, **not** in `App.js`. That means `App.js` can be
rendered in a test with `MemoryRouter` and a chosen `initialEntries`.

Screen behaviours worth knowing:

- **Home** — `useQueries` fires all five list queries at once (`Home.jsx:11-19`). Each shelf
  gets its own loading/error state, so one failing shelf does not break the others.
- **Search screens** — `useState` seed → `useDebouncedValue(term, 400)` → `useSearchMovies` /
  `useSearchTv`. The first search fires immediately because the debounce hook starts with the
  current value.
- **InfoPage** — `window.scrollTo({ top: 0, left: 0, behavior: "auto" })` on `[id, type]`
  (`InfoPage.jsx:14-16`). The similar shelf is titled `Similar Movies` for movies and
  `Similar Tv Series` for TV (`InfoPage.jsx:63`). The trailer block renders only when
  `selectTrailerList(film?.videos?.results)` finds a YouTube trailer.
- **Banner** — the hero is a horizontal carousel. It advances to the next slide every
  `AUTOPLAY_INTERVAL` (6 s) and wraps around. It pauses on pointer hover, on keyboard focus
  inside the carousel, while the tab is hidden, and when the user presses the pause control.
  `prefers-reduced-motion: reduce` starts it paused.

## 9. Component inventory

| Component | Props | Branches rendered |
|---|---|---|
| `NavBar` | — | Logo link, Home / Movies / Tv Series links |
| `Banner` | — | Loading skeleton · error + "Try again" · up to 8 items (`selectTrending` slices to 8) · pause/play control |
| `MoviesList` | `contentArr, title, contentType, isLoading, isError, error, onRetry` | Loading skeleton (6) · error message · items |
| `MovieInfo` | `movie` | `null` when no movie · title · genre badges · truncated synopsis · cast block |
| `Card` | `movieInfo, type` | Poster image (placeholder fallback) + title, wrapped in a `/<type>/<id>` link |
| `SimpleCard` | `posterImg, title, loading` | A bare poster image (w500, placeholder fallback) |
| `GenreChip` (was `Badge`) | `genre` | A genre pill (`Chip`) |
| `Cast` | `cast` | "Casts" heading + first 5 people (`Cast.jsx:7`) |
| `Button` (`SimpleButton`) | `BtnName` | A contained MUI button |
| `ButtonModal` | `BtnName, data_id, data_type` | Button · dialog with loading / error / iframe / "No trailer available." |
| `Header` | `setSearchTerm, searchTerm, title` | Background image, title, search input, "Search" button |
| `SearchedMovies` | `moviesArr, type, isLoading, isError, error, isFetching, onRetry` | Skeleton (10) · error message · cards + "Updating results..." hint · "No results found." empty state |
| `TrailerSection` | `trailers` | Up to 3 YouTube iframes, or nothing at all |

Content fallbacks worth remembering:

- `MoviesList` name: `content.name || content.original_name || content.title` (`MoviesList.jsx:42`).
- `MovieInfo` title: `movie.original_name || movie.original_title` (`MovieInfo.jsx:14`).
- `Banner` title: `movie.original_title || movie.name` (`Banner.js:63`).
- `MovieInfo` synopsis: truncated at 530 characters, then `"..."` appended (`MovieInfo.jsx:27-29`).
- Poster images come from `apiConfig.posterImage` (w500 + placeholder fallback) and backdrops
  from `apiConfig.backdropImage` (original resolution, `""` when TMDB has none, so the element
  is left out rather than rendered with an empty `src`).
- Every `<img>` declares its intrinsic `width` and `height` (posters 500x750, backdrops
  1920x1080), so the browser reserves the space and the page does not jump while an image
  loads.

## 10. Environment and secrets

| Variable | Required | Purpose |
|---|---|---|
| `REACT_APP_TMDB_API_KEY` | yes, in development | TMDB API key |

Rules:

- Any `REACT_APP_*` variable is inlined into the built bundle by CRA. **Never** put a real
  secret here.
- The key is read at **module load** in `src/api/APIConfig.js:1`. It must exist before that
  module is imported.
- `.env` and `.env.*` are gitignored; only `.env.example` is committed.
- CRA loads `.env` in test mode too, so a developer's local `.env` influences `npm test`.
  A test harness should set the key itself so the suite never depends on it.
- The key ships to the browser in the bundle — restrict it in TMDB by HTTP referrer.
  See the README's security notes.

## 11. Conventions

- Plain JavaScript and JSX. No `tsconfig.json`, no type annotations.
- File extensions are mixed by family: `.jsx` for `GenreChip`, `Cast`, `Header`, `MovieInfo`,
  `MoviesList`, `SearchedMovies`, `Home`, `TvSeries`, `InfoPage`; `.js` elsewhere. **Follow
  the neighbouring file** rather than converting.
- **No CSS files.** Styling is MUI `sx` props plus `src/theme/theme.js`. Use the callback form
  for theme-dependent values. No `styled()`, no `makeStyles`, no `className` on MUI components.
- Repeated patterns live in shared primitives (`PosterSkeleton`, `VideoEmbed`, `ErrorState`,
  `GenreChip`) rather than repeated `sx` blobs. `hideScrollbarSx` covers scrollbar hiding.
- Imports are relative (`../../api/APIConfig`). MUI icons use deep paths
  (`@mui/icons-material/Search`), never the barrel.
- Hooks live in `src/hooks/`, one file per data family, named `use<Family>.js`.

## 12. Build and deploy

```bash
npm run build     # -> build/
npm run deploy    # predeploy builds, gh-pages publishes to the gh-pages branch
```

- `package.json` has `"homepage": "https://rahulg16.github.io/tmovies/"`, so CRA emits
  root-relative asset paths that work under a project sub-path.
- `react-scripts build` sets `NODE_ENV=production`, which means a missing API key does **not**
  throw — it only logs an error, and the bundle ends up with `api_key=undefined`.
- The key is injected at **build time**.
- **No `.github/workflows/` directory exists.** The README describes a GitHub Actions →
  GitHub Pages deployment, but the workflow is not written. `plans/CI_PLAN.md` covers a
  separate test + build workflow.

## 13. Testing

### Status

The suite exists: 13 test files under `src/`, a custom jsdom environment
(`src/test-utils/jestEnv.js`), MSW handlers in `src/test-utils/handlers.js` and a
`renderWithProviders` helper. It is configured through the `jest` key in `package.json`
(CRA hard-codes the rest).

The full strategy is in [`plans/UNIT_TEST_PLAN.md`](plans/UNIT_TEST_PLAN.md). This section is
the short version an agent needs.

### Source file → owning test file

| Source | Test file |
|---|---|
| `src/App.js` | `src/App.test.jsx` |
| `src/Pages/Home/Home.jsx` | `src/Pages/Home/Home.test.jsx` |
| `src/Pages/Home/SearchedMovies.jsx` | `src/Pages/Home/SearchedMovies.test.jsx` |
| `src/Pages/Movies/Movies.jsx` | `src/Pages/Movies/Movies.test.jsx` |
| `src/Pages/Tv Series/TvSeries.jsx` | `src/Pages/Tv Series/TvSeries.test.jsx` |
| `src/Pages/InfoPage/InfoPage.jsx` | `src/Pages/InfoPage/InfoPage.test.jsx` |
| `src/Components/Layout/Main/Banner.js` | `src/Components/Layout/Main/Banner.test.jsx` |
| `src/Components/Layout/Main/MoviesList.jsx` | `src/Components/Layout/Main/MoviesList.test.jsx` |
| `src/Components/Layout/Main/MovieInfo.jsx` | `src/Components/Layout/Main/MovieInfo.test.jsx` |
| `src/Components/UI/ButtonModal/ButtonModal.js` | `src/Components/UI/ButtonModal/ButtonModal.test.jsx` |
| `src/Components/UI/VideoEmbed/VideoEmbed.jsx` | `src/Components/UI/VideoEmbed/VideoEmbed.test.jsx` |
| `src/Components/UI/ErrorState/ErrorState.jsx` | `src/Components/UI/ErrorState/ErrorState.test.jsx` |
| `src/api/client.js` | `src/api/client.test.js` |

Leaf components (`GenreChip`, `Button`, `SimpleCard`, `Card`, `Cast`, `TrailerSection`, `NavBar`,
`Header`, `PosterSkeleton`) are covered through the screen or component that renders them.

The suite is **13 files / 122 tests** and passes with `npm run test:ci`.

### Harness facts you must know

| Fact | Consequence |
|---|---|
| `msw` must stay on **2.11.1** | 2.12+ pulls `rettime` / `until-async` / `@open-draft/deferred-promise`, which are ESM-only; Jest 27's legacy resolver cannot load them and every suite fails at import. 2.11.1 depends on the CJS-friendly `@open-draft/until` + `@bundled-es-modules/*` (mapped in `package.json`) |
| jsdom 16.7 has no `fetch` / `Response` / `TextEncoder` | A custom environment (`src/test-utils/jestEnv.js`) copying Node globals is required; `jest-fixed-jsdom` needs Jest ≥ 28 |
| CRA hard-codes `testEnvironment: 'jsdom'` | Override it through the npm script: `react-scripts test --env=./src/test-utils/jestEnv.js` |
| `src/api/APIConfig.js:6` throws at import | `src/test-utils/env.js` must set the key before anything imports it |
| `resetMocks: true` | Install mock implementations in `beforeEach`, never `beforeAll` |
| `roots: ['<rootDir>/src']` | Helpers live in `src/test-utils/`, not a top-level `__tests__/` |
| `user-event` v13 | No `.setup()`; `await userEvent.type(...)` |
| React Query v5 | `isLoading = isPending && isFetching`; a disabled query is not loading |
| Test `QueryClient` | Must use `retry: false`, or error scenarios stall. `gcTime` is 60 s, not 0: a cached entry has to outlive the component that fetched it |
| `src/index.js` uses `HashRouter` | Tests wrap `App` in `MemoryRouter` with `initialEntries` |
| `window.scrollTo` is unimplemented in jsdom | Stub it in `src/setupTests.js`; `InfoPage.jsx:15` calls it |
| `renderWithProviders` wraps in `ThemeProvider` + `CssBaseline` | Tests exercise the real dark theme, so a theme change can break a test |
| `Element.prototype.scrollTo` does not exist in jsdom | The banner carousel test stubs it; without the stub the autoplay tick is a no-op |

### Rules for writing a test

- Assert what a person sees: text, roles, links, images. Never internal calls, query keys,
  class names, DOM structure or snapshots.
- The network is the only seam — MSW handlers, never `jest.mock` of an app module.
- Assert requests through `server.events.on("request:start", ...)`, not through spies.
- One scenario per test, grouped as a user journey.
- Use a `MemoryRouter` and a fresh `QueryClient` per test.

## 14. Gotchas and known issues

### Known issues (documented, not fixed)

| Issue | Location | Effect |
|---|---|---|
| None currently documented. | — | The MUI migration fixed the invalid link nesting, the `poster_path !== null` fallback and the malformed synopsis ternary. |

### Gotchas

| Gotcha | Note |
|---|---|
| `APIConfig.js` throws at import | A missing key breaks the whole app at startup, not at request time. |
| `src/Pages/Tv Series/` has a space | Quote it in shell commands and in import paths it appears in. |
| `App.js` has no router | Anything rendering `App` must supply one. |
| `useFilmDetails` / `useSimilarFilms` are type-aware | `type` must be exactly `"movie"` or `"tv"`; anything else falls through to the movie variant. |
| `Banner` slices to 8 items | `selectTrending` runs inside `useQuery`, so the cache stores the full list and the selection runs on render. |
| `Home` uses `useQueries`, not five `useQuery` calls | The results are an array, positionally aligned with the queries array. |
| `SearchedMovies` shows "Updating results..." | Rendered whenever `isFetching` is true, including the first load's background refetch. |
| `Banner` autoplays | The carousel advances every 6 s. It stops on hover, on focus inside the carousel, while the tab is hidden, and when `prefers-reduced-motion` is set. The pause control is a real `<button>`, so it also pauses it. |
| `VideoEmbed` swallows a slow player | The skeleton is removed after `VIDEO_LOAD_TIMEOUT` (10 s) and an "Open on YouTube" link appears, so the controls are never blocked forever. |
| `useFilmDetails` / `useSimilarFilms` keep `enabled` | A caller can pass `enabled`, but it is still ANDed with `!!id`, so a detail query never fires without an id. |
| React Query devtools render in development only | `src/index.js:19-21`. They are not part of any screen. |

## 15. How to extend

### Add a TMDB endpoint

1. `src/api/endpoints.js` — add a path builder.
2. `src/api/tmdb.js` — add a `fetch*` function that takes `{ signal }` and calls `apiGet`.
3. `src/api/queryKeys.js` — add a key factory.
4. `src/hooks/` — add a `*Query` factory (spread `...options` last) and a `use*` hook.
5. The component — call the hook and render the three states.

### Add a shelf to Home

1. Add or reuse a list query in `src/hooks/useMovieLists.js` or `useTvLists.js`.
2. Add it to the `useQueries` array in `src/Pages/Home/Home.jsx:11-19`.
3. Destructure it and add a `<MoviesList>` with `title`, `contentType`, `isLoading`, `isError`,
   `error`.

### Add a screen

1. Create `src/Pages/<Name>/<Name>.jsx`; style it with MUI `sx` (no CSS file).
2. Register it in `src/App.js:12-18` with a `path` and `element`.
3. Add a link in `src/Components/Layout/NavBar/NavBar.js`.
4. Add a test file next to it and register it in the map in §13.

### Add a test scenario

1. Pick the owning file from the map in §13 — do not create a new file for a leaf component.
2. Add a handler in `src/test-utils/handlers.js`, or override one for the test with
   `server.use(...)`.
3. Render through `src/test-utils/renderWithProviders.jsx`.
4. Assert user-visible output. Never assert a call.

## 16. Reference index

| Document | Path |
|---|---|
| README — setup, deploy, security | [`README.md`](README.md) |
| Unit test plan | [`plans/UNIT_TEST_PLAN.md`](plans/UNIT_TEST_PLAN.md) |
| CI plan | [`plans/CI_PLAN.md`](plans/CI_PLAN.md) |
| MUI migration plan (implemented) | [`plans/MUI_MIGRATION_PLAN.md`](plans/MUI_MIGRATION_PLAN.md) |
| React Query optimisation proposals | [`plans/REACT_QUERY_OPTIMIZATION_PLAN.md`](plans/REACT_QUERY_OPTIMIZATION_PLAN.md) |
