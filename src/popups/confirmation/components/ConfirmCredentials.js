import React from "react";
import Credentials from "./Credentials";

function ConfirmCredentials({ isVisible, credentials }) {
  function handleConfirm() {
    const message = { message: "confirmCredentials" };
    const callback = (resp) => {};
    chrome.runtime.sendMessage(message, callback);
    window.close();
  }

  console.log(`ConfirmCredentials: isVisible == ${isVisible}`);

  return (
    <>
      {isVisible && (
        <div id="credentials-confirmation-container">
          <h3>The following credentials will be encrypted and stored</h3>

          <Credentials credentials={credentials} />

          <div>
            <button type="submit" onClick={handleConfirm}>
              Confirm
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ConfirmCredentials;
