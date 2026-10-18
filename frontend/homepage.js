
/* =========================================
   SLASH THE HATE
   MESSAGE ANALYSIS SYSTEM
========================================= */


/* =========================================
   HTML ELEMENTS
========================================= */

const messageInput =
    document.getElementById("message");

const checkButton =
    document.querySelector(".check-button");

const resultBox =
    document.querySelector(".result");




const discriminationWords = [

    "your race",
    "your people",
    "people like you",
    "dirty race"

];


/* =========================================
   CHECK BUTTON
========================================= */

checkButton.addEventListener(
    "click",
    analyzeMessage
);



// =========================================
// AI MESSAGE ANALYSIS
// =========================================

async function analyzeMessage() {

    const message =
        messageInput.value.trim();

    // =====================================
    // EMPTY MESSAGE
    // =====================================

    if (message === "") {

        displayAnalysis({
            icon: "!",
            title: "Nothing to check yet",
            description:
                "Write a message in the box first, then click Check My Message.",
            category: "No message",
            concern: "—",
            guidance: "Enter a message",
            type: "warning",
            alternative: ""
        });

        return;
    }

    // =====================================
    // DISABLE BUTTON WHILE AI IS WORKING
    // =====================================
  checkButton.disabled = true;
    checkButton.textContent = "Analyzing...";

    try {

        // =====================================
        // SEND MESSAGE TO BACKEND
        // =====================================

           const response = await fetch(
    "/api/analyze-post",
                  {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text: message
                })
            }
        );

        const data = await response.json();

        // =====================================
        // CHECK SERVER RESPONSE
        // =====================================

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "AI analysis failed."
            );
        }

        // =====================================
        // GET AI ANALYSIS
        // =====================================

        const analysis =
            data.analysis;

        // =====================================
        // CONVERT AI STATUS TO UI TYPE
        // =====================================

        let type = "good";
        let icon = "✓";
        let title = "Looks respectful";

        if (
            analysis.status ===
            "potentially_harmful"
        ) {

            type = "warning";
            icon = "!";
            title = "Potentially harmful message";

        } else if (
            analysis.status ===
            "harmful"
        ) {

            type = "danger";
            icon = "!";
            title = "Harmful content detected";
        }

        // =====================================
        // FORMAT CATEGORY
        // =====================================

        let category =
            analysis.category || "safe";

        category =
            category
                .replace(/_/g, " ")
                .replace(/\b\w/g, function(letter) {
                    return letter.toUpperCase();
                });

        // =====================================
        // FORMAT SEVERITY
        // =====================================

        let concern =
            analysis.severity || "low";

        concern =
            concern.charAt(0).toUpperCase() +
            concern.slice(1);

        // =====================================
        // DISPLAY AI RESULT
        // =====================================

        displayAnalysis({

            icon: icon,

            title: title,

            description:
                analysis.reason ||
                "The AI analyzed your message.",

            category: category,

            concern: concern,

            guidance:
                analysis.suggestion ||
                "Keep your communication respectful.",

            type: type,

            alternative:
                analysis.suggestion || ""
        });

    } catch (error) {

        console.error(
            "AI analysis error:",
            error
        );

        // =====================================
        // AI ERROR
        // =====================================

        displayAnalysis({

            icon: "!",

            title:
                "Analysis unavailable",

            description:
                "We couldn't connect to the AI analysis service. Please try again.",

            category:
                "Unavailable",

            concern:
                "—",

            guidance:
                "Try again in a moment.",

            type:
                "warning",

            alternative:
                ""
        });

    } finally {

        // =====================================
        // RESTORE BUTTON
        // =====================================

        checkButton.disabled = false;

        checkButton.textContent =
            "Check My Message";
    }
}





/* =========================================
   DISPLAY ANALYSIS
========================================= */

