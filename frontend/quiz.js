
// ========================================
// SLASH THE HATE - QUIZ DATA
// ========================================
const API_BASE_URL = "http://localhost:3000";
const quizData = {
    "hate-speech": {
        title: "Hate Speech",
        questions: [
            {
                question: "What is hate speech?",
                options: [
                    "Any disagreement between friends",
                    "Expression that attacks or demeans people based on identity",
                    "A respectful debate about ideas",
                    "A positive comment online"
                ],
                answer: 1,
                explanation: "Hate speech attacks or demeans people based on characteristics such as ethnicity, religion or nationality."
            },
            {
                question: "Which of the following is an example of hate speech?",
                options: [
                    "Criticizing a public policy",
                    "Disagreeing with someone's opinion",
                    "Using slurs to demean a group based on ethnicity",
                    "Giving constructive feedback"
                ],
                answer: 2,
                explanation: "Using slurs to demean people because of their ethnicity is an example of hate speech."
            },
            {
                question: "What should you do when you encounter hateful content online?",
                options: [
                    "Share it with more people",
                    "Respond with more hate",
                    "Report it through the platform's tools",
                    "Encourage others to attack the person"
                ],
                answer: 2,
                explanation: "Reporting harmful content through platform tools can help address it without escalating the situation."
            },
            {
                question: "Which action promotes a safer online environment?",
                options: [
                    "Respecting differences",
                    "Spreading stereotypes",
                    "Insulting people with different beliefs",
                    "Encouraging discrimination"
                ],
                answer: 0,
                explanation: "Respecting diversity and differences helps create a safer digital environment."
            },
            {
                question: "Why can hate speech be harmful?",
                options: [
                    "It always improves discussion",
                    "It can encourage discrimination and hostility",
                    "It makes everyone agree",
                    "It has no effect on people"
                ],
                answer: 1,
                explanation: "Hate speech can contribute to discrimination, hostility and harm against individuals or communities."
            }
        ]
    },

    "cyberbullying": {
        title: "Cyberbullying",
        questions: [
            {
                question: "What is cyberbullying?",
                options: [
                    "Helping someone online",
                    "Using digital platforms to repeatedly harm or intimidate someone",
                    "Sharing educational materials",
                    "Playing online games"
                ],
                answer: 1,
                explanation: "Cyberbullying involves using digital communication to bully, intimidate or harm someone."
            },
            {
                question: "Which is an example of cyberbullying?",
                options: [
                    "Sending a friendly greeting",
                    "Sharing study notes",
                    "Repeatedly sending threatening messages to someone",
                    "Congratulating a friend"
                ],
                answer: 2,
                explanation: "Repeated threatening messages are a form of cyberbullying."
            },
            {
                question: "What should you do if you are being cyberbullied?",
                options: [
                    "Keep evidence and report the behavior",
                    "Send threats in return",
                    "Share your passwords",
                    "Delete all evidence immediately"
                ],
                answer: 0,
                explanation: "Keeping evidence and reporting the behavior can help you seek support and take appropriate action."
            },
            {
                question: "What is one possible effect of cyberbullying?",
                options: [
                    "Improved confidence in every case",
                    "Emotional distress",
                    "Guaranteed academic success",
                    "No possible impact"
                ],
                answer: 1,
                explanation: "Cyberbullying can cause emotional distress and may affect a person's wellbeing."
            },
            {
                question: "How can a bystander help someone facing cyberbullying?",
                options: [
                    "Join in the bullying",
                    "Spread the harmful posts",
                    "Offer support and report harmful behavior",
                    "Mock the person"
                ],
                answer: 2,
                explanation: "Supporting the affected person and reporting harmful behavior can help reduce harm."
            }
        ]
    },

    "digital-respect": {
        title: "Digital Respect",
        questions: [
            {
                question: "What does digital respect mean?",
                options: [
                    "Insulting people during disagreements",
                    "Communicating responsibly and respectfully online",
                    "Sharing private information without permission",
                    "Forcing others to agree with you"
                ],
                answer: 1,
                explanation: "Digital respect means treating others with dignity and responsibility in online spaces."
            },
            {
                question: "What should you do before sharing someone's photo?",
                options: [
                    "Share it immediately",
                    "Edit it to embarrass them",
                    "Ask for their permission",
                    "Post it anonymously"
                ],
                answer: 2,
                explanation: "Respecting someone's privacy includes asking permission before sharing their personal photos."
            },
            {
                question: "How should you respond to an online disagreement?",
                options: [
                    "Use personal insults",
                    "Respectfully explain your point of view",
                    "Threaten the other person",
                    "Encourage others to attack them"
                ],
                answer: 1,
                explanation: "Respectful communication allows people to disagree without attacking one another."
            },
            {
                question: "Which behavior demonstrates digital responsibility?",
                options: [
                    "Checking information before sharing it",
                    "Spreading unverified rumors",
                    "Sharing passwords publicly",
                    "Posting private conversations without consent"
                ],
                answer: 0,
                explanation: "Checking information helps prevent misinformation and unnecessary harm."
            },
            {
                question: "Why is empathy important online?",
                options: [
                    "It helps us understand how others may feel",
                    "It encourages harassment",
                    "It removes the need for privacy",
                    "It makes every opinion identical"
                ],
                answer: 0,
                explanation: "Empathy helps us consider the impact of our words and actions on others."
            }
        ]
    },

    "harassment": {
        title: "Online Harassment",
        questions: [
            {
                question: "What is online harassment?",
                options: [
                    "Unwanted behavior that intimidates, threatens or targets someone online",
                    "Sharing a public educational article",
                    "A friendly online conversation",
                    "Respectfully discussing different views"
                ],
                answer: 0,
                explanation: "Online harassment includes unwanted conduct that targets, intimidates or threatens someone."
            },
            {
                question: "Which is an example of online harassment?",
                options: [
                    "Sending a thank-you message",
                    "Repeatedly sending unwanted threatening messages",
                    "Sharing a public announcement",
                    "Joining an educational discussion"
                ],
                answer: 1,
                explanation: "Repeated unwanted threatening messages can constitute online harassment."
            },
            {
                question: "What is a suitable response to online harassment?",
                options: [
                    "Escalate the conflict",
                    "Share personal details with the harasser",
                    "Save evidence, block the account and report it",
                    "Encourage others to harass them"
                ],
                answer: 2,
                explanation: "Saving evidence, blocking the account and reporting the conduct are possible protective steps."
            },
            {
                question: "Why should you protect personal information online?",
                options: [
                    "To make harassment easier",
                    "To reduce privacy and safety risks",
                    "To share it with strangers",
                    "Because privacy is unimportant"
                ],
                answer: 1,
                explanation: "Protecting personal information can reduce risks such as unwanted contact, intimidation and misuse."
            },
            {
                question: "What should you do if online harassment includes a credible threat of physical harm?",
                options: [
                    "Ignore every threat",
                    "Publish your private details",
                    "Preserve evidence and seek help from trusted people or appropriate authorities",
                    "Threaten the person back"
                ],
                answer: 2,
                explanation: "Credible threats should be taken seriously. Preserve evidence and seek appropriate support."
            }
        ]
    }
};


