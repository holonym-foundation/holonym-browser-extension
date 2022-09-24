import React from "react";
import Credentials from "../atoms/Credentials";

function ConfirmShareCredentials({ credentials, onConfirmation }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 className="header-base">Share Credentials</h2>
        <p className="small-paragraph">
          Confirm you would like to create a ZK verification without revealing your identity
        </p>
      </div>
      {/* <Credentials credentials={credentials} /> */}
      <div style={{ marginTop: "10px" }}>
        <button
          type="submit"
          onClick={onConfirmation}
          className="x-button wide-button center-block"
        >
          Confirm
        </button>
      </div>
    </>
  );
}

export default ConfirmShareCredentials;
