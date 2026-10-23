import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import AsyncSection from "../../Components/UI/AsyncSection/AsyncSection";
import { searchMoviesQuery, searchTvQuery } from "../../hooks/useSearch";
import SearchedMovies from "./SearchedMovies";

function Results({ term, type }) {
  const query =
    type === "movie" ? searchMoviesQuery(term) : searchTvQuery(term);

  const { data, isFetching } = useQuery({
    ...query,
    suspense: Boolean(term.trim()),
    placeholderData: term.trim() ? keepPreviousData : undefined,
  });

  return (
    <SearchedMovies
      moviesArr={data?.results}
      type={type}
      isFetching={isFetching}
    />
  );
}

function SearchResults({ term, type }) {
  return (
    <AsyncSection
      resetKeys={[term]}
      fallback={<SearchedMovies type={type} isLoading />}
      errorFallback={({ error, retry }) => (
        <SearchedMovies type={type} isError error={error} onRetry={retry} />
      )}
    >
      <Results term={term} type={type} />
    </AsyncSection>
  );
}

export default SearchResults;
