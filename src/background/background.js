/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */
import { CryptoController } from "./CryptoController";
import { HoloStore } from "./HoloStore";

// --------------------------------------------------------------
// Functions for listening to messages from popups
// --------------------------------------------------------------

const cryptoController = new CryptoController();
const holoStore = new HoloStore();
const popupOrigin = "chrome-extension://cilbidmppfndfhjafdlngkaabddoofea";
const allowedPopupMessages = [
  "holoPopupLogin",
  "getHoloLatestMessage",
  "getHoloCredentials",
  "confirmCredentials",
  "denyCredentials",
  "holoChangePassword",
  "holoInitializeAccount",
  "holoGetIsRegistered",
];

function popupListener(request, sender, sendResponse) {
  if (sender.origin != popupOrigin) return;
  if (!sender.url.includes(popupOrigin)) return;
  const message = request.message;
  if (!allowedPopupMessages.includes(message)) return;

  if (message == "holoPopupLogin") {
    const password = request.password;
    cryptoController.login(password).then((success) => {
      sendResponse({ success: success });
    });
    return true; // <-- This is required in order to use sendResponse async
  } else if (message == "getHoloLatestMessage") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => cryptoController.decryptWithPrivateKey(encryptedMsg))
      .then((decryptedMsg) => sendResponse({ credentials: JSON.parse(decryptedMsg) }));
    return true;
  } else if (message == "getHoloCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore
      .getCredentials()
      .then((encryptedCreds) => cryptoController.decryptWithPrivateKey(encryptedCreds))
      .then((decryptedCreds) =>
        sendResponse({ credentials: JSON.parse(decryptedCreds) })
      );
    return true;
  } else if (message == "confirmCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    let encryptedCreds = "";
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => {
        encryptedCreds = encryptedMsg;
        return cryptoController.decryptWithPrivateKey(encryptedMsg);
      })
      .then((decryptedCreds) => {
        const credentials = {
          unencryptedCreds: JSON.parse(decryptedCreds),
          encryptedCreds: encryptedCreds,
        };
        return holoStore.setCredentials(credentials);
      })
      .then((setCredsSuccess) => holoStore.setLatestMessage(""))
      .then((setMsgSuccess) => sendResponse({}));
    return true;
  } else if (message == "denyCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore.setLatestMessage("");
  } else if (message == "holoChangePassword") {
    const oldPassword = request.oldPassword;
    const newPassword = request.newPassword;
    cryptoController
      .changePassword(oldPassword, newPassword)
      .then((changePwSuccess) => sendResponse({ success: changePwSuccess }));
    return true;
  } else if (message == "holoInitializeAccount") {
    const password = request.password;
    cryptoController
      .initialize(password) // TODO: initialize() doesn't return anything
      .then((success) => sendResponse({ success: success }));
    return true;
  } else if (message == "holoGetIsRegistered") {
    cryptoController
      .getIsRegistered()
      .then((isRegistered) => sendResponse({ isRegistered: isRegistered }));
    return true;
  }
}

function displayConfirmationPopup() {
  const config = {
    focused: true,
    height: 530,
    width: 400,
    incognito: false,
    setSelfAsOpener: false,
    type: "popup",
    url: "confirmation_popup.html",
  };
  chrome.windows.create(config, (window) => {});
}

// --------------------------------------------------------------
// Functions for listening to messages from webpage
// --------------------------------------------------------------

/**
 * @returns {Promise<SubtleCrypto.JWK>} Public key which can be used to encrypt messages to user.
 */
function getPublicKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["holoKeyPair"], (result) => {
      resolve(result.holoKeyPair.publicKey);
    });
  });
}

const allowedOrigins = ["http://localhost:3002", "https://app.holonym.id"];
const allowedWebPageMessages = [
  "getHoloPublicKey",
  // "getHoloCredentials",
  "setHoloCredentials",
  "holoGetIsRegistered",
];

// Listener function for messages from webpage
function webPageListener(request, sender, sendResponse) {
  const potentialOrigin = sender.origin || sender.url;
  if (!allowedOrigins.includes(potentialOrigin)) {
    throw new Error("Disallowed origin attempting to access or modify HoloStore.");
  }
  const message = request.message;
  const newCreds = request.credentials;

  if (!allowedWebPageMessages.includes(message)) {
    return;
  }

  if (message == "getHoloPublicKey") {
    getPublicKey().then((publicKey) => sendResponse(publicKey));
    return true;
  } else if (message == "setHoloCredentials") {
    holoStore.setLatestMessage(newCreds).then(() => displayConfirmationPopup());
    return;
  } else if (message == "holoGetIsRegistered") {
    cryptoController
      .getIsRegistered()
      .then((isRegistered) => sendResponse({ isRegistered: isRegistered }));
    return true;
  }
}

chrome.runtime.onMessage.addListener(popupListener);
chrome.runtime.onMessageExternal.addListener(webPageListener);
