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

function createPopupWindow() {
  const config = {
    focused: true,
    height: 500,
    width: 400,
    incognito: false,
    // Re: setSelfAsOpener: When true, can other browser extensions intercept
    // messages from window.postMessage? Or are the background script (and thus
    // the new window) in an isolated world? Is their context wholly separate
    // from the rest of the windows in the browser?
    setSelfAsOpener: false,
    type: "popup",
    url: "confirmation_popup.html",
  };
  const callback = (window) => {
    window.onload = () => {
      window.addEventListener("message", (event) => {
        const message = event.data;
        console.log("Received message from confirmation popup");
      });
    };
  };
  chrome.windows.create(config, callback);
}

/**
 * API for storing Holo credentials
 */

const allowedOrigins = ["http://localhost:3002", "https://app.holonym.id"];
const allowedMessages = [
  "getHoloPublicKey",
  // "getHoloCredentials",
  "setHoloCredentials",
];

async function listener(request, sender, sendResponse) {
  const potentialOrigin = sender.origin || sender.url;
  if (!allowedOrigins.includes(potentialOrigin)) {
    throw new Error("Disallowed origin attempting to access or modify HoloStore.");
  }
  const message = request.message;
  const newCreds = request.credentials;

  if (!allowedMessages.includes(message)) {
    return;
  }

  // Get public key
  if (message == "getHoloPublicKey") {
    console.log("background: getting public key");
    const publicKey = await getPublicKey();
    console.log("background: public key...");
    console.log(publicKey);
    sendResponse(publicKey);
    return;
  } else if (message == "setHoloCredentials") {
    createPopupWindow();
  }
}

chrome.runtime.onMessageExternal.addListener(listener);
