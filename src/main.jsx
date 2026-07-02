import React from "react";
import ReactDOM from "react-dom/client";
import "./storage.js"; // registra window.storage ANTES de montar la app
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
