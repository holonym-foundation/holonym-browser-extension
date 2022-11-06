import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "../../components/pages/LandingPage";
import About from "../../components/pages/About";
import Home from "../../components/pages/Home";
import LeafTxs from "../../components/pages/LeafTxs";
import SubmittedProofsTxs from "../../components/pages/SubmittedProofsTxs";
import ResetAccount from "../../components/molecules/ResetAccount";

function AppRoutes() {
  const navigate = useNavigate();

  function handleLoginSuccess() {
    navigate("/home", { replace: true });
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<LandingPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route path="/home" element={<Home />} />
        <Route path="/privacy-pool-txs" element={<LeafTxs />} />
        <Route path="/proof-txs" element={<SubmittedProofsTxs />} />
        {/* <Route
          path="/reset-account"
          element={
            <ResetAccount
              onAccountReset={() => navigate("/home", { replace: true })}
            />
          }
        /> */}
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
