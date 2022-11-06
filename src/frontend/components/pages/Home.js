import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import ReactTooltip from "react-tooltip";
import ArrowInBox from "../../img/share-box-fill.png";
import Credentials from "../atoms/Credentials";
import HorizontalLine from "../atoms/HorizontalLine";
import { sleep } from "../../../@shared/utils";

const linkToStartVerification = process.env.LINK_TO_START_VERIFICATION;
const frontendUrl = process.env.FRONTEND_URL;

function Home() {
  const [credentials, setCredentials] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    function requestCredentials() {
      return new Promise((resolve, reject) => {
        const message = { command: "getHoloCredentials" };
        const callback = (resp) => {
          if (!resp) reject();
          resolve(resp);
        };
        chrome.runtime.sendMessage(message, callback);
      });
    }
    async function getAndSetCredentials() {
      let numAttempts = 0;
      // try 50 times in case of port closed error
      while (numAttempts < 50) {
        try {
          const credentials = await requestCredentials();
          if (!credentials) continue;
          setCredentials(credentials);
          break;
        } catch (err) {}
        await sleep(50);
        numAttempts += 1;
      }
    }
    getAndSetCredentials();
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
          <div style={{ marginTop: "15px", marginBottom: "15px" }}>
            {!credentials && (
              <button
                className="x-button secondary center-block"
                style={{ width: "100%" }}
              >
                <a
                  href={linkToStartVerification}
                  style={{ border: "none", backgroundColor: "transparent" }}
                  target="_blank"
                >
                  Get credentials
                  <img
                    src={ArrowInBox}
                    className="arrow-in-box"
                    style={{
                      position: "absolute",
                      height: "18px",
                      right: "65px",
                      paddingTop: "1px",
                    }}
                  />
                </a>
              </button>
            )}
          </div>
          <h1 style={{ textAlign: "center" }}>Credentials</h1>
          <Credentials sortedCreds={credentials} />
        </div>
        {/* <button
        type="submit"
        onClick={() => navigate("/reset-account", { replace: true })}
        className="red-button"
      >
        Reset Account
      </button> */}
        <div style={{ marginTop: "auto" }}>
          <div>
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
              <HorizontalLine />
            </div>
            {credentials ? (
              <a
                href={frontendUrl + "/prove"}
                target="_blank"
                className="x-button secondary center-block"
                style={{ textAlign: "center" }}
              >
                Proof Menu
                <img
                  src={ArrowInBox}
                  className="arrow-in-box"
                  style={{
                    position: "absolute",
                    height: "18px",
                    right: "90px",
                    paddingTop: "1px",
                  }}
                />
              </a>
            ) : (
              <a
                onClick={() => {}}
                data-tip="You must get credentials before generating proofs"
                className="x-button secondary center-block not-allowed-base"
                style={{ textAlign: "center" }}
              >
                Proof Menu
                <img
                  src={ArrowInBox}
                  // className="arrow-in-box"
                  style={{
                    position: "absolute",
                    height: "18px",
                    right: "90px",
                    paddingTop: "1px",
                  }}
                />
              </a>
            )}
          </div>

          <div style={{ marginTop: "20px", marginBottom: "20px" }}></div>
          <button
            type="submit"
            onClick={() => navigate("/privacy-pool-txs", { replace: true })}
            className="x-button center-block"
            style={{ width: "100%" }}
          >
            Privacy Pool Transactions
          </button>

          <div style={{ marginTop: "20px", marginBottom: "20px" }}></div>
          <button
            type="submit"
            onClick={() => navigate("/about", { replace: true })}
            className="x-button center-block"
            style={{ width: "100%" }}
          >
            About
          </button>
        </div>
        <ReactTooltip place="top" className="toolip-base" />
      </div>
    </>
  );
}

export default Home;

// TODO: Create a Button component in atoms
