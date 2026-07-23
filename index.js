/* ── Configuration ──────────────────────────────────────── */
const CONFIG = {
    EXAM_DURATION_SEC: 45 * 60,
    MAX_ERROR_POINTS: 10,
    TIMER_WARNING_SEC: 300,
    DEFAULT_LANG: "de",
};

/* ── State ──────────────────────────────────────────────── */
let questions = [];
let currentIndex = 0;
let userAnswers = {};
let starredQuestions = {};
let timeLeft = CONFIG.EXAM_DURATION_SEC;
let timerInterval = null;
let reviewMode = false;
let currentLocaleData = null;
let questionPool = [];
let lastResultData = null;

/* ── DOM Proxy ─────────────────────────────────────────── */
const ID_MAP = {
    timerDisplay: "timer-display-header",
    navGridContainer: "nav-grid-panel-container",
    openLegalBtn: "open-legal-modal-btn",
    closeLegalBtn: "close-legal-modal-btn",
    closeLegalX: "close-legal-modal-x",
    dbLoadStatusText: "#db-load-status .status-text",
    quizCanvas: ".quiz-canvas",
    quizCanvasContainer: ".quiz-canvas-container",
    toastContainer: "toast-container"
};
const dom = new Proxy({}, {
    get: (_, p) => ID_MAP[p]
        ? (ID_MAP[p].startsWith("#") || ID_MAP[p].startsWith(".") ? document.querySelector(ID_MAP[p]) : document.getElementById(ID_MAP[p]))
        : (document.getElementById(p) || document.getElementById(p.replace(/([A-Z])/g, "-$1").toLowerCase()))
});

/* ── Utilities ──────────────────────────────────────────── */
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const toggle = (el, show) => el?.classList.toggle("hidden", !show);
const closeNavGridPanel = () => {
    toggle(dom.navGridPanel, false);
    const caret = dom.btnGridToggle?.querySelector(".toggle-caret");
    if (caret) caret.style.transform = "";
};

const getTranslationValue = (o, p) => p.split(".").reduce((acc, k) => acc?.[k], o);
const t = (k, r = {}) => Object.entries(r).reduce((v, [p, repl]) => v.replaceAll(`{${p}}`, repl), getTranslationValue(currentLocaleData, k) ?? k);
const checkQuestionCorrectness = idx => questions[idx]?.answers[userAnswers[idx]]?.correct === true;
const preloadImage = src => { if (src) new Image().src = src; };
const preloadAllImages = pool => pool.forEach(q => preloadImage(q.image));

