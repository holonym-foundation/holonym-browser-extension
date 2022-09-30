import { webcrypto } from "crypto";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Max length of encrypt-able string using RSA-OAEP with SHA256 where
// modulusLength == 4096: 446 characters.
const maxEncryptableLength = 446;

/**
 * Wrapper for chrome.runtime.sendMessage. Timeout after 5 seconds
 * @param {Puppeteer.Page} page The page from which the message is sent
 * @param {string} extensionId The extension to which the message is sent
 * @param {Object} payload
 */
export async function sendMessage(page, extensionId, payload) {
  return new Promise(async (resolve, reject) => {
    setTimeout(() => {
      reject();
    }, 10000);
    const result = await page.evaluate(
      (extensionId, payload) => {
        return new Promise((resolve) => {
          const callback = (resp) => {
            console.log(resp);
            resolve(resp);
          };
          window.chrome.runtime.sendMessage(extensionId, payload, callback);
        });
      },
      extensionId,
      payload
    );
    resolve(result);
  });
}
/**
 * @param {SubtleCrypto.JWK} publicKey
 * @param {string} message
 * @returns {Promise<string>} Encrypted message
 */
export async function encrypt(publicKey, message) {
  const algo = {
    name: "RSA-OAEP",
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  };
  let args = ["jwk", publicKey, algo, false, ["encrypt"]];
  const pubKeyAsCryptoKey = await webcrypto.subtle.importKey(...args);
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);
  args = ["RSA-OAEP", pubKeyAsCryptoKey, encodedMessage];
  const encryptedMessage = await webcrypto.subtle.encrypt(...args);
  return JSON.stringify(Array.from(new Uint8Array(encryptedMessage)));
}

export async function encryptForExtension(page, extensionId, message) {
  const payload = { command: "getHoloPublicKey" };
  const encryptionKey = await sendMessage(page, extensionId, payload);

  const stringifiedMsg = JSON.stringify(message);
  const usingSharding = stringifiedMsg.length > maxEncryptableLength;
  let encryptedMessage; // array<string> if sharding, string if not sharding
  if (usingSharding) {
    encryptedMessage = [];
    for (let i = 0; i < stringifiedMsg.length; i += maxEncryptableLength) {
      const shard = stringifiedMsg.substring(i, i + maxEncryptableLength);
      const encryptedShard = await encrypt(encryptionKey, shard);
      encryptedMessage.push(encryptedShard);
    }
  } else {
    encryptedMessage = await encrypt(encryptionKey, stringifiedMsg);
  }
  return { encryptedMessage: encryptedMessage, sharded: usingSharding };
}
