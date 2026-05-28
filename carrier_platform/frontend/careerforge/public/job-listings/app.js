const DEFAULT_SERVER_URL = "http://localhost:5000";
let SERVER_URL = window.__SERVER_URL || DEFAULT_SERVER_URL;

async function resolveServerUrl() {
  if (typeof window.__resolveServerUrl === "function") {
    try {
      SERVER_URL = await window.__resolveServerUrl();
    } catch (err) {
      console.error("[Jobs] Failed to resolve backend URL:", err?.message || err);
    }
  }
  return SERVER_URL;
}

let allFilterOptions = { countries: [], sources: [], experienceLevels: [] };
let resumeText = localStorage.getItem("jl_resumeText") || "";
let activeResumeSource = resumeText ? "session" : "";

// ── DOM refs ──
const uploadArea = document.getElementById("uploadArea") || null;
const resumeUpload = document.getElementById("resumeUpload");
const resumeLoaded = document.getElementById("resumeLoaded");
const resumeLoadedLabel = document.getElementById("resumeLoadedLabel");
const resumeLoadedMeta = document.getElementById("resumeLoadedMeta");
const changeResumeBtn = document.getElementById("changeResumeBtn");
const savedResumeSelect = document.getElementById("jlSavedResumeSelect") || document.getElementById("savedResumeSelect");
const savedResumeStatus = document.getElementById("jlSavedResumeStatus") || document.getElementById("savedResumeStatus");
const savedResumeHint = document.getElementById("jlSavedResumeHint") || document.getElementById("savedResumeHint");
const jobGrid = document.getElementById("jobGrid");
const pagination = document.getElementById("pagination");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const jobCount = document.getElementById("jobCount");
const sourceInfo = document.getElementById("sourceInfo");
const refreshBtn = document.getElementById("refreshBtn");
const fetchNewBtn = document.getElementById("fetchNewBtn");

let currentPage = 1;
let currentTotalPages = 1;
let currentTotalJobs = 0;
let planJobLimit = null;

const RESULT_LIMIT_OPTIONS = [10, 25, 50, 100, 200];

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
    limit: getRequestedResultLimit(),
  };
}

function getRequestedResultLimit() {
  const selectedLimit = parseInt(filterLimit.value) || 50;
  if (planJobLimit == null || planJobLimit === Infinity) return selectedLimit;
  return Math.min(selectedLimit, planJobLimit);
}

function getMaxSelectableResultLimit() {
  if (planJobLimit == null || planJobLimit === Infinity) {
    return RESULT_LIMIT_OPTIONS[RESULT_LIMIT_OPTIONS.length - 1];
  }

  const allowed = RESULT_LIMIT_OPTIONS.filter((value) => value <= planJobLimit);
  return allowed.length ? allowed[allowed.length - 1] : RESULT_LIMIT_OPTIONS[0];
}

function applyPlanResultLimit() {
  if (!filterLimit) return;

  const limitRow = filterLimit.closest(".jl-filter-group");
  const limitLabel = limitRow?.querySelector("label");

  if (planJobLimit != null && planJobLimit !== Infinity) {
    // Free/Pro — fixed total cap, hide dropdown, show label
    if (limitRow) limitRow.style.display = "none";

    const infoEl = document.getElementById("planLimitInfo") || (() => {
      const el = document.createElement("div");
      el.id = "planLimitInfo";
      el.className = "jl-plan-limit-info";
      el.style.cssText = "color: var(--accent); font-size: 0.85rem; margin-bottom: 0.5rem;";
      filterLimit.parentNode.insertBefore(el, filterLimit);
      return el;
    })();
    infoEl.textContent = `Your plan allows viewing up to ${planJobLimit} jobs total`;
  } else {
    // Max plan — show dropdown with all options
    if (limitRow) limitRow.style.display = "";
    const infoEl = document.getElementById("planLimitInfo");
    if (infoEl) infoEl.remove();

    Array.from(filterLimit.options).forEach((option) => {
      option.disabled = false;
    });
  }
}

