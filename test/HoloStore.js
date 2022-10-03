import { expect } from "chai";
import { initialize, sleep } from "./utils/utils.js";

// NOTE: Sometimes the following error is thrown:
// "Evaluation failed: ReferenceError: HoloStore is not defined"
// Just re-run if this happens.
describe("HoloStore", async () => {
  let browser;
  let serviceWorker;
  let extensionId;

  before(async () => {
    const initVals = await initialize();
    browser = initVals.browser;
    extensionId = initVals.extensionId;
    serviceWorker = initVals.serviceWorker;
    await sleep(300); // Seems to reduce ReferenceErrors
  });

  after(async () => {
    browser.close();
  });

  describe("setLatestMessage", async () => {
    it("Should set the latestHoloMessage property in chrome.storage.local", async () => {
      const testMessage = "test-message1";
      await serviceWorker.evaluate(async (testMessage) => {
        const tempHoloStore = new HoloStore();
        await tempHoloStore.setLatestMessage(testMessage);
      }, testMessage);
      await sleep(25);
      const latestMessage = await serviceWorker.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(["latestHoloMessage"], (result) => {
            resolve(result?.latestHoloMessage);
          });
        });
      });
      expect(latestMessage).to.equal(testMessage);
    });
  });

  describe("getLatestMessage", async () => {
    it("Should return a value equal to the value of the latestHoloMessage property in chrome.storage.local", async () => {
      const testMessage = "test-message2";
      await serviceWorker.evaluate(
        (testMessage) => chrome.storage.local.set({ latestHoloMessage: testMessage }),
        testMessage
      );
      await sleep(25);
      const latestMessage = await serviceWorker.evaluate(async () => {
        const tempHoloStore = new HoloStore();
        return await tempHoloStore.getLatestMessage();
      });
      await sleep(25);
      expect(latestMessage).to.equal(testMessage);
    });

    it("Should return the most recent value passed to setLatestMessage", async () => {
      const testMessage = "test-message3";
      await serviceWorker.evaluate(async (testMessage) => {
        const tempHoloStore = new HoloStore();
        await tempHoloStore.setLatestMessage(testMessage);
      }, testMessage);
      await sleep(25);
      const latestMessage = await serviceWorker.evaluate(async () => {
        const tempHoloStore = new HoloStore();
        return await tempHoloStore.getLatestMessage();
      });
      await sleep(25);
      expect(latestMessage).to.equal(testMessage);
    });
  });
});
