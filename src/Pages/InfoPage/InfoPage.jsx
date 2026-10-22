import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import "./InfoPage.css";
import NavBar from "../../Components/Layout/NavBar/NavBar";
import apiConfig from "../../api/APIConfig";
import MovieInfo from "../../Components/Layout/Main/MovieInfo";
import TrailerSection from "./TrailerSection";
import MoviesList from "../../Components/Layout/Main/MoviesList";
import { useFilmDetails, useSimilarFilms } from "../../hooks/useDetails";

function InfoPage({ type }) {
  const { id } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id, type]);

  const {
    data: film,
    isLoading: isLoadingFilm,
    isError: isErrorFilm,
    error: filmError,
  } = useFilmDetails(type, id);

  const {
    data: similar,
    isLoading: isLoadingSimilar,
    isError: isErrorSimilar,
    error: similarError,
  } = useSimilarFilms(type, id);

  return (
    <div className="info-page">
      <NavBar />

      <div className="info-page__banner">
        <img
          src={apiConfig.originalImage(film?.backdrop_path)}
          className="info-page__img"
          alt="poster-img"
        />
        <div className="dark-shade"></div>
      </div>

      {isLoadingFilm ? (
        <p className="info-page__status">Loading details...</p>
      ) : isErrorFilm ? (
        <p className="info-page__status info-page__status--error">
          {filmError?.message || "Could not load this title."}
        </p>
      ) : (
        <MovieInfo movie={film} />
      )}

      {film?.videos !== undefined ? (
        <TrailerSection trailers={film.videos.results} />
      ) : (
        ""
      )}

      <MoviesList
        contentArr={similar?.results}
        title={type === "movie" ? "Similar Movies" : "Similar Tv Series"}
        contentType={type === "movie" ? "movie" : "tv"}
        isLoading={isLoadingSimilar}
        isError={isErrorSimilar}
        error={similarError}
      />
    </div>
  );
}

export default InfoPage;
