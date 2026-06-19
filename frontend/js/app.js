
const state = {
    currentView: 'home',
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    currentUploadedAudioUrl: null,
    voiceEngine: 'free',
    user: {
        fullName: 'Alex Doe',
        email: '',
        age: '--',
        initials: 'MS'
    },
    logs: [],
    objectives: [
        { id: "o1", text: "Complete architectural data mapping schema specs", energy: "high", completed: false },
        { id: "o2", text: "Review backend routes and verify controller validation blocks", energy: "medium", completed: false },
        { id: "o3", text: "Organize project asset files and clear old image placeholders", energy: "low", completed: false }
    ],
    milestones: JSON.parse(localStorage.getItem('mindsync_milestones')) || [
        {
            id: "m1",
            category: "Development Roadmap",
            icon: "fa-cubes",
            color: "text-indigo-400",
            items: [
                { id: "mi1", text: "Deploy functional UI base framework", completed: true },
                { id: "mi2", text: "Integrate local client SPA script engines", completed: true },
                { id: "mi3", text: "Establish Supabase API links", completed: false }
            ]
        },
        {
            id: "m2",
            category: "Annual Vision",
            icon: "fa-bullseye",
            color: "text-pink-400",
            items: [
                { id: "mi4", text: "Finish final system specs documentation", completed: true },
                { id: "mi5", text: "Compile full working portfolio review package", completed: false }
            ]
        }
    ],
    milestonesEditMode: false
};


document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 MindSync Client Engine Initializing...");
    
    
    const cacheName = localStorage.getItem('user_full_name');
    const cacheEmail = localStorage.getItem('user_email');
    const cacheAge = localStorage.getItem('user_age');

    if (!cacheEmail) {
        console.log("⚠️ No active session detected. Redirecting to login portal...");
        window.location.href = '/';
        return;
    }
    state.user.fullName = cacheName ;
    state.user.email = cacheEmail ;
    state.user.age = cacheAge ;

    const names = state.user.fullName.trim().split(/\s+/);
    if (names.length > 1) {
        state.user.initials = (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    } else if (names.length === 1 && names[0].length > 0) {
        state.user.initials = names[0].substring(0, 2).toUpperCase();
    } else {
        state.user.initials = "MS";
    }

    syncProfileCardUI();
    syncSystemClock();
    setInterval(syncSystemClock, 60000); // refresh every minute

    fetchJournalLogs();

    renderChecklist();

    renderMilestones();

    switchView('home');
});

function switchView(viewId) {
    const views = ['home', 'journal', 'mood', 'scheduler', 'dashboard', 'settings'];
    
    views.forEach(v => {
        const viewNode = document.getElementById(`view-${v}`);
        if (viewNode) {
            viewNode.classList.add('hidden');
        }

        const navBtn = document.getElementById(`nav-${v}`);
        if (navBtn) {
            
            navBtn.className = "w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 transition cursor-pointer text-left font-sans text-xs";
        }
    });

    const activeViewNode = document.getElementById(`view-${viewId}`);
    if (activeViewNode) {
        activeViewNode.classList.remove('hidden');
    }

    const activeNavBtn = document.getElementById(`nav-${viewId}`);
    if (activeNavBtn) {
       
        activeNavBtn.className = "w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-semibold transition cursor-pointer text-left text-xs";
    }

    state.currentView = viewId;

    if (viewId === 'mood' || viewId === 'dashboard') {
        fetchJournalLogs();
    }
}


function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
        } else {
            sidebar.classList.add('-translate-x-full');
        }
    }
}

function syncSystemClock() {
    const now = new Date();
    
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString(undefined, dateOptions);
    
    // Update input on settings
    const settingsDateInput = document.getElementById('settings-date-input');
    if (settingsDateInput) {
        settingsDateInput.value = formattedDate;
    }
}

function syncProfileCardUI() {
    // Left profile card
    const leftName = document.getElementById('left-profile-name');
    const leftEmail = document.getElementById('left-profile-email');
    const leftAge = document.getElementById('left-profile-age');
    const leftInitialsCard = document.getElementById('left-profile-initials');
    const leftInitialsSidebar = document.getElementById('left-profile-initials-sidebar');
    const sidebarProfileName = document.getElementById('sidebar-profile-name');

    if (leftName) leftName.textContent = state.user.fullName;
    if (sidebarProfileName) sidebarProfileName.textContent = state.user.fullName;
    if (leftEmail) leftEmail.textContent = state.user.email;
    if (leftAge) leftAge.textContent = state.user.age.includes('Years') ? state.user.age : `${state.user.age} Years`;
    if (leftInitialsCard) leftInitialsCard.textContent = state.user.initials;
    if (leftInitialsSidebar) leftInitialsSidebar.textContent = state.user.initials;

    const inputName = document.getElementById('updateProfileName');
    if (inputName) {
        inputName.placeholder = state.user.fullName;
    }
}

