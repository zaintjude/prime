// cost.js

document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetch("https://zaintjude.github.io/prime/logistics/logistics.json")
    .then(r => r.json())
    .catch(err => { console.error(err); return []; });

  const monthInput = document.getElementById("monthFilter");
  const yearInput = document.getElementById("yearFilter");
  const yearList = new Set(data.map(e => new Date(e.start).getFullYear()));
  yearInput.setAttribute("list","yearList");
  const dl = document.createElement("datalist"); dl.id="yearList";
  [...yearList].sort().forEach(y => dl.innerHTML += `<option>${y}</option>`);
  document.body.appendChild(dl);

  function update() {
    const m = monthInput.value.trim();
    const y = yearInput.value.trim();
    renderMonthly(data, m, y);
    renderYearly(data);
    renderCharts(data);
  }
  monthInput.addEventListener("input", update);
  yearInput.addEventListener("input", update);
  update();
});

// Helper to format month name
const MONTHS = [...Array(12).keys()].map(i =>
  new Date(0, i).toLocaleString("default", { month:"long" })
);

// Renders monthly table
function renderMonthly(data, monthFilter, yearFilter) {
  const tbody = document.getElementById("monthlyCostTable").querySelector("tbody");
  tbody.innerHTML = "";
  const byVehMonth = {};

  data.forEach(e => {
    const date = new Date(e.start);
    if (isNaN(date)) return;
    const m = MONTHS[date.getMonth()];
    const y = date.getFullYear();
    if (monthFilter && m !== monthFilter) return;
    if (yearFilter && String(y) !== yearFilter) return;

    const key = `${e.vehicle}||${m}||${y}`;
    const odo = parseFloat(e.odometer) || 0;
    const cost = parseFloat(e.cost) || 0;

    const rec = byVehMonth[key] ||= {
      vehicle: e.vehicle, month: m, year: y,
      minOdo: odo, maxOdo: odo, totalCost: 0
    };
    rec.minOdo = Math.min(rec.minOdo, odo);
    rec.maxOdo = Math.max(rec.maxOdo, odo);
    rec.totalCost += cost;
  });

  Object.values(byVehMonth).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.vehicle}</td>
      <td>${r.month} ${r.year}</td>
      <td>${(r.maxOdo - r.minOdo).toLocaleString()}</td>
      <td>₱${r.totalCost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Renders yearly table
function renderYearly(data) {
  const tbody = document.getElementById("yearlyCostTable").querySelector("tbody");
  tbody.innerHTML = "";
  const byVehYear = {};

  data.forEach(e => {
    const date = new Date(e.start);
    if (isNaN(date)) return;
    const y = date.getFullYear();
    const key = `${e.vehicle}||${y}`;
    const odo = parseFloat(e.odometer) || 0;
    const cost = parseFloat(e.cost) || 0;

    const rec = byVehYear[key] ||= {
      vehicle: e.vehicle, year: y,
      minOdo: odo, maxOdo: odo, totalCost: 0
    };
    rec.minOdo = Math.min(rec.minOdo, odo);
    rec.maxOdo = Math.max(rec.maxOdo, odo);
    rec.totalCost += cost;
  });

  Object.values(byVehYear).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.vehicle}</td>
      <td>${r.year}</td>
      <td>${(r.maxOdo - r.minOdo).toLocaleString()}</td>
      <td>₱${r.totalCost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Generate all charts
function renderCharts(data) {
  const destCount = {}, fuelPerVeh = {}, deliveriesPerMonth = {}, catSummary = {};
  const entriesByVeh = {};

  data.forEach(e => {
    const date = new Date(e.start);
    if (isNaN(date)) return;
    const m = date.getMonth();
    const keyM = MONTHS[m];
    deliveriesPerMonth[keyM] = (deliveriesPerMonth[keyM]||0) +1;

    const cat = e.destination || "Unknown";
    destCount[cat] = (destCount[cat]||0)+1;
    catSummary[cat] = (catSummary[cat]||0)+1;

    entriesByVeh[e.vehicle] = entriesByVeh[e.vehicle]||[];
    entriesByVeh[e.vehicle].push(e);

    if (e.type && e.type.toLowerCase()==="fuel") {
      const c = parseFloat(e.cost)||0;
      fuelPerVeh[e.vehicle] = (fuelPerVeh[e.vehicle]||0)+c;
    }
  });

  // Chart helpers
  function drawPie(id, labels, dataArr) {
    const ctx = document.getElementById(id)?.getContext("2d");
    if (!ctx) return;
    new Chart(ctx, { type:"pie", data:{ labels, datasets:[{data:dataArr}] } });
  }
  function drawBar(id, labels, dataArr) {
    const ctx = document.getElementById(id)?.getContext("2d");
    if (!ctx) return;
    new Chart(ctx, { type:"bar", data:{ labels, datasets:[{ data: dataArr }] } });
  }
  function drawLine(id, labels, dataArr) {
    const ctx = document.getElementById(id)?.getContext("2d");
    if (!ctx) return;
    new Chart(ctx, { type:"line", data:{ labels, datasets:[{ data: dataArr }] } });
  }

  drawPie("destinationGraph", Object.keys(destCount), Object.values(destCount));
  drawBar("fuelGraph", Object.keys(fuelPerVeh), Object.values(fuelPerVeh));
  drawLine("deliveryGraph",
    MONTHS.filter(m=>deliveriesPerMonth[m]),
    MONTHS.map(m=>deliveriesPerMonth[m]||0)
  );
  drawBar("locationSummaryGraph",
    Object.keys(catSummary), Object.values(catSummary)
  );
}
