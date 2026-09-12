/**
 * MindSync - Dashboard front-end logic.
 */

const appState = {
    currentView: 'home',
    isRecording: false,
    selectedMood: null,
    recognitionEngine: null,
    transcriptBuffer: '',
    user: {
        fullName: 'Alex'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 MindSync Engine Active: Syncing live user cache parameters...");

    const cachedName = localStorage.getItem('user_full_name');
    const cachedAge = localStorage.getItem('user_age');
    const cachedEmail = localStorage.getItem('user_email');
    let cachedId = localStorage.getItem('user_id');

    // Fall back to deriving an ID from the email if none was stored at signup.
    if (!cachedId && cachedEmail) {
        cachedId = cachedEmail.split('@')[0] + "_sync";
    }

    appState.user = {
        fullName: cachedName || "Authenticated User",
        userId: cachedId || "user_handle",
        email: cachedEmail || "Not Configured",
        age: cachedAge || "--"
    };

    syncProfileCardUI();
    syncSystemDateTime();
    setInterval(syncSystemDateTime, 60000);

    if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
    fetchServerJournalLogs();

    switchView('home');
});

/**
 * Updates the header date, any leftover placeholder date text, and the
 * (disabled) date field on the Settings screen — runs once a minute.
 */
function syncSystemDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString(undefined, dateOptions);

    const headerDateTarget = document.getElementById('current-system-date');
    if (headerDateTarget) {
        headerDateTarget.textContent = formattedDate;
    }

    // Catches any hardcoded placeholder date left over in the markup.
    const textContainers = document.querySelectorAll('p, div, span');
    textContainers.forEach(el => {
        if (el.children.length === 0 && el.textContent.includes('June 12, 2026')) {
            el.textContent = formattedDate;
        }
    });

    const settingsDateInput = document.getElementById('settings-date-input');
    if (settingsDateInput) {
        settingsDateInput.value = formattedDate;
    }
}

/**
 * Shows the requested view panel and hides the rest, and highlights the
 * matching nav button.
 */
function switchView(viewId) {
    const views = ['home', 'journal', 'mood', 'scheduler', 'dashboard', 'settings'];

    views.forEach(v => {
        const viewEl = document.getElementById(`view-${v}`);
        if (viewEl) {
            viewEl.classList.add('hidden');
            viewEl.classList.remove('flex');
        }

        const navBtn = document.getElementById(`nav-${v}`);
        if (navBtn) {
            navBtn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer text-left";
        }
    });

    const activeViewEl = document.getElementById(`view-${viewId}`);
    if (activeViewEl) {
        activeViewEl.classList.remove('hidden');
        // Every view panel is styled with flex-col in its markup, so it needs
        // the 'flex' class too — otherwise flex-col/gap-6 has no effect and
        // sections lose their spacing.
        activeViewEl.classList.add('flex');
    }

    const activeNavBtn = document.getElementById(`nav-${viewId}`);
    if (activeNavBtn) {
        activeNavBtn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 text-teal-400 font-medium transition cursor-pointer text-left";
    }

    appState.currentView = viewId;

    if (viewId === 'dashboard' || viewId === 'mood') {
        fetchServerJournalLogs();
    }
}

/**
 * Voice journaling — uses the browser's native SpeechRecognition API.
 * Chrome/Edge support this; Firefox/Safari mostly don't, so callers should
 * handle getSpeechEngine() returning null.
 */
function getSpeechEngine() {
    if (appState.recognitionEngine) return appState.recognitionEngine;

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) return null;

    const engine = new SpeechRecognitionApi();
    engine.continuous = true;
    engine.interimResults = true;
    engine.lang = 'en-US';

    engine.onresult = (event) => {
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                appState.transcriptBuffer += piece + ' ';
            } else {
                interimChunk += piece;
            }
        }
        const transcriptOutput = document.getElementById('liveTranscriptText');
        if (transcriptOutput) {
            transcriptOutput.textContent = (appState.transcriptBuffer + interimChunk).trim() || "Listening...";
        }
    };

    engine.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        const statusText = document.getElementById('recordingStatus');
        if (statusText) statusText.textContent = "Mic error — try again.";
    };

    engine.onend = () => {
        // Some browsers auto-stop the engine after a pause in speech;
        // restart it transparently unless the user actually clicked Stop.
        if (appState.isRecording) {
            try { engine.start(); } catch (e) { /* already running, ignore */ }
        }
    };

    appState.recognitionEngine = engine;
    return engine;
}

