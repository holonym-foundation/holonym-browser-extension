import React, { useState } from "react";
import InitializeAccount from "./InitializeAccount";
import Success from "./Success";

function CreateAccount({ onAccountCreated }) {
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
            inputLabel="Create Account"
            onInitializeSuccess={onInitializeSuccess}
          />
        )}
      </div>
    </>
  );
}

export default CreateAccount;
