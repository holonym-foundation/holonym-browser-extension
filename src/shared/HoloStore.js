/**
 * API for storing Holo credentials.
 */

import { ethers } from "ethers";
import { getStateAsBytes, getDateAsBytes } from "./utils";
import { serverAddress, threeZeroedBytes } from "./constants";
import { Buffer } from "buffer";

const requiredCredsKeys = [
  "firstName",
  "lastName",
  "middleInitial",
  "countryCode",
  "streetAddr1",
  "streetAddr2",
  "city",
  "subdivision",
  "postalCode",
  "completedAt",
  "birthdate",
  "serverSignature",
  "secret",
];

/**
 * HoloStore has two stores:
 * (1) "latestHoloMessage"--This stores the latest message sent to the user.
 * (2) "holoCredentials"--This stores the user's encrypted credentials.
 *
 * Credentials should be stored in (1) before being stored in (2). The
 * user must submit confirmation that they want their credentials to be
 * stored before the credentials can be stored in (1).
 */
class HoloStore {
  /**
   * @param {string} message
   * @returns True if successful, false otherwise.
   */
  setLatestMessage(message) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ latestHoloMessage: message }, () => resolve(true));
    });
  }

  getLatestMessage() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["latestHoloMessage"], (result) => {
        resolve(result?.latestHoloMessage);
      });
    });
  }

  /**
   * Validates unencrypted unencryptedCreds. If unencryptedCreds are valid,
   * encryptedCreds are stored.
   * @param {object} credentials Object containing: unencryptedCreds (obj)
   *                             & encryptedCreds (str)
   * @returns True if the given credentials get stored, false otherwise.
   */
  setCredentials(credentials) {
    return new Promise((resolve) => {
      if (!this.validateCredentials(credentials)) {
        // TODO: Display error message to user
        console.log(`HoloStore: Not storing credentials`);
        resolve(false);
      }
      const encryptedCreds = credentials.encryptedCreds;
      chrome.storage.sync.set({ holoCredentials: encryptedCreds }, () => {
        // TODO: Display success message to user
        console.log(`HoloStore: Storing credentials`);
        resolve(true);
      });
    });
  }

  validateCredentials(credentials) {
    if (!credentials.unencryptedCreds || !credentials.encryptedCreds) {
      console.log("HoloStore: credentials object missing required keys");
      return false;
    }
    console.log("HoloStore: credentials object has required keys. displaying popup");

    // Ensure unencryptedCreds object has all and only the required keys
    const unencryptedCredsKeys = Object.keys(credentials.unencryptedCreds);
    const keysDiff = unencryptedCredsKeys
      .filter((key) => !requiredCredsKeys.includes(key))
      .concat(requiredCredsKeys.filter((key) => !unencryptedCredsKeys.includes(key)));
    if (keysDiff.length > 0) {
      console.log("HoloStore: Incorrect creds keys");
      return false;
    }

    const validSignature = this.validateServerSignature(credentials.unencryptedCreds);
    if (!validSignature) {
      console.log("HoloStore: Invalid server signature");
      return false;
    }

    return true;
  }
  async validateServerSignature(unencryptedCreds) {
    const arrayifiedAddr = ethers.utils.arrayify(serverAddress);
    const arrayifiedSecret = ethers.utils.arrayify(unencryptedCreds.secret);
    const credsArr = [
      Buffer.concat([Buffer.from(unencryptedCreds.firstName || "")], 14),
      Buffer.concat([Buffer.from(unencryptedCreds.lastName || "")], 14),
      Buffer.concat([Buffer.from(unencryptedCreds.middleInitial || "")], 1),
      Buffer.concat([Buffer.from(unencryptedCreds.countryCode || "")], 3),
      Buffer.concat([Buffer.from(unencryptedCreds.streetAddr1 || "")], 16),
      Buffer.concat([Buffer.from(unencryptedCreds.streetAddr2 || "")], 12),
      Buffer.concat([Buffer.from(unencryptedCreds.city || "")], 16),
      getStateAsBytes(unencryptedCreds.subdivision), // 2 bytes
      Buffer.concat([Buffer.from(unencryptedCreds.postalCode || "")], 8),
      unencryptedCreds.completedAt
        ? getDateAsBytes(unencryptedCreds.completedAt)
        : threeZeroedBytes,
      unencryptedCreds.birthdate
        ? getDateAsBytes(unencryptedCreds.birthdate)
        : threeZeroedBytes,
    ];
    const arrayifiedCreds = ethers.utils.arrayify(Buffer.concat(credsArr));
    const msg = Uint8Array.from([
      ...arrayifiedAddr,
      ...arrayifiedSecret,
      ...arrayifiedCreds,
    ]);
    const signer = await ethers.utils.verifyMessage(
      msg,
      unencryptedCreds.serverSignature
    );
    if (signer.toLowerCase() != serverAddress.toLowerCase()) {
      console.log("HoloStore: signer != serverAddress");
      return false;
    }
    return true;
  }

  /**
   * @returns The last valid value that was supplied to setCredentials as credentials.encryptedCreds
   */
  getCredentials() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(["holoCredentials"], (creds) => {
        console.log("HoloStore: holoCredentials...");
        console.log(creds);
        resolve(creds?.holoCredentials);
      });
    });
  }
}

/**
 * @param {string} credentials An encrypted string.
 */
function injectCredentials(credentials) {
  if (!credentials) {
    return;
  }
  const credsEl = document.getElementById("injected-holonym-creds");
  if (credsEl) {
    credsEl.textContent = credentials;
  } else {
    const credsEl = document.createElement("div");
    credsEl.textContent = credentials;
    credsEl.style.visibility = "hidden";
    credsEl.style.bottom = "-10px";
    credsEl.id = "injected-holonym-creds";
    document.body.appendChild(credsEl);
  }
}

export { HoloStore, injectCredentials };
