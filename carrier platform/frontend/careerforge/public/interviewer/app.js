// ═══════════════════════════════════════════════════════════
//  AI Mock Interview — app.js (Frontend)
//  • Backend server at http://localhost:5000
//  • PDF.js    (resume parsing)
//  • Sarvam AI (via backend for TTS/STT)
// ═══════════════════════════════════════════════════════════

const SERVER_URL = "https://careerforge-5ktc.onrender.com";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ── State ────────────────────────────────────────────────────
let questions        = [];
let answers          = [];
let questionAudios   = [];  // Pre-generated audios for all questions
let currentQ         = 0;
let totalQ           = 6;  // Default, will be set from form input
let isListening      = false;
let camStream        = null;
let camOn            = false;
let timerInterval    = null;
let elapsedSeconds   = 0;
let currentTranscript = "";
let jobDesc          = "";
let resumeText       = "";
let intType          = "";
let difficulty       = "";
let shadowMode       = false;
let shadowAnswers    = [];
let shadowAudios     = [];
let shadowIntroAudio = "";
let aiSpeaking       = false;
let volInterval      = null;
let transcriptInputListenerActive = false;
let selectedCameraId = "";
let selectedMicId    = "";
let playbackPhase    = "idle";
let activePlaybackAudio = null;
let activeResumeSource = "";

// Device check state
let deviceCamStream      = null;
let deviceAudioStream    = null;
let deviceAudioContext   = null;
let deviceAnalyser       = null;
let deviceMeterInterval  = null;

// Audio recording state
let mediaRecorder    = null;
let audioChunks      = [];
let audioStream      = null;
let isRecording      = false;

// Hardcoded greeting
function getFixedGreeting(totalQ) {
  return `Hello from Career Forge. My name is Simran. I am your interviewer today. We will go through ${totalQ} questions. Take your time with each answer. Let's begin.`;
}

function getShadowIntroText() {
  return "Hello from Career Forge. My name is Simran. I am your interviewer today. Shadow mode is on, so after each answer I will share a short ideal answer based on your resume and this job description. You can skip any shadow answer with the skip button. Let's begin.";
}

// ── Backend Server Calls ────────────────────────────────────

// Check server health
async function checkServerHealth() {
  try {
    const resp = await fetch(`${SERVER_URL}/api/health`);
    return resp.ok;
  } catch (e) {
    console.error("Server not responding:", e.message);
    return false;
  }
}

// Generate interview questions via server
async function generateInterviewQuestions(jobDesc, resumeText, intType, difficulty, totalQ) {
  const authHeaders = window.__getAuthHeaders ? await window.__getAuthHeaders() : {};
  const resp = await fetch(`${SERVER_URL}/api/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      jobDesc,
      resumeText,
      intType,
      difficulty,
      totalQ,
    }),
  });

  if (window.__handlePlanLimitResponse && await window.__handlePlanLimitResponse(resp, "Interview Prep", "interviewPrep")) {
    return null;
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${resp.status}`);
  }

  const data = await resp.json();
  return data.questions;
}

// Pre-generate audio for all questions
async function generateAudiosForAllQuestions(questions, greeting) {
  const resp = await fetch(`${SERVER_URL}/api/generate-audios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questions,
      prefixGreeting: greeting,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Audio generation error ${resp.status}`);
  }

  const data = await resp.json();
  return data.audios; // Array of base64 audios
}

async function generateShadowModeAssets(questions, jobDesc, resumeText, intType, difficulty) {
  const resp = await fetch(`${SERVER_URL}/api/generate-shadow-mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questions,
      jobDesc,
      resumeText,
      intType,
      difficulty,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Shadow mode error ${resp.status}`);
  }

  const data = await resp.json();
  return data;
}

// Analyze interview via server
async function analyzeInterview(questions, answers, jobDesc, resumeText, intType, difficulty, jobTitle) {
  const authHeaders = await window.__getAuthHeaders();
  const resp = await fetch(`${SERVER_URL}/api/analyze-interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      questions,
      answers,
      jobDesc,
      resumeText,
      intType,
      difficulty,
      jobTitle,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${resp.status}`);
  }

  const data = await resp.json();
  return data.analysis;
}

// Text-to-Speech via Sarvam (through server)
async function textToSpeechServer(text) {
  const resp = await fetch(`${SERVER_URL}/api/text-to-speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `TTS error ${resp.status}`);
  }

  const data = await resp.json();
  return data.audio; // Base64 audio
}

// Speech-to-Text via Sarvam (through server)
// Preferred: send Blob via multipart/form-data to avoid large base64 JSON bodies
async function speechToTextServerBlob(blob) {
  const form = new FormData();
  form.append('file', blob, 'audio.wav');

  const resp = await fetch(`${SERVER_URL}/api/speech-to-text`, {
    method: 'POST',
    body: form,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `STT error ${resp.status}`);
  }

  const data = await resp.json();
  return data.transcript;
}

// Fallback for base64 if needed
async function speechToTextServer(audioBase64) {
  const resp = await fetch(`${SERVER_URL}/api/speech-to-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: audioBase64 }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `STT error ${resp.status}`);
  }

  const data = await resp.json();
  return data.transcript;
}

// ── PDF Parsing ───────────────────────────────────────────────
async function handlePdfUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  await parseUploadedResume(file);
}

