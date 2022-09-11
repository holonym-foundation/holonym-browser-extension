import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PasswordLogin from "../../components/atoms/PasswordLogin";
import LandingPage from "../../components/LandingPage";
import ConfirmCredentials from "../../components/molecules/ConfirmCredentials";
import ConfirmSendToRelayer from "../../components/atoms/ConfirmSendToRelayer";
import ConfirmProof from "../../components/molecules/ConfirmProof";
import Success from "../../components/atoms/Success";

const credsConfSuccessMessage =
  "Your credentials have been encrypted and stored. " +
  "You can now generate zero knowledge proofs of identity.";

const sendToRelayerSuccessMessage =
  "Your anonymous proof of residence has been sent to a relayer to put on chain.";

const proofStorageSuccessMessage = "Your proof has been encrypted and stored.";

function AppRoutes() {
  const [credentials, setCredentials] = useState();
  const [proof, setProof] = useState();
  const navigate = useNavigate();

  async function handleLoginSuccess() {
    const latestMessage = await requestLatestMessage();
    if (latestMessage.credentials) {
      setCredentials(latestMessage.credentials);
      navigate("/confirm-credentials", { replace: true });
    } else if (latestMessage.proof) {
      setProof(latestMessage.proof);
      navigate("/confirm-proof", { replace: true });
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

  function onConfirmCredsContinue() {
    navigate("/confirm-send-to-relayer");
  }

  function handleConfirmSendProof() {
    // TODO: Actually send proof to relayer. Do this in background script.
    const message = { command: "holoSendProofsToRelayer" };
    chrome.runtime.sendMessage(message);
    navigate("/final-creds-success");
  }

  function handleProofConfirmation() {
    const message = { command: "confirmProof" };
    const callback = (resp) => {
      navigate("/proof-confirmation-success", { replace: true });
    };
    chrome.runtime.sendMessage(message, callback);
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
          path="/final-creds-success"
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

        <Route
          path="/confirm-proof"
          element={
            <ConfirmProof proof={proof} onConfirmation={handleProofConfirmation} />
          }
        />
        <Route
          path="/final-proof-success"
          element={
            <div style={{ marginTop: "150px" }}>
              <Success
                message={proofStorageSuccessMessage}
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
