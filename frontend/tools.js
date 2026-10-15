/* =========================================
   SLASH THE HATE
   THINK BEFORE YOU POST
========================================= */


/* =========================================
   GET ELEMENTS
========================================= */

const postChecker =
    document.getElementById("postChecker");

const postText =
    document.getElementById("postText");

const charCount =
    document.getElementById("charCount");

const checkerResult =
    document.getElementById("checkerResult");

const resultStatus =
    document.getElementById("resultStatus");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const originalMessage =
    document.getElementById("originalMessage");

const resultSuggestion =
    document.getElementById("resultSuggestion");

const checkAgain =
    document.getElementById("checkAgain");


/* =========================================
   CHARACTER COUNTER
========================================= */

postText.addEventListener(
    "input",
    function () {

        charCount.textContent =
            postText.value.length;

    }
);


/* =========================================
   CHECK POST
========================================= */

postChecker.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        /* -----------------------------
           GET USER ANSWERS
        ----------------------------- */

        const respectful =
            document.querySelector(
                'input[name="respectful"]:checked'
            ).value;


        const harmful =
            document.querySelector(
                'input[name="harmful"]:checked'
            ).value;


        const necessary =
            document.querySelector(
                'input[name="necessary"]:checked'
            ).value;


        const faceToFace =
            document.querySelector(
                'input[name="faceToFace"]:checked'
            ).value;


        const message =
            postText.value.trim();


        /* -----------------------------
           CALCULATE CONCERN LEVEL
        ----------------------------- */

        let concernScore = 0;


        if (respectful === "no") {

            concernScore += 2;

        }


        if (harmful === "yes") {

            concernScore += 2;

        }


        if (necessary === "no") {

            concernScore += 1;

        }


        if (faceToFace === "no") {

            concernScore += 1;

        }


        /* -----------------------------
           DISPLAY ORIGINAL MESSAGE
        ----------------------------- */

        originalMessage.textContent =
            message;


        /* -----------------------------
           LOW CONCERN
        ----------------------------- */

        if (concernScore <= 1) {

            resultStatus.textContent =
                "LOOKS GOOD";

            resultTitle.textContent =
                "You're thinking before posting.";

            resultMessage.textContent =
                "Your answers suggest that your message is less likely to contribute to harmful online communication. Keep communicating with respect.";

            resultSuggestion.textContent =
                "Take one final moment to check your facts, tone and audience before posting.";

        }


        /* -----------------------------
           MEDIUM CONCERN
        ----------------------------- */

        else if (concernScore <= 3) {

            resultStatus.textContent =
                "PAUSE & THINK";

            resultTitle.textContent =
                "Consider changing your message.";

            resultMessage.textContent =
                "Your answers suggest there may be some risk of your message being misunderstood or causing unnecessary harm.";

            resultSuggestion.textContent =
                "Try removing insults, personal attacks or emotionally charged language. Focus on the idea you disagree with rather than attacking the person.";

        }


        /* -----------------------------
           HIGH CONCERN
        ----------------------------- */

        else {

            resultStatus.textContent =
                "THINK BEFORE YOU POST";

            resultTitle.textContent =
                "This message needs another look.";

            resultMessage.textContent =
                "Several of your answers suggest that posting this message as it is could contribute to harmful or hostile online communication.";

            resultSuggestion.textContent =
                "Pause before posting. Consider rewriting the message so that you address the issue without attacking, humiliating or dehumanizing another person.";

        }


        /* -----------------------------
           SHOW RESULT
        ----------------------------- */

        checkerResult.classList.add(
            "show"
        );


        /* Scroll to result */

        checkerResult.scrollIntoView({
            behavior: "smooth"
        });

    }
);


/* =========================================
   CHECK ANOTHER POST
========================================= */

checkAgain.addEventListener(
    "click",
    function () {

        postChecker.reset();

        charCount.textContent =
            "0";

        checkerResult.classList.remove(
            "show"
        );


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }
);