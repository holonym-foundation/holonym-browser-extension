// Inject holonym object into window object

const extensionId = process.env.EXTENSION_ID;

// Max length of encrypt-able string using RSA-OAEP with SHA256 where
// modulusLength == 4096: 446 characters.
const maxEncryptableLength = 446;

/**
 * @param {SubtleCrypto.JWK} publicKey
 * @param {string} message
 * @returns {Promise<string>} Encrypted message
 */
async function encryptShard(publicKey, message) {
  const algo = {
    name: "RSA-OAEP",
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  };
  let args = ["jwk", publicKey, algo, false, ["encrypt"]];
  const pubKeyAsCryptoKey = await window.crypto.subtle.importKey(...args);
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);
  args = ["RSA-OAEP", pubKeyAsCryptoKey, encodedMessage];
  const encryptedMessage = await window.crypto.subtle.encrypt(...args);
  return JSON.stringify(Array.from(new Uint8Array(encryptedMessage)));
}

async function encryptForExtension(message) {
  const encryptionKey = await getHoloPublicKey();
  const stringifiedMsg = JSON.stringify(message);
  const usingSharding = stringifiedMsg.length > maxEncryptableLength;
  let encryptedMessage; // array<string> if sharding, string if not sharding
  if (usingSharding) {
    encryptedMessage = [];
    for (let i = 0; i < stringifiedMsg.length; i += maxEncryptableLength) {
      const shard = stringifiedMsg.substring(i, i + maxEncryptableLength);
      const encryptedShard = await encryptShard(encryptionKey, shard);
      encryptedMessage.push(encryptedShard);
    }
  } else {
    encryptedMessage = await encrypt(encryptionKey, stringifiedMsg);
  }
  return { encryptedMessage: encryptedMessage, sharded: usingSharding };
}

// ----------------------------------------------------
// BEGIN "endpoint" functions
// ----------------------------------------------------

async function holoGetIsInstalled() {
  return new Promise((resolve) => {
    const message = { command: "holoGetIsInstalled" };
    chrome.runtime.sendMessage(extensionId, message, (resp) => {
      resolve(resp);
    });
  });
}

async function holoGetIsRegistered() {
  return new Promise((resolve) => {
    const payload = {
      command: "holoGetIsRegistered",
    };
    const callback = (resp) => resolve(resp);
    // const callback = (resp) => resolve(resp.isRegistered); // code in frontend
    chrome.runtime.sendMessage(extensionId, payload, callback);
  });
}

async function getHoloPublicKey() {
  return new Promise((resolve) => {
    const message = { command: "getHoloPublicKey" };
    chrome.runtime.sendMessage(extensionId, message, (resp) => {
      resolve(resp);
    });
  });
}

async function getHoloCredentials() {
  return new Promise((resolve) => {
    const message = { command: "getHoloCredentials" };
    chrome.runtime.sendMessage(extensionId, message, (resp) => {
      resolve(resp);
    });
  });
}

async function setHoloCredentials(credentials) {
  return new Promise(async (resolve) => {
    const { encryptedMessage, sharded } = await encryptForExtension(credentials);
    const payload = {
      command: "setHoloCredentials",
      sharded: sharded,
      credentials: encryptedMessage,
    };
    const callback = (resp) => resolve(resp);
    // const callback = (resp) => resolve(resp?.success); // code in frontend
    chrome.runtime.sendMessage(extensionId, payload, callback);
  });
}

window.holonym = {
  // holoGetIsInstalled: holoGetIsInstalled,
  // holoGetIsRegistered: holoGetIsRegistered,
  // getHoloPublicKey: getHoloPublicKey,
  // getHoloCredentials: getHoloCredentials,
  // setHoloCredentials: setHoloCredentials,
};
