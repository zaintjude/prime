document.addEventListener("DOMContentLoaded", function () {
  fetch("https://zaintjude.github.io/prime/logistics/logistics.json")
    .then(response => response.json())
    .then(data => {
      setupFilters(data);
      populateCostTables(data);
    })
    .catch(error => {
      console.error("Error fetching logistics data:", error);
    });
});

// Populate cost-per-vehicle-per-month table
function populateCostTables(data, selectedMonth = "", selectedYear = "") {
  const costTableBody = document.querySelector("#costTable tbody");
  costTableBody.innerHTML = "";

  const filteredData = data.filter(entry => {
    if (!entry.start) return false;

    const startDate = new Date(entry.start);
    if (isNaN(startDate)) return false;

    const month = startDate.toLocaleString("default", { month: "long" });
    const year = startDate.getFullYear().toString();

    const matchMonth = selectedMonth ? month === selectedMonth : true;
    const matchYear = selectedYear ? year === selectedYear : true;

    return matchMonth && matchYear;
  });

  const costsByPlate = {};

  filteredData.forEach(entry => {
    const plate = entry.plate || "Unknown";
    const cost = parseFloat(entry.cost);

    if (isNaN(cost)) return;

    if (!costsByPlate[plate]) {
      costsByPlate[plate] = { total: 0, count: 0 };
    }

    costsByPlate[plate].total += cost;
    costsByPlate[plate].count += 1;
  });

  Object.entries(costsByPlate).forEach(([plate, costData]) => {
    const averageCost = costData.count > 0 ? (costData.total / costData.count) : 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${plate}</td>
      <td>${averageCost.toFixed(2)}</td>
    `;
    costTableBody.appendChild(row);
  });
}

// Setup filters for Month and Year
function setupFilters(data) {
  const monthSelect = document.getElementById("monthFilter");
  const yearInput = document.getElementById("yearFilter");

  const monthSet = new Set();

  data.forEach(entry => {
    if (!entry.start) return;
    const date = new Date(entry.start);
    if (isNaN(date)) return;

    const month = date.toLocaleString("default", { month: "long" });
    monthSet.add(month);
  });

  // Ensure months appear in calendar order
  const calendarMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const sortedMonths = Array.from(monthSet).sort(
    (a, b) => calendarMonths.indexOf(a) - calendarMonths.indexOf(b)
  );

  // Populate dropdown
  monthSelect.innerHTML = `<option value="">-- All Months --</option>`;
  sortedMonths.forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  // Filter on change
  const updateTable = () => {
    const selectedMonth = monthSelect.value;
    const selectedYear = yearInput.value.trim();
    populateCostTables(data, selectedMonth, selectedYear);
  };

  monthSelect.addEventListener("change", updateTable);
  yearInput.addEventListener("input", updateTable);
}
