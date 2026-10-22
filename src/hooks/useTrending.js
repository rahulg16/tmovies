import { useQuery } from "@tanstack/react-query";
import { fetchTrending } from "../api/tmdb";
import { queryKeys } from "../api/queryKeys";

/**
 * Options are forwarded to `useQuery`, so a consumer can override
 * `staleTime`, `gcTime`, `enabled`, `select`, ... per call site.
 */
export const trendingDayQuery = (options = {}) => ({
  queryKey: queryKeys.trending.day(),
  queryFn: ({ signal }) => fetchTrending({ window: "day", signal }),
  staleTime: 5 * 60 * 1000,
  ...options,
});

export function useTrendingDay(options = {}) {
  return useQuery(trendingDayQuery(options));
}

export default useTrendingDay;
