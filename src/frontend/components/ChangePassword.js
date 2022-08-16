import React from "react";

function ChangePassword({ onPasswordChange }) {
  async function handleChangePassword(event) {
    event.preventDefault();
    function changePassword() {
      return new Promise((resolve) => {
        const oldPassword = event.target["old-password"].value;
        const newPassword = event.target["new-password"].value;
        event.target["old-password"].value = "";
        event.target["new-password"].value = "";
        const message = {
          message: "holoChangePassword",
          oldPassword: oldPassword,
          newPassword: newPassword,
        };
        const callback = (resp) => resolve(resp.success);
        chrome.runtime.sendMessage(message, callback);
      });
    }

    const changePwSuccess = await changePassword();
    if (changePwSuccess && onPasswordChange) onPasswordChange();
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
