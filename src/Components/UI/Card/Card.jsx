import React from "react";
import { Link } from "react-router-dom";
import MuiCard from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import apiConfig from "../../../api/APIConfig";

function Card({ movieInfo, type }) {
  const title = movieInfo.title || movieInfo.name;

  return (
    <MuiCard
      sx={{
        width: 220,
        mb: "6%",
        mr: "4%",
        bgcolor: "transparent",
        boxShadow: "none",
        transition: "all 0.5s",
        "&:hover": { transform: "scale(1.1)" },
      }}
    >
      <CardActionArea
        component={Link}
        to={`/${type}/${movieInfo.id}`}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <Box
          component="img"
          src={apiConfig.posterImage(movieInfo.poster_path)}
          alt={title || "Movie poster"}
          width={500}
          height={750}
          loading="lazy"
          decoding="async"
          sx={{
            width: 220,
            // The height attribute is only a hint; the box keeps the ratio.
            height: "auto",
            display: "block",
            borderRadius: "15px",
          }}
        />
        <Typography
          component="p"
          sx={{
            my: 0.5,
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {title}
        </Typography>
      </CardActionArea>
    </MuiCard>
  );
}

export default Card;
