import React, { useState, useEffect } from "react";
import HoloLogo from "../../img/Holo-Logo.png";
import LandingPage from "../../components/LandingPage";
import Credentials from "../../components/atoms/Credentials";
import ResetAccount from "../../components/molecules/ResetAccount";

function App() {
  const [landingPageIsVisible, setLandingPageIsVisible] = useState(true);
  const [credentials, setCredentials] = useState();
  const [resetAccountIsVisible, setResetAccountIsVisible] = useState(false);

  async function handleLoginSuccess() {
    setLandingPageIsVisible(false);
  }

  useEffect(() => {
    if (landingPageIsVisible) return;
    function requestCredentials() {
      return new Promise((resolve) => {
        const message = { message: "getHoloCredentials" };
        const callback = (resp) => resolve(resp.credentials);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    requestCredentials().then((credentials) => setCredentials(credentials));
  }, [landingPageIsVisible]);

  return (
    <>
      <div style={{ margin: "5px" }}>
        <img src={HoloLogo} style={{ height: "25px" }} />
        <div style={{ margin: "10px" }}></div>
        {landingPageIsVisible ? (
          <LandingPage onLoginSuccess={handleLoginSuccess} />
        ) : resetAccountIsVisible ? (
          <ResetAccount onAccountReset={() => setResetAccountIsVisible(false)} />
        ) : (
          <div>
            <h2 className="header-base">Credentials</h2>
            <Credentials credentials={credentials} />
            <button
              type="submit"
              onClick={() => setResetAccountIsVisible(true)}
              className="red-button"
            >
              Reset Account
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
