// injected.js — runs as real <script> inside the government page → cookies work 100%

(async () => {
  const idNumbers = [
    {
      number: "AH723321",
      dateOfDeath: "18/10/1980",
      dateOfDispatch: "20/11/2025",
    },
    {
      number: "AO323256",
      dateOfDeath: "01/05/2020",
      dateOfDispatch: "20/11/2025",
    },
    {
      number: "AO323257",
      dateOfDeath: "11/11/2024",
      dateOfDispatch: "20/11/2025",
    },
    // add more here if you want
  ];

  const allResults = [];

  // ====================== ALL YOUR HELPERS (exactly as before) ======================

  const waitForResults = () => {
    return new Promise((resolve, reject) => {
      const pollInterval = 200; // Check every 200ms
      const maxAttempts = 40; // Total ~8s of polling
      let attempts = 0;
      const checkForResults = () => {
        const container = document.querySelector(".xdq");
        if (container) {
          // Quick validation: Ensure it has some text content loaded
          const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          let hasText = false;
          let node;
          while ((node = walker.nextNode()) && !hasText) {
            const text = node.textContent.replace(/\s+/g, " ").trim();
            if (text.length > 0 && text !== "▼" && !text.startsWith("Σφάλμα")) {
              hasText = true;
            }
          }
          if (hasText) {
            // Full extraction
            const texts = [];
            const fullWalker = document.createTreeWalker(
              container,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            let fullNode;
            while ((fullNode = fullWalker.nextNode())) {
              const text = fullNode.textContent.replace(/\s+/g, " ").trim();
              // Skip empties, arrows, and short numerics to reduce noise
              if (
                text.length > 0 &&
                text !== "▼" &&
                !/^\d{1,3}$/.test(text) // e.g., skip standalone "44"
              ) {
                texts.push(text);
              }
            }
            const obj = {};

            for (let i = 0; i < texts.length; i++) {
              const key = texts[i];
              const value = texts[(i + 1) % texts.length]; // wraparound for last element

              // Only add if key doesn't already exist
              if (key && value && obj[key] == null) {
                obj[key] = value;
              }
            }

            // Helper to get value or empty string
            const getValue = (key) => obj[key] || "";
            const fields = {
              surname: getValue("Επώνυμο"),
              firstName: getValue("Όνομα"),
            };
            resolve(fields); // Resolve directly with structured fields (or obj if preferred)
          } else {
            // Container exists but no text yet—keep polling
            if (attempts >= maxAttempts) {
              reject(new Error("Timeout: Container found but no text loaded"));
            } else {
              attempts++;
              setTimeout(checkForResults, pollInterval);
            }
          }
        } else if (attempts >= maxAttempts) {
          reject(new Error("Timeout waiting for container"));
        } else {
          attempts++;
          setTimeout(checkForResults, pollInterval);
        }
      };
      checkForResults();
    });
  };

  const waitAndClickChangeLink = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        const link = Array.from(document.querySelectorAll("a.xi")).find(
          (a) => a.textContent.trim() === "Καταχώριση Μεταβολής"
        );
        if (link) {
          link.click();
          setTimeout(resolve, 2300);
        } else if (attempts++ > 20) {
          reject(new Error("Καταχώριση Μεταβολής link not found"));
        } else {
          setTimeout(check, 200);
        }
      };
      check();
    });
  };

  const waitAndClickRadio = () =>
    new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        const radio = document.getElementById("type:0");
        if (radio) {
          radio.click();
          setTimeout(resolve, 2300);
        } else if (attempts++ > 20) reject(new Error("Radio type:0 not found"));
        else setTimeout(check, 200);
      };
      check();
    });

  const waitAndSelectOption = () =>
    new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        const select = document.getElementById("identityFlag");
        if (select) {
          select.value = "9";
          select.dispatchEvent(new Event("change", { bubbles: true }));
          setTimeout(resolve, 2300);
        } else if (attempts++ > 20)
          reject(new Error("identityFlag select not found"));
        else setTimeout(check, 200);
      };
      check();
    });

  const waitAndClickUpdateButton = (id) =>
    new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        const btn = document.getElementById("updateButton");
        if (
          btn &&
          btn.textContent.trim().replace(/\s+/g, " ") ===
            "Αποθήκευση Μεταβολής ΘΑΝΑΤΟΣ"
        ) {
          const dateDispatch = document.querySelector(
            'input[name$="arPrakshs"]'
          );
          const dateEvent = document.querySelector('input[name$="hmersymb"]');

          if (dateDispatch) dateDispatch.value = id.dateOfDispatch;
          if (dateEvent) dateEvent.value = id.dateOfDeath;

          setTimeout(() => {
            btn.click();
            setTimeout(resolve, 3000); // λίγο παραπάνω χρόνο για την αποθήκευση
          }, 600);
        } else if (attempts++ > 30) {
          reject(new Error("Update button not ready or wrong text"));
        } else {
          setTimeout(check, 200);
        }
      };
      check();
    });

  // ====================== MAIN LOOP ======================

  for (const id of idNumbers) {
    console.log(`Processing ${id.number}`);

    try {
      const input = document.querySelector('input[name$="adt_qs"]');
      const searchBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent.trim() === "Αναζήτηση"
      );

      if (!input || !searchBtn) throw new Error("Search elements not found");

      input.value = id.number;
      searchBtn.click();

      await new Promise((r) => setTimeout(r, 2300)); // server delay

      const personalData = await waitForResults();

      allResults.push({
        id: id.number,
        success: true,
        data: personalData,
      });

      await waitAndClickChangeLink();
      await waitAndClickRadio();
      await waitAndSelectOption();
      await waitAndClickUpdateButton(id);

      console.log(
        `✓ Success for ${id.number}: ${personalData.surname} ${personalData.firstName}`
      );

      // small pause before next person
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      allResults.push({
        id: id.number,
        success: false,
        error: err.message,
      });
      console.error(`✗ Failed ${id.number}:`, err.message);
    }
  }

  window.dispatchEvent(
    new CustomEvent("death-automation-finished", {
      detail: allResults,
    })
  );
})();
