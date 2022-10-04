/**
 * API for storing Holo credentials.
 */

/**
 * @typedef {Object} DecryptedCredentials
 * (See requiredCredsKeys below for properties.)
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
 * @property {EncryptedCredentials} encryptedCreds
 * @property {DecryptedCredentials} [unencryptedCreds] Used for validation
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
   * @param {*} message
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
    if (!credentials.encryptedCreds) {
      console.log("HoloStore: credentials object missing encryptedCreds property");
      return false;
    }
    // TODO: More rigorous validation?
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
