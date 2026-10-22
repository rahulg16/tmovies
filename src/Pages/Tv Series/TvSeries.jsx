import React, { useState } from "react";
import Box from "@mui/material/Box";

import NavBar from "../../Components/Layout/NavBar/NavBar";
import Header from "../Home/Header";
import SearchedMovies from "../Home/SearchedMovies";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { useSearchTv } from "../../hooks/useSearch";

function TvSeries() {
  const [searchTerm, setSearchTerm] = useState("Dexter");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const { data, isLoading, isError, error, isFetching, refetch } =
    useSearchTv(debouncedSearchTerm);

  return (
    <Box>
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
        onRetry={() => refetch()}
      />
    </Box>
  );
}

export default TvSeries;
