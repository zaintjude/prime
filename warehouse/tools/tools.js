document.addEventListener("DOMContentLoaded", () => {
    const toolForm = document.getElementById("toolForm");
    const toolTableBody = document.getElementById("toolTableBody");
    const historyTableBody = document.getElementById("historyTableBody");
    const damagedTableBody = document.getElementById("damagedTableBody");

    let toolsData = [];
    let historyData = [];
    let damagedData = [];

    fetch("tools.json")
        .then(res => res.json())
        .then(json => {
            toolsData = json.tools || [];
            historyData = json.history || [];
            damagedData = json.damaged || [];
            renderToolTable();
            renderHistoryTable();
            renderDamagedTable();
        });

    toolForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const serial = document.getElementById("toolSerial").value;

        if (toolsData.some(tool => tool.serial === serial)) {
            alert("A tool with this serial number already exists.");
            return;
        }

        const newTool = {
            toolName: document.getElementById("toolName").value,
            size: document.getElementById("toolSize").value,
            serial: serial,
            model: document.getElementById("toolModel").value,
            brand: document.getElementById("toolBrand").value,
            department: document.getElementById("toolDepartment").value,
            toolCondition: document.getElementById("toolCondition").value,
            status: "Available",
            borrowedBy: "",
            borrowedOn: "",
            returnDate: ""
        };

        toolsData.push(newTool);
        saveData();
        renderToolTable();
        toolForm.reset();
    });

    toolTableBody.addEventListener("change", (e) => {
        if (e.target && e.target.classList.contains("statusSelect")) {
            const row = e.target.closest("tr");
            const serial = row.getAttribute("data-serial");
            const tool = toolsData.find(t => t.serial === serial);
            if (!tool) return;

            const newStatus = e.target.value;
            const today = new Date().toISOString().split("T")[0];

            if (newStatus === "Borrowed") {
                const borrower = prompt("Enter name of the borrower:");
                if (!borrower) {
                    e.target.value = tool.status; // revert if no input
                    return;
                }
                tool.status = "Borrowed";
                tool.borrowedBy = borrower;
                tool.borrowedOn = today;

            } else if (newStatus === "Available" && tool.status === "Borrowed") {
                const condition = prompt("Enter condition upon return (Good, Damaged, Broken, Stolen):");
                if (!condition) {
                    e.target.value = tool.status;
                    return;
                }

                const lowerCondition = condition.toLowerCase();
                const today = new Date().toISOString().split("T")[0];

                const conditionCapitalized = capitalize(lowerCondition);

                // Create history log entry
                historyData.push({
                    ...tool,
                    returnDate: today,
                    condition: conditionCapitalized
                });

                if (["damaged", "broken", "stolen"].includes(lowerCondition)) {
                    tool.status = conditionCapitalized;
                    damagedData.push({
                        ...tool,
                        returnCondition: conditionCapitalized,
                        returnDate: today
                    });
                    toolsData = toolsData.filter(t => t.serial !== serial); // remove from current inventory
                } else if (lowerCondition === "good") {
                    tool.status = "Available";
                    tool.toolCondition = "Good";
                    tool.borrowedBy = "";
                    tool.borrowedOn = "";
                    tool.returnDate = "";
                } else {
                    alert("Invalid condition. Please enter Good, Damaged, Broken, or Stolen.");
                    e.target.value = tool.status;
                    return;
                }
            }

            saveData();
            renderToolTable();
            renderHistoryTable();
            renderDamagedTable();
        }
    });

    function renderToolTable() {
        toolTableBody.innerHTML = "";
        toolsData.forEach(tool => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-serial", tool.serial);
            tr.innerHTML = `
                <td>${tool.toolName}</td>
                <td>${tool.size}</td>
                <td>${tool.serial}</td>
                <td>${tool.model}</td>
                <td>${tool.brand}</td>
                <td>${tool.department}</td>
                <td>
                    <select class="statusSelect">
                        <option value="Available" ${tool.status === "Available" ? "selected" : ""}>Available</option>
                        <option value="Borrowed" ${tool.status === "Borrowed" ? "selected" : ""}>Borrowed</option>
                    </select>
                </td>
                <td>${tool.toolCondition}</td>
                <td>${tool.borrowedBy}</td>
                <td>${tool.borrowedOn}</td>
            `;
            toolTableBody.appendChild(tr);
        });
    }

    function renderHistoryTable() {
        historyTableBody.innerHTML = "";
        historyData.forEach(record => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${record.toolName}</td>
                <td>${record.size}</td>
                <td>${record.serial}</td>
                <td>${record.model}</td>
                <td>${record.brand}</td>
                <td>${record.department}</td>
                <td>${record.borrowedBy}</td>
                <td>${record.borrowedOn}</td>
                <td>${record.returnDate}</td>
                <td>${record.condition}</td>
            `;
            historyTableBody.appendChild(tr);
        });
    }

    function renderDamagedTable() {
        damagedTableBody.innerHTML = "";
        damagedData.forEach(tool => {
            const tr = document.createElement("tr");
            const actionBtnsStyle = tool.returnCondition === "REPLACE/MEMO" ? "display:none;" : "";

            tr.innerHTML = `
            <td>${tool.toolName}</td>
            <td>${tool.size}</td>
            <td>${tool.serial}</td>
            <td>${tool.model}</td>
            <td>${tool.brand}</td>
            <td>${tool.department}</td>
            <td>${tool.returnCondition}</td>
            <td>${tool.returnDate || ""}</td>
            <td class="actionBtns" style="${actionBtnsStyle}">
                <button class="fixBtn" data-serial="${tool.serial}">Fixed</button>
                <button class="replaceBtn" data-serial="${tool.serial}">Replace</button>
            </td>
        `;
            damagedTableBody.appendChild(tr);
        });
    }


    damagedTableBody.addEventListener("click", (e) => {
        const toolSerial = e.target.getAttribute("data-serial");
        if (!toolSerial) return;

        const toolIndex = damagedData.findIndex(t => t.serial === toolSerial);
        if (toolIndex === -1) return;

        const tool = damagedData[toolIndex];

        if (e.target.classList.contains("fixBtn")) {
            tool.status = "Available";
            tool.toolCondition = "Good";
            tool.borrowedBy = "";
            tool.borrowedOn = "";
            tool.returnDate = "";

            toolsData.push(tool);
            damagedData.splice(toolIndex, 1);
            saveData();
            renderToolTable();
            renderDamagedTable();
        }

        if (e.target.classList.contains("replaceBtn")) {
            tool.status = "REPLACE/MEMO";
            tool.returnCondition = "REPLACE/MEMO";

            const row = e.target.closest("tr");
            const actionButtons = row.querySelectorAll(".actionBtns");
            actionButtons.forEach(btn => btn.style.display = "none");

            saveData();
            renderDamagedTable();
        }
    });

    function saveData() {
        const data = {
            tools: toolsData,
            history: historyData,
            damaged: damagedData
        };

        fetch("tools.php", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" }
        })
            .then(res => res.json())
            .then(json => console.log("Saved:", json))
            .catch(err => console.error("Error saving:", err));
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
});
