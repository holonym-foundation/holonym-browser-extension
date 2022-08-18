import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PasswordLogin from "../../components/atoms/PasswordLogin";
import ConfirmCredentials from "../../components/molecules/ConfirmCredentials";
import Success from "../../components/atoms/Success";

const successMessage =
  "Your credentials have been encrypted and stored. " +
  "You can now generate zero knowledge proofs of identity.";

function AppRoutes() {
  const [credentials, setCredentials] = useState();
  const navigate = useNavigate();

  async function handleLoginSuccess() {
    const credentials = await requestCredentials();
    setCredentials(credentials);
    navigate("/confirm", { replace: true });
  }

  function requestCredentials() {
    return new Promise((resolve) => {
      const message = { command: "getHoloLatestMessage" };
      const callback = (resp) => resolve(resp.credentials);
      chrome.runtime.sendMessage(message, callback);
    });
  }

  function handleConfirmation() {
    const message = { command: "confirmCredentials" };
    const callback = (resp) => {
      navigate("/success", { replace: true });
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
          element={<PasswordLogin onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/confirm"
          element={
            <ConfirmCredentials
              credentials={credentials}
              onConfirmation={handleConfirmation}
            />
          }
        />
        <Route
          path="/success"
          element={
            <div style={{ marginTop: "150px" }}>
              <Success
                message={successMessage}
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
