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

// Calculate monthly and yearly odometer distance differences
function calculateCosts(logisticsData) {
    const KM_RATE = 5.00;
    const monthlyCosts = {};
    const yearlyCosts = {};
    const vehicleEntries = {};

    logisticsData.forEach(entry => {
        if (!vehicleEntries[entry.vehicle]) vehicleEntries[entry.vehicle] = [];
        vehicleEntries[entry.vehicle].push(entry);
    });

    for (const vehicle in vehicleEntries) {
        const entries = vehicleEntries[vehicle].sort((a, b) => new Date(a.start) - new Date(b.start));
        let prevOdo = null;

        entries.forEach(entry => {
            const date = new Date(entry.start);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const odo = parseFloat(entry.odometer);

            if (isNaN(odo)) return;

            if (prevOdo !== null && odo > prevOdo) {
                const distance = odo - prevOdo;
                const cost = distance * KM_RATE;

                // Monthly
                monthlyCosts[vehicle] ??= {};
                monthlyCosts[vehicle][month] ??= { odometer: 0, cost: 0 };
                monthlyCosts[vehicle][month].odometer += distance;
                monthlyCosts[vehicle][month].cost += cost;

                // Yearly
                yearlyCosts[vehicle] ??= {};
                yearlyCosts[vehicle][year] ??= { odometer: 0, cost: 0 };
                yearlyCosts[vehicle][year].odometer += distance;
                yearlyCosts[vehicle][year].cost += cost;
            }

            prevOdo = odo;
        });
    }

    return { monthlyCosts, yearlyCosts };
}

// Map destination strings to location categories
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

// Populate UI tables for monthly/yearly costs
function populateCostTables(logisticsData, monthFilter = '', yearFilter = '') {
    const { monthlyCosts, yearlyCosts } = calculateCosts(logisticsData);
    const monthlyTable = document.querySelector("#monthlyCostTable tbody");
    const yearlyTable = document.querySelector("#yearlyCostTable tbody");

    monthlyTable.innerHTML = '';
    yearlyTable.innerHTML = '';

    for (const vehicle in monthlyCosts) {
        for (const month in monthlyCosts[vehicle]) {
            if (month.toLowerCase().includes(monthFilter.toLowerCase())) {
                const data = monthlyCosts[vehicle][month];
                monthlyTable.innerHTML += `
                    <tr>
                        <td>${vehicle}</td>
                        <td>${month}</td>
                        <td>${data.odometer}</td>
                        <td>${data.cost.toFixed(2)}</td>
                    </tr>`;
            }
        }
    }

    for (const vehicle in yearlyCosts) {
        for (const year in yearlyCosts[vehicle]) {
            if (year.includes(yearFilter)) {
                const data = yearlyCosts[vehicle][year];
                yearlyTable.innerHTML += `
                    <tr>
                        <td>${vehicle}</td>
                        <td>${year}</td>
                        <td>${data.odometer}</td>
                        <td>${data.cost.toFixed(2)}</td>
                    </tr>`;
            }
        }
    }
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
        const destination = entry.destination || 'Unknown';
        const date = new Date(entry.start);
        const month = date.toLocaleString('default', { month: 'short' });

        vehicleEntries[vehicle] ??= [];
        vehicleEntries[vehicle].push(entry);

        destinations[destination] = (destinations[destination] || 0) + 1;
        deliveryCounts[month] = (deliveryCounts[month] || 0) + 1;

        const category = mapToLocationCategory(destination);
        locationSummary[category] = (locationSummary[category] || 0) + 1;
    });

    for (const vehicle in vehicleEntries) {
        const entries = vehicleEntries[vehicle].sort((a, b) => new Date(a.start) - new Date(b.start));
        let prevOdo = null;

        entries.forEach(entry => {
            const odo = parseFloat(entry.odometer);
            if (isNaN(odo)) return;

            if (prevOdo !== null && odo > prevOdo) {
                const distance = odo - prevOdo;
                const fuel = distance / KM_PER_LITER;
                vehicleFuel[vehicle] = (vehicleFuel[vehicle] || 0) + fuel;
            }

            prevOdo = odo;
        });
    }

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

    new Chart(document.getElementById('fuelGraph').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(vehicleFuel),
            datasets: [{
                label: 'Estimated Fuel Consumption (liters)',
                data: Object.values(vehicleFuel).map(f => +f.toFixed(2)),
                backgroundColor: '#FF5733'
            }]
        }
    });

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

// Attach filter listeners
function setupFilters(logisticsData) {
    const monthInput = document.getElementById('monthFilter');
    const yearInput = document.getElementById('yearFilter');

    const updateTables = () => {
        const month = monthInput.value.trim();
        const year = yearInput.value.trim();
        populateCostTables(logisticsData, month, year);
    };

    monthInput.addEventListener('input', updateTables);
    yearInput.addEventListener('input', updateTables);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
    const logisticsData = await fetchLogisticsData();
    populateCostTables(logisticsData);
    generateCharts(logisticsData);
    setupFilters(logisticsData);
});
