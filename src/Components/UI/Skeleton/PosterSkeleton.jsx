import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

function PosterSkeleton({
  height = 260,
  width = 220,
  nameWidth = "70%",
  sx,
}) {
  return (
    <Box
      aria-hidden="true"
      sx={[{ width, flexShrink: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Skeleton
        variant="rectangular"
        height={height}
        sx={{ borderRadius: "15px" }}
      />
      <Skeleton variant="text" width={nameWidth} sx={{ mt: 1.5 }} />
    </Box>
  );
}

export default PosterSkeleton;
