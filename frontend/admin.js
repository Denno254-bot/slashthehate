
/* =========================================
   ADMIN DASHBOARD AUTHENTICATION
========================================= */
const API_BASE_URL = "http://localhost:3000";
const adminToken = localStorage.getItem("slashTheHateToken");
const adminStoredUser = localStorage.getItem("slashTheHateUser");

const adminMessage = document.getElementById("adminMessage");

function showAdminMessage(message) {
    if (adminMessage) {
        adminMessage.textContent = message;
    }
}

function adminLogout() {
    localStorage.removeItem("slashTheHateToken");
    localStorage.removeItem("slashTheHateUser");
    window.location.href = "login.html";
}

let adminUser;

try {
    adminUser = JSON.parse(adminStoredUser);
} catch (error) {
    adminUser = null;
}

if (!adminToken || !adminUser || adminUser.role !== "admin") {
    alert("Administrator access is required.");
    window.location.href = "login.html";

} else {
    const adminName = document.getElementById("adminName");

    if (adminName) {
        adminName.textContent =
            adminUser.full_name ||
            adminUser.fullName ||
            "Administrator";
    }

    loadAdminDashboard();

    // Refresh statistics and users every 15 seconds.
    setInterval(async () => {
        try {
            await Promise.all([
                loadAdminStats(),
                loadAdminUsers()
            ]);
        } catch (error) {
            console.error("Dashboard refresh failed:", error);
        }
    }, 15000);
}


document.getElementById("adminLogout")?.addEventListener(
    "click",
    adminLogout
);

/* =========================================
   AUTHENTICATED API REQUEST
========================================= */


async function adminFetch(url, options = {}) {
    const apiUrl = url.startsWith("http")
        ? url
        : `${API_BASE_URL}${url}`;

    const response = await fetch(apiUrl, {
        ...options,
        headers: {
            ...(options.headers || {}),
            "Authorization": `Bearer ${adminToken}`,
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
        adminLogout();
        throw new Error(
            data.message || "Your session is invalid or access is denied."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message || `Request failed (${response.status}).`
        );
    }

    return data;
}


/* =========================================
   LOAD DASHBOARD
========================================= */

async function loadAdminDashboard() {
    try {
        showAdminMessage("Loading administrator data...");

        await Promise.all([
            loadAdminStats(),
            loadAdminUsers(),
            loadAdminReports()
        ]);

        showAdminMessage("Dashboard data loaded.");

    } catch (error) {
        console.error("Admin dashboard error:", error);
        showAdminMessage(error.message || "Unable to load dashboard.");
    }
}

/* =========================================
   LOAD STATISTICS
========================================= */

async function loadAdminStats() {
    const data = await adminFetch(
        "/api/admin/stats"
    );

    document.getElementById("totalUsers").textContent =
        data.stats.users ?? 0;

    document.getElementById("totalLessons").textContent =
        data.stats.lessons ?? 0;

    document.getElementById("totalQuizzes").textContent =
        data.stats.quizzes ?? 0;

    document.getElementById("totalReports").textContent =
        data.stats.reports ?? 0;
}

/* =========================================
   SAFE TABLE CELL HELPER
========================================= */

function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value == null ? "" : String(value);
    row.appendChild(cell);
    return cell;
}

function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleString();
}

/* =========================================
   LOAD USERS
========================================= */

async function loadAdminUsers() {
    const table = document.getElementById("usersTable");
    table.replaceChildren();

    const data = await adminFetch(
        "/api/admin/users"
    );

    if (!data.users || data.users.length === 0) {
        const row = document.createElement("tr");
        const cell = addCell(row, "No registered users found.");
        cell.colSpan = 6;
        table.appendChild(row);
        return;
    }

    data.users.forEach(user => {
        const row = document.createElement("tr");

        addCell(row, user.id);
        addCell(row, user.full_name);
        addCell(row, user.username);
        addCell(row, user.email);
        addCell(row, user.role);
        addCell(row, formatDate(user.created_at));

        table.appendChild(row);
    });
}

/* =========================================
   LOAD REPORTS
========================================= */

async function loadAdminReports() {
    const table = document.getElementById("reportsTable");
    table.replaceChildren();

    const data = await adminFetch(
       `${API_BASE_URL}/api/reports`
    );

    if (!data.reports || data.reports.length === 0) {
        const row = document.createElement("tr");
        const cell = addCell(row, "No reports submitted yet.");
        cell.colSpan = 8;
        table.appendChild(row);
        return;
    }

    data.reports.forEach(report => {
        const row = document.createElement("tr");

        addCell(row, report.id);
        addCell(row, report.username || `User ${report.user_id}`);
        addCell(row, report.report_type);
        addCell(row, report.description);
        addCell(row, report.platform);

        const urlCell = document.createElement("td");

        if (report.content_url) {
            try {
                const url = new URL(report.content_url);

                if (url.protocol === "https:" || url.protocol === "http:") {
                    const link = document.createElement("a");
                    link.href = url.href;
                    link.textContent = "View content";
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    urlCell.appendChild(link);
                } else {
                    urlCell.textContent = "Invalid URL";
                }
            } catch {
                urlCell.textContent = "Invalid URL";
            }
        } else {
            urlCell.textContent = "Not provided";
        }

        row.appendChild(urlCell);

        const statusCell = addCell(row, report.status || "Pending");

        const actionCell = document.createElement("td");

        const select = document.createElement("select");

        ["Pending", "Reviewed", "Resolved", "Rejected"].forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            option.selected = status === (report.status || "Pending");
            select.appendChild(option);
        });

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.textContent = "Save";

        saveButton.addEventListener("click", async () => {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";

            try {
                const result = await adminFetch(
                    `/api/admin/reports/${report.id}/status`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            status: select.value
                        })
                    }
                );

                statusCell.textContent = select.value;
                showAdminMessage(result.message || "Status updated.");
            } catch (error) {
                showAdminMessage(error.message);
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = "Save";
            }
        });

        actionCell.appendChild(select);
        actionCell.appendChild(document.createTextNode(" "));
        actionCell.appendChild(saveButton);

        row.appendChild(actionCell);
        table.appendChild(row);
    });
}