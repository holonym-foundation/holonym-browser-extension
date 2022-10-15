import { expect } from "chai";
import { initialize, sleep } from "./utils/utils.js";

// NOTE: Sometimes the following error is thrown:
// "Evaluation failed: ReferenceError: HoloStore is not defined"
// Just re-run if this happens.
describe("HoloStore", async () => {
  let browser;
  let serviceWorker;

  before(async () => {
    const initVals = await initialize();
    browser = initVals.browser;
    serviceWorker = initVals.serviceWorker;
    await sleep(300); // Seems to reduce ReferenceErrors
  });

  after(async () => {
    browser.close();
  });

  describe("setStagedCredentials", async () => {
    it("Should set the stagedCredentials property in chrome.storage.local", async () => {
      const stagedCreds = "test-message1";
      await serviceWorker.evaluate(async (stagedCreds) => {
        const tempHoloStore = new HoloStore();
        await tempHoloStore.setStagedCredentials(stagedCreds);
      }, stagedCreds);
      await sleep(25);
      const retrievedStagedCreds = await serviceWorker.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(["stagedCredentials"], (result) => {
            resolve(result?.stagedCredentials);
          });
        });
      });
      expect(retrievedStagedCreds).to.equal(stagedCreds);
    });
  });

  describe("getStagedCredentials", async () => {
    it("Should return a value equal to the value of the stagedCredentials property in chrome.storage.local", async () => {
      const stagedCreds = "test-message2";
      await serviceWorker.evaluate(
        (stagedCreds) => chrome.storage.local.set({ stagedCredentials: stagedCreds }),
        stagedCreds
      );
      await sleep(25);
      const retrievedStagedCreds = await serviceWorker.evaluate(async () => {
        const tempHoloStore = new HoloStore();
        return await tempHoloStore.getStagedCredentials();
      });
      await sleep(25);
      expect(retrievedStagedCreds).to.equal(stagedCreds);
    });

    it("Should return the most recent value passed to setStagedCredentials", async () => {
      const stagedCreds = "test-message3";
      await serviceWorker.evaluate(async (stagedCreds) => {
        const tempHoloStore = new HoloStore();
        await tempHoloStore.setStagedCredentials(stagedCreds);
      }, stagedCreds);
      await sleep(25);
      const retrievedStagedCreds = await serviceWorker.evaluate(async () => {
        const tempHoloStore = new HoloStore();
        return await tempHoloStore.getStagedCredentials();
      });
      await sleep(25);
      expect(retrievedStagedCreds).to.equal(stagedCreds);
    });
  });

  describe("setCredentials", async () => {
    it("Should set the holoCredentials property in chrome.storage.local", async () => {
      const credentials = {
        encryptedCreds: "encrypted-creds",
        unencryptedCreds: "unencrypted-creds",
      };
      const retVal = await serviceWorker.evaluate(async (credentials) => {
        const tempHoloStore = new HoloStore();
        return await tempHoloStore.setCredentials(credentials);
      }, credentials);
      await sleep(25);
      expect(retVal).to.equal(true);
      const retrievedCreds = await serviceWorker.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(["holoCredentials"], (result) => {
            resolve(result?.holoCredentials);
          });
        });
      });
      expect(retrievedCreds).to.equal(credentials.encryptedCreds);
    });
    // TODO: Expect to throw when invalid credentials
  });

  describe("getCredentials", async () => {
    it("Should return a value equal to the value of the holoCredentials property in chrome.storage.local", async () => {
      const credentials = "credentials-xyz";
      await serviceWorker.evaluate(
        (credentials) => chrome.storage.local.set({ holoCredentials: credentials }),
        credentials
      );
      await sleep(25);
      const retrievedCredentials = await serviceWorker.evaluate(async () => {
        const tempHoloStore = new HoloStore();
        return await tempHoloStore.getCredentials();
      });
      await sleep(25);
      expect(retrievedCredentials).to.equal(credentials);
    });

    it("Should return the most recent value passed to setCredentials", async () => {
      const credentials = {
        encryptedCreds: "encrypted-creds-new",
        unencryptedCreds: "unencrypted-creds-new",
      };
      await serviceWorker.evaluate(async (credentials) => {
        const tempHoloStore = new HoloStore();
        await tempHoloStore.setCredentials(credentials);
      }, credentials);
      await sleep(25);
      const retrievedCredentials = await serviceWorker.evaluate(async () => {
        const tempHoloStore = new HoloStore();
        return await tempHoloStore.getCredentials();
      });
      await sleep(25);
      expect(retrievedCredentials).to.equal(credentials.encryptedCreds);
    });
  });
});