async function waitForResumeHelpers() {
  for (let i = 0; i < 80; i++) {
    if (window.__getSavedResumes && window.__loadSavedResumePdf && window.__readPdfText) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Resume helpers not ready");
}

async function extractPdfText(source, includeLinks = false) {
  await waitForResumeHelpers();
  const rawText = await window.__readPdfText(source, { includeLinks });
  return rawText.replace(/\s+/g, " ").trim();
}

function showUploadResumeState(label) {
  document.getElementById("pdfName").textContent  = label;
  document.getElementById("pdfPreview").style.display = "flex";
  document.getElementById("dropText").textContent = "Resume uploaded ✓";
  document.getElementById("savedResumeSelect").value = "";
  document.getElementById("savedResumeStatus").textContent = "Pick a saved resume to use it instead of the uploaded file.";
  document.getElementById("savedResumeHint").textContent = "Read-only selection. Nothing is written back to your Profile.";
  activeResumeSource = "upload";
}

function clearUploadResumeState() {
  document.getElementById("pdfInput").value     = "";
  document.getElementById("pdfPreview").style.display = "none";
  document.getElementById("dropText").textContent    = "Click to upload PDF resume";
  activeResumeSource = "";
}

async function parseUploadedResume(file) {
  showLoading("Reading your resume…");
  try {
    resumeText = await extractPdfText(file, false);
    document.getElementById("pdfChars").textContent = `(${resumeText.length.toLocaleString()} chars extracted)`;
    showUploadResumeState(file.name || "Uploaded resume");
    hideLoading();
  } catch (e) {
    hideLoading();
    alert("Could not read PDF. Make sure it's a valid, non-encrypted PDF file.");
  }
}

function clearPdf() {
  resumeText = "";
  clearUploadResumeState();
}

async function loadSavedResumes() {
  await waitForResumeHelpers();
  const select = document.getElementById("savedResumeSelect");
  const status = document.getElementById("savedResumeStatus");
  const hint = document.getElementById("savedResumeHint");
  const resumes = await window.__getSavedResumes();

  select.innerHTML = "";
  if (!resumes.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved resumes yet";
    select.appendChild(option);
    select.disabled = true;
    status.textContent = "No saved resumes yet.";
    hint.textContent = "Go to your Profile to save a resume, then return here.";
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a saved resume";
  select.appendChild(placeholder);

  resumes.forEach((resume) => {
    const option = document.createElement("option");
    option.value = resume._id;
    option.textContent = resume.title || "Untitled Resume";
    select.appendChild(option);
  });

  select.disabled = false;
  status.textContent = "Pick one of your saved resumes.";
  hint.textContent = "Read-only selection. Nothing is written back to your Profile.";
}

async function useSavedResume(resumeId) {
  const select = document.getElementById("savedResumeSelect");
  const status = document.getElementById("savedResumeStatus");
  const hint = document.getElementById("savedResumeHint");

  if (!resumeId) {
    if (!activeResumeSource || activeResumeSource === "saved") {
      resumeText = "";
      activeResumeSource = "";
    }
    status.textContent = hint.textContent || "Select a saved resume from your Profile.";
    return;
  }

  await waitForResumeHelpers();
  status.textContent = "Loading saved resume...";
  const resumes = await window.__getSavedResumes();
  const selected = resumes.find((resume) => resume._id === resumeId);
  const blob = await window.__loadSavedResumePdf(resumeId);
  showLoading("Reading your saved resume…");
  try {
    resumeText = await extractPdfText(blob, false);
    document.getElementById("pdfChars").textContent = `(${resumeText.length.toLocaleString()} chars extracted)`;
    clearUploadResumeState();
    select.value = resumeId;
    document.getElementById("savedResumeStatus").textContent = `Using ${selected?.title || "the selected saved resume"}.`;
    document.getElementById("savedResumeHint").textContent = "Read-only selection. Nothing is written back to your Profile.";
    activeResumeSource = "saved";
    hideLoading();
    return;
  } catch (err) {
    hideLoading();
    throw err;
  }
}

// Drag and drop
document.addEventListener("DOMContentLoaded", () => {
  // Check for pre-filled data from job-listings redirect
  const prefillJobDesc = localStorage.getItem("prefill_jobDesc");
  const prefillResumeText = localStorage.getItem("prefill_resumeText");
  const prefillJobTitle = localStorage.getItem("prefill_jobTitle");
  if (prefillJobDesc) {
    document.getElementById("jobDesc").value = prefillJobDesc;
    jobDesc = prefillJobDesc;
    localStorage.removeItem("prefill_jobDesc");
  }
  if (prefillJobTitle) {
    localStorage.removeItem("prefill_jobTitle");
  }
  if (prefillResumeText) {
    resumeText = prefillResumeText;
    activeResumeSource = "session";
    document.getElementById("pdfName").textContent = "From Job Listings";
    document.getElementById("pdfChars").textContent = `(${resumeText.length.toLocaleString()} chars)`;
    document.getElementById("pdfPreview").style.display = "flex";
    document.getElementById("dropText").textContent = "Resume loaded ✓";
    localStorage.removeItem("prefill_resumeText");
  }

  const drop = document.getElementById("pdfDrop");
  drop.addEventListener("dragover",  e => { e.preventDefault(); drop.classList.add("dragover"); });
  drop.addEventListener("dragleave", ()  => drop.classList.remove("dragover"));
  drop.addEventListener("drop", async e => {
    e.preventDefault();
    drop.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") await parsePdf(file);
    else alert("Please drop a PDF file.");
  });

  const cameraSelect = document.getElementById("cameraSelect");
  const micSelect = document.getElementById("micSelect");

  if (cameraSelect) {
    cameraSelect.addEventListener("change", async (e) => {
      selectedCameraId = e.target.value;
      await startDeviceCameraPreview();
    });
  }

  if (micSelect) {
    micSelect.addEventListener("change", async (e) => {
      selectedMicId = e.target.value;
      await startDeviceMicTest();
    });
  }

  const shadowToggle = document.getElementById("shadowModeToggle");
  if (shadowToggle) {
    shadowToggle.addEventListener("change", (e) => {
      shadowMode = e.target.checked;
    });
  }

  const savedResumeSelect = document.getElementById("savedResumeSelect");
  if (savedResumeSelect) {
    savedResumeSelect.addEventListener("change", async (e) => {
      try {
        await useSavedResume(e.target.value);
      } catch (err) {
        document.getElementById("savedResumeStatus").textContent = "Could not load selected resume.";
        alert("Error loading saved resume: " + err.message);
      }
    });
  }
});

// ── Device Check Flow ─────────────────────────────────────────
function validateSetupInputs() {
  jobDesc = document.getElementById("jobDesc").value.trim();
  intType = document.getElementById("intType").value;
  difficulty = document.getElementById("difficulty").value;
  const numQuestionsInput = parseInt(document.getElementById("numQuestions").value, 10) || 6;

  if (!jobDesc) {
    alert("Please paste the job description.");
    return false;
  }
  if (!resumeText) {
    alert("Please upload your resume PDF.");
    return false;
  }
  if (numQuestionsInput < 1 || numQuestionsInput > 20) {
    alert("Please enter a number of questions between 1 and 20.");
    return false;
  }

  totalQ = numQuestionsInput;
  return true;
}

async function openDeviceCheck() {
  if (!validateSetupInputs()) return;

  showScreen("deviceCheck");
  await refreshDeviceList();
}

async function refreshDeviceList() {
  try {
    // Ask for permission once so camera/mic labels become available.
    const permStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    permStream.getTracks().forEach(t => t.stop());
  } catch (e) {
    alert("Please allow camera and microphone access to continue.");
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === "videoinput");
    const mics = devices.filter(d => d.kind === "audioinput");
    const cameraSelect = document.getElementById("cameraSelect");
    const micSelect = document.getElementById("micSelect");

    cameraSelect.innerHTML = "";
    micSelect.innerHTML = "";

    cameras.forEach((cam, i) => {
      const opt = document.createElement("option");
      opt.value = cam.deviceId;
      opt.textContent = cam.label || `Camera ${i + 1}`;
      cameraSelect.appendChild(opt);
    });

    mics.forEach((mic, i) => {
      const opt = document.createElement("option");
      opt.value = mic.deviceId;
      opt.textContent = mic.label || `Microphone ${i + 1}`;
      micSelect.appendChild(opt);
    });

    if (cameras.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No camera detected";
      cameraSelect.appendChild(opt);
    }

    if (mics.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No microphone detected";
      micSelect.appendChild(opt);
    }

    selectedCameraId = selectedCameraId || (cameras[0]?.deviceId || "");
    selectedMicId = selectedMicId || (mics[0]?.deviceId || "");

    cameraSelect.value = selectedCameraId;
    micSelect.value = selectedMicId;

    await startDeviceCameraPreview();
    await startDeviceMicTest();
  } catch (e) {
    console.error("Could not load devices:", e);
    alert("Could not read your camera/microphone list. Check browser permissions.");
  }
}

async function startDeviceCameraPreview() {
  const videoEl = document.getElementById("deviceVideo");
  const camOff = document.getElementById("deviceCamOff");

  if (deviceCamStream) {
    deviceCamStream.getTracks().forEach(t => t.stop());
    deviceCamStream = null;
  }

  if (!selectedCameraId) {
    videoEl.srcObject = null;
    camOff.style.display = "flex";
    return;
  }

  try {
    deviceCamStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: selectedCameraId } },
      audio: false,
    });
    videoEl.srcObject = deviceCamStream;
    camOff.style.display = "none";
  } catch (e) {
    videoEl.srcObject = null;
    camOff.style.display = "flex";
  }
}

