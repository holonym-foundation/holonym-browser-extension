import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "../../components/LandingPage";
import Credentials from "../../components/atoms/Credentials";
import ResetAccount from "../../components/molecules/ResetAccount";
import { sleep } from "../../../background/utils";

const linkToStartVerification = process.env.LINK_TO_START_VERIFICATION;
// const linkToProofPage = process.env.LINK_TO_PROOF_PAGE;
const linkToProofPage = "google.com";

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
              <div style={{ margin: "15px" }}>
                {!credentials && (
                  <a
                    href={linkToStartVerification}
                    target="_blank"
                    className="link wide-button center-block"
                  >
                    Get your credentials
                  </a>
                )}
              </div>
              <h2 className="header-base">Credentials</h2>
              <Credentials credentials={credentials} />
              {/* <button
                type="submit"
                onClick={() => navigate("/reset-account", { replace: true })}
                className="red-button"
              >
                Reset Account
              </button> */}
              <button
                type="submit"
                onClick={() => navigate("/proof-menu", { replace: true })}
                className="wide-button center-block"
              >
                View Proof Menu
              </button>
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
        <Route
          path="/proof-menu"
          element={
            <div style={{ margin: "15px" }}>
              <a
                href={linkToProofPage + "/addSmallLeaf"}
                target="_blank"
                className="link wide-button center-block"
              >
                Generate addSmallLeaf Proof
              </a>
              <div style={{ marginTop: "10px" }}>
                <button
                  type="submit"
                  onClick={() => navigate("/home", { replace: true })}
                  className="wide-button center-block"
                >
                  Return To Credentials
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default AppRoutes;
