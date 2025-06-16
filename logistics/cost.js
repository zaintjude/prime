// Declare chart instance variables globally
let destinationChart = null;
let fuelChart = null;
let deliveryChart = null;
let locationChart = null;

document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetch("https://zaintjude.github.io/prime/logistics/logistics.json")
    .then(r => r.json())
    .catch(err => { console.error(err); return []; });

  const monthInput = document.getElementById("monthFilter");
  const yearInput = document.getElementById("yearFilter");

  const yearList = new Set(data.map(e => new Date(e.start).getFullYear()));
  yearInput.setAttribute("list", "yearList");
  const dl = document.createElement("datalist"); dl.id = "yearList";
  [...yearList].sort().forEach(y => dl.innerHTML += `<option>${y}</option>`);
  document.body.appendChild(dl);

  function update() {
    const m = monthInput.value.trim();
    const y = yearInput.value.trim();
    renderMonthly(data, m, y);
    renderYearly(data, y);
    renderCharts(data);
  }

  monthInput.addEventListener("input", update);
  yearInput.addEventListener("input", update);
  update();
});

const MONTHS = [...Array(12).keys()].map(i =>
  new Date(0, i).toLocaleString("default", { month: "long" })
);

const FUEL_RATE = {
  diesel: 60,
  gasoline: 65
};

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

    const rec = byVehMonth[key] ||= {
      vehicle: e.vehicle, month: m, year: y,
      minOdo: odo, maxOdo: odo, type: e.fuel?.toLowerCase() || "diesel"
    };
    rec.minOdo = Math.min(rec.minOdo, odo);
    rec.maxOdo = Math.max(rec.maxOdo, odo);
  });

  Object.values(byVehMonth).forEach(r => {
    const distance = r.maxOdo - r.minOdo;
    const rate = FUEL_RATE[r.type] || FUEL_RATE["diesel"];
    const cost = distance * rate;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.vehicle}</td>
      <td>${r.month} ${r.year}</td>
      <td>${distance.toLocaleString()}</td>
      <td>₱${cost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderYearly(data, yearFilter) {
  const tbody = document.getElementById("yearlyCostTable").querySelector("tbody");
  tbody.innerHTML = "";

  const byVehYear = {};

  data.forEach(e => {
    const date = new Date(e.start);
    if (isNaN(date)) return;
    const y = date.getFullYear();
    if (yearFilter && String(y) !== yearFilter) return;

    const key = `${e.vehicle}||${y}`;
    const odo = parseFloat(e.odometer) || 0;

    const rec = byVehYear[key] ||= {
      vehicle: e.vehicle, year: y,
      minOdo: odo, maxOdo: odo, type: e.fuel?.toLowerCase() || "diesel"
    };
    rec.minOdo = Math.min(rec.minOdo, odo);
    rec.maxOdo = Math.max(rec.maxOdo, odo);
  });

  Object.values(byVehYear).forEach(r => {
    const distance = r.maxOdo - r.minOdo;
    const rate = FUEL_RATE[r.type] || FUEL_RATE["diesel"];
    const cost = distance * rate;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.vehicle}</td>
      <td>${r.year}</td>
      <td>${distance.toLocaleString()}</td>
      <td>₱${cost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCharts(data) {
  const destCount = {}, fuelPerVeh = {}, deliveriesPerMonth = {}, catSummary = {};

  data.forEach(e => {
    const date = new Date(e.start);
    if (isNaN(date)) return;
    const month = MONTHS[date.getMonth()];
    deliveriesPerMonth[month] = (deliveriesPerMonth[month] || 0) + 1;

    const dest = e.destination || "Unknown";
    destCount[dest] = (destCount[dest] || 0) + 1;
    catSummary[dest] = (catSummary[dest] || 0) + 1;

    const vehicle = e.vehicle;
    const fuelType = e.fuel?.toLowerCase() || "diesel";
    const rate = FUEL_RATE[fuelType] || FUEL_RATE["diesel"];
    fuelPerVeh[vehicle] = (fuelPerVeh[vehicle] || 0) + rate;
  });

  destinationChart = drawChart(destinationChart, "destinationGraph", "pie", Object.keys(destCount), Object.values(destCount));
  fuelChart = drawChart(fuelChart, "fuelGraph", "bar", Object.keys(fuelPerVeh), Object.values(fuelPerVeh));
  deliveryChart = drawChart(deliveryChart, "deliveryGraph", "line",
    MONTHS.filter(m => deliveriesPerMonth[m]),
    MONTHS.map(m => deliveriesPerMonth[m] || 0)
  );
  locationChart = drawChart(locationChart, "locationSummaryGraph", "bar", Object.keys(catSummary), Object.values(catSummary));
}

function drawChart(chartInstance, canvasId, chartType, labels, dataArr) {
  const ctx = document.getElementById(canvasId)?.getContext("2d");
  if (!ctx) return null;

  if (chartInstance) {
    chartInstance.destroy();
  }

  return new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: canvasId.replace(/Graph/i, ""),
        data: dataArr,
        backgroundColor: [
          "#3498db", "#2ecc71", "#f1c40f", "#e74c3c",
          "#9b59b6", "#1abc9c", "#e67e22", "#34495e"
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
