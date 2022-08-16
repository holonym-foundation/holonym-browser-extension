import React, { useState, useEffect } from "react";
import Register from "./Register";
import PasswordLogin from "./PasswordLogin";
import ChangePassword from "./ChangePassword";
import { CryptoController } from "../../scripts/shared/CryptoController";

const cryptoController = new CryptoController();

function LandingPage({ onLoginSuccess }) {
  const [registered, setRegistered] = useState(false);
  const [changePwIsVisible, setChangePwIsVisible] = useState(false);

  useEffect(() => {
    // TODO: Uncomment
    // cryptoController.getIsRegistered().then((val) => setRegistered(val));
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
