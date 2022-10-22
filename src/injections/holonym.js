// Inject holonym object into window object
const extensionId = process.env.EXTENSION_ID;

window.holonym = {
  getHoloPublicKey: async () => {
    return new Promise((resolve) => {
      const message = { command: "getHoloPublicKey" };
      chrome.runtime.sendMessage(extensionId, message, (resp) => {
        resolve(resp);
      });
    });
  },
};
