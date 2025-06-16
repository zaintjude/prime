document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#inventoryTable tbody");
    const filterItem = document.getElementById("filterItem");
    const filterDepartment = document.getElementById("filterDepartment");
    const applyFiltersBtn = document.getElementById("applyFilters");
    const addRowBtn = document.getElementById("addRowBtn");

    // Hide the Add Row button
    if (addRowBtn) {
        addRowBtn.style.display = "none";
    }

    let inventoryData = [];

    // Load and merge inventory.json and warehouse.json
    function loadData() {
        Promise.all([
            fetch("inventory.json").then(res => res.json()),
            fetch("warehouse.json").then(res => res.json())
        ])
            .then(([inventory, warehouse]) => {
                inventory = Array.isArray(inventory) ? inventory : Object.values(inventory);
                const grouped = {};

                warehouse.forEach(wh => {
                    const key = `${wh.itemName.trim().toLowerCase()}|${wh.unit.trim().toLowerCase()}|${wh.dimension.trim().toLowerCase()}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            itemName: wh.itemName.trim(),
                            unit: wh.unit.trim(),
                            dimension: wh.dimension.trim(),
                            department: wh.department || "",
                            requestedBy: wh.requestedBy || "",
                            date: wh.date || "",
                            uPrice: parseFloat(wh.uPrice) || 0,
                            received: 0,
                            released: 0
                        };
                    }

                    const type = wh.type?.toLowerCase();
                    const qty = parseFloat(wh.quantity) || 0;
                    if (type === "received") {
                        grouped[key].received += qty;
                    } else if (type === "released") {
                        grouped[key].released += qty;
                    }
                });

                Object.values(grouped).forEach(group => {
                    const finalQty = Math.max(0, group.received - group.released);
                    const existing = inventory.find(inv =>
                        inv.itemName.trim().toLowerCase() === group.itemName.trim().toLowerCase() &&
                        inv.unit.trim().toLowerCase() === group.unit.trim().toLowerCase() &&
                        inv.dimension.trim().toLowerCase() === group.dimension.trim().toLowerCase()
                    );

                    if (existing) {
                        existing.qty = finalQty;
                        existing.uPrice = group.uPrice;
                        existing.total = (finalQty * group.uPrice).toFixed(2);
                    } else {
                        inventory.push({
                            itemName: group.itemName,
                            qty: finalQty,
                            unit: group.unit,
                            uPrice: group.uPrice,
                            total: (finalQty * group.uPrice).toFixed(2),
                            dimension: group.dimension,
                            department: group.department,
                            requestedBy: group.requestedBy,
                            date: group.date
                        });
                    }
                });

                inventoryData = inventory.sort((a, b) =>
                    a.itemName.toLowerCase().localeCompare(b.itemName.toLowerCase())
                );
                renderTable(inventoryData);
                populateDepartments(inventoryData);
            })
            .catch(err => console.error("Error loading data:", err));
    }

    function saveInventory() {
        fetch("inventory.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inventoryData)
        })
            .then(res => res.text())
            .then(msg => console.log("Saved:", msg))
            .catch(err => console.error("Save error:", err));
    }

   function renderTable(data) {
    tableBody.innerHTML = "";

    data.forEach((item) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${item.itemName}</td>
            <td>${item.qty}</td>
            <td>${item.unit}</td>
            <td>${item.uPrice}</td>
            <td>${(item.qty * item.uPrice).toFixed(2)}</td>
            <td>${item.dimension}</td>
            <td>${item.department}</td>
            <td>${item.requestedBy}</td>
            <td>${item.date}</td>
        `;

            Array.from(row.cells).forEach((cell, cellIndex) => {
                if (cellIndex === 4) return;
                cell.addEventListener("blur", () => {
                    const cells = row.cells;
                    const updated = {
                        itemName: cells[0].innerText.trim(),
                        qty: parseFloat(cells[1].innerText) || 0,
                        unit: cells[2].innerText.trim(),
                        uPrice: parseFloat(cells[3].innerText) || 0,
                        total: (parseFloat(cells[1].innerText) * parseFloat(cells[3].innerText)).toFixed(2),
                        dimension: cells[5].innerText.trim(),
                        department: cells[6].innerText.trim(),
                        requestedBy: cells[7].innerText.trim(),
                        date: cells[8].innerText.trim()
                    };
                    inventoryData[index] = updated;
                    inventoryData.sort((a, b) => a.itemName.toLowerCase().localeCompare(b.itemName.toLowerCase()));
                    renderTable(inventoryData);
                    saveInventory();
                });
            });
        });
    }

    function populateDepartments(data) {
        const departments = [...new Set(data.map(item => item.department))];
        filterDepartment.innerHTML = `<option value="">Select Department</option>`;
        departments.forEach(dep => {
            const option = document.createElement("option");
            option.value = dep;
            option.textContent = dep;
            filterDepartment.appendChild(option);
        });
    }

    applyFiltersBtn.addEventListener("click", () => {
        const itemFilter = filterItem.value.toLowerCase();
        const depFilter = filterDepartment.value;

        // If both filters are empty, show all data (no filtering)
        if (itemFilter === "" && depFilter === "") {
            renderTable(inventoryData);
        } else {
            const filtered = inventoryData.filter(item =>
                item.itemName.toLowerCase().includes(itemFilter) &&
                (depFilter === "" || item.department === depFilter)
            );
            renderTable(filtered);
        }
    });

    loadData();
});