async function startDeviceMicTest() {
  stopDeviceMicTest();

  if (!selectedMicId) {
    setMicMeterIdle("No microphone selected");
    return;
  }

  try {
    deviceAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: selectedMicId } },
      video: false,
    });

    deviceAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = deviceAudioContext.createMediaStreamSource(deviceAudioStream);
    deviceAnalyser = deviceAudioContext.createAnalyser();
    deviceAnalyser.fftSize = 256;
    source.connect(deviceAnalyser);

    const data = new Uint8Array(deviceAnalyser.frequencyBinCount);
    deviceMeterInterval = setInterval(() => {
      deviceAnalyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      renderMicMeter(avg);
    }, 100);
  } catch (e) {
    console.error("Mic test error:", e);
    setMicMeterIdle("Microphone unavailable");
  }
}

function renderMicMeter(level) {
  const bars = document.querySelectorAll("#micTestMeter span");
  const levelText = document.getElementById("micLevelText");
  const normalized = Math.min(1, level / 120);
  const activeBars = Math.max(1, Math.round(normalized * bars.length));

  bars.forEach((bar, idx) => {
    bar.style.height = idx < activeBars ? `${10 + normalized * 26}px` : "8px";
    bar.style.opacity = idx < activeBars ? "1" : "0.25";
  });

  if (level < 5) levelText.textContent = "Very low input";
  else if (level < 20) levelText.textContent = "Low input";
  else if (level < 45) levelText.textContent = "Good input";
  else levelText.textContent = "Strong input";
}

function setMicMeterIdle(text) {
  const bars = document.querySelectorAll("#micTestMeter span");
  bars.forEach(bar => {
    bar.style.height = "8px";
    bar.style.opacity = "0.25";
  });
  document.getElementById("micLevelText").textContent = text;
}

