// Destination Category mapping remains the same…

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

function calculateCosts(data) {
  const RATE = 5.0;
  const monthly = {}, yearly = {}, entriesByVehicle = {};

  data.forEach(e => {
    if (!e.vehicle || isNaN(parseFloat(e.odometer))) return;
    entriesByVehicle[e.vehicle] ??= [];
    entriesByVehicle[e.vehicle].push(e);
  });

  Object.entries(entriesByVehicle).forEach(([vehicle, logs]) => {
    logs.sort((a, b) => new Date(a.start) - new Date(b.start));
    let prevOdo = null;
    logs.forEach(l => {
      const odo = parseFloat(l.odometer);
      if (prevOdo !== null && odo > prevOdo) {
        const dist = odo - prevOdo, cost = dist * RATE;
        const d = new Date(l.start);
        const mon = d.toLocaleString('default', { month: 'long' });
        const yr = d.getFullYear();
        monthly[vehicle] ??= {};
        yearly[vehicle] ??= {};
        monthly[vehicle][mon] ??= { odometer: 0, cost: 0 };
        yearly[vehicle][yr]   ??= { odometer: 0, cost: 0 };
        monthly[vehicle][mon].odometer += dist;
        monthly[vehicle][mon].cost += cost;
        yearly[vehicle][yr].odometer += dist;
        yearly[vehicle][yr].cost += cost;
      }
      prevOdo = odo;
    });
  });

  return { monthlyCosts: monthly, yearlyCosts: yearly };
}

function populateCostTables(data, monthFilter = '', yearFilter = '') {
  const { monthlyCosts, yearlyCosts } = calculateCosts(data);
  const mBody = document.querySelector('#monthlyCostTable tbody');
  const yBody = document.querySelector('#yearlyCostTable tbody');
  if (!mBody || !yBody) return;

  mBody.innerHTML = '';
  yBody.innerHTML = '';

  Object.entries(monthlyCosts).forEach(([vehicle, months]) => {
    Object.entries(months).forEach(([mon, d]) => {
      if (monthFilter && mon !== monthFilter) return;
      mBody.innerHTML += `
        <tr>
          <td>${vehicle}</td>
          <td>${mon}</td>
          <td>${d.odometer}</td>
          <td>₱${d.cost.toFixed(2)}</td>
        </tr>`;
    });
  });

  Object.entries(yearlyCosts).forEach(([vehicle, years]) => {
    Object.entries(years).forEach(([yr, d]) => {
      if (yearFilter && yr !== yearFilter) return;
      yBody.innerHTML += `
        <tr>
          <td>${vehicle}</td>
          <td>${yr}</td>
          <td>${d.odometer}</td>
          <td>₱${d.cost.toFixed(2)}</td>
        </tr>`;
    });
  });
}

// Chart generation stays same…

function setupFilters(data) {
  const monthSel = document.getElementById('monthFilter');
  const yearInp = document.getElementById('yearFilter');
  if (!monthSel || !yearInp) return;

  const monthSet = new Set(), yearSet = new Set();
  data.forEach(e => {
    const d = new Date(e.start);
    if (!isNaN(d)) {
      monthSet.add(d.toLocaleString('default', { month: 'long' }));
      yearSet.add(d.getFullYear().toString());
    }
  });

  const cal = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  monthSet.forEach(mon => monthSel.append(new Option(mon, mon)));
  // Year: keep as text input but could use datalist
  yearSet.forEach(yr => yearInp.value = yearInp.value); // keeps as is

  const update = () => {
    populateCostTables(data, monthSel.value, yearInp.value.trim());
  };
  monthSel.addEventListener('change', update);
  yearInp.addEventListener('input', update);
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetchLogisticsData();
  setupFilters(data);
  populateCostTables(data);
  generateCharts(data);
});
