const MODEL = "llama-3.3-70b-versatile";
const SERVER_URL = "https://careerforge-5ktc.onrender.com";

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let isRecording = false;
let isStartingRecording = false;
let currentFieldId = "";

function micSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>`;
}

function getMicButton(fieldId) {
  return document.querySelector(`.mic-btn[data-target="${fieldId}"]`);
}

function setMicButtonState(fieldId, state) {
  const button = getMicButton(fieldId);
  if (!button) return;

  if (state === "recording") {
    button.innerHTML = micSVG();
    button.title = "Stop recording";
    button.setAttribute("aria-label", "Stop recording");
    button.classList.add("active");
    button.disabled = false;
    return;
  }

  if (state === "converting") {
    button.innerHTML = micSVG();
    button.title = "Converting…";
    button.setAttribute("aria-label", "Converting audio");
    button.classList.add("active");
    button.classList.add("loading");
    button.disabled = true;
    return;
  }

  button.innerHTML = micSVG();
  button.title = "Start speaking";
  button.setAttribute("aria-label", "Start speaking");
  button.classList.remove("active");
  button.classList.remove("loading");
  button.disabled = false;
}

async function speechToTextServerBlob(blob) {
  const form = new FormData();
  form.append("file", blob, "audio.wav");

  const resp = await fetch(`${SERVER_URL}/api/speech-to-text`, {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `STT error ${resp.status}`);
  }

  const data = await resp.json();
  return data.transcript;
}

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

function appendTranscriptToField(fieldId, transcript) {
  const textarea = document.getElementById(fieldId);
  if (!textarea) return;

  const cleanedTranscript = (transcript || "").trim();
  if (!cleanedTranscript) return;

  const existingText = textarea.value.trimEnd();
  textarea.value = existingText
    ? `${existingText}\n${cleanedTranscript}`
    : cleanedTranscript;
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

async function startRecordingForField(fieldId) {
  if (isRecording || isStartingRecording) return;

  const button = getMicButton(fieldId);
  const textarea = document.getElementById(fieldId);
  if (!button || !textarea) return;

  isStartingRecording = true;
  currentFieldId = fieldId;

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      isRecording = true;
      isStartingRecording = false;
      setMicButtonState(fieldId, "recording");
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      setMicButtonState(fieldId, "converting");

      const mimeType = mediaRecorder && mediaRecorder.mimeType ? mediaRecorder.mimeType : "audio/webm";
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      try {
        let transcript;

        try {
          transcript = await speechToTextServerBlob(audioBlob);
        } catch (error) {
          const reader = new FileReader();
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });
          transcript = await speechToTextServer(base64);
        }

        appendTranscriptToField(fieldId, transcript);
      } catch (error) {
        console.error("Transcription error:", error);
        alert("Error converting audio. Please try again.");
      } finally {
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
        }
        audioStream = null;
        mediaRecorder = null;
        audioChunks = [];
        currentFieldId = "";
        setMicButtonState(fieldId, "idle");
      }
    };

    mediaRecorder.start();
  } catch (error) {
    console.error("Microphone access error:", error);
    alert("Microphone access denied. Please allow microphone access.");
    setMicButtonState(fieldId, "idle");
    currentFieldId = "";
    isRecording = false;
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      audioStream = null;
    }
    mediaRecorder = null;
    audioChunks = [];
  } finally {
    isStartingRecording = false;
  }
}

function stopRecordingForField() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
}

function toggleMicForField(event) {
  const button = event.currentTarget;
  const fieldId = button.dataset.target;

  if (isRecording) {
    if (currentFieldId === fieldId) {
      stopRecordingForField();
    }
    return;
  }

  const textarea = document.getElementById(fieldId);
  if (textarea) textarea.focus();
  startRecordingForField(fieldId);
}

function initializeMicButtons() {
  document.querySelectorAll(".mic-btn").forEach((button) => {
    const fieldId = button.dataset.target;
    button.innerHTML = micSVG();
    button.classList.remove("active");
    button.disabled = false;
    button.addEventListener("click", toggleMicForField);
    button.setAttribute("aria-label", `Speech to text for ${fieldId}`);
    button.title = "Start speaking";
  });
}

// ----------------------------
// TEMPLATE PROMPTS (BEGINNER-FRIENDLY)
// ----------------------------

const oliviaPrompt = `
YOU ARE AN EXPERT RESUME BUILDER AND ATS OPTIMIZATION ENGINE.