function stopDeviceMicTest() {
  if (deviceMeterInterval) {
    clearInterval(deviceMeterInterval);
    deviceMeterInterval = null;
  }
  if (deviceAudioStream) {
    deviceAudioStream.getTracks().forEach(t => t.stop());
    deviceAudioStream = null;
  }
  if (deviceAudioContext) {
    deviceAudioContext.close();
    deviceAudioContext = null;
  }
  deviceAnalyser = null;
}

function stopDeviceCheckStreams() {
  if (deviceCamStream) {
    deviceCamStream.getTracks().forEach(t => t.stop());
    deviceCamStream = null;
  }
  const videoEl = document.getElementById("deviceVideo");
  if (videoEl) videoEl.srcObject = null;
  stopDeviceMicTest();
  setMicMeterIdle("Waiting for microphone signal…");
}

function backToSetup() {
  stopDeviceCheckStreams();
  showScreen("setup");
}

// ── Play Audio from Base64 ──────────────────────────────────────
let _typingTimer = null;
function clearTyping() {
  if (_typingTimer) { clearInterval(_typingTimer); _typingTimer = null; }
}

function playAudioFromBase64(audioBase64, onEnd, syncText, syncStartMs) {
  try {
    stopCurrentPlayback();

    // Convert base64 to blob and play
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(blob);
    
    const audio = new Audio(audioUrl);
    audio.volume = 1;
    activePlaybackAudio = audio;

    // attach sync text for typing animation
    if (syncText) audio._syncText = syncText;

    audio.onloadedmetadata = () => {
      if (audio._syncText) {
        // If a syncStartMs is provided, start typing after that many ms into playback,
        // and pace typing to the remaining audio duration. Otherwise, pace across full duration.
        if (audio._syncStartMs || syncStartMs) {
          const startMs = audio._syncStartMs || syncStartMs || 0;
          const totalMs = Math.max(300, (audio.duration || 1) * 1000);
          const remainingMs = Math.max(400, totalMs - startMs);
          // schedule typing to begin after startMs has elapsed from now
          setTimeout(() => {
            clearTyping();
            syncTyping(document.getElementById("qBox"), audio._syncText, remainingMs / 1000);
          }, startMs);
        } else {
          clearTyping();
          syncTyping(document.getElementById("qBox"), audio._syncText, audio.duration || 0);
        }
      }
    };

    audio.onplay = () => {
      aiSpeaking = true;
      setAiState("speaking");
      startAiVolBars();
    };

    audio.onended = () => {
      if (activePlaybackAudio !== audio) return;
      aiSpeaking = false;
      stopAiVolBars();
      URL.revokeObjectURL(audioUrl);
      activePlaybackAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      if (activePlaybackAudio !== audio) return;
      aiSpeaking = false;
      stopAiVolBars();
      URL.revokeObjectURL(audioUrl);
      activePlaybackAudio = null;
      console.error("Audio playback error");
      if (onEnd) onEnd();
    };

    audio.play().catch(e => {
      console.error("Could not play audio:", e);
      if (onEnd) onEnd();
    });
  } catch (error) {
    console.error("Audio error:", error);
    if (onEnd) onEnd();
  }
}

// ── AI Voice (Text-to-Speech via Sarvam) ────────────────────
async function speak(text, onEnd) {
  try {
    // Get audio from server (Sarvam TTS)
    const audioBase64 = await textToSpeechServer(text);
    playAudioFromBase64(audioBase64, onEnd);
  } catch (error) {
    console.error("Speech error:", error);
    if (onEnd) onEnd();
  }
}

// Show text in bubble while AI speaks
function aiSay(text, onEnd) {
  const bubble = document.getElementById("speechBubble");
  bubble.textContent = text;
  bubble.style.display = "block";
  speak(text, () => {
    setTimeout(() => { bubble.style.display = "none"; }, 800);
    if (onEnd) onEnd();
  });
}

// ── AI voice bar animation ────────────────────────────────────
function startAiVolBars() {
  const bar = document.getElementById("aiVolBar");
  bar.classList.add("active");
}
function stopAiVolBars() {
  document.getElementById("aiVolBar").classList.remove("active");
}

// ── AI Status helper ──────────────────────────────────────────
function setAiState(state) {
  const txt = document.getElementById("aiStatusTxt");
  const dot = document.getElementById("aiStatusDot");
  const avatar = document.getElementById("aiAvatarEl");

  avatar.classList.remove("speaking");
  dot.style.background = "var(--accent)";
  dot.style.animation  = "blink 1.2s infinite";

  if (state === "speaking") {
    txt.textContent      = "Speaking…";
    dot.style.background = "#facc15";
    avatar.classList.add("speaking");
  } else if (state === "listening") {
    txt.textContent = "Listening to you…";
    dot.style.background = "var(--accent2)";
  } else if (state === "thinking") {
    txt.textContent = "Thinking…";
    dot.style.background = "var(--accent)";
  } else {
    txt.textContent = "Ready";
  }
}

