import { createTheme } from "@mui/material/styles";

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', " +
  "'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

export const FONT_STACK_ALT = "Verdana, Geneva, Tahoma, sans-serif";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0E0E0E",
      paper: "#000000",
    },
    primary: {
      main: "#FF0000",
      // MUI would otherwise auto-compute black for this red.
      contrastText: "#FFFFFF",
    },
    error: { main: "#FF8080" },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0",
    },
    divider: "rgba(255,255,255,0.12)",
  },
  typography: {
    fontFamily: FONT_STACK,
    h1: { fontSize: "2rem", fontWeight: 700 },
    h2: { fontSize: "1.5rem", fontWeight: 700 },
    h3: { fontSize: "1.375rem", fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: { backgroundColor: "#0E0E0E" },
        // Custom `Box component={Link}` links are not a ButtonBase, so they
        // need their own visible focus ring.
        "a:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: "2px",
        },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: "none", fontWeight: 700 } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
    },
    MuiSkeleton: {
      defaultProps: { animation: "wave" },
    },
    // Every MUI `ButtonBase` (buttons, list items, card action areas) gets a
    // visible focus ring as well.
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.Mui-focusVisible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: "2px",
          },
        }),
      },
    },
  },
});

export default theme;
