let logs = [];

window.onload = async function () {
    await loadLogs();
    await loadVehicles();
    populateFilters();
    displayLogs();
};

async function loadVehicles() {
    const res = await fetch("https://dashproduction.x10.mx/masterfile/prime/logistics/vehicle.json");
    const data = await res.json();
    const vehicleList = data.vehicles.map(v => v.vehicleName);

    const vehicleSelects = [document.getElementById("vehicle"), document.getElementById("filterVehicle")];
    vehicleSelects.forEach(select => {
        vehicleList.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            select.appendChild(opt.cloneNode(true));
        });
    });
}

async function loadLogs() {
    const res = await fetch("log.json");
    logs = await res.json();
}

function saveLogs() {
    fetch('log.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs)
    });
}

function addLog() {
    const vehicle = document.getElementById("vehicle").value;
    const poNumber = document.getElementById("poNumber").value.trim();
    const type = document.getElementById("type").value.trim();
    const description = document.getElementById("description").value.trim();
    const cost = parseFloat(document.getElementById("cost").value.trim());
    const date = new Date().toISOString().split('T')[0];

    if (!vehicle || !type || !description || isNaN(cost)) return alert("Fill in all fields.");

    logs.push({ date, poNumber, vehicle, type, description, cost });
    saveLogs();
    displayLogs();
    clearFields();
}

function clearFields() {
    document.getElementById("vehicle").value = "";
    document.getElementById("poNumber").value = "";
    document.getElementById("type").value = "";
    document.getElementById("description").value = "";
    document.getElementById("cost").value = "";
}

function displayLogs(filtered = null) {
    const tbody = document.querySelector("#logTable tbody");
    tbody.innerHTML = "";
    let totalFuelCost = 0;
    const data = filtered || logs;

    data.forEach((log, i) => {
        const dateObj = new Date(log.date);
        const month = dateObj.toLocaleString("default", { month: "long" });
        const year = dateObj.getFullYear();

        if (log.type.toLowerCase() === "fuel") {
            totalFuelCost += parseFloat(log.cost || 0);
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td contenteditable onblur="editCell(${i}, 'date', this.innerText)">${log.date}</td>
            <td>${month}</td>
            <td>${year}</td>
            <td contenteditable onblur="editCell(${i}, 'poNumber', this.innerText)">${log.poNumber || ''}</td>
            <td contenteditable onblur="editCell(${i}, 'vehicle', this.innerText)">${log.vehicle}</td>
            <td contenteditable onblur="editCell(${i}, 'type', this.innerText)">${log.type}</td>
            <td contenteditable onblur="editCell(${i}, 'description', this.innerText)">${log.description}</td>
            <td contenteditable onblur="editCell(${i}, 'cost', this.innerText)">${parseFloat(log.cost).toFixed(2)}</td>
            <td><button onclick="deleteLog(${i})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById("totalCost").innerText = totalFuelCost.toFixed(2);
}

function editCell(index, field, value) {
    if (field === "cost") value = parseFloat(value) || 0;
    logs[index][field] = value;
    saveLogs();
    displayLogs(applyFilters());
}

function deleteLog(index) {
    logs.splice(index, 1);
    saveLogs();
    displayLogs();
}

function populateFilters() {
    const yearSet = new Set(logs.map(log => new Date(log.date).getFullYear()));
    const filterYear = document.getElementById("filterYear");

    yearSet.forEach(year => {
        const opt = document.createElement("option");
        opt.value = year;
        opt.textContent = year;
        filterYear.appendChild(opt);
    });
}

function filterLogs() {
    const filtered = applyFilters();
    displayLogs(filtered);
}

function applyFilters() {
    const vehicle = document.getElementById("filterVehicle").value;
    const year = document.getElementById("filterYear").value;
    const month = document.getElementById("filterMonth").value;

    return logs.filter(log => {
        const d = new Date(log.date);
        const logMonth = String(d.getMonth() + 1).padStart(2, '0');
        const logYear = d.getFullYear();
        return (!vehicle || log.vehicle === vehicle) &&
               (!year || logYear == year) &&
               (!month || logMonth === month);
    });
}