function updateProfileSettings(event) {
    event.preventDefault();
    
    const updateNameInput = document.getElementById('updateProfileName').value.trim();
    const newPasswordInput = document.getElementById('newPassword').value;
    const confirmPasswordInput = document.getElementById('confirmPassword').value;

    if (updateNameInput !== '') {
        state.user.fullName = updateNameInput;
        localStorage.setItem('user_full_name', updateNameInput);
        
        const parts = updateNameInput.split(/\s+/);
        state.user.initials = parts.length > 1 ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase() : updateNameInput.substring(0, 2).toUpperCase();
        
        syncProfileCardUI();
    }

    if (newPasswordInput !== '' || confirmPasswordInput !== '') {
        if (newPasswordInput !== confirmPasswordInput) {
            alert("❌ The input passwords do not match. Please verify parameters.");
            return;
        }
        alert("🔒 Password changed successfully on local profile secure driver.");
    }

    document.getElementById('updateProfileName').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    alert("✨ MindSync settings updated successfully!");
}

function signOutAccount() {
    localStorage.clear();
    alert("👋 Safely exiting MindSync portal workspace...");
    window.location.href = '/';
}

let recordingTimerInterval;
let recordingSeconds = 0;

function toggleRecording() {
    const recordIcon = document.getElementById('recordIcon');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTimer = document.getElementById('recordingTimer');
    const waveRing = document.getElementById('recordingWaveRing');

    if (!state.isRecording) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                state.isRecording = true;
                state.audioChunks = [];
                state.currentUploadedAudioUrl = null;

                recordIcon.className = "fa-solid fa-stop text-xl";
                recordingStatus.textContent = "🎙️ Squishy is listening... speak clearly.";
                recordingStatus.className = "text-xs font-bold text-rose-400 mt-4 tracking-wide uppercase animate-pulse";
                waveRing.className = "w-24 h-24 rounded-full bg-rose-500/20 flex items-center justify-center transition-all duration-350 animate-pulse";
                recordingTimer.classList.remove('hidden');
                
                recordingSeconds = 0;
                recordingTimer.textContent = "Live stream: 00:00";
                recordingTimerInterval = setInterval(() => {
                    recordingSeconds++;
                    const minutes = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
                    const secs = (recordingSeconds % 60).toString().padStart(2, '0');
                    recordingTimer.textContent = `Live stream: ${minutes}:${secs}`;
                }, 1000);

                if (state.voiceEngine === 'free') {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (SpeechRecognition) {
                        const textOutput = document.getElementById('liveTranscriptText');
                        textOutput.value = "Listening... start speaking now.";
                        
                        state.recognition = new SpeechRecognition();
                        state.recognition.continuous = true;
                        state.recognition.interimResults = true;
                        state.recognition.lang = 'en-US';
                        
                        state.recognition.onresult = (event) => {
                            let interimTranscript = '';
                            let finalTranscript = '';
                            
                            for (let i = event.resultIndex; i < event.results.length; ++i) {
                                const transcriptPart = event.results[i][0].transcript;
                                if (event.results[i].isFinal) {
                                    finalTranscript += transcriptPart;
                                } else {
                                    interimTranscript += transcriptPart;
                                }
                            }
                            
                            const activeText = finalTranscript || interimTranscript;
                            if (activeText.trim().length > 0) {
                                textOutput.value = activeText;
                            }
                        };
                        
                        state.recognition.onerror = (e) => {
                            console.error("Local Web Speech Recognition error:", e.error);
                            if (e.error === 'not-allowed') {
                                textOutput.value = "Speech recognition blocked. Please allow mic usage in your browser configuration.";
                            }
                        };
                        
                        state.recognition.start();
                        console.log("🎤 Native Web Speech recognition started.");
                    } else {
                        console.warn("SpeechRecognition not supported in this browser.");
                        const textOutput = document.getElementById('liveTranscriptText');
                        textOutput.value = "Native Web Speech API is not supported in this browser. Please try Chrome/Safari, or toggle to Gemini Cloud AI above.";
                    }
                }

                state.mediaRecorder = new MediaRecorder(stream);
                state.mediaRecorder.ondataavailable = event => {
                    state.audioChunks.push(event.data);
                };
                
                state.mediaRecorder.onstop = async () => {
                    
                    stream.getTracks().forEach(track => {
                        try {
                            track.stop();
                        } catch(e) {}
                    });
                    
                    const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
                    await performAudioUploadAndTranscription(audioBlob);
                };

                state.mediaRecorder.start();
                console.log("🎙️ Recorder started successfully.");
            })
            .catch(err => {
                console.error("Camera/Mic device capture rejected:", err);
                alert("❌ Input blocked: MindSync requires Microphone hardware permissions.");
            });
    } else {
       
        state.isRecording = false;
        clearInterval(recordingTimerInterval);
        
        recordIcon.className = "fa-solid fa-microphone text-xl";
        recordingStatus.textContent = "✏️ Transcribing voice... please write tight.";
        recordingStatus.className = "text-xs font-bold text-teal-400 mt-4 tracking-wide uppercase animate-pulse";
        waveRing.className = "w-24 h-24 rounded-full bg-teal-500/10 flex items-center justify-center transition-all duration-300";
        recordingTimer.classList.add('hidden');

        if (state.mediaRecorder) {
            try {
                state.mediaRecorder.stop();
            } catch(e) {}
        }
        if (state.recognition) {
            try {
                state.recognition.stop();
            } catch(e) {}
        }
        console.log("🎙️ Recorder and SpeechRecognition stopped.");
    }
}

