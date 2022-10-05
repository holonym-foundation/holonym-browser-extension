import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Credentials from "../atoms/Credentials";
import { sleep } from "../../../background/utils";

const linkToStartVerification = process.env.LINK_TO_START_VERIFICATION;

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
      // try 100 times in case of port closed error
      while (numAttempts < 100) {
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
      <div>
        <div style={{ margin: "15px" }}>
          {!credentials && (
            <a
              href={linkToStartVerification}
              target="_blank"
              className="x-button center-block"
            >
              Get your credentials
            </a>
          )}
        </div>
        <h1 style={{ textAlign: "center" }}>Credentials</h1>
        <Credentials credentials={credentials} />
        {/* <button
        type="submit"
        onClick={() => navigate("/reset-account", { replace: true })}
        className="red-button"
      >
        Reset Account
      </button> */}
        {credentials && (
          <button
            type="submit"
            onClick={() => navigate("/proof-menu", { replace: true })}
            className="x-button center-block"
          >
            Proof Menu
          </button>
        )}
        <div style={{ margin: "20px" }}></div>
        <button
          type="submit"
          onClick={() => navigate("/about", { replace: true })}
          className="x-button center-block"
        >
          About
        </button>
      </div>
    </>
  );
}

export default Home;
