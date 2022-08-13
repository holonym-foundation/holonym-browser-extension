/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */
// import { CryptoController } from "../general/CryptoController";
import { CryptoController } from "./CryptoController";
import { HoloStore } from "../general/HoloStore";

// --------------------------------------------------------
// Functions for listening to messages from confirmation popup
// --------------------------------------------------------

const cryptoController = new CryptoController();
const holoStore = new HoloStore();
const popupOrigin = "chrome-extension://jmaehplbldnmbeceocaopdolmgbnkoga";
const allowedPopupMessages = ["holoPopupLogin", "getHoloCredentials"];

function popupListener(request, sender, sendResponse) {
  if (sender.origin != popupOrigin) return;
  if (!sender.url.includes(popupOrigin)) return;
  const message = request.message;
  if (!allowedPopupMessages.includes(message)) return;

  // TODO...
  // Login
  // get creds
  // if (confirm) store creds in HoloStore
  // if (cancel) simply close popup
  if (message == "holoPopupLogin") {
    const password = request.password;
    cryptoController.login(password).then((success) => {
      console.log(`background: login success: ${success}`);
      sendResponse({ success: success });
    });
    return true; // <-- This is required in order to use sendResponse async
  } else if (message == "getHoloCredentials") {
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => cryptoController.decryptWithPrivateKey(encryptedMsg))
      .then((decryptedMsg) => sendResponse(decryptedMsg));
    return true;
  }
}

function createPopupWindow() {
  chrome.runtime.onMessage.addListener(popupListener);

  const config = {
    focused: true,
    height: 500,
    width: 400,
    incognito: false,
    setSelfAsOpener: false,
    type: "popup",
    url: "confirmation_popup.html",
  };
  chrome.windows.create(config, (window) => {});
}

// --------------------------------------------------------
// Functions for listening to messages from webpage
// --------------------------------------------------------

/**
 * @returns {Promise<SubtleCrypto.JWK>} Public key which can be used to encrypt messages to user.
 */
function getPublicKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["holoKeyPair"], (result) => {
      console.log(`background: Getting public key`); // TODO: Delete. For tests only
      resolve(result.holoKeyPair.publicKey);
    });
  });
}

const allowedOrigins = ["http://localhost:3002", "https://app.holonym.id"];
const allowedWebPageMessages = [
  "getHoloPublicKey",
  // "getHoloCredentials",
  "setHoloCredentials",
];

// Listener function for messages from webpage
async function webPageListener(request, sender, sendResponse) {
  const potentialOrigin = sender.origin || sender.url;
  if (!allowedOrigins.includes(potentialOrigin)) {
    throw new Error("Disallowed origin attempting to access or modify HoloStore.");
  }
  const message = request.message;
  const newCreds = request.credentials;

  if (!allowedWebPageMessages.includes(message)) {
    return;
  }

  // Get public key
  if (message == "getHoloPublicKey") {
    console.log("background: getting public key");
    const publicKey = await getPublicKey();
    sendResponse(publicKey);
    return;
  } else if (message == "setHoloCredentials") {
    console.log("background: setting latest message");
    await holoStore.setLatestMessage(newCreds);
    createPopupWindow();
  }
}

chrome.runtime.onMessageExternal.addListener(webPageListener);
