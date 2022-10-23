import React, { useState, useEffect } from "react";

// Get whether the credentials are sorted by issuer
function getCredsAreSorted(creds) {
  const keys = Object.keys(creds);
  for (const key of keys) {
    if (creds[keys[0]].issuer != keys[0]) return false;
  }
  return true;
}

function getUserFacingNestedCreds(credentials) {
  const allowedCredsNames = Object.keys(credentials).filter((name) => {
    if (name.toLowerCase().includes("signature")) return false;
    if (name.toLowerCase().includes("secret")) return false;
    if (name == "completedAt") return false;
    return true;
  });
  const credsToDisplayTemp = Object.fromEntries(
    allowedCredsNames.map((name) => {
      let formattedCredName = name.replace(/([A-Z])/g, " $1");
      formattedCredName =
        formattedCredName.charAt(0).toUpperCase() + formattedCredName.slice(1);

      [formattedCredName, credentials[name]];
    })
  );
  return credsToDisplayTemp;
}

// A single credential line
function SingleCredential(name, credential) {
  return (
    <div style={{ display: "flex", margin: "1.05rem" }}>
      <span style={{ flex: "35%" }} className="credential-name">
        {name}
      </span>
      <span style={{ flex: "65%" }}>{credential}</span>
    </div>
  );
}
// A list of credentials from a single issuer
function CredentialsFromIssuer(issuer, credentials) {
  return (
    <div>
      <h3>{issuer}</h3>
      {Object.keys(credentials[issuer]).map((credentialName, index) => (
        <SingleCredential
          key={index}
          name={formattedCredName}
          credential={credentials[issuer][credentialName]}
        />
      ))}
    </div>
  );
}

function Credentials({ credentials }) {
  const [credsToDisplay, setCredsToDisplay] = useState();
  const [credsAreSorted, setCredsAreSorted] = useState();

  useEffect(() => {
    if (!credentials) return;
    // const credsAreSortedTemp = getCredsAreSorted();
    // setCredsAreSorted(credsAreSortedTemp);
    // if (credsAreSortedTemp) {
    //   // if creds are from location designated as permanent storage
    //   const credsToDisplayTemp = {};
    //   for (const issuer of Object.keys(credentials)) {
    //     credsToDisplayTemp[issuer] = getUserFacingNestedCreds(credentials[issuer]);
    //   }
    //   setCredsToDisplay(credsToDisplayTemp);
    // } else {
    //   // if creds are from creds staging
    //   const credsToDisplayTemp = getUserFacingNestedCreds(credentials);
    //   setCredsToDisplay(credsToDisplayTemp);
    // }

    const credsToDisplayTemp = {};
    for (const issuer of Object.keys(credentials)) {
      credsToDisplayTemp[issuer] = getUserFacingNestedCreds(credentials[issuer]);
    }
    setCredsToDisplay(credsToDisplayTemp);
  }, [credentials]);

  // TODO: credsToDisplay will now be in nested object like:
  // { issuer1: { cred1: 'cred1', cred2: 'cred2' }, issuer2: { cred1: 'cred1' }, }
  return (
    <>
      {credsToDisplay && Object.keys(credsToDisplay).length > 0 && (
        <div className="holo-credentials-container">
          {/* {credsAreSorted ? ( */}
          {
            Object.keys(credsToDisplay).map((issuerName) => (
              <div>
                <h3>{issuerName}</h3>
                <CredentialsFromIssuer
                  issuer={issuerName}
                  credentials={credsToDisplay[issuerName]}
                />
              </div>
            ))
            // ) : (
            //   <div>
            //     <CredentialsFromIssuer
            //       issuer={issuerName}
            //       credentials={credsToDisplay[issuerName]}
            //     />
            //   </div>
            // )
          }
        </div>
      )}
    </>
  );
}

export default Credentials;
