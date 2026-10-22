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

Compatible with React 18 and react-scripts 5. Use v4 or v5 - either is fine; this plan targets a v5-compatible structure but is adaptable.

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
| `src/api/client.js` | Axios instance with baseURL, timeout, and request/response interceptors |
| `src/api/tmdb.js` | Pure functions for each endpoint (returns data, not full axios response) |
| `src/api/queryKeys.js` | Centralized key factory for consistent keys & invalidation |
| `src/api/endpoints.js` (optional) | URL builders using env-based key |

Also migrate from `const axios = require("axios")` to `import axios from 'axios'` everywhere.

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
| `useMovieDetails(id)` | InfoPage movie details | `enabled: !!id` |
| `useTvDetails(id)` | InfoPage TV details | `enabled: !!id` |
| `useSimilarMovies(id)`, `useSimilarTv(id)` | InfoPage similar | `enabled: !!id` |
| `useSearchMovies(keyword)`, `useSearchTv(keyword)` | Movies/TvSeries search | `enabled: !!keyword?.trim()`, use debounced keyword |

Consider using `useQueries` in Home to fetch all lists concurrently without `setTimeout`s.

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
   - Update `src/Api/APIConfig.js` to read `process.env.REACT_APP_TMDB_API_KEY`
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
- [ ] All routes load correctly (`/`, `/movies`, `/tv-series`, `/movie/:id`, `/tv/:id`)
- [ ] Direct refresh/bookmark on detail pages works
- [ ] Search works with debouncing (no excessive requests)
- [ ] No setTimeouts remain in data fetching code
- [ ] Loading and error states display appropriately
- [ ] Network tab shows deduplicated/cached requests on navigation
- [ ] `npm run build` succeeds with no warnings
- [ ] Bundle size reasonable (compare before/after)
- [ ] Check for console errors/warnings

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| API changes in axios v1 if updated later | Medium | Stay on axios 0.27.2 for now or test carefully if upgrading |
| FilmContext removal breaks navigation | Medium | Migrate InfoPage to use `useParams()` gradually; keep context during transition if needed |
| Over-caching stale data | Low | Tune `staleTime` per resource (trending shorter, details longer) |
| Key restriction blocks local dev | Low | Add `localhost` to TMDB referrer allowlist or use a separate dev key |
| Bundle size increase | Low | Acceptable for the UX/caching benefits; can optimize later |

## Implementation Checklist

### Phase 0: Prep
- [ ] Verify `.gitignore` includes `.env*`
- [ ] Create `.env.example`
- [ ] Add `.env` locally (gitignored)

### Phase 1: Env + API Client
- [ ] Update `src/Api/APIConfig.js` to use `process.env.REACT_APP_TMDB_API_KEY`
- [ ] Create `src/api/client.js`
- [ ] Create `src/api/tmdb.js`
- [ ] Create `src/api/queryKeys.js`
- [ ] Convert `require("axios")` → `import axios from 'axios'` across files

### Phase 2: React Query Setup
- [ ] Install `@tanstack/react-query` and devtools
- [ ] Create `src/queryClient.js`
- [ ] Update `src/index.js` with `QueryClientProvider`

### Phase 3: Hooks & Migration
- [ ] Create hooks in `src/hooks/` for all resources
- [ ] Migrate `Banner.js`
- [ ] Migrate `Home.jsx` (remove setTimeouts)
- [ ] Migrate `Movies.jsx`
- [ ] Migrate `Tv Series/TvSeries.jsx`
- [ ] Migrate `InfoPage.jsx` and `TrailerSection.jsx`
- [ ] Evaluate/remediate `FilmContext` usage

### Phase 4: Polish
- [ ] Add loading skeletons/error states
- [ ] Remove console.logs
- [ ] Test all routes and refresh cases
- [ ] Build and verify
- [ ] Update README with setup instructions
