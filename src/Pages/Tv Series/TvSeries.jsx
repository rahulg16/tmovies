import React, { useState } from "react";
import NavBar from "../../Components/Layout/NavBar/NavBar";
import Header from "../Home/Header";
import SearchedMovies from "../Home/SearchedMovies";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { useSearchTv } from "../../hooks/useSearch";

function TvSeries() {
  const [searchTerm, setSearchTerm] = useState("Dexter");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const { data, isLoading, isError, error, isFetching } =
    useSearchTv(debouncedSearchTerm);

  return (
    <div>
      <NavBar />
      <Header
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        title="TV Series"
      />
      <SearchedMovies
        moviesArr={data?.results}
        type="tv"
        isLoading={isLoading}
        isError={isError}
        error={error}
        isFetching={isFetching}
      />
    </div>
  );
}

export default TvSeries;
