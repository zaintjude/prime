document.addEventListener("DOMContentLoaded", function () {
    const absenceForm = document.getElementById("absenceForm");
    const pendingTable = document.getElementById("pendingTable").querySelector("tbody");
    const approvedTable = document.getElementById("approvedTable").querySelector("tbody");

    // Search filter elements
    const filterYear = document.getElementById("filterYear");
    const filterLastName = document.getElementById("filterLastName");
    const filterFirstName = document.getElementById("filterFirstName");
    const filterDepartment = document.getElementById("filterDepartment");

    // Load stored absences
    fetch("absences.json")
        .then(response => response.json())
        .then(data => {
            console.log("Loaded absences:", data);
            data.pending.forEach(entry => addRowToTable(entry, pendingTable, false));
            data.approved.forEach(entry => addRowToTable(entry, approvedTable, true));
        })
        .catch(error => console.error("Error loading absences:", error));

    // Handle form submission
    absenceForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const dateFrom = document.getElementById("dateFrom").value;
        const dateTo = document.getElementById("dateTo").value;
        const numDays = calculateDays(dateFrom, dateTo);
        const managerCode = document.getElementById("managerCode").value;

        if (!["EXP0310", "MCD0410", "FCD0510", "DPS0610", "ADM0710"].includes(managerCode)) {
            alert("Invalid Manager Code");
            return;
        }

        const newAbsence = {
            year: new Date().getFullYear(),
            dateLogged: new Date().toISOString().split("T")[0],
            lastName: document.getElementById("lastName").value,
            firstName: document.getElementById("firstName").value,
            department: document.getElementById("department").value,
            position: document.getElementById("position").value,
            status: document.getElementById("status").value,
            reason: document.getElementById("reason").value,
            dateFrom: dateFrom,
            dateTo: dateTo,
            numDays: numDays,
            managerCode: "******",
            actionTaken: "Choose"
        };

        addRowToTable(newAbsence, pendingTable, false);
        saveData();
        absenceForm.reset();
    });

    function addRowToTable(entry, table, isApproved) {
        const row = table.insertRow();

        Object.keys(entry).forEach((key, index) => {
            const cell = row.insertCell(index);

            if (key === "actionTaken") {
                if (!isApproved) {
                    const select = document.createElement("select");
                    ["Choose", "Given Memo", "Given Verbal", "Given Written", "Valid", "Cancelled"].forEach(optionText => {
                        const option = document.createElement("option");
                        option.value = optionText;
                        option.textContent = optionText;
                        select.appendChild(option);
                    });

                    select.value = entry[key] || "Choose";
                    select.addEventListener("change", function () {
                        entry.actionTaken = select.value;
                        if (select.value !== "Choose" && !isApproved) {
                            moveToApproved(row, entry);
                        }
                        saveData();
                    });
                    cell.appendChild(select);
                } else {
                    cell.textContent = entry[key] || "Pending";
                }
            } else if (key === "managerCode") {
                cell.textContent = "******";
            } else {
                cell.textContent = entry[key];
            }
        });
    }

    function moveToApproved(row, entry) {
        entry.year = new Date().getFullYear();
        entry.dateLogged = new Date().toISOString().split("T")[0];
        entry.numDays = calculateDays(entry.dateFrom, entry.dateTo);
        addRowToTable(entry, approvedTable, true);
        row.remove();
        saveData();
    }

    function saveData() {
        const pendingData = Array.from(pendingTable.rows).map(row => getRowData(row));
        const approvedData = Array.from(approvedTable.rows).map(row => getRowData(row));

        console.log("Saving data:", { pending: pendingData, approved: approvedData });

        fetch("absences.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pending: pendingData, approved: approvedData })
        }).catch(error => console.error("Error saving data:", error));
    }

    function getRowData(row) {
        const cells = row.cells;

        return {
            year: new Date().getFullYear(),
            dateLogged: cells[1]?.textContent || "",
            lastName: cells[2]?.textContent || "",
            firstName: cells[3]?.textContent || "",
            department: cells[4]?.textContent || "",
            position: cells[5]?.textContent || "",
            status: cells[6]?.textContent || "",
            reason: cells[7]?.textContent || "",
            dateFrom: cells[8]?.textContent || "",
            dateTo: cells[9]?.textContent || "",
            numDays: cells[10]?.textContent || "0",
            managerCode: "******",
            actionTaken: cells[12]?.querySelector("select")
                ? cells[12].querySelector("select").value
                : cells[12]?.textContent.trim() || "Choose"
        };
    }

    function calculateDays(from, to) {
        const startDate = new Date(from);
        const endDate = new Date(to);
        return isNaN(startDate) || isNaN(endDate) ? "0" : Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24) + 1);
    }

    // Search Filter Functionality
    [filterYear, filterLastName, filterFirstName, filterDepartment].forEach(input => {
        input.addEventListener("input", function () {
            applyFilters(approvedTable);
        });
    });

    function applyFilters(table) {
        const year = filterYear.value.trim().toLowerCase();
        const lastName = filterLastName.value.trim().toLowerCase();
        const firstName = filterFirstName.value.trim().toLowerCase();
        const department = filterDepartment.value.trim().toLowerCase();

        Array.from(table.rows).forEach(row => {
            const rowData = Array.from(row.cells).map(cell => cell.textContent.trim().toLowerCase());

            const matchesYear = year === "" || rowData[0].includes(year);
            const matchesLastName = lastName === "" || rowData[2].includes(lastName);
            const matchesFirstName = firstName === "" || rowData[3].includes(firstName);
            const matchesDepartment = department === "" || rowData[4].includes(department);

            row.style.display = (matchesYear && matchesLastName && matchesFirstName && matchesDepartment) ? "" : "none";
        });
    }
});
