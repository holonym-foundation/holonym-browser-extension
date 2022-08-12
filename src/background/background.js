/**
 * @returns {Promise<SubtleCrypto.JWK>} Public key which can be used to encrypt messages to user.
 */
function getPublicKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["holoKeyPair"], (keyPair) => {
      console.log(`background: Getting public key`); // TODO: Delete. For tests only
      resolve(keyPair.publicKey);
    });
  });
}

/**
 * API for storing Holo credentials
 */

const allowedOrigins = ["http://localhost:3002", "https://app.holonym.id"];
const allowedMessages = [
  // "getHoloCredentials",
  // "setHoloCredentials",
  "getHoloPublicKey",
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
    const publicKey = await getPublicKey();
    console.log("background: public key...");
    console.log(publicKey);
    sendResponse(publicKey);
    return;
  }
}

chrome.runtime.onMessageExternal.addListener(listener);
