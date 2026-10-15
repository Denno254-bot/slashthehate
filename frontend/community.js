// ========================================
// SLASH THE HATE
// COMMUNITY DISCUSSION SYSTEM
// ========================================


// ========================================
// GET ELEMENTS
// ========================================

const openDiscussion =
    document.getElementById("openDiscussion");

const closeDiscussion =
    document.getElementById("closeDiscussion");

const discussionModal =
    document.getElementById("discussionModal");

const discussionForm =
    document.getElementById("discussionForm");

const discussionTitle =
    document.getElementById("discussionTitle");

const discussionCategory =
    document.getElementById("discussionCategory");

const discussionText =
    document.getElementById("discussionText");


// ========================================
// LOCAL STORAGE
// ========================================

const token =
    localStorage.getItem("slashTheHateToken");

const storedUser =
    localStorage.getItem("slashTheHateUser");


// ========================================
// OPEN NEW DISCUSSION MODAL
// ========================================

if (openDiscussion) {

    openDiscussion.addEventListener(
        "click",
        function () {

            if (!token || !storedUser) {

                alert(
                    "Please login to start a discussion."
                );

                window.location.href =
                    "login.html";

                return;
            }

            discussionModal.classList.add(
                "active"
            );
        }
    );
}


// ========================================
// CLOSE NEW DISCUSSION MODAL
// ========================================

if (closeDiscussion) {

    closeDiscussion.addEventListener(
        "click",
        function () {

            discussionModal.classList.remove(
                "active"
            );

        }
    );
}


// ========================================
// CLOSE NEW DISCUSSION MODAL
// WHEN CLICKING OUTSIDE
// ========================================

if (discussionModal) {

    discussionModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                discussionModal
            ) {

                discussionModal.classList.remove(
                    "active"
                );

            }

        }
    );
}


// ========================================
// SUBMIT NEW DISCUSSION
// ========================================

if (discussionForm) {

    discussionForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ========================================
            // CHECK LOGIN
            // ========================================

            const currentToken =
                localStorage.getItem(
                    "slashTheHateToken"
                );


            if (!currentToken) {

                alert(
                    "Your login session has expired. Please login again."
                );

                window.location.href =
                    "login.html";

                return;
            }


            // ========================================
            // GET FORM VALUES
            // ========================================

            const title =
                discussionTitle.value.trim();

            const category =
                discussionCategory.value;

            const content =
                discussionText.value.trim();


            // ========================================
            // VALIDATE
            // ========================================

            if (
                !title ||
                !category ||
                !content
            ) {

                alert(
                    "Please complete all discussion fields."
                );

                return;
            }


            // ========================================
            // SUBMIT BUTTON
            // ========================================

            const submitButton =
                discussionForm.querySelector(
                    ".discussion-submit"
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Publishing...";

            }


            try {

                // ========================================
                // SEND TO SERVER
                // ========================================

                const response =
                    await fetch(
                        "http://localhost:3000/api/community/discussions",
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    currentToken

                            },

                            body: JSON.stringify({

                                title:
                                    title,

                                category:
                                    category,

                                content:
                                    content

                            })

                        }
                    );


                const data =
                    await response.json();


                // ========================================
                // HANDLE ERROR
                // ========================================

                if (!response.ok) {

                    console.error(
                        "Discussion error:",
                        data
                    );

                    alert(
                        data.message ||
                        "Unable to publish discussion."
                    );

                    return;
                }


                // ========================================
                // SUCCESS
                // ========================================

                alert(
                    "Discussion published successfully!"
                );


                discussionForm.reset();


                discussionModal.classList.remove(
                    "active"
                );


                // Reload discussions
                loadDiscussions();


            } catch (error) {

                console.error(
                    "Discussion submission error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Publish Discussion →";

                }

            }

        }
    );
}


// ========================================
// LOAD ALL DISCUSSIONS
// ========================================

