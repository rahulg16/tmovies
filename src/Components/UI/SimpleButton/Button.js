import React from "react";
import MuiButton from "@mui/material/Button";

function Button({ BtnName, sx, ...rest }) {
  const baseSx = {
    minWidth: 142,
    px: 3.75,
    py: 1.5,
    borderRadius: "25px",
    fontWeight: 700,
    transition: "0.5s",
    "&:hover": {
      backgroundColor: "#FFFFFF",
      color: "primary.main",
      transform: "scale(1.1)",
    },
    "&:active": {
      transform: "scale(0.98)",
    },
  };

  return (
    <MuiButton
      variant="contained"
      color="primary"
      {...rest}
      sx={[baseSx, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {BtnName}
    </MuiButton>
  );
}

export default Button;