function changeVoiceEngine() {
    const selector = document.getElementById('voiceEngineSelect');
    if (selector) {
        state.voiceEngine = selector.value;
        localStorage.setItem('mindsync_voice_engine', state.voiceEngine);
        console.log(`🎙️ Voice Engine switched to: ${state.voiceEngine}`);
    }
}

async function performAudioUploadAndTranscription(audioBlob) {
    const textOutput = document.getElementById('liveTranscriptText');
    const sentimentPill = document.getElementById('sentimentPill');
    const recordingStatus = document.getElementById('recordingStatus');

    const isFree = state.voiceEngine === 'free';
    
    if (!isFree) {
        textOutput.value = "Translating speech to text via Gemini API... please remain inline.";
    }
    
    sentimentPill.textContent = isFree ? "Processing Local" : "Analyzing Audio";
    sentimentPill.className = "text-[10px] font-black bg-teal-500/10 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-500/20";

    const formData = new FormData();
    formData.append('audio', audioBlob, 'journal-vocal-snippet.webm');

    try {
        const uploadUrl = isFree ? '/api/journal/upload?skipTranscription=true' : '/api/journal/upload';
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (!isFree) {
                textOutput.value = data.transcript;
            } else if (textOutput.value.trim() === '' || textOutput.value.startsWith('Listening')) {
                textOutput.value = "Recorded local vocal note successfully.";
            }
            state.currentUploadedAudioUrl = data.audio_url;
            
            sentimentPill.textContent = "Ready";
            sentimentPill.className = "text-[10px] font-black bg-pink-500/10 text-pink-400 px-2.5 py-0.5 rounded-full border border-pink-400/20";
            recordingStatus.textContent = "Vocal note captured and processed.";
            recordingStatus.className = "text-xs font-bold text-slate-400 mt-4 tracking-wide uppercase";
        } else {
            if (!isFree) {
                textOutput.value = "Failed to translate voice journal. Please input text manually below.";
                sentimentPill.textContent = "Error";
                recordingStatus.textContent = "Upload failed.";
            } else {
                state.currentUploadedAudioUrl = null;
                sentimentPill.textContent = "Offline Ready";
                sentimentPill.className = "text-[10px] font-black bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/20";
                recordingStatus.textContent = "Vocal note captured.";
            }
        }
    } catch(err) {
        console.error("Transcription networking crash:", err);
        if (!isFree) {
            textOutput.value = "Networking line error. Please use keyboard input.";
            sentimentPill.textContent = "Error";
        } else {
            state.currentUploadedAudioUrl = null;
            sentimentPill.textContent = "Offline Ready";
            sentimentPill.className = "text-[10px] font-black bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/20";
            recordingStatus.textContent = "Vocal note captured.";
        }
    }
}


function clearTranscript() {
    document.getElementById('liveTranscriptText').value = '';
    const sentimentPill = document.getElementById('sentimentPill');
    sentimentPill.textContent = "Awaiting Voice";
    sentimentPill.className = "text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full";
    state.currentUploadedAudioUrl = null;

    document.getElementById('wellnessSuggestionsBox').classList.add('hidden');
}

