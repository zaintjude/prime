document.addEventListener("DOMContentLoaded", function () {
    const searchContainer = document.createElement("div");
    searchContainer.style.display = "flex";
    searchContainer.style.justifyContent = "center";
    searchContainer.style.marginBottom = "20px";
    searchContainer.style.gap = "10px";

    const tableContainer = document.querySelector(".table-container");
    tableContainer.parentNode.insertBefore(searchContainer, tableContainer);

    const searchFields = ["lastName", "firstName", "department", "position", "employmentStatus", "contractStatus"];
    const filters = {};

    searchFields.forEach(field => {
        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("placeholder", `Search ${field.replace(/([A-Z])/g, ' $1')}`);
        input.setAttribute("id", field);
        input.addEventListener("input", filterTable);
        input.style.padding = "8px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "5px";
        searchContainer.appendChild(input);
        filters[field] = "";
    });

    const summaryContainer = document.createElement("div");
    summaryContainer.style.marginBottom = "10px";
    summaryContainer.style.textAlign = "center";
    summaryContainer.setAttribute("id", "summaryContainer");
    tableContainer.parentNode.insertBefore(summaryContainer, searchContainer);

    fetch("https://dashproduction.x10.mx/masterfile/prime/hr/empdir.json")
        .then(response => response.json())
        .then(data => {
            window.employeeData = data;
            populateTable(data);
            updateSummary(data);
        })
        .catch(error => console.error("Error loading employee data:", error));

    function populateTable(data) {
        const tableBody = document.getElementById("employeeTableBody");
        tableBody.innerHTML = "";
        data.forEach(employee => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${employee.statutory || ""}</td>
                <td>${employee.lastName || ""}</td>
                <td>${employee.firstName || ""}</td>
                <td>${employee.middleName || ""}</td>
                <td>${employee.department || ""}</td>
                <td>${employee.status || ""}</td>
                <td>${employee.dateResign || ""}</td>
                <td>${employee.position || ""}</td>
                <td>${employee.startDate || ""}</td>
                <td>${employee.employmentStatus || ""}</td>
                <td>${employee.regularDate || ""}</td>
                <td>${employee.contractStatus || ""}</td>
                <td>${employee.contactNumber || ""}</td>
                <td>${employee.birthdate || ""}</td>
                <td>${employee.cityAddress || ""}</td>
                <td>${employee.emailAddress || ""}</td>
                <td>${employee.ratePerDay || ""}</td>
                <td>${employee.sss || ""}</td>
                <td>${employee.pagibig || ""}</td>
                <td>${employee.tin || ""}</td>
                <td>${employee.philhealth || ""}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function filterTable() {
        searchFields.forEach(field => {
            filters[field] = document.getElementById(field).value.toLowerCase();
        });

        const filteredData = window.employeeData.filter(employee => {
            return searchFields.every(field =>
                employee[field]?.toLowerCase().includes(filters[field])
            );
        });

        populateTable(filteredData);
        updateSummary(filteredData);
    }

    function updateSummary(data) {
        const countByStatus = {};

        data.forEach(employee => {
            let status = employee.employmentStatus || "Unknown";
            let normalizedStatus = status.trim().toLowerCase();  // Normalize to lowercase

            countByStatus[normalizedStatus] = (countByStatus[normalizedStatus] || 0) + 1;
        });

        // Format display: Capitalize first letter of each status
        summaryContainer.innerHTML = Object.entries(countByStatus)
            .map(([status, count]) => {
                const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
                return `<strong>${formattedStatus}:</strong> <span>${count}</span>`;
            })
            .join(" | ");
    }

});