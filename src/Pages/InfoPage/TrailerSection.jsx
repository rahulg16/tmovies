import React from "react";
import "./TrailerSection.css";

function TrailerSection({ trailers }) {
  const trailerList = trailers || [];

  return (
    <div className="trailer-container">
      {trailerList.map((trailer, i) => {
        return (
          <div className="yt-video" key={trailer.key ?? i}>
            <h2>{trailer.name}</h2>
            <iframe
              className="responsive-iframe"
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title="YouTube video player"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        );
      })}
    </div>
  );
}

export default TrailerSection;
