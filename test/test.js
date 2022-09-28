import { fileURLToPath } from "url";
import { dirname } from "path";
import puppeteer from "puppeteer";
// import assert from "assert";
import chai from "chai";
import { sendMessage, encrypt } from "./utils.js";

const { expect } = chai;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = `${__dirname}/../dist`;

// NOTE: frontendUrl must be either "https://app.holonym.id" or "http://localhost:3002"
// Use "http://localhost:3002" if testing without internet connection
const frontendUrl = "https://app.holonym.id";

async function initialize() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: [
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

async function test() {
  // const browser = await puppeteer.launch({
  //   // headless: "chrome",
  //   headless: false,
  //   devtools: devtools,
  //   args: [
  //     `--disable-extensions-except=${pathToExtension}`,
  //     `--load-extension=${pathToExtension}`,
  //   ],
  //   ...(slowMo && { slowMo }),
  // });
  // console.log(`browser...`);
  // console.log(browser);

  // const appPage = await browser.newPage();
  // // await appPage.goto('https://www.google.com', { waitUntil: "load" });

  // const serviceWorkerTarget = await browser.waitForTarget(
  //   (target) => target.type() === "service_worker"
  // );
  // const extensionId = serviceWorkerTarget.url().split("://")[1].split("/")[0];

  const { browser, serviceWorkerTarget, extensionId } = await initialize();

  const extPage = await browser.newPage();
  const defaultPopupUrl = `chrome-extension://${extensionId}/default_popup.html`;
  await extPage.goto(defaultPopupUrl, { waitUntil: "networkidle0" });
  await extPage.bringToFront();
  const initAccForm = await extPage.$("#initialize-account-form");
  // const passwordInput = await extPage.$("#initialize-account-form");
  // const passwordInput = await extPage.$("#login-form");
  console.log("initAccForm");
  console.log(initAccForm);
  const pwInput = await initAccForm.$(".text-field");
  await pwInput.type("thithithareallylongpathword$%$747$*227738");
  console.log("pwInput");
  console.log(pwInput.asElement());

  const serviceWorker = await serviceWorkerTarget.worker();
  // Test the serviceWorker page as you would any other page.
  const func = "() => console.log(popupOrigin)";
  // console.log("serviceWorker.evaluate(func)...");
  // console.log(await serviceWorker.evaluate(func));

  const otherPage = await browser.waitForTarget((target) => target.type() === "page");
  // console.log("otherPage...");
  // console.log(otherPage);
  // console.log("otherPage.page()...");
  // console.log(await otherPage.page());

  await browser.close();
}

async function holoGetIsRegistered() {
  const { browser, serviceWorkerTarget, extensionId } = await initialize();
  const serviceWorker = await serviceWorkerTarget.worker();

  const extPage = await browser.newPage();
  const defaultPopupUrl = `chrome-extension://${extensionId}/default_popup.html`;
  await extPage.goto(defaultPopupUrl, { waitUntil: "networkidle0" });
  await extPage.bringToFront();
  const windowKeys = JSON.parse(
    await extPage.evaluate(() => JSON.stringify(Object.keys(window.chrome.runtime)))
  );
  // console.log("windowKeys...");
  // for (const key of windowKeys) {
  //   console.log(key);
  // }

  const payload = {
    command: "holoGetIsRegistered",
  };
  const result = await sendMessage(extPage, extensionId, payload);
  console.log("result...");
  console.log(result);
  // assert.equal(result.isRegistered, false);

  // const initAccForm = await extPage.$("#initialize-account-form");
  // const pwInput = await initAccForm.$(".text-field");
  // await pwInput.type("thithithareallylongpathword$%$747$*227738");
  // const submitBtn = await initAccForm.$(".x-button");
  // await submitBtn.click();
  // const submitBtnText = await submitBtn.evaluate((e) => e.innerText);
  // console.log(`submitBtnText... ${submitBtnText}`);

  await browser.close();
}

// test();
// holoGetIsRegistered();

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

  const validPassword = "thithithareallylongpathword$%$747$*227738";

  before(async () => {
    const initVals = await initialize();
    browser = initVals.browser;
    serviceWorkerTarget = initVals.serviceWorkerTarget;
    extensionId = initVals.extensionId;
    defaultPopupPage = await browser.newPage();
    const defaultPopupUrl = `chrome-extension://${extensionId}/default_popup.html`;
    await defaultPopupPage.goto(defaultPopupUrl, { waitUntil: "networkidle0" });
    await defaultPopupPage.bringToFront();
  });

  after(async () => {
    browser.close();
  });

  describe("Atomic messages from popup to service worker", async () => {
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
    let frontendPage;

    before(async () => {
      frontendPage = await browser.newPage();
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

  const allowedPopupCommands = [
    "getHoloLatestMessage",
    "getHoloCredentials",
    "confirmCredentials",
    "denyCredentials",
    "confirmShareCredentials",
    "closingHoloCredentialsConfirmationPopup",
    "closingHoloShareCredsConfirmationPopup",
  ];

  const allowedWebPageCommands = ["getHoloCredentials", "setHoloCredentials"];

  describe("Interactive messages", async () => {
    describe("getHoloLatestMessage", async () => {
      it("Should fail to login, given an incorrect password", async () => {
        // Test the following flow:
        // frontend sends credentials ->
        // user confirms [or denies] storage of credentials ->
        // chrome storage state changes (both credentials and latest message)
        const nonExtensionPage = await browser.newPage();
        await nonExtensionPage.goto("https://app.holonym.id", {
          waitUntil: "networkidle0",
        });
        await nonExtensionPage.bringToFront();
        const payload = {
          command: "setHoloCredentials",
          credentials: { key: "value" },
        };
        sendMessage(nonExtensionPage, extensionId, payload);
      });
    });
  });
});
