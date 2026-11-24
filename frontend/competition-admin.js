
/* =========================================
   COMPETITION ADMIN AUTHENTICATION
========================================= */

const API_BASE_URL = window.location.origin;

const adminToken = localStorage.getItem("slashTheHateToken");
const adminStoredUser = localStorage.getItem("slashTheHateUser");

const adminMessage = document.getElementById(
    "competitionAdminMessage"
);

let adminUser;
let currentCompetitionId = null;
let currentSubmissionId = null;
try {
    adminUser = JSON.parse(adminStoredUser);
} catch (error) {
    adminUser = null;
}


/* =========================================
   ADMIN MESSAGES
========================================= */

function showCompetitionAdminMessage(message) {
    if (adminMessage) {
        adminMessage.textContent = message;
    }
}


/* =========================================
   LOGOUT
========================================= */

function competitionAdminLogout() {
    localStorage.removeItem("slashTheHateToken");
    localStorage.removeItem("slashTheHateUser");

    window.location.href = "login.html";
}

document.getElementById("adminLogout").addEventListener(
    "click",
    competitionAdminLogout
);


/* =========================================
   AUTHENTICATION CHECK
========================================= */

if (
    !adminToken ||
    !adminUser ||
    adminUser.role !== "admin"
) {
    alert("Administrator access is required.");
    competitionAdminLogout();

} else {

    const adminName = document.getElementById("adminName");

    adminName.textContent =
        adminUser.full_name ||
        adminUser.fullName ||
        "Administrator";

    loadCompetitionAdminDashboard();
}


/* =========================================
   AUTHENTICATED API REQUEST
========================================= */

