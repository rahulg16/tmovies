import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import NavBar from "../../Components/Layout/NavBar/NavBar";
import apiConfig from "../../api/APIConfig";
import { selectTrailerList } from "../../api/videos";
import ErrorState from "../../Components/UI/ErrorState/ErrorState";
import MovieInfo from "../../Components/Layout/Main/MovieInfo";
import TrailerSection from "./TrailerSection";
import MoviesList from "../../Components/Layout/Main/MoviesList";
import { useFilmDetails, useSimilarFilms } from "../../hooks/useDetails";
import { FONT_STACK_ALT, visuallyHiddenSx } from "../../theme";

function DetailsSkeleton() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 4,
        width: { xs: "100%", md: "70%" },
        mx: "auto",
      }}
    >
      <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
        <Skeleton
          variant="rectangular"
          sx={{
            width: { sm: "18vw" },
            minWidth: 150,
            height: "auto",
            aspectRatio: "2 / 3",
            borderRadius: "15px",
          }}
        />
      </Box>

      <Box sx={{ width: { xs: "100%", sm: "70%" } }}>
        <Skeleton
          variant="text"
          width="60%"
          sx={{
            transform: "none",
            height: { xs: 34, md: 42 },
            borderRadius: "6px",
          }}
        />

        <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ py: 2.25 }}>
          <Skeleton
            variant="rounded"
            width={90}
            height={34}
            sx={{ borderRadius: "20px" }}
          />
          <Skeleton
            variant="rounded"
            width={120}
            height={34}
            sx={{ borderRadius: "20px" }}
          />
          <Skeleton
            variant="rounded"
            width={70}
            height={34}
            sx={{ borderRadius: "20px" }}
          />
        </Stack>

        <Stack spacing={1}>
          <Skeleton
            variant="text"
            width="100%"
            sx={{ transform: "none", height: 18, borderRadius: "4px" }}
          />
          <Skeleton
            variant="text"
            width="100%"
            sx={{ transform: "none", height: 18, borderRadius: "4px" }}
          />
          <Skeleton
            variant="text"
            width="80%"
            sx={{ transform: "none", height: 18, borderRadius: "4px" }}
          />
        </Stack>
      </Box>
    </Box>
  );
}

function InfoPage({ type }) {
  const { id } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id, type]);

  const {
    data: film,
    isLoading: isLoadingFilm,
    isFetching: isFetchingFilm,
    isError: isErrorFilm,
    error: filmError,
    refetch: refetchFilm,
  } = useFilmDetails(type, id);

  const {
    data: similar,
    isLoading: isLoadingSimilar,
    isError: isErrorSimilar,
    error: similarError,
    refetch: refetchSimilar,
  } = useSimilarFilms(type, id);

  // A trailer from another site cannot be played here, and a film without a
  // `videos` object must not break the page.
  const trailerList = selectTrailerList(film?.videos?.results);

  // The details of the film that was asked for, not the ones that were
  // loaded before the page moved on to another film.
  const filmMatchesRoute = film != null && Number(film.id) === Number(id);
  const isShowingSkeleton = !isErrorFilm && (isLoadingFilm || !filmMatchesRoute);

  return (
    <Box sx={{ minHeight: "100vh", color: "white" }}>
      <NavBar />

      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "80vh", md: "90vh" },
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          pt: { xs: 8, md: 10 },
          pb: 6,
        }}
      >
        {film?.backdrop_path ? (
          <Box
            component="img"
            src={apiConfig.backdropImage(film.backdrop_path)}
            alt=""
            aria-hidden="true"
            width={1920}
            height={1080}
            decoding="async"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
            }}
          />
        ) : null}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 60%, #0E0E0E 100%)",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 2, width: "100%", px: { xs: 2, md: 5 } }}>
          {isShowingSkeleton ? (
            <>
              <Typography
                component="span"
                role="status"
                aria-live="polite"
                sx={visuallyHiddenSx}
              >
                Loading details...
              </Typography>
              <DetailsSkeleton />
            </>
          ) : isErrorFilm ? (
            <ErrorState
              message={filmError?.message || "Could not load this title."}
              onRetry={() => refetchFilm()}
              sx={{ fontFamily: FONT_STACK_ALT, py: 6 }}
            />
          ) : (
            <>
              {isFetchingFilm ? (
                <Typography
                  component="span"
                  role="status"
                  aria-live="polite"
                  sx={visuallyHiddenSx}
                >
                  Updating details...
                </Typography>
              ) : null}
              <MovieInfo movie={film} />
            </>
          )}
        </Box>
      </Box>

      {trailerList.length > 0 ? <TrailerSection trailers={trailerList} /> : null}

      <MoviesList
        contentArr={similar?.results}
        title={type === "movie" ? "Similar Movies" : "Similar Tv Series"}
        contentType={type === "movie" ? "movie" : "tv"}
        isLoading={isLoadingSimilar}
        isError={isErrorSimilar}
        error={similarError}
        onRetry={() => refetchSimilar()}
      />
    </Box>
  );
}

export default InfoPage;
