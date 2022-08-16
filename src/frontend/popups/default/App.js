import React, { useState } from "react";
import HoloLogo from "../../img/Holo-Logo.png";
import LandingPage from "../../components/LandingPage";

function App() {
  const [landingPageIsVisible, setLandingPageIsVisible] = useState(true);

  async function handleLoginSuccess() {
    setLandingPageIsVisible(false);
  }

  return (
    <>
      <div style={{ margin: "5px" }}>
        <img src={HoloLogo} style={{ height: "25px" }} />
        <div style={{ margin: "10px" }}></div>
        {landingPageIsVisible && <LandingPage onLoginSuccess={handleLoginSuccess} />}
      </div>
    </>
  );
}

export default App;