// ========================================
// QUIZ STATE
// ========================================

let currentQuiz = null;
let currentQuizTopic = null;
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;

const quizArea = document.getElementById("quizArea");


// ========================================
// START QUIZ
// ========================================

document.querySelectorAll(".quiz-start-btn").forEach(button => {
    button.addEventListener("click", () => {
        const quizName = button.dataset.quiz;

        if (!quizData[quizName]) {
            console.error("Quiz not found:", quizName);
            return;
        }

        currentQuiz = quizData[quizName];
        currentQuizTopic = quizName;
        currentQuestionIndex = 0;
        score = 0;
        selectedAnswer = null;

        showQuestion();

        quizArea.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});


// ========================================
// DISPLAY QUESTION
// ========================================

function showQuestion() {
    const questionData =
        currentQuiz.questions[currentQuestionIndex];

    const questionNumber = currentQuestionIndex + 1;
    const totalQuestions = currentQuiz.questions.length;

    quizArea.innerHTML = `
        <div class="quiz-card-active">

            <div class="active-quiz-header">
                <span class="quiz-number">
                    ${currentQuiz.title}
                </span>

                <span class="question-count">
                    Question ${questionNumber} of ${totalQuestions}
                </span>
            </div>

            <div class="quiz-progress-track">
                <div class="quiz-progress-fill"
                    style="width: ${(questionNumber / totalQuestions) * 100}%">
                </div>
            </div>

            <h2 class="active-question">
                ${questionData.question}
            </h2>

            <div class="answer-options">
                ${questionData.options.map((option, index) => `
                    <button class="answer-option"
                        data-index="${index}"
                        type="button">

                        <span class="answer-letter">
                            ${String.fromCharCode(65 + index)}
                        </span>

                        <span>${option}</span>
                    </button>
                `).join("")}
            </div>

            <p id="answerFeedback"
                class="answer-feedback"
                aria-live="polite">
            </p>

            <button id="nextQuestionBtn"
                class="quiz-start-btn"
                type="button"
                disabled>
                ${questionNumber === totalQuestions
                    ? "View Results →"
                    : "Next Question →"}
            </button>

        </div>
    `;


    // ========================================
    // CHECK ANSWER
    // ========================================

    document.querySelectorAll(".answer-option").forEach(button => {
        button.addEventListener("click", () => {

            // Prevent answering the same question twice
            if (selectedAnswer !== null) {
                return;
            }

            selectedAnswer = Number(button.dataset.index);

            const isCorrect =
                selectedAnswer === questionData.answer;

            if (isCorrect) {
                score++;
            }

            // Show correct and incorrect answers
            document.querySelectorAll(".answer-option").forEach(
                (optionButton, index) => {

                    optionButton.disabled = true;

                    if (index === questionData.answer) {
                        optionButton.classList.add("correct");
                    } else if (index === selectedAnswer) {
                        optionButton.classList.add("incorrect");
                    }
                }
            );

            // Display explanation
            const feedback =
                document.getElementById("answerFeedback");

            feedback.textContent =
                (isCorrect ? "Correct! " : "Not quite. ") +
                questionData.explanation;

            feedback.className =
                "answer-feedback " +
                (isCorrect
                    ? "feedback-correct"
                    : "feedback-incorrect");

            // Enable next question button
            document.getElementById("nextQuestionBtn").disabled = false;
        });
    });


    // ========================================
    // NEXT QUESTION OR RESULTS
    // ========================================

    document.getElementById("nextQuestionBtn")
        .addEventListener("click", () => {

            currentQuestionIndex++;
            selectedAnswer = null;

            if (currentQuestionIndex < totalQuestions) {
                showQuestion();
            } else {
                showResults();
            }
        });
}


// ========================================
// DISPLAY QUIZ RESULTS
// ========================================

function showResults() {
    const total = currentQuiz.questions.length;
    const percentage = Math.round((score / total) * 100);

    quizArea.innerHTML = `
        <div class="quiz-card-active quiz-results">

            <span class="quiz-number">
                QUIZ COMPLETED
            </span>

            <div class="results-icon">🏆</div>

            <h2>
                You've completed ${currentQuiz.title}!
            </h2>

            <p class="results-score">
                ${score} / ${total}
            </p>

            <p class="results-percentage">
                Your score: ${percentage}%
            </p>

            <p class="results-message">
                ${percentage === 100
                    ? "Excellent! You answered every question correctly."
                    : percentage >= 60
                    ? "Well done! Keep learning and improving."
                    : "Keep practising. Review the lessons and try again."}
            </p>

            <p id="quizSaveMessage" aria-live="polite">
                Saving your quiz result...
            </p>

            <button id="retakeQuizBtn"
                class="quiz-start-btn"
                type="button">
                Retake Quiz ↻
            </button>

        </div>
    `;


    // Save the completed quiz result
    saveQuizResult(currentQuizTopic, score, total);


    // ========================================
    // RETAKE QUIZ
    // ========================================

    document.getElementById("retakeQuizBtn")
        .addEventListener("click", () => {

            currentQuestionIndex = 0;
            score = 0;
            selectedAnswer = null;

            showQuestion();
        });
}


// ========================================
// SAVE QUIZ RESULT TO BACKEND
// ========================================

async function saveQuizResult(quizTopic, score, totalQuestions) {
    const token =
        localStorage.getItem("slashTheHateToken");

    const message =
        document.getElementById("quizSaveMessage");


    // Check whether the user is logged in
    if (!token) {
        if (message) {
            message.textContent =
                "Please log in to save your quiz result.";
        }
        return;
    }


    // Show saving message
    if (message) {
        message.textContent =
            "Saving your quiz result...";
    }


    try {
        const response = await fetch(
            `${API_BASE_URL}/api/quiz/complete`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    quizTopic: quizTopic,
                    score: score,
                    totalQuestions: totalQuestions
                })
            }
        );


        const data = await response.json();


        // Handle unsuccessful response
        if (!response.ok) {
            throw new Error(
                data.message || "Could not save quiz result."
            );
        }


        // Confirm successful saving
        if (message) {
            message.textContent =
                "Quiz result saved successfully!";
        }

        console.log("Quiz result saved:", data);


    } catch (error) {

        console.error("Quiz save error:", error);

        if (message) {
            message.textContent =
                error.message ||
                "Unable to save quiz result. Please try again.";
        }
    }
}
