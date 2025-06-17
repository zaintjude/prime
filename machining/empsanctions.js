document.getElementById("yearFilter").addEventListener("input", loadQuotaData);
document.getElementById("monthFilter").addEventListener("input", loadQuotaData);
document.getElementById("dateFilter").addEventListener("input", loadQuotaData);

function loadQuotaData() {
  const nameFilter = document.getElementById("nameFilter") ? document.getElementById("nameFilter").value.toLowerCase() : "";
  const monthFilter = document.getElementById("monthFilter").value;
  const dateFilter = document.getElementById("dateFilter").value;
  const yearFilter = document.getElementById("yearFilter").value;

  fetch("https://zaintjude.github.io/prime/machining/quota.json")
    .then(response => response.json())
    .then(data => {
      const rows = [];
      let employeeCount = 0;

      ["shift1", "shift2"].forEach(shift => {
        if (data[shift]) {
          data[shift].forEach(entry => {
            const actual = parseFloat(entry.total);
            const quota = parseFloat(entry.quota);
            const date = entry.date;
            const name = entry.operator;

            if (actual >= quota) return; // Skip those who met or exceeded quota

            let show = true;

            // Filter by name if provided
            if (nameFilter && !name.toLowerCase().includes(nameFilter)) show = false;
            // Filter by month, year, and specific date if provided
            if (monthFilter && !date.startsWith(monthFilter)) show = false;
            if (dateFilter && date !== dateFilter) show = false;
            if (yearFilter && !date.startsWith(yearFilter)) show = false;

            if (show) {
              rows.push(`
                <tr>
                  <td>${name}</td>
                  <td>${date}</td>
                  <td>${quota}</td>
                  <td>${actual}</td>
                </tr>
              `);
              employeeCount++;
            }
          });
        }
      });

      const tableBody = document.querySelector("#quotaTable tbody");
      tableBody.innerHTML = rows.length ? rows.join("") : "<tr><td colspan='4'>No failed quotas found.</td></tr>";

      // Update the total employee count
      document.getElementById("totalEmployees").textContent = employeeCount;
    })
    .catch(err => {
      console.error("Error fetching quota data:", err);
    });
}

// Load data initially
loadQuotaData();
