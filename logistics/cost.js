// 🔑 CATEGORY KEYWORDS FOR DESTINATIONS
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

// 🔍 Get category based on keywords
function getDestinationCategory(destination) {
  const d = (destination || "").toUpperCase();
  for (const { keyword, category } of destinationCategories) {
    if (d.includes(keyword)) return category;
  }
  return "OTHER";
}

// 📦 Fetch logistics JSON
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

// 🧮 Calculate distances & cost
function calculateCosts(data) {
  const RATE = 5.0;
  const monthly = {}, yearly = {}, entriesByVehicle = {};

  data.forEach(e => {
    entriesByVehicle[e.vehicle] ??= [];
    entriesByVehicle[e.vehicle].push(e);
  });

  for (const vehicle in entriesByVehicle) {
    const arr = entriesByVehicle[vehicle].sort((a, b) => new Date(a.start) - new Date(b.start));
    let prev = null;
    arr.forEach(e => {
      const odo = parseFloat(e.odometer);
      if (isNaN(odo)) return;
      if (prev !== null && odo > prev) {
        const dist = odo - prev, cost = dist * RATE;
        const m = new Date(e.start).toLocaleString('default', { month: 'long' });
        const y = new Date(e.start).getFullYear();
        monthly[vehicle] ??= {};
        monthly[vehicle][m] ??= { odometer: 0, cost: 0 };
        monthly[vehicle][m].odometer += dist;
        monthly[vehicle][m].cost += cost;
        yearly[vehicle] ??= {};
        yearly[vehicle][y] ??= { odometer: 0, cost: 0 };
        yearly[vehicle][y].odometer += dist;
        yearly[vehicle][y].cost += cost;
      }
      prev = odo;
    });
  }

  return { monthlyCosts: monthly, yearlyCosts: yearly };
}

// 📊 Populate tables
function populateCostTables(data, monthFilter = "", yearFilter = "") {
  const { monthlyCosts, yearlyCosts } = calculateCosts(data);
  const mBody = document.querySelector("#monthlyCostTable tbody");
  const yBody = document.querySelector("#yearlyCostTable tbody");
  mBody.innerHTML = "";
  yBody.innerHTML = "";

  for (const vehicle in monthlyCosts) {
    for (const m in monthlyCosts[vehicle]) {
      if (!m.toLowerCase().includes(monthFilter.toLowerCase())) continue;
      const d = monthlyCosts[vehicle][m];
      mBody.innerHTML += `<tr><td>${vehicle}</td><td>${m}</td><td>${d.odometer}</td><td>${d.cost.toFixed(2)}</td></tr>`;
    }
  }

  for (const vehicle in yearlyCosts) {
    for (const y in yearlyCosts[vehicle]) {
      if (!y.includes(yearFilter)) continue;
      const d = yearlyCosts[vehicle][y];
      yBody.innerHTML += `<tr><td>${vehicle}</td><td>${y}</td><td>${d.odometer}</td><td>${d.cost.toFixed(2)}</td></tr>`;
    }
  }
}

// 📈 Create charts
function generateCharts(data) {
  const categorySummary = {}, deliveryCounts = {}, vehicleFuel = {}, locCategorySummary = {};
  const KM_L = 8, entriesByVehicle = {};

  data.forEach(e => {
    const dest = e.destination || "Unknown";
    const cat = getDestinationCategory(dest);
    categorySummary[cat] = (categorySummary[cat] || 0) + 1;

    const m = new Date(e.start).toLocaleString('default', { month: 'short' });
    deliveryCounts[m] = (deliveryCounts[m] || 0) + 1;

    entriesByVehicle[e.vehicle] ??= [];
    entriesByVehicle[e.vehicle].push(e);
  });

  for (const v in entriesByVehicle) {
    const arr = entriesByVehicle[v].sort((a, b) => new Date(a.start) - new Date(b.start));
    let prev = null;
    arr.forEach(e => {
      const odo = parseFloat(e.odometer);
      if (isNaN(odo)) return;
      if (prev !== null && odo > prev) {
        const fuel = (odo - prev) / KM_L;
        vehicleFuel[v] = (vehicleFuel[v] || 0) + fuel;
      }
      prev = odo;
    });
  }

  // 🍕 Category Pie Chart
  new Chart(document.getElementById('destinationGraph'), {
    type: 'pie',
    data: {
      labels: Object.keys(categorySummary),
      datasets: [{
        data: Object.values(categorySummary),
        backgroundColor: ['#FF6347','#4CAF50','#FFEB3B','#00BCD4','#2196F3','#FF9800','#8BC34A','#E91E63','#9C27B0','#795548']
      }]
    }
  });

  // 🛢 Fuel Bar Chart
  new Chart(document.getElementById('fuelGraph'), {
    type: 'bar',
    data: {
      labels: Object.keys(vehicleFuel),
      datasets: [{
        label: 'Fuel (L)',
        data: Object.values(vehicleFuel).map(f => +f.toFixed(2)),
        backgroundColor: '#FF5733'
      }]
    }
  });

  // 📆 Delivery Line Chart
  new Chart(document.getElementById('deliveryGraph'), {
    type: 'line',
    data: {
      labels: Object.keys(deliveryCounts),
      datasets: [{
        label: 'Deliveries',
        data: Object.values(deliveryCounts),
        borderColor: '#4CAF50',
        backgroundColor: '#C8E6C9',
        fill: true,
        tension: 0.2
      }]
    }
  });

  // 📊 Horizontal Bar Chart for Location Category Summary
  new Chart(document.getElementById('locationSummaryGraph'), {
    type: 'bar',
    data: {
      labels: Object.keys(categorySummary),
      datasets: [{
        label: 'Deliveries by Category',
        data: Object.values(categorySummary),
        backgroundColor: '#42A5F5'
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

// 🔍 Setup filters
function setupFilters(data) {
  const mIn = document.getElementById('monthFilter'), yIn = document.getElementById('yearFilter');
  const update = () => populateCostTables(data, mIn.value.trim(), yIn.value.trim());
  mIn.addEventListener('input', update);
  yIn.addEventListener('input', update);
}

// 🚀 On DOM load
document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetchLogisticsData();
  populateCostTables(data);
  generateCharts(data);
  setupFilters(data);
});
