import React from "react";
import Logo from "../../img/Holo-Logo.png";

const HoloLogo = () => (
  <>
    <div style={{ marginLeft: "20px", marginBottom: "20px", marginTop: "10px" }}>
      <a href="https://holonym.id" target="_blank">
        <img src={Logo} style={{ height: "25px" }} />
      </a>
    </div>
    <div style={{ margin: "10px" }}></div>
  </>
);

export default HoloLogo;
