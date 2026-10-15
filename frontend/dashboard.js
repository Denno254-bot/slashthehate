
/* =========================================
   DASHBOARD AUTHENTICATION
========================================= */

const token = localStorage.getItem("slashTheHateToken");
const storedUser = localStorage.getItem("slashTheHateUser");

/* =========================================
   CHECK LOGIN
========================================= */

if (!token || !storedUser) {
    alert("Please login to access your dashboard.");
    window.location.href = "login.html";
} else {
    startDashboard();
}

/* =========================================
   START DASHBOARD
========================================= */

function startDashboard() {
    let user;

    try {
        user = JSON.parse(storedUser);
    } catch (error) {
        console.error("Invalid user data:", error);
        localStorage.removeItem("slashTheHateToken");
        localStorage.removeItem("slashTheHateUser");
        window.location.href = "login.html";
        return;
    }

    if (!user || !user.id || !user.fullName || !user.username) {
        console.error("User information is incomplete.");
        localStorage.removeItem("slashTheHateToken");
        localStorage.removeItem("slashTheHateUser");
        window.location.href = "login.html";
        return;
    }

    /* =========================================
       DISPLAY USER INFORMATION
    ========================================= */

    const userName = document.getElementById("userName");
    const userUsername = document.getElementById("userUsername");
    const userInitial = document.getElementById("userInitial");

    if (userName) {
        userName.textContent = user.fullName;
    }

    if (userUsername) {
        userUsername.textContent = "@" + user.username;
    }

    if (userInitial) {
        userInitial.textContent = user.fullName.charAt(0).toUpperCase();
    }

    /* =========================================
       LOGOUT
    ========================================= */

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("slashTheHateToken");
            localStorage.removeItem("slashTheHateUser");
            window.location.href = "login.html";
        });
    }

    /* =========================================
       LOAD USER PROGRESS
    ========================================= */

    loadUserProgress(user.id);
}

/* =========================================
   FETCH USER PROGRESS
========================================= */

async function loadUserProgress(userId) {
    try {
        const response = await fetch(
            `/api/user/progress/${userId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
            alert("Your session has expired. Please login again.");
            localStorage.removeItem("slashTheHateToken");
            localStorage.removeItem("slashTheHateUser");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            console.error("Progress error:", data.message);
            return;
        }

        const progress = data.progress;

        if (!progress) {
            console.error("No progress data received.");
            return;
        }

        /* =========================================
           UPDATE DASHBOARD STATISTICS
        ========================================= */

        const statNumbers = document.querySelectorAll(".stat-card strong");

        if (statNumbers[0]) {
            statNumbers[0].textContent = progress.lessons_completed ?? 0;
        }

        if (statNumbers[1]) {
            statNumbers[1].textContent = progress.quizzes_completed ?? 0;
        }

        if (statNumbers[2]) {
            statNumbers[2].textContent = progress.reports_submitted ?? 0;
        }

    } catch (error) {
        console.error("Progress loading error:", error);
    }
}


// ========================================
// SHOW ADMIN OPTION ONLY TO ADMIN ACCOUNTS
// ========================================

const adminSection = document.getElementById("adminSection");

const savedUser = localStorage.getItem("slashTheHateUser");

if (adminSection && savedUser) {
    try {
        const user = JSON.parse(savedUser);

        if (user.role === "admin") {
            adminSection.style.display = "block";
        } else {
            adminSection.style.display = "none";
        }
    } catch (error) {
        adminSection.style.display = "none";
        console.error("Could not verify the saved user role:", error);
    }
}