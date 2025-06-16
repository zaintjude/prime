// 🔑 Destination Category Mapping
const destinationCategories = [
  { keyword: "MANDAUE", category: "MANDAUE" },
  { keyword: "CEBU", category: "CEBU" },
  { keyword: "CONSOLACION", category: "NORTH" },
  { keyword: "LILOAN", category: "NORTH" },
  { keyword: "COMPOSTELA", category: "NORTH" },
  { keyword: "DANAO", category: "NORTH" },
  { keyword: "CARMEN", category: "NORTH" },
  { keyword: "CATMON", category: "NORTH" },
  { keyword: "SOGOD", category: "NORTH" },
  { keyword: "BORBON", category: "NORTH" },
  { keyword: "TABOGON", category: "NORTH" },
  { keyword: "BAGO", category: "SOUTH" },
  { keyword: "NAGA", category: "SOUTH" },
  { keyword: "SAN FERNANDO", category: "SOUTH" },
  { keyword: "CARCAR", category: "SOUTH" },
  { keyword: "SIBONGA", category: "SOUTH" },
  { keyword: "ARGAO", category: "SOUTH" },
  { keyword: "DALAGUETE", category: "SOUTH" },
  { keyword: "ALCANTARA", category: "SOUTH" },
  { keyword: "ALCOY", category: "SOUTH" },
  { keyword: "OSLOB", category: "SOUTH" },
  { keyword: "SANTANDER", category: "SOUTH" },
  { keyword: "TALISAY", category: "SOUTH" },
  { keyword: "TOLEDO", category: "WEST" },
  { keyword: "BALAMBAN", category: "WEST" },
  { keyword: "ASTURIAS", category: "WEST" },
  { keyword: "MABOLO", category: "MABOLO" }
];

function getDestinationCategory(destination = "") {
  const upper = destination.toUpperCase();
  for (const { keyword, category } of destinationCategories) {
    if (upper.includes(keyword)) return category;
  }
  return "OTHER";
}

async function fetchLogisticsData() {
  try {
    const res = await fetch('https://zaintjude.github.io/prime/logistics/logistics.json');
    if (!res.ok) throw new Error('Fetch failed');
    return res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

function calculateCosts(data) {
  const RATE = 5.0;
  const monthly = {}, yearly = {}, byVehicle = {};
  data.forEach(e => (byVehicle[e.vehicle] ??= []).push(e));

  for (const v in byVehicle) {
    const arr = byVehicle[v].sort((a, b) => new Date(a.start) - new Date(b.start));
    let prev = null;
    for (const e of arr) {
      const odo = parseFloat(e.odometer);
      if (isNaN(odo)) continue;
      if (prev !== null && odo > prev) {
        const dist = odo - prev, cost = dist * RATE;
        const d = new Date(e.start);
        const m = d.toLocaleString('default', { month: 'long' });
        const y = d.getFullYear();
        monthly[v] ??= {};
        monthly[v][m] ??= { odometer: 0, cost: 0 };
        yearly[v] ??= {};
        yearly[v][y] ??= { odometer: 0, cost: 0 };
        monthly[v][m].odometer += dist;
        monthly[v][m].cost += cost;
        yearly[v][y].odometer += dist;
        yearly[v][y].cost += cost;
      }
      prev = odo;
    }
  }

  return { monthlyCosts: monthly, yearlyCosts: yearly };
}

function populateCostTables(data) {
  const { monthlyCosts, yearlyCosts } = calculateCosts(data);
  const mBody = document.querySelector("#monthlyCostTable tbody");
  const yBody = document.querySelector("#yearlyCostTable tbody");
  mBody.innerHTML = ""; yBody.innerHTML = "";

  for (const v in monthlyCosts) {
    for (const m in monthlyCosts[v]) {
      const d = monthlyCosts[v][m];
      mBody.innerHTML += `<tr><td>${v}</td><td>${m}</td><td>${d.odometer}</td><td>${d.cost.toFixed(2)}</td></tr>`;
    }
  }

  for (const v in yearlyCosts) {
    for (const y in yearlyCosts[v]) {
      const d = yearlyCosts[v][y];
      yBody.innerHTML += `<tr><td>${v}</td><td>${y}</td><td>${d.odometer}</td><td>${d.cost.toFixed(2)}</td></tr>`;
    }
  }
}

const chartInstances = {};
function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function generateCharts(data) {
  const KM_L = 8;
  const categoryCount = {}, deliveryCount = {}, fuelPerVehicle = {}, byVehicle = {};

  data.forEach(e => {
    const cat = getDestinationCategory(e.destination);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    const m = new Date(e.start).toLocaleString('default', { month: 'long' });
    deliveryCount[m] = (deliveryCount[m] || 0) + 1;
    (byVehicle[e.vehicle] ??= []).push(e);
  });

  for (const v in byVehicle) {
    const arr = byVehicle[v].sort((a, b) => new Date(a.start) - new Date(b.start));
    let prev = null;
    for (const e of arr) {
      const odo = parseFloat(e.odometer);
      if (isNaN(odo)) continue;
      if (prev !== null && odo > prev) {
        const f = (odo - prev) / KM_L;
        fuelPerVehicle[v] = (fuelPerVehicle[v] || 0) + f;
      }
      prev = odo;
    }
  }

  const palette = ['#FF6347','#4CAF50','#FFEB3B','#00BCD4','#2196F3','#FF9800','#8BC34A','#E91E63','#9C27B0','#795548'];

  destroyChart('destinationGraph');
  chartInstances['destinationGraph'] = new Chart(document.getElementById('destinationGraph'), {
    type: 'pie',
    data: {
      labels: Object.keys(categoryCount),
      datasets: [{
        data: Object.values(categoryCount),
        backgroundColor: palette
      }]
    }
  });

  destroyChart('fuelGraph');
  chartInstances['fuelGraph'] = new Chart(document.getElementById('fuelGraph'), {
    type: 'bar',
    data: {
      labels: Object.keys(fuelPerVehicle),
      datasets: [{
        label: 'Fuel (L)',
        data: Object.values(fuelPerVehicle).map(f => +f.toFixed(2)),
        backgroundColor: '#FF5733'
      }]
    }
  });

  destroyChart('deliveryGraph');
  const sortedMonths = Object.keys(deliveryCount).sort((a, b) => new Date(`${a} 1, 2020`) - new Date(`${b} 1, 2020`));
  chartInstances['deliveryGraph'] = new Chart(document.getElementById('deliveryGraph'), {
    type: 'line',
    data: {
      labels: sortedMonths,
      datasets: [{
        label: 'Deliveries',
        data: sortedMonths.map(m => deliveryCount[m]),
        borderColor: '#4CAF50',
        backgroundColor: '#C8E6C9',
        fill: true,
        tension: 0.2
      }]
    }
  });

  destroyChart('locationSummaryGraph');
  chartInstances['locationSummaryGraph'] = new Chart(document.getElementById('locationSummaryGraph'), {
    type: 'bar',
    data: {
      labels: Object.keys(categoryCount),
      datasets: [{
        label: 'Deliveries by Category',
        data: Object.values(categoryCount),
        backgroundColor: '#42A5F5'
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

// 🚀 Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchLogisticsData();
  populateCostTables(data);
  generateCharts(data);
});
