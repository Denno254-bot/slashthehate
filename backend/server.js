const path = require("path");
// ========================================
// SLASH THE HATE - BACKEND SERVER
// ========================================
// ========================================
// IMPORTS
// ========================================
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./database");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Groq = require("groq-sdk");
const {
    sendEmail
} = require("./email");
// ========================================
// ESCAPE HTML FOR EMAILS
// ========================================
function escapeEmailHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
// ========================================
// SEND EMAIL TO COMMUNITY MEMBERS
// ========================================
async function notifyCommunityMembers({
subject,
text,
html,
excludeUserId = null
}) {
    try {
        let query = `
            SELECT id, full_name, username, email
            FROM users
            WHERE email IS NOT NULL
            AND email != ''
        `;
        const params = [];
        if (excludeUserId !== null) {
            query += `
                AND id != ?
            `;
            params.push(excludeUserId);
        }
        const [members] =
            await db.query(
                query,
                params
            );
        if (members.length === 0) {
            console.log(
                "No community members to notify."
            );
            return;
        }
        console.log(
            `Sending community notification to ${members.length} member(s).`
        );
        for (const member of members) {
            await sendEmail({
                to: member.email,
                subject: subject,
                text: text,
                html: html
            });
        }
    } catch (error) {
        console.error(
            "Community notification error:",
            error
        );
    }
}
// ========================================
// CONFIGURATION
// ========================================
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET =
    process.env.JWT_SECRET || "slash_the_hate_secret_2026";
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
// ========================================
// MIDDLEWARE
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );
// Get current user information from database
        const [users] = await db.query(
            `SELECT id, username, role
             FROM users
             WHERE id = ?`,
            [decoded.userId]
        );
        if (!users || users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User account not found."
            });
        }
req.user = {
            userId: users[0].id,
            username: users[0].username,
            role: users[0].role
        };
        next();
    } catch (error) {
        console.error(
            "Authentication error:",
            error.message
        );
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
}
// ========================================
// ADMIN AUTHORIZATION
// ========================================
function verifyAdmin(req, res, next) {
    if (
        !req.user ||
req.user.role !== "admin"
    ) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Administrators only."
        });
    }
    next();
}
// ========================================
// HOME / API TEST
// ========================================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/homepage.html"));
});
// ========================================
// DATABASE TEST
// ========================================
app.get("/api/database-test", async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT 1 AS test"
        );
res.json({
            success: true,
            message: "Slash the Hate database is connected.",
            result: results
        });
    } catch (error) {
        console.error(
            "Database test error:",
            error
        );
res.status(500).json({
            success: false,
            message: "Database connection failed."
        });
    }
});
// ========================================
// USER REGISTRATION
// ========================================
app.post(
    "/api/auth/register",
    async (req, res) => {
        try {
            const {
                fullName,
                email,
                username,
                password
            } = req.body;
// Check required fields
            if (
                !fullName ||
                !email ||
                !username ||
                !password
            ) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required."
                });
            }
// Validate types
            if (
                typeof fullName !== "string" ||
                typeof email !== "string" ||
                typeof username !== "string" ||
                typeof password !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid registration details."
                });
            }
// Password length
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password must be at least 8 characters long."
                });
            }
            const cleanFullName =
                fullName.trim();
            const cleanEmail =
                email.trim().toLowerCase();
            const cleanUsername =
                username.trim();
// Check if user already exists
            const [existingUsers] =
                await db.query(
                    `SELECT id
                     FROM users
                     WHERE email = ?
                     OR username = ?`,
                    [
                        cleanEmail,
                        cleanUsername
                    ]
                );
            if (existingUsers.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Email or username already exists."
                });
            }
// Hash password
            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );
// Create user
// IMPORTANT:
// Every public registration is always "user".
            const [result] =
                await db.query(
                    `INSERT INTO users
                    (
                        full_name,
                        email,
                        username,
                        password,
                        role
                    )
                    VALUES (?, ?, ?, ?, 'user')`,
                    [
                        cleanFullName,
                        cleanEmail,
                        cleanUsername,
                        hashedPassword
                    ]
                );
            const userId =
                result.insertId;
