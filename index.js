// State Variables
let questions = [];
let currentIndex = 0;
let userAnswers = {}; // Maps index to selected answer index (array of single index)
let starredQuestions = {}; // Maps index to boolean (starred/bookmarked)
let resolvedQuestions = {}; // Maps index to boolean (whether "Auflösung" was clicked for this question)
let timeLeft = 2700; // 45 minutes in seconds
let timerInterval = null;
let reviewMode = false;
let isSubmitted = false;

// Localization Variables
let currentLang = 'de';
let currentLocaleData = null;
let copilotQuestionsPool = [];

// Helper: Shuffle Array (Fisher-Yates)
function shuffle(array) {
    let copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Fetch and load localization data
async function loadLanguage(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load locale file: locales/${lang}.json`);
        }
        const data = await response.json();
        
        currentLang = lang;
        currentLocaleData = data;
        copilotQuestionsPool = data.questions;
        
        // Update DOM attributes
        document.documentElement.lang = lang;
        document.title = data.ui.title;
        
        // Translate elements using data-i18n
        updateDOMTranslations();
        
        // Update active class on flag buttons
        document.querySelectorAll(".lang-btn").forEach(btn => {
            if (btn.getAttribute("data-lang") === lang) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
        
        // Save language preference
        localStorage.setItem("preferred_language", lang);
        
        // Update loading status box
        const statusBox = document.getElementById("db-load-status");
        const statusText = document.querySelector("#db-load-status .status-text");
        const startBtn = document.getElementById("start-exam-btn");
        if (statusBox && statusText && startBtn) {
            statusBox.classList.add("loaded");
            statusText.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${data.ui.dbLoaded.replace('{count}', copilotQuestionsPool.length)}`;
            startBtn.disabled = false;
        }
        
    } catch (error) {
        console.error("Error loading language:", error);
    }
}

function getTranslationValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function updateDOMTranslations() {
    if (!currentLocaleData) return;
    
    // Translate texts
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        let val = getTranslationValue(currentLocaleData, key);
        if (val !== undefined) {
            if (key === "ui.infoQuestions") {
                val = val.replace("{count}", copilotQuestionsPool.length || 29);
            }
            el.innerHTML = val;
        }
    });
    
    // Translate titles
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        const val = getTranslationValue(currentLocaleData, key);
        if (val !== undefined) {
            el.title = val;
        }
    });
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    initLanguage();
    setupEventListeners();
});

// Initialize language preference
function initLanguage() {
    // 1. Check localStorage
    let lang = localStorage.getItem("preferred_language");
    
    // 2. Check browser settings
    if (!lang) {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.startsWith("de")) {
            lang = "de";
        } else if (browserLang && browserLang.startsWith("en")) {
            lang = "en";
        } else {
            lang = "de"; // default language
        }
    }
    
    loadLanguage(lang);
}

// Setup Event Listeners
function setupEventListeners() {
    // Language buttons
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const selectedLang = e.currentTarget.getAttribute("data-lang");
            loadLanguage(selectedLang);
        });
    });

    // Welcome / Reset Buttons
    document.getElementById("start-exam-btn").addEventListener("click", startExam);
    document.getElementById("restart-exam-btn").addEventListener("click", restartExam);

    // Header buttons
    document.getElementById("abort-btn").addEventListener("click", confirmAbort);



    // Footer actions
    document.getElementById("btn-cancel").addEventListener("click", confirmAbort);
    document.getElementById("btn-star").addEventListener("click", toggleStar);

    // Main Weiter button above footer
    const btnNextMain = document.getElementById("btn-next-main");
    if (btnNextMain) {
        btnNextMain.addEventListener("click", () => {
            if (currentIndex < questions.length - 1) {
                loadQuestion(currentIndex + 1, true);
            } else if (!reviewMode) {
                openSubmitModal();
            } else {
                showResultScreen();
            }
        });
    }

    // Question Dropdown for Main
    const dropdown = document.getElementById("question-dropdown-main");
    if (dropdown) {
        dropdown.addEventListener("change", (e) => {
            loadQuestion(parseInt(e.target.value), true);
        });
    }

    // Submit dialog modal
    document.getElementById("modal-cancel-btn").addEventListener("click", closeSubmitModal);
    document.getElementById("modal-confirm-btn").addEventListener("click", submitExam);
    document.getElementById("submit-modal").addEventListener("click", (e) => {
        if (e.target.id === "submit-modal") closeSubmitModal();
    });

    // Legal Disclaimer modal
    const openLegalBtn = document.getElementById("open-legal-modal-btn");
    if (openLegalBtn) {
        openLegalBtn.addEventListener("click", openLegalModal);
    }
    const closeLegalBtn = document.getElementById("close-legal-modal-btn");
    if (closeLegalBtn) {
        closeLegalBtn.addEventListener("click", closeLegalModal);
    }
    const closeLegalX = document.getElementById("close-legal-modal-x");
    if (closeLegalX) {
        closeLegalX.addEventListener("click", closeLegalModal);
    }
    const legalModal = document.getElementById("legal-modal");
    if (legalModal) {
        legalModal.addEventListener("click", (e) => {
            if (e.target.id === "legal-modal") closeLegalModal();
        });
    }

    // Results screen
    document.getElementById("review-answers-btn").addEventListener("click", enterReviewMode);
}

