import React, { useState } from "react";
import InitializeAccount from "../atoms/InitializeAccount";
import Success from "../atoms/Success";

function SetPassword({ onAccountCreated }) {
  const [success, setSuccess] = useState(false);

  function onInitializeSuccess() {
    setSuccess(true);
  }

  return (
    <>
      <div style={{ textAlign: "center" }}>
        {success ? (
          <Success
            message="Account created"
            onExit={onAccountCreated}
            exitButtonText="Exit"
          />
        ) : (
          <InitializeAccount
            inputLabel="Set Password"
            subLabel="We suggest that you write down your password and store it somewhere safe"
            onInitializeSuccess={onInitializeSuccess}
          />
        )}
      </div>
    </>
  );
}

export default SetPassword;
