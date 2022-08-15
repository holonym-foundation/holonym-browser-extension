import React from "react";
import PasswordLogin from "./components/PasswordLogin";

function App() {
  async function handleLoginSuccess() {
    const credentials = await requestCredentials();
    displayCredentials(credentials);
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
    const credentialsContainer = document.getElementById("holo-credentials-container");
    credentialsContainer.replaceChildren();
    const credentialsEl = createCredsElement(credentials);
    credentialsContainer.appendChild(credentialsEl);
    const credentialsHeader = document.getElementById(
      "credentials-confirmation-container"
    );
    credentialsHeader.style.visibility = "visible";
  }

  function handleConfirm() {
    const message = { message: "confirmCredentials" };
    const callback = (resp) => {};
    chrome.runtime.sendMessage(message, callback);
    window.close();
  }

  return (
    <>
      <div>
        <h1>Holonym</h1>
        <PasswordLogin onLoginSuccess={handleLoginSuccess} />

        <div id="credentials-confirmation-container" style={{ visibility: "hidden" }}>
          <h3>The following credentials will be encrypted and stored</h3>
          <div id="holo-credentials-container"></div>

          <div>
            <button type="submit" onClick={handleConfirm}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