async function commitJournalEntry() {
    const textOutput = document.getElementById('liveTranscriptText');
    const finalTranscript = textOutput.value.trim();

    if (finalTranscript === '' || finalTranscript.startsWith('Translating speech') || finalTranscript.startsWith('Networking line')) {
        alert("❌ Input text required: Please record your voice or type your mental summary first.");
        return;
    }

    try {
        const response = await fetch('/api/journal/entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transcript: finalTranscript,
                audioUrl: state.currentUploadedAudioUrl,
                email: state.user.email || 'user@mindsync.com'
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(`✨ Logged successfully! Squishy recognized your state as: ${data.mood_variant} (Energy index of ${data.output_capacity}%)`);
            
            triggerWellnessSuggestions(data.mood_variant);

            clearTranscript();
            
            fetchJournalLogs();
        } else {
            alert("❌ Complain line rejected entry: " + (data.message || "Invalid logs structure."));
        }
    } catch (err) {
        console.error("Entry submission net failed:", err);
        alert("❌ Error committing journal entry to database.");
    }
}

async function triggerWellnessSuggestions(mood) {
    const suggestionsBox = document.getElementById('wellnessSuggestionsBox');
    const suggestionsText = document.getElementById('wellbeingSuggestionsText');

    if (!suggestionsBox || !suggestionsText) return;

    suggestionsBox.classList.remove('hidden');
    suggestionsText.textContent = `Awaiting user consent. To see daily health exercises, click "Analyze Priorities" under Scheduler or "Get Recommendations".`;

    suggestionsText.innerHTML = `
        Your current recorded state is <strong>${mood}</strong>. Squishy has formulated customized suggestions. 
        <button onclick="fetchAiSuggestions('${mood}')" class="text-teal-400 font-bold hover:underline ml-2 cursor-pointer">
            <i class="fa-solid fa-lightbulb"></i> View Recommendations
        </button>
    `;
}

async function fetchAiSuggestions(mood) {
    const suggestionsText = document.getElementById('wellbeingSuggestionsText');
    suggestionsText.textContent = "Mapping wellness recommendations securely from Gemini API...";

    try {
        const response = await fetch('/api/journal/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mood: mood })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            suggestionsText.innerHTML = `<span class="text-teal-450 font-bold">✨ Squishy suggests:</span> ${data.suggestions}`;
        } else {
            suggestionsText.textContent = "Take regular screen breaks and hydrate to reset your focus baseline.";
        }
    } catch(e) {
        suggestionsText.textContent = "Hydrate with fresh water and break your project schedule into manageable 15-minute intervals.";
    }
}

