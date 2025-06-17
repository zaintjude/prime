window.onload = function () {
    loadExistingData(); // Load all data initially
};

// Load and render all panels
function loadExistingData() {
    const selectedDate = document.getElementById('dateFilter')?.value;

    fetch('machining.json')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('panelsContainer');
            container.innerHTML = ''; // Clear old panels

            data.forEach(group => {
                const filteredRecords = group.records.filter(record => {
                    if (selectedDate) {
                        // If date is selected, show only DONE records for that date
                        return record.status === 'DONE' && record.date === selectedDate;
                    } else {
                        // If no date selected, show all NOT DONE records
                        return record.status !== 'DONE';
                    }
                });

                if (filteredRecords.length > 0) {
                    createPanel(group.machineType, filteredRecords);
                }
            });
        })
        .catch(error => console.error('Load error:', error));
}

// Create a panel and table for a machine type
function createPanel(machineType, records = []) {
    const container = document.getElementById('panelsContainer');

    const panel = document.createElement('div');
    panel.classList.add('panel');
    panel.setAttribute('data-machine-type', machineType);

    panel.innerHTML = `
        <h3>${machineType}</h3>
        <button onclick="addRow('${machineType}')">Add Row</button>
        <table class="machineTable" data-machine-type="${machineType}">
            <thead>
                <tr>
                    <th>Date</th><th>Item Name</th><th>Model</th><th>Operator</th>
                    <th>Process 1</th><th>Process 2</th><th>Process 3</th><th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <hr/>
    `;

    container.appendChild(panel);

    const tbody = panel.querySelector('tbody');
    records.forEach(record => {
        const row = tbody.insertRow();
        insertRowData(row, record);
    });
}

// Insert data into a row
function insertRowData(row, data) {
    const fields = ['date', 'itemName', 'model', 'operator', 'process1', 'process2', 'process3', 'status'];
    fields.forEach((field, i) => {
        const cell = row.insertCell(i);
        cell.textContent = data[field];
        if (field !== 'date') {
            cell.setAttribute('contenteditable', 'true');
            cell.addEventListener('input', saveTableData);
        }

        // Add event listener to detect status change
        if (field === 'status') {
            cell.addEventListener('input', function () {
                // If status is changed to "DONE", immediately hide the row
                if (cell.textContent.trim() === "DONE") {
                    row.style.display = 'none'; // Hide the row if status is DONE
                } else {
                    row.style.display = ''; // Show the row if status is not DONE
                }

                // Save updated table data
                saveTableData();
            });
        }
    });
}

// Add a new row to a specific machine type
function addRow(machineType) {
    const table = document.querySelector(`table[data-machine-type="${machineType}"] tbody`);
    const now = new Date().toISOString().split('T')[0];

    const rowData = {
        date: now,
        itemName: '',
        model: '',
        operator: '',
        process1: '',
        process2: '',
        process3: '',
        status: ''
    };

    const row = table.insertRow();
    insertRowData(row, rowData);
    saveTableData();
}

// Save grouped data from all panels
function saveTableData() {
    const machineTypes = document.querySelectorAll('.panel');
    const result = [];

    machineTypes.forEach(panel => {
        const type = panel.getAttribute('data-machine-type');
        const rows = panel.querySelectorAll('tbody tr');
        const records = [];

        rows.forEach(row => {
            const cells = row.cells;
            records.push({
                date: cells[0].textContent,
                itemName: cells[1].textContent,
                model: cells[2].textContent,
                operator: cells[3].textContent,
                process1: cells[4].textContent,
                process2: cells[5].textContent,
                process3: cells[6].textContent,
                status: cells[7].textContent
            });
        });

        result.push({
            machineType: type,
            records
        });
    });

    fetch('machining.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) console.error('Save error:', data.error);
    })
    .catch(error => console.error('Save failed:', error));
}

// Create a new machine type panel from user input
function createNewMachineType() {
    const machineType = document.getElementById('machineType').value.trim();
    if (!machineType) return alert('Enter a machine type.');
    if (document.querySelector(`.panel[data-machine-type="${machineType}"]`)) {
        return alert('Machine type already exists.');
    }

    createPanel(machineType, []);
    document.getElementById('machineType').value = '';
    saveTableData();
}
