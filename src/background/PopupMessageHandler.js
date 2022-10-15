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
import HoloCache from "./HoloCache";
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

  static async getStagedCredentials(request) {
    try {
      const loggedIn = await cryptoController.getIsLoggedIn();
      if (!loggedIn) return { message: {} };
      const encryptedStagedCreds = await holoStore.getStagedCredentials();
      if (!encryptedStagedCreds) return { message: {} };
      const decryptedMsg = await cryptoController.decryptWithPrivateKey(
        encryptedStagedCreds.credentials,
        encryptedStagedCreds.sharded
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

  static async confirmCredentials(request) {
    try {
      await HoloCache.setConfirmCredentials(true);
      const loggedIn = await cryptoController.getIsLoggedIn();
      if (!loggedIn) return;
      const encryptedStagedCreds = await holoStore.getStagedCredentials();
      if (!encryptedStagedCreds) return;
      const decryptedCreds = await cryptoController.decryptWithPrivateKey(
        encryptedStagedCreds.credentials,
        encryptedStagedCreds.sharded
      );
      if (!decryptedCreds) return;
      const parsedDecryptedCreds = JSON.parse(decryptedCreds);
      const newSecret = new Uint8Array(16);
      crypto.getRandomValues(newSecret); // Generate new secret
      parsedDecryptedCreds.newSecret = ethers.BigNumber.from(newSecret).toHexString();
      const encryptedMsg = await cryptoController.encryptWithPublicKey(
        parsedDecryptedCreds
      );
      if (!encryptedMsg) return;
      const credentials = {
        unencryptedCreds: parsedDecryptedCreds,
        encryptedCreds: {
          credentials: encryptedMsg.encryptedMessage,
          sharded: encryptedMsg.sharded,
        },
      };
      const setCredsSuccess = await holoStore.setCredentials(credentials);
      if (!setCredsSuccess) return;
      return await holoStore.setStagedCredentials("");
    } catch (err) {
      return { error: err };
    }
  }

  static async denyCredentials(request) {
    const loggedIn = await cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    return holoStore.setStagedCredentials("");
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
    await HoloCache.setConfirmShareCredentials(true);
  }

  static async closingHoloCredentialsConfirmationPopup(request) {
    await HoloCache.setCredentialsConfirmationPopupIsOpen(false);
  }

  static async closingHoloShareCredsConfirmationPopup(request) {
    await HoloCache.setShareCredsConfirmationPopupIsOpen(false);
  }
}

export default PopupMessageHandler;
