import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PasswordLogin from "../../components/atoms/PasswordLogin";
import LandingPage from "../../components/pages/LandingPage";
import ConfirmShareCredentials from "../../components/pages/ConfirmShareCredentials";
import Success from "../../components/atoms/Success";
import Loading from "../../components/atoms/Loading";
import { sleep } from "../../../background/utils";

function AppRoutes() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState();

  async function handleLoginSuccess() {
    function requestCredentials() {
      return new Promise((resolve, reject) => {
        const message = { command: "getHoloCredentials" };
        const callback = (resp) => {
          if (!resp) reject();
          resolve(resp.credentials);
        };
        chrome.runtime.sendMessage(message, callback);
      });
    }
    async function getAndSetCredentials() {
      let numAttempts = 0;
      // try 50 times in case of port closed error
      while (numAttempts < 50) {
        try {
          const credentials = await requestCredentials();
          if (!credentials) continue;
          setCredentials(credentials);
          break;
        } catch (err) {}
        await sleep(50);
        numAttempts += 1;
      }
    }
    navigate("/confirm-share-creds", { replace: true });
    getAndSetCredentials();
  }

  async function handleConfirmation() {
    const message = { command: "confirmShareCredentials" };
    chrome.runtime.sendMessage(message);
    await sleep(50); // give background script time to handle this message before sending the next message
    // navigate("/share-creds-success");
    onExit();
  }

  function onExit() {
    const message = { command: "closingHoloShareCredsConfirmationPopup" };
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
          path="/confirm-share-creds"
          element={
            <ConfirmShareCredentials
              credentials={credentials}
              onConfirmation={handleConfirmation}
            />
          }
        />
        {/* <Route
          path="/share-creds-success"
          element={
            <div style={{ marginTop: "150px" }}>
              <Success
                message="Successfully shared credentials"
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
