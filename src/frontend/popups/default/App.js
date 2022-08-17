import React, { useState, useEffect } from "react";
import HoloLogo from "../../img/Holo-Logo.png";
import LandingPage from "../../components/LandingPage";

function App() {
  const [landingPageIsVisible, setLandingPageIsVisible] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);

  async function handleLoginSuccess() {
    setLandingPageIsVisible(false);
  }

  useEffect(() => {
    function requestCredentials() {
      return new Promise((resolve) => {
        const message = { message: "getHoloCredentials" };
        const callback = (resp) => resolve(resp.credentials);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    requestCredentials().then((credentials) => setHasCredentials(!!credentials));
  }, [landingPageIsVisible]);

  return (
    <>
      <div style={{ margin: "5px" }}>
        <img src={HoloLogo} style={{ height: "25px" }} />
        <div style={{ margin: "10px" }}></div>
        {landingPageIsVisible ? (
          <LandingPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <p>Possess credentials: {hasCredentials.toString()}</p>
        )}
      </div>
    </>
  );
}

export default App;
