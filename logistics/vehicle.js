let vehicles = [];
let drivers = [];

function addVehicle() {
    const vehicleName = document.getElementById('vehicleName').value.trim();
    const plateNumber = document.getElementById('plateNumber').value.trim();
    if (vehicleName && plateNumber) {
        vehicles.push({ vehicleName, plateNumber });
        displayVehicles();
        saveData();
        document.getElementById('vehicleName').value = '';
        document.getElementById('plateNumber').value = '';
    }
}

function addDriver() {
    const driverName = document.getElementById('driverName').value.trim();
    if (driverName) {
        drivers.push({ driverName });
        displayDrivers();
        saveData();
        document.getElementById('driverName').value = '';
    }
}

function displayVehicles() {
    const tbody = document.querySelector('#vehicleTable tbody');
    tbody.innerHTML = '';
    vehicles.forEach((vehicle, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td contenteditable="true" onblur="updateVehicle(${index}, 'vehicleName', this.innerText)">${vehicle.vehicleName}</td>
            <td contenteditable="true" onblur="updateVehicle(${index}, 'plateNumber', this.innerText)">${vehicle.plateNumber}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayDrivers() {
    const tbody = document.querySelector('#driverTable tbody');
    tbody.innerHTML = '';
    drivers.forEach((driver, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td contenteditable="true" onblur="updateDriver(${index}, this.innerText)">${driver.driverName}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateVehicle(index, key, value) {
    vehicles[index][key] = value.trim();
    saveData();
}

function updateDriver(index, value) {
    drivers[index].driverName = value.trim();
    saveData();
}

function saveData() {
    fetch('vehicle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicles, drivers })
    })
    .then(response => response.text())
    .then(msg => console.log('Data saved:', msg))
    .catch(err => console.error('Save error:', err));
}

// Load saved data on page load
window.onload = function () {
    fetch('vehicle.json')
        .then(response => response.json())
        .then(data => {
            vehicles = data.vehicles || [];
            drivers = data.drivers || [];
            displayVehicles();
            displayDrivers();
        })
        .catch(error => console.error('Error loading data:', error));
};
