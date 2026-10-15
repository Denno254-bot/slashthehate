/* =========================================
   SHOW / HIDE PASSWORD
========================================= */

function setupPasswordToggle(
    inputId,
    buttonId
) {

    const input =
        document.getElementById(inputId);

    const button =
        document.getElementById(buttonId);


    if (!input || !button) {

        return;

    }


    button.addEventListener(
        "click",
        function() {

            if (input.type === "password") {

                input.type = "text";

                button.textContent = "Hide";

            } else {

                input.type = "password";

                button.textContent = "Show";

            }

        }
    );

}


setupPasswordToggle(
    "loginPassword",
    "showLoginPassword"
);


setupPasswordToggle(
    "registerPassword",
    "showRegisterPassword"
);



/* =========================================
   LOGIN
========================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        // Get email
        const email = document
            .getElementById("loginEmail")
            .value
            .trim();

        // Get password
        const password = document
            .getElementById("loginPassword")
            .value;

        try {

            // Send login information to backend
            const response = await fetch(
                "http://localhost:3000/api/auth/login",
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
            if (!response.ok) {

                alert(data.message);

                return;
            }


            // Login successful
            alert("Login successful!");


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


            // Go to dashboard
            window.location.href = "dashboard.html";


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                "Could not connect to the server."
            );

        }

    });

}


/* =========================================
   REGISTER
========================================= */

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const fullName =
                document.getElementById(
                    "fullName"
                ).value.trim();


            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();


            const username =
                document.getElementById(
                    "username"
                ).value.trim();


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            /* -----------------------------
               PASSWORD CHECK
            ----------------------------- */

            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "The passwords do not match."
                );

                return;

            }


            /* -----------------------------
               SEND DATA TO SERVER
            ----------------------------- */

            try {

                const response =
                    await fetch(
                        "http://localhost:3000/api/auth/register",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body: JSON.stringify({

                                fullName:
                                    fullName,

                                email:
                                    email,

                                username:
                                    username,

                                password:
                                    password

                            })

                        }
                    );


                const data =
                    await response.json();


                /* -------------------------
                   SERVER RESPONSE
                ------------------------- */

                if (!response.ok) {

                    alert(
                        data.message
                    );

                    return;

                }


                alert(
                    "Account created successfully!"
                );


                registerForm.reset();


            } catch (error) {

                console.error(error);


                alert(
                    "Could not connect to the server."
                );

            }

        }
    );

}



