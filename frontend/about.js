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