async function refreshPlanResultLimit() {
  if (typeof window.__loadPlanUsage !== "function") return;

  const usage = await window.__loadPlanUsage();
  if (!usage || !usage.limits) return;

  const rawLimit = usage.limits.viewJobs;
  planJobLimit = rawLimit === Infinity ? Infinity : Number(rawLimit) || null;
  applyPlanResultLimit();
}

function setPaginationState(totalJobs, totalPages, page) {
  currentTotalJobs = totalJobs || 0;
  currentTotalPages = Math.max(parseInt(totalPages) || 1, 1);
  currentPage = Math.min(Math.max(parseInt(page) || 1, 1), currentTotalPages);
}

function renderPagination() {
  if (!pagination) return;

  if (currentTotalPages <= 1) {
    pagination.style.display = "none";
    pagination.innerHTML = "";
    return;
  }

  pagination.style.display = "flex";
  pagination.innerHTML = "";

  const addButton = (label, targetPage, options = {}) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "jl-page-btn" + (options.active ? " jl-page-active" : "");
    btn.textContent = label;
    btn.disabled = !!options.disabled || targetPage === currentPage;
    if (!btn.disabled) {
      btn.addEventListener("click", () => fetchAndRender(targetPage));
    }
    pagination.appendChild(btn);
  };

  const addInfo = (text) => {
    const span = document.createElement("span");
    span.className = "jl-page-info";
    span.textContent = text;
    pagination.appendChild(span);
  };

  addButton("Prev", currentPage - 1, { disabled: currentPage <= 1 });

  const visibleWindow = 2;
  const startPage = Math.max(1, currentPage - visibleWindow);
  const endPage = Math.min(currentTotalPages, currentPage + visibleWindow);

  if (startPage > 1) {
    addButton("1", 1, { active: currentPage === 1 });
    if (startPage > 2) addInfo("...");
  }

  for (let page = startPage; page <= endPage; page++) {
    addButton(String(page), page, { active: page === currentPage });
  }

  if (endPage < currentTotalPages) {
    if (endPage < currentTotalPages - 1) addInfo("...");
    addButton(String(currentTotalPages), currentTotalPages, { active: currentPage === currentTotalPages });
  }

  addButton("Next", currentPage + 1, { disabled: currentPage >= currentTotalPages });
}