// ── Utilities ─────────────────────────────────────────────────
function showLoading(msg) {
  document.getElementById("loadingMsg").textContent = msg;
  document.getElementById("loadingOverlay").style.display = "flex";
}
function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ── Start Interview ───────────────────────────────────────────
async function startInterviewFromDeviceCheck() {
  if (!validateSetupInputs()) {
    showScreen("setup");
    return;
  }

  shadowMode = !!document.getElementById("shadowModeToggle")?.checked;
  shadowAnswers = [];
  shadowAudios = [];
  shadowIntroAudio = "";
  playbackPhase = "idle";
  stopCurrentPlayback();

  // Check server first
  const serverUp = await checkServerHealth();
  if (!serverUp) {
    alert("Backend server is not running.\n\nPlease start the server:\nnode server.js");
    return;
  }

  showLoading("Generating tailored interview questions…");

  try {
    // Call server to generate questions
    questions = await generateInterviewQuestions(jobDesc, resumeText, intType, difficulty, totalQ);
    if (!questions) {
      hideLoading();
      return;
    }
    totalQ = questions.length;

    const greeting = shadowMode ? "First question." : getFixedGreeting(totalQ);
    
    // Pre-generate audio for all questions
    showLoading("Preparing all questions…");
    questionAudios = await generateAudiosForAllQuestions(questions, greeting);

    if (shadowMode) {
      showLoading("Preparing shadow mode answers…");
      const shadowData = await generateShadowModeAssets(questions, jobDesc, resumeText, intType, difficulty);
      shadowAnswers = shadowData.answers || [];
      shadowAudios = shadowData.audios || [];

      const introText = getShadowIntroText();
      shadowIntroAudio = await textToSpeechServer(introText);
    }
  } catch (e) {
    console.warn("Error preparing interview:", e.message);
    alert("Error preparing interview. Please check if the backend server is running.");
    hideLoading();
    return;
  }

  answers   = new Array(totalQ).fill("");
  currentQ  = 0;
  playbackPhase = "question";

  stopDeviceCheckStreams();
  hideLoading();
  showScreen("interview");

  buildQTrack();
  startTimer();
  startCamera();

  if (shadowMode) {
    setTimeout(() => {
      playShadowIntro(() => loadQuestion(0));
    }, 300);
  } else {
    setTimeout(() => {
      loadQuestion(0);
    }, 500);
  }
}

// Backward-compatible alias
async function startInterview() {
  await startInterviewFromDeviceCheck();
}

// ── Question flow ─────────────────────────────────────────────
function buildQTrack() {
  const track = document.getElementById("qTrack");
  track.innerHTML = "";
  for (let i = 0; i < totalQ; i++) {
    const d = document.createElement("div");
    d.className = "q-dot";
    d.id = "dot" + i;
    track.appendChild(d);
  }
  updateDots();
}

function updateDots() {
  for (let i = 0; i < totalQ; i++) {
    const d = document.getElementById("dot" + i);
    if (!d) continue;
    d.className = "q-dot" + (i < currentQ ? " done" : i === currentQ ? " current" : "");
  }
  document.getElementById("progressInfo").textContent =
    `Question ${currentQ + 1} of ${totalQ}`;
}

function loadQuestion(idx) {
  // show question only via typing sync when AI audio plays
  playbackPhase = "question";
  document.getElementById("qBox").textContent = "";
  const transcriptBox = document.getElementById("transcriptBox");
  transcriptBox.textContent = "";
  transcriptBox.dataset.placeholder = "Waiting for AI to finish speaking…";
  transcriptBox.classList.remove("listening");
  transcriptBox.contentEditable = "false";
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("skipBtn").style.display = "none";
  document.getElementById("skipBtn").textContent = "Skip Question";
  document.getElementById("liveBadge").style.display = "none";
  document.getElementById("micBtn").disabled = true;
  currentTranscript = "";
  transcriptInputListenerActive = false;
  updateDots();

  // Use pre-generated audio for this question
  if (questionAudios[idx]) {
    const startDelay = getQuestionTextDelayMs(idx);
    playAudioFromBase64(questionAudios[idx], () => {
      // AI finished speaking — enable mic and make transcript box editable
      playbackPhase = "answering";
      setAiState("listening");
      document.getElementById("micBtn").disabled = false;
      const transcriptBox = document.getElementById("transcriptBox");
      transcriptBox.textContent = "";
      transcriptBox.dataset.placeholder = "You can type or click \"Start Speaking\"…";
      transcriptBox.contentEditable = "true";
      
      // Add input event listener for keyboard input tracking (setup once)
      setupTranscriptInputTracking();
      
      // Initially show skip button since box is empty
      updateAnswerButtons();
    }, questions[idx], startDelay);
  } else {
    console.error(`Audio not found for question ${idx}`);
    // Fallback to text if audio fails
    playbackPhase = "answering";
    setAiState("listening");
    document.getElementById("micBtn").disabled = false;
    const transcriptBox = document.getElementById("transcriptBox");
    transcriptBox.textContent = "";
    transcriptBox.dataset.placeholder = "You can type or click \"Start Speaking\"…";
    transcriptBox.contentEditable = "true";
    setupTranscriptInputTracking();
    updateAnswerButtons();
  }
}

function getQuestionTextDelayMs(idx) {
  if (idx === 0 && shadowMode) return 1100;
  return idx === 0 ? 10000 : 3000;
}

function setConversionLoader(isVisible) {
  const loader = document.getElementById("recordingLoader");
  if (!loader) return;
  loader.style.display = isVisible ? "flex" : "none";
}

function stopCurrentPlayback() {
  if (!activePlaybackAudio) return;
  const audio = activePlaybackAudio;
  activePlaybackAudio = null;
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
    audio.load();
  } catch (e) {
    // ignore cleanup errors
  }
}

function resetAnswerControls() {
  document.getElementById("micBtn").disabled = true;
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("skipBtn").style.display = "none";
  document.getElementById("skipBtn").textContent = "Skip Question";
}

async function moveToNextStep() {
  if (currentQ < totalQ - 1) {
    currentQ++;
    loadQuestion(currentQ);
    return;
  }

  showLoading("Thank you! Analyzing your performance…");
  clearInterval(timerInterval);
  if (isRecording) { stopRecording(); }
  if (audioStream) audioStream.getTracks().forEach(track => track.stop());
  if (camStream) camStream.getTracks().forEach(track => track.stop());
  await showAnalysis();
}

