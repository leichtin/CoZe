/* ── Configuration ──────────────────────────────────────── */

const CONFIG = {
    EXAM_DURATION_SEC: 45 * 60,
    MAX_ERROR_POINTS: 10,
    TIMER_WARNING_SEC: 300,
    DEFAULT_LANG: "de",
    SUPPORTED_LANGS: ["de", "en"],
};

/* ── State ──────────────────────────────────────────────── */
/** userAnswers maps question index → selected answer index (number) */

let questions = [];
let currentIndex = 0;
let userAnswers = {};
let starredQuestions = {};
let timeLeft = CONFIG.EXAM_DURATION_SEC;
let timerInterval = null;
let reviewMode = false;

let currentLang = CONFIG.DEFAULT_LANG;
let currentLocaleData = null;
let questionPool = [];

const dom = {};

/* ── Utilities ──────────────────────────────────────────── */

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function closeNavGridPanel() {
    if (dom.navGridPanel) dom.navGridPanel.classList.add("hidden");
    const caret = dom.btnGridToggle?.querySelector(".toggle-caret");
    if (caret) caret.style.transform = "";
}

/* ── i18n ───────────────────────────────────────────────── */

function getTranslationValue(obj, path) {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

function t(key, replacements = {}) {
    let val = getTranslationValue(currentLocaleData, key);
    if (val === undefined) return key;
    for (const [placeholder, replacement] of Object.entries(replacements)) {
        val = val.replace(`{${placeholder}}`, replacement);
    }
    return val;
}

async function loadLanguage(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load locale file: locales/${lang}.json`);
        }
        const data = await response.json();

        currentLang = lang;
        currentLocaleData = data;
        questionPool = data.questions;

        document.documentElement.lang = lang;
        document.title = data.ui.title;

        updateDOMTranslations();

        document.querySelectorAll(".lang-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
        });

        localStorage.setItem("preferred_language", lang);

        if (dom.dbLoadStatus && dom.dbLoadStatusText && dom.startExamBtn) {
            dom.dbLoadStatus.classList.add("loaded");
            dom.dbLoadStatusText.innerHTML =
                `<i class="fa-solid fa-graduation-cap"></i> ${t("ui.dbLoaded", { count: questionPool.length })}`;
            dom.startExamBtn.disabled = false;
        }
    } catch (error) {
        console.error("Error loading language:", error);
    }
}

function updateDOMTranslations() {
    if (!currentLocaleData) return;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        let val = getTranslationValue(currentLocaleData, key);
        if (val !== undefined) {
            if (key === "ui.infoQuestions") {
                val = t("ui.infoQuestions", { count: questionPool.length });
            }
            el.innerHTML = val;
        }
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        const val = getTranslationValue(currentLocaleData, key);
        if (val !== undefined) {
            el.title = val;
        }
    });
}

function initLanguage() {
    let lang = localStorage.getItem("preferred_language");

    if (!lang) {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang?.startsWith("en")) {
            lang = "en";
        } else if (browserLang?.startsWith("de")) {
            lang = "de";
        } else {
            lang = CONFIG.DEFAULT_LANG;
        }
    }

    loadLanguage(lang);
}

/* ── DOM ────────────────────────────────────────────────── */

function cacheDomRefs() {
    dom.introScreen = document.getElementById("intro-screen");
    dom.quizScreen = document.getElementById("quiz-screen");
    dom.resultScreen = document.getElementById("result-screen");
    dom.startExamBtn = document.getElementById("start-exam-btn");
    dom.restartExamBtn = document.getElementById("restart-exam-btn");
    dom.abortBtn = document.getElementById("abort-btn");
    dom.btnCancel = document.getElementById("btn-cancel");
    dom.btnStar = document.getElementById("btn-star");
    dom.btnNextMain = document.getElementById("btn-next-main");
    dom.btnPrev = document.getElementById("btn-prev");
    dom.btnGridToggle = document.getElementById("btn-grid-toggle");
    dom.navGridPanel = document.getElementById("nav-grid-panel");
    dom.navGridContainer = document.getElementById("nav-grid-panel-container");
    dom.closeNavGridBtn = document.getElementById("close-nav-grid-btn");
    dom.gridToggleLabel = document.getElementById("grid-toggle-label");
    dom.submitModal = document.getElementById("submit-modal");
    dom.modalCancelBtn = document.getElementById("modal-cancel-btn");
    dom.modalConfirmBtn = document.getElementById("modal-confirm-btn");
    dom.answeredCount = document.getElementById("answered-count");
    dom.unansweredCount = document.getElementById("unanswered-count");
    dom.legalModal = document.getElementById("legal-modal");
    dom.openLegalBtn = document.getElementById("open-legal-modal-btn");
    dom.closeLegalBtn = document.getElementById("close-legal-modal-btn");
    dom.closeLegalX = document.getElementById("close-legal-modal-x");
    dom.reviewAnswersBtn = document.getElementById("review-answers-btn");
    dom.dbLoadStatus = document.getElementById("db-load-status");
    dom.dbLoadStatusText = document.querySelector("#db-load-status .status-text");
    dom.questionId = document.getElementById("question-id");
    dom.currentQPoints = document.getElementById("current-q-points");
    dom.questionText = document.getElementById("question-text");
    dom.examMediaBox = document.getElementById("exam-media-box");
    dom.mediaFilename = document.getElementById("media-filename");
    dom.mediaDescription = document.getElementById("media-description");
    dom.answersContainer = document.getElementById("answers-container");
    dom.timerDisplay = document.getElementById("timer-display-header");
    dom.quizCanvas = document.querySelector(".quiz-canvas");
    dom.quizCanvasContainer = document.querySelector(".quiz-canvas-container");
    dom.resultBadge = document.getElementById("result-badge");
    dom.resErrorPoints = document.getElementById("res-error-points");
    dom.resWrongCount = document.getElementById("res-wrong-count");
    dom.resWrongPct = document.getElementById("res-wrong-pct");
    dom.resTimeLeft = document.getElementById("res-time-left");
    dom.resultsTableBody = document.getElementById("results-table-body");
}

/* ── Image Preloading & Caching System ──────────────────────── */
const imageCache = new Map();

function preloadImage(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) {
        return imageCache.get(src);
    }

    const promise = new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        if (img.complete) {
            if ("decode" in img) {
                img.decode().then(() => resolve(img)).catch(() => resolve(img));
            } else {
                resolve(img);
            }
        } else {
            img.onload = () => {
                if ("decode" in img) {
                    img.decode().then(() => resolve(img)).catch(() => resolve(img));
                } else {
                    resolve(img);
                }
            };
            img.onerror = () => resolve(null);
        }
    });

    imageCache.set(src, promise);
    return promise;
}

function preloadAdjacentImages(centerIdx) {
    if (!questions || !questions.length) return;
    const indicesToPreload = [
        centerIdx,
        centerIdx + 1,
        centerIdx + 2,
        centerIdx - 1,
        centerIdx + 3,
    ];

    indicesToPreload.forEach((idx) => {
        if (idx >= 0 && idx < questions.length) {
            const q = questions[idx];
            if (q && q.image) {
                preloadImage(q.image);
            }
        }
    });
}

function preloadAllQuestionImages(priorityIndex = 0) {
    if (!questions || !questions.length) return;

    preloadAdjacentImages(priorityIndex);

    const remainingIndices = questions
        .map((_, i) => i)
        .sort((a, b) => Math.abs(a - priorityIndex) - Math.abs(b - priorityIndex));

    let queueIndex = 0;
    function processNextBatch() {
        const batchSize = 3;
        for (let i = 0; i < batchSize && queueIndex < remainingIndices.length; i++, queueIndex++) {
            const idx = remainingIndices[queueIndex];
            const q = questions[idx];
            if (q && q.image) {
                preloadImage(q.image);
            }
        }
        if (queueIndex < remainingIndices.length) {
            if ("requestIdleCallback" in window) {
                requestIdleCallback(() => processNextBatch(), { timeout: 1000 });
            } else {
                setTimeout(processNextBatch, 80);
            }
        }
    }

    processNextBatch();
}

/* ── Exam lifecycle ─────────────────────────────────────── */

function startExam() {
    currentIndex = 0;
    userAnswers = {};
    starredQuestions = {};
    timeLeft = CONFIG.EXAM_DURATION_SEC;
    reviewMode = false;

    questions = shuffle(questionPool).map((q) => ({
        number: q.number,
        points: q.points,
        text: q.text,
        picture: q.picture,
        image: q.image,
        pictureDesc: q.pictureDesc,
        answers: shuffle(q.answers),
    }));

    dom.introScreen.classList.add("hidden");
    dom.resultScreen.classList.add("hidden");
    dom.quizScreen.classList.remove("hidden");

    buildNavigationFooter();
    loadQuestion(0, true, "none");
    preloadAllQuestionImages(0);

    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoSubmitExam();
        }
    }, 1000);
}

function confirmAbort() {
    if (reviewMode) {
        clearInterval(timerInterval);
        dom.quizScreen.classList.add("hidden");
        dom.introScreen.classList.remove("hidden");
        return;
    }

    if (confirm(t("ui.confirmAbort"))) {
        clearInterval(timerInterval);
        dom.quizScreen.classList.add("hidden");
        dom.introScreen.classList.remove("hidden");
    }
}

function restartExam() {
    startExam();
}

function autoSubmitExam() {
    alert(t("ui.timeExpiredAlert"));
    submitExam();
}

function submitExam() {
    clearInterval(timerInterval);
    closeSubmitModal();

    let totalErrorPoints = 0;
    let wrongQuestionsCount = 0;

    dom.resultsTableBody.innerHTML = "";

    questions.forEach((q, idx) => {
        const isCorrect = checkQuestionCorrectness(idx);
        if (!isCorrect) {
            totalErrorPoints += q.points;
            wrongQuestionsCount++;
        }

        const row = document.createElement("tr");

        const cellQuestion = document.createElement("td");
        cellQuestion.textContent = idx + 1;

        const cellPoints = document.createElement("td");
        if (isCorrect) {
            const span = document.createElement("span");
            span.style.color = "#666";
            span.textContent = "0";
            cellPoints.appendChild(span);
        } else {
            const span = document.createElement("span");
            span.style.color = "#b32117";
            span.style.fontWeight = "bold";
            span.textContent = q.points;
            cellPoints.appendChild(span);
        }

        const cellStatus = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `badge-status ${isCorrect ? "correct" : "incorrect"}`;
        badge.innerHTML = isCorrect
            ? `<i class="fa-solid fa-circle-check"></i> ${t("ui.tableStatusCorrect")}`
            : `<i class="fa-solid fa-circle-xmark"></i> ${t("ui.tableStatusWrong")}`;
        cellStatus.appendChild(badge);

        row.append(cellQuestion, cellPoints, cellStatus);
        dom.resultsTableBody.appendChild(row);
    });

    const isPassed = totalErrorPoints <= CONFIG.MAX_ERROR_POINTS;

    dom.resultBadge.className = `result-badge ${isPassed ? "success" : "danger"}`;
    dom.resultBadge.innerHTML = isPassed
        ? `<i class="fa-solid fa-circle-check"></i> <span>${t("ui.passedBadge")}</span>`
        : `<i class="fa-solid fa-circle-xmark"></i> <span>${t("ui.failedBadge")}</span>`;

    dom.resErrorPoints.textContent = totalErrorPoints;
    dom.resWrongCount.textContent = `${wrongQuestionsCount} / ${questions.length}`;
    dom.resWrongPct.textContent = t("ui.wrongPctLabel", {
        pct: Math.round((wrongQuestionsCount / questions.length) * 100),
    });
    dom.resTimeLeft.textContent = formatTime(timeLeft);

    dom.quizScreen.classList.add("hidden");
    dom.resultScreen.classList.remove("hidden");
}

function enterReviewMode() {
    reviewMode = true;
    currentIndex = 0;
    dom.resultScreen.classList.add("hidden");
    dom.quizScreen.classList.remove("hidden");

    dom.abortBtn.innerHTML = '<i class="fa-solid fa-house"></i>';
    dom.abortBtn.title = t("ui.abortTitle");

    loadQuestion(0, true, "none");
    updateNavigationFooter();
}

function showResultScreen() {
    dom.quizScreen.classList.add("hidden");
    dom.resultScreen.classList.remove("hidden");
}

/* ── Timer ──────────────────────────────────────────────── */

function updateTimerDisplay() {
    dom.timerDisplay.textContent = formatTime(timeLeft);
    dom.timerDisplay.classList.toggle("timer-warning", timeLeft < CONFIG.TIMER_WARNING_SEC);
}

/* ── Question rendering ───────────────────────────────────── */

function renderMediaBox(q) {
    const mediaBox = dom.examMediaBox;
    if (!mediaBox) return;

    const blueprintInfo = mediaBox.querySelector(".blueprint-info");
    const blueprintElements = mediaBox.querySelectorAll(
        ".blueprint-lines, .blueprint-mirror, .blueprint-speedometer, .blueprint-steering-wheel, .blueprint-road-path"
    );
    const oldImg = mediaBox.querySelector(".real-question-image");

    if (q.image) {
        const imageSrc = q.image;
        oldImg?.remove();

        if (blueprintInfo) blueprintInfo.style.display = "none";
        blueprintElements.forEach((el) => { el.style.display = "none"; });

        mediaBox.classList.remove("media-blueprint", "media-empty");
        mediaBox.classList.add("media-has-image", "media-loading");

        const newImg = document.createElement("img");
        newImg.className = "real-question-image";
        newImg.alt = q.pictureDesc || t("ui.mediaAltDefault");

        preloadImage(imageSrc).then(() => {
            if (questions[currentIndex]?.image !== imageSrc) return;

            newImg.src = imageSrc;
            mediaBox.appendChild(newImg);
            mediaBox.classList.remove("media-loading");

            requestAnimationFrame(() => {
                newImg.classList.add("loaded");
            });
        });
    } else {
        oldImg?.remove();
        mediaBox.classList.remove("media-has-image", "media-loading");

        if (q.picture) {
            if (blueprintInfo) blueprintInfo.style.display = "";
            blueprintElements.forEach((el) => { el.style.display = ""; });
            if (dom.mediaFilename) dom.mediaFilename.textContent = q.picture;
            if (dom.mediaDescription) dom.mediaDescription.textContent = q.pictureDesc || t("ui.mediaDescDefault");
            mediaBox.classList.remove("media-empty");
            mediaBox.classList.add("media-blueprint");
        } else {
            if (blueprintInfo) blueprintInfo.style.display = "";
            blueprintElements.forEach((el) => { el.style.display = ""; });
            if (dom.mediaFilename) dom.mediaFilename.textContent = t("ui.noImage");
            if (dom.mediaDescription) dom.mediaDescription.textContent = t("ui.noImageDesc");
            mediaBox.classList.remove("media-blueprint");
            mediaBox.classList.add("media-empty");
        }
    }
}

function renderAnswerOption(q, qIdx, aIdx, ans, isReview) {
    const option = document.createElement("div");
    option.className = "answer-option";

    const isSelected = userAnswers[qIdx] === aIdx;
    if (isSelected) option.classList.add("selected");

    const checkbox = document.createElement("div");
    checkbox.className = "checkbox-square";
    checkbox.innerHTML = '<i class="fa-solid fa-check"></i>';

    const answerText = document.createElement("div");
    answerText.className = "answer-text";

    const prefix = document.createElement("span");
    prefix.className = "answer-prefix";
    prefix.textContent = `${String.fromCharCode(65 + aIdx)}) `;

    const text = document.createElement("span");
    text.textContent = ans.text;

    answerText.append(prefix, text);
    option.append(checkbox, answerText);

    if (isReview) {
        if (ans.correct) {
            option.classList.add(isSelected ? "correct-choice" : "missed-choice");
        } else if (isSelected) {
            option.classList.add("incorrect-choice");
        }

        const badge = document.createElement("span");
        badge.className = `review-badge-inline ${ans.correct ? "correct" : "incorrect"}`;
        badge.innerHTML = ans.correct
            ? `<i class="fa-solid fa-check"></i> ${t("ui.tableStatusCorrect")}`
            : `<i class="fa-solid fa-xmark"></i> ${t("ui.tableStatusWrong")}`;
        answerText.appendChild(badge);
    } else {
        option.addEventListener("click", () => {
            toggleAnswerSelection(qIdx, aIdx);
            dom.answersContainer.querySelectorAll(".answer-option").forEach((opt, oIdx) => {
                opt.classList.toggle("selected", oIdx === aIdx);
            });
        });
    }

    return option;
}

function updateNextButton(index) {
    if (!dom.btnNextMain) return;

    if (index === questions.length - 1) {
        dom.btnNextMain.classList.add("submit-btn");
        if (reviewMode) {
            dom.btnNextMain.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i>';
            dom.btnNextMain.title = t("ui.navEvaluation");
        } else {
            dom.btnNextMain.innerHTML = '<i class="fa-solid fa-check"></i>';
            dom.btnNextMain.title = t("ui.navSubmit");
        }
    } else {
        dom.btnNextMain.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
        dom.btnNextMain.classList.remove("submit-btn");
        dom.btnNextMain.title = t("ui.navNext");
    }
}

function renderQuestionContent(index, scrollToTop = false) {
    currentIndex = index;
    const q = questions[index];

    if (scrollToTop && dom.quizCanvas) {
        dom.quizCanvas.scrollTop = 0;
    }

    dom.questionId.textContent = `${t("ui.questionLabel")} ${index + 1}`;
    dom.currentQPoints.textContent = q.points;
    dom.questionText.textContent = q.text;

    renderMediaBox(q);

    if (starredQuestions[index]) {
        dom.btnStar.classList.add("starred");
        dom.btnStar.innerHTML = '<i class="fa-solid fa-star"></i>';
    } else {
        dom.btnStar.classList.remove("starred");
        dom.btnStar.innerHTML = '<i class="fa-regular fa-star"></i>';
    }

    dom.answersContainer.innerHTML = "";
    q.answers.forEach((ans, aIdx) => {
        dom.answersContainer.appendChild(renderAnswerOption(q, index, aIdx, ans, reviewMode));
    });

    updateNextButton(index);
    updateNavigationFooter();
}

async function loadQuestion(index, scrollToTop = false, dir = "next") {
    preloadAdjacentImages(index);

    if (!dom.quizCanvasContainer || dir === "none") {
        renderQuestionContent(index, scrollToTop);
        return;
    }

    const exitClass = dir === "prev" ? "transition-exit-prev" : "transition-exit-next";
    const enterClass = dir === "prev" ? "transition-enter-prev" : "transition-enter-next";

    dom.quizCanvasContainer.classList.add(exitClass);

    await new Promise((resolve) => setTimeout(resolve, 60));

    renderQuestionContent(index, scrollToTop);

    dom.quizCanvasContainer.classList.remove(exitClass);
    dom.quizCanvasContainer.classList.add(enterClass);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (!dom.quizCanvasContainer) return;
            dom.quizCanvasContainer.classList.remove(enterClass);
            dom.quizCanvasContainer.classList.add("transition-active");

            setTimeout(() => {
                if (dom.quizCanvasContainer) {
                    dom.quizCanvasContainer.classList.remove("transition-active");
                }
            }, 180);
        });
    });
}

function toggleAnswerSelection(qIdx, aIdx) {
    userAnswers[qIdx] = aIdx;
    updateNavigationFooter();
}

function toggleStar() {
    starredQuestions[currentIndex] = !starredQuestions[currentIndex];
    loadQuestion(currentIndex, false, "none");
    updateNavigationFooter();
}

function checkQuestionCorrectness(qIdx) {
    const selectedIdx = userAnswers[qIdx];
    if (selectedIdx === undefined) return false;
    return questions[qIdx].answers[selectedIdx].correct === true;
}

/* ── Navigation ─────────────────────────────────────────── */

function buildNavigationFooter() {
    if (!dom.navGridContainer) return;

    dom.navGridContainer.innerHTML = "";
    for (let i = 0; i < questions.length; i++) {
        const box = document.createElement("div");
        box.className = "q-nav-box";
        box.textContent = i + 1;
        box.addEventListener("click", () => {
            loadQuestion(i, true, i >= currentIndex ? "next" : "prev");
            closeNavGridPanel();
        });
        dom.navGridContainer.appendChild(box);
    }
}

function updateNavigationFooter() {
    if (dom.gridToggleLabel) {
        dom.gridToggleLabel.textContent = `${t("ui.questionLabel")} ${currentIndex + 1} / ${questions.length}`;
    }

    if (dom.navGridContainer) {
        const boxes = dom.navGridContainer.children;
        for (let idx = 0; idx < questions.length; idx++) {
            const box = boxes[idx];
            if (!box) continue;

            box.className = "q-nav-box";
            const isAnswered = userAnswers[idx] !== undefined;

            if (idx === currentIndex) box.classList.add("active");
            if (starredQuestions[idx]) box.classList.add("starred");

            if (reviewMode) {
                box.classList.add(checkQuestionCorrectness(idx) ? "review-correct" : "review-incorrect");
            } else if (isAnswered) {
                box.classList.add("answered");
            }
        }
    }

    if (dom.btnPrev) {
        dom.btnPrev.disabled = currentIndex === 0;
    }
}

/* ── Modals ─────────────────────────────────────────────── */

function openSubmitModal() {
    let answered = 0;
    for (let i = 0; i < questions.length; i++) {
        if (userAnswers[i] !== undefined) answered++;
    }

    dom.answeredCount.textContent = `${answered}/${questions.length}`;
    dom.unansweredCount.textContent = questions.length - answered;
    dom.submitModal.classList.remove("hidden");
}

function closeSubmitModal() {
    dom.submitModal.classList.add("hidden");
}

function openLegalModal() {
    dom.legalModal?.classList.remove("hidden");
}

function closeLegalModal() {
    dom.legalModal?.classList.add("hidden");
}

/* ── Event wiring ───────────────────────────────────────── */

function setupEventListeners() {
    document.querySelectorAll(".lang-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            loadLanguage(e.currentTarget.getAttribute("data-lang"));
        });
    });

    dom.startExamBtn.addEventListener("click", startExam);
    dom.restartExamBtn.addEventListener("click", restartExam);
    dom.abortBtn.addEventListener("click", confirmAbort);
    dom.btnCancel.addEventListener("click", confirmAbort);
    dom.btnStar.addEventListener("click", toggleStar);

    dom.btnNextMain?.addEventListener("click", () => {
        if (currentIndex < questions.length - 1) {
            loadQuestion(currentIndex + 1, true, "next");
        } else if (!reviewMode) {
            openSubmitModal();
        } else {
            showResultScreen();
        }
    });

    dom.btnGridToggle?.addEventListener("click", (e) => {
        e.stopPropagation();
        dom.navGridPanel?.classList.toggle("hidden");
        const caret = dom.btnGridToggle.querySelector(".toggle-caret");
        if (caret) {
            caret.style.transform = dom.navGridPanel.classList.contains("hidden") ? "" : "rotate(180deg)";
        }
    });

    dom.navGridPanel?.addEventListener("click", (e) => e.stopPropagation());
    dom.closeNavGridBtn?.addEventListener("click", closeNavGridPanel);

    document.addEventListener("click", (e) => {
        if (!dom.navGridPanel || !dom.btnGridToggle || dom.navGridPanel.classList.contains("hidden")) return;
        if (!dom.navGridPanel.contains(e.target) && !dom.btnGridToggle.contains(e.target)) {
            closeNavGridPanel();
        }
    });

    dom.btnPrev?.addEventListener("click", () => {
        if (currentIndex > 0) loadQuestion(currentIndex - 1, true, "prev");
    });

    dom.modalCancelBtn.addEventListener("click", closeSubmitModal);
    dom.modalConfirmBtn.addEventListener("click", submitExam);
    dom.submitModal.addEventListener("click", (e) => {
        if (e.target.id === "submit-modal") closeSubmitModal();
    });

    dom.openLegalBtn?.addEventListener("click", openLegalModal);
    dom.closeLegalBtn?.addEventListener("click", closeLegalModal);
    dom.closeLegalX?.addEventListener("click", closeLegalModal);
    dom.legalModal?.addEventListener("click", (e) => {
        if (e.target.id === "legal-modal") closeLegalModal();
    });

    dom.reviewAnswersBtn.addEventListener("click", enterReviewMode);
}

/* ── Bootstrap ──────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
    cacheDomRefs();
    initLanguage();
    setupEventListeners();
});
