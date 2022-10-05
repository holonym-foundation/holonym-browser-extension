import React from "react";
import Credentials from "../atoms/Credentials";

function ConfirmShareCredentials({ credentials, onConfirmation }) {
  return (
    <>
      <div
        id="confirm-share-credentials-page"
        style={{ textAlign: "center", marginTop: "10px" }}
      >
        <h1>Share Credentials</h1>
        <p className="small-paragraph">
          Confirm that you would like to share the following credentials with this
          website.
        </p>
      </div>
      <Credentials credentials={credentials} />
      <div style={{ marginTop: "10px" }}>
        <button
          type="submit"
          onClick={onConfirmation}
          className="x-button center-block"
        >
          Confirm
        </button>
      </div>
    </>
  );
}

export default ConfirmShareCredentials;
