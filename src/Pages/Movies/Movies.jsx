import React, { useState } from "react";
import Box from "@mui/material/Box";

import NavBar from "../../Components/Layout/NavBar/NavBar";
import Header from "../Home/Header";
import SearchedMovies from "../Home/SearchedMovies";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { useSearchMovies } from "../../hooks/useSearch";

function Movies() {
  const [searchTerm, setSearchTerm] = useState("batman");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const { data, isLoading, isError, error, isFetching, refetch } =
    useSearchMovies(debouncedSearchTerm);

  return (
    <Box>
      <NavBar />
      <Header
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        title="Movies"
      />
      <SearchedMovies
        moviesArr={data?.results}
        type="movie"
        isLoading={isLoading}
        isError={isError}
        error={error}
        isFetching={isFetching}
        onRetry={() => refetch()}
      />
    </Box>
  );
}

export default Movies;
