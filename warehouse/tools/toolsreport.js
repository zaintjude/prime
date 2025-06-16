document.addEventListener("DOMContentLoaded", () => {
  let toolsData = [];

async function fetchTools() {
  try {
    const res = await fetch("https://zaintjude.github.io/prime/FABRICATION/warehouse/tools/tools.json");
    const data = await res.json();

    // Only get the 'tools' array for display and editing
    toolsData = data.tools || [];

    console.log("Fetched tools:", toolsData); // This will log only tools, no history or damaged
    displayTools(toolsData);

  } catch (err) {
    console.error("Error fetching tools:", err);
  }
}


  function displayTools(tools) {
    const tbody = document.querySelector("#toolsTable tbody");
    tbody.innerHTML = "";

    tools.forEach((tool) => {
      const row = document.createElement("tr");

      Object.entries(tool).forEach(([key, value]) => {
        if (key === 'returnDate' || key === 'returnCondition') return;

        const cell = document.createElement("td");
        cell.contentEditable = true;
        cell.textContent = value;
        cell.dataset.serial = tool.serial;   // Use serial as stable id
        cell.dataset.key = key;

        cell.addEventListener("blur", (e) => {
          const serial = e.target.dataset.serial;
          const key = e.target.dataset.key;
          const value = e.target.textContent.trim();

          // Find the correct tool in toolsData by serial
          const realIndex = toolsData.findIndex(tool => tool.serial === serial);
          if (realIndex !== -1) {
            toolsData[realIndex][key] = value;
            saveUpdatedTools();
          } else {
            console.error("Tool with serial", serial, "not found.");
          }
        });

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    document.getElementById("totalItems").textContent = tools.length;
  }

  function filterTools() {
    const filters = {
      toolName: document.getElementById("filterToolName").value.toLowerCase(),
      serial: document.getElementById("filterSerial").value.toLowerCase(),
      brand: document.getElementById("filterBrand").value.toLowerCase(),
      department: document.getElementById("filterDepartment").value.toLowerCase(),
      condition: document.getElementById("filterCondition").value.toLowerCase(),
      borrowedBy: document.getElementById("filterBorrowedBy").value.toLowerCase(),
    };

    const filtered = toolsData.filter(tool => {
      return (
        tool.toolName.toLowerCase().includes(filters.toolName) &&
        tool.serial.toLowerCase().includes(filters.serial) &&
        tool.brand.toLowerCase().includes(filters.brand) &&
        tool.department.toLowerCase().includes(filters.department) &&
        tool.toolCondition.toLowerCase().includes(filters.condition) &&
        tool.borrowedBy.toLowerCase().includes(filters.borrowedBy)
      );
    });

    displayTools(filtered);
  }

  function saveUpdatedTools() {
    fetch("https://dashproduction.x10.mx/masterfile/prime/FABRICATION/warehouse/tools/update-tools.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tools: toolsData }),
    })
    .then(res => res.text())
    .then(response => {
      console.log("Save response:", response);
    })
    .catch(err => {
      console.error("Error saving tools:", err);
    });
  }

  document.querySelectorAll(".filters input").forEach(input => {
    input.addEventListener("input", filterTools);
  });

  fetchTools();
});
