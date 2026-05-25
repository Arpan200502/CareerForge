import * as pdfjsLib from "./libs/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./libs/pdf.worker.mjs";

var jobdesc = document.getElementById("jobd");
var jobttl = document.getElementById("jobttl");
var pdf = document.getElementById("pdf");
var btn = document.getElementById("tlr");

let loaderTimer = null;
let lastResumeText = "";
let lastJobTitle = "";
let lastJobDesc = "";
let lastPdfData = null;
let lastTailoredText = "";

function escHtml(s) {
  if (!s) return "";
  var d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function lineDiff(original, tailored) {
  var oLines = (original || "").split("\n");
  var tLines = (tailored || "").split("\n");
  var html = "";
  var oIdx = 0, tIdx = 0;
  while (oIdx < oLines.length || tIdx < tLines.length) {
    var oLine = oLines[oIdx] || "";
    var tLine = tLines[tIdx] || "";
    if (oLine === tLine) {
      html += '<div style="color:#94a3b8;padding:2px 16px;white-space:pre-wrap;word-break:break-word;">' + escHtml(oLine) + "</div>";
      oIdx++; tIdx++;
    } else {
      var found = false;
      for (var look = 1; look <= 3; look++) {
        if (oIdx + look < oLines.length && oLines[oIdx + look] === tLine) {
          for (var k = 0; k < look; k++) {
            html += '<div style="color:#ef4444;background:rgba(239,68,68,0.08);padding:2px 16px;border-left:2px solid #ef4444;white-space:pre-wrap;word-break:break-word;">-' + escHtml(oLines[oIdx + k]) + "</div>";
          }
          html += '<div style="color:#94a3b8;padding:2px 16px;white-space:pre-wrap;word-break:break-word;">' + escHtml(tLine) + "</div>";
          oIdx += look + 1; tIdx++;
          found = true; break;
        }
        if (tIdx + look < tLines.length && tLines[tIdx + look] === oLine) {
          for (var k2 = 0; k2 < look; k2++) {
            html += '<div style="color:#34d399;background:rgba(52,211,153,0.08);padding:2px 16px;border-left:2px solid #34d399;white-space:pre-wrap;word-break:break-word;">+' + escHtml(tLines[tIdx + k2]) + "</div>";
          }
          html += '<div style="color:#94a3b8;padding:2px 16px;white-space:pre-wrap;word-break:break-word;">' + escHtml(oLine) + "</div>";
          oIdx++; tIdx += look + 1;
          found = true; break;
        }
      }
      if (!found) {
        html += '<div style="color:#ef4444;background:rgba(239,68,68,0.08);padding:2px 16px;border-left:2px solid #ef4444;white-space:pre-wrap;word-break:break-word;">-' + escHtml(oLine) + "</div>";
        html += '<div style="color:#34d399;background:rgba(52,211,153,0.08);padding:2px 16px;border-left:2px solid #34d399;white-space:pre-wrap;word-break:break-word;">+' + escHtml(tLine) + "</div>";
        oIdx++; tIdx++;
      }
    }
  }
  return html;
}

function stopLoaderCycle() {
  clearTimeout(loaderTimer);
  document
    .querySelectorAll(".status-steps li")
    .forEach((li) => li.classList.remove("is-visible"));
}
function startLoaderCycle(onDone) {
  const steps = document.querySelectorAll(".status-steps li");
  let index = 0;

  steps.forEach((li) => li.classList.remove("is-visible"));

  function next() {
    if (index >= steps.length) {
      onDone(); // 🔥 loader fully finished
      return;
    }

    steps[index].classList.add("is-visible");

    setTimeout(() => {
      steps[index].classList.remove("is-visible");
      index++;
      next();
    }, 900);
  }

  next();
}

btn.onclick = async function () {
  var file = pdf.files[0];
  if (!file) {
    alert("please upload a file");
    return;
  } else {
    document.querySelector(".aipnl").style.display = "block";

    startLoaderCycle(() => {
      document.querySelector(".aipnl").style.display = "none";

      // 🔥 NOW start FileReader + API
      var reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async function () {
        var pdfdata = reader.result;
        const loadingtask = pdfjsLib.getDocument(pdfdata);

        const pdf = await loadingtask.promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);

          const textcontent = await page.getTextContent();
          const extractedtxt = textcontent.items

            .map((item) => item.str)
            .join(" ");

          fullText = fullText + extractedtxt + "\n";

          const annots = await page.getAnnotations();
          const urls = annots.filter(a => a.subtype === "Link").map(a => a.url || a.action?.url).filter(Boolean);
          if (urls.length) fullText += "Links: " + urls.join(", ") + "\n";
        }
        let cleanText = fullText
          .replace(/\s+/g, " ")
          .trim()
          .replace(/[•●▪■]/g, "")
          .replace(
            /(EXPERIENCE|SKILLS|EDUCATION|PROJECTS|SUMMARY)/gi,
            "\n$1\n",
          );

        lastResumeText = cleanText;
        lastJobTitle = jobttl.value;
        lastJobDesc = jobdesc.value;

        const jobprompt = `
                                        You are "ResumeTailor_Architect_v4_Industrial", a specialized, ruthless, logic-driven ATS (Applicant Tracking System) Engine.

                    YOUR ROLE:
                    You are NOT a career coach. You are NOT a resume writer. You are a precision-focused Hiring Algorithm.
                    Your job is to disqualify unqualified candidates and identify genuine gaps.
                    You do NOT give the benefit of the doubt. You rely ONLY on explicit text evidence.

                    ================================================================================
                    SECTION 1: THE "MUTUALLY EXCLUSIVE" (OR) LOGIC PROTOCOL
                    ================================================================================

                    Job Descriptions (JDs) often list alternatives. You must identify them immediately to avoid "False Positives" in the missing list.

                    PROTOCOL:
                    1. Scan the JD for "OR" separators (e.g., "Java, Python, OR C++", "AWS, Azure, or GCP").
                    2. Check the Resume for ANY ONE of these options.

                    SCENARIO A: Candidate has ONE of them.
                    - RESULT: The requirement is MET.
                    - ACTION: Mark that skill as PRESENT.
                    - CRITICAL: Do NOT list the other unused options as "Missing". They are irrelevant.

                    SCENARIO B: Candidate has NONE of them.
                    - RESULT: The requirement is MISSING.
                    - ACTION: Create ONE single missing entry named after the group.
                    - Example Name: "Cloud Provider (AWS/Azure/GCP)" or "Backend Language (Java/Python)".
                    - CRITICAL: Do NOT list "AWS", "Azure", and "GCP" as 3 separate missing skills. This inflates the error count falsely.

                    ================================================================================
                    SECTION 2: FOUNDATIONAL OPERATING RULES
                    ================================================================================

                    1. SINGLE SOURCE OF TRUTH:
                    - The Resume Text provided is the ONLY representation of the candidate.
                    - If a skill is not written, it does not exist (unless strictly implied by a composite stack).

                    2. STRICT INTERPRETATION OF JD:
                    - "Required", "Must have", "Proficiency in" = HARD REQUIREMENT (High/Medium Priority).
                    - "Preferred", "Bonus", "Plus", "Good to have" = PREFERRED (Low Priority).
                    - Preferred skills MUST NEVER appear in the "missing" list. They go to "preferredExposureGaps".

                    3. COMPOSITE STACK LOGIC:
                    - MERN = Mongo + Express + React + Node.
                    - LAMP = Linux + Apache + MySQL + PHP.
                    - RULE: If a candidate lists the *Components*, they have the *Stack*.
                    - ACTION: Do not mark "MERN Stack" as missing if components are present. Move to "keywordOptimization".

                    ================================================================================
                    SECTION 3: STEP-BY-STEP EXECUTION PIPELINE
                    ================================================================================

                    You must process the input in this exact order.

                    ### PHASE 1: EDUCATION & ELIGIBILITY (THE GATEKEEPER)
                    1. Extract JD Degree Requirements (BS, MS, PhD) and Field (CS, EE, etc.).
                    2. Extract Resume Degree and Major.
                    3. Compare:
                    - MATCH: Resume Degree >= JD Degree AND Field matches.
                    - PARTIAL: Resume Degree == JD Degree but Field differs.
                    - MISMATCH: Resume Degree < JD Degree OR Resume has NO degree.
                    4. "Equivalent Experience" Clause:
                    - Only downgrade "Mismatch" to "Partial" if the JD EXPLICITLY says "or equivalent experience".

                    ### PHASE 2: HARD SKILLS EXTRACTION
                    1. Extract keywords.
                    2. Filter out "Preferred" skills (send to Phase 4).
                    3. Check Resume for Exact or Implied matches.
                    4. Apply "OR" Logic (Section 1).
                    5. Generate "Missing" list.

                    ### PHASE 3: ATS KEYWORD OPTIMIZATION
                    1. Detect skills that are PRESENT/IMPLIED but use different wording.
                    - Example: JD wants "CI/CD", Resume has "Jenkins".
                    - Example: JD wants "TDD", Resume has "Unit Testing with Jest".
                    2. These are NOT missing skills. Report in keywordOptimization.

                    ### PHASE 4: PREFERRED SKILLS ANALYSIS
                    1. Check skills listed as "Bonus/Preferred" in JD.
                    2. If absent, add to preferredExposureGaps.
                    3. These do NOT affect the score negatively.

                    ================================================================================
                    SECTION 4: THE SUBTRACTIVE SCORING ALGORITHM (STABILITY ENGINE)
                    ================================================================================

                    You must calculate the overallScore using this exact mathematical formula.
                    START WITH: 100 POINTS.

                    APPLY DEDUCTIONS:

                    1. **Hard Skills Gaps (The Heavy Hitters):**
                    - For every MISSING "High Priority" skill/group: **SUBTRACT 12 POINTS**.
                    - For every MISSING "Medium Priority" skill/group: **SUBTRACT 6 POINTS**.
                    - For every MISSING "Low Priority" skill/group: **SUBTRACT 3 POINTS**.

                    2. **Education Gaps:**
                    - If status is "Mismatch": **SUBTRACT 20 POINTS**.
                    - If status is "Partial": **SUBTRACT 5 POINTS**.

                    3. **Experience Gaps:**
                    - If Years of Experience < 50% of required: **SUBTRACT 15 POINTS**.
                    - If Domain is irrelevant (e.g. Sales resume for Coding job): **SUBTRACT 10 POINTS**.

                    4. **Formatting/Keyword Gaps:**
                    - For every "Keyword Optimization Opportunity": **SUBTRACT 1 POINT**.

                    APPLY MANDATORY "KILL SWITCH" CAPS (OVERRIDES):
                    After calculation, check these conditions. If met, FORCE the score down.

                    1. **THE "CORE TECH" CAP:**
                    - If the JD requires a Core Language/Framework (e.g., Java, React) and it is MISSING:
                    - **MAX SCORE ALLOWED: 55**. (Even if everything else is perfect).

                    2. **THE "MULTIPLE GAPS" CAP:**
                    - If > 2 High Priority Skills are MISSING:
                    - **MAX SCORE ALLOWED: 60**.

                    3. **THE "EDUCATION" CAP:**
                    - If Education is "Mismatch" (and no experience clause):
                    - **MAX SCORE ALLOWED: 70**.

                    *Example Calculation:*
                    Start 100.
                    Missing "Java" (High, Core) -> -12.
                    Missing "Spring" (High) -> -12.
                    Missing "Microservices" (Medium) -> -6.
                    Calculated Score: 70.
                    "Core Tech Cap" triggered (Missing Java): Force Score -> 55.
                    Final Score: 55.

                    ================================================================================
                    SECTION 5: OUTPUT JSON ARCHITECTURE (STRICT)
                    ================================================================================

                    You must output PURE JSON. No markdown fencing.
                    The JSON keys must match the following schema EXACTLY.

                    {
                    "overallScore": integer (Calculated via Subtractive Model),
                    "verdict": string ("Perfect Match" | "Strong Candidate" | "Good Potential" | "Needs Work" | "Not a Fit"),
                    "categoryScores": {
                        "hardSkills": integer (0-100),
                        "experience": integer (0-100),
                        "softSkills": integer (0-100),
                        "atsAlignment": integer (0-100)
                    },
                    "hardSkillsAnalysis": {
                        "present": [ "Array of strings: Skills found exactly" ],
                        "implied": [ "Array of strings: Skills inferred (e.g. Git implied by GitHub)" ],
                        "missing": [
                        {
                            "skill": "Name of missing skill (or Group Name if 'OR' logic)",
                            "importance": "High" | "Medium" | "Low",
                            "estimatedLearningTime": "e.g. 2-3 weeks",
                            "reason": "Why is this required?"
                        }
                        ],
                        "preferredExposureGaps": [
                        {
                            "skill": "Name of preferred skill",
                            "estimatedLearningTime": "e.g. 1 week",
                            "reason": "Listed as 'Nice to have' in JD"
                        }
                        ],
                        "keywordOptimization": [
                        {
                            "keyword": "Exact keyword from JD",
                            "reason": "Resume has the skill but uses different wording",
                            "whereToAdd": "e.g. 'Skills Section' or 'Summary'"
                        }
                        ]
                    },
                    "keywordOptimizationOpportunities": [ "Array of summary strings for keyword fixes" ],
                    "softSkillGaps": [ "Array of strings: Soft skills required by JD but not signaled" ],
                    "educationFit": {
                        "status": "Match" | "Partial" | "Mismatch",
                        "details": "Specific explanation of degree/major comparison"
                    },
                    "experienceFitSummary": "2-3 sentences analyzing seniority and relevance",
                    "recommendations": [
                        "Array of strings: Concrete, actionable advice.",
                        "MUST link directly to a missing skill or keyword.",
                        "Do not give generic advice."
                    ]
                    }

                    ================================================================================
                    SECTION 6: FINAL SANITY CHECK
                    ================================================================================

                    Before printing JSON:
                    1. Did you list "AWS", "Azure", and "GCP" as 3 separate missing items? If yes, CONSOLIDATE them into one.
                    2. Is the score > 80 but "Core Tech" is missing? If yes, LOWER the score to 55.
                    3. Are preferred skills in the "missing" list? If yes, MOVE them to "preferredExposureGaps".

                    ================================================================================
                    INPUT DATA
                    ================================================================================

                    RESUME TEXT:
                    [RESUME TEXT]

                    JOB DESCRIPTION:
                    [JOB DESCRIPTION]

                    JOB TITLE:
                    [JOB TITLE]

                    PERFORM ANALYSIS. GENERATE ONLY JSON.





                                    `;

        let prompt = jobprompt
          .replace("[RESUME TEXT]", cleanText)
          .replace("[JOB DESCRIPTION]", jobdesc.value)
          .replace("[JOB TITLE]", jobttl.value);

        try {
          const response = await fetch(
            "http://localhost:5000/analyze-resume",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prompt: prompt,
              }),
            },
          );

          const data = await response.json();
          const analysis = data.analysis;
          console.log("PARSED ANALYSIS:", analysis);

          /* ===============================
                    1. OPEN OVERLAY
                    ================================ */
          const overlay = document.querySelector(".ai-review-overlay");
          overlay.classList.add("active");

          /* ===============================
                    2. SCORE RING + VERDICT
                    ================================ */
          const scoreNumber = document.querySelector(
            ".score-ring-value .number",
          );
          const scoreVerdict = document.querySelector(".score-verdict");
          const scoreCircle = document.querySelector(".score-ring-progress");

          scoreNumber.textContent = analysis.overallScore;
          scoreVerdict.textContent = analysis.verdict;

          // SVG progress ring
          const radius = 60;
          const circumference = 2 * Math.PI * radius;
          const offset =
            circumference - (analysis.overallScore / 100) * circumference;

          scoreCircle.style.strokeDasharray = `${circumference}`;
          scoreCircle.style.strokeDashoffset = offset;

          /* ===============================
                    3. CATEGORY BREAKDOWN
                    ================================ */
          const categoryMap = {
            ats: analysis.categoryScores.atsAlignment,
            "hard-skills": analysis.categoryScores.hardSkills,
            "soft-skills": analysis.categoryScores.softSkills,
            experience: analysis.categoryScores.experience,
          };

          Object.entries(categoryMap).forEach(([cls, value]) => {
            const bar = document.querySelector(`.category-bar-fill.${cls}`);
            const label = bar
              .closest(".category-item")
              .querySelector(".category-score");

            bar.style.width = `${value}%`;
            label.textContent = `${value} / 100`;
          });
          // ==============================
          // Preferred Skills (Optional) - MATCHING CSS STYLE
          // ==============================

          const preferredSection = document.getElementById(
            "preferred-skills-section",
          );
          const preferredContainer = document.getElementById(
            "preferred-skills-container",
          );

          // Clear previous results
          preferredContainer.innerHTML = "";

          // 1. Get the data
          const preferredGaps =
            analysis.hardSkillsAnalysis?.preferredExposureGaps;

          // 2. Check if data exists
          if (
            preferredGaps &&
            Array.isArray(preferredGaps) &&
            preferredGaps.length > 0
          ) {
            // Show the section
            preferredSection.style.display = "block";

            // Create cards
            preferredGaps.forEach((item) => {
              const card = document.createElement("div");

              // CHANGE 1: Use 'skill-card' to match Missing Skills styling exactly
              card.className = "skill-card";

              // CHANGE 2: Use the same internal structure (skill-meta, skill-importance)
              card.innerHTML = `
                                <h5>${item.skill}</h5>
                                <div class="skill-meta">
                                    <span class="skill-importance medium">
                                        ● Preferred
                                    </span>
                                    <span class="skill-time">
                                        ⏱ ${item.estimatedLearningTime}
                                    </span>
                                    <span class="skill-time" style="opacity: 0.7;">
                                        ℹ️ ${item.reason}
                                    </span>
                                </div>
                            `;

              preferredContainer.appendChild(card);
            });
          } else {
            // Hide section if no data found
            preferredSection.style.display = "none";
          }
          /* ===============================
                    4. FILTER IMPLIED SKILLS (CRITICAL FIX)
                    ================================ */
          const impliedSkills = new Set(
            (analysis.hardSkillsAnalysis.implied || []).map((s) =>
              s.toLowerCase(),
            ),
          );

          const keywordSkills = new Set(
            (analysis.hardSkillsAnalysis.keywordOptimization || []).map((k) =>
              k.keyword.toLowerCase(),
            ),
          );

          const realMissingSkills = (
            analysis.hardSkillsAnalysis.missing || []
          ).filter(
            (m) =>
              !impliedSkills.has(m.skill.toLowerCase()) &&
              !keywordSkills.has(m.skill.toLowerCase()),
          );

          /* ===============================
                    5. RENDER MISSING SKILLS & TOOLS
                    ================================ */
          const skillsGrid = document.querySelector(".skills-grid");
          skillsGrid.innerHTML = "";

          realMissingSkills.forEach((skill) => {
            const card = document.createElement("div");
            card.className = "skill-card";

            card.innerHTML = `
                        <h5>${skill.skill}</h5>
                        <div class="skill-meta">
                        <span class="skill-importance ${skill.importance.toLowerCase()}">
                            ● ${skill.importance} Priority
                        </span>
                        <span class="skill-time">
                            ⏱ ${skill.estimatedLearningTime}
                        </span>
                        </div>
                    `;

            skillsGrid.appendChild(card);
          });

          /* ===============================
                    6. SOFT SKILL GAPS
                    ================================ */
          const softSkillsList = document.querySelector(".soft-skills-list");
          softSkillsList.innerHTML = "";

          analysis.softSkillGaps.forEach((skill) => {
            const item = document.createElement("div");
            item.className = "soft-skill-item";

            item.innerHTML = `
                        <div class="soft-skill-icon">💡</div>
                        <span>${skill}</span>
                    `;

            softSkillsList.appendChild(item);
          });

          /* ===============================
                    7. ACTIONABLE SUGGESTIONS
                    (KEYWORD OPTIMIZATION FIRST)
                    ================================ */
          const suggestionsList = document.querySelector(".suggestions-list");
          suggestionsList.innerHTML = "";

          // ATS keyword wording fixes (NOT learning gaps)
          (analysis.hardSkillsAnalysis.keywordOptimization || []).forEach(
            (k) => {
              const item = document.createElement("div");
              item.className = "suggestion-item";

              item.innerHTML = `
                        <div class="suggestion-checkbox"></div>
                        <span>
                        ATS wording fix: add "<strong>${k.keyword}</strong>" in 
                        <em>${k.whereToAdd}</em> — ${k.reason}
                        </span>
                    `;

              suggestionsList.appendChild(item);
            },
          );

          // General recommendations
          analysis.recommendations.forEach((text) => {
            const item = document.createElement("div");
            item.className = "suggestion-item";

            item.innerHTML = `
                        <div class="suggestion-checkbox"></div>
                        <span>${typeof text === "string" ? text : text.text}</span>
                    `;

            suggestionsList.appendChild(item);
          });

          /* ===============================
                    8. LOAD PDF INTO OVERLAY IFRAME
                    ================================ */
          const pdfIframe = document.querySelector(
            ".overlay-resume-preview iframe",
          );
          const pdfURL = URL.createObjectURL(file);
          pdfIframe.src = pdfURL;
          /* ===============================
                    CLOSE BUTTON
                    ================================ */
          document.querySelector(".overlay-close").onclick = () => {
            overlay.classList.remove("active");
            URL.revokeObjectURL(pdfURL);
          };

          document.getElementById("generateJobResumeBtn").onclick = async () => {
            const genBtn = document.getElementById("generateJobResumeBtn");
            genBtn.disabled = true;
            genBtn.textContent = "Generating...";

            const trResult = document.getElementById("trResult");
            trResult.style.display = "none";

            try {
              const resp = await fetch("http://localhost:5000/generate-job-specific-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resumeText: lastResumeText,
                  jobDescription: lastJobDesc,
                  jobTitle: lastJobTitle,
                }),
              });
              const data = await resp.json();
              if (!data.success) throw new Error(data.error);

              lastPdfData = data.pdf;
              lastTailoredText = data.tailoredText || "";

              var changesHtml = "";
              if (data.changes && data.changes.length) {
                var items = data.changes.map(function(c) {
                  return '<div style="display:flex;gap:10px;padding:8px 12px;border-radius:8px;background:rgba(148,163,184,0.04);border:1px solid rgba(148,163,184,0.06);margin-bottom:6px;font-size:13px;line-height:1.5;color:#c9d8f0;">' +
                    '<span style="color:#7c3aed;font-weight:700;flex-shrink:0;">~</span>' +
                    '<span>' + escHtml(c) + '</span>' +
                  '</div>';
                });
                document.getElementById("trChangesHeader").textContent = "Changes Made (" + data.changes.length + ")";
                document.getElementById("trDiffContent").innerHTML = items.join("");
              } else {
                document.getElementById("trChangesHeader").textContent = "Changes Made";
                document.getElementById("trDiffContent").innerHTML = '<p style="color:#505d78;font-size:13px;">No changes detected.</p>';
              }
              trResult.style.display = "block";

              // scroll to result
              trResult.scrollIntoView({ behavior: "smooth", block: "start" });
            } catch (err) {
              alert("Error generating resume: " + err.message);
            }

            genBtn.disabled = false;
            genBtn.textContent = "Generate Job Specific Resume";
          };

          document.getElementById("trOpenPdfBtn").onclick = () => {
            if (!lastPdfData) return;
            var win = window.open();
            if (win) {
              win.document.write('<html><body style="margin:0"><embed src="data:application/pdf;base64,' + lastPdfData + '" width="100%" height="100%" type="application/pdf"></body></html>');
              win.focus();
            } else {
              alert("Allow popups to open the PDF.");
            }
          };

          document.getElementById("trPrintBtn").onclick = () => {
            if (!lastTailoredText) return;
            var win = window.open();
            if (win) {
              win.document.write('<html><head><style>body{font-family:Georgia,serif;padding:40px;line-height:1.8;font-size:12pt;color:#000;white-space:pre-wrap;}</style></head><body>' + escHtml(lastTailoredText).replace(/\n/g, "<br>") + '</body></html>');
              win.document.close();
              win.focus();
              win.print();
            } else {
              alert("Allow popups to print.");
            }
          };
        } catch (err) {
          console.error(err);
        }

        stopLoaderCycle();
        document.querySelector(".aipnl").style.display = "none";

        btn.style.display = "block";
        btn.disabled = false;
      };
    });
  }
};
// ---------- DEMO JOB DATA ----------
const jobDemoData = {
  1: {
    title: " Mern Stack Developer",
    description: `about the job
Job Post :- Mern Stack Developer
Experience :- 3+ years
Location - Ahmedabad (WFO)


Responsibilities:


Application Development: Develop and maintain web applications using the MERN stack (MongoDB, Express.js, React.js, Node.js).
Front-End & Back-End Integration: Collaborate with front-end and back-end developers to create a seamless and efficient full-stack application.
API Design and Integration: Build and integrate RESTful APIs and third-party services to enhance functionality.
Database Management: Optimize MongoDB databases, handle data storage, schema design, and database queries.
Bug Fixes and Maintenance: Troubleshoot, debug, and fix issues that arise during development and production phases.
User Interface Implementation: Work closely with UI/UX designers to implement responsive and user-friendly interfaces using React.js.
Code Optimization: Ensure that the code is optimized for performance, scalability, and security.
Collaboration: Collaborate with product managers and designers to understand user requirements and deliver the best user experience.
Version Control: Use Git and GitHub for version control, ensuring proper codebase management.
Documentation: Maintain clear and concise documentation for code, APIs, and application workflows.


Technical Skills :


Strong knowledge of JavaScript and modern frameworks (React.js).
Understanding of asynchronous programming, promises, a sync/await.
Experience with unit testing frameworks like Jest or Mocha is a plus.
Good understanding of security practices and application optimization techniques.


Soft Skills:


Strong problem-solving and analytical skills.
Excellent communication skills and the ability to collaborate within a team.
Self-motivated with a passion for learning and staying up to date with new technologies.

`,
  },

  2: {
    title: "java Full Stack Developer",
    description: `Strong proficiency in Java (8 or above) with hands-on experience in building scalable backend applications using Spring Boot, Spring MVC, and RESTful APIs. Solid understanding of React.js and modern JavaScript (ES6+), including Redux, Hooks, and component-based architecture. Experience with HTML5, CSS3, SASS/LESS, and responsive design principles. Familiarity with Node.js and NPM/Yarn for frontend build and dependency management. Proficient in working with Relational Databases (e.g., MySQL, PostgreSQL) and NoSQL Databases (e.g., MongoDB). Experience with JPA/Hibernate for ORM and data persistence.

Roles & Responsibilities Design and develop scalable and secure backend services using Java, Spring Boot, and RESTful APIs. Build responsive and dynamic user interfaces using React.js, JavaScript, HTML, and CSS. Collaborate with UI/UX designers, product managers, and other developers to deliver high-quality features. Integrate frontend and backend components to create seamless full-stack solutions. Write clean, maintainable, and well-documented code following best practices and coding standards. Optimize application performance and troubleshoot issues across the stack. Participate in code reviews, sprint planning, and other Agile ceremonies. Implement unit and integration tests to ensure software reliability and maintainability. Work with DevOps teams to manage CI/CD pipelines, containerization, and cloud deployments. Stay updated with emerging technologies and contribute to continuous improvement initiatives.

Core Skills: Strong proficiency in Java (8 or above) with hands-on experience in building scalable backend applications using Spring Boot, Spring MVC, and RESTful APIs. Solid understanding of React.js and modern JavaScript (ES6+), including Redux, Hooks, and component-based architecture. Experience with HTML5, CSS3, SASS/LESS, and responsive design principles. Familiarity with Node.js and NPM/Yarn for frontend build and dependency management. Database & Persistence: Proficient in working with Relational Databases (e.g., MySQL, PostgreSQL) and NoSQL Databases (e.g., MongoDB). Experience with JPA/Hibernate for ORM and data persistence. DevOps & Tools: Hands-on experience with Git, Maven/Gradle, and CI/CD pipelines (e.g., Jenkins, GitLab CI). Familiarity with Docker and containerized application deployment. Exposure to cloud platforms like AWS, Azure, or GCP is a plus. Testing & Quality: Experience with unit testing frameworks (e.g., JUnit, Mockito) and frontend testing tools (e.g., Jest, React Testing Library). Understanding of code quality, linting, and static code analysis tools. Soft Skills & Collaboration: Ability to work in Agile/Scrum environments with cross-functional teams. Strong problem-solving skills and attention to detail. Excellent communication and documentation abilities.`,
  },
};

// ---------- WAIT FOR DOM ----------
document.addEventListener("DOMContentLoaded", () => {
  const btn1 = document.getElementById("demoBtn1");
  const btn2 = document.getElementById("demoBtn2");

  btn1.addEventListener("click", () => injectDemoData(1));
  btn2.addEventListener("click", () => injectDemoData(2));
});

// ---------- INJECT FUNCTION ----------
function injectDemoData(option) {
  const jobTitleInput = document.getElementById("jobttl");
  const jobDescInput = document.getElementById("jobd");

  jobTitleInput.value = jobDemoData[option].title;
  jobDescInput.value = jobDemoData[option].description;

  // Optional UX polish
  jobTitleInput.focus();
}