// ── Fetch filter options from backend ──
async function loadFilterOptions() {
  try {
    const baseUrl = await resolveServerUrl();
    const resp = await fetch(`${baseUrl}/api/jobs/filters`);
    if (!resp.ok) {
      console.error(`[Jobs] Filters API failed: ${resp.status} ${resp.statusText}`);
    }
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
async function waitForResumeHelpers() {
  for (let i = 0; i < 80; i++) {
    if (window.__getSavedResumes && window.__loadSavedResumePdf && window.__readPdfText) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Resume helpers not ready");
}

async function parsePdf(source) {
  await waitForResumeHelpers();
  const rawText = await window.__readPdfText(source, { includeLinks: true });
  return rawText.replace(/\s+/g, " ").trim();
}

function clearUploadState() {
  resumeUpload.value = "";
  if (uploadArea) uploadArea.style.display = "block";
  if (resumeLoaded) resumeLoaded.style.display = "none";
  if (resumeLoadedLabel) resumeLoadedLabel.textContent = "Resume stored";
  if (resumeLoadedMeta) resumeLoadedMeta.textContent = "";
}

function showUploadState(label) {
  if (uploadArea) uploadArea.style.display = "none";
  if (resumeLoaded) resumeLoaded.style.display = "block";
  if (resumeLoadedLabel) resumeLoadedLabel.textContent = "Resume stored";
  if (resumeLoadedMeta) resumeLoadedMeta.textContent = label;
  if (savedResumeSelect && savedResumeSelect.value) savedResumeSelect.value = "";
  if (savedResumeStatus) savedResumeStatus.textContent = "Pick a saved resume to use it instead of the uploaded file.";
  if (savedResumeHint) savedResumeHint.textContent = "Read-only selection. Nothing is written back to your Profile.";
  activeResumeSource = "upload";
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

async function useSavedResume(resumeId) {
  if (!resumeId) {
    resumeText = "";
    activeResumeSource = "";
    clearUploadState();
    savedResumeStatus.textContent = savedResumeHint.textContent || "Select a saved resume from your Profile.";
    localStorage.removeItem("jl_resumeText");
    return;
  }

  await waitForResumeHelpers();
  savedResumeStatus.textContent = "Loading saved resume...";
  const resumes = await window.__getSavedResumes();
  const selected = resumes.find((resume) => resume._id === resumeId);
  const blob = await window.__loadSavedResumePdf(resumeId);
  resumeText = await parsePdf(blob);
  localStorage.setItem("jl_resumeText", resumeText);
  clearUploadState();
  savedResumeSelect.value = resumeId;
  savedResumeStatus.textContent = `Using ${selected?.title || "the selected saved resume"}.`;
  savedResumeHint.textContent = "Read-only selection. Nothing is written back to your Profile.";
  activeResumeSource = "saved";
}

resumeUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    resumeText = await parsePdf(file);
    localStorage.setItem("jl_resumeText", resumeText);
    showUploadState(file.name);
  } catch (err) {
    alert("Error reading resume: " + err.message);
  }
});

changeResumeBtn.addEventListener("click", () => {
  clearUploadState();
  resumeUpload.click();
});

savedResumeSelect.addEventListener("change", async (e) => {
  try {
    await useSavedResume(e.target.value);
  } catch (err) {
    savedResumeStatus.textContent = "Could not load selected resume.";
    alert("Error loading saved resume: " + err.message);
  }
});

if (resumeText) {
  showUploadState(activeResumeSource === "session" ? "Loaded from session memory" : "Resume ready");
}

// ── Apply / Clear / Refresh / Fetch New ──
applyFiltersBtn.addEventListener("click", () => fetchAndRender(1));

clearFiltersBtn.addEventListener("click", () => {
  filterTitle.value = "";
  filterCountry.value = "";
  filterLocation.value = "";
  filterExperience.value = "";
  filterJobType.value = "";
  filterRemote.value = "";
  filterHoursOld.value = "";
  filterLimit.value = String(getMaxSelectableResultLimit());
  filterPlatforms.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = true));
  filterKeywords.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = false));
  fetchAndRender(1);
});

refreshBtn.addEventListener("click", () => {
  fetchAndRender(currentPage);
});

