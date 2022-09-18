import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PasswordLogin from "../../components/atoms/PasswordLogin";
import LandingPage from "../../components/LandingPage";
import ConfirmShareProof from "../../components/molecules/ConfirmShareProof";
import Success from "../../components/atoms/Success";
import Loading from "../../components/atoms/Loading";

function AppRoutes() {
  const navigate = useNavigate();
  const [proofType, setProofType] = useState();

  async function handleLoginSuccess() {
    navigate("/confirm-share-proof", { replace: true });
  }

  function handleConfirmation() {
    const message = { command: "confirmShareProof" };
    const callback = (resp) => {
      navigate("/share-proof-success");
    };
    navigate("/loading-share-proof");
    chrome.runtime.sendMessage(message, callback);
  }

  useEffect(() => {
    // TODO: Impelement this command in background.js
    const message = { command: "getTypeOfRequestedProof" };
    const callback = (resp) => {
      setProofType(resp.proofType);
    };
    chrome.runtime.sendMessage(message, callback);
  }, []);

  function onExit() {
    const message = { command: "closingHoloProofConfirmationPopup" };
    chrome.runtime.sendMessage(message);
    window.close();
  }

  // TODO: Maybe a loading page while proof is being generated?

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<LandingPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/confirm-share-proof"
          element={
            <div style={{ marginTop: "150px" }}>
              <ConfirmShareProof
                proofType={proofType}
                onConfirmation={handleConfirmation}
              />
            </div>
          }
        />
        <Route
          path="/loading-share-proof"
          element={
            <div style={{ marginTop: "150px" }}>
              <Loading loadingMessage="Loading proof..." />
            </div>
          }
        />
        <Route
          path="/share-proof-success"
          element={
            <div style={{ marginTop: "150px" }}>
              <Success
                message="Successfully shared proof"
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
