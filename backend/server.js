
/* ============================================
   SLASH THE HATE - BACKEND SERVER
   Authentication, Learning, Reports, AI,
   Admin Dashboard and Community
============================================ */

require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Groq = require("groq-sdk");
const db = require("./database");
const { sendEmail } = require("./email");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

// ============================================
// CONFIGURATION CHECKS
// ============================================

if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET is missing from .env");
    process.exit(1);
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json({ limit: "100kb" }));

// Serve the Slash the Hate frontend
const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));

// ============================================
// CONSTANTS
// ============================================

const ALLOWED_TOPICS = [
    "hate-speech",
    "cyberbullying",
    "harassment",
    "online-bodyshaming",
    "digital-respect"
];

const ALLOWED_QUIZ_TOPICS = [
    "hate-speech",
    "cyberbullying",
    "digital-respect",
    "harassment"
];

const ALLOWED_REPORT_TYPES = [
    "Hate Speech",
    "Cyberbullying",
    "Online Harassment",
    "Bodyshaming"
];

const ALLOWED_PLATFORMS = [
    "Facebook",
    "Instagram",
    "TikTok",
    "X",
    "WhatsApp",
    "YouTube",
    "Other"
];

const ALLOWED_DISCUSSION_CATEGORIES = [
    "Hate Speech",
    "Cyberbullying",
    "Online Harassment",
    "Digital Respect",
    "Online Safety",
    "General Discussion"
];

const ALLOWED_REPORT_STATUSES = [
    "Pending",
    "Reviewed",
    "Resolved",
    "Rejected"
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function escapeEmailHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function asyncHandler(handler) {
    return (req, res, next) =>
        Promise.resolve(handler(req, res, next)).catch(next);
}

async function notifyCommunityMembers({
    subject,
    text,
    html,
    excludeUserId = null
}) {
    try {
        let sql = `
            SELECT email
            FROM users
            WHERE email IS NOT NULL
              AND email != ''
        `;

        const params = [];

        if (excludeUserId !== null) {
            sql += " AND id != ?";
            params.push(excludeUserId);
        }

        const [members] = await db.query(sql, params);

        for (const member of members) {
            try {
                await sendEmail({
                    to: member.email,
                    subject,
                    text,
                    html
                });
            } catch (error) {
                console.error(
                    "Failed to notify a community member:",
                    error.message
                );
            }
        }
    } catch (error) {
        console.error("Community notification error:", error.message);
    }
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const verifyToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    let decoded;

    try {
        decoded = jwt.verify(
            authHeader.slice(7),
            JWT_SECRET
        );
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }

    const [users] = await db.query(
        `SELECT id, username, role
         FROM users
         WHERE id = ?`,
        [decoded.userId]
    );

    if (!users.length) {
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
});

function verifyAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Administrators only."
        });
    }

    next();
}

// ============================================
// HOME AND DATABASE TEST
// ===========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/homepage.html"));
});
app.get("/api/database-test", asyncHandler(async (req, res) => {
    await db.query("SELECT 1 AS test");

    res.json({
        success: true,
        message: "Slash the Hate database is connected."
    });
}));


// ============================================
// REGISTER
// ============================================

