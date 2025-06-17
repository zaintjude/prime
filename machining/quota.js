const table1 = document.getElementById("shiftTable").getElementsByTagName('tbody')[0];
const table2 = document.getElementById("shiftTable2").getElementsByTagName('tbody')[0];

// Shift 1 - 7 AM to 3 PM
function addRowShift1() {
    const newRow = table1.insertRow();
    const today = new Date().toLocaleDateString();

    newRow.insertCell().textContent = today;
    newRow.insertCell().contentEditable = true;  // Operator
    newRow.insertCell().contentEditable = true;  // Item Name
    newRow.insertCell().contentEditable = true;  // Quota
    newRow.insertCell().contentEditable = true;  // Machine

    for (let i = 5; i <= 12; i++) {
        const cell = newRow.insertCell();
        cell.contentEditable = true;
        cell.addEventListener("input", () => {
            calculateTotalShift1(newRow);
            validateQuotaShift1(newRow);  // Validate quota and color in real-time
            saveData();
        });
    }

    const totalCell = newRow.insertCell();
    totalCell.textContent = "0";
    totalCell.classList.add("readonly");

    saveData();
}

// Shift 2 - 3 PM to 11 PM
function addRowShift2() {
    const newRow = table2.insertRow();
    const today = new Date().toLocaleDateString();

    newRow.insertCell().textContent = today;
    newRow.insertCell().contentEditable = true;  // Operator
    newRow.insertCell().contentEditable = true;  // Item Name
    newRow.insertCell().contentEditable = true;  // Quota
    newRow.insertCell().contentEditable = true;  // Machine

    for (let i = 5; i <= 12; i++) {
        const cell = newRow.insertCell();
        cell.contentEditable = true;
        cell.addEventListener("input", () => {
            calculateTotalShift2(newRow);
            validateQuotaShift2(newRow);  // Validate quota and color in real-time
            saveData();
        });
    }

    const totalCell = newRow.insertCell();
    totalCell.textContent = "0";
    totalCell.classList.add("readonly");

    saveData();
}

// Calculate total for Shift 1
function calculateTotalShift1(row) {
    let total = 0;
    for (let i = 5; i <= 12; i++) {
        const val = parseFloat(row.cells[i].textContent.trim()) || 0;
        total += val;
    }
    row.cells[13].textContent = total;  // Assuming column 13 is for the total

    // Call the highlight function after calculating the total
    const quota = parseFloat(row.cells[3].textContent.trim()) || 0;  // Get the quota value
    highlightCells(row, total, quota);  // Highlight or reset based on quota
}

// Validate quota and color cells for Shift 1
function validateQuotaShift1(row) {
    const quota = parseFloat(row.cells[3].textContent.trim()) || 0;
    const totalHours = 8;
    const quotaPerHour = quota / totalHours;

    let total = 0;

    for (let i = 5; i <= 12; i++) {
        const cell = row.cells[i];
        const val = parseFloat(cell.textContent.trim()) || 0;
        total += val;
    }

    // If total meets or exceeds quota, make all cells white
    if (total >= quota) {
        for (let i = 5; i <= 12; i++) {
            row.cells[i].style.backgroundColor = ""; // White / default background
        }
    } else {
        // Otherwise, check each cell against quotaPerHour
        for (let i = 5; i <= 12; i++) {
            const val = parseFloat(row.cells[i].textContent.trim()) || 0;
            if (val < quotaPerHour) {
                row.cells[i].style.backgroundColor = "#ffdddd";  // Red
            } else {
                row.cells[i].style.backgroundColor = "";  // White
            }
        }
    }

    row.cells[13].textContent = total; // Ensure total is updated
}


// Calculate total for Shift 2
function calculateTotalShift2(row) {
    let total = 0;
    for (let i = 5; i <= 12; i++) {
        const val = parseFloat(row.cells[i].textContent.trim()) || 0;
        total += val;
    }
    row.cells[13].textContent = total;  // Assuming column 13 is for the total

    // Call the highlight function after calculating the total
    const quota = parseFloat(row.cells[3].textContent.trim()) || 0;  // Get the quota value
    highlightCells(row, total, quota);  // Highlight or reset based on quota
}

