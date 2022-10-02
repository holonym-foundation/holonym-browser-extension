import { webcrypto } from "crypto";
import { fileURLToPath } from "url";
import { dirname } from "path";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = `${__dirname}/../../dist`;

export async function initialize() {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXEC_PATH, // See puppeteer-headful GitHub Action
    headless: false,
    devtools: false,
    args: [
      `--no-sandbox`,
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });
  const serviceWorkerTarget = await browser.waitForTarget(
    (target) => target.type() === "service_worker"
  );
  const extensionId = serviceWorkerTarget.url().split("://")[1].split("/")[0];
  // Set extensionId and popupOrigin in the background script (i.e., service worker)
  const serviceWorker = await serviceWorkerTarget.worker();
  await serviceWorker.evaluateHandle((extId) => {
    extensionId = extId;
    popupOrigin = `chrome-extension://${extensionId}`;
  }, extensionId);
  return {
    browser: browser,
    serviceWorker: serviceWorker,
    extensionId: extensionId,
  };
}

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
    }, 9000);
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

export async function login(popupPage, extensionId, password) {
  const payload1 = { command: "holoPopupLogin", password: password };
  return await sendMessage(popupPage, extensionId, payload1);
}

/**
 * Get public key, encrypt credentials, and send credentials to extension.
 * Spawns a confirmation popup.
 * @param {Puppeteer.Page} frontendPage e.g., the page at app.holonym.id
 * @param {string} extensionId
 */
export async function sendEncryptedCredentials(frontendPage, extensionId, creds) {
  const payload1 = { command: "getHoloPublicKey" };
  const publicKey = await sendMessage(frontendPage, extensionId, payload1);
  const encryptedCreds = await encrypt(publicKey, JSON.stringify(creds));
  const payload2 = {
    command: "setHoloCredentials",
    credentials: encryptedCreds,
    sharded: false,
  };
  sendMessage(frontendPage, extensionId, payload2);
}

/**
 * @param {Puppeteer.Browser} browser
 * @param {string} popupType "default" | "credentials_confirmation" | "share_creds_confirmation"
 */
export async function getPopupPage(browser, popupType) {
  if (
    popupType != "default" &&
    popupType != "credentials_confirmation" &&
    popupType != "share_creds_confirmation"
  ) {
    throw new Error("Attempting to get a type of popup that does not exist");
  }
  const pages = await browser.pages();
  for (const page of pages) {
    if (page.url().includes(popupType)) return page;
  }
}

export async function clearLatestMessage(serviceWorker) {
  await serviceWorker.evaluate(() => {
    chrome.storage.local.set({ latestHoloMessage: "" });
  });
}
