function requestCredentials() {
  console.log("confirmation popup is sending message");
  // const message = { message: "getHoloCredentials" };
  const message = { message: "holoPopupLogin", password: "test" };
  const callback = (resp) =>
    console.log(`confirmation: resp.success: ${resp.success}`);
  chrome.runtime.sendMessage(message, callback);
}

window.onload = () => {
  // - Request unencrypted credentials from background script
  requestCredentials();
  // - Add credentials to popup.html
  // - Add onclick function to confirm button. This function
  //   should send a confirmation message to background script.
  // - Add onclick function to cancel button. This function
  //   should send only a "close window" message to background script.
};
