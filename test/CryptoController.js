import { expect } from "chai";
import { initialize, sleep } from "./utils/utils.js";

// NOTE: Sometimes the following error is thrown:
// "Evaluation failed: ReferenceError: CryptoController is not defined"
// Just re-run if this happens.
describe("CryptoController", async () => {
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

  // -------------------------
  // BEGIN getters and setters
  // -------------------------

  describe("setKeyPair", async () => {
    it("Should set the holoKeyPair.encryptedPrivateKey and holoKeyPair.publicKey properties stored in chrome.storage.local", async () => {
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
    it("Should return a value equal to the value of the holoKeyPair property stored in chrome.storage.local", async () => {
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

  describe("getPublicKey", async () => {
    it("Should return the holoKeyPair.publicKey property stored in chrome.storage.local", async () => {
      const testKeyPair = { encryptedPrivateKey: "rando3", publicKey: "rando4" };
      await serviceWorker.evaluate(
        async (keyPair) => chrome.storage.local.set({ holoKeyPair: keyPair }),
        testKeyPair
      );
      await sleep(25);
      const retrievedPublicKey = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getPublicKey();
      });
      expect(retrievedPublicKey).to.equal(testKeyPair.publicKey);
    });

    it("Should return the publicKey property of the return value of getKeyPair", async () => {
      const testKeyPair = { encryptedPrivateKey: "rando5", publicKey: "rando6" };
      await serviceWorker.evaluate(
        async (keyPair) => chrome.storage.local.set({ holoKeyPair: keyPair }),
        testKeyPair
      );
      await sleep(25);
      const retrievedPublicKey = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getPublicKey();
      });
      const retrievedKeyPair = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getKeyPair();
      });
      expect(retrievedKeyPair.publicKey).to.equal(retrievedPublicKey);
    });
  });

  describe("setPasswordHash", async () => {
    it("Should set the holoPasswordHash property stored in chrome.storage.local", async () => {
      const testPassword = "test-password-hash";
      await serviceWorker.evaluate(async (testPassword) => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.setPasswordHash(testPassword);
      }, testPassword);
      await sleep(25);
      const retrievedPasswordHash = await serviceWorker.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(["holoPasswordHash"], (result) =>
            resolve(result?.holoPasswordHash)
          );
        });
      });
      expect(retrievedPasswordHash).to.equal(testPassword);
    });
  });

  describe("getPasswordHash", async () => {
    it("Should return the holoPasswordHash property stored in chrome.storage.local", async () => {
      const testPassword = "test-password-hash1";
      await serviceWorker.evaluate(
        async (testPassword) =>
          chrome.storage.local.set({ holoPasswordHash: testPassword }),
        testPassword
      );
      await sleep(25);
      const retrievedPasswordHash = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getPasswordHash();
      });
      expect(retrievedPasswordHash).to.equal(testPassword);
    });

    it("Should return the most recent value passed to setPasswordHash", async () => {
      const testPassword = "test-password-hash2";
      await serviceWorker.evaluate(async (testPassword) => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.setPasswordHash(testPassword);
      }, testPassword);
      await sleep(25);
      const retrievedPasswordHash = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getPasswordHash();
      });
      expect(retrievedPasswordHash).to.equal(testPassword);
    });
  });

  describe("setPasswordSalt", async () => {
    it("Should set the holoPasswordSalt property stored in chrome.storage.local", async () => {
      const testSalt = "test-salt";
      await serviceWorker.evaluate(async (testSalt) => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.setPasswordSalt(testSalt);
      }, testSalt);
      await sleep(25);
      const retrievedSalt = await serviceWorker.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(["holoPasswordSalt"], (result) =>
            resolve(result?.holoPasswordSalt)
          );
        });
      });
      expect(retrievedSalt).to.equal(testSalt);
    });
  });

  describe("getPasswordSalt", async () => {
    it("Should return the holoPasswordSalt property stored in chrome.storage.local", async () => {
      const testSalt = "test-salt1";
      await serviceWorker.evaluate(
        async (testSalt) => chrome.storage.local.set({ holoPasswordSalt: testSalt }),
        testSalt
      );
      await sleep(25);
      const retrievedSalt = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getPasswordSalt();
      });
      expect(retrievedSalt).to.equal(testSalt);
    });

    it("Should return the most recent value passed to setPasswordHash", async () => {
      const testSalt = "test-salt2";
      await serviceWorker.evaluate(async (testSalt) => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.setPasswordSalt(testSalt);
      }, testSalt);
      await sleep(25);
      const retrievedSalt = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getPasswordSalt();
      });
      expect(retrievedSalt).to.equal(testSalt);
    });
  });

  describe("getIsLoggedIn", async () => {
    it("Should return this.isLoggedIn", async () => {
      let isLoggedInVal = false;
      let retrievedIsLoggedIn = await serviceWorker.evaluate(async (isLoggedInVal) => {
        const tempCryptoController = new CryptoController();
        tempCryptoController.isLoggedIn = isLoggedInVal;
        return await tempCryptoController.getIsLoggedIn();
      }, isLoggedInVal);
      expect(retrievedIsLoggedIn).to.equal(isLoggedInVal);
      isLoggedInVal = true;
      retrievedIsLoggedIn = await serviceWorker.evaluate(async (isLoggedInVal) => {
        const tempCryptoController = new CryptoController();
        tempCryptoController.isLoggedIn = isLoggedInVal;
        return await tempCryptoController.getIsLoggedIn();
      }, isLoggedInVal);
      expect(retrievedIsLoggedIn).to.equal(isLoggedInVal);
    });
  });

  describe("getIsRegistered", async () => {
    it("Should return false if the user does not have a public key", async () => {
      const retrievedIsRegistered = await serviceWorker.evaluate(async () => {
        await new Promise((resolve) =>
          chrome.storage.local.set({ holoKeyPair: {} }, resolve)
        );
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getIsRegistered();
      });
      expect(retrievedIsRegistered).to.equal(false);
    });

    it("Should return true if the user has a public key", async () => {
      const retrievedIsRegistered = await serviceWorker.evaluate(
        async (encryptedPrivateKey, publicKey) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.setKeyPair(encryptedPrivateKey, publicKey);
          return await tempCryptoController.getIsRegistered();
        },
        "privateKey",
        "publicKey"
      );
      expect(retrievedIsRegistered).to.equal(true);
    });
  });

  // -------------------------
  // END getters and setters
  // -------------------------
});
