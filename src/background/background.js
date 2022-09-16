/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */
import { CryptoController } from "./CryptoController";
import { HoloStore } from "./HoloStore";
import ProofGenerator from "./ProofGenerator";
import { sleep } from "./utils";

// --------------------------------------------------------------
// Functions for listening to messages from popups
// --------------------------------------------------------------

// TODO: Use an event emitter in place of some of these global variables
let credentialsConfirmationPopupIsOpen = false;
let proofConfirmationPopupIsOpen = false;
let confirmShareProof = false;
let generatingProof = false;
let typeOfRequestedProof;

const cryptoController = new CryptoController();
const holoStore = new HoloStore();

let extensionId = "oehcghhbelloglknnpdgoeammglelgna";
switch(process.env.NODE_ENV) {
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
const popupOrigin = `chrome-extension://${extensionId}`;
const allowedPopupCommands = [
  "holoPopupLogin",
  "getHoloLatestMessage",
  "getHoloCredentials",
  "confirmCredentials",
  "denyCredentials",
  "holoChangePassword",
  "holoInitializeAccount",
  "holoGetIsRegistered",
  "holoSendProofToRelayer", // Triggers response to original setHoloCredentials message
  "confirmShareProof",
  "getTypeOfRequestedProof",
  "closingHoloCredentialsConfirmationPopup",
  "closingHoloProofConfirmationPopup",
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
    let isStoringCreds = false;
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => {
        isStoringCreds = encryptedMsg?.credentials ? true : false;
        const message = encryptedMsg.credentials || encryptedMsg.proof;
        return cryptoController.decryptWithPrivateKey(message, encryptedMsg.sharded);
      })
      .then((decryptedMsg) => {
        if (isStoringCreds) {
          sendResponse({ message: { credentials: JSON.parse(decryptedMsg) } });
        } else {
          sendResponse({ message: { proof: JSON.parse(decryptedMsg) } });
        }
      });
    return true;
  } else if (command == "getHoloCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore
      .getCredentials()
      .then((encryptedCreds) =>
        cryptoController.decryptWithPrivateKey(
          encryptedCreds.credentials,
          encryptedCreds.sharded
        )
      )
      .then((decryptedCreds) =>
        sendResponse({ credentials: JSON.parse(decryptedCreds) })
      );
    return true;
  } else if (command == "confirmCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    let encryptedCreds = "";
    let unencryptedCreds;
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => {
        encryptedCreds = encryptedMsg;
        return cryptoController.decryptWithPrivateKey(
          encryptedMsg.credentials,
          encryptedMsg.sharded
        );
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
  } else if (command == "holoSendProofToRelayer") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    const proofType = request.proofType; // e.g., addSmallLeaf
    holoStore
      .getCredentials()
      .then((encryptedMsg) =>
        cryptoController.decryptWithPrivateKey(
          encryptedMsg.credentials,
          encryptedMsg.sharded
        )
      )
      .then((decryptedCreds) => {
        return ProofGenerator.generateProof(JSON.parse(decryptedCreds), proofType);
      })
      .then((proof) => {
        // TODO: send proof to relayer
        return true;
      })
      .then((sendProofSuccess) => sendResponse({ success: sendProofSuccess }));
    return true;
  } else if (command == "confirmShareProof") {
    async function waitForProofToBeGenerated() {
      const timeout = new Date().getTime() + 180 * 1000;
      while (new Date().getTime() <= timeout && generatingProof) {
        await sleep(50);
      }
    }
    confirmShareProof = true;
    generatingProof = true;
    waitForProofToBeGenerated().then(() => {
      sendResponse({ finished: true });
    });
    return true;
  } else if (command == "getTypeOfRequestedProof") {
    sendResponse({ proofType: typeOfRequestedProof });
  } else if (command == "closingHoloCredentialsConfirmationPopup") {
    credentialsConfirmationPopupIsOpen = false;
  } else if (command == "closingHoloProofConfirmationPopup") {
    proofConfirmationPopupIsOpen = false;
  }
}

/**
 * @param {string} type Either "credentials" or "proof"; the desired popup type
 */
async function displayConfirmationPopup(type) {
  let url = "";
  if (type == "credentials") {
    if (credentialsConfirmationPopupIsOpen) return;
    credentialsConfirmationPopupIsOpen = true;
    url = "credentials_confirmation_popup.html";
  } else if (type == "proof") {
    if (proofConfirmationPopupIsOpen) return;
    proofConfirmationPopupIsOpen = true;
    url = "proof_confirmation_popup.html";
  }
  const config = {
    focused: true,
    height: 530,
    width: 400,
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
    proofConfirmationPopupIsOpen = false;
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
  "setHoloCredentials",
  "holoGetIsRegistered",
  "holoGenerateProof",
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
  const proofType = request.proofType;

  if (!allowedWebPageCommands.includes(command)) {
    return;
  }

  if (command == "getHoloPublicKey") {
    getPublicKey().then((publicKey) => sendResponse(publicKey));
    return true;
  } else if (command == "setHoloCredentials") {
    const latestMessage = {
      sharded: messageIsSharded,
      credentials: newCreds,
    };
    holoStore
      .setLatestMessage(latestMessage)
      .then(() => displayConfirmationPopup("credentials"));
    return;
  } else if (command == "holoGetIsRegistered") {
    cryptoController
      .getIsRegistered()
      .then((isRegistered) => sendResponse({ isRegistered: isRegistered }));
    return true;
  } else if (command == "holoGenerateProof") {
    async function waitForConfirmation() {
      typeOfRequestedProof = proofType;
      const timeout = new Date().getTime() + 180 * 1000;
      while (new Date().getTime() <= timeout && !confirmShareProof) {
        await sleep(50);
      }
      typeOfRequestedProof = ""; // reset
      return confirmShareProof;
    }
    // TODO: Delete this log
    console.log(`holoGenerateProof: received request for proof: ${proofType}`);
    displayConfirmationPopup("proof");
    waitForConfirmation()
      .then((confirmShare) => {
        console.log(`confirmShare: ${confirmShare}`);
        if (!confirmShare) return;
        confirmShareProof = false; // reset
        const loggedIn = cryptoController.getIsLoggedIn();
        if (!loggedIn) return;
        return holoStore.getCredentials();
      })
      .then((encryptedMsg) =>
        cryptoController.decryptWithPrivateKey(
          encryptedMsg.credentials,
          encryptedMsg.sharded
        )
      )
      .then((decryptedCreds) => {
        console.log("generating proof...");
        return ProofGenerator.generateProof(JSON.parse(decryptedCreds), proofType);
      })
      .then((proof) => {
        generatingProof = false;
        sendResponse(proof);
      });
    return true;
  }
}

chrome.runtime.onMessage.addListener(popupListener);
chrome.runtime.onMessageExternal.addListener(webPageListener);
