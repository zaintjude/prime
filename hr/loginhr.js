function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (username === "prdprime" && password === "pcdi1.hr") {
        window.location.href = "dashboardhr.html";
    } else {
        alert("Invalid credentials");
    }
}
