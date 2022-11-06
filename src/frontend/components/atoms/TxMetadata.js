import React from "react";

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

// TODO: Replace "issuer" prop with "header" and "headerName" props so that this component
// can be used for ProofTxMetadata as well

// Component for displaying a single TransactionMetadata object (see tyepdef in HoloStore)
export default function TxMetadata({ issuer, txMetadata }) {
  return (
    <div
      style={{ marginTop: "1.05rem", marginLeft: "1.05rem", marginRight: "1.05rem" }}
    >
      {issuer ? <p style={{ fontSize: "0.6rem" }}>Issuer: {issuer}</p> : null}
      {Object.keys(txMetadata).map((fieldName, index) => (
        <Row key={index} name={fieldName} value={txMetadata[fieldName]} />
      ))}
    </div>
  );
}
