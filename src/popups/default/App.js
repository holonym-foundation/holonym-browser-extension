import React, { useState } from "react";
import { CryptoController } from "../../shared/CryptoController";
import Register from "./components/Register";
import PasswordLogin from "../../shared/components/PasswordLogin";

const cryptoController = new CryptoController();

function App() {
  const [loginIsVisible, setLoginIsVisible] = useState(true);

  async function handleLoginSuccess() {
    setLoginIsVisible(false);
    setCredentials(credentials);
    setCredsContainerIsVisible(true);
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    const oldPassword = event.target["old-password"].value;
    const newPassword = event.target["new-password"].value;
    const changePwSuccess = await cryptoController.changePassword(
      oldPassword,
      newPassword
    );
    console.log(`changePwSuccess: ${changePwSuccess}`);
    event.target["old-password"].value = "";
    event.target["new-password"].value = "";
  }

  return (
    <>
      <h1>Holonym</h1>
      {/* <Register /> */}
      {loginIsVisible && <PasswordLogin onLoginSuccess={handleLoginSuccess} />}
      <h3>Change Password</h3>
      <form id="change-password-form" onSubmit={handleChangePassword}>
        <div>
          <label>Old Password: </label>
          <input type="text" name="old-password" defaultValue="test" />
        </div>
        <div>
          <label>New Password: </label>
          <input type="text" name="new-password" defaultValue="test" />
        </div>
        <button type="submit">Submit</button>
      </form>
    </>
  );
}

export default App;
