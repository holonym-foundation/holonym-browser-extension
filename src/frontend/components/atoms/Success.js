import React from "react";

function Success({ message, onExit, exitButtonText }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1>Success!</h1>
        {message && <p>{message}</p>}
      </div>
      <div style={{ marginTop: "20px" }}>
        <button type="submit" onClick={onExit} className="x-button center-block">
          {exitButtonText || "Close"}
        </button>
      </div>
    </>
  );
}

export default Success;
