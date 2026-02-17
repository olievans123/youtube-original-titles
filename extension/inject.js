// Only inject the page script if enabled
chrome.storage.local.get({ enabled: true }, (items) => {
  if (items.enabled) {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("content.js");
    document.documentElement.appendChild(s);
  }
});
