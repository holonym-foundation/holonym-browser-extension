import React from "react";

function ConfirmSendToRelayer({ onConfirmation }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 className="header-base">Confirm</h2>
        <p>
          Confirm that you would like to send your ZK proof of residence to a relayer.
        </p>
      </div>
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

export default ConfirmSendToRelayer;