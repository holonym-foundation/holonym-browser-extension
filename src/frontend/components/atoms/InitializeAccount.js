import React, { useState } from "react";
import PasswordStrengthBar from "react-password-strength-bar";

// NOTE: Use with care.
// This component can be used for (a) first-time account setup and (b) account resets.
// During account resets, the user will lose access to their credentials.
function InitializeAccount({ inputLabel, subLabel, onInitializeSuccess }) {
  const [password, setPassword] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);
  async function handleInitialize(event) {
    event.preventDefault();
    if (passwordScore < 4) {
      alert("Please choose a stronger password");
      return;
    }
    function initializeAccount() {
      return new Promise((resolve) => {
        const password = event.target.password.value;
        event.target.password.value = "";
        const message = {
          command: "holoInitializeAccount",
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

  // TODO: Add a loading icon while the message is being sent

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <form onSubmit={handleInitialize} autoComplete={"on"}>
          <div className="header-base">
            <label>{inputLabel || "Enter Password"}</label>
            <div className="small-paragraph">{subLabel && <p>{subLabel}</p>}</div>
          </div>
          <div>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoComplete="current-password"
              className="text-field"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "35%", margin: "8px" }}>
              <PasswordStrengthBar
                password={password}
                onChangeScore={(score, feedback) => setPasswordScore(score)}
              />
            </div>
          </div>
          <button className="x-button" style={{ margin: "10px" }} type="submit">
            Submit
          </button>
        </form>
        
      </div>
    </>
  );
}

export default InitializeAccount;
