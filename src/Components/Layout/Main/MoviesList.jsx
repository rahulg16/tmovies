import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import apiConfig from "../../../api/APIConfig";
import ErrorState from "../../UI/ErrorState/ErrorState";
import PosterSkeleton from "../../UI/Skeleton/PosterSkeleton";
import { FONT_STACK_ALT } from "../../../theme";
import { hideScrollbarSx } from "../../../theme/hideScrollbar";

const rowSx = {
  display: "flex",
  alignItems: "center",
  height: "60vh",
  pl: "20px",
  overflowX: "auto",
};

function MoviesList({
  contentArr,
  title,
  contentType,
  isLoading,
  isError,
  error,
  onRetry,
}) {
  const items = contentArr || [];

  return (
    <Box sx={{ color: "white", width: "90vw", mx: "auto", my: "55px" }}>
      <Typography
        variant="h2"
        component="h2"
        sx={{ fontFamily: FONT_STACK_ALT, fontSize: "22px", mb: 1 }}
      >
        {title}
      </Typography>

      {isLoading ? (
        <Box sx={{ ...rowSx, gap: 4, overflowX: "hidden" }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <PosterSkeleton
              key={index}
              height={260}
              width="13vw"
              sx={{ minWidth: 120 }}
            />
          ))}
        </Box>
      ) : isError ? (
        <ErrorState
          message={error?.message || "Could not load this list."}
          onRetry={onRetry}
          sx={{ fontFamily: FONT_STACK_ALT }}
        />
      ) : (
        <Box sx={[rowSx, hideScrollbarSx]}>
          {items.map((content, i) => {
            const name =
              content.name || content.original_name || content.title;

            return (
              <Box
                component="a"
                href={`/${contentType}/${content.id}`}
                key={content.id ?? i}
                sx={{
                  mr: "4%",
                  color: "white",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transition: "all 0.5s",
                    "&:hover": { transform: "scale(1.1)", zIndex: 2 },
                  }}
                >
                  <Box
                    component="img"
                    src={apiConfig.posterImage(content.poster_path)}
                    alt={name || "Movie poster"}
                    width={500}
                    height={750}
                    loading="lazy"
                    decoding="async"
                    sx={{
                      maxWidth: "13vw",
                      minWidth: 120,
                      // The height attribute is only a hint; the box keeps
                      // the ratio.
                      height: "auto",
                      display: "block",
                      borderRadius: "15px",
                    }}
                  />
                  <Typography
                    variant="h3"
                    component="h3"
                    sx={{
                      fontFamily: FONT_STACK_ALT,
                      fontSize: "15px",
                      mt: "4px",
                      textAlign: "center",
                    }}
                  >
                    {name}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default MoviesList;