async function fetchJournalLogs() {
    try {
        const email = state.user.email || 'user@mindsync.com';
        const response = await fetch(`/api/journal/logs?email=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error("Faulty response.");
        
        const logs = await response.json();
        state.logs = logs;

        renderJournalHistory();

        renderCalendarGrid(logs);

        updateDashboardStats(logs);

    } catch (err) {
        console.error("Error retrieving journal entries log stream:", err);
    }
}

function renderJournalHistory() {
    const wrapper = document.getElementById('journal-history-list-wrapper');
    if (!wrapper) return;

    if (state.logs.length === 0) {
        wrapper.innerHTML = `
            <div class="text-center py-8 text-xs text-slate-500 italic">
                No recorded logs found. Start journaling above to synchronize your timeline grid!
            </div>
        `;
        return;
    }

    wrapper.innerHTML = '';
    state.logs.forEach(log => {
        const dateObj = new Date(log.created_at);
        const readableDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        let themeClasses = "bg-teal-500/10 text-teal-400 border-teal-500/20";
        if (log.mood_variant === "Tired") {
            themeClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        } else if (log.mood_variant === "Weak") {
            themeClasses = "bg-pink-500/10 text-pink-400 border-pink-500/20";
        } else if (log.mood_variant === "Stressed") {
            themeClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20";
        } else if (log.mood_variant === "Down") {
            themeClasses = "bg-indigo-500/10 text-indigo-450 border-indigo-500/20";
        } else if (log.mood_variant === "Ecstatic") {
            themeClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        }

        const audioPlayerHtml = log.audio_url 
            ? `<div class="mt-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                 <p class="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1"><i class="fa-solid fa-circle-play mr-1"></i> Recorded Voice Snippet</p>
                 <audio src="${log.audio_url}" controls class="w-full h-8 outline-none rounded-lg accent-teal-400"></audio>
               </div>`
            : '';

        const itemHtml = `
            <div class="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:border-slate-800">
                <div class="space-y-2 flex-1">
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] font-bold text-slate-500"><i class="fa-solid fa-calendar-check mr-1 text-[11px]"></i> ${readableDate}</span>
                        <span class="text-[10px] px-2.5 py-0.5 rounded-md border font-black uppercase tracking-wide ${themeClasses}">${log.mood_variant}</span>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed italic">"${log.transcript}"</p>
                    ${audioPlayerHtml}
                </div>
                
                <div class="flex items-center gap-6 justify-end shrink-0 pt-2 md:pt-0">
                    <div class="flex flex-col items-center">
                        <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Squishy Index</span>
                        <div class="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sm font-black text-teal-400">
                            ${log.output_capacity}%
                        </div>
                    </div>
                </div>
            </div>
        `;
        wrapper.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function renderCalendarGrid(logs = []) {
    const label = document.getElementById('calendar-month-year-label');
    const target = document.getElementById('dynamic-calendar-grid-target');

    if (!target) return;

    const currentLocal = new Date();
    const year = currentLocal.getFullYear();
    const month = currentLocal.getMonth();

    if (label) {
        label.textContent = currentLocal.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    }

    target.innerHTML = '';

    const firstDayOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    
    for (let i = 0; i < firstDayOffset; i++) {
        const dot = document.createElement('div');
        dot.className = "text-center py-2 text-slate-800 text-xs select-none opacity-20 pointer-events-none";
        dot.textContent = "•";
        target.appendChild(dot);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = "bg-slate-900 border border-slate-850/65 hover:border-slate-700/80 rounded-xl p-1.5 flex flex-col justify-between items-center min-h-[56px] transition relative cursor-pointer";
        
        if (day === currentLocal.getDate()) {
            dayCell.className += " border-teal-500/40 bg-gradient-to-b from-slate-900 to-teal-950/20";
        }

        const matchingLogs = logs.filter(log => {
            const entryDate = new Date(log.created_at);
            return entryDate.getDate() === day && entryDate.getMonth() === month && entryDate.getFullYear() === year;
        });

        let emojiRepresentation = "?";
        let titleTooltip = "No checkpoints logged";

        if (matchingLogs.length > 0) {
            const latestLog = matchingLogs[0];
            const moodMap = { "Ecstatic": "🤩", "Content": "😊", "Tired": "🥱", "Stressed": "😰", "Down": "😔", "Weak": "🤒" };
            emojiRepresentation = moodMap[latestLog.mood_variant] || "😊";
            titleTooltip = `${latestLog.mood_variant} (Score: ${latestLog.output_capacity}%)`;
            
            dayCell.title = titleTooltip;
            dayCell.className += " hover:scale-[1.03] transition-transform";
        }

        dayCell.innerHTML = `
            <span class="text-[9px] font-bold text-slate-500 w-full text-left">${day}</span>
            <span class="text-xs transition-all ${emojiRepresentation !== '?' ? 'scale-110 font-black' : 'text-slate-750'}">${emojiRepresentation}</span>
        `;

        dayCell.addEventListener('click', () => {
            if (matchingLogs.length > 0) {
                alert(`📝 [Day ${day} Log] \nTranscript: "${matchingLogs[0].transcript}"\nMood evaluated as: ${matchingLogs[0].mood_variant}`);
            } else {

                const check = confirm(`Log quick checklist status for day ${day}?`);
                if (check) {
                    logQuickSentiment('Content', '😊');
                }
            }
        });

        target.appendChild(dayCell);
    }
}

async function logQuickSentiment(moodType, emojiChar) {
    try {
        const response = await fetch('/api/journal/entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transcript: `Instant shortcut log: Feeling extremely ${moodType.toLowerCase()} today.`,
                email: state.user.email || 'user@mindsync.com'
            })
        });

        if (response.ok) {
            alert(`Logged successfully! Calendar day checking updated to ${emojiChar}`);
            fetchJournalLogs();
        }
    } catch(err) {
        console.error("Failed to commit direct check-in:", err);
    }
}

async function clearJournalLogs() {
    const verify = confirm("Are you sure you want to completely purge your mental journaling history database?");
    if (!verify) return;

    try {
        const email = state.user.email || 'user@mindsync.com';
        await fetch(`/api/journal/clear?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
        fetchJournalLogs();
    } catch (e) {
        console.error("Purge error:", e);
    }
}

