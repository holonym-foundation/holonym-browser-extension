/**
 * This background script handles messages from both the webpage and
 * the confirmation popup.
 */
import { ethers } from "ethers";
import { CryptoController } from "./CryptoController";
import { HoloStore } from "./HoloStore";
import HoloCache from "./HoloCache";
import { sleep } from "./utils";

const cryptoController = new CryptoController();
const holoStore = new HoloStore();

/**
 * @param {string} type Either "credentials" or "share-creds"; the desired popup type
 */
async function displayConfirmationPopup(type) {
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
    displayConfirmationPopup("share-creds");
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
    const latestMessage = {
      sharded: request.sharded,
      credentials: request.credentials,
    };
    await holoStore.setLatestMessage(latestMessage);
    console.log("displaying confirmation popup");
    displayConfirmationPopup("credentials"); // TODO: Import this function
    const confirm = await waitForConfirmation();
    await HoloCache.setConfirmCredentials(false); // reset
    return { success: confirm };
  }

  static async holoGetIsRegistered(request) {
    const isRegistered = await cryptoController.getIsRegistered();
    return { isRegistered: isRegistered };
  }
}

export default WebpageMessageHandler;
