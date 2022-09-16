import React from "react";
import Credentials from "../atoms/Credentials";

function ConfirmCredentials({ credentials, onConfirmation }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1>Is This You?</h1>
      </div>
      <Credentials credentials={credentials} />
      {/* <p>we don't store or save your information</p> */}
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
