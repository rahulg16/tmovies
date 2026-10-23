import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import SimpleCard from "../../UI/Card/SimpleCard";
import ButtonModal from "../../UI/ButtonModal/ButtonModal";
import Button from "../../UI/SimpleButton/Button";
import ErrorState from "../../UI/ErrorState/ErrorState";
import apiConfig from "../../../api/APIConfig";
import { hideScrollbarSx } from "../../../theme/hideScrollbar";
import { useTrendingDay } from "../../../hooks/useTrending";

const selectTrending = (data) => (data?.results ?? []).slice(0, 8);

/** How long a slide stays on screen before the hero moves on. */
const AUTOPLAY_INTERVAL = 6000;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `window.matchMedia` is not implemented everywhere (jsdom does not have it),
 * so every use of it is guarded.
 */
const readReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches === true;
  } catch (error) {
    return false;
  }
};

function Banner() {
  const {
    data: trendingMovies,
    isLoading,
    isError,
    error,
    refetch,
  } = useTrendingDay({ select: selectTrending });

  const scrollerRef = useRef(null);
  const slideIndexRef = useRef(0);

  const [isPaused, setIsPaused] = useState(readReducedMotion);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);

  const slides = trendingMovies || [];
  const slideCount = slides.length;
  const canAutoplay = slideCount >= 2;

  // Follow the "prefers-reduced-motion" preference. A new preference stops the
  // slideshow; a user who explicitly started it keeps their choice.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    let query;

    try {
      query = window.matchMedia(REDUCED_MOTION_QUERY);
    } catch (error) {
      return undefined;
    }

    const handleChange = (event) => {
      if (event.matches) setIsPaused(true);
    };

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handleChange);
      return () => query.removeEventListener("change", handleChange);
    }

    if (typeof query.addListener === "function") {
      query.addListener(handleChange);
      return () => query.removeListener(handleChange);
    }

    return undefined;
  }, []);

  // Pause while the tab is in the background.
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentHidden(
        document.visibilityState === "hidden" || document.hidden === true
      );
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // A new set of slides starts from the first one again.
  useEffect(() => {
    slideIndexRef.current = 0;
  }, [slideCount]);

  const isRunning =
    canAutoplay &&
    !isPaused &&
    !isHovered &&
    !hasFocusWithin &&
    !isDocumentHidden;

  useEffect(() => {
    if (!isRunning) return undefined;

    const timer = setInterval(() => {
      const scroller = scrollerRef.current;

      if (!scroller || typeof scroller.scrollTo !== "function") return;

      // The width is read when the tick fires, so a resized window still
      // lands on the next slide.
      const nextIndex = (slideIndexRef.current + 1) % slideCount;
      slideIndexRef.current = nextIndex;

      scroller.scrollTo({
        left: nextIndex * scroller.clientWidth,
        behavior: "smooth",
      });
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [isRunning, slideCount]);

  const handleFocus = () => setHasFocusWithin(true);

  const handleBlur = (event) => {
    const nextFocused = event.relatedTarget;

    if (nextFocused && scrollerRef.current?.contains(nextFocused)) return;

    setHasFocusWithin(false);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "60vh", md: "80vh" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Skeleton
          variant="rectangular"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        <Box sx={{ position: "relative", width: "85%" }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="text" width="85%" />
          <Skeleton variant="text" width="75%" />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || "Could not load trending titles."}
        onRetry={() => refetch()}
        sx={{ minHeight: "60vh" }}
      />
    );
  }

  return (
    <Box
      sx={{ position: "relative", width: "100%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        ref={scrollerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Trending titles"
        onFocus={handleFocus}
        onBlur={handleBlur}
        sx={[
          {
            width: "100%",
            display: "flex",
            position: "relative",
            overflowX: "auto",
            overflowY: "hidden",
          },
          hideScrollbarSx,
        ]}
      >
        {slides.map((movie) => {
          const title = movie.original_title || movie.name;
          const backdrop = apiConfig.backdropImage(movie.backdrop_path);

          return (
            <Box
              key={movie.id}
              sx={{
                position: "relative",
                minWidth: "100%",
                py: "7vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {backdrop ? (
                <Box
                  component="img"
                  src={backdrop}
                  alt=""
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
                  backgroundColor: "rgba(0, 0, 0, 0.642)",
                  zIndex: 1,
                }}
              />

              <Box
                sx={{
                  position: "relative",
                  zIndex: 2,
                  width: "85%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Box
                  sx={{
                    width: { xs: "98%", sm: "60%" },
                    color: "white",
                    fontWeight: "bold",
                    textAlign: "justify",
                  }}
                >
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{ fontWeight: "bold", mb: 2 }}
                  >
                    {title}
                  </Typography>
                  <Typography component="p" sx={{ fontSize: "1rem" }}>
                    {movie.overview}
                  </Typography>

<Stack
                      direction="row"
                      flexWrap="wrap"
                      sx={{
                        width: { xs: "100%", sm: "80%" },
                        gap: 2,
                        mt: 2.75,
                        justifyContent: { xs: "flex-start", sm: "space-around" },
                        alignItems: "center",
                      }}
                    >
                      <Button
                        BtnName="Watch Now"
                        component="a"
                        href={`/${movie.media_type}/${movie.id}`}
                      />
                      <ButtonModal
                        BtnName="Watch Trailer"
                        data_id={movie.id}
                        data_type={movie.media_type}
                      />
                    </Stack>
                </Box>

                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <SimpleCard
                    posterImg={movie.poster_path}
                    title={title}
                    loading="eager"
                  />
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {canAutoplay ? (
        <IconButton
          aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
          aria-pressed={isPaused}
          onClick={() => setIsPaused((paused) => !paused)}
          size="small"
          sx={{
            position: "absolute",
            top: { xs: 8, sm: 12 },
            right: { xs: 8, sm: 16 },
            zIndex: 3,
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.65)" },
          }}
        >
          {isPaused ? (
            <PlayArrowIcon fontSize="small" />
          ) : (
            <PauseIcon fontSize="small" />
          )}
        </IconButton>
      ) : null}
    </Box>
  );
}

export default Banner;
