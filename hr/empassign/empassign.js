document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("assignmentForm");
    const projectTables = document.getElementById("projectTables");
    let assignments = [];

    // Load existing assignments
    fetch("empassign.php")
        .then(response => response.json())
        .then(data => {
            assignments = data;
            renderTables();
        })
        .catch(() => console.warn("No existing data found"));

    // Auto-calculate number of days
    document.getElementById("dateFrom").addEventListener("change", calculateDays);
    document.getElementById("dateTo").addEventListener("change", calculateDays);

    function calculateDays() {
        let from = document.getElementById("dateFrom").value;
        let to = document.getElementById("dateTo").value;
        if (from && to) {
            let diff = calculateDaysBetween(from, to);
            document.getElementById("numDays").value = diff;
        }
    }

    // Handle new form submission
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const newAssignment = {
            lname: form.lname.value,
            fname: form.fname.value,
            position: form.position.value,
            department: form.department.value,
            project: form.project.value,
            dateFrom: form.dateFrom.value,
            dateTo: form.dateTo.value,
            numDays: form.numDays.value
        };

        assignments.push(newAssignment);
        saveData();
        renderTables();
        form.reset();
    });

    function renderTables() {
        projectTables.innerHTML = "";
        const grouped = {};

        assignments.forEach((a, i) => {
            if (!grouped[a.project]) grouped[a.project] = [];
            grouped[a.project].push({ ...a, globalIndex: i });
        });

        for (let project in grouped) {
            let html = `<h2>${project}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Last Name</th>
                            <th>First Name</th>
                            <th>Position</th>
                            <th>Department</th>
                            <th>From</th>
                            <th>To</th>
                            <th># Days</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>`;

            grouped[project].forEach(entry => {
                html += `
                    <tr data-index="${entry.globalIndex}">
                        <td contenteditable="true">${entry.lname}</td>
                        <td contenteditable="true">${entry.fname}</td>
                        <td contenteditable="true">${entry.position}</td>
                        <td contenteditable="true">${entry.department}</td>
                        <td contenteditable="true">${entry.dateFrom}</td>
                        <td contenteditable="true">${entry.dateTo}</td>
                        <td contenteditable="true">${entry.numDays}</td>
                        <td><button class="reassign-btn">Reassign</button></td>
                    </tr>`;
            });

            html += `</tbody></table>`;
            projectTables.innerHTML += html;
        }

        document.querySelectorAll("td[contenteditable='true']").forEach(cell => {
            cell.addEventListener("blur", updateAssignment);
        });

        document.querySelectorAll(".reassign-btn").forEach(button => {
            button.addEventListener("click", reassignEmployee);
        });
    }

    function updateAssignment(event) {
        const row = event.target.closest("tr");
        const index = parseInt(row.dataset.index, 10);

        assignments[index] = {
            lname: row.children[0].innerText.trim(),
            fname: row.children[1].innerText.trim(),
            position: row.children[2].innerText.trim(),
            department: row.children[3].innerText.trim(),
            dateFrom: row.children[4].innerText.trim(),
            dateTo: row.children[5].innerText.trim(),
            numDays: row.children[6].innerText.trim(),
            project: assignments[index].project // keep existing project
        };

        saveData();
    }

    function reassignEmployee(event) {
        const row = event.target.closest("tr");
        const index = parseInt(row.dataset.index, 10);
        const current = assignments[index];

        const newProject = prompt("Enter new project:", current.project);
        const newFrom = prompt("Enter new assigned from date:", current.dateFrom);
        const newTo = prompt("Enter new assigned to date:", current.dateTo);
        const newPos = prompt("Enter new position:", current.position);

        if (newProject && newFrom && newTo && newPos) {
            assignments.splice(index, 1);

            const reassigned = {
                lname: current.lname,
                fname: current.fname,
                position: newPos,
                department: current.department,
                project: newProject,
                dateFrom: newFrom,
                dateTo: newTo,
                numDays: calculateDaysBetween(newFrom, newTo)
            };

            assignments.push(reassigned);
            saveData();
            renderTables();
        }
    }

    function calculateDaysBetween(from, to) {
        let f = new Date(from), t = new Date(to);
        if (isNaN(f) || isNaN(t)) return 0;
        return Math.ceil(Math.abs(t - f) / (1000 * 60 * 60 * 24));
    }

    function saveData() {
        fetch("empassign.php", {
            method: "PUT",
            body: JSON.stringify(assignments),
            headers: { "Content-Type": "application/json" }
        })
        .then(res => res.json())
        .then(data => console.log(data.message || "Saved successfully."))
        .catch(() => console.warn("Failed to save data."));
    }
});