THIS PROMPT IS EXECUTED INSIDE AN AUTOMATED SYSTEM.
YOUR OUTPUT IS SENT DIRECTLY TO THE GROQ API AND WRITTEN INTO AN IFRAME.

====================================================
ABSOLUTE RULES — MUST FOLLOW EXACTLY

1. Output ONLY valid HTML.
2. NO markdown, NO explanations, NO backticks.
3. Must start with <html> and end with </html>.
4. Resume MUST fit EXACTLY one A4 page (210mm × 297mm).
5. No overflow, no scrolling.
6. USE THE PROVIDED HTML AND CSS EXACTLY.
7. ONLY replace text content using extracted user data.

FAILURE TO FOLLOW ANY RULE = INVALID OUTPUT.

====================================================
AUTO-EXTRACT USER INFORMATION (MANDATORY)
====================================================
From PERSONAL_INFO, extract and clean:
- Full Name
- Job Title (infer from experience if missing)
- Phone
- Email
- GitHub (convert to clickable link if present)
- LinkedIn (convert to clickable link if present)
- Location

====================================================
CRITICAL LOGIC: "SMART SHRINK" & CONTENT

1. **AUTO-RESIZE LOGIC (MANDATORY):**
   - **Analyze the Input Volume:** Look at the number of Experience entries and Projects.
   - **IF VOLUME IS HIGH** (>3 Jobs OR >3 Projects OR very long bullet points):
     - You MUST render the body tag as: <body class="compact-mode">.
     - This triggers specific CSS to reduce page margins and fonts to fit 1 page.
   - **IF VOLUME IS NORMAL:**
     - Render the body tag as: <body>.

2. **CONTENT REWRITING:**
   - Rewrite weak sentences into strong, achievement-based bullets.
   - Fix grammar, tense, formatting.
   - Remove filler words.
   - **Keep it concise:** If the resume is long, trim bullet points to 1 line each.

3. **SECTION FORMATTING:**
   - **Experience:** Company | Role | Dates
   - **Projects:** Name | Tech Stack | Bullets
   - **Skills:** Categorized (Languages, Frontend, Backend, etc.)

====================================================
USER DATA TO INSERT
====================================================
[PERSONAL_INFO]
[EDUCATION]
[EXPERIENCE]
[PROJECTS]
[SKILLS]
[EXTRACURRICULAR]
[LANGUAGES]

====================================================
USE THIS EXACT HTML TEMPLATE BELOW
(DO NOT CHANGE STRUCTURE - ONLY TEXT)
====================================================
<html>
<head>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ---------- GLOBAL ---------- */
@page { size: A4; margin: 0; }

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
  background: #fff;
  color: #333;
  line-height: 1.48;
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

html, body {
  width: 210mm;
  height: 297mm; /* Fixed A4 height */
  overflow: hidden; /* Prevent overflow */
}

/* CONTAINER */
.resume-wrapper {
  width: 210mm;
  min-height: 297mm;
  padding: 35px 50px;
  box-sizing: border-box;
  background: white;
  margin: 0 auto;
}

/* COMPACT MODE (Triggered by AI if content is long) */
body.compact-mode .resume-wrapper {
    padding: 20px 40px;
    line-height: 1.35;
}
body.compact-mode .section { margin-bottom: 12px; }
body.compact-mode .header { margin-bottom: 12px; }
body.compact-mode .header h1 { font-size: 26px; margin: 0 0 2px 0; }

/* Compact Fonts */
body.compact-mode .left p, 
body.compact-mode .left li, 
body.compact-mode .job-bullets li, 
body.compact-mode .project-bullets li,
body.compact-mode .summary-text,
body.compact-mode .edu-institution,
body.compact-mode .edu-list li { 
    font-size: 11.5px; 
    margin-bottom: 2px;
}
/* Hierarchy Maintenance in Compact Mode */
body.compact-mode .section-title { font-size: 14px; margin-bottom: 5px; } /* Smaller but bold */
body.compact-mode .job-title, body.compact-mode .project-title { font-size: 12.5px; } /* Distinctly smaller */
body.compact-mode .job-block, body.compact-mode .project-block { margin-bottom: 8px; }


