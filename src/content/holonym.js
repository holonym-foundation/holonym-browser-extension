/**
 * Inject holonym object into window object
 */
import {
  extensionId,
  extensionOrigin,
  holoCommandEventName,
  holoRespEventName,
  trustedOrigins,
} from "../@shared/constants";

// ----------------------------------
// Reponse listener
// ----------------------------------

const inbox = {
  // command: "response"
};
async function listener(event) {
  if (!event.detail?.command || !event.detail?.response) {
    return;
  }
  inbox[event.detail.command] = event.detail.response;
}
window.addEventListener(holoRespEventName, listener, false);

// ----------------------------------
// Message-sending functions
// ----------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} command The command to wait for (e.g., "getHoloPublicKey")
 */
async function waitForResponse(command) {
  // timeout is 2s, not longer, because the actual response might be undefined
  const timeout = new Date().getTime() + 2000;
  let resp = inbox[command];
  while (new Date().getTime() <= timeout && !resp) {
    await sleep(50);
    resp = inbox[command];
  }
  inbox[command] = undefined;
  return resp;
}

/**
 * @param {object} message E.g., { command: "getHoloPublicKey" }
 * @returns
 */
async function sendMessageToContentScript(message) {
  const event = new CustomEvent(holoCommandEventName, { detail: message });
  window.dispatchEvent(event);
  // window.postMessage(JSON.stringify(message), extensionOrigin);
  return await waitForResponse(message.command);
}

// ----------------------------------------------------
// Unprivileged "endpoint" functions
// ----------------------------------------------------

async function holoGetIsRegistered() {
  const message = { command: "holoGetIsRegistered" };
  const resp = await sendMessageToContentScript(message);
  return resp?.isRegistered;
}

async function getHoloPublicKey() {
  const message = { command: "getHoloPublicKey" };
  return await sendMessageToContentScript(message);
}

async function holoGetHasCredentials() {
  const message = { command: "holoGetHasCredentials" };
  return await sendMessageToContentScript(message);
}

// ----------------------------------------------------
// Privileged "endpoint" functions
// ----------------------------------------------------

async function promptSetPassword() {
  return new Promise((resolve) => {
    const payload = {
      command: "holoPromptSetPassword",
    };
    const callback = (resp) => resolve(resp);
    chrome.runtime.sendMessage(extensionId, payload, callback);
  });
}

async function addLeafMetadata(issuer, leafTxMetadata) {
  return new Promise((resolve) => {
    const payload = {
      command: "holoAddLeafTxMetadata",
      issuer: issuer,
      leafTxMetadata: leafTxMetadata,
    };
    const callback = (resp) => resolve(resp);
    chrome.runtime.sendMessage(extensionId, payload, callback);
  });
}

async function addSubmittedProofMetadata(issuer, proofTxMetadata) {
  return new Promise((resolve) => {
    const payload = {
      command: "holoAddSubmittedProof",
      issuer: issuer,
      proofTxMetadata: proofTxMetadata,
    };
    const callback = (resp) => resolve(resp);
    chrome.runtime.sendMessage(extensionId, payload, callback);
  });
}

window.holonym = {
  // Unprivileged functions
  holoGetIsRegistered: holoGetIsRegistered, // TODO: Rename to "holoGetHasPublicKey"
  getHoloPublicKey: getHoloPublicKey,
  hasPassword: holoGetIsRegistered, // alias for "holoGetIsRegistered"
  holoGetHasCredentials: holoGetHasCredentials,
  hasHolo: holoGetHasCredentials, // alias for "holoGetHasCredentials"
  // Privileged functions
  promptSetPassword: promptSetPassword,
  addLeafMetadata: addLeafMetadata,
  addSubmittedProofMetadata: addSubmittedProofMetadata,
};
