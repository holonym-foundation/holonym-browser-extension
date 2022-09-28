/**
 * Wrapper for chrome.runtime.sendMessage. Timeout after 5 seconds
 * @param {Puppeteer.Page} page The page from which the message is sent
 * @param {string} extensionId The extension to which the message is sent
 * @param {Object} payload
 */
export async function sendMessage(page, extensionId, payload) {
  return new Promise(async (resolve, reject) => {
    setTimeout(() => {
      reject();
    }, 5000);
    const result = await page.evaluate(
      (extensionId, payload) => {
        return new Promise((resolve) => {
          const callback = (resp) => {
            console.log(resp);
            resolve(resp);
          };
          window.chrome.runtime.sendMessage(extensionId, payload, callback);
        });
      },
      extensionId,
      payload
    );
    resolve(result);
  });
}
