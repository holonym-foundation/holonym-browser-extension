import { expect } from "chai";
import { initialize, sleep } from "./utils/utils.js";

// NOTE: Sometimes the following error is thrown:
// "Evaluation failed: ReferenceError: CryptoController is not defined"
// Just re-run if this happens.
describe.only("CryptoController", async () => {
  let browser;
  let serviceWorker;
  let extensionId;

  before(async () => {
    const initVals = await initialize();
    browser = initVals.browser;
    extensionId = initVals.extensionId;
    serviceWorker = initVals.serviceWorker;
  });

  after(async () => {
    browser.close();
  });

  describe("setKeyPair", async () => {
    it("Should set the holoKeyPair.encryptedPrivateKey and holoKeyPair.publicKey properties in chrome.storage.local", async () => {
      const encryptedPrivateKey = "privateKey";
      const publicKey = "publicKey";
      await serviceWorker.evaluate(
        async (encryptedPrivateKey, publicKey) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.setKeyPair(encryptedPrivateKey, publicKey);
        },
        encryptedPrivateKey,
        publicKey
      );
      await sleep(25);
      const keyPair = await serviceWorker.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(["holoKeyPair"], (result) =>
            resolve(result?.holoKeyPair)
          );
        });
      });
      expect(keyPair.encryptedPrivateKey).to.equal(encryptedPrivateKey);
      expect(keyPair.publicKey).to.equal(publicKey);
    });
  });

  describe("getKeyPair", async () => {
    it("Should return a value equal to the value of the holoKeyPair property in chrome.storage.local", async () => {
      const testKeyPair = { encryptedPrivateKey: "rando1", publicKey: "rando2" };
      await serviceWorker.evaluate(
        async (keyPair) => chrome.storage.local.set({ holoKeyPair: keyPair }),
        testKeyPair
      );
      await sleep(25);
      const retrievedKeyPair = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getKeyPair();
      });
      expect(retrievedKeyPair).to.deep.equal(testKeyPair);
    });

    it("Should return an object containing the most recent values passed to setKeyPair", async () => {
      const encryptedPrivateKey = "privateKey1";
      const publicKey = "publicKey2";
      await serviceWorker.evaluate(
        async (encryptedPrivateKey, publicKey) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.setKeyPair(encryptedPrivateKey, publicKey);
        },
        encryptedPrivateKey,
        publicKey
      );
      await sleep(25);
      const retrievedKeyPair = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getKeyPair();
      });
      expect(retrievedKeyPair.encryptedPrivateKey).to.equal(encryptedPrivateKey);
      expect(retrievedKeyPair.publicKey).to.equal(publicKey);
    });
  });
});