// Validate quota and color cells for Shift 2
function validateQuotaShift2(row) {
    const quota = parseFloat(row.cells[3].textContent.trim()) || 0;
    const totalHours = 8;
    const quotaPerHour = quota / totalHours;

    let total = 0;

    for (let i = 5; i <= 12; i++) {
        const cell = row.cells[i];
        const val = parseFloat(cell.textContent.trim()) || 0;
        total += val;
    }

    if (total >= quota) {
        for (let i = 5; i <= 12; i++) {
            row.cells[i].style.backgroundColor = "";
        }
    } else {
        for (let i = 5; i <= 12; i++) {
            const val = parseFloat(row.cells[i].textContent.trim()) || 0;
            if (val < quotaPerHour) {
                row.cells[i].style.backgroundColor = "#ffdddd";
            } else {
                row.cells[i].style.backgroundColor = "";
            }
        }
    }

    row.cells[13].textContent = total;
}


// Save data function
function saveData() {
    const data = {
        shift1: [],
        shift2: []
    };

    // Save Shift 1 data from the first table (shiftTable)
    for (let row of table1.rows) {
        const cells = row.cells;
        const entry = {
            date: cells[0].textContent,
            operator: cells[1].textContent,
            itemName: cells[2].textContent,
            quota: cells[3].textContent.trim(),
            machine: cells[4].textContent,
            times: [],
            total: cells[13].textContent
        };

        for (let i = 5; i <= 12; i++) {
            entry.times.push(cells[i].textContent.trim());
        }

        data.shift1.push(entry);
    }

    // Save Shift 2 data from the second table (shiftTable2)
    for (let row of table2.rows) {
        const cells = row.cells;
        const entry = {
            date: cells[0].textContent,
            operator: cells[1].textContent,
            itemName: cells[2].textContent,
            quota: cells[3].textContent.trim(),
            machine: cells[4].textContent,
            times: [],
            total: cells[13].textContent
        };

        for (let i = 5; i <= 12; i++) {
            entry.times.push(cells[i].textContent.trim());
        }

        data.shift2.push(entry);
    }

    // Send the data to the server to be saved
    fetch('quota.php', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(res => {
        if (!res.ok) console.error("Error saving data");
    });
}

// Highlight cells based on quota
function highlightCells(row, total, quota) {
    const cells = row.cells;
    const quotaValue = parseInt(quota) || 0;

    // If the total is below quota, highlight the cells where production is less than the quota
    if (total < quotaValue) {
        for (let i = 5; i <= 12; i++) {
            const timeCell = cells[i];
            const timeValue = parseInt(timeCell.textContent) || 0;

            if (timeValue < quotaValue) {
                timeCell.style.backgroundColor = "red";  // Highlight in red if below quota
            } else {
                timeCell.style.backgroundColor = "";  // Reset to normal color if above quota
            }
        }
    } else {
        // If total meets or exceeds quota, reset all cell colors to normal
        for (let i = 5; i <= 12; i++) {
            cells[i].style.backgroundColor = "";  // Reset to normal color
        }
    }
}

// Load data function
document.addEventListener("DOMContentLoaded", loadData);
function loadData() {
    fetch('quota.json')
        .then(response => response.json())
        .then(data => {
            // Load Shift 1 data
            data.shift1.forEach(entry => {
                const newRow = table1.insertRow();
                newRow.insertCell().textContent = entry.date || "";
                newRow.insertCell().textContent = entry.operator || "";
                newRow.insertCell().textContent = entry.itemName || "";
                newRow.insertCell().textContent = entry.quota || "0";
                newRow.insertCell().textContent = entry.machine || "";

                // Add time cells (7 AM to 3 PM)
                for (let i = 0; i < 8; i++) {
                    const timeCell = newRow.insertCell();
                    timeCell.contentEditable = true;
                    timeCell.textContent = entry.times[i] || "";
                    timeCell.addEventListener("input", () => {
                        calculateTotalShift1(newRow);
                        validateQuotaShift1(newRow);  // Validate in real-time
                        saveData();
                    });
                }

                const totalCell = newRow.insertCell();
                totalCell.textContent = entry.total || "0";
                totalCell.classList.add("readonly");

                calculateTotalShift1(newRow);
                validateQuotaShift1(newRow);
            });

            // Load Shift 2 data
            data.shift2.forEach(entry => {
                const newRow = table2.insertRow();
                newRow.insertCell().textContent = entry.date || "";
                newRow.insertCell().textContent = entry.operator || "";
                newRow.insertCell().textContent = entry.itemName || "";
                newRow.insertCell().textContent = entry.quota || "0";
                newRow.insertCell().textContent = entry.machine || "";

                // Add time cells (3 PM to 11 PM)
                for (let i = 0; i < 8; i++) {
                    const timeCell = newRow.insertCell();
                    timeCell.contentEditable = true;
                    timeCell.textContent = entry.times[i] || "";
                    timeCell.addEventListener("input", () => {
                        calculateTotalShift2(newRow);
                        validateQuotaShift2(newRow);  // Validate in real-time
                        saveData();
                    });
                }

                const totalCell = newRow.insertCell();
                totalCell.textContent = entry.total || "0";
                totalCell.classList.add("readonly");

                calculateTotalShift2(newRow);
                validateQuotaShift2(newRow);
            });
        })
        .catch(error => {
            console.error("Failed to load quota.json:", error);
        });
}




let doneEmployees = {
    date: new Date().toISOString().split("T")[0], // "2025-05-08"
    names: []
};

// Load DONE employees from server
function loadDoneEmployees() {
    const today = doneEmployees.date;

    return fetch("doneemployees.json")
        .then(res => res.json())
        .then(data => {
            doneEmployees.names = data[today] || [];
        })
        .catch(err => {
            console.error("Failed to load done employees:", err);
            doneEmployees.names = [];
        });
}

// Save DONE to server
function saveDoneEmployee(name) {
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    fetch("savedoneemployee.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            date: today,
            name: name
        })
    })
    .then(res => res.text())
    .then(data => {
        console.log("Saved DONE:", data);
    })
    .catch(err => console.error("Error saving DONE employee:", err));
}