// Create progress record
            await db.query(
                `INSERT INTO user_progress
                (
                    user_id,
                    lessons_completed,
                    quizzes_completed,
                    reports_submitted
                )
                VALUES (?, 0, 0, 0)`,
                [userId]
            );
            return res.status(201).json({
                success: true,
                message:
                    "Account created successfully.",
                userId: userId
            });
        } catch (error) {
            console.error(
                "Registration error:",
                error
            );
            res.status(500).json({
                success: false,
                message:
                    "Registration failed."
            });
        }
    }
);

// ========================================
// USER LOGIN
// ========================================
app.post(
    "/api/auth/login",
    async (req, res) => {
        try {
            const {
                login,
                password
            } = req.body;
            if (!login || !password) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Username/email and password are required."
                });
            }
            const cleanLogin =
                login.trim();
// IMPORTANT:
// role is now included.
            const [users] =
                await db.query(
                    `SELECT
                        id,
                        full_name,
                        email,
                        username,
                        password,
                        role
                     FROM users
                     WHERE email = ?
                     OR username = ?`,
                    [
                        cleanLogin,
                        cleanLogin
                    ]
                );
            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid username/email or password."
                });
            }
            const user =
                users[0];
// Check password
            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid username/email or password."
                });
            }
// Create JWT
            const token =
                jwt.sign(
                    {
                        userId: user.id,
                        username: user.username
                    },
                    JWT_SECRET,
                    {
                        expiresIn: "2h"
                    }
                );
// Successful login
res.json({
                success: true,
                message:
                    "Login successful.",
                token: token,
                user: {
                    id: user.id,
                    fullName:
                        user.full_name,
                    email:
                        user.email,
                    username:
                        user.username,
                    role:
                        user.role
                }
            });
        } catch (error) {
            console.error(
                "Login error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Login failed."
            });
        }
    }
);
// ========================================
// GET USER PROGRESS
// ========================================
app.get(
    "/api/user/progress/:userId",
    verifyToken,
    async (req, res) => {
        try {
            const userId =
                Number(req.params.userId);
// Users can only access their own progress
            if (
                userId !==
                Number(req.user.userId)
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You cannot access another user's progress."
                });
            }
            const [results] =
                await db.query(
                    `SELECT
                        lessons_completed,
                        quizzes_completed,
                        reports_submitted
                     FROM user_progress
                     WHERE user_id = ?`,
                    [userId]
                );
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Progress record not found."
                });
            }
res.json({
                success: true,
                progress:
                    results[0]
            });
        } catch (error) {
            console.error(
                "Progress retrieval error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Could not retrieve user progress."
            });
        }
    }
);
// ========================================
// COMPLETE LESSON
// ========================================
app.post(
    "/api/user/progress/lesson-complete",
    verifyToken,
    async (req, res) => {
        try {
            const {
                topic
            } = req.body;
            const userId =
                Number(req.user.userId);
            const allowedTopics = [
                "hate-speech",
                "cyberbullying",
                "harassment",
                "online-bodyshaming",
                "digital-respect"
            ];
            if (
                !allowedTopics.includes(topic)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson topic."
                });
            }
// Insert only once
            const [result] =
                await db.query(
                    `INSERT IGNORE INTO
                    lesson_completions
                    (user_id, topic)
                    VALUES (?, ?)`,
                    [
                        userId,
                        topic
                    ]
                );
// Already completed
            if (
                result.affectedRows === 0
            ) {
                return res.json({
                    success: true,
                    message:
                        "You have already completed this lesson.",
                    alreadyCompleted:
                        true
                });
            }
// Recalculate lesson count
            await db.query(
                `UPDATE user_progress
                 SET lessons_completed = (
                     SELECT COUNT(*)
                     FROM lesson_completions
                     WHERE user_id = ?
                 )
                 WHERE user_id = ?`,
                [
                    userId,
                    userId
                ]
            );
res.json({
                success: true,
                message:
                    "Lesson completed successfully!"
            });
        } catch (error) {
            console.error(
                "Lesson completion error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Could not save lesson completion."
            });
        }
    }
);


