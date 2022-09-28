import { fileURLToPath } from "url";
import { dirname } from "path";
import puppeteer from "puppeteer";
import assert from "assert";
import { sendMessage } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathToExtension = `${__dirname}/../dist`;

const devtools = false;
const slowMo = false;

async function initialize() {
  const browser = await puppeteer.launch({
    // headless: "chrome",
    headless: false,
    devtools: devtools,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
    ...(slowMo && { slowMo }),
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
  await extPage.goto(defaultPopupUrl, { waitUntil: "networkidle0" }); // waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
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
  await extPage.goto(defaultPopupUrl, { waitUntil: "networkidle0" }); // waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
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
  assert.equal(result.isRegistered, false);

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

const allowedPopupCommands = [
  "holoPopupLogin",
  "getHoloLatestMessage",
  "getHoloCredentials",
  "confirmCredentials",
  "denyCredentials",
  "holoChangePassword",
  "holoInitializeAccount",
  "holoGetIsRegistered",
  "confirmShareCredentials",
  "closingHoloCredentialsConfirmationPopup",
  "closingHoloShareCredsConfirmationPopup",
];

describe("Messages: popup script -> service worker", async () => {
  let browser;
  let serviceWorkerTarget;
  let extensionId;
  let defaultPopupPage;

  before(async () => {
    const initVals = await initialize();
    browser = initVals.browser;
    serviceWorkerTarget = initVals.serviceWorkerTarget;
    extensionId = initVals.extensionId;
    defaultPopupPage = await browser.newPage();
    const defaultPopupUrl = `chrome-extension://${extensionId}/default_popup.html`;
    await defaultPopupPage.goto(defaultPopupUrl, { waitUntil: "networkidle0" }); // waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    await defaultPopupPage.bringToFront();
  });

  after(async () => {
    await browser.close();
  });

  describe("holoGetIsRegistered", async () => {
    it("Should return false before user has registered", async () => {
      const payload = { command: "holoGetIsRegistered" };
      const result = await sendMessage(defaultPopupPage, extensionId, payload);
      assert.equal(result.isRegistered, false);
    });
  });

  describe("holoInitializeAccount", async () => {
    it("Should register the user, given a valid password", async () => {
      // Call holoInitializeAccount
      const payload1 = {
        command: "holoInitializeAccount",
        password: "thithithareallylongpathword$%$747$*227738",
      };
      const result1 = await sendMessage(defaultPopupPage, extensionId, payload1);
      // Check registration status
      const payload2 = { command: "holoGetIsRegistered" };
      const result2 = await sendMessage(defaultPopupPage, extensionId, payload2);
      assert.equal(result2.isRegistered, true);
    });
  });
});
