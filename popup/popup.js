const idNumbers = ["AH023321", "AO0230203"];

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
            const maxAttempts = 50;
            let attempts = 0;

            const checkForResults = () => {
              const resultsContainer = document.getElementById("results");

              if (resultsContainer && resultsContainer.children.length > 0) {
                const items = Array.from(
                  resultsContainer.querySelectorAll(".result-item")
                );
                const data = items.map((item) => ({
                  name: item.dataset.name,
                  age: item.dataset.age,
                  text: item.textContent,
                }));
                resolve(data);
              } else if (attempts >= maxAttempts) {
                reject(new Error("Timeout waiting for results"));
              } else {
                attempts++;
                setTimeout(checkForResults, 100);
              }
            };

            checkForResults();
          });
        };

        // Process each ID
        for (const id of ids) {
          console.log(`Processing ID: ${id}`);

          const input = document.getElementById("id-input");
          const searchBtn = document.getElementById("search");

          if (!input || !searchBtn) {
            throw new Error("Elements not found");
          }

          input.value = id;
          searchBtn.click();

          try {
            const results = await waitForResults();
            allResults.push({
              id: id,
              success: true,
              data: results,
            });
            console.log(`Results for ${id}:`, results);
          } catch (error) {
            allResults.push({
              id: id,
              success: false,
              error: error.message,
            });
            console.error(`Error for ${id}:`, error);
          }

          // Optional: Add delay between searches
          await new Promise((resolve) => setTimeout(resolve, 1001));
        }
        console.log("All results received:", allResults);

        // Process the results
        allResults.forEach((result) => {
          if (result.success) {
            console.log(`ID ${result.id} - Found ${result.data.length} items`);
            result.data.forEach((item) => {
              console.log(`  - ${item.name}, Age: ${item.age}`);
            });
          } else {
            console.log(`ID ${result.id} - Failed: ${result.error}`);
          }
        });

        // return allResults;
      },
      args: [idNumbers],
    });

    // Access all results
    const allData = results[0].result;
    console.log("All results received:", allData);

    // Process the results
    allData.forEach((result) => {
      if (result.success) {
        console.log(`ID ${result.id} - Found ${result.data.length} items`);
        result.data.forEach((item) => {
          console.log(`  - ${item.name}, Age: ${item.age}`);
        });
      } else {
        console.log(`ID ${result.id} - Failed: ${result.error}`);
      }
    });
  } catch (error) {
    console.error("Error executing script:", error);
  }
});
