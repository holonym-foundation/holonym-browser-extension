import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PasswordLogin from "../../components/atoms/PasswordLogin";
import ConfirmCredentials from "../../components/molecules/ConfirmCredentials";
import ConfirmSendToRelayer from "../../components/atoms/ConfirmSendToRelayer";
import Success from "../../components/atoms/Success";

const credsConfSuccessMessage =
  "Your credentials have been encrypted and stored. " +
  "You can now generate zero knowledge proofs of identity. " +
  "Next step: Send your anonymous ZK proof of residence to a relayer to put on chain.";

const sendToRelayerSuccessMessage =
  "Your anonymous proof of residence has been sent to a relayer to put on chain.";

function AppRoutes() {
  const [credentials, setCredentials] = useState();
  const navigate = useNavigate();

  async function handleLoginSuccess() {
    const credentials = await requestCredentials();
    setCredentials(credentials);
    navigate("/confirm-credentials", { replace: true });
  }

  function requestCredentials() {
    return new Promise((resolve) => {
      const message = { command: "getHoloLatestMessage" };
      const callback = (resp) => resolve(resp.credentials);
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

  function onConfirmCredsContinue() {
    navigate("/confirm-send-to-relayer");
  }

  function handleConfirmSendProof() {
    // TODO: Actually send proof to relayer. Do this in background script.
    const message = { command: "holoSendProofsToRelayer" };
    chrome.runtime.sendMessage(message);
    navigate("/final-success");
  }

  function onExit() {
    const message = { command: "closingHoloConfirmationPopup" };
    chrome.runtime.sendMessage(message);
    window.close();
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<PasswordLogin onLoginSuccess={handleLoginSuccess} />}
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
                onExit={onConfirmCredsContinue}
                exitButtonText="Continue"
              />
            </div>
          }
        />
        <Route
          path="/confirm-send-to-relayer"
          element={
            <div style={{ marginTop: "150px" }}>
              <ConfirmSendToRelayer onConfirmation={handleConfirmSendProof} />
            </div>
          }
        />
        <Route
          path="/final-success"
          element={
            <div style={{ marginTop: "150px" }}>
              <Success
                message={sendToRelayerSuccessMessage}
                onExit={onExit}
                exitButtonText="Exit"
              />
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default AppRoutes;
