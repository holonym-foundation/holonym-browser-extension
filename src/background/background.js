/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */
import PopupMessageHandler from "./PopupMessageHandler";
import WebpageMessageHandler from "./WebpageMessageHandler";

// --------------------------------------------------------------
// Functions for listening to messages from popups
// --------------------------------------------------------------

// https://chrome.google.com/webstore/detail/holonym/oehcghhbelloglknnpdgoeammglelgna
// let extensionId = "oehcghhbelloglknnpdgoeammglelgna";
// https://chrome.google.com/webstore/detail/holonym/obhgknpelgngeabaclepndihajndjjnb
let extensionId = "obhgknpelgngeabaclepndihajndjjnb"; // Extension owned by extension@holonym.id
switch (process.env.NODE_ENV) {
  case "dev":
    extensionId = "cilbidmppfndfhjafdlngkaabddoofea";
    break;
  case "caleb":
    extensionId = "cilbidmppfndfhjafdlngkaabddoofea";
    break;
  case "nanak":
    extensionId = "lgmhnpjmdlgddnjchckodphblmacnhdo";
    break;
}
console.log("extension ID should be ", extensionId);
let popupOrigin = `chrome-extension://${extensionId}`;

const allowedPopupCommands = [
  "holoPopupLogin",
  "holoGetIsLoggedIn",
  "getStagedCredentials",
  "getHoloCredentials",
  "confirmCredentials",
  "denyCredentials",
  "holoChangePassword",
  "holoInitializeAccount",
  "holoGetIsRegistered",
  "confirmShareCredentials",
  "closingHoloCredentialsConfirmationPopup",
  "closingHoloShareCredsConfirmationPopup",
];

function popupListener(request, sender, sendResponse) {
  if (sender.origin != popupOrigin) return;
  if (!sender.url.includes(popupOrigin)) return;
  const command = request.command;
  if (!allowedPopupCommands.includes(command)) return;

  const func = PopupMessageHandler[request?.command];
  if (func) func(request).then((resp) => sendResponse(resp));
  else sendResponse();
  return true; // <-- This is required in order to use sendResponse async
}

// --------------------------------------------------------------
// Functions for listening to messages from webpage
// --------------------------------------------------------------

const allowedOrigins = [
  "http://localhost:3002", // For local holonym.io tests
  "http://localhost:8081", // For local holonym.id tests
  "https://app.holonym.id",
  "https://holonym.id",
  "https://holonym.io",
  "https://main.d2pqgbrq5pb6nr.amplifyapp.com",
];
const allowedWebPageCommands = [
  "holoGetIsInstalled",
  "getHoloPublicKey",
  "getHoloCredentials",
  "setHoloCredentials",
  "holoGetIsRegistered",
  "holoGetHasCredentials",
  // TODO: Add holoGetIsLoggedIn
];

function webPageListener(request, sender, sendResponse) {
  const potentialOrigin = sender.origin || sender.url;
  if (!allowedOrigins.includes(potentialOrigin)) {
    throw new Error("Disallowed origin attempting to access or modify HoloStore.");
  }
  if (!allowedWebPageCommands.includes(request.command)) {
    return;
  }

  const func = WebpageMessageHandler[request.command];
  if (func) func(request).then((resp) => sendResponse(resp));
  else sendResponse();
  return true; // <-- This is required in order to use sendResponse async
}

chrome.runtime.onMessage.addListener(popupListener);
chrome.runtime.onMessageExternal.addListener(webPageListener);
