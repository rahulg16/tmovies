# React Query Optimization Plan for tmovies

This document outlines the plan to migrate all TMDB API calls to **@tanstack/react-query**, remove artificial delays, clean up the API layer, and safely handle the TMDB API key for GitHub Pages deployments.

## Table of Contents
- [Goals](#goals)
- [Current State](#current-state)
- [Dependencies](#dependencies)
- [Architecture Changes](#architecture-changes)
- [Migration Plan](#migration-plan)
- [API Key & GitHub Pages](#api-key--github-pages)
- [Testing & Verification](#testing--verification)
- [Risks & Mitigations](#risks--mitigations)
- [Implementation Checklist](#implementation-checklist)

## Goals
- Replace all `useState` + `useEffect` + `axios` patterns with React Query hooks
- Eliminate `setTimeout` waterfalls (especially in `Home.jsx` and `InfoPage.jsx`)
- Centralize API calls, keys, and error handling
- Improve caching, deduplication, and UX (loading/error states)
- Move TMDB API key to environment variables safely for GitHub Pages
- Reduce unnecessary re-renders and improve perceived performance

## Current State
- **Fetching**: Manual axios calls with `require("axios")` in most components
- **State**: Local `useState` for every resource
- **Delays**: Home.js staggers 5 requests with setTimeouts (adding 6-7s of artificial delay)
- **Key**: Hardcoded in `src/Api/APIConfig.js`
- **Routing**: HashRouter on GitHub Pages
- **Context**: `FilmContext` used to pass id/type between routes (with localStorage fallback)

## Dependencies
Install the following:

```bash
npm install @tanstack/react-query
npm install --save-dev @tanstack/react-query-devtools
```

Compatible with React 18 and react-scripts 5. v5 is used (`gcTime` replaces `cacheTime`).

`axios` is **not** used - the API layer is built on the native `fetch` API.

## Architecture Changes

### 1) Query Client Setup
- Create `src/queryClient.js` (or inline in `index.js`)
- Wrap app in `QueryClientProvider` in `src/index.js`
- Add `ReactQueryDevtools` only in development
- Suggested defaults:
```js
{
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000,   // 10 min (v5) / cacheTime (v4)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
}
```

### 2) API Layer Refactor
Create a clean API structure under `src/api/`:

| File | Purpose |
|---|---|
| `src/api/APIConfig.js` | Env based config: base URLs, image helpers, TMDB key |
| `src/api/client.js` | `fetch` wrapper with base url, timeout, abort support and error normalisation |
| `src/api/tmdb.js` | Pure functions for each endpoint (returns data, not a full response) |
| `src/api/queryKeys.js` | Centralized key factory for consistent keys & invalidation |
| `src/api/endpoints.js` | URL builders for every TMDB path |

**No axios.** The whole app talks to TMDB through React Query and the native `fetch` API, so `axios` was removed from `package.json` and no component performs a raw HTTP call.

### 3) Query Keys Factory
Example structure:
```js
export const queryKeys = {
  trending: {
    day: () => ['trending', 'day'],
    week: () => ['trending', 'week'],
  },
  movies: {
    popular: () => ['movies', 'popular'],
    upcoming: () => ['movies', 'upcoming'],
    topRated: () => ['movies', 'topRated'],
    details: (id) => ['movie', id],
    similar: (id) => ['movie', id, 'similar'],
    search: (term) => ['movies', 'search', term?.toLowerCase().trim()],
  },
  tv: {
    popular: () => ['tv', 'popular'],
    topRated: () => ['tv', 'topRated'],
    details: (id) => ['tv', id],
    similar: (id) => ['tv', id, 'similar'],
    search: (term) => ['tv', 'search', term?.toLowerCase().trim()],
  },
};
```

### 4) Custom Hooks
Create hooks under `src/hooks/`:

| Hook | Replaces | Notes |
|---|---|---|
| `useTrendingDay()` | Banner fetch | `staleTime` ~1-5 min |
| `usePopularMovies()`, `useUpcomingMovies()`, `useTopRatedMovies()` | Home movie lists | Can fetch in parallel or via `useQueries` |
| `usePopularTv()`, `useTopRatedTv()` | Home TV lists | Same as above |
| `useMovieDetails(id)`, `useTvDetails(id)` | InfoPage details | `enabled: !!id` |
| `useSimilarMovies(id)`, `useSimilarTv(id)` | InfoPage similar | `enabled: !!id` |
| `useSearchMovies(keyword)`, `useSearchTv(keyword)` | Movies/TvSeries search | `enabled: !!keyword?.trim()`, use debounced keyword |

`useQueries` is used in Home to fetch all five lists concurrently without `setTimeout`s.

Every hook forwards the options it receives to `useQuery`, so a consumer can override
`staleTime`, `gcTime`, `enabled`, `select`, ... per call site:

```jsx
usePopularMovies({ staleTime: 60 * 1000, select: (data) => data.results.slice(0, 10) });
```

### 5) Component Migrations

| Component | Changes |
|---|---|
| `src/index.js` | Add `QueryClientProvider` + optional devtools |
| `src/Components/Layout/Main/Banner.js` | Replace manual fetch with `useTrendingDay()`, handle loading/error states |
| `src/Pages/Home/Home.jsx` | Remove all `setTimeout`s and local states. Fetch all lists via hooks/`useQueries` in parallel. |
| `src/Pages/Movies/Movies.jsx` | Use debounced search term + `useSearchMovies()`. Remove manual fetch/effects. |
| `src/Pages/Tv Series/TvSeries.jsx` | Mirror Movies migration for TV search. |
| `src/Pages/InfoPage/InfoPage.jsx` | Use `useMovieDetails`/`useTvDetails` + `useSimilar*`. Prefer route params via `useParams()` to avoid localStorage/context hacks where possible. |
| `src/Pages/InfoPage/TrailerSection.jsx` | Consume `videos` from details query when using `append_to_response` to avoid extra requests. |
| `src/Components/UI/ButtonModal/ButtonModal.js` | Reuse the cached details query (enabled only while the modal is open) instead of its own request. |
| `src/Components/UI/Cast/Cast.jsx`, `src/Components/Layout/Main/Banner.js` | Never mutate cached data (use `slice()`), otherwise React Query's cache is corrupted. |

## API Key & GitHub Pages

### Moving the key
1. **Create env files**
   - Add `.env` to `.gitignore` (verify; CRA usually ignores it)
   - Create `.env.example`:
     ```env
     REACT_APP_TMDB_API_KEY=YOUR_TMDB_API_KEY_HERE
     ```
   - Create local `.env` with your actual key

2. **Update API config**
   - Update `src/api/APIConfig.js` to read `process.env.REACT_APP_TMDB_API_KEY`
   - Fail fast in development with a clear error if missing
   - Ensure all URLs use the env-based key

3. **Deployment behavior**

| Method | How key is injected | New key needed? | Notes |
|---|---|---|---|
| `npm run build` + `gh-pages` locally | Built from local `.env` | **No** | Key is baked into built JS in `build/`. |
| GitHub Actions → GitHub Pages | Use repository secret `REACT_APP_TMDB_API_KEY` in workflow env before build | **No** | Same key, injected at build time in CI. |
| Forks | Each fork can use its own secret/key | Only if you want separate quotas | Not required. |

### Security Notes (Critical)
- **Client-side exposure is unavoidable** for a static CRA app - anyone can extract the key from bundled JS.
- **Restrict in TMDB**: Add HTTP referrer restrictions for `rahulg16.github.io/*` and `localhost:*` (dev). This is the most effective mitigation.
- **Rotate if leaked**: If the key was ever committed to history, regenerate it in TMDB.
- **Rate limits**: Restrictions prevent cross-origin abuse even if the key is public.
- **Optional**: Proxy via serverless function (Vercel/Netlify/Cloudflare) to keep key server-side - more complex, probably unnecessary for this project.

**Answer to your question:** No, you do not need to create a new API key for each gh-pages deployment. Reuse the same key. Just ensure it's injected at build time via env/secret and restrict it by referrer in TMDB.

## Testing & Verification
- [x] All routes load correctly (`/`, `/movies`, `/tv-series`, `/movie/:id`, `/tv/:id`)
- [x] Direct refresh/bookmark on detail pages works (id comes from `useParams()`)
- [x] Search works with debouncing (no excessive requests)
- [x] No setTimeouts remain in data fetching code
- [x] Loading and error states display appropriately
- [x] Network tab shows deduplicated/cached requests on navigation
- [x] `npm run build` succeeds with no warnings
- [x] Bundle size reasonable (compare before/after)
- [x] Check for console errors/warnings

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| FilmContext removal breaks navigation | Medium | InfoPage now reads the id from `useParams()`, so the provider was removed entirely |
| Over-caching stale data | Low | Tune `staleTime` per resource (trending shorter, details longer) |
| Key restriction blocks local dev | Low | Add `localhost` to TMDB referrer allowlist or use a separate dev key |
| Bundle size increase | Low | Acceptable for the UX/caching benefits; can optimize later |

## Implementation Checklist

### Phase 0: Prep
- [x] Verify `.gitignore` includes `.env*`
- [x] Create `.env.example`
- [x] Add `.env` locally (gitignored)

### Phase 1: Env + API Client
- [x] Update `src/api/APIConfig.js` to use `process.env.REACT_APP_TMDB_API_KEY`
- [x] Create `src/api/client.js`
- [x] Create `src/api/tmdb.js`
- [x] Create `src/api/queryKeys.js`
- [x] Remove `axios` everywhere (native `fetch` inside the API layer)

### Phase 2: React Query Setup
- [x] Install `@tanstack/react-query` and devtools
- [x] Create `src/queryClient.js`
- [x] Update `src/index.js` with `QueryClientProvider`

### Phase 3: Hooks & Migration
- [x] Create hooks in `src/hooks/` for all resources
- [x] Migrate `Banner.js`
- [x] Migrate `Home.jsx` (remove setTimeouts)
- [x] Migrate `Movies.jsx`
- [x] Migrate `Tv Series/TvSeries.jsx`
- [x] Migrate `InfoPage.jsx` and `TrailerSection.jsx`
- [x] Evaluate/remediate `FilmContext` usage

### Phase 4: Polish
- [x] Add loading skeletons/error states
- [x] Remove console.logs
- [x] Test all routes and refresh cases
- [x] Build and verify
- [x] Update README with setup instructions
