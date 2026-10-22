import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import Img from "../../Assets/high-resolution-black-background-09.jpg";

function Header({ setSearchTerm, searchTerm, title }) {
  function submitHandler(e) {
    e.preventDefault();
  }

  function changeHandler(e) {
    setSearchTerm(e.target.value);
  }

  return (
    <Box sx={{ position: "relative", width: "100%", minHeight: "85vh", overflow: "hidden" }}>
      <Box
        component="img"
        src={Img}
        alt=""
        width={1920}
        height={1080}
        decoding="async"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "85vh",
          width: "80vw",
          mx: "auto",
          // The app bar is fixed, so the content starts below it.
          pt: { xs: 11, sm: 14 },
          pb: { xs: 8, sm: 10 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{ fontSize: { xs: "2.5rem", md: "50px" }, mb: 6 }}
        >
          {title}
        </Typography>

        <Box
          component="form"
          onSubmit={submitHandler}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            width: "100%",
          }}
        >
          <TextField
            value={searchTerm}
            onChange={changeHandler}
            placeholder={`Search ${title.toLowerCase()}`}
            inputProps={{ "aria-label": `Search ${title.toLowerCase()}` }}
            sx={{
              width: { xs: "90%", sm: "40vw" },
              "& .MuiOutlinedInput-root": {
                // A fixed height keeps the field readable on short viewports.
                height: 56,
                minHeight: 56,
                alignItems: "center",
                fontSize: "18px",
                backgroundColor: "white",
                borderRadius: "10px",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ borderRadius: "12px", px: "28px", py: "10px" }}
          >
            Search
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Header;
