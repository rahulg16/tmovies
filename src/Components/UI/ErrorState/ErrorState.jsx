import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

function ErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
  showIcon = true,
  isRetrying = false,
  sx,
}) {
  const theme = useTheme();
  const sxEntries = (Array.isArray(sx) ? sx : [sx]).filter(Boolean);

  const fontFamily = sxEntries.reduce((found, entry) => {
    if (found) return found;
    const resolved = typeof entry === "function" ? entry(theme) : entry;
    return (resolved && resolved.fontFamily) || found;
  }, undefined);

  const childSx = fontFamily ? { fontFamily } : undefined;

  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          py: 4,
          px: 2,
          textAlign: "center",
        },
        ...sxEntries,
      ]}
    >
      {showIcon ? <ErrorOutlineIcon color="error" fontSize="large" /> : null}
      <Typography role="alert" color="error" sx={childSx}>
        {message}
      </Typography>
      {onRetry ? (
        <Button
          variant="contained"
          startIcon={
            isRetrying ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          onClick={onRetry}
          disabled={isRetrying}
          aria-busy={isRetrying || undefined}
          sx={childSx}
        >
          {isRetrying ? "Retrying..." : retryLabel}
        </Button>
      ) : null}
    </Box>
  );
}

export default ErrorState;
