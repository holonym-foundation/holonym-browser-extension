/**
 * Message handlers handle messages.
 *
 * The public functions of these classes should be treated as if they can be called
 * directly by the frontend or popup: Do not add a function that could expose user
 * data to the wrong party.
 */

import { ethers } from "ethers";
import { CryptoController } from "./CryptoController";
import { HoloStore } from "./HoloStore";
import { sleep } from "./utils";

const cryptoController = new CryptoController();
const holoStore = new HoloStore();

class PopupMessageHandler {
  static async holoPopupLogin(request) {
    const password = request.password;
    try {
      const success = await cryptoController.login(password);
      return { success: success };
    } catch (err) {
      return { error: err?.message };
    }
  }

  static async holoGetIsLoggedIn(request) {
    const loggedIn = await cryptoController.getIsLoggedIn();
    return { isLoggedIn: loggedIn };
  }

  static async getHoloLatestMessage(request) {
    try {
      const loggedIn = await cryptoController.getIsLoggedIn();
      if (!loggedIn) return { message: {} };
      const encryptedMsg = await holoStore.getLatestMessage();
      if (!encryptedMsg) return { message: {} };
      const decryptedMsg = await cryptoController.decryptWithPrivateKey(
        encryptedMsg.credentials,
        encryptedMsg.sharded
      );
      if (!decryptedMsg) return { message: {} };
      return { message: { credentials: JSON.parse(decryptedMsg) } };
    } catch (err) {
      return { message: {} };
    }
  }

  static async getHoloCredentials(request) {
    try {
      const loggedIn = await cryptoController.getIsLoggedIn();
      if (!loggedIn) return;
      const encryptedCreds = await holoStore.getCredentials();
      if (!encryptedCreds) return;
      const decryptedCreds = await cryptoController.decryptWithPrivateKey(
        encryptedCreds.credentials,
        encryptedCreds.sharded
      );
      if (!decryptedCreds) return;
      return JSON.parse(decryptedCreds);
    } catch (err) {
      return { error: err };
    }
  }

  setPasswordInSession(password) {
    return;
  }
  getPasswordFromSession() {
    return new Promise((resolve) => {
      chrome.storage.session.get(["password"], (result) => resolve(result?.password));
    });
  }

  static async confirmCredentials(request) {
    try {
      // confirmCredentials = true;
      // TODO: Put this promise in a function in a file called HoloCache or something like that
      await new Promise((resolve) => {
        chrome.storage.session.set({ confirmCredentials: true }, () => resolve(true));
      });
      const loggedIn = await cryptoController.getIsLoggedIn();
      if (!loggedIn) return {};
      const latestMsg = await holoStore.getLatestMessage();
      if (!latestMsg) return {};
      const decryptedCreds = await cryptoController.decryptWithPrivateKey(
        latestMsg.credentials,
        latestMsg.sharded
      );
      if (!decryptedCreds) return {};
      const parsedDecryptedCreds = JSON.parse(decryptedCreds);
      const newSecret = new Uint8Array(16);
      crypto.getRandomValues(newSecret); // Generate new secret
      parsedDecryptedCreds.newSecret = ethers.BigNumber.from(newSecret).toHexString();
      const encryptedMsg = await cryptoController.encryptWithPublicKey(
        parsedDecryptedCreds
      );
      if (!encryptedMsg) return {};
      const credentials = {
        unencryptedCreds: parsedDecryptedCreds,
        encryptedCreds: {
          credentials: encryptedMsg.encryptedMessage,
          sharded: encryptedMsg.sharded,
        },
      };
      const setCredsSuccess = await holoStore.setCredentials(credentials);
      if (!setCredsSuccess) return {};
      return await holoStore.setLatestMessage("");
    } catch (err) {
      return { error: err };
    }
  }

  static async denyCredentials(request) {
    const loggedIn = await cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    return holoStore.setLatestMessage("");
  }

  static async holoChangePassword(request) {
    const oldPassword = request.oldPassword;
    const newPassword = request.newPassword;
    const changePwSuccess = await cryptoController.changePassword(
      oldPassword,
      newPassword
    );
    return { success: changePwSuccess };
  }

  static async holoInitializeAccount(request) {
    const password = request.password;
    // TODO: initialize() doesn't return anything
    const success = await cryptoController.initialize(password);
    return { success: success };
  }

  static async holoGetIsRegistered(request) {
    const isRegistered = await cryptoController.getIsRegistered();
    return { isRegistered: isRegistered };
  }

  static async confirmShareCredentials(request) {
    // confirmShareCredentials = true;
    // TODO: Put this promise in a function in a file called HoloCache or something like that
    await new Promise((resolve) => {
      chrome.storage.session.set({ confirmShareCredentials: true }, () =>
        resolve(true)
      );
    });
  }

  static async closingHoloCredentialsConfirmationPopup(request) {
    // credentialsConfirmationPopupIsOpen = false;
    // TODO: Put this promise in a function in a file called HoloCache or something like that
    await new Promise((resolve) => {
      chrome.storage.session.set({ credentialsConfirmationPopupIsOpen: false }, () =>
        resolve(true)
      );
    });
  }

  static async closingHoloShareCredsConfirmationPopup(request) {
    // shareCredsConfirmationPopupIsOpen = false;
    // TODO: Put this promise in a function in a file called HoloCache or something like that
    await new Promise((resolve) => {
      chrome.storage.session.set({ shareCredsConfirmationPopupIsOpen: false }, () =>
        resolve(true)
      );
    });
  }
}

export default PopupMessageHandler;
