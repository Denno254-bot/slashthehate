
/* =========================================
   SLASH THE HATE - LOGIN & REGISTER JS
   Local backend: http://localhost:3000
========================================= */

// =========================================
// API CONFIGURATION
// =========================================

const API_BASE_URL = "http://localhost:3000";

// =========================================
// SHOW / HIDE PASSWORD
// =========================================

function setupPasswordToggle(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (!input || !button) {
        return;
    }

    button.addEventListener("click", function (event) {
        // Prevent accidental form submission
        event.preventDefault();

        if (input.type === "password") {
            input.type = "text";
            button.textContent = "Hide";
        } else {
            input.type = "password";
            button.textContent = "Show";
        }
    });
}

setupPasswordToggle("loginPassword", "showLoginPassword");
setupPasswordToggle("registerPassword", "showRegisterPassword");

// =========================================
// LOGIN
// =========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Get email or username
        const email = document
            .getElementById("loginEmail")
            .value
            .trim();

        // Get password
        const password = document
            .getElementById("loginPassword")
            .value;

        // Validate inputs
        if (!email || !password) {
            alert("Please enter your email/username and password.");
            return;
        }

        try {
            // Send login information to backend
            const response = await fetch(
                `${API_BASE_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        login: email,
                        password: password
                    })
                }
            );

            // Get response from server
            const data = await response.json();

            // If login failed
            if (!response.ok || !data.success) {
                alert(
                    data.message ||
                    "Login failed. Please check your details."
                );
                return;
            }

            // Verify authentication response
            if (!data.token || !data.user) {
                alert("Login response is missing account information.");
                return;
            }

            // Save JWT token
            localStorage.setItem(
                "slashTheHateToken",
                data.token
            );

            // Save user information
            localStorage.setItem(
                "slashTheHateUser",
                JSON.stringify(data.user)
            );

            // Login successful
            alert("Login successful!");

            // Go to dashboard
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);

            alert(
                "Could not connect to the server. " +
                "Make sure your backend is running at " +
                API_BASE_URL + "."
            );
        }
    });
}

// =========================================
// REGISTER
// =========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const fullName = document
                .getElementById("fullName")
                .value
                .trim();

            const email = document
                .getElementById("registerEmail")
                .value
                .trim();

            const username = document
                .getElementById("username")
                .value
                .trim();

            const password = document
                .getElementById("registerPassword")
                .value;

            const confirmPassword = document
                .getElementById("confirmPassword")
                .value;

            // Check required fields
            if (
                !fullName ||
                !email ||
                !username ||
                !password ||
                !confirmPassword
            ) {
                alert("Please fill in all registration fields.");
                return;
            }

            // Password length check
            if (password.length < 8) {
                alert("Password must be at least 8 characters long.");
                return;
            }

            // Password confirmation check
            if (password !== confirmPassword) {
                alert("The passwords do not match.");
                return;
            }

            try {
                // Send registration data to backend
                const response = await fetch(
                    `${API_BASE_URL}/api/auth/register`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            fullName: fullName,
                            email: email,
                            username: username,
                            password: password
                        })
                    }
                );

                const data = await response.json();

                // Handle server errors
                if (!response.ok || !data.success) {
                    alert(
                        data.message ||
                        "Registration failed. Please try again."
                    );
                    return;
                }

                // Registration successful
                alert("Account created successfully!");

                // Clear registration form
                registerForm.reset();

            } catch (error) {
                console.error("Registration error:", error);

                alert(
                    "Could not connect to the server. " +
                    "Make sure your backend is running at " +
                    API_BASE_URL + "."
                );
            }
        }
    );
}
