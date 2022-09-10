var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function utf8ToBinaryString(str) {
  var escstr = encodeURIComponent(str);
  // replaces any uri escape sequence, such as %0A,
  // with binary escape, such as 0x0A
  var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  });

  return binstr;
}

function utf8ToBuffer(str) {
  var binstr = utf8ToBinaryString(str);
  var buf = binaryStringToBuffer(binstr);
  return buf;
}

function utf8ToBase64(str) {
  var binstr = utf8ToBinaryString(str);
  return btoa(binstr);
}

function binaryStringToUtf8(binstr) {
  var escstr = binstr.replace(/(.)/g, function (m, p) {
    var code = p.charCodeAt(0).toString(16).toUpperCase();
    if (code.length < 2) {
      code = '0' + code;
    }
    return '%' + code;
  });

  return decodeURIComponent(escstr);
}

function bufferToUtf8(buf) {
  var binstr = bufferToBinaryString(buf);

  return binaryStringToUtf8(binstr);
}

function base64ToUtf8(b64) {
  var binstr = atob(b64);

  return binaryStringToUtf8(binstr);
}

function bufferToBinaryString(buf) {
  var binstr = Array.prototype.map.call(buf, function (ch) {
    return String.fromCharCode(ch);
  }).join('');

  return binstr;
}

function bufferToBase64(arr) {
  var binstr = bufferToBinaryString(arr);
  return btoa(binstr);
}

function binaryStringToBuffer(binstr) {
  var buf;

  if ('undefined' !== typeof Uint8Array) {
    buf = new Uint8Array(binstr.length);
  } else {
    buf = [];
  }

  Array.prototype.forEach.call(binstr, function (ch, i) {
    buf[i] = ch.charCodeAt(0);
  });

  return buf;
}

function base64ToBuffer(base64) {
  var binstr = atob(base64);
  var buf = binaryStringToBuffer(binstr);
  return buf;
}

var browserifyUnibabel = {
  utf8ToBinaryString: utf8ToBinaryString
, utf8ToBuffer: utf8ToBuffer
, utf8ToBase64: utf8ToBase64
, binaryStringToUtf8: binaryStringToUtf8
, bufferToUtf8: bufferToUtf8
, base64ToUtf8: base64ToUtf8
, bufferToBinaryString: bufferToBinaryString
, bufferToBase64: bufferToBase64
, binaryStringToBuffer: binaryStringToBuffer
, base64ToBuffer: base64ToBuffer

// compat
, strToUtf8Arr: utf8ToBuffer
, utf8ArrToStr: bufferToUtf8
, arrToBase64: bufferToBase64
, base64ToArr: base64ToBuffer
};

var Unibabel = browserifyUnibabel;

var browserPassworder = {

  // Simple encryption methods:
  encrypt,
  decrypt,

  // More advanced encryption methods:
  keyFromPassword,
  encryptWithKey,
  decryptWithKey,

  // Buffer <-> Hex string methods
  serializeBufferForStorage,
  serializeBufferFromStorage,

  generateSalt,
};

// Takes a Pojo, returns cypher text.
function encrypt (password, dataObj) {
  var salt = generateSalt();

  return keyFromPassword(password, salt)
  .then(function (passwordDerivedKey) {
    return encryptWithKey(passwordDerivedKey, dataObj)
  })
  .then(function (payload) {
    payload.salt = salt;
    return JSON.stringify(payload)
  })
}

function encryptWithKey (key, dataObj) {
  var data = JSON.stringify(dataObj);
  var dataBuffer = Unibabel.utf8ToBuffer(data);
  var vector = commonjsGlobal.crypto.getRandomValues(new Uint8Array(16));
  return commonjsGlobal.crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: vector,
  }, key, dataBuffer).then(function (buf) {
    var buffer = new Uint8Array(buf);
    var vectorStr = Unibabel.bufferToBase64(vector);
    var vaultStr = Unibabel.bufferToBase64(buffer);
    return {
      data: vaultStr,
      iv: vectorStr,
    }
  })
}

// Takes encrypted text, returns the restored Pojo.
function decrypt (password, text) {
  const payload = JSON.parse(text);
  const salt = payload.salt;
  return keyFromPassword(password, salt)
  .then(function (key) {
    return decryptWithKey(key, payload)
  })
}

function decryptWithKey (key, payload) {
  const encryptedData = Unibabel.base64ToBuffer(payload.data);
  const vector = Unibabel.base64ToBuffer(payload.iv);
  return crypto.subtle.decrypt({name: 'AES-GCM', iv: vector}, key, encryptedData)
  .then(function (result) {
    const decryptedData = new Uint8Array(result);
    const decryptedStr = Unibabel.bufferToUtf8(decryptedData);
    const decryptedObj = JSON.parse(decryptedStr);
    return decryptedObj
  })
  .catch(function (reason) {
    throw new Error('Incorrect password')
  })
}

