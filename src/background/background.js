/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */
import { CryptoController } from "./CryptoController";
import { HoloStore } from "./HoloStore";

// --------------------------------------------------------------
// Functions for listening to messages from popups
// --------------------------------------------------------------

let confirmationPopupIsOpen = false;

const cryptoController = new CryptoController();
const holoStore = new HoloStore();
const popupOrigin = "chrome-extension://cilbidmppfndfhjafdlngkaabddoofea";
const allowedPopupCommands = [
  "holoPopupLogin",
  "getHoloLatestMessage",
  "getHoloCredentials",
  "confirmCredentials",
  "denyCredentials",
  "holoChangePassword",
  "holoInitializeAccount",
  "holoGetIsRegistered",
  "closingHoloConfirmationPopup",
];

function popupListener(request, sender, sendResponse) {
  if (sender.origin != popupOrigin) return;
  if (!sender.url.includes(popupOrigin)) return;
  const command = request.command;
  if (!allowedPopupCommands.includes(command)) return;

  if (command == "holoPopupLogin") {
    const password = request.password;
    cryptoController.login(password).then((success) => {
      sendResponse({ success: success });
    });
    return true; // <-- This is required in order to use sendResponse async
  } else if (command == "getHoloLatestMessage") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => cryptoController.decryptWithPrivateKey(encryptedMsg))
      .then((decryptedMsg) => sendResponse({ credentials: JSON.parse(decryptedMsg) }));
    return true;
  } else if (command == "getHoloCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore
      .getCredentials()
      .then((encryptedCreds) => cryptoController.decryptWithPrivateKey(encryptedCreds))
      .then((decryptedCreds) =>
        sendResponse({ credentials: JSON.parse(decryptedCreds) })
      );
    return true;
  } else if (command == "confirmCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    let encryptedCreds = "";
    let unencryptedCreds = "";
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => {
        encryptedCreds = encryptedMsg;
        return cryptoController.decryptWithPrivateKey(encryptedMsg);
      })
      .then((decryptedCreds) => {
        unencryptedCreds = JSON.parse(decryptedCreds);
        const credentials = {
          unencryptedCreds: unencryptedCreds,
          encryptedCreds: encryptedCreds,
        };
        return holoStore.setCredentials(credentials);
      })
      .then((setCredsSuccess) => {
        // TODO: handle case where setCredsSuccess == false
        // TODO: generateProofs(unencryptedCreds)
        return holoStore.setLatestMessage("");
      })
      .then((setMsgSuccess) => sendResponse({}));
    return true;
  } else if (command == "denyCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore.setLatestMessage("");
  } else if (command == "holoChangePassword") {
    const oldPassword = request.oldPassword;
    const newPassword = request.newPassword;
    cryptoController
      .changePassword(oldPassword, newPassword)
      .then((changePwSuccess) => sendResponse({ success: changePwSuccess }));
    return true;
  } else if (command == "holoInitializeAccount") {
    const password = request.password;
    cryptoController
      .initialize(password) // TODO: initialize() doesn't return anything
      .then((success) => sendResponse({ success: success }));
    return true;
  } else if (command == "holoGetIsRegistered") {
    cryptoController
      .getIsRegistered()
      .then((isRegistered) => sendResponse({ isRegistered: isRegistered }));
    return true;
  } else if (command == "closingHoloConfirmationPopup") {
    confirmationPopupIsOpen = false;
  }
}

async function displayConfirmationPopup() {
  if (confirmationPopupIsOpen) return;
  confirmationPopupIsOpen = true;
  const config = {
    focused: true,
    height: 530,
    width: 400,
    incognito: false,
    setSelfAsOpener: false,
    type: "popup",
    url: "confirmation_popup.html",
  };
  try {
    const window = await chrome.windows.create(config);
  } catch (err) {
    console.log(err);
    confirmationPopupIsOpen = false;
  }
}

// --------------------------------------------------------------
// Functions for listening to messages from webpage
// --------------------------------------------------------------

/**
 * @returns {Promise<SubtleCrypto.JWK>} Public key which can be used to encrypt messages to user.
 */
function getPublicKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["holoKeyPair"], (result) => {
      resolve(result?.holoKeyPair?.publicKey);
    });
  });
}

const allowedOrigins = ["http://localhost:3002", "https://app.holonym.id"];
const allowedWebPageCommands = [
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
  const command = request.command;
  const credsAreSharded = request.sharded;
  const newCreds = request.credentials;

  if (!allowedWebPageCommands.includes(command)) {
    return;
  }

  if (command == "getHoloPublicKey") {
    getPublicKey().then((publicKey) => sendResponse(publicKey));
    return true;
  } else if (command == "setHoloCredentials") {
    const latestMessage = {
      sharded: credsAreSharded,
      credentials: newCreds,
    };
    holoStore.setLatestMessage(latestMessage).then(() => displayConfirmationPopup());
    return;
  } else if (command == "holoGetIsRegistered") {
    cryptoController
      .getIsRegistered()
      .then((isRegistered) => sendResponse({ isRegistered: isRegistered }));
    return true;
  }
}

chrome.runtime.onMessage.addListener(popupListener);
chrome.runtime.onMessageExternal.addListener(webPageListener);
