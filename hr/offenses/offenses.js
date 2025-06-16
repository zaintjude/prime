document.addEventListener("DOMContentLoaded", () => {
    fetchOffenses();
    document.getElementById("addOffenseBtn").addEventListener("click", addOffense);
});

function searchEmployee() {
    let lnameQuery = document.getElementById("searchLname").value.toLowerCase();
    let fnameQuery = document.getElementById("searchFname").value.toLowerCase();
    let deptQuery = document.getElementById("searchDept").value.toLowerCase();

    fetch("https://dashproduction.x10.mx/masterfile/prime/hr/empdir.json")
        .then(response => response.json())
        .then(data => {
            let employee = data.find(emp =>
                (lnameQuery === "" || emp.lastName.toLowerCase().includes(lnameQuery)) &&
                (fnameQuery === "" || emp.firstName.toLowerCase().includes(fnameQuery)) &&
                (deptQuery === "" || emp.department.toLowerCase().includes(deptQuery))
            );

            if (employee) {
                document.getElementById("fname").innerText = employee.firstName;
                document.getElementById("lname").innerText = employee.lastName;
                document.getElementById("department").innerText = employee.department;
                document.getElementById("position").innerText = employee.position;
                document.getElementById("startDate").innerText = employee.startDate;
                document.getElementById("tenure").innerText = calculateTenure(employee.startDate);

                fetchOffenses(employee.firstName, employee.lastName);
            } else {
                alert("No matching employee found.");
            }
        });
}

function calculateTenure(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    return `${years} years, ${months} months`;
}

function fetchOffenses(fname = "", lname = "") {
    fetch("offenses.json")
        .then(response => response.json())
        .then(data => {
            let employeeOffenses = data.find(emp => emp.fname === fname && emp.lname === lname);

            if (employeeOffenses) {
                displayOffenses(employeeOffenses.offenses);
            } else {
                displayOffenses([]); // If no offenses found, show empty table
            }
        })
        .catch(error => console.error("Error fetching offenses:", error));
}

function displayOffenses(offenses) {
    let table = document.getElementById("offenseTable");
    table.innerHTML = ""; // Clear table before adding new data

    offenses.forEach(offense => {
        let row = createOffenseRow(offense);
        table.appendChild(row);
    });
}

function createOffenseRow(offense = {}) {
    let row = document.createElement("tr");

    row.innerHTML = `
        <td><input type="date" value="${offense.date || ''}"></td>
        <td><input type="number" value="${offense.offenseNum || 1}" min="1"></td>
        <td><input type="number" value="${offense.suspensions || 0}" min="0"></td>
        <td><input type="text" value="${offense.type || ''}"></td>
        <td><input type="text" value="${offense.description || ''}"></td>
        <td><input type="date" value="${offense.nteDate || ''}"></td>
        <td><input type="text" value="${offense.actionTaken || ''}"></td>
        <td>
            <select>
                <option value="Pending" ${offense.status === "Pending" ? "selected" : ""}>Pending</option>
                <option value="Resolved" ${offense.status === "Resolved" ? "selected" : ""}>Resolved</option>
                <option value="Under Review" ${offense.status === "Under Review" ? "selected" : ""}>Under Review</option>
            </select>
        </td>
        <td><input type="text" value="${offense.comments || ''}"></td>
    `;

    row.addEventListener("input", updateOffenses);
    return row;
}

function addOffense() {
    let table = document.getElementById("offenseTable");
    let newRow = createOffenseRow();
    table.appendChild(newRow);
    updateOffenses();
}

function updateOffenses() {
    let offenses = [];
    document.querySelectorAll("#offenseTable tr").forEach(row => {
        let cells = row.querySelectorAll("input, select");
        offenses.push({
            date: cells[0].value,
            offenseNum: cells[1].value,
            suspensions: cells[2].value,
            type: cells[3].value,
            description: cells[4].value,
            nteDate: cells[5].value,
            actionTaken: cells[6].value,
            status: cells[7].value,
            comments: cells[8].value
        });
    });

    let fname = document.getElementById("fname").innerText;
    let lname = document.getElementById("lname").innerText;

    fetch("offenses.json")
        .then(response => response.json())
        .then(data => {
            let employeeIndex = data.findIndex(emp => emp.fname === fname && emp.lname === lname);

            if (employeeIndex !== -1) {
                // Update existing employee offenses
                data[employeeIndex].offenses = offenses;
            } else {
                // Create new employee record if not found
                data.push({ fname, lname, offenses });
            }

            // Save updated data
            saveOffenses(data);
        });
}

function saveOffenses(updatedData) {
    fetch("offenses.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
    })
    .then(response => response.text())
    .then(data => console.log("Offenses updated successfully!", data))
    .catch(error => console.error("Error saving offenses:", error));
}
