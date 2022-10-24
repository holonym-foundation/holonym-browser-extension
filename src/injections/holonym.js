// Inject holonym object into window object

const extensionId = process.env.EXTENSION_ID;
const extensionOrigin = `chrome-extension://${extensionId}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} command The command to wait for (e.g., "getHoloPublicKey")
 */
async function waitForResponse(message) {
  // TODO: Implement
  // async function waitForConfirmation() {
  //   const timeout = new Date().getTime() + 180 * 1000;
  //   let confirmShare = await HoloCache.getConfirmShareCredentials();
  //   while (new Date().getTime() <= timeout && !confirmShare) {
  //     await sleep(50);
  //     confirmShare = await HoloCache.getConfirmShareCredentials();
  //   }
  //   return confirmShare;
  // }
  // return JSON.parse(response)
}

/**
 * @param {object} message E.g., { command: "getHoloPublicKey" }
 * @returns
 */
async function sendMessageToContentScript(message) {
  window.postMessage(JSON.stringify(message), extensionOrigin);
  return await waitForResponse();
}

// ----------------------------------------------------
// BEGIN "endpoint" functions
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
  // holoGetIsRegistered: holoGetIsRegistered, // i.e., getHasPublicKey
  // hasHolo: async () => {}, // TODO: return a bool that indicates whether the user has credentials
  // getHoloPublicKey: getHoloPublicKey,
  // holoGetHasCredentials: holoGetHasCredentials
};
