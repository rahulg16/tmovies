import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import apiConfig from "../../../api/APIConfig";

function Cast({ cast }) {
  const castList = (cast || []).slice(0, 5);

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography variant="h2" component="h2" sx={{ my: 1.25 }}>
        Casts
      </Typography>
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="space-around"
        alignItems="center"
        sx={{ width: "100%" }}
      >
        {castList.map((person, i) => (
          <Box
            key={person.id ?? i}
            sx={{
              width: 120,
              height: 180,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box
              component="img"
              alt={person.original_name || person.name || "Cast member"}
              src={apiConfig.posterImage(person.profile_path)}
              width={500}
              height={750}
              loading="lazy"
              decoding="async"
              sx={{
                width: 80,
                height: 120,
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <Typography component="span" sx={{ mt: 0.75, fontSize: "12px" }}>
              {person.original_name}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default Cast;
