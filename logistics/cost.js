// Fetch and process logistics data from external JSON
async function fetchLogisticsData() {
    try {
        const response = await fetch('https://zaintjude.github.io/prime/logistics/logistics.json');
        if (!response.ok) throw new Error('Failed to fetch logistics data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching logistics data:', error);
        return [];
    }
}

// Function to calculate monthly and yearly odometer distance differences
function calculateCosts(logisticsData) {
    const KM_RATE = 5.00; // cost per kilometer
    const monthlyCosts = {};
    const yearlyCosts = {};
    const vehicleEntries = {};

    logisticsData.forEach(entry => {
        if (!vehicleEntries[entry.vehicle]) vehicleEntries[entry.vehicle] = [];
        vehicleEntries[entry.vehicle].push(entry);
    });

    Object.keys(vehicleEntries).forEach(vehicle => {
        const entries = vehicleEntries[vehicle];
        entries.sort((a, b) => new Date(a.start) - new Date(b.start));
        let prevOdo = null;

        entries.forEach(entry => {
            const date = new Date(entry.start);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const odoReading = Number(entry.odometer);

            if (isNaN(odoReading)) return;

            if (prevOdo !== null && odoReading > prevOdo) {
                const distance = odoReading - prevOdo;
                const cost = distance * KM_RATE;

                // Monthly
                if (!monthlyCosts[vehicle]) monthlyCosts[vehicle] = {};
                if (!monthlyCosts[vehicle][month]) monthlyCosts[vehicle][month] = { odometer: 0, cost: 0 };
                monthlyCosts[vehicle][month].odometer += distance;
                monthlyCosts[vehicle][month].cost += cost;

                // Yearly
                if (!yearlyCosts[vehicle]) yearlyCosts[vehicle] = {};
                if (!yearlyCosts[vehicle][year]) yearlyCosts[vehicle][year] = { odometer: 0, cost: 0 };
                yearlyCosts[vehicle][year].odometer += distance;
                yearlyCosts[vehicle][year].cost += cost;
            }

            prevOdo = odoReading;
        });
    });

    return { monthlyCosts, yearlyCosts };
}

// Function to map destination strings to location categories
// Function to map destination strings to location categories
function mapToLocationCategory(dest) {
    const d = dest.toLowerCase();

    if (d.includes('echavez')) return 'ECHAVEZ';
    if (d.includes('atlas')) return 'ATLAS';
    if (d.includes('naga')) return 'NAGA';
    if (d.includes('mandani')) return 'MANDANI';
    if (d.includes('makoto')) return 'MAKOTO';
    if (d.includes('carbon')) return 'CARBON';
    if (d.includes('vic')) return 'VIC';
    if (d.includes('city clou')) return 'CITY CLOU';
    if (d.includes('chonghua') || d.includes('chong hua')) return 'CHONG HUA';
    if (d.includes('new city')) return 'NEW CITY';
    if (d.includes('lapulapu') || d.includes('liloan') || d.includes('talisay') || d.includes('mandaue')) return 'CEBU AREA';

    return 'OTHER';
}


// Populate UI tables for monthly/yearly costs with optional filters
function populateCostTables(logisticsData, monthFilter = '', yearFilter = '') {
    const { monthlyCosts, yearlyCosts } = calculateCosts(logisticsData);

    const monthlyTableBody = document.querySelector("#monthlyCostTable tbody");
    const yearlyTableBody = document.querySelector("#yearlyCostTable tbody");

    monthlyTableBody.innerHTML = '';
    yearlyTableBody.innerHTML = '';

    Object.keys(monthlyCosts).forEach(vehicle => {
        Object.keys(monthlyCosts[vehicle]).forEach(month => {
            if (month.toLowerCase().includes(monthFilter.toLowerCase())) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vehicle}</td>
                    <td>${month}</td>
                    <td>${monthlyCosts[vehicle][month].odometer}</td>
                    <td>${monthlyCosts[vehicle][month].cost.toFixed(2)}</td>
                `;
                monthlyTableBody.appendChild(row);
            }
        });
    });

    Object.keys(yearlyCosts).forEach(vehicle => {
        Object.keys(yearlyCosts[vehicle]).forEach(year => {
            if (year.toString().includes(yearFilter)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vehicle}</td>
                    <td>${year}</td>
                    <td>${yearlyCosts[vehicle][year].odometer}</td>
                    <td>${yearlyCosts[vehicle][year].cost.toFixed(2)}</td>
                `;
                yearlyTableBody.appendChild(row);
            }
        });
    });
}

