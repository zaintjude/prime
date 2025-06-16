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
        vehicleEntries[entry.vehicle] ??= [];
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
                monthlyCosts[vehicle] ??= {};
                monthlyCosts[vehicle][month] ??= { odometer: 0, cost: 0 };
                monthlyCosts[vehicle][month].odometer += distance;
                monthlyCosts[vehicle][month].cost += cost;

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

// Populate UI tables for monthly/yearly costs with filters
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

// Generate charts including a summary by exact destination names
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

        // Split and count each exact location
        const parts = destination.split('/').map(p => p.trim()).filter(p => p.length);
        parts.forEach(loc => {
            locationSummary[loc] = (locationSummary[loc] || 0) + 1;
        });
    });

    // Estimate fuel usage
    for (const vehicle in vehicleEntries) {
        const entries = vehicleEntries[vehicle].sort((a, b) => new Date(a.start) - new Date(b.start));
        let prevOdo = null;

        entries.forEach(entry => {
            const odo = parseFloat(entry.odometer);
            if (isNaN(odo)) return;

            if (prevOdo !== null && odo > prevOdo) {
                const fuel = (odo - prevOdo) / KM_PER_LITER;
                vehicleFuel[vehicle] = (vehicleFuel[vehicle] || 0) + fuel;
            }

            prevOdo = odo;
        });
    }

    new Chart(document.getElementById('destinationGraph').getContext('2d'), {
        type: 'pie',
        data: { labels: Object.keys(destinations), datasets: [{ data: Object.values(destinations), backgroundColor: ['#FF6347','#4CAF50','#FFEB3B','#00BCD4','#2196F3','#FF9800'] }] }
    });

    new Chart(document.getElementById('fuelGraph').getContext('2d'), {
        type: 'bar',
        data: { labels: Object.keys(vehicleFuel), datasets: [{ label: 'Fuel (liters)', data: Object.values(vehicleFuel).map(f => +f.toFixed(2)), backgroundColor: '#FF5733' }] }
    });

    new Chart(document.getElementById('deliveryGraph').getContext('2d'), {
        type: 'line',
        data: { labels: Object.keys(deliveryCounts), datasets: [{ label: 'Deliveries', data: Object.values(deliveryCounts), borderColor: '#4CAF50', backgroundColor: '#C8E6C9', fill: true, tension: 0.2 }] }
    });

    new Chart(document.getElementById('locationSummaryGraph').getContext('2d'), {
        type: 'bar',
        data: { labels: Object.keys(locationSummary), datasets: [{ label: 'Deliveries by Location', data: Object.values(locationSummary), backgroundColor: '#42A5F5' }] },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

// Filter inputs logic
function setupFilters(logisticsData) {
    const monthInput = document.getElementById('monthFilter');
    const yearInput = document.getElementById('yearFilter');

    const updateTables = () => {
        populateCostTables(logisticsData, monthInput.value.trim(), yearInput.value.trim());
    };

    monthInput.addEventListener('input', updateTables);
    yearInput.addEventListener('input', updateTables);
}

// Initialize everything on page load
document.addEventListener("DOMContentLoaded", async () => {
    const logisticsData = await fetchLogisticsData();
    populateCostTables(logisticsData);
    generateCharts(logisticsData);
    setupFilters(logisticsData);
});