/* ---------- HEADER ---------- */
.header {
  text-align: center;
  margin-bottom: 22px;
}

.header h1 {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 2.6px;
  margin: 0 0 4px 0;
  color: #222;
  text-transform: uppercase;
}
.header h2 {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 2px;
  margin-top: 4px;
  color: #666;
}

.header-divider {
  margin-top: 15px;
  border-bottom: 1px solid #E5E5E5;
}

/* ---------- COLUMNS ---------- */
.columns {
  display: grid;
  grid-template-columns: 34% 66%;
  gap: 30px;
  margin-top: 18px;
  height: 100%;
}

.columns > div:first-child {
  border-right: 1px solid #d1d1d1;
  padding-right: 20px;
}
.columns > div:last-child {
  padding-left: 10px;
}

/* ---------- SECTION TITLE (HIERARCHY FIXED) ---------- */
.section { margin-bottom: 24px; }
.section-title {
  font-size: 16px; /* INCREASED SIZE to stand out */
  font-weight: 700; /* INCREASED BOLDNESS */
  color: #222;
  text-transform: uppercase;
  letter-spacing: 1.6px;
  margin-bottom: 10px;
}

/* ---------- LEFT COLUMN ---------- */
.left p, .left li {
  font-size: 13px;
  color: #444;
  margin: 4px 0;
}

