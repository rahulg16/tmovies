# tmovies

A React app for browsing movies and TV series, powered by the [TMDB API](https://www.themoviedb.org/documentation/api) and **@tanstack/react-query**.

## Features

- Trending banner, popular / top rated / upcoming lists, all fetched in parallel and cached by React Query.
- Movie and TV search with a debounced input, so typing does not spam the API.
- Detail pages with cast, trailers and similar titles, driven by route params (`/movie/:id`, `/tv/:id`).
- Loading skeletons and error states for every data-driven section.

## Getting started

```bash
npm install
```

### 1. Add your TMDB API key

Create a key at [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api), then:

```bash
cp .env.example .env
```

```env
REACT_APP_TMDB_API_KEY=YOUR_TMDB_API_KEY_HERE
```

`.env` is gitignored — never commit your key. In development the app fails fast with a clear error when the key is missing.

### 2. Run the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Runs the app in development mode. |
| `npm test` | Launches the test runner in watch mode. |
| `npm run build` | Builds the production bundle into `build/`. |
| `npm run deploy` | Builds and publishes `build/` to GitHub Pages (`gh-pages`). |
| `npm run eject` | One-way operation, removes the build config. |

## Deployment

The key is injected **at build time**, so the deployed bundle already contains it.

| Method | How the key is injected | New key needed? |
|---|---|---|
| `npm run build` + `npm run deploy` (local) | Built from your local `.env` | No |
| GitHub Actions → GitHub Pages | Repository secret `REACT_APP_TMDB_API_KEY` exposed to the build step | No |
| Forks | Each fork can use its own secret | Only for separate quotas |

Example workflow step:

```yaml
- name: Build
  run: npm run build
  env:
    REACT_APP_TMDB_API_KEY: ${{ secrets.REACT_APP_TMDB_API_KEY }}
```

### Security notes

- A static CRA build ships the key in the bundled JS, so it can be extracted by anyone. This is unavoidable without a backend.
- Restrict the key in TMDB by HTTP referrer (`rahulg16.github.io/*` and `localhost:*` for development). This is the most effective mitigation.
- If the key was ever committed to git history, regenerate it in TMDB.

## Project structure

```
src/
├── api/
│   ├── APIConfig.js   # env based config (base urls, image helpers)
│   ├── client.js      # fetch wrapper: base url, timeout, error normalisation
│   ├── endpoints.js   # TMDB path builders
│   ├── queryKeys.js   # centralised query key factory
│   └── tmdb.js        # one function per endpoint, returns data
├── hooks/
│   ├── useDebouncedValue.js
│   ├── useDetails.js      # useMovieDetails, useTvDetails, useSimilar*
│   ├── useMovieLists.js   # usePopularMovies, useUpcomingMovies, useTopRatedMovies
│   ├── useSearch.js       # useSearchMovies, useSearchTv
│   ├── useTrending.js     # useTrendingDay
│   └── useTvLists.js      # usePopularTv, useTopRatedTv
├── queryClient.js   # shared QueryClient with default cache options
├── Components/
└── Pages/
```

Every hook forwards the options it receives to `useQuery`, so a consumer can override `staleTime`, `gcTime`, `enabled`, `select`, ... per call site:

```jsx
const { data } = usePopularMovies({
  staleTime: 60 * 1000,
  select: (data) => data.results.slice(0, 10),
});
```
