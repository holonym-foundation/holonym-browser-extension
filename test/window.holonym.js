// TODO: Test the window.holonym object.
// - injected by content/inject.js
// - object's code is in content/holonym.js
// - listener in content/content.js

import { expect } from "chai";
import {
  initialize,
  sleep,
  sendMessage,
  encrypt,
  login,
  sendEncryptedCredentials,
  getPopupPage,
  clearStagedCredentials,
} from "./utils/utils.js";

// NOTE: frontendUrl must be either "https://holonym.io" or "http://localhost:3002"
// Use "http://localhost:3002" if testing without internet connection
const frontendUrl = "https://holonym.io";

describe.only("window.holonym", async () => {
  let browser;
  let serviceWorker;
  let extensionId;
  let defaultPopupPage;
  let frontendPage;
  let defaultPopupUrl;

  const validPassword = "thithithareallylongpathword$%$747$*227738";

  before(async () => {
    const initVals = await initialize();
    browser = initVals.browser;
    serviceWorker = initVals.serviceWorker;
    extensionId = initVals.extensionId;
    await sleep(1000);
    // Setting extensionId sometimes doesn't work
    await serviceWorker.evaluateHandle((extId) => {
      extensionId = extId;
      popupOrigin = `chrome-extension://${extensionId}`;
    }, extensionId);
    defaultPopupUrl = `chrome-extension://${extensionId}/default_popup.html`;
    frontendPage = await browser.newPage();
    await frontendPage.goto(frontendUrl, { waitUntil: "networkidle0" });
    await frontendPage.bringToFront();
    await sleep(300); // Seems to reduce ReferenceErrors
  });

  after(async () => {
    browser.close();
  });

  describe("holoGetIsRegistered", async () => {
    it("Should return false before user has registered", async () => {
      const returnVal = await frontendPage.evaluate(async () => {
        return await window.holonym.holoGetIsRegistered();
      });
      expect(returnVal).to.equal(false);
    });
  });

  describe("getHoloPublicKey", async () => {
    it("Should return undefined before user has registered", async () => {
      await sleep(100);
      const returnVal = await frontendPage.evaluate(async () => {
        return await window.holonym.getHoloPublicKey();
      });
      expect(returnVal).to.equal(undefined);
    });
  });

  describe("holoGetIsRegistered", async () => {
    it("Should return true after user has registered", async () => {
      // NOTE: Modifying the state in a way that affects test is bad. Make tests atomic.
      // register / set password // This functionality is tested elsewhere
      defaultPopupPage = await browser.newPage();
      await defaultPopupPage.goto(defaultPopupUrl, { waitUntil: "networkidle0" });
      await defaultPopupPage.bringToFront();
      const payload1 = {
        command: "holoInitializeAccount",
        password: validPassword,
      };
      const result1 = await sendMessage(defaultPopupPage, extensionId, payload1);
      // query using holonym object
      await frontendPage.bringToFront();
      const returnVal = await frontendPage.evaluate(async () => {
        return await window.holonym.holoGetIsRegistered();
      });
      expect(returnVal).to.equal(true);
    });
  });

  describe("getHoloPublicKey", async () => {
    it("Should return a JWK object after user has registered", async () => {
      await frontendPage.bringToFront();
      const returnVal = await frontendPage.evaluate(async () => {
        return await window.holonym.getHoloPublicKey();
      });
      expect(returnVal).to.be.an("object");
      expect(Object.keys(returnVal)).to.include.members([
        "alg",
        "e",
        "ext",
        "key_ops",
        "kty",
        "n",
      ]);
    });
  });
});
// TODO: Test the following properties
// window.holonym = {
//   holoGetHasCredentials: holoGetHasCredentials,
//   hasHolo: holoGetHasCredentials, // "hasHolo" is an alias for "holoGetHasCredentials"
// };
