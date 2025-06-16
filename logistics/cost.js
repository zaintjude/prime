// cost.js

// Define fuel prices
const DIESEL_PRICE_PER_LITER = 60.00; // As specified for Cebu City
const GASOLINE_PRICE_PER_LITER = 55.00; // Example price for gasoline

// URL for fetching logistics data
const DATA_URL = 'https://zaintjude.github.io/prime/logistics/logistics.json';

// --- Data Processing Functions ---

/**
 * Preprocesses raw vehicle data to group odometer readings by vehicle and month.
 * This helps in calculating monthly odometer differences efficiently.
 * @param {Array<Object>} data - The raw vehicle data array.
 * @returns {Map<string, Map<string, { minOdo: number, maxOdo: number, fuelType: string, records: Array<{odometer_reading: number, date: Date}> }>>}
 * A nested Map: vehicleName -> (yearMonth -> { minOdo, maxOdo, fuelType, records (sorted by date) })
 */
function preprocessOdometerData(data) {
    const processedMonthlyData = new Map(); // Map to store processed data: vehicle -> (year-month -> data)

    data.forEach(entry => {
        const { vehicle, date, odometer_reading, fuel_type } = entry;
        const recordDate = new Date(date);
        // Ensure date is valid before processing
        if (isNaN(recordDate.getTime())) {
            console.warn(`Invalid date format for entry: ${JSON.stringify(entry)}. Skipping.`);
            return;
        }

        const yearMonth = recordDate.toISOString().substring(0, 7); // Format: YYYY-MM

        if (!processedMonthlyData.has(vehicle)) {
            processedMonthlyData.set(vehicle, new Map());
        }
        const vehicleMonthData = processedMonthlyData.get(vehicle);

        if (!vehicleMonthData.has(yearMonth)) {
            vehicleMonthData.set(yearMonth, {
                minOdo: Infinity,
                maxOdo: -Infinity,
                fuelType: fuel_type, // Assuming fuel type is consistent per vehicle per month
                records: []
            });
        }
        const monthData = vehicleMonthData.get(yearMonth);

        monthData.minOdo = Math.min(monthData.minOdo, odometer_reading);
        monthData.maxOdo = Math.max(monthData.maxOdo, odometer_reading);
        monthData.records.push({ odometer_reading, date: recordDate });
    });

    // Sort records within each month by date to ensure minOdo and maxOdo truly represent start/end of month
    processedMonthlyData.forEach(vehicleMonthData => {
        vehicleMonthData.forEach(monthData => {
            monthData.records.sort((a, b) => a.date.getTime() - b.date.getTime());
            // After sorting, update minOdo and maxOdo based on the sorted records
            if (monthData.records.length > 0) {
                monthData.minOdo = monthData.records[0].odometer_reading;
                monthData.maxOdo = monthData.records[monthData.records.length - 1].odometer_reading;
            } else {
                 monthData.minOdo = 0; // No records for this month
                 monthData.maxOdo = 0;
            }
        });
    });

    return processedMonthlyData;
}

/**
 * Calculates monthly odometer differences and total costs for each vehicle.
 * The odometer difference for a given month is calculated as the maximum odometer reading
 * in that month minus the minimum odometer reading in that same month.
 * @param {Map<string, Map<string, { minOdo: number, maxOdo: number, fuelType: string, records: Array<Object> }>>} preprocessedData
 * @returns {Array<Object>} An array of objects, each representing a monthly report for a vehicle.
 */
function calculateMonthlyReports(preprocessedData) {
    const monthlyReports = [];

    preprocessedData.forEach((monthDataMap, vehicle) => {
        const sortedMonths = Array.from(monthDataMap.keys()).sort(); // Sort YYYY-MM keys

        sortedMonths.forEach(yearMonth => {
            const currentMonthData = monthDataMap.get(yearMonth);
            const currentMonthStartOdo = currentMonthData.minOdo;
            const currentMonthEndOdo = currentMonthData.maxOdo;
            const fuelType = currentMonthData.fuelType;

            // Calculate odometer difference for the month: last entry of the month - first entry of the month
            let monthlyOdoDiff = currentMonthEndOdo - currentMonthStartOdo;

            // Handle cases where monthlyOdoDiff might be negative or zero due to data issues (e.g., reset odometer)
            // For report purposes, we'll assume a non-negative difference.
            if (monthlyOdoDiff < 0) {
                console.warn(`Negative odometer difference for ${vehicle} in ${yearMonth}. Assuming 0 for calculation.`);
                monthlyOdoDiff = 0;
            }


            // Calculate total cost based on fuel type
            const costPerLiter = fuelType.toLowerCase() === 'diesel' ? DIESEL_PRICE_PER_LITER : GASOLINE_PRICE_PER_LITER;
            const totalCost = monthlyOdoDiff * costPerLiter;

            const month = new Date(yearMonth + '-01').toLocaleString('en-US', { month: 'long' });
            const year = new Date(yearMonth + '-01').getFullYear();

            monthlyReports.push({
                vehicle,
                month,
                year,
                totalOdometer: monthlyOdoDiff, // This now explicitly represents the distance traveled within the month
                totalCost: totalCost
            });
        });
    });

    return monthlyReports;
}

