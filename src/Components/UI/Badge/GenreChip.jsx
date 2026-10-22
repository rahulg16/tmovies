import React from "react";
import Chip from "@mui/material/Chip";

function GenreChip({ genre }) {
  return (
    <Chip
      label={genre}
      variant="outlined"
      sx={{
        height: "auto",
        px: 4.25,
        py: 0.5,
        fontSize: "0.875rem",
        fontWeight: "bold",
        textTransform: "capitalize",
        color: "#FFFFFF",
        bgcolor: "rgba(0, 0, 0, 0.642)",
        border: "3px solid #FFFFFF",
        borderRadius: "20px",
      }}
    />
  );
}

export default GenreChip;
