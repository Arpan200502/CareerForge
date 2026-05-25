const SERVER_URL = "http://localhost:5000";

let allFilterOptions = { countries: [], sources: [], experienceLevels: [] };
let resumeText = localStorage.getItem("jl_resumeText") || "";

// ── DOM refs ──
const uploadArea = document.getElementById("uploadArea");
const resumeUpload = document.getElementById("resumeUpload");
const resumeLoaded = document.getElementById("resumeLoaded");
const changeResumeBtn = document.getElementById("changeResumeBtn");
const jobGrid = document.getElementById("jobGrid");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const jobCount = document.getElementById("jobCount");
const sourceInfo = document.getElementById("sourceInfo");
const refreshBtn = document.getElementById("refreshBtn");
const fetchNewBtn = document.getElementById("fetchNewBtn");

// Filter elements
const filterTitle = document.getElementById("filterTitle");
const filterCountry = document.getElementById("filterCountry");
const filterLocation = document.getElementById("filterLocation");
const filterExperience = document.getElementById("filterExperience");
const filterJobType = document.getElementById("filterJobType");
const filterRemote = document.getElementById("filterRemote");
const filterHoursOld = document.getElementById("filterHoursOld");
const filterLimit = document.getElementById("filterLimit");
const filterPlatforms = document.getElementById("filterPlatforms");
const filterKeywords = document.getElementById("filterKeywords");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

// ── Build filters object from UI ──
function getFilters() {
  const platformChecks = filterPlatforms.querySelectorAll("input[type=checkbox]:checked");
  const platforms = Array.from(platformChecks).map((cb) => cb.value);
  const keywordChecks = filterKeywords.querySelectorAll("input[type=checkbox]:checked");
  const keywords = Array.from(keywordChecks).map((cb) => cb.value);
  return {
    title: filterTitle.value.trim() || undefined,
    country: filterCountry.value || undefined,
    location: filterLocation.value.trim() || undefined,
    experienceLevel: filterExperience.value || undefined,
    jobType: filterJobType.value || undefined,
    remote: filterRemote.value || undefined,
    platforms: platforms.length > 0 ? platforms : undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    hoursOld: filterHoursOld.value || undefined,
    limit: parseInt(filterLimit.value) || 50,
  };
}

// ── Fetch filter options from backend ──
async function loadFilterOptions() {
  try {
    const resp = await fetch(`${SERVER_URL}/api/jobs/filters`);
    const data = await resp.json();
    if (data.success) {
      allFilterOptions = data.filters;
      filterCountry.innerHTML = '<option value="">All Countries</option>';
      (data.filters.countries || []).forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        filterCountry.appendChild(opt);
      });
    }
  } catch (err) {
    console.warn("Could not load filter options:", err.message);
  }
}

// ── PDF Parsing (for resume upload) ──
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
    const annots = await page.getAnnotations();
    const urls = annots.filter(a => a.subtype === "Link").map(a => a.url || a.action?.url).filter(Boolean);
    if (urls.length) text += "Links: " + urls.join(", ") + "\n";
  }
  return text.replace(/\s+/g, " ").trim();
}

resumeUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    resumeText = await parsePdf(file);
    localStorage.setItem("jl_resumeText", resumeText);
    uploadArea.style.display = "none";
    resumeLoaded.style.display = "block";
  } catch (err) {
    alert("Error reading resume: " + err.message);
  }
});

changeResumeBtn.addEventListener("click", () => {
  resumeUpload.value = "";
  resumeUpload.click();
});

if (resumeText) {
  uploadArea.style.display = "none";
  resumeLoaded.style.display = "block";
}

// ── Apply / Clear / Refresh / Fetch New ──
applyFiltersBtn.addEventListener("click", () => fetchAndRender());

clearFiltersBtn.addEventListener("click", () => {
  filterTitle.value = "";
  filterCountry.value = "";
  filterLocation.value = "";
  filterExperience.value = "";
  filterJobType.value = "";
  filterRemote.value = "";
  filterHoursOld.value = "";
  filterLimit.value = "200";
  filterPlatforms.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = true));
  filterKeywords.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = false));
  fetchAndRender();
});

refreshBtn.addEventListener("click", () => {
  fetchAndRender();
});

