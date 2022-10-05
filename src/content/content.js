// The following is included so that the background script does not terminate after 5 min
let port;
function connect() {
  port = chrome.runtime.connect({ name: "persistence" });
  port.onDisconnect.addListener(connect);
  port.onMessage.addListener((msg) => {
    // console.log("received", msg, "from bg");
  });
}
connect();
