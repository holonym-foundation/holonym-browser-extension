import React from "react";

const OuterContainer = ({ children }) => (
  <>
    <div
      style={{
        marginLeft: "20px",
        marginRight: "20px",
        marginTop: "10px",
        marginBottom: "10px",
      }}
    >
      {children}
    </div>
  </>
);

export default OuterContainer;
