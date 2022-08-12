/**
 * CryptoController handles encryption and decryption of user's
 * public-private keypair, which are used to encrypt and decrypt secrets
 * when they need to be sent accross a compromised communication channel or displayed.
 */

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
      privateKey: undefined, // SubtleCrypto.JWK
      // publicKey: undefined, // SubtleCrypto.JWK
    };

    // FOR TESTING ONLY
    this.initialize("test");
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
    // if (await this.#getPasswordHash()) return;
    this.#store.password = password;
    const passwordHash = await this.hash(password);
    await this.#setPasswordHash(passwordHash);
  }

  /**
   * Generate, encrypt, and store in browser storage a new key pair.
   * This should be called only once, when the user creates their fist password.
   */
  async #generateKeyPair() {
    // if (await this.#getKeyPair()) return;

    const algo = {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
    const usage = ["encrypt", "decrypt"];
    const keyPair = await window.crypto.subtle.generateKey(algo, true, usage);
    const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const encryptedPrivateKey = await this.encryptWithPassword(privateKey);
    await this.#setKeyPair(encryptedPrivateKey, publicKey);
  }

  /**
   * @param {string} password
   * @returns True if successful, false otherwise.
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
        console.log(
          `CryptoController: Stored encrypted private key and plaintext public key`
        ); // TODO: Delete. For tests only
        resolve();
      });
    });
  }

  #getKeyPair() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["holoKeyPair"], (result) => {
        console.log(`CryptoController: Getting key pair`); // TODO: Delete. For tests only
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
        console.log(`CryptoController: Getting public key`); // TODO: Delete. For tests only
        resolve(result.holoKeyPair.publicKey);
      });
    });
  }

  /**
   * @param {object} data
   */
  async encryptWithPassword(data) {
    console.log("encryptWithPassword: this.#store.password...");
    console.log(this.#store.password);
    return await passworder.encrypt(this.#store.password, data);
  }

  /**
   * @param {string} data
   */
  async decryptWithPassword(data) {
    console.log("decryptWithPassword: this.#store.password...");
    console.log(this.#store.password);
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
    const hashArrayBuffer = await window.crypto.subtle.digest(
      "SHA-256",
      encodedPassword
    );
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(hashArrayBuffer);
  }

  #setPasswordHash(passwordHash) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ holoPasswordHash: passwordHash }, () => {
        console.log(`CryptoController: Stored password hash`); // TODO: Delete. For tests only
        resolve();
      });
    });
  }

  #getPasswordHash() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["holoPasswordHash"], (result) => {
        console.log(`CryptoController: Getting password hash`); // TODO: Delete. For tests only
        resolve(result.holoPasswordHash);
      });
    });
  }

  // TODO: Implement way to receive encrypted messages and to then securely decrypt
  // those messages with the user's private key.
}

export { CryptoController };
