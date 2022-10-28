/**
 * NOTE: Before messages are sent to this handler, they should be authenticated,
 * since this class is used by both the background script and content script. Only
 * messages sent directly to the background script should be able to call privileged
 * endpoints. See constants.js for privileged commands.
 * TODO: Perhaps separate this into a TrustedWebpageMessageHandler and an UntrustedWebpageMessageHandler
 */
import { ethers } from "ethers";
import { CryptoController } from "./CryptoController";
import { HoloStore } from "./HoloStore";
import HoloCache from "./HoloCache";
import { sleep } from "./utils";

const cryptoController = new CryptoController();
const holoStore = new HoloStore();

/**
 * @param {string} type "credentials" | "share-creds" | "set-password"; the desired popup type
 */
async function displayPopup(type) {
  let url = "";
  if (type == "credentials") {
    // if (await HoloCache.getCredentialsConfirmationPopupIsOpen()) return;
    await HoloCache.setCredentialsConfirmationPopupIsOpen(true);
    url = "credentials_confirmation_popup.html";
  } else if (type == "share-creds") {
    // TODO: Figure out best way to handle case where user closes popup, and
    // shareCredsConfirmationPopupIsOpen does not get set to false. Timeouts? Event emitters?
    // if (await HoloCache.getShareCredsConfirmationPopupIsOpen()) return;
    await HoloCache.setShareCredsConfirmationPopupIsOpen(true);
    url = "share_creds_confirmation_popup.html";
  } else if (type == "set-password") {
    url = "set_password_popup.html";
  }

  // Get info needed to position popup at the top right of the currently focused window
  function getWindowWidthAndTop() {
    return new Promise((resolve) => {
      const callback = (window) => {
        const width = window.width + window.left;
        const top = window.top;
        resolve({ width: width, top: top });
      };
      chrome.windows.getCurrent(callback);
    });
  }
  const { width: windowWidth, top: windowTop } = await getWindowWidthAndTop();
  const leftPosition = Math.max(0, windowWidth - 400);
  const topPosition = Math.max(0, windowTop);

  const config = {
    focused: true,
    height: 530,
    width: 400,
    left: parseInt(leftPosition),
    top: topPosition,
    incognito: false,
    setSelfAsOpener: false,
    type: "popup",
    url: url,
  };
  try {
    const window = await chrome.windows.create(config);
  } catch (err) {
    console.log(err);
    await HoloCache.setCredentialsConfirmationPopupIsOpen(false);
    await HoloCache.setShareCredsConfirmationPopupIsOpen(false);
  }
}

class WebpageMessageHandler {
  static async holoGetIsInstalled(request) {
    return true;
  }

  static async getHoloPublicKey(request) {
    return await cryptoController.getPublicKey();
  }

  static async getHoloCredentials(request) {
    async function waitForConfirmation() {
      const timeout = new Date().getTime() + 180 * 1000;
      let confirmShare = await HoloCache.getConfirmShareCredentials();
      while (new Date().getTime() <= timeout && !confirmShare) {
        await sleep(50);
        confirmShare = await HoloCache.getConfirmShareCredentials();
      }
      return confirmShare;
    }
    displayPopup("share-creds");
    const confirmShare = await waitForConfirmation();
    console.log(`confirmShare: ${confirmShare}`);
    if (!confirmShare) return;
    await HoloCache.setConfirmShareCredentials(false); // reset
    const loggedIn = await cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    const encryptedMsg = await holoStore.getCredentials();
    if (!encryptedMsg) return;
    const decryptedCreds = await cryptoController.decryptWithPrivateKey(
      encryptedMsg.credentials,
      encryptedMsg.sharded
    );
    if (!decryptedCreds) return;
    return JSON.parse(decryptedCreds);
  }

  static async setHoloCredentials(request) {
    async function waitForConfirmation() {
      const timeout = new Date().getTime() + 180 * 1000;
      let confirmCredentials = await HoloCache.getConfirmCredentials();
      while (new Date().getTime() <= timeout && !confirmCredentials) {
        await sleep(50);
        confirmCredentials = await HoloCache.getConfirmCredentials();
      }
      return confirmCredentials;
    }
    const credsToStage = {
      sharded: request.sharded,
      credentials: request.credentials,
    };
    await holoStore.setStagedCredentials(credsToStage);
    console.log("displaying confirmation popup");
    displayPopup("credentials");
    const confirm = await waitForConfirmation();
    await HoloCache.setConfirmCredentials(false); // reset
    return { success: confirm };
  }

  static async holoPromptSetPassword(request) {
    async function waitForPasswordSet() {
      const timeout = new Date().getTime() + 300 * 1000;
      let publicKey = await cryptoController.getPublicKey();
      while (new Date().getTime() <= timeout && !publicKey) {
        await sleep(50);
        publicKey = await cryptoController.getPublicKey();
      }
      return !!publicKey;
    }
    // User has already set password
    if (await cryptoController.getPublicKey()) return { userSetPassword: true };
    // User has not yet set password
    console.log("displaying set-password popup");
    displayPopup("set-password");
    const userSetPassword = await waitForPasswordSet();
    return { userSetPassword: userSetPassword };
  }

  static async holoGetIsRegistered(request) {
    const isRegistered = await cryptoController.getIsRegistered();
    return { isRegistered: isRegistered };
  }

  static async holoGetHasCredentials(request) {
    const creds = await holoStore.getCredentials();
    return !!creds;
  }

  static async holoAddLeafTxMetadata(request) {
    const loggedIn = await cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    const issuer = request.issuer;
    const leafTxMetadata = request.leafTxMetadata;
    if (!issuer || !leafTxMetadata) return;
    if (!leafTxMetadata.blockNumber || !leafTxMetadata.txHash) return;

    const updatedLeaves = { [issuer]: leafTxMetadata };
    const encryptedCurrentLeaves = await holoStore.getLeaves();
    if (encryptedCurrentLeaves) {
      const decryptedCurrentLeaves = JSON.parse(
        await cryptoController.decryptWithPrivateKey(
          encryptedCurrentLeaves.encryptedMessage,
          encryptedCurrentLeaves.sharded
        )
      );
      Object.assign(updatedLeaves, {
        ...decryptedCurrentLeaves,
        ...updatedLeaves,
      });
    }
    const encryptedLeaves = await cryptoController.encryptWithPublicKey(updatedLeaves);
    const success = await holoStore.setLeaves(encryptedLeaves);
    return { success: success };
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

  static async holoAddSubmittedProof(request) {
    const loggedIn = await cryptoController.getIsLoggedIn();
    if (!loggedIn) return;
    const issuer = request.issuer;
    const proofTxMetadata = request.proofTxMetadata;
    if (!issuer || !proofTxMetadata) return;
    if (!proofTxMetadata.blockNumber || !proofTxMetadata.txHash) return;

    const updatedProofs = { [issuer]: proofTxMetadata };
    const encryptedCurrentProofs = await holoStore.getSubmittedProofs();
    if (encryptedCurrentProofs) {
      const decryptedCurrentProofs = JSON.parse(
        await cryptoController.decryptWithPrivateKey(
          encryptedCurrentProofs.encryptedMessage,
          encryptedCurrentProofs.sharded
        )
      );
      Object.assign(updatedProofs, {
        ...decryptedCurrentProofs,
        ...updatedProofs,
      });
    }
    const encryptedProofs = await cryptoController.encryptWithPublicKey(updatedProofs);
    const success = await holoStore.setSubmittedProofs(encryptedProofs);
    return { success: success };
  }
}

export default WebpageMessageHandler;
