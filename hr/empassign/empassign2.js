document.addEventListener("DOMContentLoaded", loadHistoryData);

let historyData = [];

function loadHistoryData() {
    fetch("empassign2.json")
        .then(response => response.json())
        .then(data => {
            historyData = data;
            populateTable(historyData);
        })
        .catch(error => console.error("Error loading history data:", error));
}

function populateTable(data) {
    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";  // Clear existing table rows

    data.forEach(entry => {
        let row = `<tr>
            <td>${entry.lname}</td>
            <td>${entry.fname}</td>
            <td>${entry.position}</td>
            <td>${entry.department}</td>
            <td>${entry.dateFrom}</td>
            <td>${entry.dateTo}</td>
            <td>${entry.numDays}</td>
            <td>${entry.project}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function filterTable() {
    let lname = document.getElementById("searchLname").value.toLowerCase();
    let fname = document.getElementById("searchFname").value.toLowerCase();
    let department = document.getElementById("searchDepartment").value.toLowerCase();
    let project = document.getElementById("searchProject").value.toLowerCase();
    let date = document.getElementById("searchDate").value;

    let filteredData = historyData.filter(entry => 
        (lname === "" || entry.lname.toLowerCase().includes(lname)) &&
        (fname === "" || entry.fname.toLowerCase().includes(fname)) &&
        (department === "" || entry.department.toLowerCase().includes(department)) &&
        (project === "" || entry.project.toLowerCase().includes(project)) &&
        (date === "" || entry.dateFrom === date || entry.dateTo === date)
    );

    populateTable(filteredData);
}

function exportToExcel() {
    let table = document.getElementById("historyTable");
    let wb = XLSX.utils.table_to_book(table, { sheet: "Employee Assignments" });
    XLSX.writeFile(wb, "Employee_Assignment_History.xlsx");
}
