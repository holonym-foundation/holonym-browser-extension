import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "../../components/LandingPage";
import Credentials from "../../components/atoms/Credentials";
import ResetAccount from "../../components/molecules/ResetAccount";
import { sleep } from "../../../background/utils";

function AppRoutes() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState();
  const navigate = useNavigate();

  function handleLoginSuccess() {
    setLoggedIn(true);
    navigate("/home", { replace: true });
  }

  useEffect(() => {
    if (loggedIn) return;
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
    getAndSetCredentials();
  }, [loggedIn]);

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<LandingPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/home"
          element={
            <div>
              <h2 className="header-base">Credentials</h2>
              <Credentials credentials={credentials} />
              {/* <button
                type="submit"
                onClick={() => navigate("/reset-account", { replace: true })}
                className="red-button"
              >
                Reset Account
              </button> */}
            </div>
          }
        />
        {/* <Route
          path="/reset-account"
          element={
            <ResetAccount
              onAccountReset={() => navigate("/home", { replace: true })}
            />
          }
        /> */}
      </Routes>
    </>
  );
}

export default AppRoutes;
