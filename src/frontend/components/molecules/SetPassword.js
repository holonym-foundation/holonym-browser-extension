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
            onInitializeSuccess={onInitializeSuccess}
          />
        )}
      </div>
    </>
  );
}

export default SetPassword;
