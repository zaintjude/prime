document.addEventListener('DOMContentLoaded', () => {
    const vehicleSelect = document.getElementById('vehicleSelect');
    const scheduleBody = document.getElementById('scheduleBody');
    const addBtn = document.getElementById('addSchedule');
    const filterDate = document.getElementById('filterDate');
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');

    const employeeName = document.getElementById('employeeName');
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const purpose = document.getElementById('purpose');
    const destination = document.getElementById('destination');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    filterDate.valueAsDate = tomorrow;

    for (let m = 1; m <= 12; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        filterMonth.appendChild(opt);
    }

    for (let y = tomorrow.getFullYear(); y >= tomorrow.getFullYear() - 5; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        filterYear.appendChild(opt);
    }

    filterMonth.value = tomorrow.getMonth() + 1;
    filterYear.value = tomorrow.getFullYear();

    fetch('https://zaintjude.github.io/prime/logistics/vehicle.json.html')
        .then(res => res.json())
        .then(data => {
            data.vehicles.forEach(vehicle => {
                const opt = document.createElement('option');
                opt.value = JSON.stringify(vehicle);
                opt.textContent = `${vehicle.vehicleName} (${vehicle.plateNumber})`;
                vehicleSelect.appendChild(opt);
            });
        });

    function loadSchedule() {
        fetch('schedule.json?ts=' + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                scheduleBody.innerHTML = '';
                const selectedDate = filterDate.value;
                const selectedMonth = filterMonth.value;
                const selectedYear = filterYear.value;

                data.forEach((entry, index) => {
                    if (
                        entry.date === selectedDate &&
                        parseInt(entry.month) === parseInt(selectedMonth) &&
                        parseInt(entry.year) === parseInt(selectedYear)
                    ) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${entry.date}</td>
                            <td>${entry.vehicle}</td>
                            <td>${entry.plate}</td>
                            <td>${entry.employee}</td>
                            <td>${entry.startTime}</td>
                            <td>${entry.endTime}</td>
                            <td>${entry.purpose || ''}</td>
                            <td>${entry.destination || ''}</td>
                            <td>${entry.month}</td>
                            <td>${entry.year}</td>
                            <td><button onclick="deleteSchedule(${index})">Delete</button></td>
                        `;
                        scheduleBody.appendChild(tr);
                    }
                });
            });
    }

    window.deleteSchedule = function(index) {
        fetch('schedule.json')
            .then(res => res.json())
            .then(data => {
                data.splice(index, 1);
                return fetch('schedule.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            })
            .then(() => loadSchedule());
    };

    addBtn.addEventListener('click', () => {
        const employee = employeeName.value.trim();
        const selectedValue = vehicleSelect.value;
        const start = startTime.value;
        const end = endTime.value;
        const date = filterDate.value;
        const purposeText = purpose.value.trim();
        const destinationText = destination.value.trim();

        if (!employee || !start || !end || !selectedValue || !purposeText || !destinationText) {
            alert('Please fill in all fields.');
            return;
        }

        if (start >= end) {
            alert('Start time should be earlier than end time.');
            return;
        }

        const selected = JSON.parse(selectedValue);
        const scheduleMonth = new Date(date).getMonth() + 1;
        const scheduleYear = new Date(date).getFullYear();

        fetch('schedule.json')
            .then(res => res.json())
            .then(data => {
                const hasConflict = data.some(entry =>
                    entry.vehicle === selected.vehicleName &&
                    entry.date === date &&
                    !(
                        end <= entry.startTime || start >= entry.endTime
                    )
                );

                if (hasConflict) {
                    alert("Time conflict. Choose another vehicle or time slot.");
                    throw new Error("Conflict found");
                }

                const newEntry = {
                    date,
                    month: scheduleMonth,
                    year: scheduleYear,
                    vehicle: selected.vehicleName,
                    plate: selected.plateNumber,
                    employee,
                    startTime: start,
                    endTime: end,
                    purpose: purposeText,
                    destination: destinationText
                };

                data.push(newEntry);

                return fetch('schedule.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            })
            .then(() => {
                // Reset form
                employeeName.value = '';
                startTime.value = '';
                endTime.value = '';
                purpose.value = '';
                destination.value = '';
                vehicleSelect.selectedIndex = 0;

                // Reload table
                filterDate.value = date;
                filterMonth.value = scheduleMonth;
                filterYear.value = scheduleYear;
                loadSchedule();

                alert('SCHEDULED! PLEASE PREPARE NOW YOUR GATEPASS AND SIGN IT FOR TOMORROWS SCHEDULE AND GIVE IT TO LOGISTICS TEAM. THANK YOU.');
            })
            .catch(err => {
                if (err.message !== "Conflict found") {
                    console.error(err);
                    alert('An error occurred while scheduling.');
                }
            });
    });

    filterDate.addEventListener('change', loadSchedule);
    filterMonth.addEventListener('change', loadSchedule);
    filterYear.addEventListener('change', loadSchedule);

    loadSchedule();
});