// DEMO: manually trigger a new job fetch from all platforms
fetchNewBtn.addEventListener("click", async () => {
  fetchNewBtn.disabled = true;
  fetchNewBtn.textContent = "Fetching...";
  sourceInfo.textContent = "Fetching jobs from all platforms... (check server console)";
  try {
    const baseUrl = await resolveServerUrl();
    await waitForAuth();
    const headers = await window.__getAuthHeaders();
    const resp = await fetch(`${baseUrl}/api/run-fetch`, {
      method: "POST",
      headers: headers.Authorization ? { ...headers } : {},
    });
    if (!resp.ok) {
      console.error(`[Jobs] Run-fetch API failed: ${resp.status} ${resp.statusText}`);
    }
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
async function fetchAndRender(page = currentPage) {
  loadingState.style.display = "block";
  emptyState.style.display = "none";
  jobGrid.innerHTML = "";
  sourceInfo.textContent = "";

  try {
    const baseUrl = await resolveServerUrl();
    const filters = getFilters();
    filters.page = page;
    console.log("[Jobs] Filters:", JSON.stringify(filters));

    const authHeaders = window.__getAuthHeaders ? await window.__getAuthHeaders() : {};
    const matchRes = await fetch(`${baseUrl}/api/match-jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ filters }),
    });
    if (!matchRes.ok) {
      console.error(`[Jobs] Match-jobs API failed: ${matchRes.status} ${matchRes.statusText}`);
    }
    const data = await matchRes.json();
    const jobs = data.jobs || [];
    setPaginationState(data.total || jobs.length, data.totalPages || 1, data.page || page);

    if (!jobs.length) {
      loadingState.style.display = "none";
      emptyState.style.display = "block";
      if ((data.total || 0) === 0) {
        emptyState.innerHTML = "<p>No jobs in database yet. Click <strong>Fetch New Jobs</strong> above to trigger a fresh scrape.</p>";
      } else {
        emptyState.innerHTML = "<p>No jobs match your filters. Try broader criteria.</p>";
      }
      renderPagination();
      return;
    }

    renderJobs(jobs);
  } catch (err) {
    console.error("Fetch error:", err);
    loadingState.style.display = "none";
    emptyState.style.display = "block";
    emptyState.innerHTML = "<p>Error loading jobs. Please try again.</p>";
    if (pagination) {
      pagination.style.display = "none";
      pagination.innerHTML = "";
    }
  }

  loadingState.style.display = "none";
}

// ── Render job cards ──
function renderJobs(jobs) {
  jobGrid.innerHTML = "";
  emptyState.style.display = "none";
  let countText = `${currentTotalJobs} job${currentTotalJobs !== 1 ? "s" : ""} found`;
  if (currentTotalPages > 1) {
    countText += ` • Page ${currentPage} of ${currentTotalPages}`;
  }
  jobCount.textContent = countText;

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

  renderPagination();
}

function escHtml(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function waitForAuth() {
  for (let i = 0; i < 80; i++) {
    if (window.__getAuthHeaders) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Auth not ready");
}

async function isAdminUser() {
  try {
    const baseUrl = await resolveServerUrl();
    await waitForAuth();
    const headers = await window.__getAuthHeaders();
    if (!headers.Authorization) return false;
    const resp = await fetch(`${baseUrl}/api/profile`, { headers });
    if (!resp.ok) {
      console.error(`[Jobs] Profile API failed: ${resp.status} ${resp.statusText}`);
    }
    const data = await resp.json();
    return data.success && data.profile?.role === "admin";
  } catch {
    return false;
  }
}

// ── Wait for shared shell (loaded as deferred module) ──
async function waitForShell() {
  for (let i = 0; i < 100; i++) {
    if (typeof window.__getAuthHeaders === "function") return;
    await new Promise(r => setTimeout(r, 100));
  }
  console.warn("[Jobs] Shell helpers not available after 10s");
}

// ── Init: always fetch fresh from backend ──
(async function init() {
  await waitForShell();
  await resolveServerUrl();
  await loadFilterOptions();
  await refreshPlanResultLimit();
  await fetchAndRender(1);
  const admin = await isAdminUser();
  if (!admin) {
    fetchNewBtn.style.display = "none";
  }
})();

(async function initSavedResumePicker() {
  try {
    await loadSavedResumes();
    if (resumeText) {
      if (resumeLoadedLabel) resumeLoadedLabel.textContent = activeResumeSource === "session" ? "Resume stored" : "Resume stored";
      if (resumeLoadedMeta) resumeLoadedMeta.textContent = activeResumeSource === "session" ? "Loaded from session memory" : (resumeLoadedMeta.textContent || "");
      if (savedResumeStatus) savedResumeStatus.textContent = activeResumeSource === "saved" ? savedResumeStatus.textContent : (savedResumeStatus.textContent || "Pick one of your saved resumes.");
    }
  } catch (err) {
    if (savedResumeStatus) savedResumeStatus.textContent = "Unable to load saved resumes.";
    if (savedResumeHint) savedResumeHint.textContent = err.message;
  }
})();
