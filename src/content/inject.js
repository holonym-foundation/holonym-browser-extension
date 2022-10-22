// h.t. to stackbykumbi for their answer here:
// https://stackoverflow.com/questions/67439012/chrome-extension-manifest-v3-content-security-policy

const nullthrows = (v) => {
  if (v == null) throw new Error("it's a null");
  return v;
};

function injectCode(src) {
  const script = document.createElement("script");
  script.src = src;
  script.onload = function () {
    this.remove();
  };
  // This script runs before the <head> element is created,
  // so we add the script to <html> instead.
  nullthrows(document.head || document.documentElement).appendChild(script);
}

const src = chrome.runtime.getURL("./holonym.js");
injectCode(src);
