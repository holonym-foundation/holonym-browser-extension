import React, { useState, useEffect } from "react";
import TxMetadata from "../atoms/TxMetadata";
import HorizontalLine from "../atoms/HorizontalLine";

// TODO: Create a base 2-col table component that can be used for both this Leaves
// component and for the Credentials component

// TODO: Instead of issuer address, display something like "Holonym + Vouched". Add
// a lookup table to constants with a mapping of issuer_address -> issuer_display_name

function Leaves({ leafTxMetadata }) {
  const [leavesToDisplay, setLeavesToDisplay] = useState();

  useEffect(() => {
    if (!leafTxMetadata) return;
    // TODO: Change display names. E.g., change "blockNumber" to "Block number".
    setLeavesToDisplay(leafTxMetadata);
  }, [leafTxMetadata]);

  return (
    <>
      {leavesToDisplay && Object.keys(leavesToDisplay)?.length > 0 && (
        <div className="holo-credentials-container">
          {Object.keys(leavesToDisplay).map((issuerName, index) => (
            <div>
              <TxMetadata
                key={index}
                issuer={issuerName}
                txMetadata={leavesToDisplay[issuerName]}
              />
              {index != Object.keys(leavesToDisplay).length - 1 ? (
                <HorizontalLine borderColor="#556" />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Leaves;
