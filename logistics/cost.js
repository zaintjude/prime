

  
async function fetchLogisticsData() {
  try {
    const res = await fetch('https://zaintjude.github.io/prime/logistics/logistics.json');
    if (!res.ok) throw new Error('Fetch error');
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Calculate distance and cost
function calculateCosts(data) {
  const monthlyCosts = {}, yearlyCosts = {}, vehicleEntries = {};

  data.forEach(e => {
    vehicleEntries[e.vehicle] = vehicleEntries[e.vehicle] || [];
    vehicleEntries[e.vehicle].push(e);
  });

  for (const vehicle in vehicleEntries) {
    const entries = vehicleEntries[vehicle].sort((a, b) => new Date(a.start) - new Date(b.start));
    let prevOdo = null;
    for (const e of entries) {
      const odo = parseFloat(e.odometer);
      const date = new Date(e.start);
      if (prevOdo !== null && odo > prevOdo) {
        const dist = odo - prevOdo, cost = dist * 0.05;
        const m = date.getMonth() + 1, y = date.getFullYear();

        monthlyCosts[vehicle] = monthlyCosts[vehicle] || {};
        monthlyCosts[vehicle][m] = monthlyCosts[vehicle][m] || { odometer: 0, cost: 0 };
        monthlyCosts[vehicle][m].odometer += dist;
        monthlyCosts[vehicle][m].cost += cost;

        yearlyCosts[vehicle] = yearlyCosts[vehicle] || {};
        yearlyCosts[vehicle][y] = yearlyCosts[vehicle][y] || { odometer: 0, cost: 0 };
        yearlyCosts[vehicle][y].odometer += dist;
        yearlyCosts[vehicle][y].cost += cost;
      }
      prevOdo = odo;
    }
  }
  return { monthlyCosts, yearlyCosts };
}

// Populate tables
function populateCostTables(data) {
  const { monthlyCosts, yearlyCosts } = calculateCosts(data);
  const mBody = document.querySelector('#monthlyCostTable tbody');
  const yBody = document.querySelector('#yearlyCostTable tbody');
  mBody.innerHTML = ''; yBody.innerHTML = '';

  for (const v in monthlyCosts)
    for (const m in monthlyCosts[v]) {
      const { odometer, cost } = monthlyCosts[v][m];
      mBody.insertAdjacentHTML('beforeend', `
        <tr><td>${v}</td><td>${m}</td>
            <td>${odometer}</td><td>${cost.toFixed(2)}</td></tr>`);
    }

  for (const v in yearlyCosts)
    for (const y in yearlyCosts[v]) {
      const { odometer, cost } = yearlyCosts[v][y];
      yBody.insertAdjacentHTML('beforeend', `
        <tr><td>${v}</td><td>${y}</td>
            <td>${odometer}</td><td>${cost.toFixed(2)}</td></tr>`);
    }
}

// Charts: deliveries per month & summary by location
function generateCharts(data) {
  // Deliveries per month
  const deliveryCount = {};
  data.forEach(e => {
    const d = new Date(e.start);
    const m = d.toLocaleString('default', { month: 'long' });
    deliveryCount[m] = (deliveryCount[m] || 0) + 1;
  });
  new Chart(document.getElementById('deliveryGraph').getContext('2d'), {
    type: 'line',
    data: {
      labels: Object.keys(deliveryCount),
      datasets: [{
        label: '# Deliveries',
        data: Object.values(deliveryCount),
        borderColor: '#4CAF50',
        fill: false
      }]
    }
  });

  // Summary by location category
  const bucket = {};
  data.forEach(e => {
    const dest = (e.destination || '').toUpperCase();
    let cat = 'OTHER';
    if (dest.includes('CARBON')) cat = 'CARBON';
    else if (dest.includes('CITY CLOU')) cat = 'CITY CLOU';
    else if (dest.includes('ECHAVEZ')) cat = 'ECHAVEZ';
    // ... repeat your mapping for other destinations
    bucket[cat] = (bucket[cat] || 0) + 1;
  });
  new Chart(document.getElementById('locationSummaryGraph').getContext('2d'), {
    type: 'bar',
    data: {
      labels: Object.keys(bucket),
      datasets: [{ label: '# Deliveries', data: Object.values(bucket), backgroundColor: '#42A5F5' }]
    },
    options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
  });

  // Existing charts (destinationGraph, fuelGraph) can be added similarly
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchLogisticsData();
  populateCostTables(data);
  generateCharts(data);
});