/**
 * Calculates yearly odometer differences and total costs from monthly reports.
 * @param {Array<Object>} monthlyReports - The array of monthly report objects.
 * @returns {Array<Object>} An array of objects, each representing a yearly report for a vehicle.
 */
function calculateYearlyReports(monthlyReports) {
    const yearlyAggregates = new Map(); // Key: vehicle-year, Value: { totalOdo: number, totalCost: number }

    monthlyReports.forEach(report => {
        const key = `${report.vehicle}-${report.year}`;
        if (!yearlyAggregates.has(key)) {
            yearlyAggregates.set(key, { vehicle: report.vehicle, year: report.year, totalOdometer: 0, totalCost: 0 });
        }
        const aggregate = yearlyAggregates.get(key);
        aggregate.totalOdometer += report.totalOdometer;
        aggregate.totalCost += report.totalCost;
    });

    return Array.from(yearlyAggregates.values());
}

// --- Table Rendering Functions ---

/**
 * Renders the monthly cost data into the monthly cost table.
 * @param {Array<Object>} reports - Filtered monthly reports to display.
 */
function renderMonthlyCostTable(reports) {
    const tableBody = document.getElementById('monthlyCostTable').querySelector('tbody');
    tableBody.innerHTML = ''; // Clear previous entries

    if (reports.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 4;
        cell.textContent = 'No data available for the selected filters.';
        cell.style.textAlign = 'center';
        return;
    }

    reports.forEach(report => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = report.vehicle;
        row.insertCell(1).textContent = report.month;
        row.insertCell(2).textContent = report.totalOdometer.toFixed(2) + ' km'; // Odometer difference
        row.insertCell(3).textContent = '₱ ' + report.totalCost.toFixed(2); // Total cost
    });
}

/**
 * Renders the yearly cost data into the yearly cost table.
 * @param {Array<Object>} reports - Filtered yearly reports to display.
 */
function renderYearlyCostTable(reports) {
    const tableBody = document.getElementById('yearlyCostTable').querySelector('tbody');
    tableBody.innerHTML = ''; // Clear previous entries

    if (reports.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 4;
        cell.textContent = 'No data available for the selected filters.';
        cell.style.textAlign = 'center';
        return;
    }

    reports.forEach(report => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = report.vehicle;
        row.insertCell(1).textContent = report.year;
        row.insertCell(2).textContent = report.totalOdometer.toFixed(2) + ' km'; // Total odometer for the year
        row.insertCell(3).textContent = '₱ ' + report.totalCost.toFixed(2); // Total cost for the year
    });
}

// --- Chart.js Instances ---
let destinationChart, fuelChart, deliveryChart, locationSummaryChart;

/**
 * Creates or updates a Chart.js instance.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {Chart | undefined} chartInstance - The existing chart instance (if any).
 * @param {string} type - The type of chart (e.g., 'bar', 'pie').
 * @param {Object} data - The chart data.
 * @param {Object} options - The chart options.
 * @returns {Chart} The new or updated chart instance.
 */
function createOrUpdateChart(canvasId, chartInstance, type, data, options) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (chartInstance) {
        chartInstance.destroy(); // Destroy existing chart before creating a new one
    }
    return new Chart(ctx, { type, data, options });
}

/**
 * Generates and renders the Delivery Destinations graph.
 * @param {Array<Object>} data - The raw data.
 */
function renderDestinationGraph(data) {
    const destinationCounts = {};
    data.forEach(entry => {
        destinationCounts[entry.destination] = (destinationCounts[entry.destination] || 0) + 1;
    });

    const labels = Object.keys(destinationCounts);
    const chartData = Object.values(destinationCounts);

    destinationChart = createOrUpdateChart('destinationGraph', destinationChart, 'bar', {
        labels: labels,
        datasets: [{
            label: 'Number of Deliveries',
            data: chartData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Delivery Destinations'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Count'
                }
            }
        }
    });
}

/**
 * Generates and renders the Total Most Consumed Fuel graph.
 * @param {Array<Object>} data - The raw data.
 */
function renderFuelGraph(data) {
    const fuelCounts = {};
    data.forEach(entry => {
        fuelCounts[entry.fuel_type] = (fuelCounts[entry.fuel_type] || 0) + 1;
    });

    const labels = Object.keys(fuelCounts);
    const chartData = Object.values(fuelCounts);

    fuelChart = createOrUpdateChart('fuelGraph', fuelChart, 'pie', {
        labels: labels,
        datasets: [{
            label: 'Fuel Consumption',
            data: chartData,
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)', // Diesel
                'rgba(75, 192, 192, 0.6)', // Gasoline
                'rgba(255, 206, 86, 0.6)'  // Other (if any)
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(255, 206, 86, 1)'
            ],
            borderWidth: 1
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Total Most Consumed Fuel'
            },
            legend: {
                position: 'top',
            }
        }
    });
}