async function loadDiscussions() {

    const discussionsList =
        document.getElementById(
            "discussionsList"
        );


    if (!discussionsList) {

        console.error(
            "discussionsList element was not found."
        );

        return;
    }


    try {

        discussionsList.innerHTML = `
            <p class="loading-discussions">
                Loading discussions...
            </p>
        `;


        // ========================================
        // GET DISCUSSIONS
        // ========================================

        const response =
            await fetch(
                "http://localhost:3000/api/community/discussions"
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Could not load discussions:",
                data
            );

            discussionsList.innerHTML = `
                <p class="discussion-error">
                    Unable to load discussions.
                </p>
            `;

            return;
        }


        // ========================================
        // NO DISCUSSIONS
        // ========================================

        if (
            !data.discussions ||
            data.discussions.length === 0
        ) {

            discussionsList.innerHTML = `

                <div class="no-discussions">

                    <h3>
                        No discussions yet
                    </h3>

                    <p>
                        Be the first member to
                        start a discussion.
                    </p>

                </div>

            `;

            return;
        }


        // ========================================
        // CLEAR LIST
        // ========================================

        discussionsList.innerHTML = "";


        // ========================================
        // CREATE DISCUSSION CARDS
        // ========================================

        data.discussions.forEach(
            function (discussion) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "discussion-card";


                card.innerHTML = `

                    <div class="discussion-card-header">

                        <span class="discussion-category">

                            ${escapeHTML(
                                discussion.category
                            )}

                        </span>


                        <span class="discussion-date">

                            ${formatDiscussionDate(
                                discussion.created_at
                            )}

                        </span>

                    </div>


                    <h3 class="discussion-title">

                        ${escapeHTML(
                            discussion.title
                        )}

                    </h3>


                    <p class="discussion-content">

                        ${escapeHTML(
                            discussion.content
                        )}

                    </p>


                    <div class="discussion-card-footer">

                        <div class="discussion-author">

                            Started by

                            <strong>
                                @${escapeHTML(
                                    discussion.username
                                )}
                            </strong>

                        </div>


                        <button
                            type="button"
                            class="view-discussion-button"
                            data-id="${discussion.id}"
                        >

                            View Discussion →

                        </button>

                    </div>

                `;


                discussionsList.appendChild(
                    card
                );

            }
        );


        // ========================================
        // VIEW DISCUSSION BUTTONS
        // ========================================

        const viewButtons =
            document.querySelectorAll(
                ".view-discussion-button"
            );


        viewButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const discussionId =
                            this.dataset.id;


                        openSingleDiscussion(
                            discussionId
                        );

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            "Discussion loading error:",
            error
        );


        discussionsList.innerHTML = `

            <p class="discussion-error">
                Unable to connect to the server.
            </p>

        `;

    }

}


// ========================================
// OPEN ONE DISCUSSION
// ========================================

