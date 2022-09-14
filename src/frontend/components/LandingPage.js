import React, { useState, useEffect } from "react";
import SetPassword from "./molecules/SetPassword";
import PasswordLogin from "./atoms/PasswordLogin";
import ChangePassword from "./atoms/ChangePassword";
import { sleep } from "../../background/utils";

function LandingPage({ onLoginSuccess }) {
  const [registered, setRegistered] = useState(false);

  // TODO: Fix login! It's not working

  useEffect(() => {
    async function getIsRegistered() {
      let numAttempts = 0;
      // try 50 times in case of port closed error
      while (numAttempts < 50) {
        console.log("attempt ", numAttempts)
        const r = null;
        try {
          const callback = (resp) => console.log("response was ", resp);
          chrome.runtime.sendMessage({command: "holoGetIsRegistered"}, callback);
        } catch (err) {}
        await sleep(50);
        numAttempts += 1;
      }
    }
    getIsRegistered().then((val) => {console.log(val); setRegistered(val)});
  }, []);

  return (
    <>
      {/* <p>registered ? {registered} </p> */}
      {!registered ? (
        <SetPassword onAccountCreated={onLoginSuccess} />
      ) : (
        <PasswordLogin onLoginSuccess={onLoginSuccess} />
      )}
    </>
  );
}

export default LandingPage;
