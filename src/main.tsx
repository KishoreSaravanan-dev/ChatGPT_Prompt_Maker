import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeRunAnywhere } from "./services/runanywhere";

// Initialize RunAnywhere SDK before rendering app
try {
  initializeRunAnywhere();
  console.log("[App] RunAnywhere initialization started");
} catch (error) {
  console.error("[App] Failed to initialize RunAnywhere:", error);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