// AI POST ANALYSIS - GROQCLOUD
// ========================================
app.post("/api/analyze-post", async (req, res) => {
    try {
        const { text } = req.body;
// Check submitted text
        if (
            typeof text !== "string" ||
            !text.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a post to analyze."
            });
        }
// Check Groq API key
        if (!process.env.GROQ_API_KEY) {
            console.error(
                "GROQ_API_KEY is not configured."
            );
            return res.status(500).json({
                success: false,
                message:
                    "AI analysis is not configured on the server."
            });
        }
// Send post to Groq AI
        const response = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "system",
                    content: `
You are the AI safety assistant for a website
called "Slash the Hate".
Analyze the meaning and context of the complete
statement, not individual keywords alone.
Look for:
\- cyberbullying
\- harassment
\- hate speech
\- threats
\- discrimination
\- personal attacks
\- encouragement of violence
\- degrading or abusive language
A respectful disagreement should NOT automatically
be classified as harmful.
Return ONLY valid JSON using exactly this structure:
{
    "status": "safe",
    "category": "safe",
    "severity": "low",
    "reason": "Short explanation of the analysis.",
    "suggestion": "A respectful alternative if appropriate."
}
Allowed status values:
\- safe
\- potentially_harmful
\- harmful
Allowed category values:
\- safe
\- cyberbullying
\- harassment
\- hate_speech
\- threat
\- discrimination
\- violence
\- personal_attack
\- other
Allowed severity values:
\- low
\- medium
\- high
If the post is safe, use:
"Your message is already respectful."
Do not judge the person who wrote the post.
Analyze only the submitted text.
`
                },
                {
                    role: "user",
                    content: text.trim()
                }
            ],
            temperature: 0.2
        });
// Get AI response
        const aiText =
            response.choices[0].message.content;
        console.log("Groq AI response:", aiText);
        let analysis;
// Convert AI JSON into JavaScript object
        try {
            analysis = JSON.parse(aiText);
        } catch (parseError) {
            console.error(
                "Groq JSON parsing error:",
                parseError
            );
            console.error(
                "Groq response:",
                aiText
            );
            return res.status(500).json({
                success: false,
                message:
                    "The AI returned an unexpected response."
            });
        }
