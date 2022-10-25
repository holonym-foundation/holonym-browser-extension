/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */
import {
  trustedOrigins,
  basicWebPageCommands,
  privilegedWebPageCommands,
} from "../@shared/constants";
import PopupMessageHandler from "./PopupMessageHandler";
import WebpageMessageHandler from "../@shared/WebpageMessageHandler";

// --------------------------------------------------------------
// Functions for listening to messages from popups
// --------------------------------------------------------------

// https://chrome.google.com/webstore/detail/holonym/oehcghhbelloglknnpdgoeammglelgna
// let extensionId = "oehcghhbelloglknnpdgoeammglelgna";
// https://chrome.google.com/webstore/detail/holonym/obhgknpelgngeabaclepndihajndjjnb
let extensionId = process.env.EXTENSION_ID;
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

const allowedWebPageCommands = [...basicWebPageCommands, ...privilegedWebPageCommands];

function webPageListener(request, sender, sendResponse) {
  const potentialOrigin = sender.origin || sender.url;
  if (!trustedOrigins.includes(potentialOrigin)) {
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
