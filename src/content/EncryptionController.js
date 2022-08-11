/**
 * EncryptionController handles encryption and decryption of user's
 * public-private keypair, which are used to encrypt and decrypt secrets
 * when they need to be sent accross a compromised communication channel or displayed.
 */

/**
 * IMPORTANT:
 * - Stores hash of user's password as 'holoPasswordHashHash' in chrome.sync.storage
 * - Stores encrypted privateKey and publicKey as 'holoKeyPair' in chrome.sync.storage
 */

import passworder from "browser-passworder";

class EncryptionController {
  #store;

  constructor() {
    this.#store = {
      password: undefined, // string
      privateKey: undefined, // SubtleCrypto.JWK
      publicKey: undefined, // SubtleCrypto.JWK
    };
  }

  /**
   * Create initial password and public-private keypair.
   * Should be called only once ever.
   */
  async initialize(password) {
    await createPassword(password);
    await this.generateKeyPair();
  }

  /**
   * Call when user sets password for first time.
   * @param {string} password
   */
  async createPassword(password) {
    if (await this.#getPasswordHash()) return;
    const passwordHash = await this.hash(password);
    await this.#setPasswordHash(passwordHash);
  }

  /**
   * Generate, encrypt, and store in browser storage a new key pair.
   * This should be called only once, when the user creates their fist password.
   */
  async generateKeyPair() {
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
    const keyPairObj = {
      privateKey: privateKey,
      publicKey: publicKey,
    };
    const encryptedKeyPair = await this.encryptWithPassword(keyPairObj);
    await this.#setEncryptedKeyPair(encryptedKeyPair);
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
    const encryptedKeyPair = await this.#getEncryptedKeyPair();
    const keyPair = await this.decryptWithPassword(encryptedKeyPair);
    this.#store.publicKey = keyPair.publicKey;
    this.#store.privateKey = keyPair.privateKey;
    return true;
  }

  logout() {
    this.#store = {
      password: undefined,
      privateKey: undefined,
      publicKey: undefined,
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
   * @param {string} keyPair Encrypted key pair
   */
  #setEncryptedKeyPair(keyPair) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ holoKeyPair: keyPair }, () => {
        console.log(`EncryptionController: Stored encrypted key pair`); // TODO: Delete. For tests only
        resolve();
      });
    });
  }

  #getEncryptedKeyPair() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["holoKeyPair"], (encryptedKeyPair) => {
        console.log(`EncryptionController: Getting encrypted key pair`); // TODO: Delete. For tests only
        resolve(encryptedKeyPair);
      });
    });
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
        console.log(`EncryptionController: Stored password hash`); // TODO: Delete. For tests only
        resolve();
      });
    });
  }

  #getPasswordHash() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["holoPasswordHash"], (passwordHash) => {
        console.log(`EncryptionController: Getting password hash`); // TODO: Delete. For tests only
        resolve(passwordHash);
      });
    });
  }

  /**
   * @returns {SubtleCrypto.JWK} Public key which can be used to encrypt messages to user.
   */
  getPublicKey() {
    return this.#store.publicKey;
  }

  // TODO: Implement way to receive encrypted messages and to then securely decrypt
  // those messages with the user's private key.
}

export { EncryptionController };