function showToast(msg) {
    if (!dom.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/* ── i18n ───────────────────────────────────────────────── */
async function loadLanguage(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load locale: ${lang}`);
        const data = await response.json();

        currentLocaleData = data;
        questionPool = data.questions;
        preloadAllImages(questionPool);

        document.documentElement.lang = lang;
        document.title = data.ui.title;

        // If exam is currently active, update the active questions array text
        if (questions.length > 0) {
            questions = questions.map(q => {
                const match = questionPool.find(item => item.image === q.image || item.number === q.number);
                if (!match) return q;
                return {
                    ...match,
                    answers: q.answers.map(ans => {
                        const matchAns = ans.origIndex !== undefined && match.answers[ans.origIndex]
                            ? match.answers[ans.origIndex]
                            : (match.answers.find(a => a.correct === ans.correct && a.text === ans.text) || match.answers.find(a => a.correct === ans.correct) || ans);
                        return { ...matchAns, origIndex: ans.origIndex };
                    })
                };
            });
        }

        updateDOMTranslations();

        const flagMap = {
            de: `<svg class="flag-icon" viewBox="0 0 640 480" width="16" height="12" aria-hidden="true"><rect width="640" height="160" fill="#000000"/><rect y="160" width="640" height="160" fill="#DD0000"/><rect y="320" width="640" height="160" fill="#FFCE00"/></svg><span>DE</span>`,
            en: `<svg class="flag-icon" viewBox="0 0 640 480" width="16" height="12" aria-hidden="true"><path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 245 180L565 0h75v50L395 240l245 190v50h-75L320 300 75 480H0v-50l245-190L0 50V0h75z"/><path fill="#C8102E" d="m424 261 216 163v26h-34L376 273l48-12zm-208 0L0 424v26h34l230-177-48-12zM0 30l208 157 48-12L40 0H0v30zm640 0L432 187l-48-12L600 0h40v30z"/><path fill="#FFF" d="M240 0v480h160V0H240zM0 160v160h640V160H0z"/><path fill="#C8102E" d="M267 0v480h106V0H267zM0 187v106h640V187H0z"/></svg><span>EN</span>`
        };
        document.querySelectorAll(".lang-toggle-btn").forEach(btn => btn.innerHTML = flagMap[lang]);
        localStorage.setItem("preferred_language", lang);

        if (dom.dbLoadStatus) {
            dom.dbLoadStatus.classList.add("loaded");
            if (dom.dbLoadStatusText) dom.dbLoadStatusText.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${t("ui.dbLoaded", { count: questionPool.length })}`;
            if (dom.startExamBtn) dom.startExamBtn.disabled = false;
        }

        if (dom.quizScreen && !dom.quizScreen.classList.contains("hidden")) {
            loadQuestion(currentIndex, false, "none");
        }
    } catch (err) {
        console.error("Error loading language:", err);
    }
}

function updateDOMTranslations() {
    if (!currentLocaleData) return;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const val = getTranslationValue(currentLocaleData, key);
        if (val !== undefined) el.innerHTML = key === "ui.infoQuestions" ? t("ui.infoQuestions", { count: questionPool.length }) : val;
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const val = getTranslationValue(currentLocaleData, el.getAttribute("data-i18n-title"));
        if (val !== undefined) el.title = val;
    });
}

function initLanguage() {
    const saved = localStorage.getItem("preferred_language");
    const browser = (navigator.language || navigator.userLanguage || "").slice(0, 2);
    loadLanguage(saved || (["en", "de"].includes(browser) ? browser : CONFIG.DEFAULT_LANG));
}



/* ── Exam Lifecycle ─────────────────────────────────────── */
function startExam() {
    currentIndex = 0;
    userAnswers = {};
    starredQuestions = {};
    timeLeft = CONFIG.EXAM_DURATION_SEC;
    reviewMode = false;
    lastResultData = null;

    questions = shuffle(questionPool).map(q => ({ ...q, answers: shuffle(q.answers.map((ans, idx) => ({ ...ans, origIndex: idx }))) }));

    toggle(dom.introScreen, false);
    toggle(dom.resultScreen, false);
    toggle(dom.quizScreen, true);

    if (dom.btnCancel) {
        dom.btnCancel.innerHTML = t("ui.abortBtn");
    }

    buildNavigationFooter();
    loadQuestion(0, true, "none");

    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        if (--timeLeft <= 0) {
            clearInterval(timerInterval);
            alert(t("ui.timeExpiredAlert"));
            submitExam();
        } else {
            updateTimerDisplay();
        }
    }, 1000);
}

const confirmAbort = () => {
    if (reviewMode) {
        toggle(dom.quizScreen, false);
        toggle(dom.resultScreen, true);
    } else {
        toggle(dom.abortModal, true);
    }
};

function submitExam() {
    clearInterval(timerInterval);
    toggle(dom.submitModal, false);

    let totalErrorPoints = 0, wrongQuestionsCount = 0;
    dom.resultsTableBody.innerHTML = "";

    questions.forEach((q, idx) => {
        const isCorrect = checkQuestionCorrectness(idx);
        if (!isCorrect) { totalErrorPoints += q.points; wrongQuestionsCount++; }

        const row = document.createElement("tr");
        row.title = `${t("ui.questionLabel")} ${idx + 1} — ${t("ui.reviewAnswersBtn")}`;
        row.innerHTML = `
            <td><strong>${idx + 1}</strong></td>
            <td><span class="${isCorrect ? 'pts-ok' : 'pts-wrong'}">${isCorrect ? 0 : q.points}</span></td>
            <td><span class="badge-status ${isCorrect ? 'correct' : 'incorrect'}"><i class="fa-solid fa-circle-${isCorrect ? 'check' : 'xmark'}"></i> ${t(isCorrect ? 'ui.tableStatusCorrect' : 'ui.tableStatusWrong')}</span></td>
            <td class="row-chevron"><i class="fa-solid fa-chevron-right"></i></td>
        `;
        row.addEventListener("click", () => enterReviewMode(idx));
        dom.resultsTableBody.appendChild(row);
    });

    const isPassed = totalErrorPoints <= CONFIG.MAX_ERROR_POINTS;
    const wrongPct = Math.round((wrongQuestionsCount / questions.length) * 100);

    lastResultData = {
        totalErrorPoints,
        wrongQuestionsCount,
        totalQuestions: questions.length,
        wrongPct,
        timeLeft,
        isPassed
    };

    const verdictClass = isPassed ? "is-passed" : "is-failed";
    dom.resultVerdict.className = `result-verdict ${verdictClass}`;
    dom.verdictIcon.className = `fa-solid fa-circle-${isPassed ? "check" : "xmark"} verdict-icon`;
    dom.resultBadge.textContent = t(isPassed ? "ui.passedBadge" : "ui.failedBadge");
    dom.verdictScore.textContent = t("ui.verdictScore", { points: totalErrorPoints, max: CONFIG.MAX_ERROR_POINTS });
    document.querySelectorAll(".result-summary-grid .summary-box").forEach(box => { box.className = `summary-box ${verdictClass}`; });
    const resultsTable = document.querySelector(".results-table");
    if (resultsTable) resultsTable.className = `results-table ${verdictClass}`;

    dom.resErrorPoints.textContent = totalErrorPoints;
    dom.resWrongCount.textContent = `${wrongQuestionsCount} / ${questions.length}`;
    dom.resWrongPct.textContent = t("ui.wrongPctLabel", { pct: wrongPct });
    dom.resTimeLeft.textContent = formatTime(timeLeft);

    toggle(dom.quizScreen, false);
    toggle(dom.resultScreen, true);
}

function enterReviewMode(startIdx = 0) {
    reviewMode = true;
    currentIndex = startIdx;
    toggle(dom.resultScreen, false);
    toggle(dom.quizScreen, true);

    if (dom.btnCancel) {
        dom.btnCancel.innerHTML = `<i class="fa-solid fa-chart-pie"></i> ${t("ui.backToResults")}`;
    }

    if (dom.abortBtn) {
        dom.abortBtn.innerHTML = '<i class="fa-solid fa-house"></i>';
        dom.abortBtn.title = t("ui.abortTitle");
    }

    loadQuestion(startIdx, true, "none");
}

const updateTimerDisplay = () => {
    if (reviewMode) {
        dom.timerDisplay.innerHTML = `<i class="fa-solid fa-eye"></i> ${t("ui.reviewMode")}`;
        dom.timerDisplay.classList.remove("timer-warning");
    } else {
        dom.timerDisplay.textContent = formatTime(timeLeft);
        dom.timerDisplay.classList.toggle("timer-warning", timeLeft < CONFIG.TIMER_WARNING_SEC);
    }
};

/* ── Question & Media Rendering ─────────────────────────── */
function renderMediaBox(q) {
    const box = dom.examMediaBox;
    const col = box?.closest(".media-column");
    if (!box) return;
    box.querySelector(".real-question-image")?.remove();

    box.className = `exam-media-box ${q.image ? "media-has-image" : "media-empty"}`;
    col?.classList.toggle("is-empty", !q.image);

    if (q.image) {
        const img = Object.assign(document.createElement("img"), {
            className: "real-question-image loaded",
            alt: q.pictureDesc || t("ui.mediaAltDefault"),
            src: q.image
        });
        box.appendChild(img);
    }
}

function renderAnswerOption(q, qIdx, aIdx, ans, isReview) {
    const option = document.createElement("div");
    const isSelected = userAnswers[qIdx] === aIdx;
    option.className = `answer-option${isSelected ? " selected" : ""}`;
    option.tabIndex = isReview ? -1 : 0;
    option.setAttribute("role", "radio");
    option.setAttribute("aria-checked", isSelected ? "true" : "false");

    let badgeHTML = "";
    if (isReview) {
        if (ans.correct) {
            badgeHTML = `<span class="review-badge-inline correct"><i class="fa-solid fa-check"></i> ${t("ui.correctChoice")}</span>`;
        } else if (isSelected) {
            badgeHTML = `<span class="review-badge-inline incorrect"><i class="fa-solid fa-xmark"></i> ${t("ui.yourChoice")}</span>`;
        }
    }

    option.innerHTML = `
        <div class="checkbox-square"><i class="fa-solid fa-check"></i></div>
        <div class="answer-text">
            <span class="answer-prefix">${String.fromCharCode(65 + aIdx)}) </span>
            <span>${ans.text}</span>
            ${badgeHTML}
        </div>
    `;

    if (isReview) {
        if (ans.correct) option.classList.add(isSelected ? "correct-choice" : "missed-choice");
        else if (isSelected) option.classList.add("incorrect-choice");
    } else {
        const selectOption = () => {
            userAnswers[qIdx] = aIdx;
            updateNavigationFooter();
            dom.answersContainer.querySelectorAll(".answer-option").forEach((opt, oIdx) => {
                const sel = oIdx === aIdx;
                opt.classList.toggle("selected", sel);
                opt.setAttribute("aria-checked", sel ? "true" : "false");
            });
        };
        option.addEventListener("click", selectOption);
    }

    return option;
}

function updateNextButton(index) {
    if (!dom.btnNextMain) return;
    const isLast = index === questions.length - 1;
    dom.btnNextMain.classList.toggle("submit-btn", isLast);
    dom.btnNextMain.innerHTML = `<i class="fa-solid fa-${isLast ? (reviewMode ? 'arrow-right-from-bracket' : 'check') : 'arrow-right'}"></i>`;
    dom.btnNextMain.title = t(isLast ? (reviewMode ? "ui.navEvaluation" : "ui.navSubmit") : "ui.navNext");
}

function renderQuestionContent(index, scrollToTop = false) {
    currentIndex = index;
    const q = questions[index];
    if (scrollToTop && dom.quizCanvas) dom.quizCanvas.scrollTop = 0;

    dom.questionId.textContent = `${t("ui.questionLabel")} ${index + 1}`;
    dom.currentQPoints.textContent = q.points;
    dom.questionText.textContent = q.text;

    renderMediaBox(q);

    const isStarred = Boolean(starredQuestions[index]);
    dom.btnStar.classList.toggle("starred", isStarred);
    dom.btnStar.innerHTML = `<i class="fa-${isStarred ? 'solid' : 'regular'} fa-star"></i>`;

    dom.answersContainer.innerHTML = "";
    q.answers.forEach((ans, aIdx) => dom.answersContainer.appendChild(renderAnswerOption(q, index, aIdx, ans, reviewMode)));

    updateNextButton(index);
    updateNavigationFooter();
}

async function loadQuestion(index, scrollToTop = false, dir = "next") {
    if (!dom.quizCanvasContainer || dir === "none") return renderQuestionContent(index, scrollToTop);
    dom.quizCanvasContainer.classList.add("fade-out");
    await new Promise(r => setTimeout(r, 60));
    renderQuestionContent(index, scrollToTop);
    dom.quizCanvasContainer.classList.remove("fade-out");
}

/* ── Navigation & Modals ─────────────────────────────────── */
function buildNavigationFooter() {
    if (!dom.navGridContainer) return;
    dom.navGridContainer.innerHTML = "";
    questions.forEach((_, i) => {
        const box = document.createElement("div");
        box.className = "q-nav-box";
        box.textContent = i + 1;
        box.tabIndex = 0;
        box.setAttribute("role", "button");
        box.setAttribute("aria-label", `${t("ui.questionLabel")} ${i + 1}`);

        const selectBox = () => {
            loadQuestion(i, true, i >= currentIndex ? "next" : "prev");
            closeNavGridPanel();
        };

        box.addEventListener("click", selectBox);
        dom.navGridContainer.appendChild(box);
    });
}

function updateNavigationFooter() {
    const isMobile = !window.matchMedia("(min-width: 640px)").matches;
    if (dom.gridToggleLabel) {
        dom.gridToggleLabel.textContent = isMobile
            ? `${currentIndex + 1} / ${questions.length}`
            : `${t("ui.questionLabel")} ${currentIndex + 1} / ${questions.length}`;
    }
    if (dom.navGridContainer) {
        if (!dom.navGridContainer.children.length) buildNavigationFooter();
        Array.from(dom.navGridContainer.children).forEach((box, idx) => {
            const isAnswered = userAnswers[idx] !== undefined;
            box.className = `q-nav-box${idx === currentIndex ? " active" : ""}${starredQuestions[idx] ? " starred" : ""}`;
            if (reviewMode) box.classList.add(checkQuestionCorrectness(idx) ? "review-correct" : "review-incorrect");
            else if (isAnswered) box.classList.add("answered");
        });
    }
    if (dom.btnPrev) dom.btnPrev.disabled = currentIndex === 0;
    updateTimerDisplay();
}

function openSubmitModal() {
    const answered = Object.keys(userAnswers).length;
    dom.answeredCount.textContent = `${answered}/${questions.length}`;
    dom.unansweredCount.textContent = questions.length - answered;
    toggle(dom.submitModal, true);
}

/* ── Event Listeners ─────────────────────────────────────── */
function setupEventListeners() {
    const toggleLang = () => loadLanguage((document.documentElement.lang || CONFIG.DEFAULT_LANG) === "de" ? "en" : "de");
    document.querySelectorAll(".lang-toggle-btn").forEach(btn => btn.addEventListener("click", toggleLang));

    dom.startExamBtn?.addEventListener("click", startExam);
    dom.restartExamBtn?.addEventListener("click", startExam);
    dom.abortBtn?.addEventListener("click", confirmAbort);
    dom.btnCancel?.addEventListener("click", confirmAbort);
    dom.btnStar?.addEventListener("click", () => {
        starredQuestions[currentIndex] = !starredQuestions[currentIndex];
        loadQuestion(currentIndex, false, "none");
    });

    dom.btnNextMain?.addEventListener("click", () => {
        if (currentIndex < questions.length - 1) loadQuestion(currentIndex + 1, true, "next");
        else if (!reviewMode) openSubmitModal();
        else { toggle(dom.quizScreen, false); toggle(dom.resultScreen, true); }
    });

    dom.btnGridToggle?.addEventListener("click", e => {
        e.stopPropagation();
        dom.navGridPanel?.classList.toggle("hidden");
        const caret = dom.btnGridToggle.querySelector(".toggle-caret");
        if (caret) caret.style.transform = dom.navGridPanel.classList.contains("hidden") ? "" : "rotate(180deg)";
    });

    dom.navGridPanel?.addEventListener("click", e => e.stopPropagation());
    dom.closeNavGridBtn?.addEventListener("click", closeNavGridPanel);
    document.addEventListener("click", e => {
        if (dom.navGridPanel && !dom.navGridPanel.classList.contains("hidden") && !dom.navGridPanel.contains(e.target) && !dom.btnGridToggle?.contains(e.target)) closeNavGridPanel();
    });

    dom.btnPrev?.addEventListener("click", () => { if (currentIndex > 0) loadQuestion(currentIndex - 1, true, "prev"); });
    dom.modalCancelBtn?.addEventListener("click", () => toggle(dom.submitModal, false));
    dom.modalConfirmBtn?.addEventListener("click", submitExam);
    dom.submitModal?.addEventListener("click", e => e.target.id === "submit-modal" && toggle(dom.submitModal, false));

    dom.abortModalCancelBtn?.addEventListener("click", () => toggle(dom.abortModal, false));
    dom.abortModalConfirmBtn?.addEventListener("click", () => { clearInterval(timerInterval); toggle(dom.abortModal, false); toggle(dom.quizScreen, false); toggle(dom.introScreen, true); });
    dom.abortModal?.addEventListener("click", e => e.target.id === "abort-modal" && toggle(dom.abortModal, false));

    const legalModal = dom.legalModal || document.getElementById("legal-modal");
    const openLegalBtn = dom.openLegalBtn || document.getElementById("open-legal-modal-btn");
    const closeLegalBtn = dom.closeLegalBtn || document.getElementById("close-legal-modal-btn");

    openLegalBtn?.addEventListener("click", () => toggle(legalModal, true));
    closeLegalBtn?.addEventListener("click", () => toggle(legalModal, false));
    legalModal?.addEventListener("click", e => e.target.id === "legal-modal" && toggle(legalModal, false));

    dom.reviewAnswersBtn?.addEventListener("click", () => enterReviewMode(0));

    window.addEventListener("resize", updateNavigationFooter);
}

/* ── Bootstrap ──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    initLanguage();
    setupEventListeners();
});
