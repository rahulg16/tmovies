import { useQuery } from "@tanstack/react-query";
import { fetchPopularMovies, fetchTopRatedMovies, fetchUpcomingMovies } from "../api/tmdb";
import { queryKeys } from "../api/queryKeys";

export const LIST_STALE_TIME = 10 * 60 * 1000;

/**
 * Options are forwarded to `useQuery`, so a consumer can override
 * `staleTime`, `gcTime`, `enabled`, `select`, ... per call site.
 */
export const popularMoviesQuery = (options = {}) => ({
  queryKey: queryKeys.movies.popular(),
  queryFn: ({ signal }) => fetchPopularMovies({ signal }),
  staleTime: LIST_STALE_TIME,
  ...options,
});

export const upcomingMoviesQuery = (options = {}) => ({
  queryKey: queryKeys.movies.upcoming(),
  queryFn: ({ signal }) => fetchUpcomingMovies({ signal }),
  staleTime: LIST_STALE_TIME,
  ...options,
});

export const topRatedMoviesQuery = (options = {}) => ({
  queryKey: queryKeys.movies.topRated(),
  queryFn: ({ signal }) => fetchTopRatedMovies({ signal }),
  staleTime: LIST_STALE_TIME,
  ...options,
});

export function usePopularMovies(options = {}) {
  return useQuery(popularMoviesQuery(options));
}

export function useUpcomingMovies(options = {}) {
  return useQuery(upcomingMoviesQuery(options));
}

export function useTopRatedMovies(options = {}) {
  return useQuery(topRatedMoviesQuery(options));
}
