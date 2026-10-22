import React from "react";
import "./Card.css";
import { Link } from "react-router-dom";
import Placeholder from "../../../Assets/placeholder.png";
import apiConfig from "../../../api/APIConfig";

function Card({ movieInfo, type }) {
  return (
    <div className="card">
      <Link to={`/${type}/${movieInfo.id}`} className="card-link">
        <img
          src={
            movieInfo.poster_path !== null
              ? `${apiConfig.originalImage(movieInfo.poster_path)}`
              : Placeholder
          }
          alt={`${movieInfo.title || movieInfo.name} poster-img`}
          className="card-img"
        />
        <p className="card-name">{movieInfo.title || movieInfo.name}</p>
      </Link>
    </div>
  );
}

export default Card;
