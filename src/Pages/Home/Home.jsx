import React from "react";
import Box from "@mui/material/Box";
import { useSuspenseQuery } from "@tanstack/react-query";

import NavBar from "../../Components/Layout/NavBar/NavBar";
import Banner from "../../Components/Layout/Main/Banner";
import {
  MoviesListContent,
  MoviesListLayout,
} from "../../Components/Layout/Main/MoviesList.jsx";
import AsyncSection from "../../Components/UI/AsyncSection/AsyncSection";
import {
  popularMoviesQuery,
  topRatedMoviesQuery,
  upcomingMoviesQuery,
} from "../../hooks/useMovieLists";
import { popularTvQuery, topRatedTvQuery } from "../../hooks/useTvLists";

function Shelf({ query, contentType }) {
  const { data } = useSuspenseQuery(query);

  return (
    <MoviesListContent contentArr={data.results} contentType={contentType} />
  );
}

function HomeShelf({ query, title, contentType }) {
  return (
    <MoviesListLayout title={title}>
      <AsyncSection
        fallback={<MoviesListContent contentType={contentType} isLoading />}
        errorFallback={({ error, retry }) => (
          <MoviesListContent
            contentType={contentType}
            isError
            error={error}
            onRetry={retry}
          />
        )}
      >
        <Shelf query={query} contentType={contentType} />
      </AsyncSection>
    </MoviesListLayout>
  );
}

function Home() {
  return (
    <Box>
      <title>T Movies</title>
      <NavBar />
      <Banner />
      <HomeShelf
        query={popularMoviesQuery()}
        title="Popular Movies"
        contentType="movie"
      />
      <HomeShelf
        query={topRatedMoviesQuery()}
        title="Top Rated Movies"
        contentType="movie"
      />
      <HomeShelf
        query={upcomingMoviesQuery()}
        title="Upcoming Movies In Theatres"
        contentType="movie"
      />
      <HomeShelf query={popularTvQuery()} title="Popular TV Series" contentType="tv" />
      <HomeShelf query={topRatedTvQuery()} title="Top TV Series" contentType="tv" />
    </Box>
  );
}

export default Home;
