const dateSelect = document.getElementById("dateSelect");
const vehicleSelect = document.getElementById("vehicleSelect");
const driverSelect = document.getElementById("driverSelect");
const form = document.getElementById("logisticsForm");
const ganttChart = document.getElementById("ganttChart");
const scheduleTable = document.querySelector("#scheduleTable tbody");

let jsonData = [];
let vehiclesData = [];

function fetchData() {
    fetch("vehicle.json")
        .then(res => res.json())
        .then(data => {
            vehiclesData = data.vehicles;
            data.vehicles.forEach(v => {
                const opt = document.createElement("option");
                opt.value = v.vehicleName;
                opt.textContent = v.vehicleName;
                vehicleSelect.appendChild(opt);
            });
            data.drivers.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.driverName;
                opt.textContent = d.driverName;
                driverSelect.appendChild(opt);
            });
        });

    fetch("logistics.json")
        .then(res => res.json())
        .then(data => {
            jsonData = data;
            populateDateSelect();  // Populate date select after fetching data
            drawGanttChart(dateSelect.value);
        })
        .catch(err => {
            console.error("Failed to load logistics.json:", err);
            jsonData = [];
        });
}

function populateDateSelect() {
    // Clear existing options
    dateSelect.innerHTML = "";

    // Create a unique set of dates from the logistics data
    const uniqueDates = [...new Set(jsonData.map(item => item.start.split("T")[0]))];

    // Create an option for each unique date
    uniqueDates.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = date;
        dateSelect.appendChild(option);
    });

    // Set default date to the first date
    if (uniqueDates.length > 0) {
        dateSelect.value = uniqueDates[0];
    }
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newItem = {
        vehicle: vehicleSelect.value,
        driver: driverSelect.value,
        destination: document.getElementById("destination").value,
        odometer: document.getElementById("odometer").value,
        start: document.getElementById("startTime").value,
        end: document.getElementById("endTime").value
    };
    jsonData.push(newItem);
    saveData();
    drawGanttChart(dateSelect.value); // Redraw chart when new data is added
    form.reset();
});

function saveData() {
    fetch("logistics.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData)
    });
}

function drawGanttChart(selectedDate) {
    ganttChart.innerHTML = '';
    scheduleTable.innerHTML = '';

    const chartStart = new Date(`${selectedDate}T06:00:00`);
    const chartEnd = new Date(`${selectedDate}T23:00:00`);
    const intervalMs = 30 * 60 * 1000;
    const totalIntervals = (chartEnd - chartStart) / intervalMs;

    for (let i = 0; i <= totalIntervals; i++) {
        const time = new Date(chartStart.getTime() + i * intervalMs);
        const timeSlot = document.createElement("div");
        timeSlot.className = "time-slot";
        timeSlot.style.left = (i * 60) + "px";
        timeSlot.style.top = "0px";
        timeSlot.innerText = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        ganttChart.appendChild(timeSlot);
    }

    const filteredData = jsonData.filter(item =>
        item.start.startsWith(selectedDate)
    );

    filteredData.forEach((item, i) => {
        const start = new Date(item.start);
        const end = new Date(item.end);
        const startIndex = Math.floor((start - chartStart) / intervalMs);
        const duration = Math.floor((end - start) / intervalMs);

        const task = document.createElement("div");
        task.className = "task";
        task.style.left = (startIndex * 60) + "px";
        task.style.width = (duration * 60) + "px";
        task.style.top = (i * 50 + 30) + "px";
        task.textContent = item.vehicle;
        ganttChart.appendChild(task);

        const row = scheduleTable.insertRow();
        ["vehicle", "driver", "destination", "odometer", "start", "end"].forEach(key => {
            const cell = row.insertCell();
            cell.contentEditable = true;
            cell.textContent = item[key];
            cell.addEventListener("blur", () => {
                item[key] = cell.textContent;
                saveData();
                drawGanttChart(selectedDate);
            });
        });
    });

    ganttChart.style.height = (filteredData.length * 60 + 60) + "px";
}

dateSelect.addEventListener("change", () => {
    drawGanttChart(dateSelect.value);
});

document.getElementById("downloadChart").addEventListener("click", () => {
    html2canvas(ganttChart).then(canvas => {
        const a = document.createElement('a');
        a.href = canvas.toDataURL("image/png");
        a.download = "gantt_chart.png";
        a.click();
    });
});

// Initial load
fetchData();
