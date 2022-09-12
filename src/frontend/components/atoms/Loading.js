import React from "react";

function Loading({ loadingMessage }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0px" }} className="header-base">
          {loadingMessage || "Loading..."}
        </h2>
      </div>
    </>
  );
}

export default Loading;
