import React, { useState, useEffect } from "react";

// NOTE: "sorted creds" refer to an object with a shape like this:
// { issuer1: { cred1: 'cred1', cred2: 'cred2' }, issuer2: { cred1: 'cred1' }, }
// and "creds" refer to creds with an object with the shape like this:
// { cred1: 'cred1', cred2: 'cred2' }

function getUserFacingNestedCreds(credentials) {
  const allowedCredsNames = Object.keys(credentials).filter((name) => {
    if (name.toLowerCase().includes("signature")) return false;
    if (name.toLowerCase().includes("secret")) return false;
    if (name.toLowerCase().includes("issuer")) return false;
    if (name == "completedAt") return false;
    return true;
  });
  const credsToDisplayTemp = Object.fromEntries(
    allowedCredsNames.map((name) => {
      let formattedCredName = name.replace(/([A-Z])/g, " $1");
      formattedCredName =
        formattedCredName.charAt(0).toUpperCase() + formattedCredName.slice(1);
      return [formattedCredName, credentials[name]];
    })
  );
  return credsToDisplayTemp;
}

// A single credential line
function SingleCredential({ name, credential }) {
  return (
    <div style={{ display: "flex", marginTop: "1.05rem", marginBottom: "1.05rem" }}>
      <span style={{ flex: "35%" }} className="credential-name">
        {name}
      </span>
      <span style={{ flex: "65%" }}>{credential}</span>
    </div>
  );
}
// A list of credentials from a single issuer
function CredentialsFromIssuer({ issuer, credentials }) {
  return (
    <div style={{ marginLeft: "1.05rem", marginRight: "1.05rem" }}>
      {/* <p>Issuer: {issuer}</p> */}
      {Object.keys(credentials).map((credentialName, index) => (
        <SingleCredential
          key={index}
          name={credentialName}
          credential={credentials[credentialName]}
        />
      ))}
    </div>
  );
}

function Credentials({ sortedCreds }) {
  const [credsToDisplay, setCredsToDisplay] = useState();

  useEffect(() => {
    if (!sortedCreds) return;
    const credsToDisplayTemp = {};
    for (const issuer of Object.keys(sortedCreds)) {
      credsToDisplayTemp[issuer] = getUserFacingNestedCreds(sortedCreds[issuer]);
    }
    setCredsToDisplay(credsToDisplayTemp);
  }, [sortedCreds]);

  return (
    <>
      {credsToDisplay && Object.keys(credsToDisplay)?.length > 0 && (
        <div className="holo-credentials-container">
          {Object.keys(credsToDisplay).map((issuerName, index) => (
            <CredentialsFromIssuer
              key={index}
              issuer={issuerName}
              credentials={credsToDisplay[issuerName]}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default Credentials;
