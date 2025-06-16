document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetch("https://zaintjude.github.io/prime/logistics/logistics.json")
    .then(r => r.json())
    .catch(err => { console.error(err); return []; });

  const monthInput = document.getElementById("monthFilter");
  const yearInput = document.getElementById("yearFilter");

  monthInput.addEventListener("input", update);
  yearInput.addEventListener("input", update);

  update();

  function update() {
    const m = monthInput.value.trim();
    const y = yearInput.value.trim();
    renderMonthly(data, m, y);
    renderYearly(data);
    renderCharts(data);
  }
});

const RATE_PER_KM = 5; // ₱ per km
const MONTHS = Array.from({ length:12 }, (_, i) =>
  new Date(0,i).toLocaleString("default",{month:"long"})
);

function renderMonthly(data, monthFilter, yearFilter) {
  const tbody = document.querySelector("#monthlyCostTable tbody");
  tbody.innerHTML = "";
  const summary = {};

  data.forEach(e => {
    const d = new Date(e.start);
    if (isNaN(d)) return;
    const m = MONTHS[d.getMonth()];
    const y = d.getFullYear();
    if (monthFilter && monthFilter !== m) return;
    if (yearFilter && String(yearFilter) !== String(y)) return;

    const key = `${e.vehicle}|${m}|${y}`;
    const odo = parseFloat(e.odometer) || 0;

    const rec = summary[key] ||= {
      vehicle: e.vehicle, month: m, year: y,
      minOdo: odo, maxOdo: odo
    };
    rec.minOdo = Math.min(rec.minOdo, odo);
    rec.maxOdo = Math.max(rec.maxOdo, odo);
  });

  Object.values(summary).forEach(r => {
    const dist = r.maxOdo - r.minOdo;
    const cost = dist * RATE_PER_KM;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.vehicle}</td>
      <td>${r.month} ${r.year}</td>
      <td>${dist.toLocaleString()}</td>
      <td>₱${cost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderYearly(data) {
  const tbody = document.querySelector("#yearlyCostTable tbody");
  tbody.innerHTML = "";
  const summary = {};

  data.forEach(e => {
    const d = new Date(e.start);
    if (isNaN(d)) return;
    const y = d.getFullYear();
    const key = `${e.vehicle}|${y}`;
    const odo = parseFloat(e.odometer) || 0;

    const rec = summary[key] ||= {
      vehicle: e.vehicle, year: y,
      minOdo: odo, maxOdo: odo
    };
    rec.minOdo = Math.min(rec.minOdo, odo);
    rec.maxOdo = Math.max(rec.maxOdo, odo);
  });

  Object.values(summary).forEach(r => {
    const dist = r.maxOdo - r.minOdo;
    const cost = dist * RATE_PER_KM;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.vehicle}</td>
      <td>${r.year}</td>
      <td>${dist.toLocaleString()}</td>
      <td>₱${cost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCharts(data) {
  const destCount = {};
  const fuelCostVeh = {};
  const deliveriesMonth = {};
  const catSummary = {};

  const byVehEntries = {};
  data.forEach(e => {
    const d = new Date(e.start);
    if (isNaN(d)) return;
    const m = MONTHS[d.getMonth()];
    deliveriesMonth[m] = (deliveriesMonth[m]||0)+1;
    const dest = e.destination || 'Unknown';
    destCount[dest] = (destCount[dest]||0)+1;
    catSummary[dest] = destCount[dest];

    if (!byVehEntries[e.vehicle]) byVehEntries[e.vehicle] = [];
    byVehEntries[e.vehicle].push(e);
  });

  // Simulate fuel as ₱ per km * rate
  for(const veh in byVehEntries){
    const arr = byVehEntries[veh].sort((a,b)=>new Date(a.start)-new Date(b.start));
    let prev = null, cost=0;
    arr.forEach(e=>{
      const odo = parseFloat(e.odometer)||0;
      if(prev!==null && odo>prev) cost += (odo-prev)*RATE_PER_KM;
      prev = odo;
    });
    fuelCostVeh[veh] = cost;
  }

  // Charting Helpers
  function drawPie(el, labels, values){
    const ctx = document.getElementById(el)?.getContext("2d");
    if(!ctx) return;
    new Chart(ctx, {type:'pie', data:{labels, datasets:[{data:values}]}, options:{}});
  }
  function drawBar(el, labels, values){
    const ctx = document.getElementById(el)?.getContext("2d");
    if(!ctx) return;
    new Chart(ctx, {type:'bar', data:{labels, datasets:[{data:values}]}, options:{}});
  }
  function drawLine(el, labels, values){
    const ctx = document.getElementById(el)?.getContext("2d");
    if(!ctx) return;
    new Chart(ctx, {type:'line', data:{labels, datasets:[{data:values}]}, options:{}});
  }

  drawPie("destinationGraph", Object.keys(destCount), Object.values(destCount));
  drawBar("fuelGraph", Object.keys(fuelCostVeh), Object.values(fuelCostVeh));
  drawLine("deliveryGraph", MONTHS, MONTHS.map(m=>deliveriesMonth[m]||0));
  drawBar("locationSummaryGraph", Object.keys(catSummary), Object.values(catSummary));
}
