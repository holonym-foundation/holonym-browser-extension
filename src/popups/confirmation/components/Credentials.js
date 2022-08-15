import React, { useState, useEffect } from "react";

function Credentials({ credentials }) {
  const [credsToDisplay, setCredsToDisplay] = useState();

  useEffect(() => {
    if (!credentials) return;
    const defaultCredsToIgnore = ["completedAt", "serverSignature", "secret"];
    const allowedCredsNames = Object.keys(credentials).filter(
      (name) => !defaultCredsToIgnore.includes(name)
    );
    const credsToDisplayTemp = Object.fromEntries(
      allowedCredsNames.map((name) => [name, credentials[name]])
    );
    setCredsToDisplay(credsToDisplayTemp);
  }, [credentials]);

  return (
    <>
      {credsToDisplay && Object.keys(credsToDisplay).length > 0 && (
        <div className="holo-credentials-container ">
          {Object.keys(credsToDisplay).map((credentialName) => (
            <p>
              <span style={{ textDecoration: "underline" }}>{credentialName}</span>
              :&nbsp;
              {credsToDisplay[credentialName]}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

export default Credentials;