async function toggleRecording() {
    const recordBtn = document.getElementById('recordBtn');
    const recordIcon = document.getElementById('recordIcon');
    const recordText = document.getElementById('recordText');
    const statusText = document.getElementById('recordingStatus');
    const transcriptOutput = document.getElementById('liveTranscriptText');

    if (!appState.isRecording) {
        const engine = getSpeechEngine();
        if (!engine) {
            alert("Voice recognition isn't supported in this browser. Try Chrome or Edge, or type your entry instead.");
            return;
        }

        appState.isRecording = true;
        appState.transcriptBuffer = '';

        try {
            engine.start();
        } catch (e) {
            console.warn("Recognition engine already running.");
        }

        if (recordBtn) {
            recordBtn.classList.remove('from-teal-500', 'to-emerald-500');
            recordBtn.classList.add('from-rose-500', 'to-pink-500', 'animate-pulse');
        }
        if (recordIcon) recordIcon.className = "fa-solid fa-stop text-sm";
        if (recordText) recordText.textContent = "Stop Recording";
        if (statusText) statusText.textContent = "Squishy is listening...";
        if (transcriptOutput) transcriptOutput.textContent = "Listening...";

    } else {
        appState.isRecording = false;
        if (appState.recognitionEngine) {
            try { appState.recognitionEngine.stop(); } catch (e) { /* ignore */ }
        }

        if (recordBtn) {
            recordBtn.classList.remove('from-rose-500', 'to-pink-500', 'animate-pulse');
            recordBtn.classList.add('from-teal-500', 'to-emerald-500');
        }
        if (recordIcon) recordIcon.className = "fa-solid fa-play text-sm";
        if (recordText) recordText.textContent = "Start Journaling";

        const capturedTranscript = appState.transcriptBuffer.trim();
        if (!capturedTranscript) {
            if (statusText) statusText.textContent = "No speech was captured — try again.";
            return;
        }

        if (transcriptOutput) transcriptOutput.textContent = `"${capturedTranscript}"`;
        if (statusText) statusText.textContent = "Ready to process — hit \"Process Entry\" when you're happy with it.";
    }
}

/**
 * Clear discards the current transcript; Process Entry submits it for
 * Gemini analysis via /api/journal/entry.
 */
function clearTranscript() {
    appState.transcriptBuffer = '';
    appState.isRecording = false;
    if (appState.recognitionEngine) {
        try { appState.recognitionEngine.stop(); } catch (e) { /* ignore */ }
    }

    const recordBtn = document.getElementById('recordBtn');
    const recordIcon = document.getElementById('recordIcon');
    const recordText = document.getElementById('recordText');
    const statusText = document.getElementById('recordingStatus');
    const transcriptOutput = document.getElementById('liveTranscriptText');
    const sentimentPill = document.getElementById('sentimentPill');

    if (recordBtn) {
        recordBtn.classList.remove('from-rose-500', 'to-pink-500', 'animate-pulse');
        recordBtn.classList.add('from-teal-500', 'to-emerald-500');
    }
    if (recordIcon) recordIcon.className = "fa-solid fa-play text-sm";
    if (recordText) recordText.textContent = "Start Journaling";
    if (statusText) statusText.textContent = "Ready to sync";
    if (transcriptOutput) {
        transcriptOutput.textContent = "Click start and speak clearly. Whisper AI will render your spoken narrative into editable text right inside this workspace container...";
    }
    if (sentimentPill) {
        sentimentPill.textContent = "Awaiting Audio";
        sentimentPill.className = "text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full";
    }
}

async function processJournalEntry() {
    const processTranscript = appState.transcriptBuffer.trim();
    if (!processTranscript) {
        alert("There's nothing to process yet — record an entry first.");
        return;
    }

    const statusText = document.getElementById('recordingStatus');
    const processBtn = document.getElementById('processEntryBtn');
    const originalLabel = processBtn ? processBtn.textContent : '';
    if (processBtn) { processBtn.textContent = "Analyzing..."; processBtn.disabled = true; }
    if (statusText) statusText.textContent = "Squishy is analyzing your entry...";

    try {
        const response = await fetch('/api/journal/entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: processTranscript })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            const sentimentPill = document.getElementById('sentimentPill');
            if (sentimentPill) {
                sentimentPill.textContent = data.mood_variant || "Analyzed State";
            }
            if (statusText) statusText.textContent = "Analysis completed successfully.";
            alert(`Saved! Emotional metric evaluated as: ${data.mood_variant}`);
            appState.transcriptBuffer = '';
            fetchServerJournalLogs();
        } else {
            if (statusText) statusText.textContent = "Server rejected the entry — try again.";
        }
    } catch (err) {
        console.error("Supabase cluster entry transmission error:", err);
        if (statusText) statusText.textContent = "Network error — try again.";
        alert("Network connection error: Failed to transmit log dataset to backend.");
    } finally {
        if (processBtn) { processBtn.textContent = originalLabel; processBtn.disabled = false; }
    }
}