// Send result back to website
res.json({
            success: true,
            analysis: analysis
        });
    } catch (error) {
        console.error(
            "Groq AI post analysis error:",
            error
        );
res.status(500).json({
            success: false,
            message:
                "Unable to analyze the post right now."
        });
    }
});
// ========================================
// REPORT SUBMISSION
// ========================================
app.post(
    "/api/reports",
    verifyToken,
    async (req, res) => {
        try {
            const {
                reportType,
                description,
                platform,
                contentUrl
            } = req.body;
            const userId =
                Number(req.user.userId);
            const allowedReportTypes = [
                "Hate Speech",
                "Cyberbullying",
                "Online Harassment",
                "Bodyshaming"
            ];
            const allowedPlatforms = [
                "Facebook",
                "Instagram",
                "TikTok",
                "X",
                "WhatsApp",
                "YouTube",
                "Other"
            ];
            if (
                !allowedReportTypes.includes(
                    reportType
                ) ||
                typeof description !== "string" ||
                !description.trim() ||
                !allowedPlatforms.includes(
                    platform
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please provide valid report information."
                });
            }
            const [result] =
                await db.query(
                    `INSERT INTO reports
                    (
                        user_id,
                        report_type,
                        description,
                        platform,
                        content_url
                    )
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        userId,
                        reportType,
                        description.trim(),
                        platform,
                        contentUrl
                            ? contentUrl.trim()
                            : null
                    ]
                );
            const reportId =
                result.insertId;
// Recalculate report count
            await db.query(
                `UPDATE user_progress
                 SET reports_submitted = (
                     SELECT COUNT(*)
                     FROM reports
                     WHERE user_id = ?
                 )
                 WHERE user_id = ?`,
                [
                    userId,
                    userId
                ]
            );
res.status(201).json({
                success: true,
                message:
                    "Report submitted successfully.",
                reportId:
                    reportId
            });
        } catch (error) {
            console.error(
                "Report submission error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Failed to submit report."
            });
        }
    }
);
// ========================================
// QUIZ COMPLETION
// ========================================
app.post(
    "/api/quiz/complete",
    verifyToken,
    async (req, res) => {
        try {
            const {
                quizTopic,
                score,
                totalQuestions
            } = req.body;
            const userId =
                Number(req.user.userId);
            const allowedTopics = [
                "hate-speech",
                "cyberbullying",
                "digital-respect",
                "harassment"
            ];
            if (
                !allowedTopics.includes(
                    quizTopic
                ) ||
                !Number.isInteger(score) ||
                !Number.isInteger(
                    totalQuestions
                ) ||
                totalQuestions !== 5 ||
                score < 0 ||
                score > totalQuestions
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid quiz result."
                });
            }
            const percentage =
                (score / totalQuestions) * 100;
            const [result] =
                await db.query(
                    `INSERT INTO quiz_results
                    (
                        user_id,
                        quiz_topic,
                        score,
                        total_questions,
                        percentage
                    )
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        userId,
                        quizTopic,
                        score,
                        totalQuestions,
                        percentage
                    ]
                );
             const resultId = result.insertId;

             // Recalculate quiz count
            await db.query(
                `UPDATE user_progress
                 SET quizzes_completed = (
                     SELECT COUNT(*)
                     FROM quiz_results
                     WHERE user_id = ?
                 )
                 WHERE user_id = ?`,
                [
                    userId,
                    userId
                ]
            );
res.status(201).json({
                success: true,
                message:
                    "Quiz result saved successfully.",
                resultId:
                    resultId,
                score:
                    score,
                totalQuestions:
                    totalQuestions,
                percentage:
                    percentage
            });
        } catch (error) {
            console.error(
                "Quiz result error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Could not save quiz result."
            });
        }
    }
);
// ========================================
// ADMIN STATISTICS
// ========================================
app.get(
    "/api/admin/stats",
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            const [users] =
                await db.query(
                    "SELECT COUNT(*) AS total FROM users"
                );
            const [lessons] =
                await db.query(
                    "SELECT COUNT(*) AS total FROM lesson_completions"
                );
            const [quizzes] =
                await db.query(
                    "SELECT COUNT(*) AS total FROM quiz_results"
                );
            const [reports] =
                await db.query(
                    "SELECT COUNT(*) AS total FROM reports"
                );
res.json({
                success: true,
                stats: {
                    users:
                        users[0].total,
                    lessons:
                        lessons[0].total,
                    quizzes:
                        quizzes[0].total,
                    reports:
                        reports[0].total
                }
            });
        } catch (error) {
            console.error(
                "Admin stats error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Unable to load statistics."
            });
        }
    }
);
// ========================================
// ADMIN - VIEW USERS
// ========================================
app.get(
    "/api/admin/users",
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            const [users] =
                await db.query(
                    `SELECT
                        id,
                        full_name,
                        email,
                        username,
                        role,
                        created_at
                     FROM users
                     ORDER BY created_at DESC`
                );
res.json({
                success: true,
                users:
                    users
            });
        } catch (error) {
            console.error(
                "Admin users error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Unable to load users."
            });
        }
    }
);
// ========================================
// ADMIN - VIEW REPORTS
// ========================================
app.get(
    "/api/admin/reports",
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            const [reports] =
                await db.query(
                    `SELECT
                        r.id,
                        r.user_id,
                        u.username,
                        r.report_type,
                        r.description,
                        r.platform,
                        r.content_url,
                        r.status,
                        r.created_at
                     FROM reports r
                     LEFT JOIN users u
                     ON r.user_id = u.id
                     ORDER BY r.created_at DESC`
                );
res.json({
                success: true,
                reports:
                    reports
            });
        } catch (error) {
            console.error(
                "Admin reports error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Unable to load reports."
            });
        }
    }
);
// ========================================
// ADMIN - UPDATE REPORT STATUS
// ========================================
app.patch(
    "/api/admin/reports/:id/status",
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            const reportId =
                Number(req.params.id);
            const {
                status
            } = req.body;
            const allowedStatuses = [
                "Pending",
                "Reviewed",
                "Resolved",
                "Rejected"
            ];
            if (
                !Number.isInteger(reportId) ||
                reportId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid report ID."
                });
            }
            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid report status."
                });
            }
            const [result] =
                await db.query(
                    `UPDATE reports
                     SET status = ?
                     WHERE id = ?`,
                    [
                        status,
                        reportId
                    ]
                );
            if (
                result.affectedRows === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Report not found."
                });
            }
