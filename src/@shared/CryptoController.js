/**
 * CryptoController handles encryption and decryption of user's
 * public-private keypair, which are used to encrypt and decrypt secrets
 * when they need to be sent accross a compromised communication channel or displayed.
 */

/**
 * IMPORTANT:
 * - Stores hash of user's password+salt as 'holoPasswordHash' in chrome.sync.storage
 * - Stores encrypted privateKey and publicKey as 'holoKeyPair' in chrome.sync.storage
 */

import passworder from "browser-passworder";
import { maxEncryptableLength } from "./constants";

/**
 * (Also defined in HoloStore.)
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
 * Generic type for a message encrypted with the encryptWithPublicKey function.
 * @typedef {object} Ciphertext
 * @property {boolean} sharded
 * @property {string|Array<string>} encryptedMessage
 */

class CryptoController {
  /**
   * Create initial password and public-private keypair.
   * Should be called only once ever.
   */
  async initialize(password) {
    await this.createPassword(password);
    await this.setIsLoggedInInSession(true);
    await this.generateKeyPair();
  }

  /**
   * Call when user sets password for first time.
   * @param {string} password
   */
  async createPassword(password) {
    // Commenting out. User should be allowed to generate new account and erase old one.
    // if (await this.getPasswordHash()) return;
    await this.setPasswordInSession(password);
    const salt = crypto.randomUUID();
    await this.setPasswordSalt(salt);
    const passwordHash = await this.hashPassword(password, salt);
    await this.setPasswordHash(passwordHash);
  }

