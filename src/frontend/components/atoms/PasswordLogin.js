import React from "react";

function PasswordLogin({ onLoginSuccess }) {
  async function handleLogin(event) {
    function login() {
      return new Promise((resolve) => {
        event.preventDefault();
        const password = event.target.password.value;
        event.target.password.value = "";
        const message = { command: "holoPopupLogin", password: password };
        const callback = (resp) => resolve(resp.success);
        chrome.runtime.sendMessage(message, callback);
      });
    }
    const loginSuccess = await login();
    if (loginSuccess) onLoginSuccess();
  }

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <form id="login-form" onSubmit={handleLogin}>
          <div className="header-base">
            <label>Enter Password</label>
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="password"
              autoComplete="current-password"
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

export default PasswordLogin;
