import React from "react";

// NOTE: Use with care.
// This component can be used for (a) first-time account setup and (b) account resets.
// During account resets, the user will lose access to their credentials.
function InitializeAccount({ inputLabel, subLabel, onInitializeSuccess }) {
  async function handleInitialize(event) {
    event.preventDefault();
    function initializeAccount() {
      return new Promise((resolve) => {
        const password = event.target.password.value;
        event.target.password.value = "";
        const message = {
          message: "holoInitializeAccount",
          password: password,
        };
        // const callback = (resp) => resolve(resp.success);
        const callback = (resp) => resolve();
        chrome.runtime.sendMessage(message, callback);
      });
    }
    await initializeAccount();
    if (onInitializeSuccess) onInitializeSuccess();
  }

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <form onSubmit={handleInitialize}>
          <div className="header-base">
            <label>{inputLabel || "Enter Password"}</label>
            {subLabel && <p>{subLabel}</p>}
            {/* <p>
                (WARNING: This will generate a new keypair, making your old credentials
                inaccessible)
              </p> */}
          </div>
          <div>
            <input
              type="text"
              name="password"
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

export default InitializeAccount;
