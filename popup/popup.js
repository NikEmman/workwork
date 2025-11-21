// popup.js

document.getElementById("start").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 1. Inject the real script tag
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const existing = document.getElementById("death-registry-injected");
      if (existing) existing.remove();

      const script = document.createElement("script");
      script.id = "death-registry-injected";
      script.src = chrome.runtime.getURL("injected.js");
      (document.head || document.documentElement).appendChild(script);
    },
  });

  // 2. Listen for results
  const listener = (message) => {
    if (message.type === "automation-results") {
      const results = message.results;

      // Create & download CSV
      let csv = "ΑΔΤ,Επώνυμο,Όνομα,Κατάσταση\n";
      results.forEach((r) => {
        if (r.success) {
          csv += `${r.id},${r.data.surname},${r.data.firstName},ΕΠΙΤΥΧΙΑ\n`;
        } else {
          csv += `${r.id},,,ΑΠΟΤΥΧΙΑ - ${r.error}\n`;
        }
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();

      chrome.runtime.onMessage.removeListener(listener);
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  // 3. Bridge: forward the DOM event to background → popup
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      window.addEventListener("death-automation-finished", (e) => {
        chrome.runtime.sendMessage({
          type: "automation-results",
          results: e.detail,
        });
      });
    },
  });
});
