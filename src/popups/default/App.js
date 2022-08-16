import React, { useState } from "react";
import HoloLogo from "../../img/Holo-Logo.png";
import { CryptoController } from "../../shared/CryptoController";
import Register from "./components/Register";
import PasswordLogin from "../../shared/components/PasswordLogin";
import ChangePassword from "./components/ChangePassword";

const cryptoController = new CryptoController();

function App() {
  const [loginIsVisible, setLoginIsVisible] = useState(true);

  async function handleLoginSuccess() {
    setLoginIsVisible(false);
  }

  return (
    <>
      <img src={HoloLogo} style={{ height: "25px" }} />
      <div style={{ margin: "10px" }}></div>
      {/* <Register /> */}
      {loginIsVisible && <PasswordLogin onLoginSuccess={handleLoginSuccess} />}
      <ChangePassword />
    </>
  );
}

export default App;
