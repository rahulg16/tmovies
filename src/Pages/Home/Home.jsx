import React from "react";
import Box from "@mui/material/Box";
import { useQueries } from "@tanstack/react-query";

import NavBar from "../../Components/Layout/NavBar/NavBar";
import Banner from "../../Components/Layout/Main/Banner";
import MoviesList from "../../Components/Layout/Main/MoviesList.jsx";
import {
  popularMoviesQuery,
  topRatedMoviesQuery,
  upcomingMoviesQuery,
} from "../../hooks/useMovieLists";
import { popularTvQuery, topRatedTvQuery } from "../../hooks/useTvLists";

function Home() {
  const [popularMovies, topRatedMovies, upcomingMovies, popularTv, topTv] =
    useQueries({
      queries: [
        popularMoviesQuery(),
        topRatedMoviesQuery(),
        upcomingMoviesQuery(),
        popularTvQuery(),
        topRatedTvQuery(),
      ],
    });

  return (
    <Box>
      <NavBar />
      <Banner />
      <MoviesList
        contentArr={popularMovies.data?.results}
        title={"Popular Movies"}
        contentType={"movie"}
        isLoading={popularMovies.isLoading}
        isError={popularMovies.isError}
        error={popularMovies.error}
        onRetry={() => popularMovies.refetch()}
      />
      <MoviesList
        contentArr={topRatedMovies.data?.results}
        title={"Top Rated Movies"}
        contentType={"movie"}
        isLoading={topRatedMovies.isLoading}
        isError={topRatedMovies.isError}
        error={topRatedMovies.error}
        onRetry={() => topRatedMovies.refetch()}
      />
      <MoviesList
        contentArr={upcomingMovies.data?.results}
        title={"Upcoming Movies In Theatres"}
        contentType={"movie"}
        isLoading={upcomingMovies.isLoading}
        isError={upcomingMovies.isError}
        error={upcomingMovies.error}
        onRetry={() => upcomingMovies.refetch()}
      />
      <MoviesList
        contentArr={popularTv.data?.results}
        title={"Popular TV Series"}
        contentType={"tv"}
        isLoading={popularTv.isLoading}
        isError={popularTv.isError}
        error={popularTv.error}
        onRetry={() => popularTv.refetch()}
      />
      <MoviesList
        contentArr={topTv.data?.results}
        title={"Top TV Series"}
        contentType={"tv"}
        isLoading={topTv.isLoading}
        isError={topTv.isError}
        error={topTv.error}
        onRetry={() => topTv.refetch()}
      />
    </Box>
  );
}

export default Home;
