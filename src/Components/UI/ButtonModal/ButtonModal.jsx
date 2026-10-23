import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";

import { selectPrimaryTrailer, youtubeEmbedUrl } from "../../../api/videos";
import { useFilmDetails } from "../../../hooks/useDetails";
import VideoEmbed from "../VideoEmbed/VideoEmbed";

const buttonSx = {
  borderRadius: "25px",
  fontWeight: "bold",
  textTransform: "capitalize",
  px: "25px",
  py: "8px",
  minWidth: "140px",
};

export default function ButtonModal({ BtnName, data_id, data_type }) {
  const [open, setOpen] = useState(false);

  const {
    data: film,
    isLoading,
    isError,
  } = useFilmDetails(data_type, data_id, {
    enabled: open,
  });

  const trailer = selectPrimaryTrailer(film?.videos?.results);
  const trailerSrc = trailer ? youtubeEmbedUrl(trailer.key) : "";
  const trailerTitle = trailer?.name || "Movie trailer";

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        data-id={data_id}
        data-type={data_type}
        sx={buttonSx}
      >
        {BtnName}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="trailer-dialog-title"
        fullWidth
        maxWidth="md"
      >
        <DialogTitle id="trailer-dialog-title" sx={{ pr: 6 }}>
          {BtnName}
        </DialogTitle>
        <IconButton
          aria-label="Close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          {isLoading ? (
            <Skeleton
              variant="rectangular"
              aria-hidden="true"
              sx={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "12px" }}
            />
          ) : isError ? (
            <Typography textAlign="center" sx={{ py: 6 }} color="error">
              Could not load the trailer.
            </Typography>
          ) : trailerSrc ? (
            <VideoEmbed src={trailerSrc} title={trailerTitle} />
          ) : (
            <Typography textAlign="center" sx={{ py: 6 }}>
              No trailer available.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
