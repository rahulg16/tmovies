import React from "react";
import "./MoviesList.css";
import apiConfig from "../../../api/APIConfig";
import { Link } from "react-router-dom";

function MoviesList({ contentArr, title, contentType, isLoading, isError, error }) {
  const items = contentArr || [];

  return (
    <div className="content-container">
      <h1 className="category-title">{title}</h1>

      {isLoading ? (
        <div className="content-slider">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="content-link" key={index}>
              <div className="content">
                <div className="content-poster content-poster--skeleton" />
                <div className="content-name content-name--skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="content-error">{error?.message || "Could not load this list."}</p>
      ) : (
        <div className="content-slider">
          {items.map((content, i) => {
            return (
              <Link
                to={`/${contentType}/${content.id}`}
                className={"content-link"}
                key={content.id ?? i}
              >
                <div className="content">
                  <img
                    src={apiConfig.originalImage(content.poster_path)}
                    alt="poster-img"
                    className="content-poster"
                  />
                  <h3 className="content-name">
                    {content.name || content.original_name || content.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MoviesList;
