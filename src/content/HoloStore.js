/**
 * API for storing Holo credentials
 */

import { ethers } from "ethers";
import HoloStorePopup from "./HoloStorePopup";
import { getStateAsBytes, getDateAsBytes } from "./utils";
import { serverAddress, threeZeroedBytes } from "./constants";
// const Buffer = require("buffer/").Buffer;
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

const holoStorePopup = new HoloStorePopup();

/**
 * Ask user to confirm that they want to store their credentials.
 * @returns True if user chooses to store creds, false if not.
 */
function displayPopup(creds) {
  return new Promise((resolve) => {
    holoStorePopup.setCreds(creds);
    holoStorePopup.open();

    const closeFunc = () => {
      holoStorePopup.close();
      resolve(false);
    };
    const confirmFunc = () => {
      holoStorePopup.close();
      resolve(true);
    };
    holoStorePopup.closeBtn.addEventListener("click", closeFunc, { once: true });
    holoStorePopup.confirmBtn.addEventListener("click", confirmFunc, { once: true });
  });
}

class HoloStore {
  /**
   * @param {object} credentials Object containing: unencryptedCreds (obj) & encryptedCreds (str)
   * @returns True if the given credentials get stored, false otherwise.
   */
  setCredentials(credentials) {
    return new Promise((resolve) => {
      if (!this.validateCredentials(credentials)) {
        resolve(false);
      }

      const encryptedCreds = credentials.encryptedCreds;

      displayPopup(credentials).then((storeCreds) => {
        if (storeCreds) {
          chrome.storage.sync.set({ holoCredentials: encryptedCreds }, () => {
            console.log(`HoloStore: Storing credentials`);
            resolve(true);
          });
        } else {
          console.log(`HoloStore: Not storing credentials`);
          holoStorePopup.setCreds(undefined);
          resolve(false);
        }
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