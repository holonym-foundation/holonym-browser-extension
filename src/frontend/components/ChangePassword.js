import React from "react";
import { CryptoController } from "../../scripts/shared/CryptoController";

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
      <h2 className="header-base">Change Password</h2>
      <div style={{ textAlign: "center" }}>
        <form id="change-password-form" onSubmit={handleChangePassword}>
          <div>
            <div>
              <label>Old Password</label>
            </div>
            <input
              type="text"
              name="old-password"
              defaultValue="test"
              className="password-input"
            />
          </div>
          <div>
            <div>
              <label>New Password</label>
            </div>
            <input
              type="text"
              name="new-password"
              defaultValue="test"
              className="password-input"
            />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  );
}

export default ChangePassword;