// Start Quiz Session
function startExam() {
    currentIndex = 0;
    userAnswers = {};
    starredQuestions = {};
    resolvedQuestions = {};
    timeLeft = 2700;
    reviewMode = false;
    isSubmitted = false;

    // Load all questions from the Copilot pool in shuffled order
    let selectedQs = shuffle(copilotQuestionsPool);
    
    // For each selected question, clone it and shuffle its answers
    questions = selectedQs.map(q => {
        return {
            number: q.number,
            points: q.points,
            text: q.text,
            picture: q.picture,
            image: q.image,
            pictureDesc: q.pictureDesc,
            isVideo: q.isVideo,
            answers: shuffle(q.answers) // Shuffle answers so correct one is not always A
        };
    });

    document.getElementById("intro-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");

    buildNavigationFooter();
    loadQuestion(0, true);
    
    // Timer setup
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
        document.getElementById("quiz-screen").classList.add("hidden");
        document.getElementById("intro-screen").classList.remove("hidden");
    } else {
        const msg = currentLang === 'de' 
            ? "Möchten Sie die Prüfung abbrechen? Ihr Fortschritt wird gelöscht." 
            : "Do you want to cancel the exam? Your progress will be lost.";
        if (confirm(msg)) {
            clearInterval(timerInterval);
            document.getElementById("quiz-screen").classList.add("hidden");
            document.getElementById("intro-screen").classList.remove("hidden");
        }
    }
}

function restartExam() {
    startExam();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const display = document.getElementById("timer-display-header");
    display.textContent = formatted;

    if (timeLeft < 300) {
        display.classList.add("timer-warning");
    } else {
        display.classList.remove("timer-warning");
    }
}

