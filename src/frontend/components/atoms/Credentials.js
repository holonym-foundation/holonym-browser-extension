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
          {Object.keys(credsToDisplay).map((credentialName, index) => (
            <div key={index} style={{ display: "flex", margin: "1.05rem" }}>
              <span style={{ flex: "30%" }} className="credential-name">
                {credentialName}
              </span>
              <span style={{ flex: "70%" }}>{credsToDisplay[credentialName]}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Credentials;
