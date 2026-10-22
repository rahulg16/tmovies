import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetails, fetchSimilarMovies, fetchSimilarTv, fetchTvDetails } from "../api/tmdb";
import { queryKeys } from "../api/queryKeys";

export const DETAILS_STALE_TIME = 10 * 60 * 1000;

/**
 * Options are forwarded to `useQuery`, so a consumer can override
 * `staleTime`, `gcTime`, `enabled`, `select`, ... per call site.
 */
export const movieDetailsQuery = (id, options = {}) => ({
  queryKey: queryKeys.movies.details(id),
  queryFn: ({ signal }) => fetchMovieDetails(id, { signal }),
  enabled: !!id,
  staleTime: DETAILS_STALE_TIME,
  ...options,
});

export const tvDetailsQuery = (id, options = {}) => ({
  queryKey: queryKeys.tv.details(id),
  queryFn: ({ signal }) => fetchTvDetails(id, { signal }),
  enabled: !!id,
  staleTime: DETAILS_STALE_TIME,
  ...options,
});

export const similarMoviesQuery = (id, options = {}) => ({
  queryKey: queryKeys.movies.similar(id),
  queryFn: ({ signal }) => fetchSimilarMovies(id, { signal }),
  enabled: !!id,
  staleTime: DETAILS_STALE_TIME,
  ...options,
});

export const similarTvQuery = (id, options = {}) => ({
  queryKey: queryKeys.tv.similar(id),
  queryFn: ({ signal }) => fetchSimilarTv(id, { signal }),
  enabled: !!id,
  staleTime: DETAILS_STALE_TIME,
  ...options,
});

export function useMovieDetails(id, options = {}) {
  return useQuery(movieDetailsQuery(id, options));
}

export function useTvDetails(id, options = {}) {
  return useQuery(tvDetailsQuery(id, options));
}

export function useSimilarMovies(id, options = {}) {
  return useQuery(similarMoviesQuery(id, options));
}

export function useSimilarTv(id, options = {}) {
  return useQuery(similarTvQuery(id, options));
}

/**
 * Type aware variants, so a single component can pick the right resource
 * without calling hooks conditionally.
 */
export function useFilmDetails(type, id, options = {}) {
  const query = type === "tv" ? tvDetailsQuery(id, options) : movieDetailsQuery(id, options);
  return useQuery(query);
}

export function useSimilarFilms(type, id, options = {}) {
  const query = type === "tv" ? similarTvQuery(id, options) : similarMoviesQuery(id, options);
  return useQuery(query);
}
