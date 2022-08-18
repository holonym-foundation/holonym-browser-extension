import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// On close, tell background script to clear latestHoloMessage
window.addEventListener("beforeunload", (event) => {
  const message = { command: "denyCredentials" };
  chrome.runtime.sendMessage(message);
});

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