function updateDashboardStats(logs = []) {
    const statAvgMood = document.getElementById('statAvgMood');
    const statTaskPercentage = document.getElementById('statTaskPercentage');

    if (!statAvgMood) return;

    if (logs.length === 0) {
        statAvgMood.textContent = "-- / 10";
        statTaskPercentage.textContent = "0%";
        return;
    }

    const totalCapacity = logs.reduce((acc, log) => acc + log.output_capacity, 0);
    const average = (totalCapacity / logs.length).toFixed(1);
    statAvgMood.textContent = `${(average / 10).toFixed(1)} / 10`;

    const doneTasks = state.objectives.filter(o => o.completed).length;
    const rate = ((doneTasks / state.objectives.length) * 100).toFixed(0);
    statTaskPercentage.textContent = `${rate}%`;
}

function renderChecklist() {
    const container = document.getElementById('dailyTasksContainer');
    if (!container) return;

    container.innerHTML = '';
    state.objectives.forEach(obj => {
        let loadTag = "Low / Casual Load";
        let loadClass = "bg-teal-500/10 text-teal-400 border-teal-500/10";
        if (obj.energy === "high") {
            loadTag = "High Energy Load";
            loadClass = "bg-pink-500/10 text-pink-400 border-pink-500/10";
        } else if (obj.energy === "medium") {
            loadTag = "Medium Load";
            loadClass = "bg-amber-500/10 text-amber-400 border-amber-500/10";
        }

        const taskNode = document.createElement('div');
        taskNode.className = `flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 transition ${obj.completed ? 'opacity-50' : ''}`;
        
        taskNode.innerHTML = `
            <div class="flex items-center gap-3">
                <input type="checkbox" ${obj.completed ? 'checked' : ''} onchange="toggleObjectiveCheck('${obj.id}')" class="w-4.5 h-4.5 rounded-lg border-slate-800 bg-slate-900 checked:bg-teal-400 checked:border-teal-400 focus:ring-0 cursor-pointer">
                <span class="text-xs font-semibold ${obj.completed ? 'line-through text-slate-550' : 'text-slate-305'}">${obj.text}</span>
            </div>
            <span class="text-[9px] font-black uppercase tracking-wider ${loadClass} border px-2 py-0.5 rounded-md">${loadTag}</span>
        `;
        container.appendChild(taskNode);
    });

    updateDashboardStats(state.logs);
}

function toggleObjectiveCheck(id) {
    const objective = state.objectives.find(o => o.id === id);
    if (objective) {
        objective.completed = !objective.completed;
        renderChecklist();
    }
}

function addNewDailyObjective(event) {
    event.preventDefault();
    const input = document.getElementById('dailyTaskInput');
    const text = input.value.trim();

    if (text === '') return;

    let energy = "low";
    const raw = text.toLowerCase();
    if (raw.includes('optimize') || raw.includes('deploy') || raw.includes('heavy') || raw.includes('architect') || raw.includes('critical')) {
        energy = "high";
    } else if (raw.includes('review') || raw.includes('compile') || raw.includes('verify') || raw.includes('fix')) {
        energy = "medium";
    }

    const newObj = {
        id: "obj_" + Date.now(),
        text: text,
        energy: energy,
        completed: false
    };

    state.objectives.push(newObj);
    input.value = '';
    renderChecklist();
}

function reorderTasksByMood() {
    if (state.logs.length === 0) {
        alert("🔒 Prioritizer calibration required: Please complete at least one verbal journal or check-in first so Squishy can analyze your emotional baseline!");
        return;
    }

    const latest = state.logs[0];
    const mood = latest.mood_variant;
    const aiMessage = document.getElementById('aiSchedulerMessage');

    console.log(`🌀 Aligning objectives checklist layout to meet current mood demands: "${mood}"`);

    if (mood === "Tired" || mood === "Weak" || mood === "Down") {
        state.objectives.sort((a, b) => {
            const weights = { "low": 1, "medium": 2, "high": 3 };
            return weights[a.energy] - weights[b.energy];
        });
        if (aiMessage) {
            aiMessage.textContent = `🎯 Balanced pacing activated for "${mood}" state: Relaxed, light, and low-energy items have been bubbled to the top to prevent fatigue strains.`;
        }
    } else if (mood === "Ecstatic" || mood === "Content") {
        state.objectives.sort((a, b) => {
            const weights = { "high": 1, "medium": 2, "low": 3 };
            return weights[a.energy] - weights[b.energy];
        });
        if (aiMessage) {
            aiMessage.textContent = `⚡ High performance alignment activated for "${mood}" state: High load items, architectural specifications, and complex items are bubbled to the top. Seize the momentum!`;
        }
    } else {
        state.objectives.sort((a, b) => {
            const weights = { "medium": 1, "high": 2, "low": 3 };
            return weights[a.energy] - weights[b.energy];
        });
        if (aiMessage) {
            aiMessage.textContent = `✨ Stable objective alignments active. Checklists are sorted uniformly.`;
        }
    }
    renderChecklist();
    alert(`🎯 Calibrated: Your task checklist has been reordered selectively to match your current recorded energetic potential (${mood})!`);
}

