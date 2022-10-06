import React, { useState, useEffect } from "react";
import SetPassword from "../molecules/SetPassword";
import PasswordLogin from "../atoms/PasswordLogin";
import ChangePassword from "../atoms/ChangePassword";

function LandingPage({ onLoginSuccess }) {
  const [registered, setRegistered] = useState(false);
  const [sendingMessages, setSendingMessages] = useState(true);

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
    function getIsLoggedIn() {
      return new Promise((resolve) => {
        const message = {
          command: "holoGetIsLoggedIn",
        };
        const callback = (resp) => resolve(resp.isLoggedIn);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    (async () => {
      const registeredTemp = await getIsRegistered();
      setRegistered(registeredTemp);
      if (registeredTemp) {
        const isLoggedIn = await getIsLoggedIn();
        if (isLoggedIn) onLoginSuccess();
      }
      setSendingMessages(false);
    })();
  }, []);

  return (
    <>
      {!sendingMessages && (
        <div>
          {!registered ? (
            <div style={{ marginTop: "30px" }}>
              <SetPassword onAccountCreated={onLoginSuccess} />
            </div>
          ) : (
            <div style={{ marginTop: "120px" }}>
              <PasswordLogin onLoginSuccess={onLoginSuccess} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default LandingPage;
