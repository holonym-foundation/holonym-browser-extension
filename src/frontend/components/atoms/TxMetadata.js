import React from "react";

function Row({ name, value }) {
  return (
    <div style={{ display: "flex", marginTop: "1.05rem", marginBottom: "1.05rem" }}>
      <span style={{ flex: "50%" }} className="credential-name">
        {name}
      </span>
      <span style={{ flex: "50%" }}>{value}</span>
    </div>
  );
}

// Component for displaying a single TransactionMetadata object (see tyepdef in HoloStore)
export default function TxMetadata({ headerName, headerValue, txMetadata }) {
  return (
    <div
      style={{ marginTop: "1.05rem", marginLeft: "1.05rem", marginRight: "1.05rem" }}
    >
      {headerName && headerValue ? (
        <p style={{ fontSize: "0.6rem" }}>
          {headerName}: {headerValue}
        </p>
      ) : null}
      {Object.keys(txMetadata).map((fieldName, index) => (
        <Row key={index} name={fieldName} value={txMetadata[fieldName]} />
      ))}
    </div>
  );
}
