// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Router         from "./Router";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router />
  </StrictMode>
);


/* ════════════════════════════════════════════════════
   src/index.css  — paste this (minimal reset)
   ════════════════════════════════════════════════════

   *, *::before, *::after {
     box-sizing: border-box;
     margin: 0;
     padding: 0;
   }

   html {
     scroll-behavior: smooth;
   }

   body {
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
   }

   input[type=number]::-webkit-inner-spin-button,
   input[type=number]::-webkit-outer-spin-button {
     -webkit-appearance: none;
   }

   ════════════════════════════════════════════════════ */
