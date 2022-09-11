import React from "react";

function ConfirmProof({ proof, onConfirmation }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 className="header-base">Confirm Proof</h2>
        <p className="small-paragraph">Confirm storage of this proof.</p>
      </div>
      <p>{proof}</p>
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

export default ConfirmProof;
