// popup.js
const idNumbers = [
  {
    number: "ΑΗ723321",
    dateOfDeath: "18/10/1980",
    dateOfDispatch: "20/11/2025",
  },
  {
    number: "ΑΟ323256",
    dateOfDeath: "01/05/2020",
    dateOfDispatch: "20/11/2025",
  },
  {
    number: "ΑΟ323257",
    dateOfDeath: "11/11/2024",
    dateOfDispatch: "20/11/2025",
  },
];

let currentTabId = null;

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;
  return tab;
}

async function execute(fn, args = []) {
  return chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: fn,
    args: args,
  });
}

// Step 1: Search for ID
async function searchById(idObj) {
  await execute(
    function (id) {
      const input = document.querySelector('input[name$="adt_qs"]');
      const buttons = document.querySelectorAll("button");
      const searchBtn = Array.from(buttons).find(
        (btn) => btn.textContent.trim() === "Αναζήτηση"
      );

      if (!input || !searchBtn) {
        throw new Error("Search input or button not found");
      }

      input.value = id;
      searchBtn.click();
    },
    [idObj.number]
  );

  // Wait for results page to load
  await new Promise((r) => setTimeout(r, 2800));
}

// Step 2: Extract person data from results
// Step 2: Extract person data — USING YOUR ORIGINAL PROVEN LOGIC
async function extractPersonData() {
  const [result] = await execute(function () {
    return new Promise((resolve, reject) => {
      const pollInterval = 200;
      const maxAttempts = 50; // ~10 seconds max
      let attempts = 0;

      const check = () => {
        const container = document.querySelector(".xdq");
        if (!container) {
          if (attempts >= maxAttempts)
            reject(new Error("No .xdq container found"));
          else {
            attempts++;
            setTimeout(check, pollInterval);
          }
          return;
        }

        // Quick check if real content exists
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT
        );
        let hasRealText = false;
        let node;
        while ((node = walker.nextNode()) && !hasRealText) {
          const text = node.textContent.replace(/\s+/g, " ").trim();
          if (text && text !== "▼" && !text.startsWith("Σφάλμα")) {
            hasRealText = true;
          }
        }

        if (!hasRealText) {
          if (attempts >= maxAttempts) {
            reject(new Error("Container found but no valid text loaded"));
          } else {
            attempts++;
            setTimeout(check, pollInterval);
          }
          return;
        }

        // FULL EXTRACTION — your exact working code
        const texts = [];
        const fullWalker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT
        );
        let fullNode;
        while ((fullNode = fullWalker.nextNode())) {
          const text = fullNode.textContent.replace(/\s+/g, " ").trim();
          if (
            text &&
            text !== "▼" &&
            !/^\d{1,3}$/.test(text) &&
            !text.startsWith("Σφάλμα")
          ) {
            texts.push(text);
          }
        }

        // Build object with wrap-around fallback (your genius trick)
        const obj = {};
        for (let i = 0; i < texts.length; i++) {
          const key = texts[i];
          const value = texts[(i + 1) % texts.length];
          if (key && value && obj[key] == null) {
            obj[key] = value;
          }
        }

        const getValue = (k) => obj[k] || "";
        const fields = {
          surname: getValue("Επώνυμο"),
          firstName: getValue("Όνομα"),
          fatherName: getValue("Όνομα Πατρός"),
          motherName: getValue("Όνομα Μητρός"),
          birthDate: getValue("Ημ/νία Γέννησης"),
        };

        // Final sanity check
        if (!fields.surname && !fields.firstName) {
          reject(new Error("Name fields empty – possible parsing issue"));
        } else {
          resolve({
            success: true,
            surname: fields.surname.trim(),
            firstName: fields.firstName.trim(),
            fatherName: fields.fatherName.trim(),
            motherName: fields.motherName.trim(),
            birthDate: fields.birthDate.trim(),
          });
        }
      };

      check();
    });
  });

  if (!result.result || !result.result.success) {
    throw new Error(result.result?.error || "Failed to extract data");
  }

  return result.result;
}

