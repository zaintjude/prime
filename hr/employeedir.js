document.addEventListener("DOMContentLoaded", function () {
    const employeeForm = document.getElementById("employeeForm");
    const employeeTable = document.getElementById("employeeTable").querySelector("tbody");

    // Load employees on page load
    loadEmployees();

    // Form submission for adding a new employee
    employeeForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const requiredFields = [
            "statutory", "lastName", "firstName", "middleName", "department", "status",
            "position", "startDate", "employmentStatus", "contractStatus",
            "contactNumber", "birthdate", "cityAddress", "emailAddress",
            "ratePerDay", "sss", "pagibig", "tin", "philHealth"
        ];

        const optionalFields = {
            dateResign: document.getElementById("dateResign").value || "N/A",
            regularDate: document.getElementById("regularDate").value || "N/A"
        };

        const formData = {};
        let missingFields = [];

        requiredFields.forEach(field => {
            const value = document.getElementById(field).value.trim();
            if (!value) {
                missingFields.push(field);
            } else {
                formData[field] = value;
            }
        });

        // Add optional fields
        formData.dateResign = optionalFields.dateResign;
        formData.regularDate = optionalFields.regularDate;

        // If any required field is missing, stop submission
        if (missingFields.length > 0) {
            alert("Please fill in all required fields:\n- " + missingFields.join("\n- "));
            return;
        }

        fetch("employeedir.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                console.log("Server Response (POST):", data);
                if (data.success) {
                    alert("Employee added successfully!");
                    employeeForm.reset();
                    loadEmployees();
                } else {
                    alert("Error saving employee: " + (data.error || "Unknown error"));
                }
            })
            .catch(error => console.error("Error saving employee:", error));
    });

    // Function to add employee data to table
    function addEmployeeToTable(employee) {
        const row = document.createElement("tr");
        row.dataset.id = employee.id;

        const fieldsToShow = [
            "statutory", "lastName", "firstName", "middleName", "department", "status",
            "dateResign", "position", "startDate", "employmentStatus", "regularDate",
            "contractStatus", "contactNumber", "birthdate", "cityAddress", "emailAddress",
            "ratePerDay", "sss", "pagibig", "tin", "philHealth"
        ];

        fieldsToShow.forEach(key => {
            const cell = document.createElement("td");
            cell.textContent = employee[key] || "N/A";
            cell.dataset.key = key;
            cell.addEventListener("dblclick", function () {
                editCell(cell, employee.id);
            });
            row.appendChild(cell);
        });

        employeeTable.appendChild(row);
    }

    function loadEmployees() {
        fetch("employeedir.php")
            .then(response => response.json())
            .then(data => {
                console.log("Server Response (GET):", data);
                employeeTable.innerHTML = "";
                if (Array.isArray(data)) {
                    data.forEach(employee => addEmployeeToTable(employee));
                } else {
                    console.error("Invalid JSON response:", data);
                }
            })
            .catch(error => console.error("Error loading employees:", error));
    }

    function editCell(cell, id) {
        const oldValue = cell.textContent.trim();
        const input = document.createElement("input");
        input.type = "text";
        input.value = oldValue;
        cell.textContent = "";
        cell.appendChild(input);
        input.focus();

        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                input.blur();
            }
        });

        input.addEventListener("blur", function () {
            const newValue = input.value.trim();
            if (newValue !== oldValue) {
                saveCell(cell, newValue, id, oldValue);
            } else {
                cell.textContent = oldValue;
            }
        });
    }

    function saveCell(cell, newValue, id, oldValue) {
        const key = cell.dataset.key;

        console.log("Updating employee:", { id, key, newValue });

        fetch("employeedir.php", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, key, newValue })
        })
            .then(response => response.json())
            .then(data => {
                console.log("Server Response (PUT):", data);
                if (data.success) {
                    alert("Employee updated successfully!");
                    cell.textContent = newValue;
                } else {
                    alert("Error updating employee: " + (data.error || "Unknown error"));
                    cell.textContent = oldValue;
                }
            })
            .catch(error => {
                console.error("Error updating employee:", error);
                cell.textContent = oldValue;
            });
    }
});
