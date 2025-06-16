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
    const KM_RATE = 5.00; // realistic cost per kilometer

    const monthlyCosts = {};
    const yearlyCosts = {};
    const vehicleEntries = {};

    // Group entries per vehicle
    logisticsData.forEach(entry => {
        if (!vehicleEntries[entry.vehicle]) vehicleEntries[entry.vehicle] = [];
        vehicleEntries[entry.vehicle].push(entry);
    });

    // Process each vehicle’s entries
    Object.keys(vehicleEntries).forEach(vehicle => {
        const entries = vehicleEntries[vehicle];

        // Sort entries by date ascending
        entries.sort((a, b) => new Date(a.start) - new Date(b.start));
        let prevOdo = null;

        entries.forEach(entry => {
            const date = new Date(entry.start);
            const month = date.toLocaleString('default', { month: 'short' }); // e.g. May
            const year = date.getFullYear();
            const odoReading = Number(entry.odometer);

            if (isNaN(odoReading)) return;

            if (prevOdo !== null && odoReading > prevOdo) {
                const distance = odoReading - prevOdo;
                const cost = distance * KM_RATE;

                // Monthly calculation
                if (!monthlyCosts[vehicle]) monthlyCosts[vehicle] = {};
                if (!monthlyCosts[vehicle][month]) monthlyCosts[vehicle][month] = { odometer: 0, cost: 0 };
                monthlyCosts[vehicle][month].odometer += distance;
                monthlyCosts[vehicle][month].cost += cost;

                // Yearly calculation
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

// Function to populate cost tables in the UI
function populateCostTables(logisticsData) {
    const { monthlyCosts, yearlyCosts } = calculateCosts(logisticsData);

    const monthlyTableBody = document.querySelector("#monthlyCostTable tbody");
    const yearlyTableBody = document.querySelector("#yearlyCostTable tbody");

    monthlyTableBody.innerHTML = '';
    yearlyTableBody.innerHTML = '';

    // Populate monthly cost table
    Object.keys(monthlyCosts).forEach(vehicle => {
        Object.keys(monthlyCosts[vehicle]).forEach(month => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle}</td>
                <td>${month}</td>
                <td>${monthlyCosts[vehicle][month].odometer}</td>
                <td>${monthlyCosts[vehicle][month].cost.toFixed(2)}</td>
            `;
            monthlyTableBody.appendChild(row);
        });
    });

    // Populate yearly cost table
    Object.keys(yearlyCosts).forEach(vehicle => {
        Object.keys(yearlyCosts[vehicle]).forEach(year => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle}</td>
                <td>${year}</td>
                <td>${yearlyCosts[vehicle][year].odometer}</td>
                <td>${yearlyCosts[vehicle][year].cost.toFixed(2)}</td>
            `;
            yearlyTableBody.appendChild(row);
        });
    });
}

// Function to generate destination, delivery, and fuel charts
function generateCharts(logisticsData) {
    const destinations = {};
    const deliveryCounts = {};
    const fuelConsumption = {};

    logisticsData.forEach(entry => {
        const destination = entry.destination || 'Unknown';
        const vehicle = entry.vehicle || 'Unknown';
        const date = new Date(entry.start);
        const month = date.toLocaleString('default', { month: 'short' });

        // Destination counts
        destinations[destination] = (destinations[destination] || 0) + 1;

        // Monthly delivery count
        deliveryCounts[month] = (deliveryCounts[month] || 0) + 1;

        // Simulated fuel usage (placeholder: 5 liters per trip)
        fuelConsumption[vehicle] = (fuelConsumption[vehicle] || 0) + 5;
    });

    // Pie Chart: Destinations
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

    // Bar Chart: Fuel Consumption
    new Chart(document.getElementById('fuelGraph').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(fuelConsumption),
            datasets: [{
                label: 'Fuel Consumption (liters)',
                data: Object.values(fuelConsumption),
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
}

// Main runner on page load
document.addEventListener("DOMContentLoaded", async () => {
    const logisticsData = await fetchLogisticsData();
    populateCostTables(logisticsData);
    generateCharts(logisticsData);
});
