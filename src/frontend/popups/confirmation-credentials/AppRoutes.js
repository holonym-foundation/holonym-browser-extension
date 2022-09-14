import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PasswordLogin from "../../components/atoms/PasswordLogin";
import LandingPage from "../../components/LandingPage";
import ConfirmCredentials from "../../components/molecules/ConfirmCredentials";
import Success from "../../components/atoms/Success";
import Loading from "../../components/atoms/Loading";

const credsConfSuccessMessage =
  "Your credentials have been encrypted and stored. " +
  "You can now generate zero knowledge proofs of identity.";

const sendToRelayerSuccessMessage =
  "Your anonymous proof of residence has been sent to a relayer to put on chain.";

function AppRoutes() {
  const [credentials, setCredentials] = useState();
  const navigate = useNavigate();

  async function handleLoginSuccess() {
    const latestMessage = await requestLatestMessage();
    if (latestMessage.credentials) {
      setCredentials(latestMessage.credentials);
      navigate("/confirm-credentials", { replace: true });
    }
  }

  function requestLatestMessage() {
    return new Promise((resolve) => {
      const message = { command: "getHoloLatestMessage" };
      const callback = (resp) => resolve(resp.message);
      chrome.runtime.sendMessage(message, callback);
    });
  }

  function handleCredsConfirmation() {
    const message = { command: "confirmCredentials" };
    const callback = (resp) => {
      navigate("/creds-confirmation-success", { replace: true });
    };
    chrome.runtime.sendMessage(message, callback);
  }

  function onExit() {
    const message = { command: "closingHoloCredentialsConfirmationPopup" };
    chrome.runtime.sendMessage(message);
    window.close();
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<LandingPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/confirm-credentials"
          element={
            <ConfirmCredentials
              credentials={credentials}
              onConfirmation={handleCredsConfirmation}
            />
          }
        />
        <Route
          path="/creds-confirmation-success"
          element={
            <div style={{ marginTop: "150px" }}>
              <Success
                message={credsConfSuccessMessage}
                onExit={onExit}
                exitButtonText="Close"
              />
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default AppRoutes;
