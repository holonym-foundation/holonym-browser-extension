/**
 * CryptoController handles encryption and decryption of user's
 * public-private keypair, which are used to encrypt and decrypt secrets
 * when they need to be sent accross a compromised communication channel or displayed.
 */

// TODO: Figure out how to have a single CryptoController, instead of one
//        in general/ and one in this directory. Maybe write a cryptoWrapper class.

/**
 * IMPORTANT:
 * - Stores hash of user's password as 'holoPasswordHashHash' in chrome.sync.storage
 * - Stores encrypted privateKey and publicKey as 'holoKeyPair' in chrome.sync.storage
 */

import passworder from "browser-passworder";

class CryptoController {
  #store;

  constructor() {
    this.#store = {
      password: undefined, // string
      privateKey: undefined, // string. SubtleCrypto.JWK when decrypted
      // publicKey: undefined, // SubtleCrypto.JWK
    };
  }

  /**
   * Create initial password and public-private keypair.
   * Should be called only once ever.
   */
  async initialize(password) {
    await this.#createPassword(password);
    await this.#generateKeyPair();
  }

  /**
   * Call when user sets password for first time.
   * @param {string} password
   */
  async #createPassword(password) {
    if (await this.#getPasswordHash()) return;
    this.#store.password = password;
    const passwordHash = await this.hash(password);
    await this.#setPasswordHash(passwordHash);
  }

  /**
   * Generate, encrypt, and store in browser storage a new key pair.
   * This should be called only once, when the user creates their fist password.
   */
  async #generateKeyPair() {
    if (await this.#getKeyPair()) return;

    const algo = {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
    const usage = ["encrypt", "decrypt"];
    const keyPair = await crypto.subtle.generateKey(algo, true, usage);
    const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const encryptedPrivateKey = await this.encryptWithPassword(privateKey);
    await this.#setKeyPair(encryptedPrivateKey, publicKey);
  }

  /**
   * @param {string} password
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async login(password) {
    const passwordHash = await this.hash(password);
    const storedPasswordHash = await this.#getPasswordHash();
    if (passwordHash != storedPasswordHash) return false;
    this.#store.password = password;
    const keyPair = await this.#getKeyPair();
    this.#store.privateKey = await this.decryptWithPassword(keyPair.privateKey);
    return true;
  }

  logout() {
    this.#store = {
      password: undefined,
      privateKey: undefined,
    };
  }

  async changePassword(oldPassword, newPassword) {
    const oldPasswordHash = await this.hash(oldPassword);
    const storedPasswordHash = await this.#getPasswordHash();
    if (oldPasswordHash != storedPasswordHash) return false;
    const newPasswordHash = await this.hash(newPassword);
    await this.#setPasswordHash(newPasswordHash);
    return true;
  }

  /**
   * @param {string} privateKey Encrypted private key
   * @param {SubtleCrypto.JWK} publicKey Plaintext public key
   */
  #setKeyPair(privateKey, publicKey) {
    return new Promise((resolve) => {
      const keyPair = {
        privateKey: privateKey,
        publicKey: publicKey,
      };
      chrome.storage.sync.set({ holoKeyPair: keyPair }, () => {
        resolve();
      });
    });
  }

  #getKeyPair() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["holoKeyPair"], (result) => {
        resolve(result.holoKeyPair);
      });
    });
  }

  /**
   * @returns {SubtleCrypto.JWK} Public key which can be used to encrypt messages to user.
   */
  getPublicKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["holoKeyPair"], (result) => {
        resolve(result.holoKeyPair.publicKey);
      });
    });
  }

  async decryptWithPrivateKey(message) {
    const algo = {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
    const privateKeyAsCryptoKey = await crypto.subtle.importKey(
      "jwk",
      this.#store.privateKey,
      algo,
      false,
      ["decrypt"]
    );
    const encodedMessage = new Uint8Array(JSON.parse(message)).buffer;
    const decryptedMessage = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKeyAsCryptoKey,
      encodedMessage
    );
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(decryptedMessage);
  }

  /**
   * @param {object} data
   */
  async encryptWithPassword(data) {
    return await passworder.encrypt(this.#store.password, data);
  }

  /**
   * @param {string} data
   */
  async decryptWithPassword(data) {
    return await passworder.decrypt(this.#store.password, data);
  }

  /**
   * Hash function to be used for hashing user's password
   * @param {string} data
   * @returns {Promise<string>} Hash of data.
   */
  async hash(data) {
    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(data);
    const hashArrayBuffer = await crypto.subtle.digest("SHA-256", encodedPassword);
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(hashArrayBuffer);
  }

  #setPasswordHash(passwordHash) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ holoPasswordHash: passwordHash }, () => {
        resolve();
      });
    });
  }

  #getPasswordHash() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["holoPasswordHash"], (result) => {
        resolve(result.holoPasswordHash);
      });
    });
  }
}

export { CryptoController };
