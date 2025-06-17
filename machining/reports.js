async function fetchData() {
    try {
        const response = await fetch('quota.json'); // Adjust path if needed
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateTable(data) {
    const tableBody = document.querySelector('#reportTable tbody');
    const machineSummary = {};
    const combinedData = data.shift1.concat(data.shift2);

    combinedData.forEach(entry => {
        const machine = entry.machine;
        const totalProduced = parseFloat(entry.total);

        if (!machineSummary[machine]) {
            machineSummary[machine] = { timesUsed: 0, total: 0 };
        }

        machineSummary[machine].timesUsed += 1;
        machineSummary[machine].total += totalProduced;
    });

    tableBody.innerHTML = '';

    for (const machine in machineSummary) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${machine}</td>
            <td>${machineSummary[machine].timesUsed}</td>
            <td>${machineSummary[machine].total.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    }
}

function populateFilters(data) {
    const combinedData = data.shift1.concat(data.shift2);

    const years = [...new Set(combinedData.map(entry => new Date(entry.date).getFullYear()))];
    const yearSelect = document.getElementById('year');
    yearSelect.innerHTML = '';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    const months = [...new Set(combinedData.map(entry => new Date(entry.date).getMonth() + 1))];
    const monthSelect = document.getElementById('month');
    monthSelect.innerHTML = '';
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month < 10 ? '0' + month : month;
        monthSelect.appendChild(option);
    });

    const days = [...new Set(combinedData.map(entry => new Date(entry.date).getDate()))];
    const daySelect = document.getElementById('day');
    daySelect.innerHTML = '';
    days.forEach(day => {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day < 10 ? '0' + day : day;
        daySelect.appendChild(option);
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateGraphs(data) {
    const combinedData = data.shift1.concat(data.shift2);
    const monthlyMachineUsage = Array.from({ length: 12 }, () => ({}));

    combinedData.forEach(entry => {
        const date = new Date(entry.date);
        const month = date.getMonth(); // 0-based
        const machine = entry.machine;
        const total = parseFloat(entry.total);

        if (!monthlyMachineUsage[month][machine]) {
            monthlyMachineUsage[month][machine] = {
                count: 0,
                total: 0
            };
        }

        monthlyMachineUsage[month][machine].count += 1;
        monthlyMachineUsage[month][machine].total += total;
    });

    const allMachines = new Set();
    monthlyMachineUsage.forEach(monthData => {
        Object.keys(monthData).forEach(machine => allMachines.add(machine));
    });

    const machines = Array.from(allMachines);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const datasets = machines.map(machine => {
        return {
            label: machine,
            data: monthlyMachineUsage.map(monthData => monthData[machine]?.count || 0),
            backgroundColor: getRandomColor()
        };
    });

    const graphContainer = document.getElementById('graphContainer');
    graphContainer.innerHTML = '';

    const canvas = document.createElement('canvas');
    graphContainer.appendChild(canvas);

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: months,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Machine Usage (Times Used)'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Times Used'
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchData();
    if (data) {
        populateTable(data);
        populateFilters(data);
        generateGraphs(data);
        generateTopEmployeeTable(data);
    }
});


function generateTopEmployeeTable(data) {
    const combinedData = data.shift1.concat(data.shift2);
    const employeeRows = combinedData.map(entry => {
        const date = new Date(entry.date);
        const month = date.toLocaleString('default', { month: 'short' });
        return {
            operator: entry.operator,
            machine: entry.machine,
            itemName: entry.itemName,
            month: month,
            total: parseFloat(entry.total)
        };
    });

    // Sort by total descending
    employeeRows.sort((a, b) => b.total - a.total);

    const tableBody = document.querySelector('#topEmployeesTable tbody');
    tableBody.innerHTML = '';

    employeeRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row.operator}</td>
            <td>${row.machine}</td>
            <td>${row.itemName}</td>
            <td>${row.month}</td>
            <td>${row.total}</td>
        `;
        tableBody.appendChild(tr);
    });
}