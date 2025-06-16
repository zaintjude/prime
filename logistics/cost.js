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

        // Track entries per vehicle
        vehicleEntries[vehicle] ??= [];
        vehicleEntries[vehicle].push(entry);

        // Count full destination strings for pie chart
        destinations[destination] = (destinations[destination] || 0) + 1;

        // Count monthly deliveries
        deliveryCounts[month] = (deliveryCounts[month] || 0) + 1;

        // ✅ Split by "/" and count each location individually for summary
        const parts = destination.split('/').map(p => p.trim()).filter(p => p.length > 0);
        parts.forEach(loc => {
            locationSummary[loc] = (locationSummary[loc] || 0) + 1;
        });
    });

    // Estimate fuel consumption per vehicle
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

    // Delivery Destinations Pie Chart
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

    // Fuel Consumption Bar Chart
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

    // Deliveries Per Month Line Chart
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

    // ✅ Summary by Location Category Bar Chart
    new Chart(document.getElementById('locationSummaryGraph').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(locationSummary),
            datasets: [{
                label: 'Deliveries by Location',
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
