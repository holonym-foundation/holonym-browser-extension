import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import ArrowInBox from "../../img/share-box-fill.png";
import InfoIcon from "../atoms/InfoIcon";
import HorizontalLine from "../atoms/HorizontalLine";
import SubmittedProofsTxMetadata from "../molecules/SubmittedProofsTxMetadata";
import { sleep } from "../../../@shared/utils";

// TODO: When displaying txMetadata, add an item: a link to the tx on a block explorer

// For testing
const proofsTxMetadata = {
  SybilResistance: {
    chainId: 69,
    blockNumber: 0,
    txHash: 123,
  },
  USResidence: {
    chainId: 420,
    blockNumber: 1,
    txHash: 456,
  },
};

const infoMessage =
  "This page shows metadata for transactions you have submitted that prove aspects about your cloaked credentials";

function SubmittedProofsTxs() {
  const [spTxMetadata, setSpTxMetadata] = useState();
  const [tooltipShowing, setTooltipShowing] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    function requestSpTxMetadata() {
      return new Promise((resolve, reject) => {
        const message = { command: "holoGetSubmittedProofs" };
        const callback = (resp) => {
          if (!resp) reject();
          resolve(resp);
        };
        chrome.runtime.sendMessage(message, callback);
      });
    }
    async function getAndSetSpTxMetadata() {
      let numAttempts = 0;
      // try 50 times in case of port closed error
      while (numAttempts < 50) {
        try {
          const spTxMetadataTemp = await requestSpTxMetadata();
          if (!spTxMetadataTemp) continue;
          setSpTxMetadata(spTxMetadataTemp);
          break;
        } catch (err) {}
        await sleep(50);
        numAttempts += 1;
      }
    }
    getAndSetSpTxMetadata(); // TODO: UNCOMMENT
    // setSpTxMetadata(proofsTxMetadata); // For testing
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
              Proof Transactions
            </h1>
            {/* <div style={{ position: "absolute", top: "100px", left: "250px" }}> */}
            <InfoIcon
              tooltipMessage={infoMessage}
              afterTooltipShow={(event) => setTooltipShowing(true)}
              afterTooltipHide={(event) => setTooltipShowing(false)}
            />
            {/* </div> */}
          </div>
          <SubmittedProofsTxMetadata submittedProofsTxMetadata={spTxMetadata} />
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

export default SubmittedProofsTxs;