res.json({
                success: true,
                message:
                    "Report status updated."
            });
        } catch (error) {
            console.error(
                "Report status error:",
                error
            );
res.status(500).json({
                success: false,
                message:
                    "Unable to update report."
            });
        }
    }
);
// ========================================
// GROQ AI CONNECTION TEST
// ========================================
app.get("/api/groq-test", async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "GROQ_API_KEY is not configured."
            });
        }
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "user",
                    content: "Reply with the word OK."
                }
            ],
            temperature: 0
        });
        res.json({
            success: true,
            message: "Groq connection successful.",
            response: response.choices[0].message.content
        });
    } catch (error) {
        console.error("Groq connection test error:", error);
        res.status(500).json({
            success: false,
            message: "Groq connection test failed."
        });
    }
});

// ========================================
// GROQ AI CONNECTION TEST
// ========================================
app.get("/api/groq-test", async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "GROQ_API_KEY is not configured."
            });
        }
        const response = await groq.chat.completions.create({
           model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "user",
                    content: "Say: Groq AI is working."
                }
            ],
            temperature: 0
        });
res.json({
            success: true,
            message: "Groq AI connection is working.",
            response: response.choices[0].message.content
        });
    } catch (error) {
        console.error("Groq test error:", error);
res.status(500).json({
            success: false,
            message: "Groq AI connection failed.",
            error: error.message
        });
    }
});
// ========================================
// CREATE COMMUNITY DISCUSSION
// ========================================
app.post(
    "/api/community/discussions",
    verifyToken,
    async (req, res) => {
        try {
            const {
                title,
                category,
                content
            } = req.body;
            const userId =
                Number(req.user.userId);
            const allowedCategories = [
                "Hate Speech",
                "Cyberbullying",
                "Online Harassment",
                "Digital Respect",
                "Online Safety",
                "General Discussion"
            ];
            if (
                typeof title !== "string" ||
                typeof category !== "string" ||
                typeof content !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide all discussion details."
                });
            }
            const cleanTitle = title.trim();
            const cleanCategory = category.trim();
            const cleanContent = content.trim();
            if (
                !cleanTitle ||
                !cleanCategory ||
                !cleanContent
            ) {
                return res.status(400).json({
                    success: false,
                    message: "All discussion fields are required."
                });
            }
            if (cleanTitle.length > 200) {
                return res.status(400).json({
                    success: false,
                    message: "Discussion title is too long."
                });
            }
            if (cleanContent.length < 5) {
                return res.status(400).json({
                    success: false,
                    message: "Discussion content is too short."
                });
            }
            if (!allowedCategories.includes(cleanCategory)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid discussion category."
                });
            }
            const [result] = await db.query(
                `INSERT INTO discussions
                (
                    user_id,
                    title,
                    category,
                    content
                )
                VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    cleanTitle,
                    cleanCategory,
                    cleanContent
                ]
            );
            // Notify other registered community members. Email errors must not
            // prevent the discussion from being created successfully.
            try {
                const [creatorRows] = await db.query(
                    "SELECT username FROM users WHERE id = ?",
                    [userId]
                );
                const creatorUsername = creatorRows.length > 0
                    ? creatorRows[0].username
                    : "A member";
                const emailTitle = escapeEmailHTML(cleanTitle);
                const emailCategory = escapeEmailHTML(cleanCategory);
                const emailContent = escapeEmailHTML(cleanContent).replace(/\n/g, "<br>");
                await notifyCommunityMembers({
                    excludeUserId: userId,
                    subject: "New discussion started in Slash the Hate",
                    text: `@${creatorUsername} started a discussion in Slash the Hate.\n\nDiscussion: ${cleanTitle}\nCategory: ${cleanCategory}\n\n${cleanContent}\n\nVisit Slash the Hate to join the conversation.`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;">
                        <h2>Slash the Hate</h2>
                        <h3>New Discussion Started</h3>
                        <p><strong>@${escapeEmailHTML(creatorUsername)}</strong> started a discussion in <strong>Slash the Hate</strong>.</p>
                        <hr>
                        <p><strong>Discussion:</strong> ${emailTitle}</p>
                        <p><strong>Category:</strong> ${emailCategory}</p>
                        <p>${emailContent}</p>
                        <hr><p>Visit Slash the Hate to join the conversation.</p>
                    </div>`
                });
            } catch (emailError) {
                console.error("Discussion notification error:", emailError);
            }
            res.status(201).json({
                success: true,
                message: "Discussion started successfully.",
                discussionId: result.insertId
            });
        } catch (error) {
            console.error(
                "Discussion creation error:",
                error
            );
res.status(500).json({
                success: false,
                message: "Unable to create discussion."
            });
        }
    }
);
// ========================================
// GET ALL COMMUNITY DISCUSSIONS
// ========================================
app.get(
    "/api/community/discussions",
    async (req, res) => {
        try {
            const [discussions] =
                await db.query(
                    `SELECT
                        d.id,
                        d.title,
                        d.category,
                        d.content,
                        d.status,
                        d.created_at,
                        u.username,
                        u.full_name
                     FROM discussions d
                     INNER JOIN users u
                     ON d.user_id = u.id
                     WHERE d.status = 'Published'
                     ORDER BY d.created_at DESC`
                );
res.json({
                success: true,
                discussions
            });
        } catch (error) {
            console.error(
                "Discussion loading error:",
                error
            );
res.status(500).json({
                success: false,
                message: "Unable to load discussions."
            });
        }
    }
);
// ========================================
// GET ONE COMMUNITY DISCUSSION
// ========================================
app.get(
    "/api/community/discussions/:id",
    async (req, res) => {
        try {
            const discussionId =
                Number(req.params.id);
            if (
                !Number.isInteger(discussionId) ||
                discussionId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid discussion ID."
                });
            }
            const [discussions] =
                await db.query(
                    `SELECT
                        d.id,
                        d.title,
                        d.category,
                        d.content,
                        d.status,
                        d.created_at,
                        u.username,
                        u.full_name
                     FROM discussions d
                     INNER JOIN users u
                     ON d.user_id = u.id
                     WHERE d.id = ?
                     AND d.status = 'Published'`,
                    [discussionId]
                );
            if (discussions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Discussion not found."
                });
            }
