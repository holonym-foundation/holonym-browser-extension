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
          command: "holoChangePassword",
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
      <h1 style={{ textAlign: "center" }}>Change Password</h1>
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
              className="text-field"
            />
          </div>
          <div>
            <div>
              <label>New Password</label>
            </div>
            <input
              type="password"
              name="new-password"
              defaultValue="test"
              className="text-field"
            />
          </div>
          <button className="x-button" style={{ margin: "10px" }} type="submit">
            Submit
          </button>
        </form>
      </div>
    </>
  );
}

export default ChangePassword;
