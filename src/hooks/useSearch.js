import { useQuery } from "@tanstack/react-query";
import { fetchSearchMovies, fetchSearchTv } from "../api/tmdb";
import { queryKeys } from "../api/queryKeys";

export const SEARCH_STALE_TIME = 60 * 1000;

/**
 * Options are forwarded to `useQuery`, so a consumer can override
 * `staleTime`, `gcTime`, `enabled`, `select`, ... per call site.
 */
export const searchMoviesQuery = (keyword = "", options = {}) => ({
  queryKey: queryKeys.movies.search(keyword),
  queryFn: ({ signal }) => fetchSearchMovies(keyword.trim(), { signal }),
  enabled: !!keyword.trim(),
  staleTime: SEARCH_STALE_TIME,
  ...options,
});

export const searchTvQuery = (keyword = "", options = {}) => ({
  queryKey: queryKeys.tv.search(keyword),
  queryFn: ({ signal }) => fetchSearchTv(keyword.trim(), { signal }),
  enabled: !!keyword.trim(),
  staleTime: SEARCH_STALE_TIME,
  ...options,
});

export function useSearchMovies(keyword, options = {}) {
  return useQuery(searchMoviesQuery(keyword, options));
}

export function useSearchTv(keyword, options = {}) {
  return useQuery(searchTvQuery(keyword, options));
}
