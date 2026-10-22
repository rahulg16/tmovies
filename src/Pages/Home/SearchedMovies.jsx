import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import Card from "../../Components/UI/Card/Card";
import ErrorState from "../../Components/UI/ErrorState/ErrorState";
import PosterSkeleton from "../../Components/UI/Skeleton/PosterSkeleton";
import { FONT_STACK_ALT } from "../../theme";

const gridSx = {
  px: "8%",
  py: "5%",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))",
  justifyItems: "center",
  gap: 4,
};

function SearchedMovies({
  moviesArr,
  type,
  isLoading,
  isError,
  error,
  isFetching,
  onRetry,
}) {
  const movies = moviesArr || [];

  if (isLoading) {
    return (
      <Box sx={{ ...gridSx, gap: 4 }}>
        {Array.from({ length: 10 }).map((_, index) => (
          <PosterSkeleton key={index} height={320} width={220} />
        ))}
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ px: "8%", py: "5%" }}>
        <ErrorState
          message={error?.message || "Could not load the results."}
          onRetry={onRetry}
          isRetrying={Boolean(isFetching)}
        />
      </Box>
    );
  }

  if (movies.length === 0 && !isFetching) {
    return (
      <Box sx={gridSx}>
        <Box
          role="status"
          sx={{
            gridColumn: "1 / -1",
            width: "100%",
            textAlign: "center",
            py: 4,
          }}
        >
          <Typography
            variant="h3"
            component="h3"
            sx={{ fontFamily: FONT_STACK_ALT, color: "text.primary" }}
          >
            No results found.
          </Typography>
          <Typography
            variant="body1"
            component="p"
            sx={{ fontFamily: FONT_STACK_ALT, color: "text.secondary", mt: 1 }}
          >
            Try a different search term.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={gridSx}>
      {movies.map((movie, i) => (
        <Card movieInfo={movie} type={type} key={movie.id ?? i} />
      ))}
      {isFetching ? (
        <Typography
          component="span"
          sx={{
            gridColumn: "1 / -1",
            width: "100%",
            color: "text.secondary",
            fontSize: "0.85rem",
            fontFamily: FONT_STACK_ALT,
          }}
        >
          Updating results...
        </Typography>
      ) : null}
    </Box>
  );
}

export default SearchedMovies;
