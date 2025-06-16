document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("leaveCreditsTableBody");
    const departmentFilter = document.getElementById("departmentFilter");
    const lastNameFilter = document.getElementById("lastNameFilter");

    let empData = [];
    let leaveData = [];

    console.log("🔄 Fetching employee and leave data...");

    fetch("https://zaintjude.github.io/prime/hr/empdir.json")
        .then(response => response.json())
        .then(data => {
            empData = data;
            console.log("✅ Employee Data Loaded:", empData);
            populateDepartmentDropdown();
            return fetch("https://zaintjude.github.io/prime/hr/leavecredits/leavecredits.php")
                .then(response => response.json());
        })
        .then(data => {
            leaveData = data;
            console.log("✅ Leave Credits Loaded:", leaveData);
            populateTable();
        })
        .catch(error => console.error("❌ Error loading data:", error));

    function populateTable() {
        console.log("🔄 Populating table...");
        tableBody.innerHTML = "";

        const today = new Date();
        const currentYear = today.getFullYear();

        empData.forEach(emp => {
            const startDate = new Date(emp.startDate);
            const tenure = (today - startDate) / (1000 * 60 * 60 * 24 * 365);

            if (isNaN(startDate) || tenure < 1) return;

            let leaveRecord = leaveData.find(l => l.lname === emp.lastName && l.fname === emp.firstName);
            if (!leaveRecord) {
                leaveRecord = {
                    fname: emp.firstName,
                    lname: emp.lastName,
                    startDate: emp.startDate,
                    department: emp.department || "",
                    janFeb: "",
                    marApr: "",
                    mayJun: "",
                    julAug: "",
                    sepOct: "",
                    remaining: 5
                };
                leaveData.push(leaveRecord);
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${emp.startDate}</td>
                <td>${emp.firstName}</td>
                <td>${emp.lastName}</td>
                <td>${emp.department || ""}</td>
                <td contenteditable="true" data-key="janFeb">${leaveRecord.janFeb}</td>
                <td contenteditable="true" data-key="marApr">${leaveRecord.marApr}</td>
                <td contenteditable="true" data-key="mayJun">${leaveRecord.mayJun}</td>
                <td contenteditable="true" data-key="julAug">${leaveRecord.julAug}</td>
                <td contenteditable="true" data-key="sepOct">${leaveRecord.sepOct}</td>
                <td class="remaining">${leaveRecord.remaining}</td>
            `;

            row.querySelectorAll("td[contenteditable='true']").forEach(cell => {
                cell.addEventListener("input", () => {
                    const columnKey = cell.getAttribute("data-key");
                    leaveRecord[columnKey] = cell.innerText.trim();
                    removeOldDatesAndRecalculate();
                    saveLeaveData();
                });
            });

            tableBody.appendChild(row);
        });

        removeOldDatesAndRecalculate();
        console.log("✅ Table populated successfully.");
    }

    function removeOldDatesAndRecalculate() {
        console.log("🔄 Removing old dates & recalculating...");

        const currentYear = new Date().getFullYear();

        document.querySelectorAll("#leaveCreditsTableBody tr").forEach(row => {
            const lastName = row.children[2].innerText.trim();
            const firstName = row.children[1].innerText.trim();
            const startDate = row.children[0].innerText.trim();

            let leaveRecord = leaveData.find(l => l.lname === lastName && l.fname === firstName);
            if (!leaveRecord) return;

            ["janFeb", "marApr", "mayJun", "julAug", "sepOct"].forEach(period => {
                let validDates = leaveRecord[period]
                    ?.split(",")
                    .map(date => date.trim())
                    .filter(date => isValidDate(date) && (new Date(date).getFullYear() === currentYear || date === startDate));

                leaveRecord[period] = validDates.join(", ");
                row.querySelector(`td[data-key="${period}"]`).innerText = leaveRecord[period];
            });

            recalculateAllRows();
        });

        console.log("✅ Old dates removed, recalculation completed.");
    }

    function recalculateAllRows() {
        console.log("🔄 Recalculating all rows...");

        document.querySelectorAll("#leaveCreditsTableBody tr").forEach(row => {
            const lastName = row.children[2].innerText.trim();
            const firstName = row.children[1].innerText.trim();

            let leaveRecord = leaveData.find(l => l.lname === lastName && l.fname === firstName);
            if (!leaveRecord) return;

            let totalUsed = 0;
            ["janFeb", "marApr", "mayJun", "julAug", "sepOct"].forEach(period => {
                let dates = leaveRecord[period]?.split(",").map(date => date.trim()).filter(isValidDate);
                totalUsed += dates.length;
            });

            leaveRecord.remaining = Math.max(5 - totalUsed, 0);
            row.querySelector(".remaining").innerText = leaveRecord.remaining;
        });

        console.log("✅ Recalculation completed.");
    }

    function isValidDate(dateString) {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    }

    function saveLeaveData() {
        console.log("💾 Saving leave data...");

        fetch("https://dashproduction.x10.mx/masterfile/prime/hr/leavecredits/leavecredits.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leaveData)
        })
        .then(response => response.json())
        .then(data => {
            console.log("✅ Leave credits saved:", data);
        })
        .catch(error => console.error("❌ Error saving leave credits:", error));
    }

    function populateDepartmentDropdown() {
        const departments = [...new Set(empData.map(emp => emp.department).filter(d => d))];
        departments.forEach(dept => {
            const option = document.createElement("option");
            option.value = dept;
            option.textContent = dept;
            departmentFilter.appendChild(option);
        });
    }

    function filterTable() {
        const selectedDepartment = departmentFilter.value.toLowerCase();
        const lastNameSearch = lastNameFilter.value.toLowerCase();

        Array.from(tableBody.children).forEach(row => {
            const department = row.children[3].textContent.toLowerCase();
            const lastName = row.children[2].textContent.toLowerCase();

            const departmentMatch = !selectedDepartment || department === selectedDepartment;
            const lastNameMatch = !lastNameSearch || lastName.includes(lastNameSearch);

            row.style.display = departmentMatch && lastNameMatch ? "" : "none";
        });
    }

    departmentFilter.addEventListener("change", filterTable);
    lastNameFilter.addEventListener("input", filterTable);
});