res.json({
                success: true,
                discussion: discussions[0]
            });
        } catch (error) {
            console.error(
                "Single discussion error:",
                error
            );
res.status(500).json({
                success: false,
                message: "Unable to load discussion."
            });
        }
    }
);

// ========================================
// GET DISCUSSION REPLIES
// ========================================
app.get(
    "/api/community/discussions/:id/replies",
    async (req, res) => {
        try {
            const discussionId =
                Number(req.params.id);
            if (
                !Number.isInteger(discussionId) ||
                discussionId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid discussion ID."
                });
            }
            const [replies] =
                await db.query(
                    `SELECT
                        r.id,
                        r.content,
                        r.created_at,
                        u.username,
                        u.full_name
                     FROM discussion_replies r
                     INNER JOIN users u
                     ON r.user_id = u.id
                     WHERE r.discussion_id = ?
                     ORDER BY r.created_at ASC`,
                    [discussionId]
                );
            res.json({
                success: true,
                replies
            });
        } catch (error) {
            console.error(
                "Reply loading error:",
                error
            );
            res.status(500).json({
                success: false,
                message: "Unable to load replies."
            });
        }
    }
);
// ========================================
// POST DISCUSSION REPLY
// ========================================
app.post(
    "/api/community/discussions/:id/replies",
    verifyToken,
    async (req, res) => {
        try {
            const discussionId =
                Number(req.params.id);
            const userId =
                Number(req.user.userId);
            const {
                content
            } = req.body;
            if (
                !Number.isInteger(discussionId) ||
                discussionId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid discussion ID."
                });
            }
            if (
                typeof content !== "string" ||
                !content.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Reply cannot be empty."
                });
            }
            const cleanContent =
                content.trim();
            if (cleanContent.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Reply is too short."
                });
            }
            const [discussion] =
                await db.query(
                    `SELECT id
                     FROM discussions
                     WHERE id = ?
                     AND status = 'Published'`,
                    [discussionId]
                );
            if (discussion.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Discussion not found."
                });
            }
            const [result] =
                await db.query(
                    `INSERT INTO discussion_replies
                    (
                        discussion_id,
                        user_id,
                        content
                    )
                    VALUES (?, ?, ?)`,
                    [
                        discussionId,
                        userId,
                        cleanContent
                    ]
                );