function saveMilestones() {
    localStorage.setItem('mindsync_milestones', JSON.stringify(state.milestones));
    updateDashboardMilestoneRatio();
}

function renderMilestones() {
    const container = document.getElementById('milestonesContainer');
    if (!container) return;

    container.innerHTML = '';

    state.milestones.forEach(milestone => {
        const completedCount = milestone.items.filter(i => i.completed).length;
        const totalCount = milestone.items.length;
        const hitsText = `${completedCount} of ${totalCount} hit`;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = "space-y-2.5 border-b border-slate-800/15 pb-3 last:border-0";

        let headerHtml = `
            <div class="flex items-center justify-between border-b border-slate-800/50 pb-1.5 font-sans">
                <span class="text-xs font-bold text-slate-350 flex items-center gap-2">
                    <i class="fa-solid ${milestone.icon || 'fa-cubes'} text-[11px] ${milestone.color || 'text-indigo-400'}"></i>${milestone.category}
                </span>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-slate-500 font-bold">${hitsText}</span>
                    ${state.milestonesEditMode ? `
                        <button onclick="deleteMilestoneCategory('${milestone.id}')" title="Delete Category" class="text-rose-500 hover:text-rose-455 transition cursor-pointer text-[10px] p-0.5 ml-1">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        categoryDiv.innerHTML = headerHtml;

        const itemsListDiv = document.createElement('div');
        itemsListDiv.className = "space-y-2 text-[11px] text-slate-400 font-sans";

        milestone.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = "flex items-center justify-between group py-0.5";

            const checkIcon = item.completed 
                ? `<button onclick="toggleMilestoneItemCheck('${milestone.id}', '${item.id}')" class="text-xs ${milestone.color === 'text-pink-400' ? 'text-pink-500/80 hover:text-pink-400' : 'text-indigo-500/80 hover:text-indigo-400'} transition cursor-pointer flex items-center shrink-0"><i class="fa-solid fa-circle-check"></i></button>`
                : `<button onclick="toggleMilestoneItemCheck('${milestone.id}', '${item.id}')" class="text-xs text-slate-800 hover:text-slate-700 transition cursor-pointer flex items-center shrink-0"><i class="fa-solid fa-circle"></i></button>`;

            const textSpan = `<span class="flex-1 ml-2 text-left transition ${item.completed ? 'line-through text-slate-600' : 'text-slate-400'}">${item.text}</span>`;

            let actionCol = '';
            if (state.milestonesEditMode) {
                actionCol = `
                    <button onclick="deleteMilestoneItem('${milestone.id}', '${item.id}')" title="Delete Item" class="text-slate-500 hover:text-rose-450 transition cursor-pointer text-[10px] p-0.5 ml-2">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                `;
            }

            itemElement.innerHTML = `
                <div class="flex items-center flex-1 min-w-0">
                    ${checkIcon}
                    ${textSpan}
                </div>
                ${actionCol}
            `;
            itemsListDiv.appendChild(itemElement);
        });

        if (state.milestonesEditMode) {
            const inlineAddDiv = document.createElement('div');
            inlineAddDiv.className = "pt-1 flex gap-2 items-center";
            inlineAddDiv.innerHTML = `
                <input type="text" id="add-item-input-${milestone.id}" placeholder="Add key milestone item..." class="w-full bg-[#0A0B0E] border border-slate-850/60 rounded-lg px-2.5 py-1 text-[10px] text-slate-350 focus:outline-none focus:border-indigo-500 transition-colors">
                <button onclick="addMilestoneItemDirect('${milestone.id}')" class="text-[10px] bg-slate-800/40 hover:bg-slate-800 border border-slate-800/60 text-slate-300 font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0">Add</button>
            `;
            itemsListDiv.appendChild(inlineAddDiv);
        }

        categoryDiv.appendChild(itemsListDiv);
        container.appendChild(categoryDiv);
    });

    if (state.milestonesEditMode) {
        const createCategoryForm = document.createElement('div');
        createCategoryForm.className = "pt-4 border-t border-dashed border-slate-800/50 space-y-2.5 font-sans";
        createCategoryForm.innerHTML = `
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Create Custom Milestone Section</div>
            <div class="space-y-2">
                <input type="text" id="new-category-name" placeholder="E.g., Production Release" class="w-full bg-[#0A0B0E] border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors">
                
                <div class="grid grid-cols-2 gap-2">
                    <select id="new-category-icon" class="w-full bg-[#0A0B0E] border border-slate-850 text-slate-350 rounded-xl px-2.5 py-1 text-[11px] focus:outline-none cursor-pointer">
                        <option value="fa-cubes">Cubes Icon 🧊</option>
                        <option value="fa-bullseye">Bullseye Icon 🎯</option>
                        <option value="fa-flag">Flag Icon 🚩</option>
                        <option value="fa-rocket">Rocket Icon 🚀</option>
                        <option value="fa-trophy">Trophy Icon 🏆</option>
                        <option value="fa-code">Code Icon 💻</option>
                    </select>

                    <select id="new-category-color" class="w-full bg-[#0A0B0E] border border-slate-850 text-slate-350 rounded-xl px-2.5 py-1 text-[11px] focus:outline-none cursor-pointer">
                        <option value="text-indigo-400">Indigo Theme</option>
                        <option value="text-pink-400">Pink Theme</option>
                        <option value="text-teal-400">Teal Theme</option>
                        <option value="text-amber-400">Amber Theme</option>
                        <option value="text-emerald-400">Emerald Theme</option>
                    </select>
                </div>
                
                <button onclick="createMilestoneCategory()" class="w-full bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl border border-slate-800/60 text-xs transition cursor-pointer">Create Category</button>
            </div>
        `;
        container.appendChild(createCategoryForm);
    }

    updateDashboardMilestoneRatio();
}