async function competitionAdminFetch(url, options = {}) {

    const response = await fetch(`${API_BASE_URL}${url}`, {
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
        competitionAdminLogout();

        throw new Error(
            data.message || "Administrator access denied."
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
   SAFE HTML TEXT
========================================= */

function escapeAdminHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


/* =========================================
   LOAD COMPETITION DASHBOARD
========================================= */

async function loadCompetitionAdminDashboard() {

    try {

        showCompetitionAdminMessage(
            "Loading competition administration data..."
        );

        const data = await competitionAdminFetch(
            "/api/competition/admin/dashboard"
        );

        if (!data.success) {
            throw new Error(
                data.message || "Unable to load competition data."
            );
        }

        displayCompetitionStatistics(data.statistics);

        displayCompetitionDetails(data.competition);

        await loadCompetitionCriteria();
await loadCompetitionPrizes();

        displayCompetitionSubmissions(data.submissions);

        showCompetitionAdminMessage(
            "Competition dashboard loaded successfully."
        );

    } catch (error) {

        console.error(
            "Competition administration error:",
            error
        );

        showCompetitionAdminMessage(
            error.message || "Unable to load competition dashboard."
        );
    }
}


/* =========================================
   DISPLAY STATISTICS
========================================= */

function displayCompetitionStatistics(statistics) {

    document.getElementById("totalParticipants").textContent =
        statistics?.totalParticipants ?? 0;

    document.getElementById("totalSubmissions").textContent =
        statistics?.totalSubmissions ?? 0;

    document.getElementById("pendingReviews").textContent =
        statistics?.pendingReviews ?? 0;

    document.getElementById("completedReviews").textContent =
        statistics?.completedReviews ?? 0;
}


/* =========================================
   DISPLAY COMPETITION DETAILS
========================================= */

function displayCompetitionDetails(competition) {
currentCompetitionId = competition ? competition.id : null;
    if (!competition) {

        document.getElementById("currentTheme").textContent =
            "No competition created yet.";

        document.getElementById("currentStatus").textContent =
            "Not created";

        document.getElementById("currentBrief").textContent =
            "Not available";

        document.getElementById("currentInstructions").textContent =
            "Not available";

        return;
    }

    document.getElementById("competitionTitle").textContent =
        competition.title;

    document.getElementById("currentTheme").textContent =
        competition.theme;

    document.getElementById("currentStatus").textContent =
        competition.status.toUpperCase();

    document.getElementById("currentBrief").textContent =
        competition.brief;

    document.getElementById("currentInstructions").textContent =
        competition.instructions;
}



/* =========================================
   DISPLAY SUBMISSIONS
========================================= */



function displayCompetitionSubmissions(submissions) {

    const table = document.getElementById("submissionsTable");

    if (!submissions || submissions.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No video submissions found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = submissions.map(submission => {

        const submissionDate = new Date(
            submission.submitted_at
        ).toLocaleString();

        const duration = Number(submission.duration_seconds);

        const formattedDuration = Number.isFinite(duration)
            ? `${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`
            : "Unavailable";

        return `
            <tr>
                <td>${escapeAdminHTML(submission.id)}</td>
                <td>${escapeAdminHTML(submission.video_title)}</td>

                <td>
                    ${escapeAdminHTML(submission.full_name)}
                    <br>
                    <small>@${escapeAdminHTML(submission.username)}</small>
                </td>

                <td>${escapeAdminHTML(submissionDate)}</td>
                <td>${escapeAdminHTML(formattedDuration)}</td>

                <td>
                    ${escapeAdminHTML(submission.review_status.toUpperCase())}
                </td>

                <td>
                    <button
                        type="button"
                        class="review-video-button"
                        data-submission-id="${escapeAdminHTML(submission.id)}"
                    >
                        Review Video
                    </button>
                </td>
            </tr>
        `;

    }).join("");



    // Attach an event directly to every Review Video button
    const reviewButtons = table.querySelectorAll(".review-video-button");

    reviewButtons.forEach(button => {

        button.addEventListener("click", async function () {

            const submissionId = this.dataset.submissionId;

            showCompetitionAdminMessage(
                `Opening video for submission #${submissionId}...`
            );

            const videoPlayer = document.getElementById("privateVideoPlayer");
            const reviewSection = document.getElementById("videoReviewSection");
            const details = document.getElementById("selectedSubmissionDetails");

            this.disabled = true;
            this.textContent = "Loading...";

            try {

                const data = await competitionAdminFetch(
                    `/api/competition/admin/submissions/${submissionId}/video`
                );

                if (!data.success || !data.videoUrl) {
                    throw new Error(data.message || "Unable to load video.");
                }

                videoPlayer.onerror = function () {
                    showCompetitionAdminMessage(
                        "Video playback failed. Please try again."
                    );
                };

                videoPlayer.pause();
                videoPlayer.src = data.videoUrl;
                videoPlayer.load();

                details.textContent = `Reviewing submission #${submissionId}`;

                reviewSection.hidden = false;
reviewSection.style.display = "block";

                reviewSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

           loadSubmissionReview(submissionId).catch(error => {
    console.error("Unable to load submission review:", error);
});
            } catch (error) {

                showCompetitionAdminMessage(
                    error.message || "Unable to load video."
                );

            } finally {

                this.disabled = false;
                this.textContent = "Review Video";

            }

        });

    });
}



/* =========================================
   LOAD SUBMISSION REVIEW DATA
========================================= */

async function loadSubmissionReview(submissionId) {

    const criteriaContainer = document.getElementById(
        "scoringCriteria"
    );

    const feedbackField = document.getElementById(
        "submissionFeedback"
    );

    const completeButton = document.getElementById(
        "completeReviewButton"
    );

    currentSubmissionId = Number(submissionId);

    criteriaContainer.textContent = "Loading judging criteria...";

    feedbackField.value = "";

    completeButton.disabled = true;

    try {

        const data = await competitionAdminFetch(
            `/api/competition/admin/submissions/${currentSubmissionId}/review`
        );

        if (!data.success) {
            throw new Error(
                data.message || "Unable to load review information."
            );
        }

        const criteria = data.criteria || [];
        const scores = data.scores || [];

        if (!criteria.length) {

            criteriaContainer.innerHTML =
                "<p>No judging criteria have been configured.</p>";

            throw new Error(
                "Please configure judging criteria before reviewing submissions."
            );
        }

        const savedScores = new Map(
            scores.map(item => [
                Number(item.criterion_id),
                item.score
            ])
        );

        criteriaContainer.innerHTML = criteria.map(criterion => {

            const criterionId = Number(criterion.id);
            const maximumScore = Number(criterion.maximum_score);

            const savedScore = savedScores.has(criterionId)
                ? savedScores.get(criterionId)
                : "";

            return `
                <div class="scoring-criterion">

                    <label for="score-${criterionId}">
                        <strong>
                            ${escapeAdminHTML(criterion.criterion_name)}
                        </strong>

                        <span>
                            Maximum score: ${escapeAdminHTML(maximumScore)}
                        </span>
                    </label>

                    <p>
                        ${escapeAdminHTML(criterion.description || "")}
                    </p>

                    <input
                        type="number"
                        id="score-${criterionId}"
                        data-criterion-id="${criterionId}"
                        min="0"
                        max="${maximumScore}"
                        step="0.01"
                        value="${escapeAdminHTML(savedScore)}"
                        placeholder="Enter score"
                        required
                    >

                </div>
            `;

        }).join("");

        feedbackField.value = data.feedback || "";

        completeButton.disabled =
            data.submission.review_status === "completed";

        completeButton.textContent =
            data.submission.review_status === "completed"
                ? "Review Completed"
                : "Mark Review as Completed";

    } catch (error) {

        showCompetitionAdminMessage(
            error.message || "Unable to load review information."
        );

        throw error;
    }
}

/* =========================================
   SAVE JUDGING SCORES AND FEEDBACK
========================================= */

const scoringForm = document.getElementById("scoringForm");

scoringForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!currentSubmissionId) {
        showCompetitionAdminMessage(
            "Please select a video submission first."
        );
        return;
    }

    const scoreInputs = document.querySelectorAll(
        "#scoringCriteria [data-criterion-id]"
    );

    const scores = [];

    for (const input of scoreInputs) {

        const score = Number(input.value);
        const maximumScore = Number(input.max);

        if (
            input.value.trim() === "" ||
            !Number.isFinite(score) ||
            score < 0 ||
            score > maximumScore
        ) {
            showCompetitionAdminMessage(
                "Please enter valid scores for every criterion."
            );

            input.focus();
            return;
        }

        scores.push({
            criterionId: Number(input.dataset.criterionId),
            score
        });
    }

    const feedback = document.getElementById(
        "submissionFeedback"
    ).value.trim();

    const saveButton = scoringForm.querySelector(
        'button[type="submit"]'
    );

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {

        const data = await competitionAdminFetch(
            `/api/competition/admin/submissions/${currentSubmissionId}/review`,
            {
                method: "POST",
                body: JSON.stringify({
                    scores,
                    feedback
                })
            }
        );

        showCompetitionAdminMessage(
            data.message || "Scores and feedback saved successfully."
        );

        await loadSubmissionReview(currentSubmissionId);

    } catch (error) {

        showCompetitionAdminMessage(
            error.message || "Unable to save judging scores."
        );

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = "Save Scores and Feedback";

    }

});


/* =========================================
   COMPLETE SUBMISSION REVIEW
========================================= */

const completeReviewButton = document.getElementById(
    "completeReviewButton"
);

completeReviewButton.addEventListener("click", async function() {
console.log("COMPLETE REVIEW BUTTON CLICKED");
    if (!currentSubmissionId) {
        showCompetitionAdminMessage(
            "Please select a video submission first."
        );
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to mark this review as completed?"
    );

    if (!confirmed) {
        return;
    }

    this.disabled = true;
    this.textContent = "Completing...";

    try {

        const data = await competitionAdminFetch(
            `/api/competition/admin/submissions/${currentSubmissionId}/review/complete`,
            {
                method: "PATCH"
            }
        );

        showCompetitionAdminMessage(
            data.message || "Review completed successfully."
        );

        await loadCompetitionAdminDashboard();

        await loadSubmissionReview(currentSubmissionId);

    } catch (error) {

        showCompetitionAdminMessage(
            error.message || "Unable to complete this review."
        );

        this.disabled = false;
        this.textContent = "Mark Review as Completed";

    }

});


/* =========================================
   CREATE COMPETITION
========================================= */

const competitionForm = document.getElementById("competitionForm");

competitionForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const theme = document.getElementById(
        "competitionTheme"
    ).value.trim();

    const brief = document.getElementById(
        "competitionBrief"
    ).value.trim();

    const instructions = document.getElementById(
        "competitionInstructions"
    ).value.trim();

    try {

        showCompetitionAdminMessage(
            "Creating competition..."
        );

        const data = await competitionAdminFetch(
            
            "/api/competition/admin/competitions",
            {
                method: "POST",
                body: JSON.stringify({
                    theme,
                    brief,
                    instructions
                })
            }
        );

        showCompetitionAdminMessage(
            data.message || "Competition created successfully."
        );

        competitionForm.reset();

        await loadCompetitionAdminDashboard();

    } catch (error) {

        showCompetitionAdminMessage(error.message);

    }

});


