import React from "react";
import Logo from "../../img/Holo-Logo.png";

const frontendUrl = process.env.FRONTEND_URL;

const HoloLogo = () => (
  <>
    <div style={{ marginBottom: "10px" }}>
      <a href={frontendUrl} target="_blank">
        <img src={Logo} style={{ height: "25px" }} />
      </a>
    </div>
    {/* <div style={{ margin: "10px" }}></div> */}
  </>
);

export default HoloLogo;
