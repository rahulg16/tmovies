import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";

import NavBar from "../../Components/Layout/NavBar/NavBar";
import Header from "../Home/Header";
import SearchResults from "../Home/SearchResults";
import useDebouncedValue from "../../hooks/useDebouncedValue";

function Movies() {
  const [searchParams] = useSearchParams();
  const initialTerm = searchParams.get("q") || "batman";
  const [searchTerm, setSearchTerm] = useState(initialTerm);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  return (
    <Box>
      <title>Search Movies</title>
      <NavBar />
      <Header
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        title="Movies"
      />
      <SearchResults term={debouncedSearchTerm} type="movie" />
    </Box>
  );
}

export default Movies;
