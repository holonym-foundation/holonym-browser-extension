/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */
import { ethers } from "ethers";
import { CryptoController } from "./CryptoController";
import { HoloStore } from "./HoloStore";
import { sleep } from "./utils";

// --------------------------------------------------------------
// Functions for listening to messages from popups
// --------------------------------------------------------------

// TODO: Use an event emitter in place of some of these global variables
let credentialsConfirmationPopupIsOpen = false;
let shareCredsConfirmationPopupIsOpen = false;
let confirmShareCredentials = false;
let confirmCredentials = false;

const cryptoController = new CryptoController();
const holoStore = new HoloStore();

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
  "getHoloLatestMessage",
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

  if (command == "holoPopupLogin") {
    const password = request.password;
    cryptoController
      .login(password)
      .then((success) => sendResponse({ success: success }))
      .catch((err) => sendResponse({ error: err?.message }));
    return true; // <-- This is required in order to use sendResponse async
  } else if (command == "holoGetIsLoggedIn") {
    cryptoController
      .getIsLoggedIn()
      .then((loggedIn) => sendResponse({ isLoggedIn: loggedIn }));
    return true;
  } else if (command == "getHoloLatestMessage") {
    cryptoController
      .getIsLoggedIn()
      .then((loggedIn) => {
        if (!loggedIn) {
          sendResponse({ message: {} });
          return;
        } else {
          return holoStore.getLatestMessage();
        }
      })
      .then((encryptedMsg) => {
        if (!encryptedMsg) return;
        return cryptoController.decryptWithPrivateKey(
          encryptedMsg.credentials,
          encryptedMsg.sharded
        );
      })
      .then((decryptedMsg) => {
        if (!decryptedMsg) sendResponse({ message: {} });
        sendResponse({ message: { credentials: JSON.parse(decryptedMsg) } });
      })
      .catch(() => sendResponse({ message: {} }));
    return true;
  } else if (command == "getHoloCredentials") {
    cryptoController
      .getIsLoggedIn()
      .then((loggedIn) => {
        if (!loggedIn) return;
        return holoStore.getCredentials();
      })
      .then((encryptedCreds) => {
        if (!encryptedCreds) return;
        return cryptoController.decryptWithPrivateKey(
          encryptedCreds.credentials,
          encryptedCreds.sharded
        );
      })
      .then((decryptedCreds) => {
        if (!decryptedCreds) sendResponse({});
        else sendResponse(JSON.parse(decryptedCreds));
      })
      .catch((err) => sendResponse({ error: err }));
    return true;
  } else if (command == "confirmCredentials") {
    confirmCredentials = true;
    let unencryptedCreds;
    cryptoController
      .getIsLoggedIn()
      .then((loggedIn) => {
        if (!loggedIn) return;
        else return holoStore.getLatestMessage();
      })
      .then((encryptedMsg) => {
        if (!encryptedMsg) return;
        return cryptoController.decryptWithPrivateKey(
          encryptedMsg.credentials,
          encryptedMsg.sharded
        );
      })
      .then((decryptedCreds) => {
        if (!decryptedCreds) return;
        unencryptedCreds = JSON.parse(decryptedCreds);
        const newSecret = new Uint8Array(16);
        crypto.getRandomValues(newSecret); // Generate new secret
        unencryptedCreds.newSecret = ethers.BigNumber.from(newSecret).toHexString();
        return cryptoController.encryptWithPublicKey(unencryptedCreds);
      })
      .then((encryptedMsg) => {
        if (!encryptedMsg) return;
        const credentials = {
          unencryptedCreds: unencryptedCreds,
          encryptedCreds: {
            credentials: encryptedMsg.encryptedMessage,
            sharded: encryptedMsg.sharded,
          },
        };
        return holoStore.setCredentials(credentials);
      })
      .then((setCredsSuccess) => {
        if (!setCredsSuccess) return;
        return holoStore.setLatestMessage("");
      })
      .then((setMsgSuccess) => sendResponse({}))
      .catch((err) => sendResponse({ error: err }));
    return true;
  } else if (command == "denyCredentials") {
    cryptoController
      .getIsLoggedIn()
      .then((loggedIn) => {
        if (!loggedIn) return;
        return holoStore.setLatestMessage("");
      })
      .then((setMsgSuccess) => sendResponse({}));
    return true;
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
  } else if (command == "confirmShareCredentials") {
    confirmShareCredentials = true;
  } else if (command == "closingHoloCredentialsConfirmationPopup") {
    credentialsConfirmationPopupIsOpen = false;
  } else if (command == "closingHoloShareCredsConfirmationPopup") {
    shareCredsConfirmationPopupIsOpen = false;
  }
}

/**
 * @param {string} type Either "credentials" or "share-creds"; the desired popup type
 */
