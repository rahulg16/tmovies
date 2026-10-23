import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";

import NavBar from "../../Components/Layout/NavBar/NavBar";
import Header from "../Home/Header";
import SearchResults from "../Home/SearchResults";
import useDebouncedValue from "../../hooks/useDebouncedValue";

function TvSeries() {
  const [searchParams] = useSearchParams();
  const initialTerm = searchParams.get("q") || "Dexter";
  const [searchTerm, setSearchTerm] = useState(initialTerm);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  return (
    <Box>
      <title>Search TV Series</title>
      <NavBar />
      <Header
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        title="TV Series"
      />
      <SearchResults term={debouncedSearchTerm} type="tv" />
    </Box>
  );
}

export default TvSeries;
