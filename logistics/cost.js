document.addEventListener("DOMContentLoaded", () => {
  fetch("https://zaintjude.github.io/prime/logistics/logistics.json")
    .then(res => res.json())
    .then(data => {
      setupFilters(data);
      populateMonthlyTable(data);
      populateYearlyTable(data);
      generateCharts(data);
    })
    .catch(err => console.error("Fetch error:", err));
});

// — Monthly Cost Table
function populateMonthlyTable(data, selMonth = "", selYear = "") {
  const tbody = document.querySelector("#monthlyCostTable tbody");
  tbody.innerHTML = "";

  const summary = {};

  data.forEach(e => {
    if (!e.start || isNaN(new Date(e.start))) return;
    const d = new Date(e.start);
    const month = d.toLocaleString("default", { month: "long" });
    const year = d.getFullYear().toString();
    if (selMonth && month !== selMonth) return;
    if (selYear && year !== selYear) return;

    const key = `${e.vehicle}-${month}-${year}`;
    const cost = parseFloat(e.cost) || 0;
    const odo = parseFloat(e.odometer) || 0;

    summary[key] ??= { vehicle: e.vehicle, month, year, totalCost: 0, latestOdo: 0, latestDate: new Date(0) };
    summary[key].totalCost += cost;

    if (d > summary[key].latestDate) {
      summary[key].latestDate = d;
      summary[key].latestOdo = odo;
    }
  });

  Object.values(summary).forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.vehicle}</td>
      <td>${item.month} ${item.year}</td>
      <td>${item.latestOdo.toLocaleString()}</td>
      <td>₱${item.totalCost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// — Yearly Cost Table
function populateYearlyTable(data) {
  const tbody = document.querySelector("#yearlyCostTable tbody");
  tbody.innerHTML = "";

  const summary = {};

  data.forEach(e => {
    if (!e.start || isNaN(new Date(e.start))) return;
    const d = new Date(e.start);
    const year = d.getFullYear().toString();
    const key = `${e.vehicle}-${year}`;
    const cost = parseFloat(e.cost) || 0;
    const odo = parseFloat(e.odometer) || 0;

    summary[key] ??= { vehicle: e.vehicle, year, totalCost: 0, latestOdo: 0, latestDate: new Date(0) };
    summary[key].totalCost += cost;

    if (d > summary[key].latestDate) {
      summary[key].latestDate = d;
      summary[key].latestOdo = odo;
    }
  });

  Object.values(summary).forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.vehicle}</td>
      <td>${item.year}</td>
      <td>${item.latestOdo.toLocaleString()}</td>
      <td>₱${item.totalCost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// — Setup Month & Year Filters
function setupFilters(data) {
  const mSel = document.getElementById("monthFilter");
  const yInp = document.getElementById("yearFilter");
  const months = new Set(), years = new Set();

  data.forEach(e => {
    if (!e.start) return;
    const d = new Date(e.start);
    if (isNaN(d)) return;
    months.add(d.toLocaleString("default", { month: "long" }));
    years.add(d.getFullYear().toString());
  });

  const cal = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  Array.from(months).sort((a,b)=>cal.indexOf(a)-cal.indexOf(b)).forEach(m => {
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    mSel.appendChild(opt);
  });

  yInp.setAttribute("list", "yearList");
  const dList = document.createElement("datalist");
  dList.id = "yearList";
  Array.from(years).sort().forEach(y => {
    const o = document.createElement("option");
    o.value = y; dList.appendChild(o);
  });
  document.body.appendChild(dList);

  // Trigger updates
  const update = () => {
    populateMonthlyTable(data, mSel.value, yInp.value.trim());
    populateYearlyTable(data);
  };
  mSel.addEventListener("change", update);
  yInp.addEventListener("input", update);
}

// — Generate Charts (implement based on your existing chart logic)
function generateCharts(data) {
  // existing code for destinationGraph, fuelGraph, deliveryGraph, locationSummaryGraph
}
