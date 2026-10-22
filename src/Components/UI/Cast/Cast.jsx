import React from "react";
import "./Cast.css";
import apiConfig from "../../../api/APIConfig";
import Placeholder from '../../../Assets/placeholder.png'

function Cast({ cast }) {
  const castList = (cast || []).slice(0, 5);

  return (
    <div className="cast-block">
      <h2>Casts</h2>
      <div className="profiles-container">
        {castList.map((person, i) => {
          return (
            <div className="profile" key={person.id ?? i}>
              <img
                src={person.profile_path ? `${apiConfig.originalImage(person.profile_path)}` : Placeholder}
                alt=""
              />
              <p>{person.original_name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Cast;
