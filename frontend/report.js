document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL = window.location.origin;
    const submitButton = document.getElementById("submitReport");
    const reportMessage = document.getElementById("reportMessage");

    submitButton.addEventListener("click", async () => {

        // Check login
        const token = localStorage.getItem("slashTheHateToken");
        const storedUser = localStorage.getItem("slashTheHateUser");

        if (!token || !storedUser) {
            reportMessage.textContent = "Please log in before submitting a report.";
            reportMessage.style.color = "#ff1744";
            return;
        }

        let user;

        try {
            user = JSON.parse(storedUser);
        } catch (error) {
            reportMessage.textContent = "Invalid login information. Please log in again.";
            reportMessage.style.color = "#ff1744";
            return;
        }

        // Get selected report type
        const selectedType = document.querySelector(
            'input[name="reportType"]:checked'
        );

        const description =
            document.getElementById("reportDescription").value.trim();

        const platform =
            document.getElementById("reportPlatform").value;

        const contentUrl =
            document.getElementById("reportUrl").value.trim();

        // Validate report type
        if (!selectedType) {
            reportMessage.textContent = "Please select what you are reporting.";
            reportMessage.style.color = "#ff1744";
            return;
        }

        // Validate description
        if (!description) {
            reportMessage.textContent = "Please describe what happened.";
            reportMessage.style.color = "#ff1744";
            return;
        }

        // Validate platform
        if (!platform) {
            reportMessage.textContent = "Please select the platform.";
            reportMessage.style.color = "#ff1744";
            return;
        }

        // Disable button while submitting
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {

           const response = await fetch(
    `${API_BASE_URL}/api/reports`,
    
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    userId: user.id,
                    reportType: selectedType.value,
                    description: description,
                    platform: platform,
                    contentUrl: contentUrl
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit report.");
            }

            // Success
            reportMessage.textContent =
                "Report submitted successfully ✓";

            reportMessage.style.color = "#22c55e";

            // Clear form
            selectedType.checked = false;
            document.getElementById("reportDescription").value = "";
            document.getElementById("reportPlatform").value = "";
            document.getElementById("reportUrl").value = "";

        } catch (error) {

            console.error("Report error:", error);

            reportMessage.textContent =
                error.message || "Something went wrong.";

            reportMessage.style.color = "#ff1744";

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = "Submit Report →";
        }
    });

});