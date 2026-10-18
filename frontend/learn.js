
/* =========================================
   SLASH THE HATE — LEARN PAGE
   Lesson modals, videos and progress tracking
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* =========================================
       GET HTML ELEMENTS
    ========================================= */

    const learnButtons = document.querySelectorAll(".learn-more");

    const learningModal = document.getElementById("learningModal");
    const closeModal = document.getElementById("closeModal");

    const modalNumber = document.getElementById("modalNumber");
    const modalTitle = document.getElementById("modalTitle");
    const modalDefinition = document.getElementById("modalDefinition");

    const modalExamples = document.getElementById("modalExamples");
    const modalSigns = document.getElementById("modalSigns");

    const modalAction = document.getElementById("modalAction");
    const modalTakeaway = document.getElementById("modalTakeaway");

    const modalVideo = document.getElementById("modalVideo");
    const modalVideoSource = document.getElementById("modalVideoSource");

    const completeLessonBtn = document.getElementById("completeLessonBtn");
    const completionMessage = document.getElementById("completionMessage");

    let currentTopic = null;
    let isSavingProgress = false;

    /* =========================================
       CHECK REQUIRED HTML ELEMENTS
    ========================================= */

    if (!learningModal) {
        console.error(
            "Slash the Hate: #learningModal is missing from learn.html."
        );
        return;
    }

    if (!closeModal || !modalTitle || !modalNumber) {
        console.error(
            "Slash the Hate: One or more required modal elements are missing."
        );
        return;
    }

    if (learnButtons.length === 0) {
        console.error(
            "Slash the Hate: No .learn-more buttons were found."
        );
    }

    console.log(
        "Slash the Hate Learn page loaded.",
        learnButtons.length,
        "lesson buttons found."
    );

    /* =========================================
       LESSON CONTENT
    ========================================= */

    const topics = {
        "hate-speech": {
            number: "LESSON 01",
            title: "Hate Speech",

            definition:
                "Hate speech is communication that attacks, threatens, " +
                "or dehumanizes people because of characteristics such as " +
                "their ethnicity, nationality, religion, or other identity.",

            examples: [
                "Posting messages that encourage hatred against an ethnic group.",
                "Using slurs to insult people because of their identity.",
                "Publishing content that encourages discrimination or violence against a group."
            ],

            signs: [
                "Attacks directed at people because of their identity.",
                "Language that dehumanizes or threatens a group.",
                "Messages encouraging exclusion, discrimination, or violence."
            ],

            action:
                "Do not share hateful content. Report it through the platform's " +
                "reporting tools, support people who are targeted, and respond " +
                "respectfully when it is safe to do so.",

            takeaway:
                "Respect people's dignity and identity. Disagreement should never " +
                "become an excuse for hatred.",

            video: ""
        },

        "cyberbullying": {
            number: "LESSON 02",
            title: "Cyberbullying",

            definition:
                "Cyberbullying is the use of digital platforms to bully, " +
                "intimidate, humiliate, or repeatedly harm another person.",

            examples: [
                "Sending repeated insulting or threatening messages.",
                "Sharing someone's embarrassing images to humiliate them.",
                "Organizing people online to mock or target someone."
            ],

            signs: [
                "Repeated online insults or threats.",
                "A person is deliberately excluded from online groups.",
                "Private information or embarrassing content is shared to cause harm."
            ],

            action:
                "Save relevant evidence, block the person where appropriate, " +
                "report the behaviour, and seek help from a trusted person " +
                "or the appropriate authorities if necessary.",

            takeaway:
                "Your actions online affect real people. Choose kindness over bullying.",

            video: ""
        },

        "harassment": {
            number: "LESSON 03",
            title: "Online Harassment",

            definition:
                "Online harassment is unwanted or abusive behaviour through " +
                "digital communication that intimidates, threatens, or distresses someone.",

            examples: [
                "Repeated unwanted messages after someone asks for contact to stop.",
                "Threatening someone through social media.",
                "Sharing personal information to intimidate or target a person."
            ],

            signs: [
                "Persistent unwanted contact.",
                "Threats, intimidation, or abusive messages.",
                "Attempts to frighten or control someone through digital platforms."
            ],

            action:
                "Keep evidence, adjust your privacy settings, block and report " +
                "the account, and seek appropriate support if you feel threatened.",

            takeaway:
                "Everyone deserves boundaries, privacy, and safety online.",

            video: ""
        },

        "online-bodyshaming": {
            number: "LESSON 04",
            title: "Online Bodyshaming",

            definition:
                "Online bodyshaming is the act of insulting, mocking, or humiliating " +
                "someone because of their body, appearance, size, or physical features.",

            examples: [
                "Mocking someone's weight in a public comment.",
                "Posting memes intended to ridicule someone's appearance.",
                "Making cruel remarks about a person's physical features."
            ],

            signs: [
                "Comments intended to humiliate someone about their appearance.",
                "Unwanted comparisons or degrading nicknames.",
                "Edited images or memes created to ridicule a person's body."
            ],

            action:
                "Avoid commenting on people's bodies in hurtful ways. Report abusive " +
                "content, support the person targeted, and promote body respect.",

            takeaway:
                "A person's worth is not determined by their appearance.",

            video: ""
        },

        "digital-respect": {
            number: "LESSON 05",
            title: "Digital Respect",

            definition:
                "Digital respect means treating other people with dignity, fairness, " +
                "and consideration when communicating or sharing content online.",

            examples: [
                "Disagreeing with someone's opinion without insulting them.",
                "Asking permission before sharing another person's private information.",
                "Checking facts before sharing a potentially harmful claim."
            ],

            signs: [
                "Respectful disagreement and constructive discussion.",
                "Respect for privacy and personal boundaries.",
                "Thoughtful sharing and responsible communication."
            ],

            action:
                "Pause before posting. Check whether your message is accurate, " +
                "necessary, respectful, and helpful. Think about how it may affect others.",

            takeaway:
                "Use your digital voice to build conversations, not destroy people.",

            video: ""
        }
    };

    /* =========================================
       DISPLAY A LESSON
    ========================================= */

    function openTopic(topicName) {
        const topic = topics[topicName];

        if (!topic) {
            console.error("Slash the Hate: Topic not found:", topicName);
            return;
        }

        currentTopic = topicName;

        modalNumber.textContent = topic.number;
        modalTitle.textContent = topic.title;
        modalDefinition.textContent = topic.definition;
        modalAction.textContent = topic.action;
        modalTakeaway.textContent = topic.takeaway;

        // Fill the examples list.
        if (modalExamples) {
            modalExamples.replaceChildren();

            topic.examples.forEach(function (example) {
                const item = document.createElement("li");
                item.textContent = example;
                modalExamples.appendChild(item);
            });
        }

        // Fill the warning signs list.
        if (modalSigns) {
            modalSigns.replaceChildren();

            topic.signs.forEach(function (sign) {
                const item = document.createElement("li");
                item.textContent = sign;
                modalSigns.appendChild(item);
            });
        }

        // Load a lesson video only if a video URL is provided.
        if (modalVideo && modalVideoSource) {
            modalVideo.pause();
            modalVideoSource.src = topic.video || "";
            modalVideo.load();

            modalVideo.hidden = !topic.video;
        }

        if (completionMessage) {
            completionMessage.textContent = "";
        }

        if (completeLessonBtn) {
            completeLessonBtn.disabled = false;
            completeLessonBtn.textContent = "Mark Lesson as Completed";
        }

        learningModal.classList.add("active");
        learningModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        console.log("Opened lesson:", topic.title);
    }

    /* =========================================
       CONNECT LEARN MORE BUTTONS
    ========================================= */

    learnButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            const topicName = button.dataset.topic;

            console.log("Learn more clicked:", topicName);

            openTopic(topicName);
        });
    });

    /* =========================================
       CLOSE THE LESSON MODAL
    ========================================= */

    function closeLearningModal() {
        learningModal.classList.remove("active");
        learningModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");

        if (modalVideo) {
            modalVideo.pause();
        }

        currentTopic = null;
    }

    closeModal.addEventListener("click", closeLearningModal);

    // Close when the user clicks the dark backdrop.
    learningModal.addEventListener("click", function (event) {
        if (event.target === learningModal) {
            closeLearningModal();
        }
    });

    // Close when the user presses Escape.
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            learningModal.classList.contains("active")
        ) {
            closeLearningModal();
        }
    });

    /* =========================================
       MARK LESSON AS COMPLETED
    ========================================= */

    if (completeLessonBtn) {
        completeLessonBtn.addEventListener("click", async function () {
            if (!currentTopic || isSavingProgress) {
                return;
            }

            const token = localStorage.getItem("slashTheHateToken");

            if (!token) {
                if (completionMessage) {
                    completionMessage.textContent =
                        "Please log in to save your lesson progress.";
                }

                return;
            }

            isSavingProgress = true;
            completeLessonBtn.disabled = true;
            completeLessonBtn.textContent = "Saving progress...";

            if (completionMessage) {
                completionMessage.textContent = "";
            }

            try {
               
                const response = await fetch(
                    "/api/user/progress/lesson-complete",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify({
                            topic: currentTopic
                        })
                    }
                );

                const result = await response.json().catch(function () {
                    return {};
                });


                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        result.error ||
                        "The server could not save your progress."
                    );
                }

                if (completionMessage) {
                    completionMessage.textContent =
                        "Lesson completed! Your progress has been saved.";
                }

                completeLessonBtn.textContent = "Lesson Completed";

                console.log("Lesson progress saved:", currentTopic, result);

            } catch (error) {
                console.error("Could not save lesson progress:", error);

                if (completionMessage) {
                    completionMessage.textContent =
                        "The lesson could not be saved. Check your connection " +
                        "and try again.";
                }

                completeLessonBtn.disabled = false;
                completeLessonBtn.textContent = "Try Saving Again";

            } finally {
                isSavingProgress = false;
            }
        });
    }
});