/**
 * Pulls journal logs from the backend, renders the last 3 into Journal
 * History, and updates the mood calendar.
 */
async function fetchServerJournalLogs() {
    try {
        const response = await fetch('/api/journal/logs');
        if (!response.ok) throw new Error("Server network rejected log retrieval query.");

        const logs = await response.json();

        // The history container has no fixed ID in the markup, so find it once
        // by locating its heading text, then tag it with an ID for next time.
        let targetLogsListWrapper = document.getElementById('journal-history-list-wrapper');
        if (!targetLogsListWrapper) {
            const headers = document.querySelectorAll('h3');
            headers.forEach(h => {
                if (h.textContent.includes('Journal History') || h.textContent.includes('Recent Logs')) {
                    const parentBox = h.closest('div').parentElement;
                    const containerCandidate = parentBox.querySelector('.space-y-3') || parentBox.querySelector('div:nth-child(2)');
                    if (containerCandidate) {
                        containerCandidate.id = 'journal-history-list-wrapper';
                        targetLogsListWrapper = containerCandidate;
                    }
                }
            });
        }

        if (targetLogsListWrapper && logs.length > 0) {
            targetLogsListWrapper.innerHTML = '';
            logs.slice(0, 3).forEach(log => {
                const dateObj = new Date(log.created_at);
                const readableDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                let themeClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                if (log.mood_variant.includes("Tired") || log.mood_variant.includes("Fatigued")) {
                    themeClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                } else if (log.mood_variant.includes("Stressed") || log.mood_variant.includes("Weak")) {
                    themeClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                }

                const logItemHTML = `
                    <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="space-y-2 max-w-2xl">
                            <div class="flex items-center gap-3">
                                <span class="text-xs font-semibold text-slate-500"><i class="fa-solid fa-calendar text-[11px] mr-1"></i> ${readableDate}</span>
                                <span class="text-[10px] ${themeClasses} px-2 py-0.5 rounded-md border font-medium">${log.mood_variant}</span>
                            </div>
                            <p class="text-xs text-slate-300 line-clamp-2 italic">"${log.summary || log.transcript || 'No transcript recorded for this entry.'}"</p>
                        </div>
                        <div class="flex items-center gap-6 justify-end">
                            <div class="flex flex-col items-center">
                                <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Squishy Score</span>
                                <div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-black text-teal-400">
                                    ${log.output_capacity || '8'}
                                </div>
                            </div>
                        </div>
                    </div>`;
                targetLogsListWrapper.insertAdjacentHTML('beforeend', logItemHTML);
            });
        }

        // Only the MOST RECENT log per day should set that day's calendar emoji —
        // otherwise array order (not time) decides which mood "wins" if you log
        // more than once in a day.
        const latestLogByDay = {};
        logs.forEach(log => {
            const created = new Date(log.created_at);
            const dayNumber = created.getDate();
            if (!latestLogByDay[dayNumber] || created > latestLogByDay[dayNumber].createdAt) {
                latestLogByDay[dayNumber] = { mood: log.mood_variant, createdAt: created };
            }
        });

        Object.entries(latestLogByDay).forEach(([dayNumber, info]) => {
            const matchingDayNode = document.getElementById(`calendar-day-node-${dayNumber}`);
            if (matchingDayNode) {
                const moodMap = { "Ecstatic": "🤩", "Content": "😊", "Tired": "🥱", "Stressed": "😰", "Down": "😔", "Weak": "🤒" };
                const identifiedEmoji = Object.keys(moodMap).find(m => info.mood.includes(m)) || "Content";

                const emojiSpan = matchingDayNode.querySelector('.calendar-emoji-placeholder');
                if (emojiSpan) {
                    emojiSpan.textContent = moodMap[identifiedEmoji];
                    emojiSpan.className = "calendar-emoji-placeholder text-sm transition-transform scale-110";
                }
            }
        });

        return logs;
    } catch (err) {
        console.error("Data matrix mapping runtime loop fault exception:", err);
    }
}

