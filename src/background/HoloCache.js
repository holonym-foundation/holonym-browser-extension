async function setChromeStorageSessionItem(value) {
  return new Promise((resolve) => {
    chrome.storage.session.set(value, () => resolve(true));
  });
}

async function getChromeStorageSessionItem(key) {
  return new Promise((resolve) => {
    chrome.storage.session.get([key], (result) => {
      resolve(result?.[key]);
    });
  });
}

class HoloCache {
  static setConfirmCredentials(value) {
    return setChromeStorageSessionItem({ confirmCredentials: value });
  }
  static getConfirmCredentials() {
    return getChromeStorageSessionItem("confirmCredentials");
  }

  static setConfirmShareCredentials(value) {
    return setChromeStorageSessionItem({ confirmShareCredentials: value });
  }
  static getConfirmShareCredentials() {
    return getChromeStorageSessionItem("confirmShareCredentials");
  }

  static setCredentialsConfirmationPopupIsOpen(value) {
    return setChromeStorageSessionItem({ credentialsConfirmationPopupIsOpen: value });
  }
  static getCredentialsConfirmationPopupIsOpen() {
    return getChromeStorageSessionItem("credentialsConfirmationPopupIsOpen");
  }

  static setShareCredsConfirmationPopupIsOpen(value) {
    return setChromeStorageSessionItem({ shareCredsConfirmationPopupIsOpen: value });
  }
  static getShareCredsConfirmationPopupIsOpen() {
    return getChromeStorageSessionItem("shareCredsConfirmationPopupIsOpen");
  }
}

export default HoloCache;
