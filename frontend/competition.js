
/* =========================================
   SLASH THE HATE COMPETITION PORTAL
========================================= */

const API_BASE_URL = window.location.origin;

const token = localStorage.getItem("slashTheHateToken");
const storedUser = localStorage.getItem("slashTheHateUser");

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_VIDEO_DURATION = 360;

let competitionIsOpen = false;

/* =========================================
   AUTHENTICATION
========================================= */

if (!token || !storedUser) {
    alert("Please login to access the competition.");
    window.location.href = "login.html";
}

/* =========================================
   HTML ELEMENTS
========================================= */

const submissionForm = document.getElementById("submissionForm");
const videoFileInput = document.getElementById("videoFile");
const videoPreview = document.getElementById("videoPreview");

const submitButton = document.getElementById("submitButton");
const submissionMessage = document.getElementById("submissionMessage");

const progressContainer = document.getElementById("progressContainer");
const uploadProgress = document.getElementById("uploadProgress");
const progressText = document.getElementById("progressText");

/* =========================================
   API REQUEST HELPER
========================================= */

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(
        `${API_BASE_URL}/api/competition${endpoint}`,
        {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
        if (response.status === 401) {
            localStorage.removeItem("slashTheHateToken");
            localStorage.removeItem("slashTheHateUser");

            alert("Your session has expired. Please login again.");
            window.location.href = "login.html";
            throw new Error("Authentication required.");
        }
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

/* =========================================
   LOAD PARTICIPANT DASHBOARD
========================================= */

async function loadCompetitionDashboard() {

    try {

        const data = await apiRequest("/dashboard");

        if (!data.participant) {
            throw new Error("Participant information unavailable.");
        }

        // Display verified participant information
        document.getElementById("participantName").textContent =
            data.participant.full_name;

        document.getElementById("participantUsername").textContent =
            "@" + data.participant.username;

        document.getElementById("participantEmail").textContent =
            data.participant.email;

        const competition = data.competition;

        if (!competition) {

            document.getElementById("competitionTheme").textContent =
                "No competition available";

            document.getElementById("competitionBrief").textContent =
                "Please check again later.";

            document.getElementById("competitionInstructions").textContent = "";

            document.getElementById("competitionStatus").textContent =
                "Unavailable";

            document.getElementById("submissionSection").hidden = true;

            return;
        }

        // Display competition information
        document.getElementById("competitionTheme").textContent =
            competition.theme;

        document.getElementById("competitionBrief").textContent =
            competition.brief;

        document.getElementById("competitionInstructions").textContent =
            competition.instructions;

        // Display competition status
        const statusElement =
            document.getElementById("competitionStatus");

        statusElement.textContent =
            competition.status.toUpperCase();

        competitionIsOpen =
            competition.status === "open" &&
            Number(competition.results_published) !== 1;

        document.getElementById("submissionSection").hidden =
            !competitionIsOpen;

        if (!competitionIsOpen) {
            submissionMessage.textContent =
                "Submissions are currently closed.";
        }

        // Display participant's own submissions
        displaySubmissions(data.submissions || []);

        displayParticipantResults(
    data.results || [],
    Number(competition.results_published) === 1
);
    } catch (error) {

        console.error("Competition dashboard error:", error);

        document.getElementById("competitionTheme").textContent =
            "Unable to load competition";

        document.getElementById("competitionBrief").textContent =
            error.message;
    }
}



/* =========================================
   DISPLAY PARTICIPANT SUBMISSIONS
========================================= */

function displaySubmissions(submissions) {

    const container = document.getElementById("submissionsList");

    container.innerHTML = "";

    if (!submissions.length) {

        container.textContent =
            "You have not submitted any videos yet.";

        return;
    }

    submissions.forEach(submission => {

        const card = document.createElement("div");
        card.className = "submission-item";

        const title = document.createElement("h3");
        title.textContent = submission.video_title;

        const confirmation = document.createElement("span");
        confirmation.className = "submission-confirmation";
        confirmation.textContent = "✓ Submission Received";

        const date = document.createElement("p");

        date.textContent =
            "Submitted on: " +
            new Date(submission.submitted_at).toLocaleString();

        const notice = document.createElement("p");
        notice.className = "submission-notice";

        notice.textContent =
            "Your video has been successfully recorded for the competition.";

        card.append(
            title,
            confirmation,
            date,
            notice
        );

        container.appendChild(card);

    });
}



/* =========================================
   DISPLAY OFFICIAL PARTICIPANT RESULTS
========================================= */

function displayParticipantResults(results, resultsPublished) {

    const section = document.getElementById(
        "participantResultsSection"
    );

    const status = document.getElementById(
        "resultsPublicationStatus"
    );

    const container = document.getElementById(
        "participantResults"
    );

    container.innerHTML = "";

    if (!resultsPublished) {

        status.textContent =
            "Official results have not yet been published. Check back later.";

        return;
    }

    status.textContent =
        "Official competition results have been published.";

    if (!results.length) {

        container.textContent =
            "No individual results are available yet.";

        return;
    }

    results.forEach(result => {

        const submission = document.createElement("div");
        submission.className = "participant-result-card";

        const title = document.createElement("h3");

        const matchingSubmission = document.querySelector(
            `[data-submission-id="${result.submissionId}"]`
        );

        title.textContent =
            `Results for Submission #${result.submissionId}`;

        submission.appendChild(title);

        // Criterion-level scores
        const scoresHeading = document.createElement("h4");
        scoresHeading.textContent = "Judging Scores";

        submission.appendChild(scoresHeading);

        let totalScore = 0;
        let maximumScore = 0;

        result.scores.forEach(score => {

            const scoreItem = document.createElement("p");

            scoreItem.textContent =
                `${score.criterion_name}: ${score.score} / ${score.maximum_score}`;

            totalScore += Number(score.score);
            maximumScore += Number(score.maximum_score);

            submission.appendChild(scoreItem);

        });

        if (result.scores.length) {

            const total = document.createElement("strong");

            total.textContent =
                `Total Score: ${totalScore} / ${maximumScore}`;

            submission.appendChild(total);

        } else {

            const noScores = document.createElement("p");

            noScores.textContent =
                "No judging scores are available.";

            submission.appendChild(noScores);

        }

        // Individual feedback
        const feedbackHeading = document.createElement("h4");
        feedbackHeading.textContent = "Administrator Feedback";

        submission.appendChild(feedbackHeading);

        if (result.feedback.length) {

            result.feedback.forEach(item => {

                const feedback = document.createElement("p");

                feedback.textContent = item.feedback;

                submission.appendChild(feedback);

            });

        } else {

            const noFeedback = document.createElement("p");

            noFeedback.textContent =
                "No feedback available.";

            submission.appendChild(noFeedback);

        }

        // Published awards
        const awardsHeading = document.createElement("h4");
        awardsHeading.textContent = "Awards and Recognition";

        submission.appendChild(awardsHeading);

        if (result.awards.length) {

            result.awards.forEach(award => {

                const awardItem = document.createElement("p");

                awardItem.textContent =
                    `${award.position}: ${award.award_title}`;

                submission.appendChild(awardItem);

            });

        } else {

            const noAward = document.createElement("p");

            noAward.textContent =
                "No award assigned to this submission.";

            submission.appendChild(noAward);

        }

        container.appendChild(submission);

    });
}


/* =========================================
   VIDEO FILE VALIDATION
========================================= */

async function validateVideoFile(file) {

    if (!file) {
        throw new Error("Please select a video.");
    }

    if (
        file.type !== "video/mp4" &&
        !file.name.toLowerCase().endsWith(".mp4")
    ) {
        throw new Error("Only MP4 videos are accepted.");
    }

    if (file.size > MAX_VIDEO_SIZE) {
        throw new Error("Video must not exceed 100 MB.");
    }

    if (file.size === 0) {
        throw new Error("The selected video is empty.");
    }

    const objectUrl = URL.createObjectURL(file);

    try {

        const duration = await new Promise((resolve, reject) => {

            const video = document.createElement("video");

            video.preload = "metadata";

            video.onloadedmetadata = () => {
                resolve(video.duration);
            };

            video.onerror = () => {
                reject(new Error("Unable to read video information."));
            };

            video.src = objectUrl;

        });

        if (
            !Number.isFinite(duration) ||
            duration <= 0 ||
            duration > MAX_VIDEO_DURATION
        ) {
            throw new Error(
                "Video duration must not exceed 6 minutes."
            );
        }

    } finally {

        URL.revokeObjectURL(objectUrl);

    }
}

/* =========================================
   VIDEO PREVIEW
========================================= */

videoFileInput.addEventListener("change", async () => {

    videoPreview.innerHTML = "";

    const file = videoFileInput.files[0];

    if (!file) return;

    try {

        await validateVideoFile(file);

        const video = document.createElement("video");

        video.controls = true;

        video.src = URL.createObjectURL(file);

        videoPreview.appendChild(video);

    } catch (error) {

        alert(error.message);

        videoFileInput.value = "";

    }

});

/* =========================================
   UPLOAD VIDEO TO CLOUDINARY
========================================= */

function uploadVideoToCloudinary(file, uploadDetails) {

    return new Promise((resolve, reject) => {

        const formData = new FormData();

        formData.append("file", file);
        formData.append("api_key", uploadDetails.apiKey);
        formData.append("timestamp", uploadDetails.timestamp);
        formData.append("signature", uploadDetails.signature);
        formData.append("public_id", uploadDetails.publicId);
        formData.append("type", uploadDetails.type);

        const xhr = new XMLHttpRequest();

        const uploadUrl =
            `https://api.cloudinary.com/v1_1/${uploadDetails.cloudName}/video/upload`;

        xhr.open("POST", uploadUrl);

        xhr.upload.addEventListener("progress", event => {

            if (event.lengthComputable) {

                const percentage = Math.round(
                    (event.loaded / event.total) * 100
                );

                uploadProgress.value = percentage;

                progressText.textContent = percentage + "%";

            }

        });

        xhr.onload = () => {

            let response;

            try {
                response = JSON.parse(xhr.responseText);
            } catch {
                reject(new Error("Invalid Cloudinary response."));
                return;
            }

            if (xhr.status >= 200 && xhr.status < 300) {

                // Do not expose or store the returned video URL
                if (
                    response.public_id !== uploadDetails.publicId ||
                    response.resource_type !== "video" ||
                    response.type !== "authenticated"
                ) {
                    reject(new Error("Uploaded video could not be verified."));
                    return;
                }

                resolve(response);

            } else {

                reject(
                    new Error(
                        response.error?.message ||
                        "Cloudinary video upload failed."
                    )
                );

            }

        };

        xhr.onerror = () => {
            reject(new Error("Network error during video upload."));
        };

        xhr.send(formData);

    });

}

/* =========================================
   COMPLETE VIDEO SUBMISSION
========================================= */

submissionForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!competitionIsOpen) {
        alert("Competition submissions are closed.");
        return;
    }

    const videoTitle =
        document.getElementById("videoTitle").value.trim();

    const description =
        document.getElementById("videoDescription").value.trim();

    const file = videoFileInput.files[0];

    try {

        submitButton.disabled = true;

        submissionMessage.textContent =
            "Checking your video...";

        submissionMessage.style.color = "#1d4ed8";

        await validateVideoFile(file);

        // Step 1: Request a secure upload permission
        submissionMessage.textContent =
            "Preparing secure video upload...";

        const intentData = await apiRequest("/upload-intent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        });

        // Step 2: Upload actual video directly to Cloudinary
        progressContainer.hidden = false;

        uploadProgress.value = 0;
        progressText.textContent = "0%";

        submissionMessage.textContent =
            "Uploading your video...";

        const uploadedVideo = await uploadVideoToCloudinary(
            file,
            intentData.upload
        );

        // Step 3: Ask backend to verify and register submission
        submissionMessage.textContent =
            "Verifying your video and saving your submission...";

        await apiRequest("/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                publicId: uploadedVideo.public_id,
                videoTitle,
                description
            })
        });

        // Step 4: Display confirmation
        submissionMessage.textContent =
            "Your video has been submitted successfully!";

        submissionMessage.style.color = "green";

        submissionForm.reset();

        videoPreview.innerHTML = "";

        progressContainer.hidden = true;

        await loadCompetitionDashboard();

    } catch (error) {

        console.error("Video submission error:", error);

        submissionMessage.textContent = error.message;

        submissionMessage.style.color = "red";

    } finally {

        submitButton.disabled = false;

    }

});

/* =========================================
   LOGOUT
========================================= */

document.getElementById("logoutButton").addEventListener("click", () => {

    localStorage.removeItem("slashTheHateToken");
    localStorage.removeItem("slashTheHateUser");

    window.location.href = "login.html";

});

/* =========================================
   INITIALIZE PORTAL
========================================= */

if (token && storedUser) {
    loadCompetitionDashboard();
}