// Generate charts including destination category summary
function generateCharts(logisticsData) {
    const destinations = {};
    const deliveryCounts = {};
    const vehicleFuel = {};
    const locationSummary = {};
    const KM_PER_LITER = 8;

    const vehicleEntries = {};

    logisticsData.forEach(entry => {
        const vehicle = entry.vehicle || 'Unknown';
        if (!vehicleEntries[vehicle]) vehicleEntries[vehicle] = [];
        vehicleEntries[vehicle].push(entry);

        const destination = entry.destination || 'Unknown';
        destinations[destination] = (destinations[destination] || 0) + 1;

        const locationCategory = mapToLocationCategory(destination);
        locationSummary[locationCategory] = (locationSummary[locationCategory] || 0) + 1;

        const date = new Date(entry.start);
        const month = date.toLocaleString('default', { month: 'short' });
        deliveryCounts[month] = (deliveryCounts[month] || 0) + 1;
    });

    // Fuel estimate per vehicle
    Object.keys(vehicleEntries).forEach(vehicle => {
        const entries = vehicleEntries[vehicle];
        entries.sort((a, b) => new Date(a.start) - new Date(b.start));
        let prevOdo = null;

        entries.forEach(entry => {
            const odo = Number(entry.odometer);
            if (isNaN(odo)) return;

            if (prevOdo !== null && odo > prevOdo) {
                const distance = odo - prevOdo;
                const fuelUsed = distance / KM_PER_LITER;
                vehicleFuel[vehicle] = (vehicleFuel[vehicle] || 0) + fuelUsed;
            }

            prevOdo = odo;
        });
    });

    // Pie Chart: Raw Destinations
    new Chart(document.getElementById('destinationGraph').getContext('2d'), {
        type: 'pie',
        data: {
            labels: Object.keys(destinations),
            datasets: [{
                data: Object.values(destinations),
                backgroundColor: ['#FF6347', '#4CAF50', '#FFEB3B', '#00BCD4', '#2196F3', '#FF9800']
            }]
        }
    });

    // Bar Chart: Estimated Fuel
    new Chart(document.getElementById('fuelGraph').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(vehicleFuel),
            datasets: [{
                label: 'Estimated Fuel Consumption (liters)',
                data: Object.values(vehicleFuel).map(val => parseFloat(val.toFixed(2))),
                backgroundColor: '#FF5733'
            }]
        }
    });

    // Line Chart: Deliveries per Month
    new Chart(document.getElementById('deliveryGraph').getContext('2d'), {
        type: 'line',
        data: {
            labels: Object.keys(deliveryCounts),
            datasets: [{
                label: 'Deliveries',
                data: Object.values(deliveryCounts),
                borderColor: '#4CAF50',
                backgroundColor: '#C8E6C9',
                fill: true,
                tension: 0.2
            }]
        }
    });

    // NEW: Bar Chart for Summary by Location Category
    new Chart(document.getElementById('locationSummaryGraph').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(locationSummary),
            datasets: [{
                label: 'Deliveries by Location Category',
                data: Object.values(locationSummary),
                backgroundColor: '#42A5F5'
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Add listeners to filter inputs
function setupFilters(logisticsData) {
    const monthInput = document.getElementById('monthFilter');
    const yearInput = document.getElementById('yearFilter');

    monthInput.addEventListener('input', () => {
        populateCostTables(logisticsData, monthInput.value.trim(), yearInput.value.trim());
    });

    yearInput.addEventListener('input', () => {
        populateCostTables(logisticsData, monthInput.value.trim(), yearInput.value.trim());
    });
}

// Initialize everything
document.addEventListener("DOMContentLoaded", async () => {
    const logisticsData = await fetchLogisticsData();
    populateCostTables(logisticsData);
    generateCharts(logisticsData);
    setupFilters(logisticsData);
});
