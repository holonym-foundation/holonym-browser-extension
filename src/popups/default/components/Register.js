import React from "react";
import { CryptoController } from "../../../shared/CryptoController";

const cryptoController = new CryptoController();

function Register({ onRegisterSuccess }) {
  async function handleRegister(event) {
    event.preventDefault();
    const password = event.target.password.value;
    await cryptoController.initialize(password);
    event.target.password.value = "";
    onRegisterSuccess();
  }

  return (
    <>
      <h3>Register</h3>
      <p>
        (WARNING: This will generate a new keypair, making your old credentials
        inaccessible)
      </p>
      <form id="register-form" onSubmit={handleRegister}>
        <div>
          <label>Password: </label>
          <input type="text" name="password" defaultValue="test" />
        </div>
        <button type="submit">Submit</button>
      </form>
    </>
  );
}

export default Register;
