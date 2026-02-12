import React from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

// 🎨 Clean dark theme with white text
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0D1117",
      paper: "#161B22",
    },
    text: { primary: "#FFFFFF", secondary: "#D0D0D0" },
    primary: { main: "#00B8D9" },
  },
  typography: {
    fontFamily: "Inter, Roboto, sans-serif",
  },
});

export default function App() {
  console.log("[v0] App component rendering");
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/:page" element={<Dashboard />} />
          <Route path="/carsandbids-labs" element={<Dashboard />} />
          <Route path="/carsandbids-labs/:page" element={<Dashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