// Render and check quota
function checkQuota() {
    const today = new Date().toISOString().split("T")[0];

    Promise.all([
        fetch("quota.json").then(res => res.json()),
        fetch("doneemployees.json").then(res => res.json())
    ])
    .then(([quotaData, doneData]) => {
        const alreadyDone = doneData[today] || [];
        let underQuotaEntries = [];

        ["shift1", "shift2"].forEach(shift => {
            if (quotaData[shift]) {
                quotaData[shift].forEach(entry => {
                    const actual = parseFloat(entry.total);
                    const required = parseFloat(entry.quota);

                    if (actual < required && !alreadyDone.includes(entry.operator)) {
                        underQuotaEntries.push({
                            name: entry.operator,
                            date: entry.date,
                            quota: required,
                            actual: actual
                        });
                    }
                });
            }
        });

        renderCallOutTable(underQuotaEntries);
    })
    .catch(err => console.error("Error checking quota:", err));
}

// Same as before but calls `saveDoneEmployee()`
function renderCallOutTable(entries) {
    const container = document.getElementById("callouts-container");
    container.innerHTML = "";

    if (entries.length === 0) {
        container.innerHTML = "<p>No callouts needed.</p>";
        return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr><th colspan="5" style="background-color:yellow;">CALL OUTS TABLE</th></tr>
            <tr>
                <th style="background-color:yellow;">NAME</th>
                <th style="background-color:yellow;">DATE</th>
                <th style="background-color:yellow;">QUOTA TO REACH</th>
                <th style="background-color:yellow;">ACTUAL QUOTA</th>
                <th style="background-color:yellow;">ACTION TAKEN</th>
            </tr>
        </thead>
        <tbody>
            ${entries.map(entry => `
                <tr>
                    <td>${entry.name}</td>
                    <td>${entry.date}</td>
                    <td>${entry.quota}</td>
                    <td>${entry.actual}</td>
                    <td>
                        <select class="action-select">
                            <option value="IN PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                        </select>
                    </td>
                </tr>
            `).join("")}
        </tbody>
    `;
    container.appendChild(table);

    table.querySelectorAll(".action-select").forEach(select => {
        select.addEventListener("change", function () {
            const row = this.closest("tr");
            const name = row.children[0].textContent;
            if (this.value === "DONE") {
                this.parentNode.textContent = "DONE";
                row.style.backgroundColor = "#d3ffd3";
                row.remove();
                saveDoneEmployee(name);

                if (table.querySelectorAll("tbody tr").length === 0) {
                    table.remove();
                }
            }
        });
    });
}

// Initial setup
loadDoneEmployees().then(() => {
    checkQuota();
    setInterval(() => {
        loadDoneEmployees().then(checkQuota);
    }, 5000);
});