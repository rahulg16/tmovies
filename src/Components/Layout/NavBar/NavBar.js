import React from "react";
import { Link } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";
import MovieIcon from "@mui/icons-material/Movie";

const sections = [
  { label: "Home", to: "/", icon: HomeIcon },
  { label: "Movies", to: "/movies", icon: MovieIcon },
  { label: "Tv Series", to: "/tv-series", icon: LiveTvIcon },
];

const linkSx = {
  color: "inherit",
  textDecoration: "none",
  borderRadius: 1,
  minWidth: 0,
  flexShrink: 0,
  px: { xs: 1, sm: 2 },
  "&:hover": { borderBottom: "4px solid #FFFFFF", borderRadius: "4px" },
};

function NavBar() {
  return (
    <AppBar
      position="fixed"
      sx={{ backgroundColor: "rgba(0, 0, 0, 0.594)" }}
    >
      <Container maxWidth="xl" sx={{ minWidth: 0 }}>
        <Toolbar
          disableGutters
          sx={{ display: "flex", justifyContent: "space-between", minWidth: 0 }}
        >
          <Box
            component={Link}
            to="/"
            aria-label="T Movies"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "inherit",
              textDecoration: "none",
              minWidth: 0,
              flexShrink: 1,
              overflow: "hidden",
            }}
          >
            <LocalMoviesIcon sx={{ flexShrink: 0 }} />
            <Typography
              variant="h2"
              component="span"
              sx={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                "@media (max-width: 360px)": { display: "none" },
              }}
            >
              T Movies
            </Typography>
          </Box>

          <List
            component="nav"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0, sm: 1 },
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            {sections.map(({ label, to, icon: Icon }) => (
              <ListItemButton
                key={label}
                component={Link}
                to={to}
                aria-label={label}
                sx={linkSx}
              >
                <Icon sx={{ mr: { xs: 0, sm: 1 }, fontSize: 20 }} />
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    component: "span",
                    fontWeight: "bold",
                  }}
                  sx={{ display: { xs: "none", sm: "block" } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default NavBar;
