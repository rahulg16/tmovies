import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { selectTrailerList, youtubeEmbedUrl } from "../../api/videos";
import VideoEmbed from "../../Components/UI/VideoEmbed/VideoEmbed";

function TrailerSection({ trailers }) {
  const trailerList = selectTrailerList(trailers);

  // No playable trailer means no section at all, rather than an empty one.
  if (trailerList.length === 0) return null;

  return (
    <Box sx={{ width: "90vw", mx: "auto" }}>
      {trailerList.map((trailer) => (
        <Box
          key={`${trailer.site}-${trailer.key}`}
          sx={{ color: "white", my: "5%" }}
        >
          <Typography variant="h2" component="h2" sx={{ fontWeight: "bold" }}>
            {trailer.name || "Trailer"}
          </Typography>
          <VideoEmbed
            src={youtubeEmbedUrl(trailer.key)}
            title={trailer.name || "Video player"}
          />
        </Box>
      ))}
    </Box>
  );
}

export default TrailerSection;