// Load Question at Index
function loadQuestion(index, scrollToTop = false) {
    currentIndex = index;
    const q = questions[index];

    // Scroll canvas to top only if explicitly requested
    if (scrollToTop) {
        const canvas = document.querySelector(".quiz-canvas");
        if (canvas) {
            canvas.scrollTop = 0;
        }
    }

    // Meta updates
    const labelPrefix = currentLocaleData.ui.questionLabel;
    document.getElementById("question-id").textContent = `${labelPrefix} ${index + 1}`;
    
    // Sync dropdown
    const dropdown = document.getElementById("question-dropdown-main");
    if (dropdown) {
        dropdown.value = index;
    }
    document.getElementById("current-q-points").textContent = q.points;
    document.getElementById("question-text").textContent = q.text;

    // Media Blueprint boxes
    const filenameLabel = document.getElementById("media-filename");
    const descLabel = document.getElementById("media-description");
    const mediaBox = document.getElementById("exam-media-box");
    const blueprintInfo = mediaBox.querySelector(".blueprint-info");
    const blueprintElements = mediaBox.querySelectorAll(".blueprint-lines, .blueprint-mirror, .blueprint-speedometer, .blueprint-steering-wheel, .blueprint-road-path");

    // Remove any existing real image
    const existingImg = mediaBox.querySelector(".real-question-image");
    if (existingImg) existingImg.remove();

    if (q.image) {
        // Show real image
        const img = document.createElement("img");
        img.src = q.image;
        img.alt = q.pictureDesc || (currentLang === 'de' ? "Situationsbild" : "Situation image");
        img.className = "real-question-image";
        img.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:5;";
        mediaBox.appendChild(img);
        // Hide blueprint elements
        blueprintInfo.style.display = "none";
        blueprintElements.forEach(el => el.style.display = "none");
        mediaBox.style.backgroundColor = "#000";
    } else if (q.picture) {
        // Show blueprint placeholder
        blueprintInfo.style.display = "";
        blueprintElements.forEach(el => el.style.display = "");
        filenameLabel.textContent = q.picture;
        descLabel.textContent = q.pictureDesc || (currentLang === 'de' ? "Situationsbild zur aktuellen Prüfungsfrage." : "Situation image for the current exam question.");
        mediaBox.style.backgroundColor = "#111e29"; // Blueprint blue
    } else {
        blueprintInfo.style.display = "";
        blueprintElements.forEach(el => el.style.display = "");
        filenameLabel.textContent = currentLang === 'de' ? "Kein Bild" : "No image";
        descLabel.textContent = currentLang === 'de' 
            ? "Für diese Frage ist kein Bild erforderlich. Antworten Sie anhand der Textbeschreibung."
            : "No image is required for this question. Answer based on the text description.";
        mediaBox.style.backgroundColor = "#0f171e"; // Dark slate
    }


    // Star state
    const starBtn = document.getElementById("btn-star");
    if (starredQuestions[index]) {
        starBtn.classList.add("starred");
        starBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
    } else {
        starBtn.classList.remove("starred");
        starBtn.innerHTML = '<i class="fa-regular fa-star"></i>';
    }

    // Answers Column
    const answersContainer = document.getElementById("answers-container");
    answersContainer.innerHTML = "";

    const isResolved = reviewMode;

    // Render Multiple-Choice options with dynamic A), B), C), D) prefixes
    q.answers.forEach((ans, aIdx) => {
        const option = document.createElement("div");
        option.className = "answer-option";

        const isSelected = userAnswers[index] && userAnswers[index].includes(aIdx);
        if (isSelected) option.classList.add("selected");

        // Convert index 0, 1, 2, 3 to A), B), C), D)
        const prefixLetter = String.fromCharCode(65 + aIdx) + ") ";

        option.innerHTML = `
            <div class="checkbox-square">
                <i class="fa-solid fa-check"></i>
            </div>
            <div class="answer-text">
                <span style="font-weight:bold;color:#002a46">${prefixLetter}</span>${ans.text}
            </div>
        `;

        if (isResolved) {
            const isCorrect = ans.correct;

            if (isCorrect) {
                if (isSelected) {
                    option.classList.add("correct-choice"); // Correctly selected
                } else {
                    option.classList.add("missed-choice"); // Missed correct answer
                }
            } else if (isSelected) {
                option.classList.add("incorrect-choice"); // Wrong selection
            }

            const badge = document.createElement("span");
            if (isCorrect) {
                badge.className = "review-badge-inline correct";
                badge.innerHTML = `<i class="fa-solid fa-check"></i> ${currentLocaleData.ui.tableStatusCorrect}`;
            } else {
                badge.className = "review-badge-inline incorrect";
                badge.innerHTML = `<i class="fa-solid fa-xmark"></i> ${currentLocaleData.ui.tableStatusWrong}`;
            }
            option.querySelector(".answer-text").appendChild(badge);
        } else {
            option.addEventListener("click", () => {
                toggleAnswerSelection(index, aIdx);
                loadQuestion(index);
            });
        }

        answersContainer.appendChild(option);
    });



    // Update main Weiter button in the footer
    const btnNextMain = document.getElementById("btn-next-main");
    if (btnNextMain) {
        if (index === questions.length - 1) {
            if (reviewMode) {
                btnNextMain.textContent = currentLocaleData.ui.navEvaluation;
            } else {
                btnNextMain.textContent = currentLocaleData.ui.navSubmit;
            }
        } else {
            btnNextMain.textContent = currentLocaleData.ui.navNext;
        }
    }
}

// Single choice selection toggling
function toggleAnswerSelection(qIdx, aIdx) {
    userAnswers[qIdx] = [aIdx]; // Strictly single-choice: replaces any previous selections
    updateNavigationFooter();
}

// Star Bookmark Toggling
function toggleStar() {
    starredQuestions[currentIndex] = !starredQuestions[currentIndex];
    loadQuestion(currentIndex);
    updateNavigationFooter();
}

// Build Navigation Footer
function buildNavigationFooter() {
    const dropdown = document.getElementById("question-dropdown-main");
    if (dropdown) {
        dropdown.innerHTML = "";
        const labelPrefix = currentLocaleData.ui.questionLabel;
        for (let i = 0; i < questions.length; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = `${labelPrefix} ${i + 1}`;
            dropdown.appendChild(opt);
        }
    }
}

function updateNavigationFooter() {
    const dropdown = document.getElementById("question-dropdown-main");
    if (!dropdown) return;
    const options = dropdown.options;
    const labelPrefix = currentLocaleData.ui.questionLabel;
    
    for (let idx = 0; idx < questions.length; idx++) {
        const ans = userAnswers[idx];
        const isAnswered = ans !== undefined && ans.length > 0;
 
        if (options && options[idx]) {
            let label = `${labelPrefix} ${idx + 1}`;
            let symbols = [];
            if (starredQuestions[idx]) {
                symbols.push("★");
            }
            if (reviewMode) {
                const isCorrect = checkQuestionCorrectness(idx);
                symbols.push(isCorrect ? "✓" : "✗");
            } else if (isAnswered) {
                symbols.push("●");
            }
            if (symbols.length > 0) {
                label += ` [${symbols.join(" ")}]`;
            }
            options[idx].textContent = label;
        }
    }
}