function keyFromPassword (password, salt) {
  var passBuffer = Unibabel.utf8ToBuffer(password);
  var saltBuffer = Unibabel.base64ToBuffer(salt);

  return commonjsGlobal.crypto.subtle.importKey(
    'raw',
    passBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  ).then(function (key) {

    return commonjsGlobal.crypto.subtle.deriveKey(
      { name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 10000,
        hash: 'SHA-256',
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  })
}

function serializeBufferFromStorage (str) {
  var stripStr = (str.slice(0, 2) === '0x') ? str.slice(2) : str;
  var buf = new Uint8Array(stripStr.length / 2);
  for (var i = 0; i < stripStr.length; i += 2) {
    var seg = stripStr.substr(i, 2);
    buf[i / 2] = parseInt(seg, 16);
  }
  return buf
}

// Should return a string, ready for storage, in hex format.
function serializeBufferForStorage (buffer) {
  var result = '0x';
  var len = buffer.length || buffer.byteLength;
  for (var i = 0; i < len; i++) {
    result += unprefixedHex(buffer[i]);
  }
  return result
}

function unprefixedHex (num) {
  var hex = num.toString(16);
  while (hex.length < 2) {
    hex = '0' + hex;
  }
  return hex
}

function generateSalt (byteCount = 32) {
  var view = new Uint8Array(byteCount);
  commonjsGlobal.crypto.getRandomValues(view);
  var b64encoded = btoa(String.fromCharCode.apply(null, view));
  return b64encoded
}

/**
 * CryptoController handles encryption and decryption of user's
 * public-private keypair, which are used to encrypt and decrypt secrets
 * when they need to be sent accross a compromised communication channel or displayed.
 */

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
      chrome.storage.local.set({ holoKeyPair: keyPair }, () => {
        resolve();
      });
    });
  }

  #getKeyPair() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["holoKeyPair"], (result) => {
        resolve(result?.holoKeyPair);
      });
    });
  }

  /**
   * @returns {SubtleCrypto.JWK} Public key which can be used to encrypt messages to user.
   */
  getPublicKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["holoKeyPair"], (result) => {
        resolve(result?.holoKeyPair?.publicKey);
      });
    });
  }

  /**
   * @param {EncryptedCredentials} encryptedCredentials
   * @returns {string}
   */
  async decryptWithPrivateKey(encryptedCredentials) {
    const { sharded, credentials } = encryptedCredentials;
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

    const credentialsShards = sharded ? credentials : [credentials];
    const decryptedDecodedShards = [];
    for (const shard of credentialsShards) {
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
   * @param {object} data
   */
  async encryptWithPassword(data) {
    return await browserPassworder.encrypt(this.#store.password, data);
  }

  /**
   * @param {string} data
   */
  async decryptWithPassword(data) {
    return await browserPassworder.decrypt(this.#store.password, data);
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
      chrome.storage.local.set({ holoPasswordHash: passwordHash }, () => {
        resolve();
      });
    });
  }

  #getPasswordHash() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["holoPasswordHash"], (result) => {
        resolve(result?.holoPasswordHash);
      });
    });
  }

  #setPasswordSalt(salt) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ holoPasswordSalt: salt }, () => {
        resolve();
      });
    });
  }

  #getPasswordSalt() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["holoPasswordSalt"], (result) => {
        resolve(result?.holoPasswordSalt);
      });
    });
  }
}

/**
 * API for storing Holo credentials.
 */

// import { ethers } from "ethers";
// import { blake2s } from "blakejs";
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

/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */

// --------------------------------------------------------------
// Functions for listening to messages from popups
// --------------------------------------------------------------

let confirmationPopupIsOpen = false;

const cryptoController = new CryptoController();
const holoStore = new HoloStore();
const extensionId =
  process.env.ENVIRONMENT == "dev"
    ? "cilbidmppfndfhjafdlngkaabddoofea"
    : "oehcghhbelloglknnpdgoeammglelgna";
const popupOrigin = `chrome-extension://${extensionId}`;
const allowedPopupCommands = [
  "holoPopupLogin",
  "getHoloLatestMessage",
  "getHoloCredentials",
  "confirmCredentials",
  "denyCredentials",
  "holoChangePassword",
  "holoInitializeAccount",
  "holoGetIsRegistered",
  "holoSendProofsToRelayer", // Triggers response to original setHoloCredentials message
  "closingHoloConfirmationPopup",
];

