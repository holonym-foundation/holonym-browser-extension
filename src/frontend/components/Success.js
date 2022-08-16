import React from "react";

function Success() {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0px" }} className="header-base">
          Success!
        </h2>
        <p>Your credentials have been encrypted and stored.</p>
        <p>You can now generate zero knowledge proofs of identity.</p>
      </div>
      <div style={{ marginTop: "20px" }}>
        <button
          type="submit"
          onClick={window.close}
          className="wide-button center-block"
        >
          Close
        </button>
      </div>
    </>
  );
}

export default Success;
