/**
 * API for storing Holo credentials.
 */

// import { ethers } from "ethers";
// import { Buffer } from "buffer/";
// import { getStateAsBytes, getDateAsBytes } from "./utils";
// import { serverAddress, threeZeroedBytes } from "./constants";

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

const credentialNames = ["countryCode", "subdivision", "completedAt", "birthdate"];
const requiredCredsKeys = [...credentialNames, "secret", "signature"];

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
      } else {
        const encryptedCreds = credentials.encryptedCreds;
        chrome.storage.local.set({ holoCredentials: encryptedCreds }, () => {
          // TODO: Display success message to user
          console.log(`HoloStore: Storing credentials`);
          resolve(true);
        });
      }
    });
  }

  validateCredentials(credentials) {
    if (!credentials.unencryptedCreds || !credentials.encryptedCreds) {
      console.log(
        "HoloStore: credentials object missing unencryptedCreds or encryptedCreds"
      );
      return false;
    }
    // console.log("UNENCRYPTED DELETE THIS", credentials, credentials?.unencryptedCreds)
    // // Ensure unencryptedCreds object has all and only the required keys
    // const unencryptedCredsKeys = Object.keys(credentials.unencryptedCreds);
    // const keysDiff = unencryptedCredsKeys
    //   .filter((key) => !requiredCredsKeys.includes(key))
    //   .concat(requiredCredsKeys.filter((key) => !unencryptedCredsKeys.includes(key)));
    // // if (keysDiff.length > 0) {
    // //   console.log(
    // //     "HoloStore: credentials.unencryptedCreds does not have correct keys"
    // //   );
    // //   return false;
    // // }

    return true;
  }
  /**
   * @returns The last valid value that was supplied to setCredentials as credentials.encryptedCreds
   */
  getCredentials() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(["holoCredentials"], (creds) => {
        console.log("DELETE THIS CONSOLE LOG", creds)
        console.log("DELETE THIS CONSOLE LOGg", creds.holoCredentials)
        resolve(creds?.holoCredentials);
      });
    });
  }
}

export { HoloStore };
