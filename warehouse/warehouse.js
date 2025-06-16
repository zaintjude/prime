document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("warehouse-form");
  const table = document.getElementById("logTable").getElementsByTagName("tbody")[0];
  const filterDate = document.getElementById("filterDate");

  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];
  if (filterDate) filterDate.value = today;

  let warehouseData = [];

  // 🔁 Load data from warehouse.json
  function loadWarehouseData() {
    fetch("warehouse.json")
      .then(res => res.json())
      .then(data => {
        warehouseData = data;
        renderTable();
      })
      .catch(err => console.error("Failed to load warehouse data:", err));
  }

  // ✅ Save data to server via PHP
  function saveWarehouseData() {
    fetch("warehouse.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(warehouseData)
    })
      .then(res => res.text())
      .then(response => {
        console.log("Server response:", response);
        renderTable(); // Re-render the table with the updated data
      })
      .catch(err => console.error("Save error:", err));
  }

  // ✅ Form submit (no duplicate restriction)
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const entry = {
      type: document.getElementById("type").value,
      itemName: document.getElementById("itemName").value,
      quantity: parseFloat(document.getElementById("quantity").value),
      unit: document.getElementById("unit").value,
      uPrice: parseFloat(document.getElementById("uPrice").value),
      total: (parseFloat(document.getElementById("uPrice").value) * parseFloat(document.getElementById("quantity").value)).toFixed(2),
      dimension: document.getElementById("dimension").value,
      department: document.getElementById("department").value,
      requestedBy: document.getElementById("requestedBy").value,
      date: document.getElementById("date").value
    };

    warehouseData.push(entry); // Add new data regardless of duplicates
    saveWarehouseData();
    form.reset();
  });

  // ✅ Render table
  function renderTable() {
    const filter = filterDate.value;
    const filtered = warehouseData.filter(item => !filter || item.date === filter);

    table.innerHTML = ""; // Clear the current table

    filtered.forEach((entry, index) => {
      const row = table.insertRow();

      const fields = [
        entry.type,
        entry.itemName,
        entry.quantity,
        entry.unit,
        entry.uPrice,
        entry.total,
        entry.dimension,
        entry.department,
        entry.requestedBy,
        entry.date
      ];

      fields.forEach(value => {
        const cell = row.insertCell();
        cell.innerText = value;
      });

      const actionsCell = row.insertCell();
      actionsCell.innerHTML = `
        <button onclick="editRow(${index})">Edit</button>
        <button onclick="deleteRow(${index})">Delete</button>
      `;
    });
  }

  // ✅ Edit row
  window.editRow = function (index) {
    const row = table.rows[index];
    row.contentEditable = true;

    // When the user finishes editing (on blur), update the warehouseData array
    row.addEventListener("blur", () => {
      const cells = row.cells;

      // Update the existing item in warehouseData
      warehouseData[index] = {
        type: cells[0].innerText,
        itemName: cells[1].innerText,
        quantity: parseFloat(cells[2].innerText),
        unit: cells[3].innerText,
        uPrice: parseFloat(cells[4].innerText),
        total: (parseFloat(cells[4].innerText) * parseFloat(cells[2].innerText)).toFixed(2),
        dimension: cells[6].innerText,
        department: cells[7].innerText,
        requestedBy: cells[8].innerText,
        date: cells[9].innerText
      };

      saveWarehouseData();
      row.contentEditable = false;
    }, { once: true });
  };

  // ✅ Delete row
  window.deleteRow = function (index) {
    warehouseData.splice(index, 1);
    saveWarehouseData();
  };

  filterDate.addEventListener("input", renderTable);

  // ✅ Initial load
  loadWarehouseData();
});
