import React from "react";
import Credentials from "./Credentials";

function ConfirmCredentials({ credentials }) {
  function handleConfirm() {
    const message = { message: "confirmCredentials" };
    const callback = (resp) => {};
    chrome.runtime.sendMessage(message, callback);
    window.close();
  }

  return (
    <>
      <div>
        <h3>The following credentials will be encrypted and stored</h3>
        <Credentials credentials={credentials} />
        <div className="">
          <button
            type="submit"
            onClick={handleConfirm}
            className="wide-button center-block"
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmCredentials;
