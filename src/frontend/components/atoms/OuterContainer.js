import React from "react";

const OuterContainer = ({ children }) => (
  <>
    <div
      style={{
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingTop: "10px",
        // marginBottom: "10px",
        // paddingBottom: "20px",
      }}
    >
      {children}
    </div>
  </>
);

export default OuterContainer;
