import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import createMetaMaskProvider from "metamask-extension-provider";
import PasswordLogin from "../../components/atoms/PasswordLogin";
import LandingPage from "../../components/LandingPage";
import ConfirmCredentials from "../../components/molecules/ConfirmCredentials";
import ConfirmSendToRelayer from "../../components/atoms/ConfirmSendToRelayer";
import Success from "../../components/atoms/Success";
import Loading from "../../components/atoms/Loading";

const credsConfSuccessMessage =
  "Your credentials have been encrypted and stored. " +
  "You can now generate zero knowledge proofs of identity.";

const sendToRelayerSuccessMessage =
  "Your anonymous proof of residence has been sent to a relayer to put on chain.";

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

  function onConfirmCredsContinue() {
    navigate("/confirm-send-to-relayer", { replace: true });
  }

  async function handleConfirmSendProof() {
    function addSmallLeaf() {
      return new Promise((resolve, reject) => {
        const message = {
          command: "holoSendProofToRelayer",
          proofType: "addSmallLeaf-country",
        };
        const callback = (resp) => resolve(resp);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    function PoKoPoML() {
      return new Promise((resolve, reject) => {
        const message = {
          command: "holoSendProofToRelayer",
          proofType: "PoKoPoML-country",
        };
        const callback = (resp) => resolve(resp);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    navigate("/loading-proofs", { replace: true });
    // const addSmallLeafSuccess = await addSmallLeaf();
    // const PoKoPoMLSuccess = await PoKoPoML();

    let currentAccount;

    // MetaMask stuff...
    // TODO: Maybe move MetaMask stuff to App.js
    const provider = createMetaMaskProvider();
    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        console.log("Please connect to MetaMask.");
      } else if (accounts[0] !== currentAccount) {
        currentAccount = accounts[0];
        // Do any other work!
      }
      console.log("currentAccount...");
      console.log(currentAccount);
    }
    provider
      .request({ method: "eth_accounts" })
      .then(handleAccountsChanged)
      .catch((err) => {
        // Some unexpected error.
        // For backwards compatibility reasons, if no accounts are available,
        // eth_accounts will return an empty array.
        console.error(err);
      });

    // TODO: Submit these proofs to smart contract
    navigate("/final-creds-success", { replace: true });
  }

  function onExit() {
    const message = { command: "closingHoloConfirmationPopup" };
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
                onExit={onConfirmCredsContinue}
                exitButtonText="Continue"
              />
            </div>
          }
        />
        <Route
          path="/confirm-send-to-relayer"
          element={
            <div style={{ marginTop: "150px" }}>
              <ConfirmSendToRelayer onConfirmation={handleConfirmSendProof} />
            </div>
          }
        />
        <Route
          path="/final-creds-success"
          element={
            <div style={{ marginTop: "150px" }}>
              <Success
                message={sendToRelayerSuccessMessage}
                onExit={onExit}
                exitButtonText="Exit"
              />
            </div>
          }
        />
        <Route
          path="/loading-proofs"
          element={<Loading loadingMessage="Loading proofs..." />}
        />
      </Routes>
    </>
  );
}

export default AppRoutes;
