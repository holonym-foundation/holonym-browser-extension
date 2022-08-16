import React, { useState } from "react";
import HoloLogo from "../../img/Holo-Logo.png";
import { CryptoController } from "../../../scripts/shared/CryptoController";
import Register from "../../components/Register";
import PasswordLogin from "../../components/PasswordLogin";
import ChangePassword from "../../components/ChangePassword";
import LandingPage from "../../components/LandingPage";

const cryptoController = new CryptoController();

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
