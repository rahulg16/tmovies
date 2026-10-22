import React from 'react'
import './SimpleCard.css'
import apiConfig from '../../../api/APIConfig'

function SimpleCard({posterImg}) {
  return (
    <div className="simple-card">
      <img
        src={apiConfig.originalImage(posterImg)}
        alt="posterImage"
      />
    </div>
  );
}

export default SimpleCard
