const RATE = 60;
const MONTHS = [...Array(12)].map((_,i)=>
  new Date(0,i).toLocaleString('default',{month:'long'})
);

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
  { keyword: "MANDANI", category: "MANDANI" },
  { keyword: "HT LAND", category: "HT LAND" },
  { keyword: "NAGA", category: "NAGA" },
  { keyword: "TREASURE ISLAND", category: "TREASURE ISLAND" },
  { keyword: "KNOWLES", category: "KNOWLES" },
  { keyword: "INSTALL", category: "OTHER" },
];

function getCategory(dest="") {
  const d = dest.toUpperCase();
  for (const {keyword,category} of destinationCategories){
    if(d.includes(keyword)) return category;
  }
  return "OTHER";
}

document.addEventListener("DOMContentLoaded", async() => {
  const data = await fetch('https://zaintjude.github.io/prime/logistics/logistics.json')
  .then(r=>r.ok?r.json():[])
  .catch(()=>[]);

  const yrs = [...new Set(data.map(e => new Date(e.start).getFullYear()))];
  yrs.sort().forEach(y => {
    document.getElementById("yearList")
      .insertAdjacentHTML("beforeend",`<option value="${y}">`);
  });

  const monthInput = document.getElementById("monthFilter");
  const yearInput = document.getElementById("yearFilter");

  function refresh() {
    const m = monthInput.value.trim();
    const y = yearInput.value.trim();
    updateMonthly(data,m,y);
    updateYearly(data,y);
    updateCategoryReport(data);
    renderCharts(data,m,y);
  }

  monthInput.addEventListener("input", refresh);
  yearInput.addEventListener("input", refresh);

  refresh();
});

function updateMonthly(data,mfilter,yfilter) {
  const tb = document.querySelector("#monthlyTable tbody");
  tb.innerHTML="";
  const summary={};

  data.forEach(e=>{
    const dt=new Date(e.start);
    if(isNaN(dt)) return;
    const mon = MONTHS[dt.getMonth()], yr = dt.getFullYear().toString();
    if(mfilter && mon!==mfilter) return;
    if(yfilter && yr!==yfilter) return;
    const odo=parseFloat(e.odometer);
    if(isNaN(odo)) return;
    const key = `${e.vehicle}|${mon}|${yr}`;
    const rec = summary[key]||(summary[key]={vehicle:e.vehicle,month:mon,year:yr,minO:odo,maxO:odo});
    rec.minO = Math.min(rec.minO,odo);
    rec.maxO = Math.max(rec.maxO,odo);
  });

  Object.values(summary).forEach(r=>{
    const km = r.maxO - r.minO, cost = km * RATE;
    tb.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${r.vehicle}</td>
        <td>${r.month} ${r.year}</td>
        <td>${km.toLocaleString()}</td>
        <td>₱${cost.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
      </tr>`);
  });
}

function updateYearly(data,yfilter){
  const tb = document.querySelector("#yearlyTable tbody");
  tb.innerHTML="";
  const summary={};

  data.forEach(e=>{
    const dt=new Date(e.start);
    if(isNaN(dt)) return;
    const yr = dt.getFullYear().toString();
    if(yfilter && yr!==yfilter) return;
    const odo=parseFloat(e.odometer);
    if(isNaN(odo)) return;
    const key = `${e.vehicle}|${yr}`;
    const rec = summary[key]||(summary[key]={vehicle:e.vehicle,year:yr,minO:odo,maxO:odo});
    rec.minO=Math.min(rec.minO,odo);
    rec.maxO=Math.max(rec.maxO,odo);
  });

  Object.values(summary).forEach(r=>{
    const km=r.maxO-r.minO, cost=km*RATE;
    tb.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${r.vehicle}</td>
        <td>${r.year}</td>
        <td>${km.toLocaleString()}</td>
        <td>₱${cost.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
      </tr>`);
  });
}

function updateCategoryReport(data){
  const counts={};
  data.forEach(e => {
    const cat = getCategory(e.destination);
    counts[cat] = (counts[cat]||0)+1;
  });
  const tb = document.querySelector("#categoryTable tbody");
  tb.innerHTML="";
  Object.entries(counts).forEach(([cat,c])=>{
    tb.insertAdjacentHTML("beforeend",`<tr><td>${cat}</td><td>${c}</td></tr>`);
  });
}

let charts = {};
function renderCharts(data,mfilt,yfilt) {
  const deliveries={}, fuel={}, destCounts={};

  data.forEach(e=>{
    const dt=new Date(e.start);
    if(isNaN(dt)) return;
    const mon = MONTHS[dt.getMonth()];
    if(mfilt && mon!==mfilt) return;
    if(yfilt && dt.getFullYear().toString()!==yfilt) return;
    deliveries[mon] = (deliveries[mon]||0)+1;
    fuel[e.vehicle] = (fuel[e.vehicle]||0)+(parseFloat(e.odometer)||0);
    const cat = getCategory(e.destination);
    destCounts[cat] = (destCounts[cat]||0)+1;
  });

  draw("deliveryChart","bar", MONTHS.map(m=>deliveries[m]||0), MONTHS);
  draw("fuelChart","bar", Object.values(fuel), Object.keys(fuel));
  draw("destinationChart","pie", Object.values(destCounts), Object.keys(destCounts));
}

function draw(id,type,data,labels){
  const ctx = document.getElementById(id).getContext("2d");
  if(charts[id]) charts[id].destroy();
  charts[id] = new Chart(ctx,{type,data:{labels,datasets:[{data,label: id}]}});
}
