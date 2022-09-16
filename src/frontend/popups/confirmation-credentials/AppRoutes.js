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

  // const testCredentialsDeleteMe = {
  //   firstName: "Vitalik",
  //   lastName: "Buterin",
  //   middleInitial: "",
  //   countryCode: 0,
  //   streetAddr1: "6969 Second Street",
  //   streetAddr2: "",
  //   city: "Los Angeles",
  //   subdivision: "",
  //   postalCode: "696969",
  //   completedAt: "1234",
  //   birthdate: "06/09/1969",
  // };

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
