import React, { useState, useEffect } from "react";
import SetPassword from "./molecules/SetPassword";
import PasswordLogin from "./atoms/PasswordLogin";
import ChangePassword from "./atoms/ChangePassword";

function LandingPage({ onLoginSuccess }) {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    function getIsRegistered() {
      return new Promise((resolve) => {
        const message = {
          command: "holoGetIsRegistered",
        };
        const callback = (resp) => resolve(resp.isRegistered);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    getIsRegistered().then((val) => setRegistered(val));
  }, []);

  return (
    <>
      {!registered ? (
        <SetPassword onAccountCreated={() => setRegistered(true)} />
      ) : (
        <PasswordLogin onLoginSuccess={onLoginSuccess} />
      )}
    </>
  );
}

export default LandingPage;
