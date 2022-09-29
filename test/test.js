import { fileURLToPath } from "url";
import { dirname } from "path";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { sleep, sendMessage, encrypt } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = __dirname.includes("github/workspace/")
  ? `${__dirname}/prod-materials/dist`
  : `${__dirname}/../dist`;

// NOTE: frontendUrl must be either "https://app.holonym.id" or "http://localhost:3002"
// Use "http://localhost:3002" if testing without internet connection
const frontendUrl = "https://app.holonym.id";

async function initialize() {
  console.log(`pathToExtension... ${pathToExtension}`);
  console.log("launching puppeteer...");
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
  console.log("Getting serviceWorkerTarget...");
  const serviceWorkerTarget = await browser.waitForTarget(
    (target) => target.type() === "service_worker"
  );
  const extensionId = serviceWorkerTarget.url().split("://")[1].split("/")[0];
  console.log(`extensionId... ${extensionId}`);
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
    console.log("creating frontend page...");
    frontendPage = await browser.newPage();
    console.log("creating default page...");
    defaultPopupPage = await browser.newPage();
    // Set extensionId and popupOrigin in the background script (i.e., service worker)
    console.log("Getting serviceWorker...");
    const serviceWorker = await serviceWorkerTarget.worker();
    console.log("Modifying extensionId and popupOrigin in serviceWorker...");
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
      console.log(`Navigating defaultPopupPage to ${defaultPopupUrl}`);
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
    describe("Send user credentials from frontend and store in extension", async () => {
      it("Should store credentials as latest message and, after confirmation, as credentials", async () => {
        // TODO: Split this test up into multiple "it()"s
        // Encrypt testCreds with user's public key
        const payload1 = { command: "getHoloPublicKey" };
        const publicKey = await sendMessage(frontendPage, extensionId, payload1);
        const testCreds = {
          secret: "0x4704a39e96c1753b525d8734a37685b8",
          signature:
            "0x07138e4c38e8d8541920a087641017f4d32dcf1d100e94db46d1fd67fa59edf23ab7514a2b9cdc613d7264485764e79aa01d243dfba0b87171675f5219aae7651c",
          birthdate: "",
          completedAt: "2022-09-13",
          countryCode: 2,
          subdivision: "",
        };
        const encryptedCreds = await encrypt(publicKey, JSON.stringify(testCreds));
        const payload = {
          command: "setHoloCredentials",
          credentials: encryptedCreds,
          sharded: false,
        };
        sendMessage(frontendPage, extensionId, payload);
        // Get confirmation popup
        let confirmationPopup;
        await sleep(100);
        const pages = await browser.pages();
        for (const page of pages) {
          const loginForm = await page.$("#login-form");
          if (loginForm) {
            confirmationPopup = page;
          }
        }
        // Login
        const payload2 = { command: "holoPopupLogin", password: validPassword };
        const result = await sendMessage(confirmationPopup, extensionId, payload2);
        expect(result.success).to.equal(true);
        await sleep(100);
        // Check holoLatestMessage
        const payload3 = { command: "getHoloLatestMessage" };
        const latestMsg = await sendMessage(confirmationPopup, extensionId, payload3);
        expect(latestMsg.message.credentials).to.deep.equal(testCreds);
        // Confirm credentials
        const payload4 = { command: "confirmCredentials" };
        await sendMessage(confirmationPopup, extensionId, payload4);
        await sleep(100);
        // Check stored credentials
        const payload5 = { command: "getHoloCredentials" };
        const creds = await sendMessage(confirmationPopup, extensionId, payload5);
        const credsSansNewSecret = Object.assign({}, creds.credentials);
        delete credsSansNewSecret.newSecret;
        expect(credsSansNewSecret).to.deep.equal(testCreds);
        // Close
        const payload6 = { command: "closingHoloCredentialsConfirmationPopup" };
        await sendMessage(confirmationPopup, extensionId, payload6);
        await confirmationPopup.close();
      });
    });
    // TODO: Test deny credentials
    // TODO: Test sharing credentials with frontend
  });
});

// NOTE: Commands left to test
const allowedPopupCommands = [
  "denyCredentials",
  "confirmShareCredentials",
  "closingHoloShareCredsConfirmationPopup",
];
const allowedWebPageCommands = ["getHoloCredentials", "setHoloCredentials"];
