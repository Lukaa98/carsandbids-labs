import React from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import { CssBaseline } from "@mui/material";

export default function App() {
  return (
    <>
      <CssBaseline />
      <Navbar />
      <Dashboard />
    </>
  );
}