// Notify other registered members, excluding the person who replied.
            // Keep notification lookups inside this try so email-related problems
            // cannot turn a successfully saved reply into a failed API response.
            try {
                const [replyAuthorRows] = await db.query(
                    `SELECT username FROM users WHERE id = ?`,
                    [userId]
                );
                const replyAuthor = replyAuthorRows.length > 0
                    ? replyAuthorRows[0].username
                    : "A member";
                const [discussionRows] = await db.query(
                    `SELECT title FROM discussions WHERE id = ?`,
                    [discussionId]
                );
                const discussionTitle = discussionRows.length > 0
                    ? discussionRows[0].title
                    : "a discussion";
                const emailDiscussionTitle = escapeEmailHTML(discussionTitle);
                const emailReply = escapeEmailHTML(cleanContent).replace(/\n/g, "<br>");
                await notifyCommunityMembers({
                    excludeUserId: userId,
                    subject: "New reply in Slash the Hate",
                    text: `@${replyAuthor} replied to a discussion in Slash the Hate.\n\nDiscussion: ${discussionTitle}\n\nReply:\n${cleanContent}\n\nVisit Slash the Hate to continue the conversation.`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;">
                        <h2>Slash the Hate</h2>
                        <h3>New Reply</h3>
                        <p><strong>@${escapeEmailHTML(replyAuthor)}</strong> replied to a discussion in <strong>Slash the Hate</strong>.</p>
                        <hr>
                        <p><strong>Discussion:</strong> ${emailDiscussionTitle}</p>
                        <p><strong>Reply:</strong></p>
                        <p>${emailReply}</p>
                        <hr><p>Visit Slash the Hate to continue the conversation.</p>
                    </div>`
                });
            } catch (emailError) {
                console.error("Reply notification error:", emailError);
            }
            res.status(201).json({
                success: true,
                message: "Reply posted successfully.",
                replyId: result.insertId
            });
        } catch (error) {
            console.error(
                "Reply creation error:",
                error
            );
            res.status(500).json({
                success: false,
                message: "Unable to post reply."
            });
        }
    }
);
// ========================================
// START SERVER
// ========================================
app.listen(
    PORT,
    () => {
        console.log(
            `Slash the Hate server running at http://localhost:${PORT}`
        );
    }
);