/* =========================================
   ADD JUDGING CRITERION
========================================= */

const criteriaForm = document.getElementById("criteriaForm");

criteriaForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const competitionId = currentCompetition?.id;

    if (!competitionId) {
        showCompetitionAdminMessage(
            "Create or load a competition first."
        );
        return;
    }

    const criterionName = document.getElementById(
        "criterionName"
    ).value.trim();

    const description = document.getElementById(
        "criterionDescription"
    ).value.trim();

    const maximumScore = Number(
        document.getElementById("maximumScore").value
    );

    try {

        showCompetitionAdminMessage(
            "Adding judging criterion..."
        );

        const data = await competitionAdminFetch(
            `/api/competition/admin/competitions/${competitionId}/criteria`,
            {
                method: "POST",
                body: JSON.stringify({
                    criterionName,
                    description,
                    maximumScore
                })
            }
        );

        showCompetitionAdminMessage(data.message);

        criteriaForm.reset();

        await loadCompetitionCriteria();

    } catch (error) {

        showCompetitionAdminMessage(error.message);

    }

});


/* =========================================
   LOAD JUDGING CRITERIA
========================================= */

async function loadCompetitionCriteria() {

    const criteriaList = document.getElementById("criteriaList");

    if (!currentCompetitionId) {
        criteriaList.textContent =
            "Create a competition before adding criteria.";
        return;
    }

    try {

        const data = await competitionAdminFetch(
            `/api/competition/admin/competitions/${currentCompetitionId}/criteria`
        );

        if (!data.criteria || data.criteria.length === 0) {
            criteriaList.textContent =
                "No judging criteria have been added yet.";
            return;
        }

        criteriaList.innerHTML = data.criteria.map(criterion => `

            <article class="criteria-item">

                <h4>
                    ${escapeAdminHTML(criterion.criterion_name)}
                </h4>

                <p>
                    ${escapeAdminHTML(criterion.description || "")}
                </p>

                <strong>
                    Maximum Score:
                    ${escapeAdminHTML(criterion.maximum_score)}
                </strong>

            </article>

        `).join("");

    } catch (error) {

        criteriaList.textContent = error.message;

    }

}





