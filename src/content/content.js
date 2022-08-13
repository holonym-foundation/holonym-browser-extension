import { HoloStore, injectCredentials } from "../general/HoloStore";

/**
 * API for storing Holo credentials
 */

const holoStore = new HoloStore();
const allowedOrigins = ["http://localhost:3002", "https://app.holonym.id"];

window.addEventListener("message", async function (event) {
  if (event.source != window) return;

  const message = event.data.message;
  const newCreds = event.data.credentials;

  // if (message != "getHoloCredentials" && message != "setHoloCredentials") {
  if (message != "setHoloCredentials") {
    return;
  } else if (!allowedOrigins.includes(event.origin)) {
    throw new Error("Disallowed origin attempting to access or modify HoloStore.");
  }

  // Get
  // if (message == "getHoloCredentials") {
  //   const creds = await holoStore.getCredentials();
  //   injectCredentials(creds);
  // }
  // Set
  if (message == "setHoloCredentials") {
    console.log("content_script: setting credentials");
    await holoStore.setLatestMessage(newCreds);
    // const success = await holoStore.setCredentials(newCreds);
    // if (success) {
    //   injectCredentials(newCreds);
    // }
  }
});

// In webpage:
// set:
// window.postMessage({message: 'setHoloCredentials', credentials: credentialsObject}, '*')
// get (this tells extension to inject holoCredentials):
// window.postMessage({message: 'getHoloCredentials'}, '*')
