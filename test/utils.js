/**
 * Wrapper for chrome.runtime.sendMessage. Timeout after 5 seconds
 * @param {Puppeteer.Page} page
 * @param {string} extensionId
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
