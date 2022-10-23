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

/**
 * The following tests are separates into "atomic" and "interactive" tests.
 * Atomic messages are messages that, upon being called once, have an observable
 * affect on application state.
 * A set of interactive messages is a set of messages that have an observable affect
 * on application state only if the whole set is sent.
 * NOTE: The sequence of the tests matters. Specifically, items stored in chrome storage
 * persist across tests. This includes password, latest message, and credentials.
 */
describe("Message passing", async () => {
  let browser;
  let serviceWorker;
  let extensionId;
  let defaultPopupPage;
  let frontendPage;

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
    frontendPage = await browser.newPage();
    defaultPopupPage = await browser.newPage();
    await sleep(300); // Seems to reduce ReferenceErrors
  });

  after(async () => {
    browser.close();
  });

  describe("Atomic messages from popup to service worker", async () => {
    before(async () => {
      const defaultPopupUrl = `chrome-extension://${extensionId}/default_popup.html`;
      await defaultPopupPage.goto(defaultPopupUrl, { waitUntil: "networkidle0" });
      await defaultPopupPage.bringToFront();
    });

    describe("holoGetIsRegistered", async () => {
      it("Should return false before user has registered", async () => {
        const payload = { command: "holoGetIsRegistered" };
        const result = await sendMessage(defaultPopupPage, extensionId, payload);
        expect(result.isRegistered).to.equal(false);
      });
    });

    describe("holoGetIsLoggedIn", async () => {
      it("Should return false when user is not logged in", async () => {
        const payload = { command: "holoGetIsLoggedIn" };
        const result = await sendMessage(defaultPopupPage, extensionId, payload);
        expect(!!result.isLoggedIn).to.equal(false);
      });
    });

    describe("holoInitializeAccount", async () => {
      it("Should register the user, given a valid password", async () => {
        // Call holoInitializeAccount
        const payload1 = {
          command: "holoInitializeAccount",
          password: validPassword,
        };
        const result1 = await sendMessage(defaultPopupPage, extensionId, payload1);
        // Check registration status
        const payload2 = { command: "holoGetIsRegistered" };
        const result2 = await sendMessage(defaultPopupPage, extensionId, payload2);
        expect(result2.isRegistered).to.equal(true);
      });
    });

    describe("holoPopupLogin", async () => {
      it("Should fail to login, given an incorrect password", async () => {
        const payload = {
          command: "holoPopupLogin",
          password: "wrong-password",
        };
        const result = await sendMessage(defaultPopupPage, extensionId, payload);
        expect(result.success).to.equal(false);
      });

      it("Should login, given the correct password", async () => {
        const payload = {
          command: "holoPopupLogin",
          password: validPassword,
        };
        const result = await sendMessage(defaultPopupPage, extensionId, payload);
        expect(result.success).to.equal(true);
      });
    });

    describe("holoGetIsLoggedIn", async () => {
      it("Should return true when user is logged in", async () => {
        const payload = { command: "holoGetIsLoggedIn" };
        const result = await sendMessage(defaultPopupPage, extensionId, payload);
        expect(result.isLoggedIn).to.equal(true);
      });
    });

    describe("holoChangePassword", async () => {
      it("Should fail to change the user's password, given an incorrect oldPassword", async () => {
        const payload = {
          command: "holoChangePassword",
          oldPassword: "invalid-password",
          newPassword: "new-password",
        };
        const result = await sendMessage(defaultPopupPage, extensionId, payload);
        expect(result.success).to.equal(false);
      });

      it("Should change the user's password, given the correct oldPassword", async () => {
        const payload1 = {
          command: "holoChangePassword",
          oldPassword: validPassword,
          newPassword: "new-password",
        };
        const result1 = await sendMessage(defaultPopupPage, extensionId, payload1);
        expect(result1.success).to.equal(true);
        // Change pw back to validPassword
        const payload2 = {
          command: "holoChangePassword",
          oldPassword: "new-password",
          newPassword: validPassword,
        };
        const result2 = await sendMessage(defaultPopupPage, extensionId, payload2);
        expect(result2.success).to.equal(true);
      });
    });
  });

  describe("Atomic messages from frontend to service worker", async () => {
    before(async () => {
      await frontendPage.goto(frontendUrl, { waitUntil: "domcontentloaded" });
      await frontendPage.bringToFront();
    });

    describe("holoGetIsInstalled", async () => {
      it("Should return true", async () => {
        const payload = { command: "holoGetIsInstalled" };
        const result = await sendMessage(frontendPage, extensionId, payload);
        expect(result).to.be.true;
      });
    });

    describe("holoGetIsRegistered", async () => {
      it("Should return true, given that the user has registered", async () => {
        const payload = { command: "holoGetIsRegistered" };
        const result = await sendMessage(frontendPage, extensionId, payload);
        expect(result.isRegistered).to.equal(true);
      });
    });

    describe("getHoloPublicKey", async () => {
      it("Should return a JWK object that can be used to encrypt a message", async () => {
        const payload = { command: "getHoloPublicKey" };
        const publicKey = await sendMessage(frontendPage, extensionId, payload);
        expect(publicKey).to.be.an("object");
        expect(async () => await encrypt(publicKey, "test-message")).to.not.throw();
        const encryptedMessage = await encrypt(publicKey, "test-message");
        expect(encryptedMessage).to.be.a("string");
      });
    });
  });

  describe("Interactive messages", async () => {
    const testCreds = {
      secret: "0x4704a39e96c1753b525d8734a37685b8",
      signature:
        "0x07138e4c38e8d8541920a087641017f4d32dcf1d100e94db46d1fd67fa59edf23ab7514a2b9cdc613d7264485764e79aa01d243dfba0b87171675f5219aae7651c",
      issuer: "0x0000000000000000000000000000000000000000",
      birthdate: "1950-01-01",
      completedAt: "2022-09-13",
      countryCode: 2,
      subdivision: "NY",
    };

    describe("Frontend sends credentials to extension", async () => {
      let confirmationPopup;

      afterEach(async () => {
        const payload3 = { command: "closingHoloCredentialsConfirmationPopup" };
        sendMessage(confirmationPopup, extensionId, payload3);
        if (confirmationPopup) await confirmationPopup.close();
        await sleep(50);
      });

      // TODO: More test cases with invalid credentials

      it("Unencrypted credentials sent by frontend should not be returned by getStagedCredentials", async () => {
        sendMessage(frontendPage, extensionId, {
          command: "setHoloCredentials",
          credentials: testCreds,
        });
        await sleep(100);
        confirmationPopup = await getPopupPage(browser, "credentials_confirmation");
        const loginResult = await login(confirmationPopup, extensionId, validPassword);
        expect(loginResult.success).to.equal(true);
        await sleep(50);
        // Get latest message
        const payload1 = { command: "getStagedCredentials" };
        const resp1 = await sendMessage(confirmationPopup, extensionId, payload1);
        expect(resp1.message).to.be.empty;
        await clearStagedCredentials(serviceWorker);
        await sleep(50);
      });

      it("Correctly encrypted credentials sent by frontend should not be stored if popup sends denyCredentials", async () => {
        sendEncryptedCredentials(frontendPage, extensionId, testCreds);
        await sleep(100);
        confirmationPopup = await getPopupPage(browser, "credentials_confirmation");
        const loginResult = await login(confirmationPopup, extensionId, validPassword);
        expect(loginResult.success).to.equal(true);
        await sleep(50);
        // Get latest message
        const payload1 = { command: "getStagedCredentials" };
        const resp1 = await sendMessage(confirmationPopup, extensionId, payload1);
        expect(resp1.message.credentials).to.deep.equal(testCreds);
        // Deny credentials
        const payload2 = { command: "denyCredentials" };
        await sendMessage(confirmationPopup, extensionId, payload2);
        await sleep(50);
        // Check that credentials are not stored as credentials
        const payload3 = { command: "getHoloCredentials" };
        const creds = await sendMessage(confirmationPopup, extensionId, payload3);
        expect(creds).to.be.oneOf([undefined, null]);
        // Check that credentials are not stored as latest message
        const payload4 = { command: "getStagedCredentials" };
        const resp2 = await sendMessage(confirmationPopup, extensionId, payload4);
        expect(resp2.message).to.be.empty;
      });

      it("Latest message in extension should contain the encrypted credentials sent by frontend", async () => {
        sendEncryptedCredentials(frontendPage, extensionId, testCreds);
        await sleep(100);
        confirmationPopup = await getPopupPage(browser, "credentials_confirmation");
        const loginResult = await login(confirmationPopup, extensionId, validPassword);
        expect(loginResult.success).to.equal(true);
        await sleep(50);
        // Get latest message
        const payload1 = { command: "getStagedCredentials" };
        const latestMsg = await sendMessage(confirmationPopup, extensionId, payload1);
        expect(latestMsg.message.credentials).to.deep.equal(testCreds);
        await clearStagedCredentials(serviceWorker);
        await sleep(50);
        // Check that latest message is empty
        const payload4 = { command: "getStagedCredentials" };
        const resp2 = await sendMessage(confirmationPopup, extensionId, payload4);
        expect(resp2.message).to.be.empty;
      });

      it("Credentials sent by frontend should be stored after popup sends confirmCredentials", async () => {
        sendEncryptedCredentials(frontendPage, extensionId, testCreds);
        await sleep(100);
        confirmationPopup = await getPopupPage(browser, "credentials_confirmation");
        const loginResult = await login(confirmationPopup, extensionId, validPassword);
        expect(loginResult.success).to.equal(true);
        await sleep(50);
        // Get latest message
        const payload2 = { command: "getStagedCredentials" };
        const resp = await sendMessage(confirmationPopup, extensionId, payload2);
        expect(resp.message.credentials).to.deep.equal(testCreds);
        // Confirm credentials
        const payload3 = { command: "confirmCredentials" };
        await sendMessage(confirmationPopup, extensionId, payload3);
        await sleep(50);
        // Check stored credentials
        const payload4 = { command: "getHoloCredentials" };
        const creds = await sendMessage(confirmationPopup, extensionId, payload4);
        expect(creds[testCreds.issuer].newSecret).to.not.equal(undefined);
        const credsSansNewSecret = Object.assign({}, creds);
        delete credsSansNewSecret[testCreds.issuer].newSecret;
        expect(credsSansNewSecret[testCreds.issuer]).to.deep.equal(testCreds);
      });
    });

    describe("Frontend requests credentials from extension", async () => {
      let confirmationPopup;

      after(async () => {
        const payload = { command: "closingHoloShareCredsConfirmationPopup" };
        await sendMessage(confirmationPopup, extensionId, payload);
        await confirmationPopup.close();
      });

      it("Frontend should receive credentials after popup sends confirmShareCredentials", async () => {
        const payload1 = { command: "getHoloCredentials" };
        let receivedResponse = false;
        sendMessage(frontendPage, extensionId, payload1)
          .then((creds) => {
            // This expect depends on the confirmShareCredentials message (see below)
            const credsSansNewSecret = Object.assign({}, creds);
            delete credsSansNewSecret[testCreds.issuer].newSecret;
            expect(credsSansNewSecret[testCreds.issuer]).to.deep.equal(testCreds);
            receivedResponse = true;
          })
          .catch((err) => {
            console.log(err);
            console.log("error after getHoloCredentials");
            expect(false).to.equal(true);
            receivedResponse = true;
          });
        // Get confirmation popup
        await sleep(50);
        confirmationPopup = await getPopupPage(browser, "share_creds_confirmation");
        // Confirm credentials
        const payload3 = { command: "confirmShareCredentials" };
        sendMessage(confirmationPopup, extensionId, payload3);
        // wait for background to respond to getHoloCredentials
        async function waitForResponse() {
          const timeout = new Date().getTime() + 3000;
          while (new Date().getTime() <= timeout && !receivedResponse) {
            await sleep(50);
          }
          return receivedResponse;
        }
        await waitForResponse();
      });
    });
  });
});
