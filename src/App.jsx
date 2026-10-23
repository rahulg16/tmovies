import { Routes, Route } from "react-router-dom";
import Box from "@mui/material/Box";

import InfoPage from "./Pages/InfoPage/InfoPage.jsx";
import Home from "./Pages/Home/Home.jsx";
import Movies from "./Pages/Movies/Movies";
import TvSeries from "./Pages/Tv Series/TvSeries.jsx";

function App() {
  return (
    <Box sx={{ minHeight: "100vh", overflowX: "hidden" }}>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/movie/:id" element={<InfoPage type="movie" />} />
        <Route path="/tv/:id" element={<InfoPage type="tv" />} />
        <Route path="/movies" exact element={<Movies />} />
        <Route path="/tv-series" exact element={<TvSeries />} />
      </Routes>
    </Box>
  );
}

export default App;