// Step 3: Click "Καταχώριση Μεταβολής"
async function clickChangeLink() {
  await execute(function () {
    const links = document.querySelectorAll("a.xi");
    const target = Array.from(links).find(
      (l) => l.textContent.trim() === "Καταχώριση Μεταβολής"
    );
    if (!target) throw new Error("Link 'Καταχώριση Μεταβολής' not found");
    target.click();
  });

  await new Promise((r) => setTimeout(r, 2800)); // wait for page3.html
}

// Step 4: Select death radio button
async function selectDeathRadio() {
  await execute(function () {
    const radio = document.getElementById("type:0");
    if (!radio) throw new Error("Radio button type:0 not found");
    radio.click();
  });

  await new Promise((r) => setTimeout(r, 2800)); // wait for page4.html
}

// Step 5: Select identityFlag = 9
async function selectIdentityFlag() {
  await execute(function () {
    const select = document.getElementById("identityFlag");
    if (!select) throw new Error("Select identityFlag not found");
    select.value = "9";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await new Promise((r) => setTimeout(r, 2800)); // wait for page5.html
}

// Step 6: Fill dates and submit death registration
async function submitDeathRegistration(idObj) {
  await execute(
    function (data) {
      const dispatchInput = document.querySelector('input[name$="arPrakshs"]');
      const deathInput = document.querySelector('input[name$="hmersymb"]');
      const button = document.getElementById("updateButton");

      if (!button || !dispatchInput || !deathInput) {
        throw new Error("Required elements not found on final page");
      }

      const expectedText = "Αποθήκευση Μεταβολής ΘΑΝΑΤΟΣ";
      if (button.textContent.trim().replace(/\s+/g, " ") !== expectedText) {
        throw new Error(`Button text mismatch: "${button.textContent.trim()}"`);
      }

      dispatchInput.value = data.dateOfDispatch;
      deathInput.value = data.dateOfDeath;

      setTimeout(() => button.click(), 500);
    },
    [idObj]
  );

  await new Promise((r) => setTimeout(r, 3500)); // final submission delay
}

// Main workflow
document.getElementById("start").addEventListener("click", async () => {
  try {
    await getCurrentTab();
    const results = [];

    for (const [index, id] of idNumbers.entries()) {
      console.log(`Processing ${index + 1}/${idNumbers.length}: ${id.number}`);

      try {
        await searchById(id);
        const personData = await extractPersonData();

        if (!personData.success) throw new Error(personData.error);

        await clickChangeLink();
        await selectDeathRadio();
        await selectIdentityFlag();
        await submitDeathRegistration(id);

        results.push({
          id: id.number,
          success: true,
          surname: personData.surname,
          firstName: personData.firstName,
          fatherName: personData.fatherName,
          motherName: personData.motherName,
          birthDate: personData.birthDate,
        });
      } catch (err) {
        results.push({
          id: id.number,
          success: false,
          error: err.message,
        });
        console.error(`Failed: ${id.number} →`, err.message);
      }

      // Small delay between records (be gentle to server)
      if (index < idNumbers.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    downloadCSV(results);
    alert(
      `Completed! ${results.filter((r) => r.success).length}/${
        results.length
      } successful`
    );
  } catch (err) {
    console.error("Fatal error:", err);
    alert("Error: " + err.message);
  }
});

function downloadCSV(results) {
  const successful = results.filter((r) => r.success);
  const rows = [
    ["ID", "Επώνυμο", "Όνομα", "Πατρώνυμο", "Μητρώνυμο", "Γεννηση"].join(","),
    ...successful.map((r) =>
      [
        r.id,
        r.surname,
        r.firstName,
        r.fatherName,
        r.motherName,
        r.birthDate,
      ].join(",")
    ),
  ];

  const csv = rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `data.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
