const idNumbers = ["AH023321", "999999", "000000000"];

document.getElementById("start").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (ids) => {
        const allResults = [];

        // Helper function to wait for results
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
                  if (
                    text.length > 0 &&
                    text !== "▼" &&
                    !text.startsWith("Σφάλμα")
                  ) {
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
                    const text = fullNode.textContent
                      .replace(/\s+/g, " ")
                      .trim();
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
                    reject(
                      new Error("Timeout: Container found but no text loaded")
                    );
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
        // Helper function to wait for and click the change link
        // Helper function to wait for and click the change link
        const waitAndClickChangeLink = () => {
          return new Promise((resolve, reject) => {
            const maxAttempts = 20; // ~4s total
            let attempts = 0;
            const pollInterval = 200;

            const checkAndClick = () => {
              // 1. Get ALL links with the 'xi' class
              const allLinks = document.querySelectorAll("a.xi");

              // 2. Find the specific one by its text
              const targetLink = Array.from(allLinks).find(
                (link) => link.textContent.trim() === "Καταχώριση Μεταβολής"
              );

              // 3. Now check if we found the *correct* link
              if (targetLink) {
                console.log("Found and clicking 'Καταχώριση Μεταβολής' link");
                targetLink.click();

                // Wait for the simulated 'page3.html' fetch (2000ms) + buffer
                setTimeout(() => resolve(), 2300);
              } else if (attempts >= maxAttempts) {
                reject(
                  new Error("Timeout waiting for 'Καταχώριση Μεταβολής' link")
                );
              } else {
                // Correct link not found yet, try again
                attempts++;
                setTimeout(checkAndClick, pollInterval);
              }
            };

            checkAndClick();
          });
        };
        //Helper function to wait for radio btn element to appear and click it
        const waitAndClickRadio = () => {
          return new Promise((resolve, reject) => {
            const maxAttempts = 20; // ~4s total
            let attempts = 0;
            const pollInterval = 200; // Poll every 200ms

            const checkAndClick = () => {
              // 1. Find the specific radio button by its ID
              const targetRadio = document.getElementById("type:0");

              // 2. Check if we found the radio button
              if (targetRadio) {
                console.log("Found and clicking radio button 'type:0'");

                // 3. Click the radio button. This will trigger the 'change'
                //    event listener you attached in page3.html.
                targetRadio.click();

                // 4. Wait for the simulated 'page4.html' fetch (2000ms) + buffer
                //    This matches the logic from your example function.
                setTimeout(() => resolve(), 2300);
              } else if (attempts >= maxAttempts) {
                // 5. Reject if we've tried too many times
                reject(new Error("Timeout waiting for radio button 'type:0'"));
              } else {
                // 6. Radio button not found yet, try again
                attempts++;
                setTimeout(checkAndClick, pollInterval);
              }
            };

            // Start the polling
            checkAndClick();
          });
        };
        // Helper function to find the select element, and get option 9
        const waitAndSelectOption = () => {
          return new Promise((resolve, reject) => {
            const maxAttempts = 20; // ~4s total
            let attempts = 0;
            const pollInterval = 200; // Poll every 200ms

            const checkAndSelect = () => {
              // 1. Find the specific select element by its ID
              const targetSelect = document.getElementById("identityFlag");

              // 2. Check if we found the select element
              if (targetSelect) {
                console.log("Found select 'identityFlag'. Setting value to 9.");

                // 3. Set the value of the select element
                targetSelect.value = "9";

                // 4. Manually dispatch a 'change' event. This is critical
                //    to trigger the event listener in page4.html.
                targetSelect.dispatchEvent(
                  new Event("change", { bubbles: true })
                );

                // 5. Wait for the simulated 'page5.html' fetch (2000ms) + buffer
                //    This matches the logic from your other functions.
                setTimeout(() => resolve(), 2300);
              } else if (attempts >= maxAttempts) {
                // 6. Reject if we've tried too many times
                reject(new Error("Timeout waiting for select 'identityFlag'"));
              } else {
                // 7. Select element not found yet, try again
                attempts++;
                setTimeout(checkAndSelect, pollInterval);
              }
            };

            // Start the polling
            checkAndSelect();
          });
        };

        // Helper function to wait and click the submit button
        const waitAndClickUpdateButton = () => {
          return new Promise((resolve, reject) => {
            const maxAttempts = 20; // ~4s total
            let attempts = 0;
            const pollInterval = 200; // Poll every 200ms

            const checkAndClick = () => {
              // 1. Find the specific button element by its ID
              const targetButton = document.getElementById("updateButton");

              // 2. Check if we found the button element
              if (targetButton) {
                // 3. Get the text content and normalize whitespace
                const buttonText = targetButton.textContent
                  .trim()
                  .replace(/\s+/g, " ");
                const expectedText = "Αποθήκευση Μεταβολής ΘΑΝΑΤΟΣ";

                // 4. Check if the text content matches exactly
                if (buttonText === expectedText) {
                  console.log(
                    "Found button 'updateButton' with correct text. Clicking."
                  );

                  // 5. Click the button
                  targetButton.click();

                  // 6. Wait a buffer period for any resulting actions
                  setTimeout(() => resolve(), 2300);
                } else if (attempts >= maxAttempts) {
                  // 7. Reject if we've tried too many times
                  reject(
                    new Error(
                      `Timeout waiting for button 'updateButton' with text "${expectedText}". Found text: "${buttonText}"`
                    )
                  );
                } else {
                  // 8. Button found but text doesn't match yet, try again
                  attempts++;
                  setTimeout(checkAndClick, pollInterval);
                }
              } else if (attempts >= maxAttempts) {
                // 9. Reject if button never appears
                reject(new Error("Timeout waiting for button 'updateButton'"));
              } else {
                // 10. Button not found yet, try again
                attempts++;
                setTimeout(checkAndClick, pollInterval);
              }
            };

            // Start the polling
            checkAndClick();
          });
        };
        // Process each ID
        for (const id of ids) {
          console.log(`Processing ID: ${id}`);

          const input = document.getElementById("t901adt_qs");
          const buttons = document.querySelectorAll("button");
          const searchBtn = Array.from(buttons).find(
            (btn) => btn.textContent.trim() === "Αναζήτηση"
          );

          if (!input || !searchBtn) {
            throw new Error("Elements not found");
          }

          // Clear previous input/results if needed
          input.value = "";
          await new Promise((resolve) => requestAnimationFrame(resolve));

          input.value = id;
          searchBtn.click();

          // Wait for the simulated server delay (2000ms) + buffer
          await new Promise((resolve) => setTimeout(resolve, 2300));

          try {
            const resultData = await waitForResults();
            allResults.push({
              id: id,
              success: true,
              data: resultData,
            });
            // NEW: After extraction, wait for and click the change link
            await waitAndClickChangeLink();
            await waitAndClickRadio();
            await waitAndSelectOption();
            // await waitAndClickUpdateButton();
            console.log(`Work done for ID: ${id}`);
          } catch (error) {
            allResults.push({
              id: id,
              success: false,
              error: error.message,
            });
            console.error(`Error for ${id}:`, error);
          }

          // Delay between searches
          if (ids.indexOf(id) < ids.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
        console.log("All results received:", allResults);

        return allResults;
      },
      args: [idNumbers],
    });
    function downloadCSV(results) {
      // Filter only successful results
      const successful = results.filter((r) => r.success);

      // Build CSV header
      const header = ["idNumber", "surname", "firstName"];
      const rows = [header.join(",")];

      // Add each successful result as a row
      successful.forEach((r) => {
        const id = r.id || "";
        const surname = r.data?.surname || "";
        const firstName = r.data?.firstName || "";
        rows.push([id, surname, firstName].join(","));
      });

      // Combine into CSV string
      const csvContent = rows.join("\n");

      // Create a Blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "results.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Access all results
    const allData = results[0].result;
    console.log("All results received:", allData);
    downloadCSV(allData);

    // Process the results
    allData.forEach((result) => {
      if (result.success) {
        console.log(`ID ${result.id} - Data:`, result.data);
      } else {
        console.log(`ID ${result.id} - Failed: ${result.error}`);
      }
    });
  } catch (error) {
    console.error("Error executing script:", error);
  }
});
