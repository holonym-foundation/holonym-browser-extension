import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "../../components/pages/LandingPage";
import Success from "../../components/atoms/Success";
import Loading from "../../components/atoms/Loading";

function AppRoutes() {
  const navigate = useNavigate();

  async function handleLoginSuccess() {
    navigate("/success", { replace: true });
  }

  function onExit() {
    // const message = { command: "closingHoloSetPasswordPopup" };
    // chrome.runtime.sendMessage(message);
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
          path="/success"
          element={
            <div style={{ marginTop: "150px" }}>
              <Success
                message="You may exit now"
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
