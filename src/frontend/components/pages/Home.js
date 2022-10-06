import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Credentials from "../atoms/Credentials";
import { sleep } from "../../../background/utils";

const linkToStartVerification = process.env.LINK_TO_START_VERIFICATION;

const WhiteLine = () => (
  <div style={{ marginTop: "5px", marginBottom: "5px" }}>
    <hr style={{ borderColor: "#fff" }} />
  </div>
);

function Home() {
  const [credentials, setCredentials] = useState();
  const [loadingCredentials, setLoadingCredentials] = useState(true);
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
    setLoadingCredentials(true);
    getAndSetCredentials()
      .then(() => setLoadingCredentials(false))
      .catch(() => setLoadingCredentials(false));
  }, []);

  return (
    <>
      {!loadingCredentials && (
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
                    Get your credentials
                  </a>
                </button>
              )}
            </div>
            <h1 style={{ textAlign: "center" }}>Credentials</h1>
            <Credentials credentials={credentials} />
          </div>
          {/* <button
        type="submit"
        onClick={() => navigate("/reset-account", { replace: true })}
        className="red-button"
      >
        Reset Account
      </button> */}
          <div style={{ marginTop: "auto" }}>
            {credentials && (
              <div>
                <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                  <WhiteLine />
                </div>
                <button
                  type="submit"
                  onClick={() => navigate("/proof-menu", { replace: true })}
                  className="x-button center-block"
                  style={{ width: "100%" }}
                >
                  Proof Menu
                </button>
              </div>
            )}
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
              {/* <WhiteLine /> */}
            </div>
            <button
              type="submit"
              onClick={() => navigate("/about", { replace: true })}
              className="x-button center-block"
              style={{ width: "100%" }}
            >
              About
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;