app.post("/api/auth/register", asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (
        typeof fullName !== "string" ||
        typeof email !== "string" ||
        typeof username !== "string" ||
        typeof password !== "string" ||
        !fullName.trim() ||
        !email.trim() ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long."
        });
    }

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const [existing] = await db.query(
        `SELECT id FROM users
         WHERE email = ? OR username = ?`,
        [cleanEmail, cleanUsername]
    );

    if (existing.length) {
        return res.status(409).json({
            success: false,
            message: "Email or username already exists."
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO users
                (full_name, email, username, password, role)
             VALUES (?, ?, ?, ?, 'user')`,
            [
                cleanFullName,
                cleanEmail,
                cleanUsername,
                hashedPassword
            ]
        );

        await connection.query(
            `INSERT INTO user_progress
                (user_id, lessons_completed,
                 quizzes_completed, reports_submitted)
             VALUES (?, 0, 0, 0)`,
            [result.insertId]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            userId: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

// ============================================
// LOGIN
// ============================================

app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { login, password } = req.body;

    if (
        typeof login !== "string" ||
        typeof password !== "string" ||
        !login.trim() ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "Username/email and password are required."
        });
    }

    const cleanLogin = login.trim();

    const [users] = await db.query(
        `SELECT id, full_name, email, username, password, role
         FROM users
         WHERE email = ? OR username = ?`,
        [cleanLogin.toLowerCase(), cleanLogin]
    );

    if (!users.length) {
        return res.status(401).json({
            success: false,
            message: "Invalid username/email or password."
        });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        return res.status(401).json({
            success: false,
            message: "Invalid username/email or password."
        });
    }

    const token = jwt.sign(
        {
            userId: user.id,
            username: user.username
        },
        JWT_SECRET,
        { expiresIn: "2h" }
    );

    res.json({
        success: true,
        message: "Login successful.",
        token,
        user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            username: user.username,
            role: user.role
        }
    });
}));

// ============================================
// GET USER PROGRESS
// ============================================

app.get(
    "/api/user/progress/:userId",
    verifyToken,
    asyncHandler(async (req, res) => {
        const userId = Number(req.params.userId);

        if (
            !Number.isSafeInteger(userId) ||
            userId !== Number(req.user.userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot access another user's progress."
            });
        }

        const [rows] = await db.query(
            `SELECT lessons_completed,
                    quizzes_completed,
                    reports_submitted
             FROM user_progress
             WHERE user_id = ?`,
            [userId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Progress record not found."
            });
        }

        res.json({
            success: true,
            progress: rows[0]
        });
    })
);

// ============================================
// COMPLETE LESSON
// ============================================

app.post(
    "/api/user/progress/lesson-complete",
    verifyToken,
    asyncHandler(async (req, res) => {
        const { topic } = req.body;
        const userId = Number(req.user.userId);

        if (!ALLOWED_TOPICS.includes(topic)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson topic."
            });
        }

        const [result] = await db.query(
            `INSERT IGNORE INTO lesson_completions
                (user_id, topic)
             VALUES (?, ?)`,
            [userId, topic]
        );

        if (result.affectedRows === 0) {
            return res.json({
                success: true,
                alreadyCompleted: true,
                message: "You have already completed this lesson."
            });
        }

        await db.query(
            `UPDATE user_progress
             SET lessons_completed = (
                 SELECT COUNT(*)
                 FROM lesson_completions
                 WHERE user_id = ?
             )
             WHERE user_id = ?`,
            [userId, userId]
        );

        res.json({
            success: true,
            message: "Lesson completed successfully!"
        });
    })
);

// ============================================
// GROQ AI POST ANALYSIS
// ============================================

app.post("/api/analyze-post", asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({
            success: false,
            message: "Please enter a post to analyze."
        });
    }

    if (!groq) {
        return res.status(503).json({
            success: false,
            message: "AI analysis is not configured on the server."
        });
    }

    const response = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [
            {
                role: "system",
                content: `You are the AI safety assistant for Slash the Hate.
Analyze the meaning and context of the submitted text.
Identify cyberbullying, harassment, hate speech, threats,
discrimination, personal attacks, or encouragement of violence.
Do not automatically classify respectful disagreement as harmful.
Do not judge the author.

Return ONLY a valid JSON object with these fields:
{
  "status": "safe",
  "category": "safe",
  "severity": "low",
  "reason": "Short explanation.",
  "suggestion": "Respectful alternative if appropriate."
}

Allowed status: safe, potentially_harmful, harmful.
Allowed category: safe, cyberbullying, harassment, hate_speech,
threat, discrimination, violence, personal_attack, other.
Allowed severity: low, medium, high.
If safe, suggestion must say: Your message is already respectful.
Analyze only the submitted text.`
            },
            {
                role: "user",
                content: text.trim()
            }
        ],
        temperature: 0.2,
       response_format: {
    type: "json_schema",
    json_schema: {
        name: "slash_the_hate_analysis",
        strict: true,
        schema: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    enum: ["safe", "potentially_harmful", "harmful"]
                },
                category: {
                    type: "string",
                    enum: [
                        "safe",
                        "cyberbullying",
                        "harassment",
                        "hate_speech",
                        "threat",
                        "discrimination",
                        "violence",
                        "personal_attack",
                        "other"
                    ]
                },
                severity: {
                    type: "string",
                    enum: ["low", "medium", "high"]
                },
                reason: {
                    type: "string"
                },
                suggestion: {
                    type: "string"
                }
            },
            required: [
                "status",
                "category",
                "severity",
                "reason",
                "suggestion"
            ],
            additionalProperties: false
        }
    }
}
    });

    const aiText = response.choices?.[0]?.message?.content;

    if (!aiText) {
        throw new Error("Groq returned an empty response.");
    }

    let analysis;

    try {
        analysis = JSON.parse(aiText);
    } catch {
        throw new Error("Groq returned invalid JSON.");
    }

    const statuses = ["safe", "potentially_harmful", "harmful"];
    const categories = [
        "safe", "cyberbullying", "harassment", "hate_speech",
        "threat", "discrimination", "violence",
        "personal_attack", "other"
    ];
    const severities = ["low", "medium", "high"];

    if (
        !statuses.includes(analysis.status) ||
        !categories.includes(analysis.category) ||
        !severities.includes(analysis.severity) ||
        typeof analysis.reason !== "string" ||
        typeof analysis.suggestion !== "string"
    ) {
        throw new Error("Groq returned an unexpected analysis structure.");
    }

    res.json({
        success: true,
        analysis
    });
}));

// ============================================
// GROQ CONNECTION TEST
// ============================================

app.get("/api/groq-test", asyncHandler(async (req, res) => {
    if (!groq) {
        return res.status(503).json({
            success: false,
            message: "GROQ_API_KEY is not configured."
        });
    }

    const response = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
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
        response: response.choices?.[0]?.message?.content
    });
}));

// ============================================
// SUBMIT REPORT
// ============================================

app.post("/api/reports", verifyToken, asyncHandler(async (req, res) => {
    const { reportType, description, platform, contentUrl } = req.body;
    const userId = Number(req.user.userId);

    if (
        !ALLOWED_REPORT_TYPES.includes(reportType) ||
        typeof description !== "string" ||
        !description.trim() ||
        !ALLOWED_PLATFORMS.includes(platform)
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid report information."
        });
    }

    if (
        contentUrl !== undefined &&
        contentUrl !== null &&
        typeof contentUrl !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid content URL."
        });
    }

    const cleanUrl = contentUrl?.trim() || null;

    if (cleanUrl && !/^https?:\/\/\S+$/i.test(cleanUrl)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid HTTP or HTTPS content URL."
        });
    }

    const [result] = await db.query(
        `INSERT INTO reports
            (user_id, report_type, description, platform, content_url)
         VALUES (?, ?, ?, ?, ?)`,
        [
            userId,
            reportType,
            description.trim(),
            platform,
            cleanUrl
        ]
    );

    await db.query(
        `UPDATE user_progress
         SET reports_submitted = (
             SELECT COUNT(*) FROM reports WHERE user_id = ?
         )
         WHERE user_id = ?`,
        [userId, userId]
    );

    res.status(201).json({
        success: true,
        message: "Report submitted successfully.",
        reportId: result.insertId
    });
}));

// ============================================
// COMPLETE QUIZ
// ============================================

app.post("/api/quiz/complete", verifyToken, asyncHandler(async (req, res) => {
    const { quizTopic, score, totalQuestions } = req.body;
    const userId = Number(req.user.userId);

    if (
        !ALLOWED_QUIZ_TOPICS.includes(quizTopic) ||
        !Number.isInteger(score) ||
        !Number.isInteger(totalQuestions) ||
        totalQuestions !== 5 ||
        score < 0 ||
        score > totalQuestions
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid quiz result."
        });
    }

    const percentage = (score / totalQuestions) * 100;

    const [result] = await db.query(
        `INSERT INTO quiz_results
            (user_id, quiz_topic, score, total_questions, percentage)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, quizTopic, score, totalQuestions, percentage]
    );

    await db.query(
        `UPDATE user_progress
         SET quizzes_completed = (
             SELECT COUNT(*) FROM quiz_results WHERE user_id = ?
         )
         WHERE user_id = ?`,
        [userId, userId]
    );

    res.status(201).json({
        success: true,
        message: "Quiz result saved successfully.",
        resultId: result.insertId,
        score,
        totalQuestions,
        percentage
    });
}));

