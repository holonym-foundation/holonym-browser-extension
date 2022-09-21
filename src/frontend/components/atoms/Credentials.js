import React, { useState, useEffect } from "react";

function Credentials({ credentials }) {
  const [credsToDisplay, setCredsToDisplay] = useState();

  useEffect(() => {
    if (!credentials) return;
    const allowedCredsNames = Object.keys(credentials).filter((name) => {
      if (name.toLowerCase().includes("signature")) return false;
      if (name.toLowerCase().includes("secret")) return false;
      if (name == "completedAt") return false;
      return true;
    });
    const credsToDisplayTemp = Object.fromEntries(
      allowedCredsNames.map((name) => [name, credentials[name]])
    );
    setCredsToDisplay(credsToDisplayTemp);
  }, [credentials]);

  return (
    <>
      {credsToDisplay && Object.keys(credsToDisplay).length > 0 && (
        <div className="holo-credentials-container">
          {Object.keys(credsToDisplay).map((credentialName, index) => {
            let formattedCred = credentialName.replace(/([A-Z])/g, " $1");
            formattedCred =
              formattedCred.charAt(0).toUpperCase() + formattedCred.slice(1);
            return (
              <div key={index} style={{ display: "flex", margin: "1.05rem" }}>
                <span style={{ flex: "35%" }} className="credential-name">
                  {formattedCred}
                </span>
                <span style={{ flex: "65%" }}>{credsToDisplay[credentialName]}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Credentials;
