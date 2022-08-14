import React from "react";

function App() {
  async function handleLogin(event) {
    function login() {
      return new Promise((resolve) => {
        event.preventDefault();
        const password = event.target.password.value;
        event.target.password.value = "";
        console.log("confirmation popup is sending login message");
        const message = { message: "holoPopupLogin", password: password };
        const callback = (resp) => resolve(resp.success);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    const loginSuccess = await login();
    const credentials = await requestCredentials();
    displayCredentials(credentials);
    displayConfirmCancelButtons();
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

  function handleConfirm() {
    const message = { message: "confirmCredentials" };
    const callback = (resp) => {};
    chrome.runtime.sendMessage(message, callback);
    window.close();
  }

  function handleCancel() {
    const message = { message: "denyCredentials" };
    const callback = (resp) => {};
    chrome.runtime.sendMessage(message, callback);
    window.close();
  }

  function displayConfirmCancelButtons() {
    const buttonsDiv = document.getElementById("confirm-cancel-div");
    buttonsDiv.style.visibility = "visible";
  }

  return (
    <>
      <h1>Holonym</h1>

      <h3>Login</h3>
      <form id="login-form" onSubmit={handleLogin}>
        <div>
          <label>Password: </label>
          <input type="text" name="password" defaultValue="test" />
        </div>
        <button type="submit">Submit</button>
      </form>

      <h3>The following credentials will be stored</h3>

      <div id="holo-credentials-div" style={{ visibility: "hidden" }}></div>

      <div id="confirm-cancel-div" style={{ visibility: "hidden" }}>
        <button type="submit" id="confirm-button" onClick={handleConfirm}>
          Confirm
        </button>
        <button type="submit" id="cancel-button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </>
  );
}

export default App;