function displayAnalysis(data) {


    /* =====================================
       BASIC RESULT
    ====================================== */

    resultBox
        .querySelector(".result-icon")
        .textContent =
        data.icon;


    resultBox
        .querySelector(".result-content strong")
        .textContent =
        data.title;


    resultBox
        .querySelector(".result-content p")
        .textContent =
        data.description;


    /* =====================================
       CATEGORY
    ====================================== */

    resultBox
        .querySelector(".category")
        .textContent =
        data.category;


    /* =====================================
       CONCERN
    ====================================== */

    resultBox
        .querySelector(".concern")
        .textContent =
        data.concern;


    /* =====================================
       GUIDANCE
    ====================================== */

    resultBox
        .querySelector(".guidance")
        .textContent =
        data.guidance;


    /* =====================================
       RESULT COLOR
    ====================================== */

    resultBox.classList.remove(
        "good",
        "warning",
        "danger"
    );


    resultBox.classList.add(
        data.type
    );


    /* =====================================
       ALTERNATIVE MESSAGE
    ====================================== */

    const alternativeContainer =
        resultBox.querySelector(
            ".alternative-container"
        );


    alternativeContainer.innerHTML = "";


    if (data.alternative !== "") {

        const alternative =
            document.createElement("div");


        alternative.className =
            "alternative";


        alternative.innerHTML = `

            <div class="alternative-title">
                💡 TRY SAYING
            </div>

            <div class="alternative-text">
                "${data.alternative}"
            </div>

            <button
                class="use-alternative"
            >
                Use This Instead
            </button>

        `;


        alternativeContainer.appendChild(
            alternative
        );


        /* =================================
           USE ALTERNATIVE
        ================================== */

        const useButton =
            alternative.querySelector(
                ".use-alternative"
            );


        useButton.addEventListener(
            "click",
            function() {

                messageInput.value =
                    data.alternative;

                messageInput.focus();

            }
        );

    }

}


/* ========================================
   SLASH THE HATE CAMPAIGN COUNTDOWN
========================================= */

const launchDate = new Date("November 3, 2026 09:00:00").getTime();

const countdown = setInterval(function () {

    const now = new Date().getTime();

    const distance = launchDate - now;

    const days = Math.floor(
        distance / (1000 * 60 * 60 * 24)
    );

    const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) /
        (1000 * 60 * 60)
    );

    const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) /
        (1000 * 60)
    );

    const seconds = Math.floor(
        (distance % (1000 * 60)) /
        1000
    );

    document.getElementById("days").textContent =
        String(days).padStart(2, "0");

    document.getElementById("hours").textContent =
        String(hours).padStart(2, "0");

    document.getElementById("minutes").textContent =
        String(minutes).padStart(2, "0");

    document.getElementById("seconds").textContent =
        String(seconds).padStart(2, "0");

    // When the countdown reaches zero
    if (distance < 0) {

        clearInterval(countdown);

        document.getElementById("days").textContent = "00";
        document.getElementById("hours").textContent = "00";
        document.getElementById("minutes").textContent = "00";
        document.getElementById("seconds").textContent = "00";

    }

}, 1000);


/* =========================================
   SLASH THE HATE
   CAMPAIGN PROJECT SLIDER
========================================= */


const campaignSlides =
    document.querySelectorAll(".campaign-slide");

const campaignDots =
    document.querySelectorAll(".campaign-dot");

const campaignPrev =
    document.getElementById("campaignPrev");

const campaignNext =
    document.getElementById("campaignNext");


let currentCampaignSlide = 0;

let campaignTimer;


/* =========================================
   SHOW SLIDE
========================================= */

function showCampaignSlide(index) {

    if (index >= campaignSlides.length) {

        currentCampaignSlide = 0;

    }
    else if (index < 0) {

        currentCampaignSlide =
            campaignSlides.length - 1;

    }
    else {

        currentCampaignSlide = index;

    }


    campaignSlides.forEach(
        function(slide) {

            slide.classList.remove("active");

        }
    );


    campaignDots.forEach(
        function(dot) {

            dot.classList.remove("active");

        }
    );


    campaignSlides[
        currentCampaignSlide
    ].classList.add("active");


    campaignDots[
        currentCampaignSlide
    ].classList.add("active");

}


/* =========================================
   NEXT
========================================= */

campaignNext.addEventListener(
    "click",
    function() {

        showCampaignSlide(
            currentCampaignSlide + 1
        );

        resetCampaignTimer();

    }
);


/* =========================================
   PREVIOUS
========================================= */

campaignPrev.addEventListener(
    "click",
    function() {

        showCampaignSlide(
            currentCampaignSlide - 1
        );

        resetCampaignTimer();

    }
);


/* =========================================
   DOT NAVIGATION
========================================= */

campaignDots.forEach(
    function(dot) {

        dot.addEventListener(
            "click",
            function() {

                const slideNumber =
                    Number(
                        dot.dataset.slide
                    );

                showCampaignSlide(
                    slideNumber
                );

                resetCampaignTimer();

            }
        );

    }
);


/* =========================================
   AUTOMATIC SLIDING
========================================= */

function startCampaignTimer() {

    campaignTimer = setInterval(
        function() {

            showCampaignSlide(
                currentCampaignSlide + 1
            );

        },
        5000
    );

}


/* =========================================
   RESET TIMER
========================================= */

function resetCampaignTimer() {

    clearInterval(
        campaignTimer
    );

    startCampaignTimer();

}


/* =========================================
   START SLIDER
========================================= */

showCampaignSlide(0);

startCampaignTimer();