async function playShadowIntro(onEnd) {
  const bubble = document.getElementById("speechBubble");
  const skipBtn = document.getElementById("skipBtn");
  const introText = getShadowIntroText();

  playbackPhase = "shadowIntro";
  setAiState("speaking");
  bubble.textContent = introText;
  bubble.style.display = "block";
  skipBtn.textContent = "Skip Intro";
  skipBtn.style.display = "block";
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("micBtn").disabled = true;

  const finish = () => {
    bubble.style.display = "none";
    skipBtn.style.display = "none";
    skipBtn.textContent = "Skip Question";
    playbackPhase = "question";
    if (onEnd) onEnd();
  };

  if (shadowIntroAudio) {
    playAudioFromBase64(shadowIntroAudio, finish);
    return;
  }

  try {
    const introAudio = await textToSpeechServer(introText);
    playAudioFromBase64(introAudio, finish);
  } catch (e) {
    console.warn("Shadow intro audio failed:", e.message);
    finish();
  }
}

function playShadowAnswer(idx, onEnd) {
  const bubble = document.getElementById("speechBubble");
  const qBox = document.getElementById("qBox");
  const skipBtn = document.getElementById("skipBtn");
  const shadowText = shadowAnswers[idx] || "";
  const shadowAudio = shadowAudios[idx];
  const leadInText = "Now, an ideal answer for you would be.";

  playbackPhase = "shadowLeadIn";
  setAiState("speaking");
  bubble.textContent = leadInText;
  bubble.style.display = "block";
  skipBtn.textContent = "Skip Shadow Answer";
  skipBtn.style.display = "block";
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("micBtn").disabled = true;
  qBox.textContent = "";

  const finish = () => {
    bubble.style.display = "none";
    skipBtn.style.display = "none";
    skipBtn.textContent = "Skip Question";
    playbackPhase = "question";
    if (onEnd) onEnd();
  };

  const playAnswer = () => {
    if (shadowAudio) {
      playbackPhase = "shadowAnswer";
      bubble.textContent = shadowText || leadInText;
      playAudioFromBase64(shadowAudio, finish);
    } else if (shadowText) {
      playbackPhase = "shadowAnswer";
      bubble.textContent = shadowText;
      aiSay(shadowText, finish);
    } else {
      finish();
    }
  };

  setTimeout(async () => {
    try {
      const leadInAudio = await textToSpeechServer(leadInText);
      playAudioFromBase64(leadInAudio, playAnswer);
    } catch (e) {
      console.warn("Shadow lead-in audio failed:", e.message);
      playAnswer();
    }
  }, 1000);
}

// ── Transcript Input Tracking ────────────────────────────────
function setupTranscriptInputTracking() {
  const box = document.getElementById("transcriptBox");
  
  // Only add listener once to avoid duplicates
  if (transcriptInputListenerActive) return;
  transcriptInputListenerActive = true;
  
  box.addEventListener("input", () => {
    const text = box.textContent.trim();
    
    // Update currentTranscript with the text from contenteditable box
    currentTranscript = text;
    
    // Update which buttons to show
    updateAnswerButtons();
  });
}

// ── Toggle between Skip and Submit buttons ───────────────────
function updateAnswerButtons() {
  const box = document.getElementById("transcriptBox");
  const text = box.textContent.trim();
  const skipBtn = document.getElementById("skipBtn");
  const submitBtn = document.getElementById("submitBtn");

  if (shadowMode && playbackPhase.startsWith("shadow")) {
    skipBtn.textContent = playbackPhase === "shadowIntro" ? "Skip Intro" : "Skip Shadow Answer";
    skipBtn.style.display = "block";
    submitBtn.style.display = "none";
    return;
  }

  if (text.length > 0) {
    // User has typed/spoken content
    skipBtn.style.display = "none";
    submitBtn.style.display = "block";
  } else {
    // Empty transcript box
    skipBtn.style.display = shadowMode ? "none" : "block";
    submitBtn.style.display = "none";
  }
}

// ── Timer ─────────────────────────────────────────────────────
function startTimer() {
  elapsedSeconds = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
    const s = String(elapsedSeconds % 60).padStart(2, "0");
    document.getElementById("timerEl").textContent = `${m}:${s}`;
  }, 1000);
}

// ── Audio Recording (Using Sarvam for STT) ─────────────────────
async function startRecording() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
      video: false,
    });
    
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    
    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstart = () => {
      isRecording = true;
      const btn = document.getElementById("micBtn");
      btn.innerHTML = micSVG() + " Stop Recording";
      setAiState("listening");
      setConversionLoader(false);
      // start user visualizer while recording
      startUserVolBars();
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      const btn = document.getElementById("micBtn");
      btn.innerHTML = micSVG() + " Converting…";
      btn.disabled = true;
      setConversionLoader(true);
      
      // Convert audio chunks to Blob and send as multipart to avoid large JSON payloads
      const audioBlob = new Blob(audioChunks, { type: mediaRecorder && mediaRecorder.mimeType ? mediaRecorder.mimeType : 'audio/webm' });

      try {
        const transcriptBox = document.getElementById("transcriptBox");
        transcriptBox.textContent = "Converting audio…";

        // Prefer sending Blob directly
        let transcript;
        try {
          transcript = await speechToTextServerBlob(audioBlob);
        } catch (e) {
          // Fallback to base64 if multipart fails
          const reader = new FileReader();
          const b64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });
          transcript = await speechToTextServer(b64);
        }

        currentTranscript = transcript;
        transcriptBox.textContent = transcript || "No speech detected. Try again.";
        transcriptBox.contentEditable = "true";

        updateAnswerButtons();

        setConversionLoader(false);
        btn.innerHTML = micSVG() + " Start Speaking";
        btn.disabled = false;

        // Stop audio stream
        audioStream.getTracks().forEach(track => track.stop());
        stopUserVolBars();
      } catch (error) {
        console.error("Transcription error:", error);
        const transcriptBox = document.getElementById("transcriptBox");
        transcriptBox.textContent = "Error converting audio. Please try again.";
        setConversionLoader(false);
        btn.innerHTML = micSVG() + " Start Speaking";
        btn.disabled = false;
        audioStream.getTracks().forEach(track => track.stop());
        stopUserVolBars();
      }
    };

    mediaRecorder.start();
  } catch (error) {
    console.error("Microphone access error:", error);
    alert("Microphone access denied. Please allow microphone access.");
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
}