/* =========================================
   ADD COMPETITION PRIZE
========================================= */

const prizeForm = document.getElementById("prizeForm");

prizeForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!currentCompetitionId) {
        showCompetitionAdminMessage(
            "Create a competition before adding prizes."
        );
        return;
    }

    const prizeTitle = document.getElementById(
        "prizeTitle"
    ).value.trim();

    const prizeDescription = document.getElementById(
        "prizeDescription"
    ).value.trim();

    const prizeValue = document.getElementById(
        "prizeValue"
    ).value.trim();

    try {

        showCompetitionAdminMessage("Adding competition prize...");

        const data = await competitionAdminFetch(
            `/api/competition/admin/competitions/${currentCompetitionId}/prizes`,
            {
                method: "POST",
                body: JSON.stringify({
                    prizeTitle,
                    prizeDescription,
                    prizeValue
                })
            }
        );

        showCompetitionAdminMessage(data.message);

        prizeForm.reset();

        await loadCompetitionPrizes();

    } catch (error) {

        showCompetitionAdminMessage(error.message);

    }

});


/* =========================================
   LOAD COMPETITION PRIZES
========================================= */

async function loadCompetitionPrizes() {

    const prizesList = document.getElementById("prizesList");

    if (!currentCompetitionId) {
        prizesList.textContent =
            "Create a competition before adding prizes.";
        return;
    }

    try {

        const data = await competitionAdminFetch(
            `/api/competition/admin/competitions/${currentCompetitionId}/prizes`
        );

        const prizes = data.prizes || [];

        if (prizes.length === 0) {
            prizesList.textContent =
                "No prizes have been added yet.";
            return;
        }

        prizesList.innerHTML = prizes.map(prize => `

            <article class="prize-item">

                <h4>${escapeAdminHTML(prize.prize_title)}</h4>

                <p>
                    ${escapeAdminHTML(
                        prize.prize_description || ""
                    )}
                </p>

                <strong>
                    Value:
                    ${escapeAdminHTML(prize.prize_value || "To be announced")}
                </strong>

            </article>

        `).join("");

    } catch (error) {

        prizesList.textContent = error.message;

    }

}

/* =========================================
   OPEN AND CLOSE COMPETITION SUBMISSIONS
========================================= */

async function updateCompetitionStatus(status) {

    if (!currentCompetitionId) {
        showCompetitionAdminMessage(
            "No competition is available."
        );
        return;
    }

    const action = status === "open" ? "open" : "close";

    const confirmed = confirm(
        `Are you sure you want to ${action} competition submissions?`
    );

    if (!confirmed) return;

    try {

        const data = await competitionAdminFetch(
            `/api/competition/admin/competitions/${currentCompetitionId}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({ status })
            }
        );

        showCompetitionAdminMessage(data.message);

        await loadCompetitionAdminDashboard();

    } catch (error) {

        showCompetitionAdminMessage(
            error.message || "Unable to update competition status."
        );

    }
}


/* =========================================
   COMPETITION STATUS BUTTON EVENTS
========================================= */

document.getElementById("openCompetitionButton")?.addEventListener(
    "click",
    () => updateCompetitionStatus("open")
);

document.getElementById("closeCompetitionButton")?.addEventListener(
    "click",
    () => updateCompetitionStatus("closed")
);