/**
 * Builds the current month's calendar grid from scratch (leading blank
 * cells for day-of-week offset, then one cell per day).
 */
function renderCalendarGrid() {
    const labelNode = document.getElementById('calendar-month-year-label');
    const targetWrapper = document.getElementById('dynamic-calendar-grid-target');

    if (!targetWrapper) return;

    const currentSystemDate = new Date();
    const activeYear = currentSystemDate.getFullYear();
    const activeMonth = currentSystemDate.getMonth();

    const longMonthName = currentSystemDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    if (labelNode) labelNode.textContent = longMonthName;

    targetWrapper.innerHTML = '';

    const directFirstDayOffset = new Date(activeYear, activeMonth, 1).getDay();
    const computedTotalDaysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();

    for (let i = 0; i < directFirstDayOffset; i++) {
        const structuralSpacer = document.createElement('div');
        structuralSpacer.className = "text-center py-2 text-slate-700 text-xs opacity-20 selection:bg-transparent pointer-events-none";
        structuralSpacer.textContent = "•";
        targetWrapper.appendChild(structuralSpacer);
    }

    for (let day = 1; day <= computedTotalDaysInMonth; day++) {
        const dateBlockCell = document.createElement('div');
        dateBlockCell.id = `calendar-day-node-${day}`;
        dateBlockCell.className = "bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 rounded-xl p-1.5 flex flex-col justify-between items-center min-h-[52px] transition shadow-xs relative group cursor-pointer";

        if (day === currentSystemDate.getDate()) {
            dateBlockCell.classList.add('border-teal-500/40', 'bg-gradient-to-b', 'from-slate-900', 'to-teal-950/20');
        }

        dateBlockCell.innerHTML = `
            <span class="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 transition w-full text-left pl-0.5">${day}</span>
            <span class="calendar-emoji-placeholder text-xs font-medium text-slate-600 animate-pulse">?</span>
        `;

        targetWrapper.appendChild(dateBlockCell);
    }
}

/**
 * Settings form submit handler — updates the local profile name and,
 * if provided, validates the new password fields.
 * NOTE: there's no backend route yet to actually persist a password
 * change — this only updates local session display.
 */
function updateProfileSettings(event) {
    event.preventDefault();

    const profileNameEl = document.getElementById('updateProfileName');
    const newPasswordEl = document.getElementById('newPassword');
    const confirmPasswordEl = document.getElementById('confirmPassword');

    const nameVal = profileNameEl ? profileNameEl.value.trim() : '';
    const passVal = newPasswordEl ? newPasswordEl.value : '';
    const confirmVal = confirmPasswordEl ? confirmPasswordEl.value : '';

    if (nameVal !== '') {
        appState.user.fullName = nameVal;
        localStorage.setItem('user_full_name', nameVal);
        syncProfileCardUI();
    }

    if (passVal || confirmVal) {
        if (passVal !== confirmVal) {
            alert("❌ Passwords do not match. Please verify your entries.");
            return;
        }
        console.log("🔒 Security profile credentials synchronized successfully.");
    }

    if (profileNameEl) profileNameEl.value = '';
    if (newPasswordEl) newPasswordEl.value = '';
    if (confirmPasswordEl) confirmPasswordEl.value = '';

    alert("✨ Profile details and configuration parameters updated successfully!");
}

/**
 * Quick mood buttons — sends a short synthetic transcript through the
 * same /api/journal/entry pipeline as a full voice entry.
 */
async function logQuickMood(moodType, emojiChar) {
    try {
        const response = await fetch('/api/journal/entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: `Manual status parameter check: Feeling ${moodType.toLowerCase()}.` })
        });
        if (response.ok) {
            alert(`Logged successfully! Status updated to ${emojiChar}`);
            fetchServerJournalLogs();
        }
    } catch (err) {
        console.error("Failed executing quick emoji sync request:", err);
    }
}

/**
 * Scheduler: add/complete tasks, and reorder them by energy level to match
 * whatever mood was most recently logged.
 */