async function openSingleDiscussion(
    discussionId
) {

    const modal =
        document.getElementById(
            "viewDiscussionModal"
        );


    const discussionContainer =
        document.getElementById(
            "singleDiscussion"
        );


    const repliesContainer =
        document.getElementById(
            "discussionReplies"
        );


    // ========================================
    // CHECK ELEMENTS
    // ========================================

    if (!modal) {

        console.error(
            "viewDiscussionModal not found."
        );

        return;
    }


    if (!discussionContainer) {

        console.error(
            "singleDiscussion not found."
        );

        return;
    }


    if (!repliesContainer) {

        console.error(
            "discussionReplies not found."
        );

        return;
    }


    try {

        // ========================================
        // OPEN MODAL
        // ========================================

        modal.classList.add(
            "active"
        );


        // ========================================
        // LOADING
        // ========================================

        discussionContainer.innerHTML = `

            <p>
                Loading discussion...
            </p>

        `;


        repliesContainer.innerHTML = `

            <p>
                Loading replies...
            </p>

        `;


        // ========================================
        // GET SPECIFIC DISCUSSION
        // ========================================


        const discussionResponse =
    await fetch(
        `http://localhost:3000/api/community/discussions/${discussionId}`
    );

const responseText =
    await discussionResponse.text();

let discussionData;

try {

    discussionData =
        JSON.parse(responseText);

} catch (error) {

    console.error(
        "Server returned non-JSON response:",
        responseText
    );

    throw new Error(
        "The server returned an invalid response."
    );
}

        if (!discussionResponse.ok) {

            throw new Error(
                discussionData.message ||
                "Unable to load discussion."
            );

        }


        const discussion =
            discussionData.discussion;


        // ========================================
        // DISPLAY ORIGINAL DISCUSSION
        // ========================================

        discussionContainer.innerHTML = `

            <div class="single-discussion-category">

                ${escapeHTML(
                    discussion.category
                )}

            </div>


            <h2 class="single-discussion-title">

                ${escapeHTML(
                    discussion.title
                )}

            </h2>


            <div class="single-discussion-author">

                Started by

                <strong>
                    @${escapeHTML(
                        discussion.username
                    )}
                </strong>

                <span>
                    •
                    ${formatDiscussionDate(
                        discussion.created_at
                    )}
                </span>

            </div>


            <div class="single-discussion-content">

                ${escapeHTML(
                    discussion.content
                )}

            </div>

        `;


        // ========================================
        // GET REPLIES
        // ========================================

        const repliesResponse =
            await fetch(
                `http://localhost:3000/api/community/discussions/${discussionId}/replies`
            );


        const repliesData =
            await repliesResponse.json();


        if (!repliesResponse.ok) {

            throw new Error(
                repliesData.message ||
                "Unable to load replies."
            );

        }


        // ========================================
        // DISPLAY REPLIES
        // ========================================

        if (
            !repliesData.replies ||
            repliesData.replies.length === 0
        ) {

            repliesContainer.innerHTML = `

                <div class="no-replies">

                    <p>
                        No replies yet.
                    </p>

                    <span>
                        Be the first person to
                        join this conversation.
                    </span>

                </div>

            `;

        } else {

            repliesContainer.innerHTML =
                "";


            repliesData.replies.forEach(
                function (reply) {

                    const replyElement =
                        document.createElement(
                            "div"
                        );


                    replyElement.className =
                        "discussion-reply";


                    replyElement.innerHTML = `

                        <div class="reply-header">

                            <strong>

                                @${escapeHTML(
                                    reply.username
                                )}

                            </strong>


                            <span>

                                ${formatDiscussionDate(
                                    reply.created_at
                                )}

                            </span>

                        </div>


                        <p class="reply-content">

                            ${escapeHTML(
                                reply.content
                            )}

                        </p>

                    `;


                    repliesContainer.appendChild(
                        replyElement
                    );

                }
            );

        }


        // ========================================
        // SAVE DISCUSSION ID
        // FOR REPLY FORM
        // ========================================

        const replyForm =
            document.getElementById(
                "replyForm"
            );


        if (replyForm) {

            replyForm.dataset.discussionId =
                discussionId;

        }


    } catch (error) {

        console.error(
            "Discussion opening error:",
            error
        );


        discussionContainer.innerHTML = `

            <div class="discussion-error">

                <h3>
                    Unable to open discussion
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


// ========================================
// POST REPLY
// ========================================

const replyForm =
    document.getElementById(
        "replyForm"
    );


if (replyForm) {

    replyForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ========================================
            // CHECK LOGIN
            // ========================================

            const currentToken =
                localStorage.getItem(
                    "slashTheHateToken"
                );


            if (!currentToken) {

                alert(
                    "Please login to reply to a discussion."
                );

                window.location.href =
                    "login.html";

                return;
            }


            // ========================================
            // GET DISCUSSION ID
            // ========================================

            const discussionId =
                replyForm.dataset.discussionId;


            if (!discussionId) {

                alert(
                    "Discussion could not be identified."
                );

                return;
            }


            // ========================================
            // GET REPLY TEXT
            // ========================================

            const replyTextElement =
                document.getElementById(
                    "replyText"
                );


            const replyText =
                replyTextElement.value.trim();


            if (!replyText) {

                alert(
                    "Please write a reply."
                );

                return;
            }


            // ========================================
            // BUTTON
            // ========================================

            const submitButton =
                document.getElementById(
                    "replySubmit"
                );


            submitButton.disabled =
                true;

            submitButton.textContent =
                "Posting...";


            try {

                // ========================================
                // SEND REPLY
                // ========================================

                const response =
                    await fetch(
                        `http://localhost:3000/api/community/discussions/${discussionId}/replies`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    currentToken

                            },

                            body: JSON.stringify({

                                content:
                                    replyText

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to post reply."
                    );

                    return;
                }


                // ========================================
                // CLEAR REPLY
                // ========================================

                replyTextElement.value =
                    "";


                // ========================================
                // RELOAD DISCUSSION
                // ========================================

                await openSingleDiscussion(
                    discussionId
                );


            } catch (error) {

                console.error(
                    "Reply error:",
                    error
                );


                alert(
                    "Unable to connect to the server."
                );


            } finally {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Post Reply →";

            }

        }
    );
}


// ========================================
// CLOSE DISCUSSION VIEW
// ========================================

const closeViewDiscussion =
    document.getElementById(
        "closeViewDiscussion"
    );


const viewDiscussionModal =
    document.getElementById(
        "viewDiscussionModal"
    );


if (closeViewDiscussion) {

    closeViewDiscussion.addEventListener(
        "click",
        function () {

            viewDiscussionModal.classList.remove(
                "active"
            );

        }
    );
}


// ========================================
// CLOSE DISCUSSION VIEW
// WHEN CLICKING OUTSIDE
// ========================================

if (viewDiscussionModal) {

    viewDiscussionModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                viewDiscussionModal
            ) {

                viewDiscussionModal.classList.remove(
                    "active"
                );

            }

        }
    );
}


// ========================================
// ESCAPE HTML
// SECURITY
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;
}


// ========================================
// FORMAT DISCUSSION DATE
// ========================================

function formatDiscussionDate(
    date
) {

    const discussionDate =
        new Date(date);


    return discussionDate.toLocaleDateString(
        "en-KE",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


// ========================================
// START COMMUNITY SYSTEM
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDiscussions();

    }
);