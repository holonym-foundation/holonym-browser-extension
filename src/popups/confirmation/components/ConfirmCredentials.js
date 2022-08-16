import React from "react";
import Credentials from "./Credentials";

function ConfirmCredentials({ credentials, onConfirmation }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 className="header-base">Confirm Credentials</h2>
        <p style={{ fontSize: "0.70rem" }}>
          Confirm that the following info is accurate. Clicking "confirm" will encrypt
          this info and store it in your browser. This will allow you to generate zero
          knowledge proofs about aspects of your identity.
        </p>
      </div>
      <Credentials credentials={credentials} />
      <div style={{ marginTop: "10px" }}>
        <button
          type="submit"
          onClick={onConfirmation}
          className="wide-button center-block"
        >
          Confirm
        </button>
      </div>
    </>
  );
}

export default ConfirmCredentials;
