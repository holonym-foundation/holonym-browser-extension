import React, { useState } from "react";
import PasswordLogin from "./components/PasswordLogin";
import ConfirmCredentials from "./components/ConfirmCredentials";

function App() {
  const [credsContainerIsVisible, setCredsContainerIsVisible] = useState(false);
  const [credentials, setCredentials] = useState();

  async function handleLoginSuccess() {
    const credentials = await requestCredentials();
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

  return (
    <>
      <div>
        <h1>Holonym</h1>
        <PasswordLogin onLoginSuccess={handleLoginSuccess} />
        <ConfirmCredentials
          isVisible={credsContainerIsVisible}
          credentials={credentials}
        />
      </div>
    </>
  );
}

export default App;
