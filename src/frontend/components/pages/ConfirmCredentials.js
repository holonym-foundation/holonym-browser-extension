import React from "react";
import Credentials from "../atoms/Credentials";

function ConfirmCredentials({ credentials, onConfirmation }) {
  return (
    <>
      <div id="confirm-credentials-page">
        <div style={{ textAlign: "center" }}>
          <h1>Is This You?</h1>
        </div>
        <Credentials sortedCreds={credentials} />
        {/* <p>we don't store or save your information</p> */}
        <div style={{ marginTop: "10px" }}>
          <button
            type="submit"
            onClick={onConfirmation}
            className="x-button center-block"
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmCredentials;
