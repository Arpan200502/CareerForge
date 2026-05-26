const SERVER_URL = "http://localhost:5000";

let resumeText = "";
let activeResumeName = "";

const setup = document.getElementById("clSetup");
const loading = document.getElementById("clLoading");
const result = document.getElementById("clResult");
const uploadArea = document.getElementById("clUploadArea");
const resumeUpload = document.getElementById("clResumeUpload");
const fileLoaded = document.getElementById("clFileLoaded");
const fileName = document.getElementById("clFileName");
const changeBtn = document.getElementById("clChangeBtn");
const savedResumeSelect = document.getElementById("clSavedResumeSelect");
const savedResumeStatus = document.getElementById("clSavedResumeStatus");
const savedResumeHint = document.getElementById("clSavedResumeHint");
const jobTitle = document.getElementById("clJobTitle");
const jobDesc = document.getElementById("clJobDesc");
const generateBtn = document.getElementById("clGenerateBtn");
const letter = document.getElementById("clLetter");
const downloadBtn = document.getElementById("clDownloadBtn");
const backBtn = document.getElementById("clBackBtn");

async function waitForResumeHelpers() {
  for (let i = 0; i < 80; i++) {
    if (window.__getSavedResumes && window.__loadSavedResumePdf && window.__readPdfText) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Resume helpers not ready");
}

async function extractPdfText(source) {
  await waitForResumeHelpers();
  const rawText = await window.__readPdfText(source, { includeLinks: false });
  return rawText.replace(/\s+/g, " ").trim();
}

function clearUploadSelection() {
  resumeUpload.value = "";
  uploadArea.style.display = "block";
  fileLoaded.style.display = "none";
  fileName.textContent = "resume.pdf";
}

function clearSavedSelection() {
  savedResumeSelect.value = "";
  savedResumeStatus.textContent = savedResumeHint.textContent || "Select a saved resume from your Profile.";
}

async function loadSavedResumes() {
  await waitForResumeHelpers();
  const resumes = await window.__getSavedResumes();
  savedResumeSelect.innerHTML = "";

  if (!resumes.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved resumes yet";
    savedResumeSelect.appendChild(option);
    savedResumeSelect.disabled = true;
    savedResumeStatus.textContent = "No saved resumes yet.";
    savedResumeHint.textContent = "Go to your Profile to save a resume, then return here.";
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a saved resume";
  savedResumeSelect.appendChild(placeholder);

  resumes.forEach((resume) => {
    const option = document.createElement("option");
    option.value = resume._id;
    option.textContent = resume.title || "Untitled Resume";
    savedResumeSelect.appendChild(option);
  });

  savedResumeSelect.disabled = false;
  savedResumeStatus.textContent = "Pick one of your saved resumes.";
  savedResumeHint.textContent = "Read-only selection. Nothing is written back to your Profile.";
}

async function selectSavedResume(resumeId) {
  if (!resumeId) {
    resumeText = "";
    activeResumeName = "";
    clearUploadSelection();
    savedResumeStatus.textContent = savedResumeHint.textContent || "Select a saved resume from your Profile.";
    return;
  }

  await waitForResumeHelpers();
  savedResumeStatus.textContent = "Loading saved resume...";
  const resumes = await window.__getSavedResumes();
  const selected = resumes.find((resume) => resume._id === resumeId);
  const blob = await window.__loadSavedResumePdf(resumeId);
  resumeText = await extractPdfText(blob);
  activeResumeName = `Saved: ${selected?.title || "Untitled Resume"}`;
  clearUploadSelection();
  fileName.textContent = selected?.title || "Saved resume";
  savedResumeStatus.textContent = `Using ${selected?.title || "the selected saved resume"}.`;
  savedResumeHint.textContent = "Read-only selection. Nothing is written back to your Profile.";
}

resumeUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    resumeText = await extractPdfText(file);
    activeResumeName = file.name;
    clearSavedSelection();
    fileName.textContent = file.name;
    uploadArea.style.display = "none";
    fileLoaded.style.display = "flex";
  } catch (err) {
    alert("Error reading resume: " + err.message);
  }
});

changeBtn.addEventListener("click", () => {
  clearUploadSelection();
  resumeUpload.click();
});

savedResumeSelect.addEventListener("change", async (e) => {
  try {
    await selectSavedResume(e.target.value);
  } catch (err) {
    savedResumeStatus.textContent = "Could not load selected resume.";
    alert("Error loading saved resume: " + err.message);
  }
});

async function generateCoverLetter() {
  const title = jobTitle.value.trim();
  const desc = jobDesc.value.trim();

  if (!resumeText) { alert("Please upload your resume PDF."); return; }
  if (!desc) { alert("Please enter a job description."); return; }

  setup.style.display = "none";
  loading.style.display = "block";

  try {
    const authHeaders = window.__getAuthHeaders ? await window.__getAuthHeaders() : {};
    const resp = await fetch(`${SERVER_URL}/api/generate-cover-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        resumeText,
        jobDescription: desc,
        jobTitle: title || undefined,
      }),
    });

    if (window.__handlePlanLimitResponse && await window.__handlePlanLimitResponse(resp, "Cover Letter", "coverLetter")) {
      loading.style.display = "none";
      setup.style.display = "block";
      return;
    }

    const data = await resp.json();
    if (!data.success) throw new Error(data.error || "Generation failed");

    loading.style.display = "none";
    result.style.display = "block";
    letter.textContent = data.coverLetter;
  } catch (err) {
    alert("Error: " + err.message);
    loading.style.display = "none";
    setup.style.display = "block";
  }
}

generateBtn.addEventListener("click", generateCoverLetter);

downloadBtn.addEventListener("click", () => {
  window.print();
});

backBtn.addEventListener("click", () => {
  result.style.display = "none";
  setup.style.display = "block";
});

// ── Keyboard shortcut ──
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") generateCoverLetter();
});

(async function initSavedResumes() {
  try {
    await loadSavedResumes();
  } catch (err) {
    savedResumeStatus.textContent = "Unable to load saved resumes.";
    savedResumeHint.textContent = err.message;
  }
})();