/* Education */
.edu-degree {
  font-weight: 600;
  font-size: 13.5px;
  color: #222;
  margin-bottom: 4px;
}
.edu-institution {
  font-size: 13px;
  color: #444;
  margin-bottom: 6px;
}
.edu-list { margin: 4px 0 0 16px; padding: 0; }
.edu-list li { font-size: 13px; color: #444; margin-bottom: 6px; list-style: none; position: relative; }
.edu-list li:before { content: "•"; position: absolute; left: -14px; color: #777; }

/* Skills */
.skill-label {
  display: block;
  font-weight: 600;
  font-size: 13px;
  color: #222;
  margin-top: 8px;
}
.skill-values {
  font-size: 13px;
  color: #444;
  margin: 3px 0 8px 0;
}

/* ---------- RIGHT COLUMN ---------- */
.summary-text {
  font-size: 14px;
  color: #444;
  margin-top: 2px;
}

/* Experience (HIERARCHY FIXED) */
.job-block { margin-bottom: 16px; }

.job-title {
  font-size: 14px; /* KEPT SMALLER than Section Title (16px) */
  font-weight: 600;
  color: #222;
}
.job-meta {
  font-size: 12.6px;
  color: #777;
  margin: 3px 0 6px 0;
}
.job-bullets { margin: 0; padding-left: 18px; }
.job-bullets li {
  list-style: none;
  position: relative;
  padding-left: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #444;
}
.job-bullets li:before {
  content: "•";
  position: absolute;
  left: -12px;
  color: #777;
}

/* Projects */
.project-block { margin-bottom: 16px; }
.project-title { font-size: 14px; font-weight: 600; color: #222; margin-bottom: 3px; }
.project-tech { font-size: 12.4px; color: #777; font-style: italic; margin-bottom: 5px; }
.project-bullets { margin: 0; padding-left: 18px; }
.project-bullets li { list-style: none; font-size: 13px; margin-bottom: 6px; color: #444; position: relative; }
.project-bullets li:before { content: "•"; position: absolute; left: -12px; color: #777; }

.project-link {
  display: inline-block;
  font-size: 12px;
  padding: 3px 8px;
  margin-top: 4px;
  background: #f0f0f0;
  color: #444;
  border-radius: 4px;
  text-decoration: none;
}

/* LINKS */
.hidden-link { color: #333; text-decoration: none; font-size: 13px; }

/* PRINT MEDIA QUERY */
@media print {
  .resume-wrapper { padding: 35px 50px; }
  body.compact-mode .resume-wrapper { padding: 20px 40px; }
}
</style>
</head>

<body>
<div class="resume-wrapper">

  <div class="header">
    <h1>[INSERT_NAME]</h1>
    <h2>[INSERT_JOB_TITLE]</h2>
    <div class="header-divider"></div>
  </div>

  <div class="columns">
    
    <div class="left">
      <div class="section">
        <div class="section-title">Contact</div>
        [INSERT_CONTACT]
      </div>

      <div class="section">
        <div class="section-title">Education</div>
        [EDUCATION]
      </div>

      <div class="section">
        <div class="section-title">Skills</div>
        [SKILLS]
      </div>

      <div class="section">
        <div class="section-title">Languages</div>
        [LANGUAGES]
      </div>
    </div>

    <div class="right">
      <div class="section">
        <div class="section-title">Profile Summary</div>
        <div class="summary-text">
          [AI GENERATED CONTENT: Concise, professional summary.]
        </div>
      </div>

      <div class="section">
        <div class="section-title">Experience</div>
        [EXPERIENCE]
      </div>

      <div class="section">
        <div class="section-title">Projects</div>
        [PROJECTS]
      </div>

      <div class="section section-last">
        <div class="section-title">Extracurricular</div>
        [EXTRACURRICULAR]
      </div>
    </div>

  </div>
</div>
</body>
</html>

`;

const atsPrompt = `
You are generating a resume using the “ATS Classic Serif Resume Template (Richard Williams Style)”.

❗ OUTPUT RULES (MANDATORY — DO NOT IGNORE):
- You MUST output a full HTML document only.
- MUST begin with <html>, include <head><style>…</style></head>, and <body>.
- DO NOT use Markdown.
- DO NOT return backticks.
- NO explanations — only return HTML.
 DO NOT use *, _, #, or any Markdown formatting under ANY circumstances.
- ONLY return clean HTML.
- Auto-clean user text: remove *, _, •, markdown bullets, hashtags, emojis.
- Normalize spacing, remove blank lines, remove duplicated words.
- ALL bullet points MUST be real HTML <li>only.


====================================================
AUTO-EXTRACT USER INFORMATION (MANDATORY)
====================================================

From PERSONAL_INFO extract:
- Full Name
- Job Title (infer if missing)
- Phone
- Email
- GitHub (convert to clickable hidden-link)
- LinkedIn (convert to clickable hidden-link)
- Location

Insert into:
[INSERT_NAME]
[INSERT_CONTACT]

====================================================
AUTO-STRUCTURE USER CONTENT
====================================================

Rewrite all user input professionally:
- Convert tasks → achievements
- Add measurable improvements (20–40% where logical)
- Fix grammar, tense, short bullets
- Infer missing details logically

====================================================
SECTION FORMATS (MUST FOLLOW)
====================================================

EXPERIENCE FORMAT:
For every job found in EXPERIENCE:
- Rewrite responsibilities into **achievement-driven**, **quantified** bullet points.
- Use **strong verbs**: Developed, Implemented, Optimized, Reduced, Improved…
- Convert vague tasks → measurable accomplishments (20–50% improvements).
- Infer missing details (duration, tech stack, responsibilities) only when logical
<div class="company-line">
  <span class="company">COMPANY NAME</span>
  <span class="location">CITY, COUNTRY</span>
</div>
<div class="role-line">
  <span class="role">Role Title (italic)</span>
  <span class="dates">Dates (italic)</span>
</div>
<ul>
  <li>Achievement bullet…</li>
  <li>Achievement bullet…</li>
</ul>



SKILLS FORMAT:
- Bulleted list, each item plain serif font


EDUCATION RULES:
- MUST follow this structure:
  <div class="edu-block">
    <div class="edu-school">
      University Name (bold uppercase)
      Location (right aligned)
    </div>
    <div class="edu-degree">Degree title (italic)</div>
    <div class="edu-details">Graduation year, CGPA, achievements</div>
  </div>

PROJECT RULES:

For each project:
- Extract project name
- Extract tech stack in parentheses: (React, Node.js, MongoDB)
- Rewrite bullets to emphasize measurable outcomes
- If GitHub or live link exists → show clickable **label only**, not the raw URL
- Format:
- MUST provide 2–4 quantified bullets per project (20–40% improvements, speed boosts, accuracy numbers)
- MUST include (Tech stack) line in italic

====================================================
AUTO-CATEGORIZE SKILLS
====================================================

Take raw SKILLS and reorganize automatically into these groups:

Languages:  
Frontend:  
Backend:  
Databases:  
Tools:  
Cloud:  





====================================================
USER DATA TO INSERT
====================================================

PERSONAL INFO:
[PERSONAL_INFO]

EDUCATION:
[EDUCATION]

EXPERIENCE:
[EXPERIENCE]

PROJECTS:
[PROJECTS]

SKILLS:
[SKILLS]

EXTRACURRICULAR:
[EXTRACURRICULAR]

====================================================
USE THIS EXACT HTML TEMPLATE BELOW
====================================================

<html>
<head>
<style>
body {
    font-family: "Times New Roman", serif;
    margin: 20px 40px; /* FIXED smaller margins */
    color: #000;
}

/* --- HEADER --- */
h1 {
    text-align: center;
    font-size: 30px;
    margin-bottom: 8px;
    font-weight: bold;
}

.contact {
    text-align: center;
    font-size: 12px;
    margin-bottom: 12px;
}

.summary {
    text-align: center;
    font-size: 13px;
    font-style: italic;
    margin-bottom: 22px;
}

/* --- SECTION TITLES --- */
.section-title {
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 18px;
    margin-bottom: 4px;
}

.hr {
    border-bottom: 1px solid #000;
    margin-bottom: 12px;
}

/* --- EXPERIENCE BLOCKS --- */
.company-line {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 10px;
}

.location {
    font-size: 11px;       /* FIXED smaller location font */
    font-weight: normal;
    text-transform: none;
}

.role-line {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-style: italic;
    margin-top: 2px;
}

.dates {
    font-size: 11px;      /* FIXED smaller date font */
    font-style: italic;
}

ul {
    font-size: 12px;
    padding-left: 22px;
    margin-top: 4px;
}

ul li {
    margin-bottom: 4px;
}

/* --- EDUCATION --- */
.edu-block {
    margin-bottom: 10px;
}

.edu-school {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
}

.edu-degree {
    font-size: 12px;
    font-style: italic;
    margin-top: 2px;
}

.edu-details {
    font-size: 12px;
    margin-top: 4px;
}

/* --- PROJECTS --- */
.project-title {
    font-size: 14px;
    font-weight: bold;
    text-transform: none;
    margin-top: 8px;
}

.project-tech {
    font-size: 12px;
    font-style: italic;
    margin-top: 1px;
}

.project-bullets li {
    font-size: 12px;
}

/* --- Skills bullet formatting --- */
.skills-list li {
    font-size: 12px;
    margin-bottom: 3px;
}

.hidden-link span { display:none; }
</style>
</head>

<body>

<h1>[INSERT_NAME]</h1>
<div class="contact">[INSERT_CONTACT]</div>
<div class="summary">[AI GENERATED CONTENT: Concise, professional summary based on experience level.1-2 line ]</div>

<div class="section-title">Professional Experience</div>
<div class="hr"></div>
[EXPERIENCE]

<div class="section-title">Education</div>
<div class="hr"></div>
[EDUCATION]

<div class="section-title">Projects</div>
<div class="hr"></div>
[PROJECTS]

<div class="section-title">Skills</div>
<div class="hr"></div>
[SKILLS]

<div class="section-title">Extracurricular</div>
<div class="hr"></div>
[EXTRACURRICULAR]

</body>
</html>

`;



// ----------------------------
// GENERATE RESUME
// ----------------------------
document.getElementById("generateBtn").addEventListener("click", async () => {
  const template = document.getElementById("templateSelect").value;
  const generateBtn = document.getElementById("generateBtn");

  const setGenerateLoading = (isLoading) => {
    if (!generateBtn) return;
    generateBtn.classList.toggle("loading", isLoading);
    generateBtn.disabled = isLoading;
  };

  window.generatedLatexPdfBlob = null;
  window.generatedLatexSource = "";
  const editLatexBtn = document.getElementById("editLatexBtn");
  if (editLatexBtn) editLatexBtn.style.display = "none";
  const latexEditorPanel = document.getElementById("latexEditorPanel");
  if (latexEditorPanel) latexEditorPanel.style.display = "none";

  // Show loading UI
  setGenerateLoading(true);
  document.getElementById("loading").classList.add("active");

  if (template === "ats" || template === "olivia" || template === "academic") {
    try {
      const response = await fetch("https://careerforge-5ktc.onrender.com/generate-resume-latex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalInfo: document.getElementById("personalInfo").value,
          education: document.getElementById("education").value,
          experience: document.getElementById("experience").value,
          projects: document.getElementById("projects").value,
          skills: document.getElementById("skills").value,
          extracurricular: document.getElementById("extracurricular").value,
          template,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const pdfBytes = Uint8Array.from(atob(data.pdf), (c) => c.charCodeAt(0));
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      const frame = document.getElementById("resumeFrame");
      frame.src = blobUrl;

      window.generatedLatexPdfBlob = blob;
      window.generatedLatexSource = data.latex || "";
      if (editLatexBtn) editLatexBtn.style.display = "inline-block";
      if (window.enableDownload) window.enableDownload();
    } catch (err) {
      alert("LaTeX Resume Error: " + err.message);
    }

    document.getElementById("loading").classList.remove("active");
    setGenerateLoading(false);
    return;
  }
});

// ----------------------------
// COPY HTML BUTTON
// ----------------------------
const copyBtn = document.getElementById("copyBtn");
if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    if (!window.generatedResumeHTML) return alert("Generate a resume first!");
    navigator.clipboard.writeText(window.generatedResumeHTML);
    alert("Resume HTML copied!");
  });
} else {
  // copy button is optional in the UI; nothing to do if it's missing
}

// ----------------------------
// DOWNLOAD HTML BUTTON
// ----------------------------
// ----------------------------
// DOWNLOAD → PRINT IFRAME ONLY
// ----------------------------

// (Removed duplicate simple handler — styling for iframe is now handled directly after rendering)
// Initialize download button and ensure handler registers whether the
// script runs before or after DOMContentLoaded.
// ----------------------------
// DOWNLOAD → PRINT IFRAME ONLY
// ----------------------------
(function initDownload() {
  const setup = () => {
    const downloadBtn = document.getElementById("downloadBtn");
    const frame = document.getElementById("resumeFrame");
    const editLatexBtn = document.getElementById("editLatexBtn");
    const latexEditorPanel = document.getElementById("latexEditorPanel");
    const latexEditorTextarea = document.getElementById("latexEditorTextarea");
    const closeEditorBtn = document.getElementById("closeEditorBtn");
    const recompileBtn = document.getElementById("recompileBtn");

    if (!downloadBtn || !frame) return;

    if (editLatexBtn && latexEditorPanel && latexEditorTextarea && closeEditorBtn && recompileBtn) {
      editLatexBtn.addEventListener("click", () => {
        latexEditorTextarea.value = window.generatedLatexSource || "";
        latexEditorPanel.style.display = "flex";
      });

      closeEditorBtn.addEventListener("click", () => {
        latexEditorPanel.style.display = "none";
      });

      recompileBtn.addEventListener("click", async () => {
        const latex = latexEditorTextarea.value;
        window.generatedLatexSource = latex;

        recompileBtn.textContent = "Compiling...";
        recompileBtn.disabled = true;

        try {
          const response = await fetch("https://careerforge-5ktc.onrender.com/recompile-latex", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ latex }),
          });

          const data = await response.json();
          if (!data.success) throw new Error(data.error);

          const pdfBytes = Uint8Array.from(atob(data.pdf), (c) => c.charCodeAt(0));
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(blob);

          document.getElementById("resumeFrame").src = blobUrl;
          window.generatedLatexPdfBlob = blob;
          latexEditorPanel.style.display = "none";
          if (window.enableDownload) window.enableDownload();
        } catch (err) {
          alert("Recompile failed: " + err.message);
        }

        recompileBtn.textContent = "Recompile PDF";
        recompileBtn.disabled = false;
      });
    }

    downloadBtn.addEventListener("click", () => {
      if (window.generatedLatexPdfBlob) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(window.generatedLatexPdfBlob);
        a.download = "resume.pdf";
        a.click();
        return;
      }

      // 1. Check if content exists
      if (!frame.contentWindow || !frame.contentDocument) return;

      // 2. TEMPORARILY RESTORE FULL SIZE FOR PRINTING
      // We force the iframe width to match A4 so the browser print dialog sees full width
      const originalWidth = frame.style.width;
      const originalHeight = frame.style.height;
      const frameDoc = frame.contentDocument;
      const originalTransform = frameDoc.body.style.transform;

      // Force full A4 size
      frame.style.width = "210mm";
      frame.style.height = "297mm";
      frameDoc.body.style.transform = "none"; // Remove zoom

      // 3. PRINT
      frame.contentWindow.focus();
      frame.contentWindow.print();

      // 4. RESTORE PREVIEW (After a tiny delay to ensure print dialog caught it)
      // Note: On mobiles, print dialogs pauses JS, so this runs after you close print.
      setTimeout(() => {
        frame.style.width = originalWidth;
        frame.style.height = originalHeight;
        frameDoc.body.style.transform = originalTransform;
      }, 500);
    });

    window.enableDownload = () => {
      downloadBtn.disabled = false;
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
// -------- RESUME DEMO DATA --------
const resumeDemoData = {
  1: {
    personalInfo: `Arjun Mehta, arjun.mehta@example.com, +91 9876543210, Bengaluru India, linkedin maybe linkedin.com/in/arjunmehta, github.com/arjun-dev or something like that. interested in backend dev, cloud, AI stuff and scalable systems etc.
DOB maybe 2002. willing to relocate. open to remote and hybrid jobs.
`,

    education: `B.Tech CSE from SRM Institute Chennai finished in 2024 CGPA 8.7 maybe 8.6 idk exactly.
Did subjects like DSA, DBMS, Operating Systems, Computer Networks, AI ML cloud computing etc.
12th CBSE around 84 percent from Delhi Public School.
10th ICSE around 88 percent.
Participated in hackathons and coding contests during college.
`,

    experience: `Software Engineering Intern Infosys May 2023 to July 2023.
worked on internal dashboard project using React and Node backend. made some APIs and fixed bugs and improved speed of pages maybe around 30 or 40 percent not sure. also worked with charts and realtime data stuff using websockets maybe.
team had around 5 or 6 developers and we used agile meetings everyday.

Backend Intern at Zeta Tech Jan 2023 to Mar 2023.
worked mostly in FastAPI and PostgreSQL. created auth APIs login signup forgot password etc. optimized some SQL queries and caching. reduced API response times from maybe 2 sec to below 1 sec in some places.
also worked with docker little bit.

Freelance Web Dev small local client project.
made a gym website with payment integration and admin panel. client wanted responsive design and whatsapp integration. deployed on vercel and render free tier.
`,

    projects: `Smart Attendance System using Python OpenCV Flask and MySQL. face recognition based attendance system for college project. accuracy was decent maybe 90+ but not fully stable in low light. had admin login attendance logs export and analytics charts.


AI Resume Builder using HTML CSS JS Gemini API.
AI powered resume generation platform with PDF export and ATS optimization. users can input details and generate resumes automatically. added templates and live preview. some latency issues were there with API sometimes.

Realtime Chat App Socket.io Node React.
users can join rooms and send realtime messages. added typing indicator and online offline status. tried adding video calling but couldnt fully finish it.

Issue Intelligence Dashboard.
uploaded CSV support ticket data and generated trending issue insights using clustering and analytics. calculated issue growth and impact scores. frontend in React and backend in Express.
`,

    skills: `JavaScript Python Java C++ HTML CSS React Node Express MongoDB MySQL PostgreSQL FastAPI Docker Git GitHub Tailwind Firebase Redis maybe AWS basics Linux REST APIs JWT authentication responsive design problem solving debugging DSA OOP DBMS OS CN cloud basics prompt engineering AI tools
`,

    extracurricular: `participated in hackathons and tech fests.
did coding practice on leetcode and hackerrank sometimes.
helped juniors with web dev projects.
self learned MERN stack from youtube and udemy.
interested in startups AI products and backend engineering.
languages english hindi little bengali.
`,
  },
};

// -------- DOM READY --------
function setupResumeBuilderButtons() {
  const demo1 = document.getElementById("resumeDemo1");
  const demo2 = document.getElementById("resumeDemo2");

  if (demo1 && demo2) {
    demo1.addEventListener("click", () => injectResumeDemo(1));
    demo2.addEventListener("click", () => injectResumeDemo(2));
  } else {
    console.warn("Resume demo buttons not found in DOM");
  }

  initializeMicButtons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupResumeBuilderButtons);
} else {
  setupResumeBuilderButtons();
}

// -------- INJECT FUNCTION --------
function injectResumeDemo(option) {
  const data = resumeDemoData[option];

  document.getElementById("personalInfo").value = data.personalInfo;
  document.getElementById("education").value = data.education;
  document.getElementById("experience").value = data.experience;
  document.getElementById("projects").value = data.projects;
  document.getElementById("skills").value = data.skills;
  document.getElementById("extracurricular").value = data.extracurricular;
}
