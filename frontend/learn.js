
/* =========================================
   SLASH THE HATE
   LEARN PAGE
========================================= */


/* =========================================
   GET HTML ELEMENTS
========================================= */

const learnButtons =
    document.querySelectorAll(".learn-more");

const learningModal =
    document.getElementById("learningModal");

const closeModal =
    document.getElementById("closeModal");


const modalNumber =
    document.getElementById("modalNumber");

const modalTitle =
    document.getElementById("modalTitle");

const modalDefinition =
    document.getElementById("modalDefinition");

const modalExamples =
    document.getElementById("modalExamples");

const modalSigns =
    document.getElementById("modalSigns");

const modalAction =
    document.getElementById("modalAction");

const modalTakeaway =
    document.getElementById("modalTakeaway");

    const modalVideo =
    document.getElementById("modalVideo");

const modalVideoSource =
    document.getElementById("modalVideoSource");



    const completeLessonBtn =
    document.getElementById("completeLessonBtn");
   


const completionMessage =
    document.getElementById("completionMessage");

let currentTopic = null;
/* =========================================
   LEARNING CONTENT
========================================= */

const topics = {

    /* =====================================
       CYBERBULLYING
    ====================================== */

    "cyberbullying": {

        number: "02",

        title: "Cyberbullying",
        video: "videos/cyberbullying.mp4",

        definition:
            "Cyberbullying involves using digital communication or online platforms to repeatedly hurt, intimidate, embarrass or target another person. Unlike traditional bullying, online bullying can reach a person even when they are at home. Insults, threats, embarrassing posts, spreading rumors, sharing private information, impersonation, or deliberately excluding someone. Something typed as a joke can seriously affect another person's emotions and wellbeing.",

        examples: [

            "Repeatedly sending insulting messages",

            "Posting humiliating content about someone",

            "Creating accounts to mock or target another person",

            "Encouraging others to attack someone online"

        ],

        signs: [

            "Repeated personal attacks",

            "Humiliating posts or comments",

            "Coordinated attacks from multiple accounts",

            "Someone being deliberately excluded or targeted"

        ],

        action:
            "Do not join the attack. Save evidence, block or mute the person when appropriate, report harmful content and seek help from someone you trust.",

        takeaway:
            "A screen does not remove the impact of your words."

    },


    /* =====================================
       HATE SPEECH
    ====================================== */

    "hate-speech": {

        number: "01",

        title: "Hate Speech",

        definition:
            "Hate speech generally refers to communication that attacks, dehumanizes or promotes hostility toward people or groups because of characteristics such as identity or background. t can appear in social media posts, comments, videos, messages, livestreams, memes, and online discussions. People can have different opinions without attacking or degrading others. Hate speech can lead to fear, discrimination, exclusion, conflict, and sometimes violence.",

        examples: [

            "Attacking people because of their identity",

            "Using dehumanizing language toward a group",

            "Encouraging hostility against a group",

            "Spreading messages that portray a group as inferior"

        ],

        signs: [

            "Targeting an entire group",

            "Dehumanizing language",

            "Calls for hostility or exclusion",

            "Attacks based on identity rather than conduct"

        ],

        action:
            "Do not amplify harmful content. Consider reporting it through the platform's reporting system and avoid responding with more hateful language.",

        takeaway:
            "Disagreement does not require dehumanizing another person."

    },


    /* =====================================
       HARASSMENT
    ====================================== */

    "harassment": {

        number: "03",

        title: "Online Harassment",

        definition:
            "Online harassment involves unwanted, hostile or abusive behavior directed toward someone through digital platforms. Repeated unwanted messages, threats, insults, stalking, sexual harassment, impersonation, or coordinated attacks. Harassment can happen through private messages, emails, gaming chats, or other digital communication. Continuously contacting someone after they have clearly asked you to stop is not respectful behavior.",

        examples: [

            "Repeated unwanted messages",

            "Targeted insults or intimidation",

            "Persistent unwanted contact",

            "Encouraging others to attack an individual"

        ],

        signs: [

            "The behavior continues after someone asks it to stop",

            "Repeated unwanted contact",

            "Personal attacks rather than discussion",

            "Attempts to intimidate or humiliate"

        ],

        action:
            "Avoid escalating the situation. Use privacy controls, block or mute the account, keep evidence where necessary and report serious or persistent abuse.",

        takeaway:
            "You can disagree with someone without making them your target."

    },
      
    /*=========================================
           ONLINE BODYSHAMING
        ========================================*/

    "online-bodyshaming": {

    number: "04",

    title: "Online Bodyshaming",

    definition:
        "Online bodyshaming involves mocking, insulting or humiliating someone because of their physical appearance, body, size or disability. People can be body-shamed because of their weight, height, skin, hair, facial features, body shape, disability, or other aspects of their appearance. Comments, memes, edited photos, videos, posts, private messages, and even 'jokes' can be used to shame someone. Calling something a joke does not automatically make it harmless, especially when the target is embarrassed or hurt.",

    examples: [

        "Making insulting comments about someone's appearance",

        "Sharing embarrassing images of someone to mock them",

        "Making jokes about someone's body or disability",

        "Encouraging others to ridicule someone's appearance"

    ],

    signs: [

        "Repeated comments about someone's appearance",

        "Public humiliation or mocking",

        "Insults focused on body or physical characteristics",

        "Sharing images to embarrass someone"

    ],

    action:
        "Do not participate in appearance-based attacks. Avoid sharing humiliating content, report abusive behavior when appropriate and support the person being targeted.",

    takeaway:
        "A person's appearance is never an invitation to disrespect them."

},


    /* =====================================
       DIGITAL RESPECT
    ====================================== */

    "digital-respect": {

        number: "05",

        title: "Digital Respect",

        definition:
            "Digital respect means communicating online while considering other people's dignity, boundaries, privacy and right to express different views. Online communication still affects real people. Ask yourself: Would I say this to someone face-to-face? Could this hurt someone? Disagreement does not have to become an attack. Don't share someone's private messages, photos, videos, personal information, or conversations without permission. Consent matters, especially when posting pictures, videos, or information involving other people.",

        examples: [

            "Disagreeing without insulting someone",

            "Checking information before sharing it",

            "Respecting someone's privacy",

            "Thinking about the impact of a post before publishing it"

        ],

        signs: [

            "Constructive disagreement",

            "Respectful language",

            "Responsible sharing",

            "Respect for personal boundaries"

        ],

        action:
            "Pause before posting. Ask whether your message is true, necessary, respectful and helpful. If emotions are high, consider waiting before responding.",

        takeaway:
            "Use your digital voice to build conversations, not destroy people."

    }

};


