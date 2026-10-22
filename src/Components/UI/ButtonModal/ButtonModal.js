import * as React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { useFilmDetails } from "../../../hooks/useDetails";
import './ButtonModal.css'

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 650,
  height: 350,
  bgcolor: "black",
  boxShadow: 24,
  p: 4,
};

const btnStyle = {
  bgcolor: "red",
  borderRadius: "25px",
  color: "white",
  fontWeight: "bold",
  textTransform: "capitalize",
  padding: "8px 25px",
  minWidth: "140px",
};

export default function ButtonModal({ BtnName, data_id, data_type }) {
  const [open, setOpen] = useState(false);

  const { data: film, isLoading, isError } = useFilmDetails(data_type, data_id, {
    enabled: open,
  });

  const trailerKey = film?.videos?.results?.[0]?.key || "";

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button
        onClick={handleOpen}
        data-id={data_id}
        data-type={data_type}
        sx={btnStyle}
        selected
        className="trailer-btn"
      >
        {BtnName}
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          {isLoading ? (
            <p className="trailer-status">Loading trailer...</p>
          ) : isError ? (
            <p className="trailer-status">Could not load the trailer.</p>
          ) : trailerKey ? (
            <iframe
              width="650"
              height="350"
              src={`https://www.youtube.com/embed/${trailerKey}`}
              title="YouTube video player"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          ) : (
            <p className="trailer-status">No trailer available.</p>
          )}
        </Box>
      </Modal>
    </div>
  );
}
