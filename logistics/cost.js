// 🔑 Destination Category Mapping
const destinationCategories = [
  { keyword: "CARBON", category: "CARBON" },
  { keyword: "CITY CLOU", category: "CITY CLOU" },
  { keyword: "CHONGHUA", category: "CHONGHUA" },
  { keyword: "CHONG HUA", category: "CHONGHUA" },
  { keyword: "MANDAUE", category: "MANDAUE" },
  { keyword: "NEW CITY", category: "NEW CITY" },
  { keyword: "LAPULAPU", category: "LAPULAPU" },
  { keyword: "LUCIMA", category: "LUCIMA" },
  { keyword: "CARBON PUSO", category: "CARBON PUSO / ECHAVEZ" },
  { keyword: "ECHAVEZ", category: "CARBON PUSO / ECHAVEZ" },
  { keyword: "ATLAS BOLT", category: "ATLAS BOLT" },
  { keyword: "ATLAS", category: "ATLAS / VIC ENT" },
  { keyword: "VIC ENT", category: "VIC ENT." },
  { keyword: "VIC", category: "VIC ENT." },
  { keyword: "MAKOTO", category: "MAKOTO" },
  { keyword: "MODERNS BEST", category: "MODERNS BEST" },
  { keyword: "TECH SONIC", category: "MAKOTO" },
  { keyword: "MANDANI", category: "MANDANI" },
  { keyword: "HT LAND", category: "HT LAND" },
  { keyword: "LILOAN", category: "LILOAN" },
  { keyword: "NAGA", category: "NAGA" },
  { keyword: "TABUNOK", category: "TABUNOK" },
  { keyword: "MABOLO", category: "MABOLO" },
  { keyword: "EPIC CARGO", category: "EPIC CARGO" },
  { keyword: "KNOWLES", category: "KNOWLES" },
  { keyword: "AIRPORT", category: "AIRPORT" },
  { keyword: "TREASURE ISLAND", category: "TREASURE ISLAND" },
  { keyword: "AP CARGO", category: "AP CARGO" },
  { keyword: "SPAN ASIA", category: "SPAN ASIA" },
  { keyword: "SM", category: "SM" },
  { keyword: "TALISAY", category: "TALISAY" },
  { keyword: "PRIME WORKS", category: "PRIME WORKS" },
  { keyword: "MOTOR TRADE", category: "MAKOTO / MOTOR TRADE" },
  { keyword: "ATLANTIC", category: "ATLANTIC / NEW CITY" },
  { keyword: "KIMA", category: "KIMA / MAKOTO" },
  { keyword: "COLON", category: "MODERNS BEST / COLON" },
  { keyword: "FAMILY HARDWARE", category: "FAMILY HARDWARE / MAKOTO" },
  { keyword: "SAWO", category: "MAKOTO" },
  { keyword: "INSTALL", category: "OTHER" },
  { keyword: "BUYING", category: "OTHER" },
  { keyword: "HARDWARE", category: "OTHER" },
  { keyword: "PICKUP", category: "OTHER" },
  { keyword: "DELIVERY", category: "OTHER" },
  { keyword: "SAMPLE", category: "OTHER" },
  { keyword: "REWORK", category: "OTHER" },
  { keyword: "MEETING", category: "OTHER" },
  { keyword: "SORT", category: "OTHER" },
  { keyword: "ADVANCE", category: "OTHER" },
  { keyword: "CHECK", category: "OTHER" },
  { keyword: "CRITEROPENG", category: "OTHER" },
  { keyword: "POLICE CLEARANCE", category: "OTHER" },
  { keyword: "MANKO", category: "OTHER" },
];

function getDestinationCategory(destination = "") {
  const upperDest = destination.toUpperCase();
  for (const { keyword, category } of destinationCategories) {
    if (upperDest.includes(keyword)) return category;
  }
  return "OTHER";
}

