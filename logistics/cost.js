document.addEventListener("DOMContentLoaded", function () {
  fetch("https://zaintjude.github.io/prime/logistics/logistics.json")
    .then(response => response.json())
    .then(data => {
      setupFilters(data);
      populateCostTable(data);
    })
    .catch(error => {
      console.error("Error fetching logistics data:", error);
    });
});

// Populate Monthly Cost Table
function populateCostTable(data, selectedMonth = "", selectedYear = "") {
  const tableBody = document.querySelector("#monthlyCostTable tbody");
  tableBody.innerHTML = "";

  const filteredData = data.filter(entry => {
    if (!entry.start || !entry.cost || isNaN(parseFloat(entry.cost))) return false;

    const date = new Date(entry.start);
    if (isNaN(date)) return false;

    const entryMonth = date.toLocaleString("default", { month: "long" });
    const entryYear = date.getFullYear().toString();

    const matchMonth = selectedMonth ? entryMonth === selectedMonth : true;
    const matchYear = selectedYear ? entryYear === selectedYear : true;

    return matchMonth && matchYear;
  });

  const summary = {};

  filteredData.forEach(entry => {
    const date = new Date(entry.start);
    const plate = entry.plate || "Unknown";
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear().toString();
    const key = `${plate}-${month}-${year}`;

    const cost = parseFloat(entry.cost);
    const odometer = parseFloat(entry.odometer) || 0;

    if (!summary[key]) {
      summary[key] = {
        plate,
        month,
        year,
        totalCost: 0,
        totalOdometer: 0
      };
    }

    summary[key].totalCost += cost;
    summary[key].totalOdometer += odometer;
  });

  Object.values(summary).forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.plate}</td>
      <td>${item.month} ${item.year}</td>
      <td>${item.totalOdometer.toLocaleString()}</td>
      <td>₱${item.totalCost.toFixed(2)}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Setup Month and Year Filters
function setupFilters(data) {
  const monthFilter = document.getElementById("monthFilter");
  const yearFilter = document.getElementById("yearFilter");

  const monthSet = new Set();
  const yearSet = new Set();

  data.forEach(entry => {
    if (!entry.start) return;

    const date = new Date(entry.start);
    if (isNaN(date)) return;

    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear().toString();

    monthSet.add(month);
    yearSet.add(year);
  });

  const calendarOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const sortedMonths = Array.from(monthSet).sort((a, b) => calendarOrder.indexOf(a) - calendarOrder.indexOf(b));
  const sortedYears = Array.from(yearSet).sort((a, b) => b - a); // Descending

  // Populate Month Dropdown
  monthFilter.innerHTML = `<option value="">-- All Months --</option>`;
  sortedMonths.forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthFilter.appendChild(option);
  });

  // Optional: Use a datalist or dropdown for years
  yearFilter.setAttribute("list", "yearList");
  const yearList = document.createElement("datalist");
  yearList.id = "yearList";
  sortedYears.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    yearList.appendChild(option);
  });
  document.body.appendChild(yearList);

  // Trigger table update on filter change
  const updateTable = () => {
    const selectedMonth = monthFilter.value;
    const selectedYear = yearFilter.value.trim();
    populateCostTable(data, selectedMonth, selectedYear);
  };

  monthFilter.addEventListener("change", updateTable);
  yearFilter.addEventListener("input", updateTable);
}
