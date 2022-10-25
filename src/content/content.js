/**
 * This script handles messages sent from any webpage. It is written to handle
 * messages initiated by functions in the injected window.holonym object.
 */
import {
  extensionId,
  extensionOrigin,
  holoCommandEventName,
  holoRespEventName,
  basicWebPageCommands,
} from "../@shared/constants";
import WebpageMessageHandler from "../@shared/WebpageMessageHandler";

async function listener(event) {
  // All privileged commands should be sent directly to background script using
  // chrome.runtime.sendMessage. This content script should only respond to basic
  // web page commands.
  const command = event.detail?.command;
  if (!command || !basicWebPageCommands.includes(command)) {
    return;
  }
  const func = WebpageMessageHandler[command];
  if (!func) return;
  const resp = await func({ command: command });
  const message = {
    command: command,
    response: resp,
  };
  const respEvent = new CustomEvent(holoRespEventName, { detail: message });
  window.dispatchEvent(respEvent);
}
window.addEventListener(holoCommandEventName, listener, false);
