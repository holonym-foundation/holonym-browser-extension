import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import ReactTooltip from "react-tooltip";
import ArrowInBox from "../../img/share-box-fill.png";
import HorizontalLine from "../atoms/HorizontalLine";
import LeafTxMetadata from "../molecules/LeafTxMetadata";
import { sleep } from "../../../@shared/utils";

// TODO: Rename these "leaf" components. Use "PrivacyPool" nomenclature instead of
// "leaf" and "merkleTree" nomenclature

// For testing
const leavesMetadata = {
  "0x0000000000000000000000000000000000000000": {
    blockNumber: 0,
    txHash: 123,
  },
  "0x0000000000000000000000000000000000000001": {
    blockNumber: 1,
    txHash: 456,
  },
};

function LeafTxs() {
  const [leafTxMetadata, setLeafTxMetadata] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    function requestLeafTxMetadata() {
      return new Promise((resolve, reject) => {
        const message = { command: "holoGetLeafTxMetadata" };
        const callback = (resp) => {
          if (!resp) reject();
          resolve(resp);
        };
        chrome.runtime.sendMessage(message, callback);
      });
    }
    async function getAndSetLeafTxMetadata() {
      let numAttempts = 0;
      // try 50 times in case of port closed error
      while (numAttempts < 50) {
        try {
          const leafTxMetadataTemp = await requestLeafTxMetadata();
          if (!leafTxMetadataTemp) continue;
          setLeafTxMetadata(leafTxMetadataTemp);
          break;
        } catch (err) {}
        await sleep(50);
        numAttempts += 1;
      }
    }
    getAndSetLeafTxMetadata(); // TODO: UNCOMMENT
    // setLeafTxMetadata(leavesMetadata); // For testing
  }, []);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1",
        }}
      >
        <div>
          {/* <div style={{ marginTop: "15px", marginBottom: "15px" }}>
          </div> */}
          <h1 style={{ textAlign: "center" }}>Leaf Transactions</h1>
          <p style={{ marginLeft: "1.05rem" }}>
            This page shows transaction metadata for transactions you have submitted to
            add your credentials to the Privacy Pool
          </p>
          <LeafTxMetadata leafTxMetadata={leafTxMetadata} />
        </div>
        <button
          type="submit"
          onClick={() => navigate("/home", { replace: true })}
          className="x-button center-block"
          style={{ marginTop: "5px", marginBottom: "20px", width: "100%" }}
        >
          Return To Credentials
        </button>
        {/* <div style={{ marginTop: "auto" }}>
          <div>
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
              <HorizontalLine />
            </div>
          </div>
        </div> */}
      </div>
    </>
  );
}

export default LeafTxs;
