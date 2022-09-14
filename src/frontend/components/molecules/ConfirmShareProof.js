import React from "react";

function ConfirmShareProof({ proofType, onConfirmation }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 className="header-base">Share Proof</h2>
        <p className="small-paragraph">
          Confirm that you would like to share the following proof with this website.
        </p>
      </div>
      <p style={{ fontSize: "14px" }}>{proofType}</p>
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

export default ConfirmShareProof;
