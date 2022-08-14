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
  return new Promise((resolve) => {
    console.log("confirmation popup is sending message");
    const message = { message: "getHoloCredentials" };
    const callback = (resp) => resolve(resp.credentials);
    chrome.runtime.sendMessage(message, callback);
  });
}

function displayCredentials(credentials) {
  /**
   * Helper function for formatting creds object for display. For each
   * key-value pair in creds, a <p> element is created. All <p> elements
   * are appended to a single div.
   * @param {object} creds
   */
  function createCredsElement(creds) {
    const parentDiv = document.createElement("div");

    const defaultCredsToIgnore = ["completedAt", "serverSignature", "secret"];
    const credsToDisplay = Object.keys(creds).filter(
      (key) => !defaultCredsToIgnore.includes(key)
    );

    for (const key of credsToDisplay) {
      // Ignore null credential unless it is countryCode
      if (!creds[key] && key != "countryCode") continue;

      const para = document.createElement("p");
      const keySpan = document.createElement("span");
      keySpan.textContent = key;
      keySpan.style.textDecoration = "underline";
      para.appendChild(keySpan);
      const credsSpan = document.createElement("span");
      credsSpan.textContent = ": " + creds[key];
      para.appendChild(credsSpan);
      parentDiv.appendChild(para);
    }
    return parentDiv;
  }
  const credentialsContainer = document.getElementById("holo-credentials-div");
  credentialsContainer.replaceChildren();
  credentialsContainer.style.visibility = "visible";
  const credentialsEl = createCredsElement(credentials);
  credentialsContainer.appendChild(credentialsEl);
}

window.onload = async () => {
  const loginSuccess = await login();
  // - Request unencrypted credentials from background script
  const credentials = await requestCredentials();
  // - Add credentials to popup.html
  displayCredentials(credentials);
  // - Add onclick function to confirm button. This function
  //   should send a confirmation message to background script.
  // - Add onclick function to cancel button. This function
  //   should send only a "close window" message to background script.
};