// ============================================
// ADMIN STATISTICS
// ============================================

app.get(
    "/api/admin/stats",
    verifyToken,
    verifyAdmin,
    asyncHandler(async (req, res) => {
        const [[users]] = await db.query(
            "SELECT COUNT(*) AS total FROM users"
        );

        const [[lessons]] = await db.query(
            "SELECT COUNT(*) AS total FROM lesson_completions"
        );

        const [[quizzes]] = await db.query(
            "SELECT COUNT(*) AS total FROM quiz_results"
        );

        const [[reports]] = await db.query(
            "SELECT COUNT(*) AS total FROM reports"
        );

        res.json({
            success: true,
            stats: {
                users: users.total,
                lessons: lessons.total,
                quizzes: quizzes.total,
                reports: reports.total
            }
        });
    })
);

// ============================================
// ADMIN - VIEW USERS
// ============================================

app.get(
    "/api/admin/users",
    verifyToken,
    verifyAdmin,
    asyncHandler(async (req, res) => {
        const [users] = await db.query(
            `SELECT id, full_name, email, username, role, created_at
             FROM users
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users
        });
    })
);

// ============================================
// ADMIN - VIEW REPORTS
// ============================================

app.get(
    "/api/admin/reports",
    verifyToken,
    verifyAdmin,
    asyncHandler(async (req, res) => {
        const [reports] = await db.query(
            `SELECT r.id, r.user_id, u.username,
                    r.report_type, r.description, r.platform,
                    r.content_url, r.status, r.created_at
             FROM reports r
             LEFT JOIN users u ON r.user_id = u.id
             ORDER BY r.created_at DESC`
        );

        res.json({
            success: true,
            reports
        });
    })
);

// ============================================
// ADMIN - UPDATE REPORT STATUS
// ============================================

app.patch(
    "/api/admin/reports/:id/status",
    verifyToken,
    verifyAdmin,
    asyncHandler(async (req, res) => {
        const reportId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isSafeInteger(reportId) || reportId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID."
            });
        }

        if (!ALLOWED_REPORT_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report status."
            });
        }

        const [result] = await db.query(
            "UPDATE reports SET status = ? WHERE id = ?",
            [status, reportId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Report not found."
            });
        }

        res.json({
            success: true,
            message: "Report status updated."
        });
    })
);

// ============================================
// CREATE COMMUNITY DISCUSSION
// ============================================

app.post(
    "/api/community/discussions",
    verifyToken,
    asyncHandler(async (req, res) => {
        const { title, category, content } = req.body;
        const userId = Number(req.user.userId);

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

        if (!cleanTitle || !cleanCategory || !cleanContent) {
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

        if (!ALLOWED_DISCUSSION_CATEGORIES.includes(cleanCategory)) {
            return res.status(400).json({
                success: false,
                message: "Invalid discussion category."
            });
        }

        const [result] = await db.query(
            `INSERT INTO discussions
                (user_id, title, category, content)
             VALUES (?, ?, ?, ?)`,
            [userId, cleanTitle, cleanCategory, cleanContent]
        );

        // Email problems must not undo the saved discussion.
        notifyCommunityMembers({
            excludeUserId: userId,
            subject: "New discussion started in Slash the Hate",
            text: `A new discussion has been started.

Title: ${cleanTitle}
Category: ${cleanCategory}

${cleanContent}`,
            html: `<h2>Slash the Hate</h2>
                <h3>New Discussion</h3>
                <p><strong>${escapeEmailHTML(cleanTitle)}</strong></p>
                <p>${escapeEmailHTML(cleanCategory)}</p>
                <p>${escapeEmailHTML(cleanContent).replace(/\n/g, "<br>")}</p>`
        }).catch(error => {
            console.error("Discussion notification error:", error.message);
        });

        res.status(201).json({
            success: true,
            message: "Discussion started successfully.",
            discussionId: result.insertId
        });
    })
);

// ============================================
// GET ALL PUBLISHED DISCUSSIONS
// ============================================

app.get(
    "/api/community/discussions",
    asyncHandler(async (req, res) => {
        const [discussions] = await db.query(
            `SELECT d.id, d.title, d.category, d.content,
                    d.status, d.created_at, u.username, u.full_name
             FROM discussions d
             INNER JOIN users u ON d.user_id = u.id
             WHERE d.status = 'Published'
             ORDER BY d.created_at DESC`
        );

        res.json({
            success: true,
            discussions
        });
    })
);

// ============================================
// GET ONE PUBLISHED DISCUSSION
// ============================================

app.get(
    "/api/community/discussions/:id",
    asyncHandler(async (req, res) => {
        const discussionId = Number(req.params.id);

        if (!Number.isSafeInteger(discussionId) || discussionId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid discussion ID."
            });
        }

        const [rows] = await db.query(
            `SELECT d.id, d.title, d.category, d.content,
                    d.status, d.created_at, u.username, u.full_name
             FROM discussions d
             INNER JOIN users u ON d.user_id = u.id
             WHERE d.id = ? AND d.status = 'Published'`,
            [discussionId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found."
            });
        }

        res.json({
            success: true,
            discussion: rows[0]
        });
    })
);

// ============================================
// GET DISCUSSION REPLIES
// ============================================

app.get(
    "/api/community/discussions/:id/replies",
    asyncHandler(async (req, res) => {
        const discussionId = Number(req.params.id);

        if (!Number.isSafeInteger(discussionId) || discussionId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid discussion ID."
            });
        }

        const [replies] = await db.query(
            `SELECT r.id, r.content, r.created_at,
                    u.username, u.full_name
             FROM discussion_replies r
             INNER JOIN users u ON r.user_id = u.id
             INNER JOIN discussions d ON r.discussion_id = d.id
             WHERE r.discussion_id = ?
               AND d.status = 'Published'
             ORDER BY r.created_at ASC`,
            [discussionId]
        );

        res.json({
            success: true,
            replies
        });
    })
);

// ============================================
// POST DISCUSSION REPLY
// ============================================

app.post(
    "/api/community/discussions/:id/replies",
    verifyToken,
    asyncHandler(async (req, res) => {
        const discussionId = Number(req.params.id);
        const userId = Number(req.user.userId);
        const { content } = req.body;

        if (!Number.isSafeInteger(discussionId) || discussionId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid discussion ID."
            });
        }

        if (typeof content !== "string" || content.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Reply must contain at least two characters."
            });
        }

        const [discussions] = await db.query(
            `SELECT id, title FROM discussions
             WHERE id = ? AND status = 'Published'`,
            [discussionId]
        );

        if (!discussions.length) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found."
            });
        }

        const cleanContent = content.trim();

        const [result] = await db.query(
            `INSERT INTO discussion_replies
                (discussion_id, user_id, content)
             VALUES (?, ?, ?)`,
            [discussionId, userId, cleanContent]
        );

        notifyCommunityMembers({
            excludeUserId: userId,
            subject: "New reply in Slash the Hate",
            text: `A new reply was posted in "${discussions[0].title}".\n\n${cleanContent}`,
            html: `<h2>Slash the Hate</h2>
                <p>New reply in: <strong>${escapeEmailHTML(discussions[0].title)}</strong></p>
                <p>${escapeEmailHTML(cleanContent).replace(/\n/g, "<br>")}</p>`
        }).catch(error => {
            console.error("Reply notification error:", error.message);
        });

        res.status(201).json({
            success: true,
            message: "Reply posted successfully.",
            replyId: result.insertId
        });
    })
);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// ============================================
// CENTRAL ERROR HANDLER
// ============================================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: "An unexpected server error occurred."
    });
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Slash the Hate server running at http://localhost:${PORT}`
    );
});

server.on("error", error => {
    console.error("Server startup error:", error.message);
    process.exit(1);
});

