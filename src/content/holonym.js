/**
 * Inject holonym object into window object
 */
import {
  extensionId,
  extensionOrigin,
  holoCommandEventName,
  holoRespEventName,
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
// "endpoint" functions
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

window.holonym = {
  holoGetIsRegistered: holoGetIsRegistered, // TODO: Rename to "holoGetHasPublicKey"
  getHoloPublicKey: getHoloPublicKey,
  holoGetHasCredentials: holoGetHasCredentials,
  hasHolo: holoGetHasCredentials, // "hasHolo" is an alias for "holoGetHasCredentials"
};