/* =========================================
   OPEN LEARNING TOPIC
========================================= */

learnButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            const topic =
                button.dataset.topic;

            openTopic(topic);

        }
    );

});


/* =========================================
   OPEN TOPIC FUNCTION
========================================= */

function openTopic(topicName) {

    const topic =
        topics[topicName];
        currentTopic = topicName;


    if (!topic) {

        return;

    }


    /* =====================================
       FILL MODAL
    ====================================== */

    modalNumber.textContent =
        topic.number;


    modalTitle.textContent =
        topic.title;


    modalDefinition.textContent =
        topic.definition;


    modalAction.textContent =
        topic.action;


    modalTakeaway.textContent =
        topic.takeaway;

        modalVideoSource.src = topic.video;
modalVideo.load();


    /* =====================================
       EXAMPLES
    ====================================== */

    modalExamples.innerHTML = "";


    topic.examples.forEach(
        function(example) {

            const li =
                document.createElement("li");

            li.textContent =
                example;

            modalExamples.appendChild(li);

        }
    );


    /* =====================================
       WARNING SIGNS
    ====================================== */

    modalSigns.innerHTML = "";


    topic.signs.forEach(
        function(sign) {

            const li =
                document.createElement("li");

            li.textContent =
                sign;

            modalSigns.appendChild(li);

        }
    );


    /* =====================================
       SHOW MODAL
    ====================================== */

    learningModal.classList.add(
        "active"
    );


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================
   CLOSE MODAL
========================================= */

closeModal.addEventListener(
    "click",
    closeLearningModal
);


function closeLearningModal() {

    learningModal.classList.remove(
        "active"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================
   CLOSE WHEN CLICKING OUTSIDE
========================================= */

learningModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === learningModal
        ) {

            closeLearningModal();

        }

    }
);


/* =========================================
   CLOSE WITH ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeLearningModal();

        }

    }
);


/* =========================================
   MARK LESSON AS COMPLETE
========================================= */


 /* =========================================
   COMPLETE LESSON
========================================= */

completeLessonBtn.addEventListener(
    "click",
    async function() {

        const token =
            localStorage.getItem(
                "slashTheHateToken"
            );

        const storedUser =
            localStorage.getItem(
                "slashTheHateUser"
            );


        if (!token || !storedUser) {

            alert(
                "Please login before completing a lesson."
            );

            window.location.href =
                "login.html";

            return;

        }


        const user =
            JSON.parse(storedUser);


        if (!currentTopic) {

            alert(
                "Please open a lesson first."
            );

            return;

        }


        try {

            const response = await fetch(
                "http://localhost:3000/api/user/progress/lesson-complete",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        userId:
                            user.id,

                        topic:
                            currentTopic

                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not complete lesson."
                );

                return;

            }


            alert(data.message);


            completeLessonBtn.textContent =
                "Lesson Completed ✓";

            completeLessonBtn.disabled =
                true;

        }

        catch (error) {

            console.error(
                "Lesson completion error:",
                error
            );

            alert(
                "Could not connect to the server."
            );

        }

    }
);