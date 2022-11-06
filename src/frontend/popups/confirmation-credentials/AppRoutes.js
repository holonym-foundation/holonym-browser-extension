import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PasswordLogin from "../../components/atoms/PasswordLogin";
import LandingPage from "../../components/pages/LandingPage";
import ConfirmCredentials from "../../components/pages/ConfirmCredentials";
import Success from "../../components/atoms/Success";
import Loading from "../../components/atoms/Loading";

const credsConfSuccessMessage =
  "Your credentials have been encrypted and stored. " +
  "You can now generate zero knowledge proofs of identity.";

function AppRoutes() {
  const [credentials, setCredentials] = useState();
  const navigate = useNavigate();

  async function handleLoginSuccess() {
    const stagedCredentials = await requestStagedCredentials();
    if (stagedCredentials.credentials) {
      const issuer = stagedCredentials.credentials.issuer || "Unknown issuer";
      const sortedCreds = { [issuer]: stagedCredentials.credentials };
      setCredentials(sortedCreds);
      navigate("/confirm-credentials", { replace: true });
    }
    // TODO: Display message to user that there are no staged credentials
  }

  function requestStagedCredentials() {
    return new Promise((resolve) => {
      const message = { command: "getStagedCredentials" };
      const callback = (resp) => resolve(resp.message);
      chrome.runtime.sendMessage(message, callback);
    });
  }

  function handleCredsConfirmation() {
    const message = { command: "confirmCredentials" };
    const callback = (resp) => {
      // navigate("/creds-confirmation-success", { replace: true });
      onExit();
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
        {/* TESTING ROUTE (so can see other routes at "/" instead without having to organically navigate to them 
      <Route
          path="/"
          element={<div style={{ marginTop: "150px" }}>
          <Success
            message={credsConfSuccessMessage}
            onExit={onConfirmCredsContinue}
            exitButtonText="Continue"
          />
        </div>}
        /> 
        */}
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
        {/* <Route
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
        /> */}
      </Routes>
    </>
  );
}

export default AppRoutes;
