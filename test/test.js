import { fileURLToPath } from "url";
import { dirname } from "path";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { sleep, sendMessage, encrypt } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = `${__dirname}/../dist`;

// NOTE: frontendUrl must be either "https://app.holonym.id" or "http://localhost:3002"
// Use "http://localhost:3002" if testing without internet connection
const frontendUrl = "https://app.holonym.id";

async function initialize() {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXEC_PATH, // See puppeteer-headful GitHub Action
    headless: false,
    devtools: false,
    args: [
      `--no-sandbox`,
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });
  const serviceWorkerTarget = await browser.waitForTarget(
    (target) => target.type() === "service_worker"
  );
  const extensionId = serviceWorkerTarget.url().split("://")[1].split("/")[0];
  return {
    browser: browser,
    serviceWorkerTarget: serviceWorkerTarget,
    extensionId: extensionId,
  };
}

/**
 * The following tests are separates into "atomic" and "interactive" tests.
 * Atomic messages are messages that, upon being called once, have an observable
 * affect on application state.
 * A set of interactive messages is a set of messages that have an observable affect
 * on application state only if the whole set is sent.
 * NOTE: The sequence of the tests matters. Specifically, items stored in chrome storage
 * persist across tests. This includes password, latest message, and credentials.
 */
describe("", async () => {
  let browser;
  let serviceWorkerTarget;
  let extensionId;
  let defaultPopupPage;
  let frontendPage;

  const validPassword = "thithithareallylongpathword$%$747$*227738";

  before(async () => {
    const initVals = await initialize();
    browser = initVals.browser;
    serviceWorkerTarget = initVals.serviceWorkerTarget;
    extensionId = initVals.extensionId;
    frontendPage = await browser.newPage();
    defaultPopupPage = await browser.newPage();
    // Set extensionId and popupOrigin in the background script (i.e., service worker)
    const serviceWorker = await serviceWorkerTarget.worker();
    await serviceWorker.evaluateHandle((extId) => {
      extensionId = extId;
      popupOrigin = `chrome-extension://${extensionId}`;
    }, extensionId);
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
        expect(result.isLoggedIn).to.equal(false);
      });
    });

    describe("holoInitializeAccount", async () => {
      it("Should register the user, given a password", async () => {
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

      describe("holoGetIsLoggedIn", async () => {
        it("Should return true when user is logged in", async () => {
          const payload = { command: "holoGetIsLoggedIn" };
          const result = await sendMessage(defaultPopupPage, extensionId, payload);
          expect(result.isLoggedIn).to.equal(true);
        });
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
      await frontendPage.goto(frontendUrl, { waitUntil: "networkidle0" });
      await frontendPage.bringToFront();
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
      birthdate: "1950-01-01",
      completedAt: "2022-09-13",
      countryCode: 2,
      subdivision: "NY",
    };
    describe("Fail to send credentials from frontend to store in extension", async () => {
      let confirmationPopup;

      // TODO: Create function for setup. This setup is used in this and the next set of tests
      before(async () => {
        // Setup: Get public key, encrypt credentials, and send credentials to extension
        const payload1 = { command: "getHoloPublicKey" };
        const publicKey = await sendMessage(frontendPage, extensionId, payload1);
        const encryptedCreds = await encrypt(publicKey, JSON.stringify(testCreds));
        const payload2 = {
          command: "setHoloCredentials",
          credentials: encryptedCreds,
          sharded: false,
        };
        sendMessage(frontendPage, extensionId, payload2);
        // Get confirmation popup
        await sleep(100);
        const pages = await browser.pages();
        for (const page of pages) {
          const loginForm = await page.$("#login-form");
          if (loginForm) {
            confirmationPopup = page;
          }
        }
      });

      after(async () => {
        const payload = { command: "closingHoloCredentialsConfirmationPopup" };
        await sendMessage(confirmationPopup, extensionId, payload);
        await confirmationPopup.close();
      });

      it("Login attempt should succeed", async () => {
        const payload = { command: "holoPopupLogin", password: validPassword };
        const result = await sendMessage(confirmationPopup, extensionId, payload);
        expect(result.success).to.equal(true);
        await sleep(100);
      });

      it("Latest message in extension should contain testCreds", async () => {
        const payload = { command: "getHoloLatestMessage" };
        const latestMsg = await sendMessage(confirmationPopup, extensionId, payload);
        expect(latestMsg.message.credentials).to.deep.equal(testCreds);
      });

      it("Credentials should not be stored when they are denied", async () => {
        // Confirm credentials
        const payload1 = { command: "denyCredentials" };
        await sendMessage(confirmationPopup, extensionId, payload1);
        await sleep(100);
        // Check stored credentials
        const payload2 = { command: "getHoloCredentials" };
        const creds = await sendMessage(confirmationPopup, extensionId, payload2);
        expect(creds).to.equal(undefined);
      });
    });

    describe("Successfully send credentials from frontend to store in extension", async () => {
      let confirmationPopup;

      before(async () => {
        // Setup: Get public key, encrypt credentials, and send credentials to extension
        const payload1 = { command: "getHoloPublicKey" };
        const publicKey = await sendMessage(frontendPage, extensionId, payload1);
        const encryptedCreds = await encrypt(publicKey, JSON.stringify(testCreds));
        const payload2 = {
          command: "setHoloCredentials",
          credentials: encryptedCreds,
          sharded: false,
        };
        sendMessage(frontendPage, extensionId, payload2);
        // Get confirmation popup
        await sleep(100);
        const pages = await browser.pages();
        for (const page of pages) {
          const loginForm = await page.$("#login-form");
          if (loginForm) {
            confirmationPopup = page;
          }
        }
      });

      after(() => {
        const payload = { command: "closingHoloCredentialsConfirmationPopup" };
        sendMessage(confirmationPopup, extensionId, payload);
        confirmationPopup.close();
      });

      it("Latest message in extension should contain testCreds", async () => {
        const payload = { command: "getHoloLatestMessage" };
        const latestMsg = await sendMessage(confirmationPopup, extensionId, payload);
        expect(latestMsg.message.credentials).to.deep.equal(testCreds);
      });

      it("Credentials with new secret should be stored when credentials are confirmed", async () => {
        // Confirm credentials
        const payload1 = { command: "confirmCredentials" };
        await sendMessage(confirmationPopup, extensionId, payload1);
        await sleep(100);
        // Check stored credentials
        const payload2 = { command: "getHoloCredentials" };
        const creds = await sendMessage(confirmationPopup, extensionId, payload2);
        expect(creds.credentials.newSecret).to.not.equal(undefined);
        const credsSansNewSecret = Object.assign({}, creds.credentials);
        delete credsSansNewSecret.newSecret;
        expect(credsSansNewSecret).to.deep.equal(testCreds);
      });
    });

    describe("Successfully share credentials with frontend", async () => {
      let confirmationPopup;

      after(async () => {
        const payload = { command: "closingHoloShareCredsConfirmationPopup" };
        await sendMessage(confirmationPopup, extensionId, payload);
        await confirmationPopup.close();
      });

      it("Should confirm the sharing of credentials", async () => {
        const payload1 = { command: "getHoloCredentials" };
        sendMessage(frontendPage, extensionId, payload1)
          .then((creds) => {
            // This expect depends on the confirmShareCredentials message (see below)
            const credsSansNewSecret = Object.assign({}, creds);
            delete credsSansNewSecret.newSecret;
            expect(credsSansNewSecret).to.deep.equal(testCreds);
          })
          .catch((err) => {
            console.log(err);
            console.log("error after getHoloCredentials");
          });
        // Get confirmation popup
        await sleep(100);
        const pages = await browser.pages();
        for (const page of pages) {
          const shareCredsDiv = await page.$("#confirm-share-credentials-page");
          if (shareCredsDiv) {
            confirmationPopup = page;
          }
        }
        // Confirm credentials
        const payload3 = { command: "confirmShareCredentials" };
        sendMessage(confirmationPopup, extensionId, payload3);
        await sleep(1000); // sleep so that background has time to respond to getHoloCredentials
      });
    });
  });
});
