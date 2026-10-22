import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "prop-types",
      "react-is",
      "@emotion/react",
      "@emotion/cache",
      "@emotion/styled",
      "clsx",
    ],
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
  ssr: {
    optimizeDeps: {
      include: [
        "@mui/material",
        "@mui/system",
        "@mui/icons-material",
        "@emotion/react",
        "@emotion/cache",
        "@emotion/styled",
        "@emotion/server",
      ],
    },
    noExternal: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/system",
      "@mui/private-theming",
      "@mui/styled-engine",
      "@mui/utils",
      "@emotion/react",
      "@emotion/cache",
      "@emotion/styled",
      "@emotion/server",
    ],
  },
  build: {
    outDir: "dist/client",
    sourcemap: true,
    rollupOptions: {
      input: "index.html",
    },
  },
  server: {
    port: 5173,
  },
});