  /**
   * Generate, encrypt, and store in browser storage a new key pair.
   * This should be called only once, when the user creates their fist password.
   */
  async generateKeyPair() {
    // Commenting out. User should be allowed to generate new account and erase old one.
    // if (await this.getKeyPair()) return;
    const algo = {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
    const usage = ["encrypt", "decrypt"];
    const keyPair = await crypto.subtle.generateKey(algo, true, usage);
    const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    await this.setPrivateKeyInSession(privateKey);
    const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const encryptedPrivateKey = await this.encryptWithPassword(privateKey);
    await this.setKeyPair(encryptedPrivateKey, publicKey);
  }

  /**
   * @param {string} password
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async login(password) {
    const salt = await this.getPasswordSalt();
    const passwordHash = await this.hashPassword(password, salt);
    const storedPasswordHash = await this.getPasswordHash();
    if (passwordHash != storedPasswordHash) return false;
    await this.setIsLoggedInInSession(true);
    await this.setPasswordInSession(password);
    const keyPair = await this.getKeyPair();
    const privateKey = await this.decryptWithPassword(keyPair.encryptedPrivateKey);
    await this.setPrivateKeyInSession(privateKey);
    return true;
  }

  async logout() {
    await this.setIsLoggedInInSession(false);
    await this.setPasswordInSession(undefined);
    await this.setPrivateKeyInSession(undefined);
  }

  async getIsLoggedIn() {
    return await this.getIsLoggedInFromSession();
  }

  async getIsRegistered() {
    const publicKey = await this.getPublicKey();
    return !!publicKey;
  }

  async changePassword(oldPassword, newPassword) {
    const salt = await this.getPasswordSalt();
    const oldPasswordHash = await this.hashPassword(oldPassword, salt);
    const storedPasswordHash = await this.getPasswordHash();
    if (oldPasswordHash != storedPasswordHash) return false;
    const newPasswordHash = await this.hashPassword(newPassword, salt);
    await this.setPasswordHash(newPasswordHash);
    return true;
  }

  /**
   * @param {string} encryptedPrivateKey Encrypted private key
   * @param {SubtleCrypto.JWK} publicKey Plaintext public key
   */
  setKeyPair(encryptedPrivateKey, publicKey) {
    return new Promise((resolve) => {
      const keyPair = {
        encryptedPrivateKey: encryptedPrivateKey,
        publicKey: publicKey,
      };
      chrome.storage.local.set({ holoKeyPair: keyPair }, resolve);
    });
  }

  getKeyPair() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["holoKeyPair"], (result) =>
        resolve(result?.holoKeyPair)
      );
    });
  }

  /**
   * @returns {SubtleCrypto.JWK} Public key which can be used to encrypt messages to user.
   */
  getPublicKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["holoKeyPair"], (result) =>
        resolve(result?.holoKeyPair?.publicKey)
      );
    });
  }

  // ----------------------------------------------------
  // BEGIN chrome.storage.session getters and setters
  // ----------------------------------------------------

  // get/set private key
  setPrivateKeyInSession(privateKey) {
    return new Promise((resolve) => {
      if (privateKey) {
        chrome.storage.session.set({ privateKey: privateKey }, () => resolve(true));
      } else {
        chrome.storage.session.remove(["privateKey"], () => resolve(true));
      }
    });
  }
  getPrivateKeyFromSession() {
    return new Promise((resolve) => {
      chrome.storage.session.get(["privateKey"], (result) =>
        resolve(result?.privateKey)
      );
    });
  }

  // get/set password
  setPasswordInSession(password) {
    return new Promise((resolve) => {
      if (password) {
        chrome.storage.session.set({ password: password }, () => resolve(true));
      } else {
        chrome.storage.session.remove(["password"], () => resolve(true));
      }
    });
  }
  getPasswordFromSession() {
    return new Promise((resolve) => {
      chrome.storage.session.get(["password"], (result) => resolve(result?.password));
    });
  }

  // get/set isLoggedIn
  setIsLoggedInInSession(isLoggedIn) {
    return new Promise((resolve) => {
      chrome.storage.session.set({ isLoggedIn: isLoggedIn }, () => resolve(true));
    });
  }
  getIsLoggedInFromSession() {
    return new Promise((resolve) => {
      chrome.storage.session.get(["isLoggedIn"], (result) =>
        resolve(result?.isLoggedIn)
      );
    });
  }

  // ----------------------------------------------------
  // END chrome.storage.session getters and setters
  // ----------------------------------------------------

  /**
   * @param {boolean} sharded Whether message is represented as encrypted shards.
   * @property {string|Array<string>} encryptedMessage If not sharded, this is a string
   * representation of the encrypted message. If sharded, it is an array consisting
   * of parts of the message that were individually encrypted; in this case, the
   * decrypted message can be recovered by decrypting each shard and concatenating
   * the result.
   * @returns {Promise<string>}
   */
  async decryptWithPrivateKey(encryptedMessage, sharded) {
    if (!encryptedMessage) {
      throw new Error(`Cannot decrypt the following message: ${encryptedMessage}`);
    }
    const algo = {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
    const privateKey = await this.getPrivateKeyFromSession();
    const privateKeyAsCryptoKey = await crypto.subtle.importKey(
      "jwk",
      privateKey,
      algo,
      false,
      ["decrypt"]
    );

    const shards = sharded ? encryptedMessage : [encryptedMessage];
    const decryptedDecodedShards = [];
    for (const shard of shards) {
      const encodedShard = new Uint8Array(JSON.parse(shard)).buffer;
      const decryptedShard = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKeyAsCryptoKey,
        encodedShard
      );
      const decoder = new TextDecoder("utf-8");
      const decodedShard = decoder.decode(decryptedShard);
      decryptedDecodedShards.push(decodedShard);
    }
    return decryptedDecodedShards.join("");
  }

  /**
   * @param {SubtleCrypto.JWK} publicKey
   * @param {string} message
   * @returns {Promise<string>} Encrypted message
   */
  async encrypt(publicKey, message = "hello world!") {
    const algo = {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
    let args = ["jwk", publicKey, algo, false, ["encrypt"]];
    const pubKeyAsCryptoKey = await crypto.subtle.importKey(...args);
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    args = ["RSA-OAEP", pubKeyAsCryptoKey, encodedMessage];
    const encryptedMessage = await crypto.subtle.encrypt(...args);
    return JSON.stringify(Array.from(new Uint8Array(encryptedMessage)));
  }

  /**
   * @param {Object} message
   * @returns {Promise<Ciphertext>}
   */
  async encryptWithPublicKey(message) {
    const encryptionKey = await this.getPublicKey();
    const stringifiedMsg = JSON.stringify(message);
    const usingSharding = stringifiedMsg.length > maxEncryptableLength;
    let encryptedMessage; // array<string> if sharding, string if not sharding
    if (usingSharding) {
      encryptedMessage = [];
      for (let i = 0; i < stringifiedMsg.length; i += maxEncryptableLength) {
        const shard = stringifiedMsg.substring(i, i + maxEncryptableLength);
        const encryptedShard = await this.encrypt(encryptionKey, shard);
        encryptedMessage.push(encryptedShard);
      }
    } else {
      encryptedMessage = await this.encrypt(encryptionKey, stringifiedMsg);
    }
    return { encryptedMessage: encryptedMessage, sharded: usingSharding };
  }

  /**
   * @param {object} data
   */
  async encryptWithPassword(data) {
    if (!(await this.getIsLoggedInFromSession())) return;
    const password = await this.getPasswordFromSession();
    return await passworder.encrypt(password, data);
  }

  /**
   * @param {string} data
   */
  async decryptWithPassword(data) {
    if (!(await this.getIsLoggedInFromSession())) return;
    const password = await this.getPasswordFromSession();
    return await passworder.decrypt(password, data);
  }

  /**
   * Hash function to be used for hashing user's password
   * @param {string} password
   * @param {string} salt
   * @returns {Promise<string>} Hash of data.
   */
  async hashPassword(password, salt) {
    if (!password || !salt) throw new Error("Missing argument");
    const data = password + salt;
    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(data);
    const hashArrayBuffer = await crypto.subtle.digest("SHA-256", encodedPassword);
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(hashArrayBuffer);
  }

  /**
   * @param {string} passwordHash Should be (password + salt)
   */
  setPasswordHash(passwordHash) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ holoPasswordHash: passwordHash }, resolve);
    });
  }

  getPasswordHash() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["holoPasswordHash"], (result) => {
        resolve(result?.holoPasswordHash);
      });
    });
  }

  setPasswordSalt(salt) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ holoPasswordSalt: salt }, resolve);
    });
  }

  getPasswordSalt() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["holoPasswordSalt"], (result) => {
        resolve(result?.holoPasswordSalt);
      });
    });
  }
}

export { CryptoController };
