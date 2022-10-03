import { expect } from "chai";
import { encrypt, initialize, sleep } from "./utils/utils.js";

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
        const tempCryptoController = new CryptoController();
        await tempCryptoController.setKeyPair("", "");
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

  describe("hashPassword", async () => {
    it("Should return false if the user does not have a public key", async () => {
      const testPassword = "test-password";
      const testSalt = "test-salt";
      const retrievedPassword = await serviceWorker.evaluate(
        async (password, salt) => {
          const tempCryptoController = new CryptoController();
          return await tempCryptoController.hashPassword(password, salt);
        },
        testPassword,
        testSalt
      );
      expect(retrievedPassword).to.be.a("string");
      expect(retrievedPassword.length).to.be.above(0);
      expect(retrievedPassword).to.not.equal(testPassword);
    });
  });

  describe("createPassword", async () => {
    it("Should generate a salt, store the salt, and store a hash of salt + password", async () => {
      await serviceWorker.evaluate(async () => {
        // Reset password salt
        const tempCryptoController = new CryptoController();
        await tempCryptoController.setPasswordSalt("");
      });
      const testPassword = "test-password";
      const retrievedValues = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.createPassword(password);
        const tempSalt = await tempCryptoController.getPasswordSalt();
        const tempPasswordHash = await tempCryptoController.getPasswordHash();
        return { salt: tempSalt, passwordHash: tempPasswordHash };
      }, testPassword);
      expect(retrievedValues.salt).to.be.a("string");
      expect(retrievedValues.salt.length).to.equal(36);
      expect(retrievedValues.passwordHash).to.be.a("string");
      expect(retrievedValues.passwordHash.length).to.be.above(0);
      expect(retrievedValues.passwordHash).to.not.equal(testPassword);
      const passwordHash = await serviceWorker.evaluate(
        async (password, salt) => {
          const tempCryptoController = new CryptoController();
          return await tempCryptoController.hashPassword(password, salt);
        },
        testPassword,
        retrievedValues.salt
      );
      expect(passwordHash).to.equal(retrievedValues.passwordHash);
    });
  });

  describe("changePassword", async () => {
    it("Should change stored password hash and allow the user to login with the new password", async () => {
      const oldPassword = "old-password";
      const newPassword = "new-password";
      const oldPasswordHash = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.createPassword(password);
        return await tempCryptoController.getPasswordHash();
      }, oldPassword);
      const retrievedValues = await serviceWorker.evaluate(
        async (oldPassword, newPassword) => {
          const tempCryptoController = new CryptoController();
          const success = await tempCryptoController.changePassword(
            oldPassword,
            newPassword
          );
          const passwordHash = await tempCryptoController.getPasswordHash();
          return {
            success: success,
            passwordHash: passwordHash,
          };
        },
        oldPassword,
        newPassword
      );
      expect(retrievedValues.success).to.equal(true);
      expect(retrievedValues.passwordHash).to.be.a("string");
      expect(retrievedValues.passwordHash.length).to.be.above(0);
      expect(retrievedValues.passwordHash).to.not.equal(oldPasswordHash);
    });
    // TODO: Fail case
  });

  describe("generateKeyPair", async () => {
    it("Should generate a keypair, encrypt the private key with the password, and store the keypair", async () => {
      // Get key pair before to compare
      const keyPairBefore = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        return await tempCryptoController.getKeyPair();
      });
      // Generate keyPair
      const testPassword = "test-password";
      const retrievedKeyPair = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        tempCryptoController.store.password = password; // Ensure password is set
        await tempCryptoController.generateKeyPair();
        return await tempCryptoController.getKeyPair();
      }, testPassword);
      expect(retrievedKeyPair).to.be.an("object");
      expect(Object.keys(retrievedKeyPair)).to.include.members([
        "encryptedPrivateKey",
        "publicKey",
      ]);
      expect(retrievedKeyPair).to.deep.not.equal(keyPairBefore);
      // Encrypt with public key
      const testMessage = "test-message";
      const encryptedMessage = await serviceWorker.evaluate(
        async (publicKey, message) => {
          const tempCryptoController = new CryptoController();
          return await tempCryptoController.encrypt(publicKey, message);
        },
        retrievedKeyPair.publicKey,
        testMessage
      );
      expect(encryptedMessage).to.be.a("string");
      expect(encryptedMessage).to.not.equal(testMessage);
      // Decrypt with private key
      const decryptedMessage = await serviceWorker.evaluate(
        async (encryptedPrivateKey, password, encryptedMessage) => {
          const tempCryptoController = new CryptoController();
          tempCryptoController.store.password = password;
          const privateKey = await tempCryptoController.decryptWithPassword(
            encryptedPrivateKey
          );
          tempCryptoController.store.decryptedPrivateKey = privateKey;
          return await tempCryptoController.decryptWithPrivateKey(encryptedMessage);
        },
        retrievedKeyPair.encryptedPrivateKey,
        testPassword,
        encryptedMessage
      );
      expect(decryptedMessage).to.equal(testMessage);
    });
  });

  describe("login", async () => {
    it("Should set isLoggedIn, set decryptedPrivateKey, and return true, given correct password", async () => {
      const testPassword = "this-is-the-password";
      await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.initialize(password);
        tempCryptoController.isLoggedIn = false;
        tempCryptoController.store.decryptedPrivateKey = undefined;
        tempCryptoController.store.password = undefined;
      }, testPassword);
      const retrievedPrivateKey = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        tempCryptoController.store.password = password;
        const keyPair = await tempCryptoController.getKeyPair();
        const privateKey = await tempCryptoController.decryptWithPassword(
          keyPair.encryptedPrivateKey
        );
        tempCryptoController.store.password = undefined;
        return privateKey;
      }, testPassword);
      const retrievedValues = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.login(password);
        return {
          password: tempCryptoController.store.password,
          decryptedPrivateKey: tempCryptoController.store.decryptedPrivateKey,
          isLoggedIn: tempCryptoController.isLoggedIn,
        };
      }, testPassword);
      expect(retrievedValues.password).to.equal(testPassword);
      expect(retrievedValues.decryptedPrivateKey).to.deep.equal(retrievedPrivateKey);
      expect(retrievedValues.isLoggedIn).to.equal(true);
    });
  });

  describe("logout", async () => {
    it("Should set isLoggedIn to false, decryptedPrivateKey to undefined, and password to false", async () => {
      const testPassword = "this-is-the-password";
      const beforeValues = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.initialize(password);
        return {
          password: tempCryptoController.store.password,
          decryptedPrivateKey: tempCryptoController.store.decryptedPrivateKey,
          isLoggedIn: tempCryptoController.isLoggedIn,
        };
      }, testPassword);
      expect(beforeValues.password).to.not.equal(undefined);
      expect(beforeValues.decryptedPrivateKey).to.not.equal(undefined);
      expect(beforeValues.isLoggedIn).to.equal(true);
      const afterValues = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.logout();
        return {
          password: tempCryptoController.store.password,
          decryptedPrivateKey: tempCryptoController.store.decryptedPrivateKey,
          isLoggedIn: tempCryptoController.isLoggedIn,
        };
      }, testPassword);
      expect(afterValues.password).to.equal(undefined);
      expect(afterValues.decryptedPrivateKey).to.equal(undefined);
      expect(afterValues.isLoggedIn).to.equal(false);
    });
  });
});