async function displayConfirmationPopup(type) {
  let url = "";
  if (type == "credentials") {
    // if (credentialsConfirmationPopupIsOpen) return;
    credentialsConfirmationPopupIsOpen = true;
    url = "credentials_confirmation_popup.html";
  } else if (type == "share-creds") {
    // TODO: Figure out best way to handle case where user closes popup, and
    // shareCredsConfirmationPopupIsOpen does not get set to false. Timeouts? Event emitters?
    // if (shareCredsConfirmationPopupIsOpen) return;
    shareCredsConfirmationPopupIsOpen = true;
    url = "share_creds_confirmation_popup.html";
  }

  // Get info needed to position popup at the top right of the currently focused window
  function getWindowWidthAndTop() {
    return new Promise((resolve) => {
      const callback = (window) => {
        const width = window.width + window.left;
        const top = window.top;
        resolve({ width: width, top: top });
      };
      chrome.windows.getCurrent(callback);
    });
  }
  const { width: windowWidth, top: windowTop } = await getWindowWidthAndTop();
  const leftPosition = Math.max(0, windowWidth - 400);
  const topPosition = Math.max(0, windowTop);

  const config = {
    focused: true,
    height: 530,
    width: 400,
    left: parseInt(leftPosition), // throws error: Expected integer, found number
    top: topPosition,
    incognito: false,
    setSelfAsOpener: false,
    type: "popup",
    url: url,
  };
  try {
    const window = await chrome.windows.create(config);
  } catch (err) {
    console.log(err);
    credentialsConfirmationPopupIsOpen = false;
    shareCredsConfirmationPopupIsOpen = false;
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

const allowedOrigins = [
  "http://localhost:3002", // For local holonym.io tests
  "http://localhost:8081", // For local holonym.id tests
  "https://app.holonym.id",
  "https://holonym.id",
  "https://holonym.io",
  "https://main.d2pqgbrq5pb6nr.amplifyapp.com",
];
const allowedWebPageCommands = [
  "getHoloPublicKey",
  "getHoloCredentials",
  "setHoloCredentials",
  "holoGetIsRegistered",
  // TODO: Add holoGetIsLoggedIn
];

// Listener function for messages from webpage
function webPageListener(request, sender, sendResponse) {
  const potentialOrigin = sender.origin || sender.url;
  if (!allowedOrigins.includes(potentialOrigin)) {
    throw new Error("Disallowed origin attempting to access or modify HoloStore.");
  }
  const command = request.command;
  const messageIsSharded = request.sharded;
  const newCreds = request.credentials;

  if (!allowedWebPageCommands.includes(command)) {
    return;
  }

  if (command == "getHoloPublicKey") {
    getPublicKey().then((publicKey) => sendResponse(publicKey));
    return true;
  } else if (command == "getHoloCredentials") {
    async function waitForConfirmation() {
      const timeout = new Date().getTime() + 180 * 1000;
      while (new Date().getTime() <= timeout && !confirmShareCredentials) {
        await sleep(50);
      }
      return confirmShareCredentials;
    }
    displayConfirmationPopup("share-creds");
    waitForConfirmation()
      .then((confirmShare) => {
        console.log(`confirmShare: ${confirmShare}`);
        if (!confirmShare) return;
        confirmShareCredentials = false; // reset
        return cryptoController.getIsLoggedIn();
      })
      .then((loggedIn) => {
        if (!loggedIn) return;
        return holoStore.getCredentials();
      })
      .then((encryptedMsg) => {
        if (!encryptedMsg) return;
        return cryptoController.decryptWithPrivateKey(
          encryptedMsg.credentials,
          encryptedMsg.sharded
        );
      })
      .then((decryptedCreds) => {
        if (!decryptedCreds) sendResponse({});
        else sendResponse(JSON.parse(decryptedCreds));
      });
    return true;
  } else if (command == "setHoloCredentials") {
    async function waitForConfirmation() {
      const timeout = new Date().getTime() + 180 * 1000;
      while (new Date().getTime() <= timeout && !confirmCredentials) {
        await sleep(50);
      }
      return confirmCredentials;
    }
    const latestMessage = {
      sharded: messageIsSharded,
      credentials: newCreds,
    };
    holoStore.setLatestMessage(latestMessage).then(() => {
      console.log("displaying confirmation popup");
      displayConfirmationPopup("credentials");
    });
    waitForConfirmation().then((confirm) => {
      confirmCredentials = false; // reset
      sendResponse({ success: confirm });
    });
    return true;
  } else if (command == "holoGetIsRegistered") {
    cryptoController
      .getIsRegistered()
      .then((isRegistered) => sendResponse({ isRegistered: isRegistered }));
    return true;
  }
}

// --------------------------------------------------------------
// Add listeners
// --------------------------------------------------------------

chrome.runtime.onMessage.addListener(popupListener);
chrome.runtime.onMessageExternal.addListener(webPageListener);