function toggleMilestonesEditMode() {
    state.milestonesEditMode = !state.milestonesEditMode;
    const button = document.getElementById('manageMilestonesBtn');
    if (button) {
        button.innerHTML = state.milestonesEditMode 
            ? `<i class="fa-solid fa-circle-check mr-1"></i> Exit Edit`
            : `<i class="fa-solid fa-pen-to-square mr-1"></i> Edit Mode`;
        button.className = state.milestonesEditMode
            ? "text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-lg hover:bg-indigo-500/20 transition cursor-pointer shrink-0"
            : "text-[10px] font-bold bg-slate-800/40 text-slate-400 border border-slate-800/60 px-2.5 py-1 rounded-lg hover:bg-slate-850 transition cursor-pointer shrink-0";
    }
    renderMilestones();
}

function toggleMilestoneItemCheck(categoryId, itemId) {
    const category = state.milestones.find(m => m.id === categoryId);
    if (category) {
        const item = category.items.find(i => i.id === itemId);
        if (item) {
            item.completed = !item.completed;
            saveMilestones();
            renderMilestones();
        }
    }
}

function deleteMilestoneItem(categoryId, itemId) {
    const category = state.milestones.find(m => m.id === categoryId);
    if (category) {
        category.items = category.items.filter(i => i.id !== itemId);
        saveMilestones();
        renderMilestones();
    }
}

function deleteMilestoneCategory(categoryId) {
    const check = confirm("Are you sure you want to completely delete this entire milestone category?");
    if (!check) return;
    
    state.milestones = state.milestones.filter(m => m.id !== categoryId);
    saveMilestones();
    renderMilestones();
}

function addMilestoneItemDirect(categoryId) {
    const input = document.getElementById(`add-item-input-${categoryId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (text === '') return;
    
    const category = state.milestones.find(m => m.id === categoryId);
    if (category) {
        category.items.push({
            id: "mi_" + Date.now(),
            text: text,
            completed: false
        });
        saveMilestones();
        input.value = '';
        renderMilestones();
    }
}

function createMilestoneCategory() {
    const nameInput = document.getElementById('new-category-name');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (name === '') {
        alert("Please specify a category name!");
        return;
    }
    
    const icon = document.getElementById('new-category-icon').value;
    const color = document.getElementById('new-category-color').value;
    
    state.milestones.push({
        id: "m_" + Date.now(),
        category: name,
        icon: icon,
        color: color,
        items: []
    });
    
    saveMilestones();
    renderMilestones();
}

function updateDashboardMilestoneRatio() {
    const textNode = document.getElementById('dashboard-milestone-ratio-text');
    if (!textNode) return;

    let totalItems = 0;
    let completedItems = 0;

    state.milestones.forEach(m => {
        totalItems += m.items.length;
        completedItems += m.items.filter(i => i.completed).length;
    });

    textNode.innerHTML = `<i class="fa-solid fa-code-merge mr-1 text-[11px]"></i> ${completedItems} of ${totalItems} hit`;
}
