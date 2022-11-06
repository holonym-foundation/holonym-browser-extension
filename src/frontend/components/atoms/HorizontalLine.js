import React from "react";

export default HorizontalLine = ({ borderColor }) => (
  <div style={{ marginTop: "5px", marginBottom: "5px" }}>
    <hr style={{ borderColor: borderColor ? borderColor : "#fff" }} />
  </div>
);
