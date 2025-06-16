document.addEventListener("DOMContentLoaded", function () {
  fetch("https://zaintjude.github.io/prime/logistics/logistics.json")
    .then(response => response.json())
    .then(data => {
      populateCostTables(data);
      setupFilters(data);
    })
    .catch(error => {
      console.error("Error fetching logistics data:", error);
    });
});

// Filter and display cost per vehicle per month
function populateCostTables(data, selectedMonth = "", selectedYear = "") {
  const costTableBody = document.querySelector("#costTable tbody");
  costTableBody.innerHTML = "";

  const filteredData = data.filter(entry => {
    const startDate = new Date(entry.start);
    const month = startDate.toLocaleString("default", { month: "long" });
    const year = startDate.getFullYear().toString();

    const matchesMonth = selectedMonth ? month === selectedMonth : true;
    const matchesYear = selectedYear ? year === selectedYear : true;

    return matchesMonth && matchesYear;
  });

  const costsByPlate = {};

  filteredData.forEach(entry => {
    const plate = entry.plate;
    if (!costsByPlate[plate]) {
      costsByPlate[plate] = { total: 0, count: 0 };
    }
    costsByPlate[plate].total += parseFloat(entry.cost) || 0;
    costsByPlate[plate].count += 1;
  });

  Object.keys(costsByPlate).forEach(plate => {
    const costData = costsByPlate[plate];
    const averageCost = costData.total / costData.count;

    const row = document.createElement("tr");
    row.innerHTML = 
      <td>${plate}</td>
      <td>${averageCost.toFixed(2)}</td>
    ;
    costTableBody.appendChild(row);
  });
}

// Setup month and year filter
function setupFilters(data) {
  const monthInput = document.getElementById("monthFilter");
  const yearInput = document.getElementById("yearFilter");

  // Get unique months from data
  const monthSet = new Set();
  data.forEach(entry => {
    const date = new Date(entry.start);
    const month = date.toLocaleString('default', { month: 'long' });
    monthSet.add(month);
  });

  // Sort months in calendar order
  const calendarOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const sortedMonths = [...monthSet].sort((a, b) => calendarOrder.indexOf(a) - calendarOrder.indexOf(b));

  // Populate month dropdown
  monthInput.innerHTML = <option value="">-- All Months --</option>;
  sortedMonths.forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthInput.appendChild(option);
  });

  // Setup event listeners
  const updateTable = () => {
    const selectedMonth = monthInput.value;
    const selectedYear = yearInput.value.trim();
    populateCostTables(data, selectedMonth, selectedYear);
  };

  monthInput.addEventListener("change", updateTable);
  yearInput.addEventListener("input", updateTable);
}