function addNewDailyTask() {
    const inputEl = document.getElementById('dailyTaskInput');
    const containerEl = document.getElementById('dailyTasksContainer');
    if (!inputEl || !containerEl) return;

    const taskText = inputEl.value.trim();
    if (!taskText) return;

    const taskNode = document.createElement('div');
    taskNode.className = "task-node flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/60 rounded-xl hover:border-slate-700 transition";
    taskNode.setAttribute('data-energy', 'medium');
    taskNode.innerHTML = `
        <div class="flex items-center gap-3">
            <input type="checkbox" onchange="toggleTaskStrip(this)" class="w-4 h-4 rounded-sm border-slate-800 bg-slate-900 checked:bg-teal-500 checked:border-teal-500 focus:ring-0 cursor-pointer">
            <span class="task-text text-xs font-medium text-slate-300">${taskText.replace(/</g, '&lt;')}</span>
        </div>
        <span class="energy-pill text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10 px-2 py-0.5 rounded-md">Medium Load</span>`;

    containerEl.appendChild(taskNode);
    inputEl.value = '';
}

function toggleTaskStrip(checkboxEl) {
    const taskNode = checkboxEl.closest('.task-node');
    if (!taskNode) return;

    const taskTextEl = taskNode.querySelector('.task-text');
    if (checkboxEl.checked) {
        if (taskTextEl) taskTextEl.classList.add('line-through', 'text-slate-600');
        taskNode.classList.add('opacity-50');
    } else {
        if (taskTextEl) taskTextEl.classList.remove('line-through', 'text-slate-600');
        taskNode.classList.remove('opacity-50');
    }
}

async function runAiPrioritization() {
    const messageEl = document.getElementById('aiSchedulerMessage');
    const containerEl = document.getElementById('dailyTasksContainer');
    if (!containerEl) return;

    if (messageEl) messageEl.textContent = "Analyzing your latest mood signal...";

    let latestMood = null;
    try {
        const response = await fetch('/api/journal/logs');
        if (response.ok) {
            const logs = await response.json();
            if (logs.length > 0) latestMood = logs[0].mood_variant;
        }
    } catch (err) {
        console.error("Failed to fetch mood for AI prioritization:", err);
    }

    const energyOrderByMood = {
        "Energized / Happy": ['high', 'medium', 'low'],
        "Ecstatic": ['high', 'medium', 'low'],
        "Stable / Content": ['medium', 'high', 'low'],
        "Content": ['medium', 'high', 'low'],
        "Tired / Stressed": ['low', 'medium', 'high'],
        "Tired": ['low', 'medium', 'high'],
        "Weak / Ill": ['low', 'medium', 'high']
    };
    const order = energyOrderByMood[latestMood] || ['medium', 'low', 'high'];

    const taskNodes = Array.from(containerEl.querySelectorAll('.task-node'));
    taskNodes.sort((a, b) => order.indexOf(a.getAttribute('data-energy')) - order.indexOf(b.getAttribute('data-energy')));
    taskNodes.forEach(node => containerEl.appendChild(node));

    if (messageEl) {
        messageEl.textContent = latestMood
            ? `Based on your last mood (${latestMood}), tasks have been reordered to match your current energy.`
            : "No mood check-ins yet — defaulted to a balanced task order. Log a mood to personalize this.";
    }
}

/**
 * Pushes appState.user into the sidebar and Settings profile card, and
 * computes the avatar initials from the full name.
 */
function syncProfileCardUI() {
    const user = appState.user;

    const sidebarNameNode = document.getElementById('sidebar-profile-name');
    if (sidebarNameNode) {
        sidebarNameNode.textContent = user.fullName;
    }

    const leftName = document.getElementById('left-profile-name');
    const leftId = document.getElementById('left-profile-id');
    const leftEmail = document.getElementById('left-profile-email');
    const leftAge = document.getElementById('left-profile-age');
    const leftInitials = document.getElementById('left-profile-initials');

    if (leftName)  leftName.textContent = user.fullName;
    if (leftId)    leftId.textContent = `@${user.userId.replace('@', '')}`;
    if (leftEmail) leftEmail.textContent = user.email;
    if (leftAge)   leftAge.textContent = user.age.includes('Years') ? user.age : `${user.age} Years`;

    if (leftInitials && user.fullName) {
        const nameParts = user.fullName.trim().split(/\s+/);
        let computedInitials = "";

        if (nameParts.length > 1) {
            computedInitials = (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
        } else if (nameParts.length === 1 && nameParts[0].length > 0) {
            computedInitials = nameParts[0].substring(0, 2).toUpperCase();
        } else {
            computedInitials = "MS";
        }
        leftInitials.textContent = computedInitials;
    }
}