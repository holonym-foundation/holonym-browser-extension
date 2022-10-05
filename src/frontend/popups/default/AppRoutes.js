import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "../../components/pages/LandingPage";
import About from "../../components/pages/About";
import Home from "../../components/pages/Home";
import ResetAccount from "../../components/molecules/ResetAccount";
import { sleep } from "../../../background/utils";

const linkToProofPage = process.env.LINK_TO_PROOF_PAGE;

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
            <div style={{ marginTop: "150px" }}>
              <a
                href={linkToProofPage + "/lobby3"}
                target="_blank"
                style={{ marginTop: "10px" }}
                className="x-button center-block"
              >
                Generate Lobby3 Proofs
              </a>
              {/* <a
                href={linkToProofPage + "/addLeaf-country"}
                target="_blank"
                style={{ marginTop: "10px" }}
                className="center-block"
              >
                Generate addLeaf-country Proof
              </a> */}
              {/* <a
                href={linkToProofPage + "/PoKoPoML-country"}
                target="_blank"
                style={{ marginTop: "10px" }}
                className="center-block"
              >
                Generate PoKoPoML Proof
              </a> */}
              <div style={{ marginTop: "20px" }}>
                <button
                  type="submit"
                  onClick={() => navigate("/home", { replace: true })}
                  className="x-button center-block"
                >
                  Return To Credentials
                </button>
              </div>
            </div>
          }
        />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
