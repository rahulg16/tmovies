import React from "react";
import Box from "@mui/material/Box";

import apiConfig from "../../../api/APIConfig";

function SimpleCard({ posterImg, title, loading = "lazy" }) {
  return (
    <Box
      component="img"
      alt={title || "Movie poster"}
      src={apiConfig.posterImage(posterImg)}
      width={500}
      height={750}
      loading={loading}
      decoding="async"
      sx={{
        width: "18vw",
        minWidth: 150,
        // The height attribute is only a hint; the box keeps the ratio.
        height: "auto",
        display: "block",
        borderRadius: "15px",
        transition: "all 0.5s",
        "&:hover": { transform: "scale(1.1)" },
      }}
    />
  );
}

export default SimpleCard;
