document.addEventListener("DOMContentLoaded", function () {
    fetchPayrollData();
});

function fetchPayrollData() {
    fetch("payroll.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            populateTable(data);
        })
        .catch(error => console.error("Error fetching payroll data:", error));
}

function populateTable(data) {
    const tableBody = document.getElementById("payrollTableBody");
    tableBody.innerHTML = "";
    
    data.forEach((item, index) => {
        addRowToTable(item, index);
    });
}

function addRowToTable(item, index) {
    const tableBody = document.getElementById("payrollTableBody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td contenteditable="true" oninput="updateData(${index}, 'fullName', this.textContent)">${item.fullName || ''}</td>
        <td contenteditable="true" oninput="updateData(${index}, 'department', this.textContent)">${item.department || ''}</td>
        <td contenteditable="true" oninput="updateData(${index}, 'monthly', this.textContent)">${item.monthly || 0}</td>
        <td contenteditable="true" oninput="updateData(${index}, 'daily', this.textContent)">${item.daily || 0}</td>
        <td contenteditable="true" oninput="updateData(${index}, 'allowance', this.textContent)">${item.allowance || 0}</td>
        <td contenteditable="true" oninput="updateData(${index}, 'lastIncrease', this.textContent)">${item.lastIncrease || ''}</td>
        <td contenteditable="true" oninput="updateData(${index}, 'prevIncrease', this.textContent)">${item.prevIncrease || ''}</td>
    `;
    tableBody.appendChild(row);
}

function addRow() {
    const fullName = document.getElementById("fullName").value.trim() || "Unknown";
    const department = document.getElementById("department").value.trim() || "Unknown";
    const monthly = parseFloat(document.getElementById("monthly").value) || 0;
    const daily = parseFloat(document.getElementById("daily").value) || 0;
    const allowance = parseFloat(document.getElementById("allowance").value) || 0;
    const lastIncrease = document.getElementById("lastIncrease").value || "N/A";
    const prevIncrease = document.getElementById("prevIncrease").value || "N/A";

    const newData = {
        fullName,
        department,
        monthly,
        daily,
        allowance,
        lastIncrease,
        prevIncrease
    };

    fetch("payroll.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData)
    })
    .then(response => response.json().catch(() => { throw new Error("Invalid JSON response"); }))
    .then(() => {
        alert("Payroll entry added successfully!");
        addRowToTable(newData, document.querySelectorAll("#payrollTableBody tr").length);
    })
    .catch(error => console.error("Error saving payroll data:", error));
}

function filterTable() {
    const searchDepartment = document.getElementById("searchDepartment").value.toLowerCase();
    const searchName = document.getElementById("searchName").value.toLowerCase();
    const tableRows = document.querySelectorAll("#payrollTableBody tr");

    tableRows.forEach(row => {
        const department = row.cells[1].textContent.toLowerCase();
        const name = row.cells[0].textContent.toLowerCase();
        
        row.style.display = (department.includes(searchDepartment) && name.includes(searchName)) ? "" : "none";
    });
}

function updateData(index, field, value) {
    fetch("payroll.json")
        .then(response => response.json().catch(() => { throw new Error("Invalid JSON response"); }))
        .then(data => {
            data[index][field] = value.trim() || (field === "monthly" || field === "daily" || field === "allowance" ? 0 : "N/A");
            saveUpdatedData(data);
        })
        .catch(error => console.error("Error updating payroll data:", error));
}

function saveUpdatedData(updatedData) {
    fetch("payroll.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
    })
    .then(response => response.json().catch(() => { throw new Error("Invalid JSON response"); }))
    .then(() => console.log("Payroll data updated successfully!"))
    .catch(error => console.error("Error saving updated payroll data:", error));
}
