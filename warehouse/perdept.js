document.addEventListener("DOMContentLoaded", () => {
  const filters = {
    item: document.getElementById("filterItem"),
    year: document.getElementById("filterYear"),
    month: document.getElementById("filterMonth"),
    day: document.getElementById("filterDay"),
    requestedBy: document.getElementById("filterRequestedBy"),
    type: document.getElementById("filterType"),
    department: document.getElementById("filterDepartment"), // NEW FILTER
  };
  
  const tableBody = document.querySelector("#machiningReportTable tbody");
  const totalAmount = document.getElementById("totalAmount");
  const totalQty = document.getElementById("totalQty");
  const totalReceived = document.getElementById("totalReceived");
  const totalRequestedBy = document.getElementById("totalRequestedBy");

  let data = [];

  fetch("warehouse.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      populateFilters(data);
      applyFilters();
    });

  Object.values(filters).forEach(select => {
    select.addEventListener("change", applyFilters);
  });

  function populateFilters(data) {
    const items = new Set(), years = new Set(), months = new Set(),
          days = new Set(), requestedBys = new Set(), types = new Set(),
          departments = new Set();

    data.forEach(entry => {
      items.add(entry.itemName);
      const date = new Date(entry.date);
      if (!isNaN(date)) {
        years.add(date.getFullYear());
        months.add(date.getMonth() + 1);
        days.add(date.getDate());
      }
      requestedBys.add(entry.requestedBy);
      types.add(entry.type);
      departments.add(entry.department);
    });

    fillSelect(filters.item, items);
    fillSelect(filters.year, years);
    fillSelect(filters.month, months);
    fillSelect(filters.day, days);
    fillSelect(filters.requestedBy, requestedBys);
    fillSelect(filters.type, types);
    fillSelect(filters.department, departments); // NEW
  }

  function fillSelect(select, values) {
    select.innerHTML = `<option value="">All</option>`;
    [...values].sort().forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function applyFilters() {
    const filtered = data.filter(entry => {
      const date = new Date(entry.date);
      return (!filters.item.value || entry.itemName === filters.item.value) &&
             (!filters.year.value || date.getFullYear() == filters.year.value) &&
             (!filters.month.value || (date.getMonth() + 1) == filters.month.value) &&
             (!filters.day.value || date.getDate() == filters.day.value) &&
             (!filters.requestedBy.value || entry.requestedBy === filters.requestedBy.value) &&
             (!filters.type.value || entry.type === filters.type.value) &&
             (!filters.department.value || entry.department === filters.department.value); // NEW
    });

    renderTable(filtered);
  }

  function renderTable(rows) {
    tableBody.innerHTML = "";
    let total = 0, qty = 0;

    rows.forEach(entry => {
      const unitPrice = parseFloat(entry.uPrice) || 0;
      const quantity = parseFloat(entry.quantity) || 0;
      const totalValue = unitPrice * quantity;
      total += totalValue;
      qty += quantity;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.type}</td>
        <td>${entry.itemName}</td>
        <td>${entry.quantity}</td>
        <td>${entry.unit}</td>
        <td>₱${unitPrice.toFixed(2)}</td>
        <td>₱${totalValue.toFixed(2)}</td>
        <td>${entry.dimension || ""}</td>
        <td>${entry.department || ""}</td>
        <td>${entry.requestedBy}</td>
        <td>${entry.date}</td>
      `;
      tableBody.appendChild(tr);
    });

    totalAmount.textContent = `₱${total.toFixed(2)}`;
    totalQty.textContent = qty;
    totalReceived.textContent = rows.length;
    totalRequestedBy.textContent = new Set(rows.map(r => r.requestedBy)).size;
  }
});
