import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// On close, tell background script to clear latestHoloMessage and to
// release the confirmation popup lock
window.addEventListener("beforeunload", (event) => {
  chrome.runtime.sendMessage({ command: "denyCredentials" });
  chrome.runtime.sendMessage({ command: "closingHoloProofConfirmationPopup" });
});

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
