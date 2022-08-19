/**
 * API for storing Holo credentials.
 */

import { ethers } from "ethers";
import blake from "blakejs";
import { getStateAsBytes, getDateAsBytes } from "./utils";
import { serverAddress, threeZeroedBytes } from "./constants";
import { Buffer } from "buffer";

/**
 * @typedef {Object} DecryptedCredentials
 * (See credentialNames, secretNames, and signatureNames for properties.)
 */

/**
 * (Also defined in CryptoController.)
 * An encrypted message sent to the extension and stored by HoloStore as
 * 'latestHoloMessage'. The unencrypted message must be a string.
 * @typedef {Object} EncryptedCredentials
 * @property {boolean} sharded Whether message is represented as encrypted shards.
 * @property {string|Array<string>} credentials If not sharded, this is a string
 * representation of the encrypted message. If sharded, it is an array consisting
 * of parts of the message that were individually encrypted; in this case, the
 * decrypted message can be recovered by decrypting each shard and concatenating
 * the result.
 */

/**
 * @typedef {Object} FullCredentials
 * @property {DecryptedCredentials}
 * @property {EncryptedCredentials}
 */

const credentialNames = [
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
];

const secretNames = [
  "bigCredsSecret",
  "firstNameSecret",
  "lastNameSecret",
  "middleInitialSecret",
  "countryCodeSecret",
  "streetAddr1Secret",
  "streetAddr2Secret",
  "citySecret",
  "subdivisionSecret",
  "postalCodeSecret",
  "completedAtSecret",
  "birthdateSecret",
];

const signatureNames = [
  "bigCredsSignature",
  "firstNameSignature",
  "lastNameSignature",
  "middleInitialSignature",
  "countryCodeSignature",
  "streetAddr1Signature",
  "streetAddr2Signature",
  "citySignature",
  "subdivisionSignature",
  "postalCodeSignature",
  "completedAtSignature",
  "birthdateSignature",
];

const requiredCredsKeys = [...credentialNames, ...secretNames, ...signatureNames];

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
      chrome.storage.local.set({ latestHoloMessage: message }, () => resolve(true));
    });
  }

  getLatestMessage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["latestHoloMessage"], (result) => {
        resolve(result?.latestHoloMessage);
      });
    });
  }

  /**
   * Validates unencrypted unencryptedCreds. If unencryptedCreds are valid,
   * encryptedCreds are stored.
   * @param {FullCredentials} credentials (See typedef)
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
      chrome.storage.local.set({ holoCredentials: encryptedCreds }, () => {
        // TODO: Display success message to user
        console.log(`HoloStore: Storing credentials`);
        resolve(true);
      });
    });
  }

  validateCredentials(credentials) {
    if (!credentials.unencryptedCreds || !credentials.encryptedCreds) {
      console.log(
        "HoloStore: credentials object missing unencryptedCreds or encryptedCreds"
      );
      return false;
    }

    // Ensure unencryptedCreds object has all and only the required keys
    const unencryptedCredsKeys = Object.keys(credentials.unencryptedCreds);
    const keysDiff = unencryptedCredsKeys
      .filter((key) => !requiredCredsKeys.includes(key))
      .concat(requiredCredsKeys.filter((key) => !unencryptedCredsKeys.includes(key)));
    if (keysDiff.length > 0) {
      console.log(
        "HoloStore: credentials.unencryptedCreds does not have correct keys"
      );
      return false;
    }

    const validSignature = this.validateServerSignatures(credentials.unencryptedCreds);
    if (!validSignature) {
      console.log("HoloStore: Invalid server signature");
      return false;
    }

    return true;
  }
  async validateServerSignatures(unencryptedCreds) {
    try {
      const validSmallCredsSigs = await this.validateSmallCredsSigs(unencryptedCreds);
      if (!validSmallCredsSigs) return false;
      const validBigCredsSigs = await this.validateBigCredsSigs(unencryptedCreds);
      if (!validBigCredsSigs) return false;
    } catch (err) {
      console.log(err);
      return false;
    }
    return true;
  }
  async validateSmallCredsSigs(unencryptedCreds) {
    const arrayifiedAddr = ethers.utils.arrayify(serverAddress);
    for (const credentialName of credentialNames) {
      const secretKey = `${credentialName}Secret`;
      const arrayifiedSmallCredsSecret = ethers.utils.arrayify(
        Buffer.from(unencryptedCreds[secretKey])
      );
      const credentialsAsBuffer = Buffer.concat(
        [Buffer.from(unencryptedCreds[credentialName] || "")],
        28
      );
      const arrayifiedCreds = ethers.utils.arrayify(credentialsAsBuffer);
      const msg = Uint8Array.from([
        ...arrayifiedAddr,
        ...arrayifiedCreds,
        ...arrayifiedSmallCredsSecret,
      ]);
      const smallCredsHash = blake.blake2s(msg);
      const signatureKey = `${credentialName}Signature`;
      const signer = await ethers.utils.verifyMessage(
        smallCredsHash,
        unencryptedCreds[signatureKey]
      );
      if (signer.toLowerCase() != serverAddress.toLowerCase()) {
        console.log("HoloStore: signer != serverAddress");
        return false;
      }
    }
    return true;
  }
  async validateBigCredsSigs(unencryptedCreds) {
    const arrayifiedAddr = ethers.utils.arrayify(serverAddress);
    const arrayifiedBigCredsSecret = ethers.utils.arrayify(
      unencryptedCreds.bigCredsSecret
    );
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
    const arrayifiedBigCreds = ethers.utils.arrayify(Buffer.concat(credsArr));
    const msg = Uint8Array.from([
      ...arrayifiedAddr,
      ...arrayifiedBigCredsSecret,
      ...arrayifiedBigCreds,
    ]);
    const bigCredsHash = blake.blake2s(msg);
    const signer = await ethers.utils.verifyMessage(
      bigCredsHash,
      unencryptedCreds.bigCredsSignature
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
      chrome.storage.local.get(["holoCredentials"], (creds) => {
        resolve(creds?.holoCredentials);
      });
    });
  }
}

export { HoloStore };