/**
 * Generates and renders the Deliveries Per Month graph.
 * @param {Array<Object>} data - The raw data.
 */
function renderDeliveryGraph(data) {
    const deliveriesPerMonth = {};
    data.forEach(entry => {
        const date = new Date(entry.date);
        // Ensure date is valid before processing
        if (isNaN(date.getTime())) {
            return;
        }
        const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        deliveriesPerMonth[monthYear] = (deliveriesPerMonth[monthYear] || 0) + 1;
    });

    // Sort by date for proper chronological order on the graph
    const sortedMonthYears = Object.keys(deliveriesPerMonth).sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA.getTime() - dateB.getTime();
    });

    const labels = sortedMonthYears;
    const chartData = sortedMonthYears.map(my => deliveriesPerMonth[my]);

    deliveryChart = createOrUpdateChart('deliveryGraph', deliveryChart, 'line', {
        labels: labels,
        datasets: [{
            label: 'Number of Deliveries',
            data: chartData,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
            fill: false,
            tension: 0.1 // For smooth lines
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Deliveries Per Month'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Count'
                }
            }
        }
    });
}

/**
 * Generates and renders the Delivery Categories Summary graph.
 * @param {Array<Object>} data - The raw data.
 */
function renderLocationSummaryGraph(data) {
    const categoryCounts = {};
    data.forEach(entry => {
        categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    });

    const labels = Object.keys(categoryCounts);
    const chartData = Object.values(categoryCounts);

    locationSummaryChart = createOrUpdateChart('locationSummaryGraph', locationSummaryChart, 'doughnut', {
        labels: labels,
        datasets: [{
            label: 'Delivery Categories',
            data: chartData,
            backgroundColor: [
                'rgba(255, 159, 64, 0.6)', // Express
                'rgba(54, 162, 235, 0.6)', // Standard
                'rgba(201, 203, 207, 0.6)' // Other
            ],
            borderColor: [
                'rgba(255, 159, 64, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(201, 203, 207, 1)'
            ],
            borderWidth: 1
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Delivery Categories Summary'
            }
        },
        legend: {
            position: 'top',
        }
    });
}

// --- Global variables for fetched data and reports ---
let rawLogisticsData = []; // To store the fetched raw data
let allMonthlyReports = [];
let allYearlyReports = [];

/**
 * Renders all reports and graphs based on current filter values and the fetched data.
 */
function renderAll() {
    const monthFilterValue = document.getElementById('monthFilter').value.toLowerCase();
    const yearFilterValue = document.getElementById('yearFilter').value;

    // Filter monthly reports
    const filteredMonthlyReports = allMonthlyReports.filter(report => {
        const monthMatch = monthFilterValue ? report.month.toLowerCase().includes(monthFilterValue) : true;
        const yearMatch = yearFilterValue ? report.year.toString() === yearFilterValue : true;
        return monthMatch && yearMatch;
    });
    renderMonthlyCostTable(filteredMonthlyReports);

    // Filter yearly reports (these are derived from monthly, so filter the final ones)
    const filteredYearlyReports = allYearlyReports.filter(report => {
        const yearMatch = yearFilterValue ? report.year.toString() === yearFilterValue : true;
        return yearMatch;
    });
    renderYearlyCostTable(filteredYearlyReports);

    // Graphs are based on the *filtered* raw data if filters are applied to the graphs,
    // or the full rawLogisticsData if graphs should always show overall trends.
    // For now, graphs will use the full fetched raw data as indicated in previous conversations,
    // unless explicit filtering for graphs is requested.
    renderDestinationGraph(rawLogisticsData);
    renderFuelGraph(rawLogisticsData);
    renderDeliveryGraph(rawLogisticsData);
    renderLocationSummaryGraph(rawLogisticsData);
}

/**
 * Fetches data from the specified URL, processes it, and then renders the page.
 */
async function initializeDataAndRender() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        rawLogisticsData = await response.json();
        console.log("Data fetched successfully:", rawLogisticsData);

        // Process the fetched data
        const preprocessedOdoData = preprocessOdometerData(rawLogisticsData);
        allMonthlyReports = calculateMonthlyReports(preprocessedOdoData);
        allYearlyReports = calculateYearlyReports(allMonthlyReports);

        // Initial render with all data
        renderAll();

    } catch (error) {
        console.error("Could not fetch logistics data:", error);
        // Display an error message to the user or in the tables
        document.getElementById('monthlyCostTable').querySelector('tbody').innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Failed to load data. Please check the network and data source.</td></tr>`;
        document.getElementById('yearlyCostTable').querySelector('tbody').innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Failed to load data. Please check the network and data source.</td></tr>`;
    }
}

// Event Listeners for filters
document.getElementById('monthFilter').addEventListener('input', renderAll);
document.getElementById('yearFilter').addEventListener('input', renderAll);

// Initial data fetching and rendering on page load
document.addEventListener('DOMContentLoaded', initializeDataAndRender);
