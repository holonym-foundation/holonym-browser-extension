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

class CryptoController {
  #store;
  #isLoggedIn;

  constructor() {
    this.#store = {
      password: undefined, // string
      decryptedPrivateKey: undefined, // SubtleCrypto.JWK
      // publicKey: undefined, // SubtleCrypto.JWK
    };
    this.#isLoggedIn = false;
  }

  /**
   * Create initial password and public-private keypair.
   * Should be called only once ever.
   */
  async initialize(password) {
    await this.#createPassword(password);
    await this.#generateKeyPair();
    this.#isLoggedIn = true;
  }

  /**
   * Call when user sets password for first time.
   * @param {string} password
   */
  async #createPassword(password) {
    // Commenting out. User should be allowed to generate new account and erase old one.
    // if (await this.#getPasswordHash()) return;
    this.#store.password = password;
    const salt = crypto.randomUUID();
    await this.#setPasswordSalt(salt);
    const passwordHash = await this.hashPassword(password, salt);
    await this.#setPasswordHash(passwordHash);
  }

  /**
   * Generate, encrypt, and store in browser storage a new key pair.
   * This should be called only once, when the user creates their fist password.
   */
  async #generateKeyPair() {
    // Commenting out. User should be allowed to generate new account and erase old one.
    // if (await this.#getKeyPair()) return;
    const algo = {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
    const usage = ["encrypt", "decrypt"];
    const keyPair = await crypto.subtle.generateKey(algo, true, usage);
    const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    this.#store.decryptedPrivateKey = privateKey;
    const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const encryptedPrivateKey = await this.encryptWithPassword(privateKey);
    await this.#setKeyPair(encryptedPrivateKey, publicKey);
  }

  /**
   * @param {string} password
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async login(password) {
    const salt = await this.#getPasswordSalt();
    const passwordHash = await this.hashPassword(password, salt);
    const storedPasswordHash = await this.#getPasswordHash();
    if (passwordHash != storedPasswordHash) return false;
    this.#store.password = password;
    const keyPair = await this.#getKeyPair();
    this.#store.decryptedPrivateKey = await this.decryptWithPassword(
      keyPair.encryptedPrivateKey
    );
    this.#isLoggedIn = true;
    return true;
  }

  logout() {
    this.#store = {
      password: undefined,
      decryptedPrivateKey: undefined,
    };
    this.#isLoggedIn = false;
  }

  getIsLoggedIn() {
    return this.#isLoggedIn;
  }

  async getIsRegistered() {
    const publicKey = await this.getPublicKey();
    return !!publicKey;
  }

  async changePassword(oldPassword, newPassword) {
    const salt = await this.#getPasswordSalt();
    const oldPasswordHash = await this.hashPassword(oldPassword, salt);
    const storedPasswordHash = await this.#getPasswordHash();
    if (oldPasswordHash != storedPasswordHash) return false;
    const newPasswordHash = await this.hashPassword(newPassword, salt);
    await this.#setPasswordHash(newPasswordHash);
    return true;
  }

  /**
   * @param {string} encryptedPrivateKey Encrypted private key
   * @param {SubtleCrypto.JWK} publicKey Plaintext public key
   */
  #setKeyPair(encryptedPrivateKey, publicKey) {
    return new Promise((resolve) => {
      const keyPair = {
        encryptedPrivateKey: encryptedPrivateKey,
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
      this.#store.decryptedPrivateKey,
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

  #setPasswordSalt(salt) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ holoPasswordSalt: salt }, () => {
        resolve();
      });
    });
  }

  #getPasswordSalt() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["holoPasswordSalt"], (result) => {
        resolve(result.holoPasswordSalt);
      });
    });
  }
}

export { CryptoController };
