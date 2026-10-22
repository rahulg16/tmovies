import React from "react";
import "./Banner.css";
import { Link } from "react-router-dom";

import SimpleCard from "../../UI/Card/SimpleCard";
import ButtonModal from "../../UI/ButtonModal/ButtonModal";
import Button from "../../UI/SimpleButton/Button";
import apiConfig from "../../../api/APIConfig";
import { useTrendingDay } from "../../../hooks/useTrending";

const selectTrending = (data) => (data?.results ?? []).slice(0, 8);

function Banner() {
  const {
    data: trendingMovies,
    isLoading,
    isError,
    error,
    refetch,
  } = useTrendingDay({ select: selectTrending });

  if (isLoading) {
    return (
      <div className="banner-layout">
        <div className="banner-content banner-content--skeleton">
          <div className="poster-img" aria-hidden="true" />
          <div className="banner">
            <div className="banner-text">
              <div className="skeleton-text skeleton-text--title" aria-hidden="true" />
              <div className="skeleton-text skeleton-text--copy" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="banner-layout banner-layout--error">
        <p>{error?.message || "Could not load trending titles."}</p>
        <button className="btn" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="banner-layout">
      {trendingMovies.map((movie, i) => {
        return (
          <div className="banner-content" key={movie.id}>
            <img
              className="poster-img"
              src={apiConfig.originalImage(movie.backdrop_path)}
              alt=""
            />
            <div className="shade"></div>

            <div className="banner">
              <div className="banner-text">
                <h1>{movie.original_title || movie.name}</h1>
                <p>{movie.overview}</p>

                <div className="action-btns">
                  <Link to={`/${movie.media_type}/${movie.id}`}>
                    <Button BtnName={"Watch Now"} />
                  </Link>

                  <ButtonModal
                    BtnName={"Watch Trailer"}
                    data_id={movie.id}
                    data_type={movie.media_type}
                  />
                </div>
              </div>
              <SimpleCard posterImg={movie.poster_path} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Banner;
