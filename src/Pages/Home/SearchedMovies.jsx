import React from "react";
import "./SearchedMovies.css";
import Card from "../../Components/UI/Card/Card";

function SearchedMovies({ moviesArr, type, isLoading, isError, error, isFetching }) {
  const movies = moviesArr || [];

  if (isLoading) {
    return (
      <div className="searched-movies__container">
        {Array.from({ length: 10 }).map((_, index) => (
          <div className="card card--skeleton" key={index}>
            <div className="card-img card-img--skeleton" />
            <p className="card-name card-name--skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="searched-movies__container">
        <p className="searched-movies__error">
          {error?.message || "Could not load the results."}
        </p>
      </div>
    );
  }

  return (
    <div className="searched-movies__container">
      {movies.map((movie, i) => {
        return <Card movieInfo={movie} type={type} key={movie.id ?? i} />;
      })}
      {isFetching ? <p className="searched-movies__hint">Updating results...</p> : null}
    </div>
  );
}

export default SearchedMovies;
