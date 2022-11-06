import React, { useState, useEffect } from "react";
import TxMetadata from "../atoms/TxMetadata";
import HorizontalLine from "../atoms/HorizontalLine";

const txMetadataNameConversion = {
  chainId: "Chain ID",
  blockNumber: "Block number",
  txHash: "Transaction hash",
};

function SubmittedProofsTxMetadata({ submittedProofsTxMetadata }) {
  const [spTxMetadataToDisplay, setspTxMetadataToDisplay] = useState();

  useEffect(() => {
    if (!submittedProofsTxMetadata) return;

    // TODO: Move this to TxMetadata component
    // Change display names. E.g., change "blockNumber" to "Block number".
    const tempMetadata = {};
    for (const proofType of Object.keys(submittedProofsTxMetadata)) {
      tempMetadata[proofType] = {};
      for (const key of Object.keys(submittedProofsTxMetadata[proofType])) {
        const newKey = txMetadataNameConversion[key];
        tempMetadata[proofType][newKey] = submittedProofsTxMetadata[proofType][key];
      }
    }

    setspTxMetadataToDisplay(tempMetadata);
  }, [submittedProofsTxMetadata]);

  return (
    <>
      {spTxMetadataToDisplay && Object.keys(spTxMetadataToDisplay)?.length > 0 && (
        <div className="holo-credentials-container">
          {Object.keys(spTxMetadataToDisplay).map((proofType, index) => (
            <div>
              <TxMetadata
                key={index}
                headerName="Proof type"
                headerValue={proofType}
                txMetadata={spTxMetadataToDisplay[proofType]}
              />
              {index != Object.keys(spTxMetadataToDisplay).length - 1 ? (
                <HorizontalLine borderColor="#556" />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default SubmittedProofsTxMetadata;
