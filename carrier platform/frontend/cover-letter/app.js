const SERVER_URL = "http://localhost:5000";

let resumeText = "";

const setup = document.getElementById("clSetup");
const loading = document.getElementById("clLoading");
const result = document.getElementById("clResult");
const uploadArea = document.getElementById("clUploadArea");
const resumeUpload = document.getElementById("clResumeUpload");
const fileLoaded = document.getElementById("clFileLoaded");
const fileName = document.getElementById("clFileName");
const changeBtn = document.getElementById("clChangeBtn");
const jobTitle = document.getElementById("clJobTitle");
const jobDesc = document.getElementById("clJobDesc");
const generateBtn = document.getElementById("clGenerateBtn");
const letter = document.getElementById("clLetter");
const downloadBtn = document.getElementById("clDownloadBtn");
const backBtn = document.getElementById("clBackBtn");

async function parsePdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js not loaded");
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text.replace(/\s+/g, " ").trim();
}

resumeUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    resumeText = await parsePdf(file);
    fileName.textContent = file.name;
    uploadArea.style.display = "none";
    fileLoaded.style.display = "flex";
  } catch (err) {
    alert("Error reading resume: " + err.message);
  }
});

changeBtn.addEventListener("click", () => {
  resumeUpload.value = "";
  resumeUpload.click();
});

async function generateCoverLetter() {
  const title = jobTitle.value.trim();
  const desc = jobDesc.value.trim();

  if (!resumeText) { alert("Please upload your resume PDF."); return; }
  if (!desc) { alert("Please enter a job description."); return; }

  setup.style.display = "none";
  loading.style.display = "block";

  try {
    const resp = await fetch(`${SERVER_URL}/api/generate-cover-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        jobDescription: desc,
        jobTitle: title || undefined,
      }),
    });
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
