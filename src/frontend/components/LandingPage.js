import React, { useState, useEffect } from "react";
import SetPassword from "./molecules/SetPassword";
import PasswordLogin from "./atoms/PasswordLogin";
import ChangePassword from "./atoms/ChangePassword";

function LandingPage({ onLoginSuccess }) {
  const [registered, setRegistered] = useState(false);

  // TODO: Fix login! It's not working

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
      <div style={{ marginTop: "150px" }}>
        {!registered ? (
          <SetPassword onAccountCreated={onLoginSuccess} />
        ) : (
          <PasswordLogin onLoginSuccess={onLoginSuccess} />
        )}
      </div>
    </>
  );
}

export default LandingPage;
