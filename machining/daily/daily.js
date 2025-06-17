document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#dailyTable tbody");
    const addRowBtn = document.getElementById("addRow");
    const clearFilterBtn = document.getElementById("clearFilter");
    const weekFilter = document.getElementById("weekFilter");
    const projectNameInput = document.getElementById("projectNameInput");

    const dayKeys = ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "monday"];
    const validStatuses = ["GOOD", "NOT GOOD"];
    let fullData = [];

    if (!tableBody || !addRowBtn || !clearFilterBtn || !weekFilter || !projectNameInput) {
        console.error("Missing essential elements in the DOM!");
        return;
    }

    const getCurrentWeekRange = () => {
        const currentDate = new Date();
        const daysSinceMonday = (currentDate.getDay() + 6) % 7;
        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - daysSinceMonday + 1));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const formatDate = date => `${date.getMonth() + 1}/${date.getDate()}`;
        return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    };

    const loadData = () => {
        fetch("daily.json?" + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                fullData = data;
                const currentWeek = getCurrentWeekRange();
                weekFilter.value = currentWeek;
                renderTable(currentWeek);
            })
            .catch(err => {
                console.error("Error loading data:", err);
            });
    };

    const renderTable = (selectedWeek) => {
        tableBody.innerHTML = "";
        const currentWeek = fullData.find(d => d.weekRange === selectedWeek);
        if (!currentWeek) return;

        projectNameInput.value = currentWeek.projectName || "";
        currentWeek.rows.forEach(row => insertRow(row));
        updateTotals();
    };

    const insertRow = (data = {}) => {
        const row = document.createElement("tr");
        const keys = ["description", "status", ...dayKeys];

        keys.forEach(key => {
            const cell = document.createElement("td");
            cell.contentEditable = true;
            cell.textContent = data[key] || "";
            row.appendChild(cell);

            cell.addEventListener("input", () => {
                if (dayKeys.includes(key)) {
                    const value = cell.textContent.trim();
                    if (isNaN(value) && value !== "") {
                        alert("Please enter a valid number.");
                        cell.textContent = "";
                        return;
                    }
                }
                saveData();
                updateTotals();
            });
        });

        const actionCell = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-row");
        deleteBtn.addEventListener("click", () => {
            row.remove();
            saveData();
            updateTotals();
        });

        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);
        tableBody.appendChild(row);
    };

    const saveData = () => {
        const selectedWeek = weekFilter.value;
        const currentYear = new Date().getFullYear();

        const rows = Array.from(tableBody.rows)
            .filter(tr => {
                const desc = tr.cells[0].textContent.trim().toUpperCase();
                return desc !== "LT TOTAL OUTPUT" && desc !== "DELIVERY TO MMTI";
            })
            .map(tr => ({
                description: tr.cells[0].textContent.trim(),
                status: tr.cells[1].textContent.trim(),
                tuesday: tr.cells[2].textContent.trim(),
                wednesday: tr.cells[3].textContent.trim(),
                thursday: tr.cells[4].textContent.trim(),
                friday: tr.cells[5].textContent.trim(),
                saturday: tr.cells[6].textContent.trim(),
                sunday: tr.cells[7].textContent.trim(),
                monday: tr.cells[8].textContent.trim()
            }));

        const updatedWeek = {
            year: currentYear,
            weekRange: selectedWeek,
            projectName: projectNameInput.value.trim(),
            rows
        };

        const index = fullData.findIndex(d => d.weekRange === selectedWeek && d.year === currentYear);
        if (index !== -1) {
            fullData[index] = updatedWeek;
        } else {
            fullData.push(updatedWeek);
        }

        fetch("daily.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fullData)
        })
        .then(res => res.json())
        .then(response => {
            if (response.status !== "success") {
                console.error("Save failed:", response.message);
            }
        })
        .catch(err => console.error("Error saving data:", err));
    };

    const updateTotals = () => {
        let ltSums = Array(7).fill(0);
        let mmtiSums = Array(7).fill(0);

        Array.from(tableBody.rows).forEach(row => {
            const status = row.cells[1].textContent.trim().toUpperCase();
            if (!validStatuses.includes(status)) return;

            dayKeys.forEach((key, i) => {
                const value = parseFloat(row.cells[i + 2].textContent.replace(/,/g, "").trim()) || 0;
                ltSums[i] += value;
                if (status === "GOOD") mmtiSums[i] += value;
            });
        });

        Array.from(tableBody.rows).forEach(row => {
            const desc = row.cells[0].textContent.trim().toUpperCase();
            if (desc === "LT TOTAL OUTPUT" || desc === "DELIVERY TO MMTI") {
                row.remove();
            }
        });

        createTotalRow("LT TOTAL OUTPUT", ltSums);
        createTotalRow("DELIVERY TO MMTI", mmtiSums);
    };

    const createTotalRow = (label, sums) => {
        const row = document.createElement("tr");
        const keys = [label, "", ...sums.map(val => val.toLocaleString())];
        keys.forEach(val => {
            const cell = document.createElement("td");
            cell.textContent = val;
            cell.contentEditable = false;
            row.appendChild(cell);
        });
        const actionCell = document.createElement("td");
        row.appendChild(actionCell);
        tableBody.appendChild(row);
    };

    addRowBtn.addEventListener("click", () => {
        insertRow();
        saveData();
    });

    clearFilterBtn.addEventListener("click", () => {
        weekFilter.value = "";
        loadData();
    });

    weekFilter.addEventListener("change", () => {
        renderTable(weekFilter.value);
    });

    // Listen for changes in the project name input field and automatically save it
    projectNameInput.addEventListener("input", () => {
        saveData();
    });

    loadData();
});