// 🚚 Fetch logistics JSON
async function fetchLogisticsData() {
  try {
    const res = await fetch('https://zaintjude.github.io/prime/logistics/logistics.json');
    if (!res.ok) throw new Error('Fetch failed');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// 🧾 Cost Calculation
function calculateCosts(data) {
  const RATE = 5.0;
  const monthly = {}, yearly = {}, entriesByVehicle = {};

  for (const entry of data) {
    entriesByVehicle[entry.vehicle] ??= [];
    entriesByVehicle[entry.vehicle].push(entry);
  }

  for (const vehicle in entriesByVehicle) {
    const logs = entriesByVehicle[vehicle].sort((a, b) => new Date(a.start) - new Date(b.start));
    let prevOdo = null;

    for (const log of logs) {
      const odo = parseFloat(log.odometer);
      if (isNaN(odo)) continue;

      if (prevOdo !== null && odo > prevOdo) {
        const distance = odo - prevOdo;
        const cost = distance * RATE;
        const date = new Date(log.start);
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();

        monthly[vehicle] ??= {};
        yearly[vehicle] ??= {};
        monthly[vehicle][month] ??= { odometer: 0, cost: 0 };
        yearly[vehicle][year] ??= { odometer: 0, cost: 0 };

        monthly[vehicle][month].odometer += distance;
        monthly[vehicle][month].cost += cost;
        yearly[vehicle][year].odometer += distance;
        yearly[vehicle][year].cost += cost;
      }

      prevOdo = odo;
    }
  }

  return { monthlyCosts: monthly, yearlyCosts: yearly };
}

// 🧾 Populate Cost Tables
function populateCostTables(data, monthFilter = "", yearFilter = "") {
  const { monthlyCosts, yearlyCosts } = calculateCosts(data);
  const mBody = document.querySelector("#monthlyCostTable tbody");
  const yBody = document.querySelector("#yearlyCostTable tbody");
  mBody.innerHTML = "";
  yBody.innerHTML = "";

  for (const vehicle in monthlyCosts) {
    for (const month in monthlyCosts[vehicle]) {
      if (!month.toLowerCase().includes(monthFilter.toLowerCase())) continue;
      const d = monthlyCosts[vehicle][month];
      mBody.innerHTML += `<tr><td>${vehicle}</td><td>${month}</td><td>${d.odometer}</td><td>${d.cost.toFixed(2)}</td></tr>`;
    }
  }

  for (const vehicle in yearlyCosts) {
    for (const year in yearlyCosts[vehicle]) {
      if (!year.includes(yearFilter)) continue;
      const d = yearlyCosts[vehicle][year];
      yBody.innerHTML += `<tr><td>${vehicle}</td><td>${year}</td><td>${d.odometer}</td><td>${d.cost.toFixed(2)}</td></tr>`;
    }
  }
}

// 💥 Destroy old chart instances
const chartInstances = {};
function destroyIfExists(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
  }
}

// 📊 Create Charts
function generateCharts(data) {
  const KM_PER_LITER = 8;
  const categoryCount = {}, deliveryCount = {}, fuelPerVehicle = {};
  const vehicleEntries = {};

  data.forEach(entry => {
    const category = getDestinationCategory(entry.destination);
    categoryCount[category] = (categoryCount[category] || 0) + 1;

    const month = new Date(entry.start).toLocaleString('default', { month: 'long' });
    deliveryCount[month] = (deliveryCount[month] || 0) + 1;

    vehicleEntries[entry.vehicle] ??= [];
    vehicleEntries[entry.vehicle].push(entry);
  });

  for (const vehicle in vehicleEntries) {
    const sorted = vehicleEntries[vehicle].sort((a, b) => new Date(a.start) - new Date(b.start));
    let prevOdo = null;

    for (const entry of sorted) {
      const odo = parseFloat(entry.odometer);
      if (isNaN(odo)) continue;

      if (prevOdo !== null && odo > prevOdo) {
        const fuel = (odo - prevOdo) / KM_PER_LITER;
        fuelPerVehicle[vehicle] = (fuelPerVehicle[vehicle] || 0) + fuel;
      }
      prevOdo = odo;
    }
  }

  // Pie: Destination Categories
  destroyIfExists("destinationGraph");
  chartInstances["destinationGraph"] = new Chart(document.getElementById("destinationGraph"), {
    type: "pie",
    data: {
      labels: Object.keys(categoryCount),
      datasets: [{
        data: Object.values(categoryCount),
        backgroundColor: ['#FF6347','#4CAF50','#FFEB3B','#00BCD4','#2196F3','#FF9800','#8BC34A','#E91E63','#9C27B0','#795548']
      }]
    }
  });

  // Bar: Fuel Consumption
  destroyIfExists("fuelGraph");
  chartInstances["fuelGraph"] = new Chart(document.getElementById("fuelGraph"), {
    type: "bar",
    data: {
      labels: Object.keys(fuelPerVehicle),
      datasets: [{
        label: "Fuel (L)",
        data: Object.values(fuelPerVehicle).map(f => +f.toFixed(2)),
        backgroundColor: "#FF5733"
      }]
    }
  });

  // Line: Deliveries Per Month
  destroyIfExists("deliveryGraph");
  chartInstances["deliveryGraph"] = new Chart(document.getElementById("deliveryGraph"), {
    type: "line",
    data: {
      labels: Object.keys(deliveryCount),
      datasets: [{
        label: "Deliveries",
        data: Object.values(deliveryCount),
        borderColor: "#4CAF50",
        backgroundColor: "#C8E6C9",
        fill: true,
        tension: 0.2
      }]
    }
  });

  // Horizontal Bar: Location Categories
  destroyIfExists("locationSummaryGraph");
  chartInstances["locationSummaryGraph"] = new Chart(document.getElementById("locationSummaryGraph"), {
    type: "bar",
    data: {
      labels: Object.keys(categoryCount),
      datasets: [{
        label: "Deliveries by Category",
        data: Object.values(categoryCount),
        backgroundColor: "#42A5F5"
      }]
    },
    options: {
      indexAxis: "y",
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

// 🔎 Setup Input Filters
function setupFilters(data) {
  const monthInput = document.getElementById("monthFilter");
  const yearInput = document.getElementById("yearFilter");
  const update = () => populateCostTables(data, monthInput.value.trim(), yearInput.value.trim());
  monthInput.addEventListener("input", update);
  yearInput.addEventListener("input", update);
}

// 🚀 Initialization
document.addEventListener("DOMContentLoaded", async () => {
  const logisticsData = await fetchLogisticsData();
  populateCostTables(logisticsData);
  generateCharts(logisticsData);
  setupFilters(logisticsData);
});
