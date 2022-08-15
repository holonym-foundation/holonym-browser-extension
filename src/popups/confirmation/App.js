import React, { useState } from "react";
import HoloLogo from "../../img/Holo-Logo.png";
import PasswordLogin from "./components/PasswordLogin";
import ConfirmCredentials from "./components/ConfirmCredentials";
import Success from "./components/Success";

function App() {
  const [loginIsVisible, setLoginIsVisible] = useState(true);
  const [credsContainerIsVisible, setCredsContainerIsVisible] = useState(false);
  const [credentials, setCredentials] = useState();
  const [credsConfirmed, setCredsConfirmed] = useState();

  async function handleLoginSuccess() {
    const credentials = await requestCredentials();
    setLoginIsVisible(false);
    setCredentials(credentials);
    setCredsContainerIsVisible(true);
  }

  function requestCredentials() {
    return new Promise((resolve) => {
      console.log("confirmation popup is sending message");
      const message = { message: "getHoloCredentials" };
      const callback = (resp) => resolve(resp.credentials);
      chrome.runtime.sendMessage(message, callback);
    });
  }

  function handleConfirmation() {
    const message = { message: "confirmCredentials" };
    const callback = (resp) => {
      setCredsContainerIsVisible(false);
      setCredsConfirmed(true);
    };
    chrome.runtime.sendMessage(message, callback);
  }

  return (
    <>
      <div>
        <img src={HoloLogo} style={{ height: "25px" }} />
        <div style={{ margin: "10px" }}></div>
        {loginIsVisible && <PasswordLogin onLoginSuccess={handleLoginSuccess} />}
        {credsContainerIsVisible && (
          <ConfirmCredentials
            credentials={credentials}
            onConfirmation={handleConfirmation}
          />
        )}
        {credsConfirmed && (
          <div style={{ marginTop: "150px" }}>
            <Success />
          </div>
        )}
      </div>
    </>
  );
}

export default App;
