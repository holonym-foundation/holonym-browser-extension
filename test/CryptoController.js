import { webcrypto } from "crypto";
import { expect } from "chai";
import { encrypt, initialize, sleep } from "./utils/utils.js";

// Max length of encrypt-able string using RSA-OAEP with SHA256 where
// modulusLength == 4096: 446 characters.
const maxEncryptableLength = 446;

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
    await sleep(300); // Seems to reduce ReferenceErrors
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

  describe("getIsLoggedIn", async () => {
    it("Should return the value of the isLoggedIn property stored in chrome.storage.session", async () => {
      let isLoggedInVal = false;
      let retrievedIsLoggedIn = await serviceWorker.evaluate(async (isLoggedInVal) => {
        const tempCryptoController = new CryptoController();
        await new Promise((resolve) =>
          chrome.storage.session.set({ isLoggedIn: isLoggedInVal }, resolve)
        );
        return await tempCryptoController.getIsLoggedIn();
      }, isLoggedInVal);
      expect(retrievedIsLoggedIn).to.equal(isLoggedInVal);
      isLoggedInVal = true;
      retrievedIsLoggedIn = await serviceWorker.evaluate(async (isLoggedInVal) => {
        const tempCryptoController = new CryptoController();
        await new Promise((resolve) =>
          chrome.storage.session.set({ isLoggedIn: isLoggedInVal }, resolve)
        );
        return await tempCryptoController.getIsLoggedIn();
      }, isLoggedInVal);
      expect(retrievedIsLoggedIn).to.equal(isLoggedInVal);
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

    it("Should return false and not modify passwordHash or salt, given an incorrect oldPassword", async () => {
      const validOldPassword = "old-password";
      const invalidOldPassword = "invalid-old-password";
      const newPassword = "new-password";
      const valuesBefore = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.createPassword(password);
        const passwordHash = await tempCryptoController.getPasswordHash();
        const salt = await tempCryptoController.getPasswordSalt();
        return {
          passwordHash: passwordHash,
          salt: salt,
        };
      }, validOldPassword);
      const valuesAfter = await serviceWorker.evaluate(
        async (oldPassword, newPassword) => {
          const tempCryptoController = new CryptoController();
          const success = await tempCryptoController.changePassword(
            oldPassword,
            newPassword
          );
          const passwordHash = await tempCryptoController.getPasswordHash();
          const salt = await tempCryptoController.getPasswordSalt();
          return {
            success: success,
            passwordHash: passwordHash,
            salt: salt,
          };
        },
        invalidOldPassword,
        newPassword
      );
      expect(valuesAfter.success).to.equal(false);
      expect(valuesAfter.passwordHash).to.be.a("string");
      expect(valuesAfter.passwordHash.length).to.be.above(0);
      expect(valuesAfter.passwordHash).to.equal(valuesBefore.passwordHash);
      expect(valuesAfter.salt).to.equal(valuesBefore.salt);
    });
  });

  describe("encryptWithPassword & decryptWithPassword", async () => {
    it("Should encrypt and decrypt a message if user is logged in", async () => {
      const message = { message: "this-is-a-short-message" };
      const password = "test-password";
      const encryptedMessage = await serviceWorker.evaluate(
        async (password, message) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.initialize(password);
          return await tempCryptoController.encryptWithPassword(message);
        },
        password,
        message
      );
      expect(encryptedMessage).to.be.a("string");
      expect(encryptedMessage).to.not.equal(message);
      const decryptedMessage = await serviceWorker.evaluate(
        async (password, message) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.login(password);
          return await tempCryptoController.decryptWithPassword(message);
        },
        password,
        encryptedMessage
      );
      expect(decryptedMessage).to.deep.equal(message);
    });

    it("Should be unable to encrypt and decrypt a message if user is not logged in", async () => {
      const message = { message: "this-is-a-short-message" };
      const validPassword = "test-password";
      const encryptedMessage = await serviceWorker.evaluate(
        async (password, message) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.initialize(password);
          await tempCryptoController.logout();
          return await tempCryptoController.encryptWithPassword(message);
        },
        validPassword,
        message
      );
      expect(encryptedMessage).to.equal(undefined);
      const decryptedMessage = await serviceWorker.evaluate(
        async (password, message) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.initialize(password);
          const encryptedMsg = await tempCryptoController.encryptWithPassword(message);
          await tempCryptoController.logout();
          return await tempCryptoController.decryptWithPassword(encryptedMsg);
        },
        validPassword,
        message
      );
      expect(decryptedMessage).to.equal(undefined);
    });
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
        await tempCryptoController.setIsLoggedInInSession(true); // Ensure user is logged in
        await tempCryptoController.setPasswordInSession(password); // Ensure password is set
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
          await tempCryptoController.setIsLoggedInInSession(true); // Ensure user is logged in
          await tempCryptoController.setPasswordInSession(password); // Ensure password is set
          const privateKey = await tempCryptoController.decryptWithPassword(
            encryptedPrivateKey
          );
          await tempCryptoController.setPrivateKeyInSession(privateKey);
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
        await tempCryptoController.setIsLoggedInInSession(false);
        await tempCryptoController.setPasswordInSession("");
        await tempCryptoController.setPrivateKeyInSession({});
      }, testPassword);
      const retrievedPrivateKey = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.setIsLoggedInInSession(true);
        await tempCryptoController.setPasswordInSession(password);
        const keyPair = await tempCryptoController.getKeyPair();
        const privateKey = await tempCryptoController.decryptWithPassword(
          keyPair.encryptedPrivateKey
        );
        await tempCryptoController.setPasswordInSession(undefined);
        return privateKey;
      }, testPassword);
      const retrievedValues = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.login(password);
        const loggedIn = await tempCryptoController.getIsLoggedInFromSession();
        const storedPassword = await tempCryptoController.getPasswordFromSession();
        const privateKey = await tempCryptoController.getPrivateKeyFromSession();
        return {
          password: storedPassword,
          decryptedPrivateKey: privateKey,
          isLoggedIn: loggedIn,
        };
      }, testPassword);
      expect(retrievedValues.password).to.equal(testPassword);
      expect(retrievedValues.decryptedPrivateKey).to.deep.equal(retrievedPrivateKey);
      expect(retrievedValues.isLoggedIn).to.equal(true);
    });
  });

  describe("logout", async () => {
    it("Should set isLoggedIn to false, privateKey to undefined, and password to false", async () => {
      const testPassword = "this-is-the-password";
      const beforeValues = await serviceWorker.evaluate(async (password) => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.initialize(password);
        const loggedIn = await tempCryptoController.getIsLoggedInFromSession();
        const storedPassword = await tempCryptoController.getPasswordFromSession();
        const privateKey = await tempCryptoController.getPrivateKeyFromSession();
        return {
          password: storedPassword,
          decryptedPrivateKey: privateKey,
          isLoggedIn: loggedIn,
        };
      }, testPassword);
      expect(beforeValues.password).to.not.equal(undefined);
      expect(beforeValues.decryptedPrivateKey).to.not.equal(undefined);
      expect(beforeValues.isLoggedIn).to.equal(true);
      const afterValues = await serviceWorker.evaluate(async () => {
        const tempCryptoController = new CryptoController();
        await tempCryptoController.logout();
        const loggedIn = await tempCryptoController.getIsLoggedInFromSession();
        const storedPassword = await tempCryptoController.getPasswordFromSession();
        const privateKey = await tempCryptoController.getPrivateKeyFromSession();
        return {
          password: storedPassword,
          decryptedPrivateKey: privateKey,
          isLoggedIn: loggedIn,
        };
      }, testPassword);
      expect(afterValues.password).to.equal(undefined);
      expect(afterValues.decryptedPrivateKey).to.equal(undefined);
      expect(afterValues.isLoggedIn).to.equal(false);
    });
  });

  describe("encrypt", async () => {
    it("Should encrypt a message using the given public key", async () => {
      const message = "some-message";
      const algo = {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      };
      const usage = ["encrypt", "decrypt"];
      const keyPair = await webcrypto.subtle.generateKey(algo, true, usage);
      const publicKey = await webcrypto.subtle.exportKey("jwk", keyPair.publicKey);
      // Encrypt
      const encryptedMessage = await serviceWorker.evaluate(
        async (publicKey, message) => {
          const tempCryptoController = new CryptoController();
          return await tempCryptoController.encrypt(publicKey, message);
        },
        publicKey,
        message
      );
      expect(encryptedMessage).to.not.equal(message);
      expect(encryptedMessage).to.be.a("string");
      expect(JSON.parse(encryptedMessage)).to.be.an("array");
      // Decrypt
      const decryptedMessage = new TextDecoder("utf-8").decode(
        await webcrypto.subtle.decrypt(
          { name: "RSA-OAEP" },
          keyPair.privateKey,
          new Uint8Array(JSON.parse(encryptedMessage)).buffer
        )
      );
      expect(decryptedMessage).to.equal(message);
    });
  });

  describe("encryptWithPublicKey & decryptWithPrivateKey", async () => {
    it("Should encrypt and decrypt an un-sharded message if user is logged in", async () => {
      const message = { message: "this-is-a-short-message" };
      const password = "test-password";
      const returnVal = await serviceWorker.evaluate(
        async (password, message) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.initialize(password);
          return await tempCryptoController.encryptWithPublicKey(message);
        },
        password,
        message
      );
      expect(returnVal).to.not.equal(message);
      expect(returnVal).to.be.an("object");
      expect(Object.keys(returnVal)).to.include.members([
        "encryptedMessage",
        "sharded",
      ]);
      expect(returnVal.encryptedMessage.length).to.be.above(0);
      expect(returnVal.sharded).to.equal(false);
      const decryptedMessage = await serviceWorker.evaluate(
        async (password, encryptedMessage) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.login(password);
          return await tempCryptoController.decryptWithPrivateKey(
            encryptedMessage,
            false
          );
        },
        password,
        returnVal.encryptedMessage
      );
      expect(JSON.parse(decryptedMessage)).to.deep.equal(message);
    });

    it("Should encrypt and decrypt a sharded message if user is logged in", async () => {
      const message = {
        message: Array(maxEncryptableLength + 1)
          .fill("a")
          .join(""),
      };
      const password = "test-password";
      const returnVal = await serviceWorker.evaluate(
        async (password, message) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.initialize(password);
          return await tempCryptoController.encryptWithPublicKey(message);
        },
        password,
        message
      );
      expect(returnVal).to.not.equal(message);
      expect(returnVal).to.be.an("object");
      expect(Object.keys(returnVal)).to.include.members([
        "encryptedMessage",
        "sharded",
      ]);
      expect(returnVal.encryptedMessage.length).to.be.above(0);
      expect(returnVal.sharded).to.equal(true);
      const decryptedMessage = await serviceWorker.evaluate(
        async (password, encryptedMessage) => {
          const tempCryptoController = new CryptoController();
          await tempCryptoController.login(password);
          return await tempCryptoController.decryptWithPrivateKey(
            encryptedMessage,
            true
          );
        },
        password,
        returnVal.encryptedMessage
      );
      expect(JSON.parse(decryptedMessage)).to.deep.equal(message);
    });
  });
});