function toggleMic() {
  const btn = document.getElementById("micBtn");
  const badge = document.getElementById("liveBadge");

  if (isRecording) {
    // Stop recording
    stopRecording();
    btn.classList.remove("active");
    badge.style.display = "none";
  } else {
    // Start recording
    const transcriptBox = document.getElementById("transcriptBox");
    const existingText = transcriptBox.textContent.trim();
    currentTranscript = existingText;
    transcriptBox.dataset.placeholder = existingText ? "Recording more…" : "Recording…";
    transcriptBox.contentEditable = "false";
    
    btn.classList.add("active");
    badge.style.display = "inline";
    
    startRecording();
  }
}

function micSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>`;
}

function animateUserVol() {
  document.querySelectorAll(".vol-bar span").forEach(b => {
    b.style.height = (3 + Math.random() * 13) + "px";
  });
}

function startUserVolBars() {
  // add visual class to user video container
  const userVid = document.querySelector('.user-vid');
  if (userVid) userVid.classList.add('user-active');

  // animate bars frequently
  if (volInterval) clearInterval(volInterval);
  volInterval = setInterval(() => {
    animateUserVol();
  }, 120);
}

function stopUserVolBars() {
  const userVid = document.querySelector('.user-vid');
  if (userVid) userVid.classList.remove('user-active');
  if (volInterval) { clearInterval(volInterval); volInterval = null; }
  // reset bars
  document.querySelectorAll('.vol-bar span').forEach(b => { b.style.height = '3px'; b.style.opacity = '0.35'; });
}

// Typing sync: reveal words in the target element over the audio duration
function syncTyping(targetEl, fullText, durationSeconds) {
  if (!targetEl || !fullText) return;
  clearTyping();

  const chars = fullText.split('');
  if (chars.length === 0) return;

  const totalMs = (durationSeconds && durationSeconds > 0) ? Math.round(durationSeconds * 1000) : Math.max(600, chars.length * 40);
  const perChar = Math.max(12, Math.round(totalMs / chars.length));

  targetEl.textContent = "";
  let i = 0;
  _typingTimer = setInterval(() => {
    targetEl.textContent += chars[i] || '';
    i++;
    if (i >= chars.length) {
      clearTyping();
    }
  }, perChar);
}

// ── Camera ────────────────────────────────────────────────────
async function startCamera() {
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
      audio: false,
    });
    document.getElementById("userVideo").srcObject = camStream;
    document.getElementById("camOff").style.display = "none";
    camOn = true;
  } catch (e) { camOn = false; }
}

function toggleCam() {
  const btn = document.getElementById("camBtn");
  if (camOn && camStream) {
    camStream.getTracks().forEach(t => t.stop());
    document.getElementById("userVideo").srcObject = null;
    document.getElementById("camOff").style.display = "flex";
    camOn = false;
    btn.classList.add("active");
  } else {
    startCamera();
    btn.classList.remove("active");
  }
}

// ── Submit Answer ─────────────────────────────────────────────
async function submitAnswer() {
  if (isRecording) toggleMic();

  const ans = currentTranscript.trim()
    || document.getElementById("transcriptBox").textContent.trim();

  if (!ans || ans.includes("Press") || ans.includes("Waiting")) {
    alert("Please speak your answer first.");
    return;
  }

  answers[currentQ] = ans;

  // Disable controls
  document.getElementById("micBtn").disabled   = true;
  document.getElementById("submitBtn").style.display = "none";

  if (shadowMode && shadowAudios[currentQ]) {
    const transcriptBox = document.getElementById("transcriptBox");
    transcriptBox.contentEditable = "false";
    transcriptBox.classList.remove("listening");

    playShadowAnswer(currentQ, () => {
      moveToNextStep();
    });
    return;
  }

  moveToNextStep();
}

// ── Skip Question ─────────────────────────────────────────────
async function skipQuestion() {
  if (shadowMode && playbackPhase.startsWith("shadow")) {
    stopCurrentPlayback();
    document.getElementById("speechBubble").style.display = "none";
    document.getElementById("skipBtn").style.display = "none";
    document.getElementById("skipBtn").textContent = "Skip Question";
    if (playbackPhase === "shadowIntro") {
      loadQuestion(0);
    } else {
      moveToNextStep();
    }
    return;
  }

  if (isRecording) toggleMic();

  // Record empty answer for this question
  answers[currentQ] = "";

  // Disable controls
  document.getElementById("micBtn").disabled = true;
  document.getElementById("skipBtn").style.display = "none";
  document.getElementById("submitBtn").style.display = "none";

  moveToNextStep();
}

// ── Analysis ──────────────────────────────────────────────────
async function showAnalysis() {
  showScreen("analysis");
  showLoading("Analyzing your performance…");

  let data = null;
  try {
    // Call server to analyze interview
    const _authHeaders = await window.__getAuthHeaders();
    data = await analyzeInterview(questions, answers, jobDesc, resumeText, intType, difficulty, "");
  } catch (e) {
    console.warn("Analysis error:", e.message);
    // Fallback data if analysis fails
    data = {
      overallScore: 70,
      landingChance: 55,
      verdict: "You showed genuine enthusiasm and relevant background. To stand out, focus on quantifying your achievements and delivering answers with a clearer structure using the STAR method.",
      strengths: ["Clear communication", "Relevant experience", "Good composure"],
      weaknesses: ["Lacked specific metrics", "Some answers were vague", "Could be more concise"],
      actionSteps: [
        "Use STAR method for every behavioral answer",
        "Quantify your results with numbers",
        "Research the company's products and culture",
        "Record yourself practicing and review",
      ],
      metrics: {
        communication: 72,
        technicalDepth: 62,
        confidence: 68,
        relevance: 74,
      },
    };
  }

  try {
    // Generate audio for verdict while still loading
    const verdictText = `Your interview score is ${data.overallScore} out of 100. ${data.verdict}`;
    const verdictAudio = await textToSpeechServer(verdictText);
    
    hideLoading();
    renderAnalysis(data);
    
    // Play verdict audio once analysis page is ready
    setTimeout(() => {
      playAudioFromBase64(verdictAudio);
    }, 500);
  } catch (e) {
    console.warn("Error generating verdict audio:", e.message);
    hideLoading();
    renderAnalysis(data);
  }
}

function renderAnalysis(d) {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  document.getElementById("anaSubtitle").textContent =
    `${intType.charAt(0).toUpperCase() + intType.slice(1)} interview · ${mins}m ${secs}s`;

  // Ring
  const circumference = 2 * Math.PI * 54;
  const fill = document.getElementById("ringFill");
  fill.style.strokeDasharray  = circumference;
  fill.style.strokeDashoffset = circumference;
  document.getElementById("overallScore").textContent = d.overallScore;
  fill.style.stroke = d.overallScore >= 75 ? "#4ade80" : d.overallScore >= 55 ? "#facc15" : "#ef4444";
  setTimeout(() => { fill.style.strokeDashoffset = circumference * (1 - d.overallScore / 100); }, 100);

  document.getElementById("analysisCards").innerHTML = `
    <div class="ana-card">
      <div class="card-head">
        <div class="card-icon icon-purple">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
        </div>
        <span class="card-title">Job Landing Chance</span>
      </div>
      <div class="landing-score">
        <div class="land-pct">${d.landingChance}%</div>
        <div class="land-label">Estimated probability<br>based on your answers</div>
      </div>
    </div>

    <div class="ana-card">
      <div class="card-head">
        <div class="card-icon icon-amber">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <span class="card-title">Performance Metrics</span>
      </div>
      <div class="metric-row">
        ${Object.entries(d.metrics).map(([k, v]) => `
          <div class="metric-item">
            <div class="metric-top">
              <span class="metric-name">${k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</span>
              <span class="metric-val">${v}/100</span>
            </div>
            <div class="meter">
              <div class="meter-fill" data-w="${v}%" style="width:0%;background:${v>=75?"#4ade80":v>=55?"#facc15":"#ef4444"}"></div>
            </div>
          </div>`).join("")}
      </div>
    </div>

    <div class="ana-card">
      <div class="card-head">
        <div class="card-icon icon-green">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span class="card-title">Strengths</span>
      </div>
      <div class="tag-list">${(d.strengths||[]).map(s=>`<span class="tag green">${s}</span>`).join("")}</div>
    </div>

    <div class="ana-card">
      <div class="card-head">
        <div class="card-icon icon-red">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <span class="card-title">Areas to Improve</span>
      </div>
      <div class="tag-list">${(d.weaknesses||[]).map(w=>`<span class="tag red">${w}</span>`).join("")}</div>
    </div>

    <div class="ana-card full">
      <div class="card-head">
        <div class="card-icon icon-amber">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </div>
        <span class="card-title">Action Steps</span>
      </div>
      <div class="steps-list">
        ${(d.actionSteps||[]).map((s,i)=>`
          <div class="step-item"><div class="step-num">${i+1}</div>${s}</div>`).join("")}
      </div>
    </div>

    <div class="ana-card full">
      <div class="card-head">
        <div class="card-icon icon-purple">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <span class="card-title">Interviewer's Assessment</span>
      </div>
      <div class="verdict-box">${d.verdict}</div>
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll(".meter-fill").forEach(el => { el.style.width = el.dataset.w; });
  }, 300);
}

// ── Restart ───────────────────────────────────────────────────
function restart() {
  window.speechSynthesis.cancel();
  stopCurrentPlayback();
  questions = []; answers = []; currentQ = 0;
  shadowAnswers = []; shadowAudios = []; shadowMode = false; playbackPhase = "idle";
  elapsedSeconds = 0; currentTranscript = "";
  transcriptInputListenerActive = false;
  stopDeviceCheckStreams();
  document.getElementById("jobDesc").value = "";
  const shadowToggle = document.getElementById("shadowModeToggle");
  if (shadowToggle) shadowToggle.checked = false;
  clearPdf();
  document.getElementById("analysisCards").innerHTML = "";
  showScreen("setup");
}

(async function initSavedResumePicker() {
  try {
    await loadSavedResumes();
  } catch (err) {
    const status = document.getElementById("savedResumeStatus");
    const hint = document.getElementById("savedResumeHint");
    if (status) status.textContent = "Unable to load saved resumes.";
    if (hint) hint.textContent = err.message;
  }
})();