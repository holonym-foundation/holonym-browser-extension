import React from "react";

function Loading({ loadingMessage }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: "0px" }}>{loadingMessage || "Loading..."}</h1>
      </div>
    </>
  );
}

export default Loading;
