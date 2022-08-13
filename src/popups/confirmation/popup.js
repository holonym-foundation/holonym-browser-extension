function login() {
  return new Promise((resolve) => {
    const loginFormEl = document.getElementById("login-form");
    loginFormEl.onsubmit = async (event) => {
      event.preventDefault();
      const password = event.target.password.value;
      loginFormEl.password.value = "";
      console.log("confirmation popup is sending login message");
      const message = { message: "holoPopupLogin", password: password };
      const callback = (resp) => resolve(resp.success);
      chrome.runtime.sendMessage(message, callback);
    };
  });
}

function requestCredentials() {
  console.log("confirmation popup is sending message");
  const message = { message: "getHoloCredentials" };
  const callback = (resp) =>
    console.log(`confirmation: resp.success: ${resp.success}`);
  chrome.runtime.sendMessage(message, callback);
}

window.onload = async () => {
  const loginSuccess = await login();
  // - Request unencrypted credentials from background script
  // - Add credentials to popup.html
  // - Add onclick function to confirm button. This function
  //   should send a confirmation message to background script.
  // - Add onclick function to cancel button. This function
  //   should send only a "close window" message to background script.
};
