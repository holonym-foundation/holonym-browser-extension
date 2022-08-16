import React from "react";

function Success({ message, onExit, exitButtonText }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0px" }} className="header-base">
          Success!
        </h2>
        <p>{message}</p>
      </div>
      <div style={{ marginTop: "20px" }}>
        <button type="submit" onClick={onExit} className="wide-button center-block">
          {exitButtonText || "Close"}
        </button>
      </div>
    </>
  );
}

export default Success;
