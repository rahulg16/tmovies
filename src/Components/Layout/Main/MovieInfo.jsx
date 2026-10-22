import React from "react";
import "./MovieInfo.css";
import SimpleCard from "../../UI/Card/SimpleCard";
import Badge from "../../UI/Badge/Badge";
import Cast from "../../UI/Cast/Cast";

function MovieInfo({ movie }) {
  if (!movie) return null;

  return (
    <div className="movieinfo">
      <SimpleCard posterImg={movie.poster_path} />
      <div className="movieinfo-content">
        <h1>{movie.original_name || movie.original_title}</h1>

        {movie.genres !== undefined ? (
          <div className="badge-container">
            {movie.genres.map((genre) => {
              return <Badge genre={genre.name} key={genre.id} />;
            })}
          </div>
        ) : (
          ""
        )}

        <p>
          {movie.overview !== undefined ? (movie.overview.length > 530
            ? movie.overview.slice(0, 530) + "..."
            : movie.overview) : ''}
        </p>
        {movie.credits !== undefined ? <Cast cast={movie.credits.cast} /> : ""}
      </div>
    </div>
  );
}

export default MovieInfo;
