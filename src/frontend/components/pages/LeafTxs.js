import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import ArrowInBox from "../../img/share-box-fill.png";
import InfoIcon from "../atoms/InfoIcon";
import HorizontalLine from "../atoms/HorizontalLine";
import LeafTxMetadata from "../molecules/LeafTxMetadata";
import { sleep } from "../../../@shared/utils";

// TODO: Rename these "leaf" components. Use "PrivacyPool" nomenclature instead of
// "leaf" and "merkleTree" nomenclature

// For testing
const leavesMetadata = {
  "0x0000000000000000000000000000000000000000": {
    chainId: 69,
    blockNumber: 0,
    txHash: 123,
  },
  "0x0000000000000000000000000000000000000001": {
    chainId: 420,
    blockNumber: 1,
    txHash: 456,
  },
};

const infoMessage =
  "This page shows transaction metadata for transactions you have submitted that add your credentials to the Privacy Pool";

function LeafTxs() {
  const [leafTxMetadata, setLeafTxMetadata] = useState();
  const [tooltipShowing, setTooltipShowing] = useState();
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

  const headerClasses = classNames({
    "four-tenths-opacity": !!tooltipShowing,
  });

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
          <div style={{ textAlign: "center" }}>
            <h1 style={{ display: "inline-block" }} className={headerClasses}>
              Leaf Transactions
            </h1>
            <InfoIcon
              tooltipMessage={infoMessage}
              afterTooltipShow={(event) => setTooltipShowing(true)}
              afterTooltipHide={(event) => setTooltipShowing(false)}
            />
          </div>
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
      </div>
    </>
  );
}

export default LeafTxs;
