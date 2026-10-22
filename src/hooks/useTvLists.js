import { useQuery } from "@tanstack/react-query";
import { fetchPopularTv, fetchTopRatedTv } from "../api/tmdb";
import { queryKeys } from "../api/queryKeys";
import { LIST_STALE_TIME } from "./useMovieLists";

/**
 * Options are forwarded to `useQuery`, so a consumer can override
 * `staleTime`, `gcTime`, `enabled`, `select`, ... per call site.
 */
export const popularTvQuery = (options = {}) => ({
  queryKey: queryKeys.tv.popular(),
  queryFn: ({ signal }) => fetchPopularTv({ signal }),
  staleTime: LIST_STALE_TIME,
  ...options,
});

export const topRatedTvQuery = (options = {}) => ({
  queryKey: queryKeys.tv.topRated(),
  queryFn: ({ signal }) => fetchTopRatedTv({ signal }),
  staleTime: LIST_STALE_TIME,
  ...options,
});

export function usePopularTv(options = {}) {
  return useQuery(popularTvQuery(options));
}

export function useTopRatedTv(options = {}) {
  return useQuery(topRatedTvQuery(options));
}