// Submit Modal Confirmations
function openSubmitModal() {
    let answered = 0;
    for (let i = 0; i < questions.length; i++) {
        const ans = userAnswers[i];
        if (ans !== undefined && ans.length > 0) {
            answered++;
        }
    }

    document.getElementById("answered-count").textContent = `${answered}/${questions.length}`;
    document.getElementById("unanswered-count").textContent = questions.length - answered;
    document.getElementById("submit-modal").classList.remove("hidden");
}

function closeSubmitModal() {
    document.getElementById("submit-modal").classList.add("hidden");
}

function openLegalModal() {
    const modal = document.getElementById("legal-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeLegalModal() {
    const modal = document.getElementById("legal-modal");
    if (modal) modal.classList.add("hidden");
}

function autoSubmitExam() {
    alert(currentLang === 'de' ? "Prüfungszeit abgelaufen! Die Prüfung wird automatisch abgegeben." : "Exam time expired! The exam will be submitted automatically.");
    submitExam();
}

// Check Correctness for Question (Single choice correctness check)
function checkQuestionCorrectness(qIdx) {
    const q = questions[qIdx];
    const userAns = userAnswers[qIdx];

    if (!userAns || userAns.length === 0) return false;

    const selectedIdx = userAns[0];
    return q.answers[selectedIdx].correct === true;
}

// Submit Quiz and show Results
function submitExam() {
    clearInterval(timerInterval);
    closeSubmitModal();
    isSubmitted = true;
 
    let totalErrorPoints = 0;
    let wrongQuestionsCount = 0;
    let detailsRows = "";
 
    const labelPrefix = currentLocaleData.ui.questionLabel;
    questions.forEach((q, idx) => {
        const isCorrect = checkQuestionCorrectness(idx);
        let errorPoints = 0;
        let statusHtml = "";
 
        if (isCorrect) {
            statusHtml = `<span class="badge-status correct"><i class="fa-solid fa-circle-check"></i> ${currentLocaleData.ui.tableStatusCorrect}</span>`;
        } else {
            errorPoints = q.points;
            totalErrorPoints += q.points;
            wrongQuestionsCount++;
            statusHtml = `<span class="badge-status incorrect"><i class="fa-solid fa-circle-xmark"></i> ${currentLocaleData.ui.tableStatusWrong}</span>`;
        }
 
        detailsRows += `
            <tr>
                <td>${labelPrefix} ${idx + 1}</td>
                <td>${q.points}</td>
                <td style="color:${errorPoints > 0 ? '#b32117' : 'inherit'}; font-weight:${errorPoints > 0 ? 'bold' : 'normal'}">${errorPoints}</td>
                <td>${statusHtml}</td>
            </tr>
        `;
    });
 
    // Pass standard: Max 10 error points allowed
    const isPassed = totalErrorPoints <= 10;
    
    const badge = document.getElementById("result-badge");
    badge.className = "result-badge " + (isPassed ? "success" : "danger");
    badge.innerHTML = isPassed 
        ? `<i class="fa-solid fa-circle-check"></i> <span>${currentLocaleData.ui.passedBadge}</span>`
        : `<i class="fa-solid fa-circle-xmark"></i> <span>${currentLocaleData.ui.failedBadge}</span>`;
 
    document.getElementById("res-error-points").textContent = totalErrorPoints;
    document.getElementById("res-wrong-count").textContent = `${wrongQuestionsCount} / ${questions.length}`;
    document.getElementById("res-wrong-pct").textContent = currentLocaleData.ui.wrongPctLabel.replace("{pct}", Math.round((wrongQuestionsCount / questions.length) * 100));
 
    const minutesLeft = Math.floor(timeLeft / 60);
    const secondsLeft = timeLeft % 60;
    document.getElementById("res-time-left").textContent = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
 
    document.getElementById("results-table-body").innerHTML = detailsRows;
 
    document.getElementById("quiz-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
}

// Enter Review/Correction Mode
function enterReviewMode() {
    reviewMode = true;
    currentIndex = 0;
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");
    
    document.getElementById("abort-btn").innerHTML = '<i class="fa-solid fa-home"></i>';
    document.getElementById("abort-btn").title = "Prüfung beenden";

    loadQuestion(0, true);
    updateNavigationFooter();
}
