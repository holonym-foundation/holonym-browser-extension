import React, { useState, useEffect } from "react";
import Register from "./Register";
import PasswordLogin from "./PasswordLogin";
import ChangePassword from "./ChangePassword";

function LandingPage({ onLoginSuccess }) {
  const [registered, setRegistered] = useState(false);
  const [changePwIsVisible, setChangePwIsVisible] = useState(false);

  useEffect(() => {
    function getIsRegistered() {
      return new Promise((resolve) => {
        const message = {
          message: "holoGetIsRegistered",
        };
        const callback = (resp) => resolve(resp.isRegistered);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    getIsRegistered().then((val) => setRegistered(val));
  }, []);

  function handleChangePwVisibility() {
    setChangePwIsVisible(!changePwIsVisible);
  }

  return (
    <>
      {!registered ? (
        <Register onRegisterSuccess={() => setRegistered(true)} />
      ) : (
        <div>
          <PasswordLogin onLoginSuccess={onLoginSuccess} />

          {/* <div style={{ textAlign: "center", margin: "10px" }}>
            <button type="submit" onClick={handleChangePwVisibility}>
              Change Password
            </button>
          </div>
          {changePwIsVisible && <ChangePassword />} */}
        </div>
      )}
    </>
  );
}

export default LandingPage;
