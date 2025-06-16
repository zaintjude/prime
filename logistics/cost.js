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
    const monthlyCosts = {};
    const yearlyCosts = {};
    const vehicleEntries = {};

    logisticsData.forEach(entry => {
        if (!vehicleEntries[entry.vehicle]) vehicleEntries[entry.vehicle] = [];
        vehicleEntries[entry.vehicle].push(entry);
    });

    Object.keys(vehicleEntries).forEach(vehicle => {
        vehicleEntries[vehicle].sort((a, b) => new Date(a.start) - new Date(b.start));
        let prevOdo = null;

        vehicleEntries[vehicle].forEach(entry => {
            const date = new Date(entry.start);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const odoReading = entry.odometer;

            if (prevOdo !== null && odoReading > prevOdo) {
                const distance = odoReading - prevOdo;
                const cost = distance * 0.05;

                if (!monthlyCosts[vehicle]) monthlyCosts[vehicle] = {};
                if (!monthlyCosts[vehicle][month]) monthlyCosts[vehicle][month] = { odometer: 0, cost: 0 };
                monthlyCosts[vehicle][month].odometer += distance;
                monthlyCosts[vehicle][month].cost += cost;

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

function populateCostTables(logisticsData) {
    const { monthlyCosts, yearlyCosts } = calculateCosts(logisticsData);

    const monthlyTableBody = document.querySelector("#monthlyCostTable tbody");
    const yearlyTableBody = document.querySelector("#yearlyCostTable tbody");

    monthlyTableBody.innerHTML = '';
    yearlyTableBody.innerHTML = '';

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

function generateCharts(logisticsData) {
    const destinations = {};
    const deliveryCounts = {};
    const fuelConsumption = {};

    logisticsData.forEach(entry => {
        const destination = entry.destination;
        destinations[destination] = (destinations[destination] || 0) + 1;

        const date = new Date(entry.start);
        const month = date.getMonth() + 1;
        deliveryCounts[month] = (deliveryCounts[month] || 0) + 1;

        fuelConsumption[entry.vehicle] = (fuelConsumption[entry.vehicle] || 0) + 5; // placeholder
    });

    const ctx1 = document.getElementById('destinationGraph').getContext('2d');
    new Chart(ctx1, {
        type: 'pie',
        data: {
            labels: Object.keys(destinations),
            datasets: [{
                data: Object.values(destinations),
                backgroundColor: ['#FF6347', '#4CAF50', '#FFEB3B', '#00BCD4']
            }]
        }
    });

    const ctx2 = document.getElementById('fuelGraph').getContext('2d');
    new Chart(ctx2, {
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

    const ctx3 = document.getElementById('deliveryGraph').getContext('2d');
    new Chart(ctx3, {
        type: 'line',
        data: {
            labels: Object.keys(deliveryCounts),
            datasets: [{
                label: 'Deliveries',
                data: Object.values(deliveryCounts),
                borderColor: '#4CAF50',
                fill: false
            }]
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const logisticsData = await fetchLogisticsData();
    populateCostTables(logisticsData);
    generateCharts(logisticsData);
});
