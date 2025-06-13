document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("requestForm");
    const tableBody = document.querySelector("#requestTable tbody");

    // Load existing requests
    fetch("servicerequest.json")
        .then(res => res.json())
        .then(data => {
            data.forEach(entry => addRow(entry));
        });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const request = {
            date: document.getElementById("date").value,
            requestNumber: document.getElementById("requestNumber").value,
            requestedBy: document.getElementById("requestedBy").value,
            department: document.getElementById("department").value,
            serviceType: document.getElementById("serviceType").value,
            priority: document.getElementById("priority").value,
            description: document.getElementById("description").value,
            location: document.getElementById("location").value,
            technician: document.getElementById("technician").value,
            status: document.getElementById("status").value,
            completionDate: document.getElementById("completionDate").value,
            remarks: document.getElementById("remarks").value
        };

        addRow(request);

        // Save current request to localStorage for printing
        localStorage.setItem("serviceRequest", JSON.stringify(request));

        saveToJSON(() => {
            window.open("https://dashproduction.x10.mx/masterfile/prime/logistics/service-request-print.html", "_blank");
        });

        form.reset();
    });

    function addRow(data) {
        const row = tableBody.insertRow();
        Object.values(data).forEach(value => {
            const cell = row.insertCell();
            cell.contentEditable = true;
            cell.innerText = value;
            cell.addEventListener("input", () => saveToJSON());
        });
    }

    function saveToJSON(callback) {
        const rows = tableBody.querySelectorAll("tr");
        const tableData = Array.from(rows).map(row => {
            const cells = row.querySelectorAll("td");
            return {
                date: cells[0].innerText,
                requestNumber: cells[1].innerText,
                requestedBy: cells[2].innerText,
                department: cells[3].innerText,
                serviceType: cells[4].innerText,
                priority: cells[5].innerText,
                description: cells[6].innerText,
                location: cells[7].innerText,
                technician: cells[8].innerText,
                status: cells[9].innerText,
                completionDate: cells[10].innerText,
                remarks: cells[11].innerText
            };
        });

        fetch("servicerequest.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(tableData)
        }).then(() => {
            if (callback) callback();
        });
    }
});
