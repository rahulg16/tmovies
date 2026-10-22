import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

import { youtubeKeyFromSrc, youtubeWatchUrl } from "../../../api/videos";
import { visuallyHiddenSx } from "../../../theme/visuallyHidden";

export const VIDEO_LOAD_TIMEOUT = 10000;

const ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

const STATUS = {
  LOADING: "loading",
  READY: "ready",
  DELAYED: "delayed",
  ERROR: "error",
};

function VideoEmbed({ src, title = "Video player", loading = "lazy", sx }) {
  const [status, setStatus] = useState(src ? STATUS.LOADING : STATUS.ERROR);
  const [loadedSrc, setLoadedSrc] = useState(src);
  const timerRef = useRef(null);
  const frameRef = useRef(null);

  // A different video means a different load, so start over.
  if (loadedSrc !== src) {
    setLoadedSrc(src);
    setStatus(src ? STATUS.LOADING : STATUS.ERROR);
  }

  useEffect(() => {
    if (!src) return undefined;

    // A player that never reports back must not block the page for ever.
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setStatus((current) =>
        current === STATUS.LOADING ? STATUS.DELAYED : current
      );
    }, VIDEO_LOAD_TIMEOUT);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [src]);

  // React does not listen for the error of an iframe, so the player is
  // watched directly.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const handleError = () => setStatus(STATUS.ERROR);
    frame.addEventListener("error", handleError);

    return () => frame.removeEventListener("error", handleError);
  }, [src]);

  const handleLoad = () => setStatus(STATUS.READY);

  const hasSrc = typeof src === "string" && src.trim().length > 0;
  const watchUrl = hasSrc ? youtubeWatchUrl(youtubeKeyFromSrc(src)) || src : "";

  return (
    <Box
      sx={[
        {
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          bgcolor: "black",
          borderRadius: "12px",
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {hasSrc ? (
        <Box
          component="iframe"
          ref={frameRef}
          src={src}
          title={title}
          allow={ALLOW}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading={loading}
          onLoad={handleLoad}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      ) : null}

      {status === STATUS.LOADING ? (
        <>
          <Typography
            component="span"
            role="status"
            aria-live="polite"
            sx={visuallyHiddenSx}
          >
            Loading video…
          </Typography>
          <Skeleton
            data-testid="video-embed-skeleton"
            variant="rectangular"
            aria-hidden="true"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius: "12px",
            }}
          />
        </>
      ) : null}

      {status === STATUS.DELAYED ? (
        <Box
          sx={{
            position: "absolute",
            left: 8,
            bottom: 8,
            zIndex: 2,
            maxWidth: "calc(100% - 16px)",
            px: 1,
            py: 0.5,
            borderRadius: "6px",
            bgcolor: "rgba(0, 0, 0, 0.65)",
          }}
        >
          <Link
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: "white", fontSize: "0.85rem" }}
          >
            Open on YouTube
          </Link>
        </Box>
      ) : null}

      {status === STATUS.ERROR ? (
        <Box
          role="alert"
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            bgcolor: "black",
            p: 2,
          }}
        >
          <Typography color="error" textAlign="center">
            This video could not be loaded.
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

export default VideoEmbed;