// DEMO: manually trigger a new job fetch from all platforms
fetchNewBtn.addEventListener("click", async () => {
  fetchNewBtn.disabled = true;
  fetchNewBtn.textContent = "Fetching...";
  sourceInfo.textContent = "Fetching jobs from all platforms... (check server console)";
  try {
    const resp = await fetch(`${SERVER_URL}/api/run-fetch`, { method: "POST" });
    const data = await resp.json();
    if (data.success) {
      sourceInfo.textContent = "Fetch started! Click Refresh in 2-3 mins to load new jobs.";
      setTimeout(() => { sourceInfo.textContent = ""; }, 8000);
    } else {
      sourceInfo.textContent = "Fetch failed: " + (data.error || "unknown error");
    }
  } catch (err) {
    sourceInfo.textContent = "Fetch error: " + err.message;
  }
  // Keep button disabled for 60s so user knows backend is still scraping
  setTimeout(() => {
    fetchNewBtn.disabled = false;
    fetchNewBtn.textContent = "Fetch New Jobs";
  }, 60000);
});

// ── Main: fetch jobs with filters from backend ──
async function fetchAndRender() {
  loadingState.style.display = "block";
  emptyState.style.display = "none";
  jobGrid.innerHTML = "";
  sourceInfo.textContent = "";

  try {
    const filters = getFilters();
    console.log("[Jobs] Filters:", JSON.stringify(filters));

    const matchRes = await fetch(`${SERVER_URL}/api/match-jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters }),
    });
    const data = await matchRes.json();
    const jobs = data.jobs || [];

    if (!jobs.length) {
      loadingState.style.display = "none";
      emptyState.style.display = "block";
      if (data.totalJobs === 0) {
        emptyState.innerHTML = "<p>No jobs in database yet. Click <strong>Fetch New Jobs</strong> above to trigger a fresh scrape.</p>";
      } else {
        emptyState.innerHTML = "<p>No jobs match your filters. Try broader criteria.</p>";
      }
      return;
    }

    renderJobs(jobs);
  } catch (err) {
    console.error("Fetch error:", err);
    loadingState.style.display = "none";
    emptyState.style.display = "block";
    emptyState.innerHTML = "<p>Error loading jobs. Please try again.</p>";
  }

  loadingState.style.display = "none";
}

// ── Render job cards ──
function renderJobs(jobs) {
  jobGrid.innerHTML = "";
  emptyState.style.display = "none";
  jobCount.textContent = `${jobs.length} job${jobs.length !== 1 ? "s" : ""} found`;

  const platforms = [...new Set(jobs.map((j) => j.source).filter(Boolean))];
  sourceInfo.textContent = `Sources: ${platforms.join(", ")}`;

  jobs.forEach((job, idx) => {
    const card = document.createElement("div");
    card.className = "jl-card";
    card.dataset.idx = idx;

    const skills = (job.skills || []).slice(0, 8);
    const desc = job.description || "";

    const remoteBadge = job.isRemote ? '<span class="jl-remote-badge">Remote</span>' : "";
    const expBadge = job.experienceLevel ? `<span class="jl-exp-badge jl-exp-${job.experienceLevel}">${job.experienceLevel}</span>` : "";
    const typeBadge = job.jobType ? `<span class="jl-type-badge">${escHtml(job.jobType)}</span>` : "";

    card.innerHTML = `
      <div class="jl-card-top">
        <div>
          <div class="jl-card-title">${escHtml(job.title)}</div>
          <div class="jl-card-company">${escHtml(job.company)}</div>
          <div class="jl-card-location">${escHtml(job.location || "")}</div>
        </div>
      </div>
      <div class="jl-card-meta">
        ${expBadge}
        ${typeBadge}
        ${remoteBadge}
        ${job.source ? `<span class="jl-source-badge">${escHtml(job.source)}</span>` : ""}
      </div>
      ${job.salary ? `<div class="jl-card-salary">${escHtml(job.salary)}</div>` : ""}
      ${skills.length ? `<div class="jl-card-skills">${skills.map((s) => `<span class="jl-skill-tag">${escHtml(s)}</span>`).join("")}</div>` : ""}
      <div class="jl-card-desc">${escHtml(desc)}</div>
      <div class="jl-card-footer">
        <span class="jl-card-date">${job.datePosted ? `Posted: ${job.datePosted}` : ""}</span>
        <span class="jl-card-view">Click to view full details &rarr;</span>
      </div>
    `;

    card.addEventListener("click", () => {
      // Store selected job data into sessionStorage for the detail page
      try {
        sessionStorage.setItem("jl_selectedJob", JSON.stringify(job));
      } catch (_) {}
      window.open(`/job-listings/job-detail.html?idx=${idx}`, "_blank");
    });

    jobGrid.appendChild(card);
  });
}

function escHtml(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// ── Init: always fetch fresh from backend ──
(async function init() {
  await loadFilterOptions();
  await fetchAndRender();
})();
