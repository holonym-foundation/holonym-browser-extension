import React from "react";
import { CryptoController } from "../../../shared/CryptoController";

const cryptoController = new CryptoController();

function ChangePassword() {
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
      <h3 className="enter-password-label">Change Password</h3>
      <div style={{ textAlign: "center" }}>
        <form id="change-password-form" onSubmit={handleChangePassword}>
          <div>
            <div>
              <label>Old Password</label>
            </div>
            <input type="text" name="old-password" defaultValue="test" />
          </div>
          <div>
            <div>
              <label>New Password</label>
            </div>
            <input type="text" name="new-password" defaultValue="test" />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  );
}

export default ChangePassword;
