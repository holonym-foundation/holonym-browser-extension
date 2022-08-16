import React from "react";
import InitializeAccount from "./InitializeAccount";

function Register({ onRegisterSuccess }) {
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <InitializeAccount
          inputLabel="Register"
          onInitializeSuccess={onRegisterSuccess}
        />
      </div>
    </>
  );
}

export default Register;
