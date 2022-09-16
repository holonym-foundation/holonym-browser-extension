import React from "react";

function ConfirmSendToRelayer({ onConfirmation }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1>Confirm</h1>
        <p>
          Confirm that you would like to send your ZK proof of residence to a relayer.
        </p>
      </div>
      <div style={{ marginTop: "10px" }}>
        <button
          type="submit"
          onClick={onConfirmation}
          className="wide-button center-block x-button"
        >
          Confirm
        </button>
      </div>
    </>
  );
}

export default ConfirmSendToRelayer;
