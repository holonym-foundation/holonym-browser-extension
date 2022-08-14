import React from "react";
import { CryptoController } from "../../general/CryptoController";

const cryptoController = new CryptoController();

function App() {
  async function handleLogin(event) {
    event.preventDefault();
    const password = event.target.password.value;
    const loginSuccess = await cryptoController.login(password);
    console.log(`loginSuccess: ${loginSuccess}`);
    event.target.password.value = "";
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
      <h3>Login</h3>
      <form id="login-form" onSubmit={handleLogin}>
        <div>
          <label>Password: </label>
          <input type="text" name="password" defaultValue="test" />
        </div>
        <button type="submit">Submit</button>
      </form>
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
