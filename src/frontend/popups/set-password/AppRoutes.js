import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "../../components/pages/LandingPage";
import Success from "../../components/atoms/Success";
import Loading from "../../components/atoms/Loading";

function AppRoutes() {
  const navigate = useNavigate();

  async function handleLoginSuccess() {
    window.close();
  }

  function onExit() {
    // const message = { command: "closingHoloSetPasswordPopup" };
    // chrome.runtime.sendMessage(message);
    // window.close();
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<LandingPage onLoginSuccess={handleLoginSuccess} />}
        />
      </Routes>
    </>
  );
}

export default AppRoutes;