function popupListener(request, sender, sendResponse) {
  if (sender.origin != popupOrigin) return;
  if (!sender.url.includes(popupOrigin)) return;
  const command = request.command;
  if (!allowedPopupCommands.includes(command)) return;

  if (command == "holoPopupLogin") {
    const password = request.password;
    cryptoController.login(password).then((success) => {
      sendResponse({ success: success });
    });
    return true; // <-- This is required in order to use sendResponse async
  } else if (command == "getHoloLatestMessage") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => cryptoController.decryptWithPrivateKey(encryptedMsg))
      .then((decryptedMsg) => sendResponse({ credentials: JSON.parse(decryptedMsg) }));
    return true;
  } else if (command == "getHoloCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore
      .getCredentials()
      .then((encryptedCreds) => cryptoController.decryptWithPrivateKey(encryptedCreds))
      .then((decryptedCreds) =>
        sendResponse({ credentials: JSON.parse(decryptedCreds) })
      );
    return true;
  } else if (command == "confirmCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    let encryptedCreds = "";
    let unencryptedCreds;
    holoStore
      .getLatestMessage()
      .then((encryptedMsg) => {
        encryptedCreds = encryptedMsg;
        return cryptoController.decryptWithPrivateKey(encryptedMsg);
      })
      .then((decryptedCreds) => {
        unencryptedCreds = JSON.parse(decryptedCreds);
        const credentials = {
          unencryptedCreds: unencryptedCreds,
          encryptedCreds: encryptedCreds,
        };
        return holoStore.setCredentials(credentials);
      })
      .then((setCredsSuccess) => {
        // TODO: handle case where setCredsSuccess == false
        return holoStore.setLatestMessage("");
      })
      .then((setMsgSuccess) => sendResponse({}));
    return true;
  } else if (command == "denyCredentials") {
    const loggedIn = cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    holoStore.setLatestMessage("");
  } else if (command == "holoChangePassword") {
    const oldPassword = request.oldPassword;
    const newPassword = request.newPassword;
    cryptoController
      .changePassword(oldPassword, newPassword)
      .then((changePwSuccess) => sendResponse({ success: changePwSuccess }));
    return true;
  } else if (command == "holoInitializeAccount") {
    const password = request.password;
    cryptoController
      .initialize(password) // TODO: initialize() doesn't return anything
      .then((success) => sendResponse({ success: success }));
    return true;
  } else if (command == "holoGetIsRegistered") {
    cryptoController
      .getIsRegistered()
      .then((isRegistered) => sendResponse({ isRegistered: isRegistered }));
    return true;
  } else if (command == "holoSendProofsToRelayer") ; else if (command == "closingHoloConfirmationPopup") {
    confirmationPopupIsOpen = false;
  }
}

async function displayConfirmationPopup() {
  if (confirmationPopupIsOpen) return;
  confirmationPopupIsOpen = true;
  const config = {
    focused: true,
    height: 530,
    width: 400,
    incognito: false,
    setSelfAsOpener: false,
    type: "popup",
    url: "confirmation_popup.html",
  };
  try {
    const window = await chrome.windows.create(config);
  } catch (err) {
    console.log(err);
    confirmationPopupIsOpen = false;
  }
}

// --------------------------------------------------------------
// Functions for listening to messages from webpage
// --------------------------------------------------------------

/**
 * @returns {Promise<SubtleCrypto.JWK>} Public key which can be used to encrypt messages to user.
 */
function getPublicKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["holoKeyPair"], (result) => {
      resolve(result?.holoKeyPair?.publicKey);
    });
  });
}

const allowedOrigins = ["http://localhost:3002", "https://app.holonym.id"];
const allowedWebPageCommands = [
  "getHoloPublicKey",
  // "getHoloCredentials",
  "setHoloCredentials",
  "holoGetIsRegistered",
];

// Listener function for messages from webpage
function webPageListener(request, sender, sendResponse) {
  const potentialOrigin = sender.origin || sender.url;
  if (!allowedOrigins.includes(potentialOrigin)) {
    throw new Error("Disallowed origin attempting to access or modify HoloStore.");
  }
  const command = request.command;
  const credsAreSharded = request.sharded;
  const newCreds = request.credentials;

  if (!allowedWebPageCommands.includes(command)) {
    return;
  }

  if (command == "getHoloPublicKey") {
    getPublicKey().then((publicKey) => sendResponse(publicKey));
    return true;
  } else if (command == "setHoloCredentials") {
    const latestMessage = {
      sharded: credsAreSharded,
      credentials: newCreds,
    };
    holoStore.setLatestMessage(latestMessage).then(() => displayConfirmationPopup());
    return;
  } else if (command == "holoGetIsRegistered") {
    cryptoController
      .getIsRegistered()
      .then((isRegistered) => sendResponse({ isRegistered: isRegistered }));
    return true;
  }
}

chrome.runtime.onMessage.addListener(popupListener);
chrome.runtime.onMessageExternal.addListener(webPageListener);
