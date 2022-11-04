import React, { useState, useEffect } from "react";

// TODO: Create a base 2-col table component that can be used for both this Leaves
// component and for the Credentials component

// TODO: Instead of issuer address, display something like "Holonym + Vouched". Add
// a lookup table to constants with a mapping of issuer_address -> issuer_display_name

function Row({ name, value }) {
  return (
    <div style={{ display: "flex", marginTop: "1.05rem", marginBottom: "1.05rem" }}>
      <span style={{ flex: "45%" }} className="credential-name">
        {name}
      </span>
      <span style={{ flex: "55%" }}>{value}</span>
    </div>
  );
}
// Transaction metadata from a leaf from a single issuer
function LeafTxMetadata({ issuer, txMetadata }) {
  return (
    <div style={{ marginLeft: "1.05rem", marginRight: "1.05rem" }}>
      <p style={{ fontSize: "0.5rem" }}>Issuer: {issuer}</p>
      {Object.keys(txMetadata).map((fieldName, index) => (
        <Row key={index} name={fieldName} value={txMetadata[fieldName]} />
      ))}
    </div>
  );
}

function Leaves({ leafTxMetadata }) {
  const [leavesToDisplay, setLeavesToDisplay] = useState();

  useEffect(() => {
    if (!leafTxMetadata) return;
    setLeavesToDisplay(leafTxMetadata);
  }, [leafTxMetadata]);

  return (
    <>
      {leavesToDisplay && Object.keys(leavesToDisplay)?.length > 0 && (
        <div className="holo-credentials-container">
          {Object.keys(leavesToDisplay).map((issuerName, index) => (
            <LeafTxMetadata
              key={index}
              issuer={issuerName}
              txMetadata={leavesToDisplay[issuerName]}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default Leaves;
