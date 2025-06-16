document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.querySelector("#resignedTable tbody");
    let resignedData = [];
    let timeoutId;

    const requiredFields = [
        "firstName", "lastName", "department",
        "position", "startDate", "dateResign", "lastDayOfWork",
        "issuedSteelToe", "issuedTools", "issuedUniform",
        "dateCleared", "remarks", "Lastpay&Coe", "Request", "Status"
    ];

    function fetchResignedData() {
        fetch("https://dashproduction.x10.mx/masterfile/prime/hr/resignedemp/resignedemp.json?nocache=" + Date.now()) 
            .then(response => response.json())
            .then(data => {
                const datePattern = /^\d{4}-\d{2}-\d{2}$/; 

                resignedData = data
                    .filter(emp => emp.dateResign && datePattern.test(emp.dateResign.trim()))
                    .map(emp => {
                        let filteredEmp = {};
                        requiredFields.forEach(field => {
                            filteredEmp[field] = emp[field] || "N/A"; // Ensures empty values are not undefined
                        });
                        return filteredEmp;
                    });

                loadTable(resignedData);
            })
            .catch(error => console.error("Error fetching resignedemp.json:", error));
    }

    fetchResignedData(); 

    function loadTable(data) {
    tableBody.innerHTML = "";
    data.forEach((emp, index) => {
        const row = document.createElement("tr");

        requiredFields.forEach(key => {
            const cell = document.createElement("td");
            const isEditable = !["firstName", "lastName", "department", "position", "startDate", "dateResign"].includes(key);

            cell.textContent = emp[key] === "N/A" ? "" : emp[key];

            if (isEditable) {
                cell.contentEditable = true;
                cell.addEventListener("input", () => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => updateData(index, key, cell.textContent), 1000);
                });
            }

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

    function updateData(index, key, value) {
        resignedData[index][key] = value.trim() || "N/A";
        saveData();
    }

    function saveData() {
        fetch("resignedemp.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resignedData)
        })
        .then(() => {
            console.log("Data saved successfully!");
            fetchResignedData(); // Reload table after saving
        })
        .catch(error => console.error("Error saving data:", error));
    }

    document.querySelectorAll(".filters input").forEach(input => {
        input.addEventListener("input", filterData);
    });

   function filterData() {
    const fname = document.getElementById("searchFname").value.toLowerCase();
    const lname = document.getElementById("searchLname").value.toLowerCase();
    const department = document.getElementById("searchDepartment").value.toLowerCase();
    const position = document.getElementById("searchPosition").value.toLowerCase();
    const dateHired = document.getElementById("searchDateHired").value;
    const remarks = document.getElementById("searchRemarks").value.toLowerCase();
    const status = document.getElementById("searchStatus").value.toLowerCase();

    const filteredData = resignedData.filter(emp =>
        (!fname || emp.firstName?.toLowerCase().includes(fname)) &&
        (!lname || emp.lastName?.toLowerCase().includes(lname)) &&
        (!department || emp.department?.toLowerCase().includes(department)) &&
        (!position || emp.position?.toLowerCase().includes(position)) &&
        (!dateHired || emp.startDate === dateHired) &&
        (!remarks || emp.remarks?.toLowerCase().includes(remarks)) &&
        (!status || emp.Status?.toLowerCase().includes(status)) // Fixed condition for Status
    );

    loadTable(filteredData);
}


});
