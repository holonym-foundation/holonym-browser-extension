import React, { useState } from "react";
import InitializeAccount from "../atoms/InitializeAccount";
import Success from "../atoms/Success";

const resetNotice =
  "Enter new password to reset account. NOTICE: By resetting your account, you will lose access " +
  "to any credentials you have stored.";

function ResetAccount({ onAccountReset }) {
  const [success, setSuccess] = useState(false);

  return (
    <>
      <div style={{ textAlign: "center" }}>
        {success ? (
          <Success
            message="Your account has been reset"
            onExit={onAccountReset}
            exitButtonText="Exit"
          />
        ) : (
          <InitializeAccount
            inputLabel="Reset Account"
            subLabel={resetNotice}
            onInitializeSuccess={() => setSuccess(true)}
          />
        )}
      </div>
    </>
  );
}

export default ResetAccount;
