
const express = require("express");
const crypto = require("crypto");
const { v2: cloudinary } = require("cloudinary");

const router = express.Router();

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// ============================================
// COMPETITION CONSTANTS
// ============================================

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_VIDEO_DURATION = 360; // 6 minutes
const ALLOWED_VIDEO_FORMAT = "mp4";

const COMPETITION_TITLE =
    "#SlashTheHate Digital Creativity Competition";

// ============================================
// ASYNC ERROR HANDLER
// ============================================

function asyncHandler(handler) {
    return (req, res, next) =>
        Promise.resolve(handler(req, res, next)).catch(next);
}

// ============================================
// VALIDATION HELPERS
// ============================================

function isValidId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0;
}

function isValidVideoMetadata(video) {
    return (
        video &&
        Number(video.bytes) > 0 &&
        Number(video.bytes) <= MAX_VIDEO_SIZE &&
        Number(video.duration) > 0 &&
        Number(video.duration) <= MAX_VIDEO_DURATION &&
        video.resource_type === "video" &&
        video.type === "authenticated"
    );
}

// ============================================
// COMPETITION ROUTES
// Additional routes will be added here.
// ============================================

module.exports = function createCompetitionRouter({
    db,
    verifyToken,
    verifyAdmin,
    sendEmail
}) {
    if (!db || !verifyToken || !verifyAdmin || !sendEmail) {
        throw new Error(
            "Competition router dependencies are missing."
        );

    }


    // ============================================
    // PARTICIPANT DASHBOARD
    // ============================================

    router.get(
        "/dashboard",
        verifyToken,
        asyncHandler(async (req, res) => {
            const userId = Number(req.user.userId);

            const [users] = await db.query(
                `SELECT id, full_name, username, email
                 FROM users
                 WHERE id = ?`,
                [userId]
            );

            if (!users.length) {
                return res.status(404).json({
                    success: false,
                    message: "Participant account not found."
                });
            }

            const [competitions] = await db.query(
                `SELECT id, title, theme, brief, instructions,
                        status, results_published,
                        results_published_at
                 FROM competitions_v2
                 ORDER BY id DESC
                 LIMIT 1`
            );

            if (!competitions.length) {
                return res.json({
                    success: true,
                    participant: users[0],
                    competition: null,
                    submissions: []
                });
            }

            const competition = competitions[0];

            const [submissions] = await db.query(
                `SELECT id, video_title, description,
                        submitted_at, status
                 FROM competition_submissions_v2
                 WHERE user_id = ?
                   AND competition_id = ?
                 ORDER BY submitted_at DESC`,
                [userId, competition.id]
            );

            let results = [];

            if (Number(competition.results_published) === 1) {
                for (const submission of submissions) {
                    const [scores] = await db.query(
                        `SELECT c.criterion_name,
                                c.maximum_score,
                                s.score
                         FROM competition_scores_v2 s
                         INNER JOIN competition_criteria_v2 c
                            ON c.id = s.criterion_id
                         WHERE s.submission_id = ?`,
                        [submission.id]
                    );

                    const [feedback] = await db.query(
                        `SELECT feedback, created_at
                         FROM competition_feedback_v2
                         WHERE submission_id = ?
                         ORDER BY created_at DESC`,
                        [submission.id]
                    );

                    const [winners] = await db.query(
                        `SELECT position, award_title, published_at
                         FROM competition_winners_v2
                         WHERE submission_id = ?
                           AND competition_id = ?
                           AND published_at IS NOT NULL`,
                        [submission.id, competition.id]
                    );

                    results.push({
                        submissionId: submission.id,
                        scores,
                        feedback,
                        awards: winners
                    });
                }
            }

            res.json({
                success: true,
                participant: users[0],
                competition,
                submissions,
                results
            });
        })
    );



    // ============================================
    // ADMINISTRATOR DASHBOARD
    // ============================================

    router.get(
        "/admin/dashboard",
        verifyToken,
        verifyAdmin,
        asyncHandler(async (req, res) => {

            // Get the latest competition
            const [competitions] = await db.query(
                `SELECT id, title, theme, brief, instructions,
                        status, results_published,
                        results_published_at
                 FROM competitions_v2
                 ORDER BY id DESC
                 LIMIT 1`
            );

            // Count registered participants
            const [participantCounts] = await db.query(
                `SELECT COUNT(*) AS total_participants
                 FROM users
                 WHERE role = 'user'`
            );

            // No competition has been created yet
            if (!competitions.length) {
                return res.json({
                    success: true,
                    competition: null,
                    statistics: {
                        totalParticipants:
                            participantCounts[0].total_participants,
                        totalSubmissions: 0,
                        pendingReviews: 0,
                        completedReviews: 0
                    },
                    submissions: []
                });
            }

            const competition = competitions[0];

            // Get submission and review statistics
            const [submissionCounts] = await db.query(
                `SELECT
                    COUNT(*) AS total_submissions,
                    SUM(
                        CASE WHEN review_status = 'pending'
                        THEN 1 ELSE 0 END
                    ) AS pending_reviews,
                    SUM(
                        CASE WHEN review_status = 'completed'
                        THEN 1 ELSE 0 END
                    ) AS completed_reviews
                 FROM competition_submissions_v2
                 WHERE competition_id = ?`,
                [competition.id]
            );

            // Get submissions and participant details
            const [submissions] = await db.query(
                `SELECT
                    s.id,
                    s.video_title,
                    s.description,
                    s.video_format,
                    s.file_size_bytes,
                    s.duration_seconds,
                    s.submitted_at,
                    s.review_status,
                    u.id AS participant_id,
                    u.full_name,
                    u.username,
                    u.email
                 FROM competition_submissions_v2 s
                 INNER JOIN users u
                    ON u.id = s.user_id
                 WHERE s.competition_id = ?
                 ORDER BY s.submitted_at DESC`,
                [competition.id]
            );

            res.json({
                success: true,

                competition,

                statistics: {
                    totalParticipants:
                        participantCounts[0].total_participants,

                    totalSubmissions:
                        Number(submissionCounts[0].total_submissions),

                    pendingReviews:
                        Number(submissionCounts[0].pending_reviews || 0),

                    completedReviews:
                        Number(submissionCounts[0].completed_reviews || 0)
                },

                submissions
            });

        })
    );


    // ============================================
    // GET PRIVATE VIDEO FOR ADMIN REVIEW
    // ADMINISTRATORS ONLY
    // ============================================

    router.get(
        "/admin/submissions/:id/video",
        verifyToken,
        verifyAdmin,
        asyncHandler(async (req, res) => {

            const submissionId = req.params.id;

            if (!isValidId(submissionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid submission ID."
                });
            }

            const [submissions] = await db.query(
                `SELECT cloudinary_public_id, video_format
                 FROM competition_submissions_v2
                 WHERE id = ?
                 LIMIT 1`,
                [Number(submissionId)]
            );

            if (!submissions.length) {
                return res.status(404).json({
                    success: false,
                    message: "Video submission not found."
                });
            }

            const submission = submissions[0];

            const expiresAt = Math.floor(Date.now() / 1000) + 300;

            const videoUrl = cloudinary.utils.private_download_url(
                submission.cloudinary_public_id,
                submission.video_format,
                {
                    resource_type: "video",
type: "authenticated",
expires_at: expiresAt,
attachment: false
                }
            );

            res.json({
                success: true,
                videoUrl,
                expiresAt
            });

        })
    );

    // ============================================
    // ADD A COMPETITION PRIZE
    // ADMINISTRATORS ONLY
    // ============================================

    router.post(
        "/admin/competitions/:id/prizes",
        verifyToken,
        verifyAdmin,
        asyncHandler(async (req, res) => {

            const competitionId = req.params.id;

            const {
                prizeTitle,
                prizeDescription,
                prizeValue
            } = req.body;

            if (!isValidId(competitionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid competition ID."
                });
            }

            if (
                typeof prizeTitle !== "string" ||
                !prizeTitle.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Prize title is required."
                });
            }

            if (
                prizeTitle.trim().length > 255 ||
                (prizeDescription !== undefined &&
                    (typeof prizeDescription !== "string" ||
                     prizeDescription.length > 5000)) ||
                (prizeValue !== undefined &&
                    (typeof prizeValue !== "string" ||
                     prizeValue.length > 150))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "One or more prize fields are invalid."
                });
            }

            const [competitions] = await db.query(
                `SELECT id, results_published
                 FROM competitions_v2
                 WHERE id = ?`,
                [Number(competitionId)]
            );

            if (!competitions.length) {
                return res.status(404).json({
                    success: false,
                    message: "Competition not found."
                });
            }

            if (Number(competitions[0].results_published) === 1) {
                return res.status(409).json({
                    success: false,
                    message: "Prizes cannot be changed after results are published."
                });
            }

            const [result] = await db.query(
                `INSERT INTO competition_prizes_v2
                    (competition_id, prize_title,
                     prize_description, prize_value)
                 VALUES (?, ?, ?, ?)`,
                [
                    Number(competitionId),
                    prizeTitle.trim(),
                    prizeDescription?.trim() || null,
                    prizeValue?.trim() || null
                ]
            );

            res.status(201).json({
                success: true,
                message: "Competition prize added successfully.",
                prize: {
                    id: result.insertId,
                    competitionId: Number(competitionId),
                    prizeTitle: prizeTitle.trim(),
                    prizeDescription: prizeDescription?.trim() || null,
                    prizeValue: prizeValue?.trim() || null
                }
            });

        })
    );


    // ============================================
    // CREATE A NEW COMPETITION
    // ADMINISTRATORS ONLY
    // ============================================

    router.post(
        "/admin/competitions",
        verifyToken,
        verifyAdmin,
        asyncHandler(async (req, res) => {

            const { theme, brief, instructions } = req.body;

            // Validate required information
            if (
                typeof theme !== "string" ||
                typeof brief !== "string" ||
                typeof instructions !== "string" ||
                !theme.trim() ||
                !brief.trim() ||
                !instructions.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Theme, creative brief and instructions are required."
                });
            }

            if (
                theme.trim().length > 255 ||
                brief.trim().length > 10000 ||
                instructions.trim().length > 10000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "One or more fields exceed the allowed length."
                });
            }

            // Prevent duplicate active competitions
            const [existingCompetitions] = await db.query(
                `SELECT id, title, status
                 FROM competitions_v2
                 WHERE status IN ('draft', 'open')
                 ORDER BY id DESC
                 LIMIT 1`
            );

            if (existingCompetitions.length) {
                return res.status(409).json({
                    success: false,
                    message:
                        "An active competition already exists. Close it before creating another.",
                    existingCompetition: existingCompetitions[0]
                });
            }

            // Create the competition as a draft
            const [result] = await db.query(
                `INSERT INTO competitions_v2
                    (title, theme, brief, instructions,
                     status, created_by)
                 VALUES (?, ?, ?, ?, 'draft', ?)`,
                [
                    COMPETITION_TITLE,
                    theme.trim(),
                    brief.trim(),
                    instructions.trim(),
                    req.user.userId
                ]
            );

            res.status(201).json({
                success: true,
                message: "Competition created successfully.",
                competition: {
                    id: result.insertId,
                    title: COMPETITION_TITLE,
                    theme: theme.trim(),
                    brief: brief.trim(),
                    instructions: instructions.trim(),
                    status: "draft"
                }
            });

        })
    );


    // ============================================
    // OPEN, CLOSE OR REOPEN A COMPETITION
    // ADMINISTRATORS ONLY
    // ============================================

    router.patch(
        "/admin/competitions/:id/status",
        verifyToken,
        verifyAdmin,
        asyncHandler(async (req, res) => {

            const competitionId = req.params.id;
            const { status } = req.body;

            if (!isValidId(competitionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid competition ID."
                });
            }

            if (!["open", "closed"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be open or closed."
                });
            }

            const [competitions] = await db.query(
                `SELECT id, title, status, results_published
                 FROM competitions_v2
                 WHERE id = ?`,
                [Number(competitionId)]
            );

            if (!competitions.length) {
                return res.status(404).json({
                    success: false,
                    message: "Competition not found."
                });
            }

            const competition = competitions[0];

            if (
                Number(competition.results_published) === 1 &&
                status === "open"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "A competition cannot be reopened after results have been published."
                });
            }

            // Only one draft or open competition at a time
            if (status === "open") {
                const [otherActive] = await db.query(
                    `SELECT id, title
                     FROM competitions_v2
                     WHERE status IN ('draft', 'open')
                       AND id != ?
                     LIMIT 1`,
                    [Number(competitionId)]
                );

                if (otherActive.length) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Another active competition already exists.",
                        existingCompetition: otherActive[0]
                    });
                }
            }

            await db.query(
                `UPDATE competitions_v2
                 SET status = ?
                 WHERE id = ?`,
                [status, Number(competitionId)]
            );

            res.json({
                success: true,
                message:
                    status === "open"
                        ? "Competition opened successfully. Submissions are now allowed."
                        : "Competition closed successfully. Submissions are now disabled.",
                competition: {
                    id: competition.id,
                    title: competition.title,
                    status
                }
            });

        })
    );



    // ============================================
    // ADD CUSTOM JUDGING CRITERION
    // ADMINISTRATORS ONLY
    // ============================================

    router.post(
        "/admin/competitions/:id/criteria",
        verifyToken,
        verifyAdmin,
        asyncHandler(async (req, res) => {

            const competitionId = req.params.id;

            const {
                criterionName,
                description,
                maximumScore
            } = req.body;

            if (!isValidId(competitionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid competition ID."
                });
            }

            if (
                typeof criterionName !== "string" ||
                !criterionName.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Criterion name is required."
                });
            }

            if (
                criterionName.trim().length > 150 ||
                (description !== undefined &&
                    (typeof description !== "string" ||
                     description.length > 2000))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Criterion details are too long."
                });
            }

            const score = Number(maximumScore);

            if (
                !Number.isFinite(score) ||
                score <= 0 ||
                score > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum score must be greater than 0 and no more than 1000."
                });
            }

            const [competitions] = await db.query(
                `SELECT id, results_published
                 FROM competitions_v2
                 WHERE id = ?`,
                [Number(competitionId)]
            );

            if (!competitions.length) {
                return res.status(404).json({
                    success: false,
                    message: "Competition not found."
                });
            }

            if (
                Number(competitions[0].results_published) === 1
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Judging criteria cannot be changed after results are published."
                });
            }

            const [existingScores] = await db.query(
                `SELECT COUNT(*) AS total
                 FROM competition_scores_v2 s
                 INNER JOIN competition_submissions_v2 sub
                    ON sub.id = s.submission_id
                 WHERE sub.competition_id = ?`,
                [Number(competitionId)]
            );

            if (Number(existingScores[0].total) > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Criteria cannot be added after judging has started."
                });
            }

            const [position] = await db.query(
                `SELECT COALESCE(MAX(display_order), 0) + 1
                    AS next_order
                 FROM competition_criteria_v2
                 WHERE competition_id = ?`,
                [Number(competitionId)]
            );

            const [result] = await db.query(
                `INSERT INTO competition_criteria_v2
                    (competition_id, criterion_name,
                     description, maximum_score, display_order)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    Number(competitionId),
                    criterionName.trim(),
                    description ? description.trim() : null,
                    score,
                    position[0].next_order
                ]
            );

            res.status(201).json({
                success: true,
                message: "Judging criterion added successfully.",
                criterion: {
                    id: result.insertId,
                    competitionId: Number(competitionId),
                    criterionName: criterionName.trim(),
                    description: description || null,
                    maximumScore: score
                }
            });

        })
    );


    // ============================================
    // VIEW COMPETITION JUDGING CRITERIA
    // ADMINISTRATORS ONLY
    // ============================================

    router.get(
        "/admin/competitions/:id/criteria",
        verifyToken,
        verifyAdmin,
        asyncHandler(async (req, res) => {

            const competitionId = req.params.id;

            if (!isValidId(competitionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid competition ID."
                });
            }

            const [competitions] = await db.query(
                `SELECT id, title
                 FROM competitions_v2
                 WHERE id = ?`,
                [Number(competitionId)]
            );

            if (!competitions.length) {
                return res.status(404).json({
                    success: false,
                    message: "Competition not found."
                });
            }

            const [criteria] = await db.query(
                `SELECT id, criterion_name, description,
                        maximum_score, display_order, created_at
                 FROM competition_criteria_v2
                 WHERE competition_id = ?
                 ORDER BY display_order ASC`,
                [Number(competitionId)]
            );

            res.json({
                success: true,
                competition: competitions[0],
                totalCriteria: criteria.length,
                criteria
            });

        })
    );


    // ============================================
    // VIEW COMPETITION PRIZES
    // ADMINISTRATORS ONLY
    // ============================================

    router.get(
        "/admin/competitions/:id/prizes",
        verifyToken,
        verifyAdmin,
        asyncHandler(async (req, res) => {

            const competitionId = req.params.id;

            if (!isValidId(competitionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid competition ID."
                });
            }

            const [competitions] = await db.query(
                `SELECT id, title
                 FROM competitions_v2
                 WHERE id = ?`,
                [Number(competitionId)]
            );

            if (!competitions.length) {
                return res.status(404).json({
                    success: false,
                    message: "Competition not found."
                });
            }

            const [prizes] = await db.query(
                `SELECT id, prize_title, prize_description,
                        prize_value, created_at
                 FROM competition_prizes_v2
                 WHERE competition_id = ?
                 ORDER BY id ASC`,
                [Number(competitionId)]
            );

            res.json({
                success: true,
                competition: competitions[0],
                totalPrizes: prizes.length,
                prizes
            });

        })
    );




    // ============================================
    // GENERATE SECURE VIDEO UPLOAD PERMISSION
    // LOGGED-IN PARTICIPANTS
    // ============================================

    router.post(
        "/upload-intent",
        verifyToken,
        asyncHandler(async (req, res) => {

            const userId = Number(req.user.userId);

            // Find the latest competition
            const [competitions] = await db.query(
                `SELECT id, status, results_published
                 FROM competitions_v2
                 ORDER BY id DESC
                 LIMIT 1`
            );

            if (!competitions.length) {
                return res.status(404).json({
                    success: false,
                    message: "No competition is available."
                });
            }

            const competition = competitions[0];

            if (
                competition.status !== "open" ||
                Number(competition.results_published) === 1
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Video submissions are currently closed."
                });
            }

            if (
                !process.env.CLOUDINARY_CLOUD_NAME ||
                !process.env.CLOUDINARY_API_KEY ||
                !process.env.CLOUDINARY_API_SECRET
            ) {
                return res.status(500).json({
                    success: false,
                    message: "Video storage is not configured."
                });
            }

            // Generate a unique private video identifier
            const publicId =
                `slash-the-hate/competition/${competition.id}/${crypto.randomUUID()}`;

            const timestamp = Math.floor(Date.now() / 1000);

            // Cloudinary upload parameters
            const uploadParams = {
                public_id: publicId,
                timestamp,
                type: "authenticated"
            };

            // Sign the upload parameters on the server
            const signature =
                cloudinary.utils.api_sign_request(
                    uploadParams,
                    process.env.CLOUDINARY_API_SECRET
                );

            // Create a one-time upload permission
            await db.query(
                `INSERT INTO competition_upload_intents_v2
                    (user_id, competition_id,
                     cloudinary_public_id, expires_at)
                 VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
                [
                    userId,
                    competition.id,
                    publicId
                ]
            );

            res.json({
                success: true,
                message: "Secure video upload permission generated.",
                upload: {
                    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                    apiKey: process.env.CLOUDINARY_API_KEY,
                    timestamp,
                    signature,

                    publicId,
                    type: "authenticated",
                    resourceType: "video",
                    expiresInMinutes: 15
                }
            });

        })
    );



    // ============================================
    // VERIFY VIDEO AND SAVE PARTICIPANT SUBMISSION
    // ============================================

    router.post(
        "/submit",
        verifyToken,
        asyncHandler(async (req, res) => {

            const userId = Number(req.user.userId);

            const {
                publicId,
                videoTitle,
                description
            } = req.body;

            if (
                typeof publicId !== "string" ||
                !publicId.trim() ||
                typeof videoTitle !== "string" ||
                !videoTitle.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Video title and upload reference are required."
                });
            }

            if (
                videoTitle.trim().length > 255 ||
                (description !== undefined &&
                    (typeof description !== "string" ||
                     description.length > 5000))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Video details are too long."
                });
            }

            // Find the participant's unused upload permission
            const [intents] = await db.query(
                `SELECT id, competition_id, cloudinary_public_id
                 FROM competition_upload_intents_v2
                 WHERE user_id = ?
                   AND cloudinary_public_id = ?
                   AND expires_at > NOW()
                   AND used_at IS NULL
                 LIMIT 1`,
                [userId, publicId.trim()]
            );

            if (!intents.length) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Upload permission is invalid, expired or already used."
                });
            }

            const intent = intents[0];

            // Confirm that submissions are still open
            const [competitions] = await db.query(
                `SELECT id, title, status, results_published
                 FROM competitions_v2
                 WHERE id = ?`,
                [intent.competition_id]
            );

            if (
                !competitions.length ||
                competitions[0].status !== "open" ||
                Number(competitions[0].results_published) === 1
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Competition submissions are closed."
                });
            }

            // Retrieve actual video metadata from Cloudinary
            let video;

            try {
               
                 video = await cloudinary.api.resource(
    intent.cloudinary_public_id,
    {
        resource_type: "video",
        type: "authenticated",
        media_metadata: true 
        
    }
);

            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The uploaded video could not be verified. Please upload it again."
                });
            }

 


            // Enforce file format, size and duration
            if (!isValidVideoMetadata(video)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Video must be MP4, no larger than 100 MB and no longer than 6 minutes."
                });
            }

            // Save submission and consume permission atomically
            const connection = await db.getConnection();

            let submissionId;

            try {
                await connection.beginTransaction();

                const [lockedIntents] = await connection.query(
                    `SELECT id
                     FROM competition_upload_intents_v2
                     WHERE id = ?
                       AND user_id = ?
                       AND used_at IS NULL
                       AND expires_at > NOW()
                     FOR UPDATE`,
                    [intent.id, userId]
                );

                if (!lockedIntents.length) {
                    await connection.rollback();

                    return res.status(409).json({
                        success: false,
                        message:
                            "This upload permission has already been used."
                    });
                }

                const [result] = await connection.query(
                    `INSERT INTO competition_submissions_v2
                        (competition_id, user_id, video_title,
                         description, cloudinary_public_id,
                         cloudinary_asset_id, video_format,
                         file_size_bytes, duration_seconds)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        intent.competition_id,
                        userId,
                        videoTitle.trim(),
                        description ? description.trim() : null,
                        video.public_id,
                        video.asset_id || null,
                        video.format,
                        video.bytes,
                        video.duration
                    ]
                );

                submissionId = result.insertId;

                await connection.query(
                    `UPDATE competition_upload_intents_v2
                     SET used_at = NOW()
                     WHERE id = ?`,
                    [intent.id]
                );

                await connection.commit();

            } catch (error) {
                await connection.rollback();
                throw error;

            } finally {
                connection.release();
            }

            // Send confirmation email without undoing the submission
            const [participants] = await db.query(
                `SELECT full_name, email
                 FROM users
                 WHERE id = ?`,
                [userId]
            );

            let emailSent = false;

            if (participants.length) {
                const participant = participants[0];
                const submittedAt = new Date().toLocaleString(
                    "en-KE",
                    { timeZone: "Africa/Nairobi" }
                );

                try {
                    const emailResult = await sendEmail({
                        to: participant.email,
                        subject: "Your Slash the Hate video submission",
                        text:
                            `Hello ${participant.full_name},\n\n` +
                            `We have received your video submission.\n\n` +
                            `Video title: ${videoTitle.trim()}\n` +
                            `Submission date: ${submittedAt}\n\n` +
                            `Please remember that submitted videos cannot be replaced or withdrawn.\n\n` +
                            `Thank you for participating in the #SlashTheHate Digital Creativity Competition.`
                    });

                    emailSent = Boolean(emailResult?.success);

                } catch (error) {
                    console.error(
                        "Submission confirmation email failed:",
                        error.message
                    );
                }
            }

            return res.status(201).json({
                success: true,
                message: "Your video has been submitted successfully.",
                submission: {
                    id: submissionId,
                    videoTitle: videoTitle.trim(),
                    status: "submitted"
                },
                confirmationEmailSent: emailSent
            });

        })
    );

    // ============================================
    // COMPETITION API CONNECTION TEST
    // ============================================

    router.get("/", async (req, res) => {
        try {
            await db.query("SELECT 1");

            res.json({
                success: true,
                message: "Competition API is active.",
                competition: COMPETITION_TITLE
            });
        } catch (error) {
            console.error("Competition API error:", error.message);

            res.status(500).json({
                success: false,
                message: "Competition database connection failed."
            });
        }
    });
    return router;
};


