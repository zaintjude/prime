// CATEGORY KEYWORDS FOR DESTINATIONS
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
    { keyword: "MODERNS BEST", category: "MODERNS BEST" },
    { keyword: "TECH SONIC", category: "MAKOTO" },
    { keyword: "MANDANI", category: "MANDANI" },
    { keyword: "HT LAND", category: "HT LAND" },
    { keyword: "LILOAN", category: "LILOAN" },
    { keyword: "NAGA", category: "NAGA" },
    { keyword: "TABUNOK", category: "TABUNOK" },
    { keyword: "MABOLO", category: "MABOLO" },
    { keyword: "EPIC CARGO", category: "EPIC CARGO" },
    { keyword: "KNOWLES", category: "KNOWLES" },
    { keyword: "AIRPORT", category: "AIRPORT" },
    { keyword: "TREASURE ISLAND", category: "TREASURE ISLAND" },
    { keyword: "AP CARGO", category: "AP CARGO" },
    { keyword: "SPAN ASIA", category: "SPAN ASIA" },
    { keyword: "SM", category: "SM" },
    { keyword: "TALISAY", category: "TALISAY" },
    { keyword: "PRIME WORKS", category: "PRIME WORKS" },
    { keyword: "MOTOR TRADE", category: "MAKOTO / MOTOR TRADE" },
    { keyword: "ATLANTIC", category: "ATLANTIC / NEW CITY" },
    { keyword: "KIMA", category: "KIMA / MAKOTO" },
    { keyword: "COLON", category: "MODERNS BEST / COLON" },
    { keyword: "FAMILY HARDWARE", category: "FAMILY HARDWARE / MAKOTO" },
    { keyword: "SAWO", category: "MAKOTO" },
    { keyword: "INSTALL", category: "OTHER" },
    { keyword: "BUYING", category: "OTHER" },
    { keyword: "HARDWARE", category: "OTHER" },
    { keyword: "PICKUP", category: "OTHER" },
    { keyword: "DELIVERY", category: "OTHER" },
    { keyword: "SAMPLE", category: "OTHER" },
    { keyword: "REWORK", category: "OTHER" },
    { keyword: "MEETING", category: "OTHER" },
    { keyword: "SORT", category: "OTHER" },
    { keyword: "ADVANCE", category: "OTHER" },
    { keyword: "CHECK", category: "OTHER" },
    { keyword: "CRITEROPENG", category: "OTHER" },
    { keyword: "POLICE CLEARANCE", category: "OTHER" },
    { keyword: "MANKO", category: "OTHER" },
];

// Match destination string to known category
function getDestinationCategory(destination) {
    destination = destination.toUpperCase();
    for (const entry of destinationCategories) {
        if (destination.includes(entry.keyword)) {
            return entry.category;
        }
    }
    return "OTHER";
}

// Fetch logistics data from external JSON
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

// Populate tables for cost reports
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

// Generate charts based on destination category
function generateCharts(logisticsData) {
    const destinationSummary = {};
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

        const category = getDestinationCategory(destination);
        destinationSummary[category] = (destinationSummary[category] || 0) + 1;
        deliveryCounts[month] = (deliveryCounts[month] || 0) + 1;

        const parts = destination.split('/').map(p => p.trim()).filter(p => p.length);
        parts.forEach(loc => {
            locationSummary[loc] = (locationSummary[loc] || 0) + 1;
        });
    });

    // Fuel estimation
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
        data: {
            labels: Object.keys(destinationSummary),
            datasets: [{ data: Object.values(destinationSummary), backgroundColor: ['#FF6347','#4CAF50','#FFEB3B','#00BCD4','#2196F3','#FF9800','#8BC34A','#E91E63','#9C27B0','#795548'] }]
        }
    });

    new Chart(document.getElementById('fuelGraph').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(vehicleFuel),
            datasets: [{ label: 'Fuel (liters)', data: Object.values(vehicleFuel).map(f => +f.toFixed(2)), backgroundColor: '#FF5733' }]
        }
    });

    new Chart(document.getElementById('deliveryGraph').getContext('2d'), {
        type: 'line',
        data: {
            labels: Object.keys(deliveryCounts),
            datasets: [{ label: 'Deliveries', data: Object.values(deliveryCounts), borderColor: '#4CAF50', backgroundColor: '#C8E6C9', fill: true, tension: 0.2 }]
        }
    });

    new Chart(document.getElementById('locationSummaryGraph').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(locationSummary),
            datasets: [{ label: 'Deliveries by Location', data: Object.values(locationSummary), backgroundColor: '#42A5F5' }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

// Filters setup
function setupFilters(logisticsData) {
    const monthInput = document.getElementById('monthFilter');
    const yearInput = document.getElementById('yearFilter');

    const updateTables = () => {
        populateCostTables(logisticsData, monthInput.value.trim(), yearInput.value.trim());
    };

    monthInput.addEventListener('input', updateTables);
    yearInput.addEventListener('input', updateTables);
}

// Page load init
document.addEventListener("DOMContentLoaded", async () => {
    const logisticsData = await fetchLogisticsData();
    populateCostTables(logisticsData);
    generateCharts(logisticsData);
    setupFilters(logisticsData);
});
