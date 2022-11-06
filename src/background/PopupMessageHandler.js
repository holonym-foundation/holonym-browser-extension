/**
 * Message handlers handle messages.
 *
 * The public functions of these classes should be treated as if they can be called
 * directly by the frontend or popup: Do not add a function that could expose user
 * data to the wrong party.
 */

// import { ethers } from "ethers";
import { CryptoController } from "../@shared/CryptoController";
import { HoloStore } from "../@shared/HoloStore";
import HoloCache from "../@shared/HoloCache";
import { generateSecret } from "../@shared/utils";

const cryptoController = new CryptoController();
const holoStore = new HoloStore();

async function decryptAndParseCredentials(credentials) {
  const decryptedStagedCreds = await cryptoController.decryptWithPrivateKey(
    credentials.credentials,
    credentials.sharded
  );
  if (!decryptedStagedCreds) return;
  return JSON.parse(decryptedStagedCreds);
}

async function getAndDecryptStagedCredentials() {
  const encryptedStagedCreds = await holoStore.getStagedCredentials();
  if (!encryptedStagedCreds) return;
  return await decryptAndParseCredentials(encryptedStagedCreds);
}

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
      const decryptedStagedCreds = await getAndDecryptStagedCredentials();
      if (!decryptedStagedCreds) return { message: {} };
      return { message: { credentials: decryptedStagedCreds } };
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
      return await decryptAndParseCredentials(encryptedCreds);
    } catch (err) {
      return { error: err };
    }
  }

  // TODO: Ensure frontend (for calls to setCredentials and to getCredentials),
  // popup frontend, and all other parts of code are compatible with these changes
  static async confirmCredentials(request) {
    try {
      await HoloCache.setConfirmCredentials(true);
      const loggedIn = await cryptoController.getIsLoggedIn();
      if (!loggedIn) return;
      const parsedDecryptedStagedCreds = await getAndDecryptStagedCredentials();
      parsedDecryptedStagedCreds.newSecret = generateSecret();
      const issuer = parsedDecryptedStagedCreds.issuer;
      if (!issuer) throw new Error("No issuer found in credentials");
      if (typeof issuer != "string") {
        throw new Error(
          `issuer is type ${typeof issuer}. issuer must be type "string"`
        );
      }
      const updatedCreds = { [issuer]: parsedDecryptedStagedCreds };
      const encryptedCurrentCreds = await holoStore.getCredentials();
      // Add current creds to updated creds if current creds exist
      if (encryptedCurrentCreds) {
        const decryptedCurrentCreds = await decryptAndParseCredentials(
          encryptedCurrentCreds
        );
        // TODO: Remove these deletes after the team has gotten their new credentials
        Object.assign(updatedCreds, { ...decryptedCurrentCreds, ...updatedCreds });
      }

      const encryptedUpdatedCreds = await cryptoController.encryptWithPublicKey(
        updatedCreds
      );
      if (!encryptedUpdatedCreds) return;
      const setCredsSuccess = await holoStore.setCredentials({
        unencryptedCreds: updatedCreds,
        encryptedCreds: {
          credentials: encryptedUpdatedCreds.encryptedMessage,
          sharded: encryptedUpdatedCreds.sharded,
        },
      });
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

  static async holoGetLeafTxMetadata(request) {
    const loggedIn = await cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    const encryptedLeaves = await holoStore.getLeaves();
    if (!encryptedLeaves) return;
    return JSON.parse(
      await cryptoController.decryptWithPrivateKey(
        encryptedLeaves.encryptedMessage,
        encryptedLeaves.sharded
      )
    );
  }

  static async holoGetSubmittedProofs(request) {
    const loggedIn = await cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    const encryptedProofMetadata = await holoStore.getSubmittedProofs();
    if (!encryptedProofMetadata) return;
    return JSON.parse(
      await cryptoController.decryptWithPrivateKey(
        encryptedProofMetadata.encryptedMessage,
        encryptedProofMetadata.sharded
      )
    );
  }
}

export default PopupMessageHandler;
