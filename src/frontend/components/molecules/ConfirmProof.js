import React, { useState, useEffect } from "react";

function ConfirmProof({ proof, onConfirmation }) {
  const [proofItems, setProofItems] = useState();

  useEffect(() => {
    if (!proof || typeof proof != "object") return;
    setProofItems(Object.keys(proof));
  }, []);

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 className="header-base">Confirm Proof</h2>
        <p className="small-paragraph">Confirm storage of these proof items.</p>
      </div>
      {proofItems &&
        proofItems.length > 0 &&
        proofItems.map((item, index) => <p key={index}>{item}</p>)}
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
