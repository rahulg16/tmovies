import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import SimpleCard from "../../UI/Card/SimpleCard";
import Cast from "../../UI/Cast/Cast";
import GenreChip from "../../UI/Badge/GenreChip";

function MovieInfo({ movie }) {
  if (!movie) return null;

  const overview =
    movie.overview !== undefined
      ? movie.overview.length > 530
        ? `${movie.overview.slice(0, 530)}...`
        : movie.overview
      : null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 4,
        width: { xs: "100%", md: "70%" },
        mx: "auto",
        color: "white",
      }}
    >
      <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
        <SimpleCard
          posterImg={movie.poster_path}
          title={movie.original_name || movie.original_title}
        />
      </Box>

      <Box sx={{ width: { xs: "100%", sm: "70%" }, textAlign: "justify" }}>
        <Typography variant="h1" component="h1" sx={{ fontWeight: "bold" }}>
          {movie.original_name || movie.original_title}
        </Typography>

        {movie.genres !== undefined ? (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1.5}
            sx={{ py: 2.25, width: "100%" }}
          >
            {movie.genres.map((genre) => (
              <GenreChip genre={genre.name} key={genre.id} />
            ))}
          </Stack>
        ) : null}

        {overview !== null ? (
          <Typography component="p">{overview}</Typography>
        ) : null}

        {movie.credits !== undefined ? (
          <Cast cast={movie.credits.cast} />
        ) : null}
      </Box>
    </Box>
  );
}

export default MovieInfo;
