# 🚀 CareerForge – AI Powered Career Development Ecosystem

## 📌 Introduction

CareerForge is a production-level AI-powered career development platform developed to assist users throughout their entire placement and job preparation journey. Unlike conventional platforms that focus on only one area such as resume building or job searching, CareerForge combines multiple career-oriented tools into one integrated ecosystem. The platform aims to eliminate repetitive workflows, reduce friction during the job application process, and provide intelligent AI-powered guidance at every stage of career preparation.

The project evolved from an earlier AI Resume Builder concept into a complete SaaS-based Career Platform capable of handling resume generation, ATS optimization, interview preparation, cover letter generation, intelligent job discovery, leaderboard gamification, subscription plans, and payment systems.

The platform has been designed with a modern SaaS-inspired user experience and focuses heavily on automation, personalization, scalability, and real-world usability.

CareerForge has been built using the MERN Stack architecture along with several external APIs and cloud services such as Clerk Authentication, Cloudinary, Razorpay, Sarvam AI, and Job Aggregation APIs.

The main objective behind the project is to transform a college-level academic project into a fully functional industry-grade product that solves real-world problems faced by students, freshers, and professionals during job preparation.

---
## 🧭 Getting Started — Clone and Run Locally

Follow these steps to clone the repository, install dependencies and run the backend and frontend locally.

1. Clone the repo:

```powershell
git clone https://github.com/Arpan200502/CareerForge.git
cd "CareerForge/carrier platform"
```

2. Backend (API + payments)

```powershell
cd backend
npm install
# create a .env file with your secrets or export env vars:
# RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, CLERK_SECRET_KEY, MONGODB_URI
node server.js
# or if package.json defines a start script:
# npm start
```

3. Frontend (static pages + Clerk integration)

```powershell
cd ../frontend
npm install
# serve the static frontend (project uses `serve` in start script):
npm start
# or run directly:
# npx serve . --listen 3000
```

4. Ports and access

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

Open the frontend URL in your browser, sign in, and use the app. The frontend talks to the backend at `http://localhost:5000` by default (see `frontend/shared-shell.js`).

## 🗂️ Project File System (top-level overview)

- carrier platform/
  - backend/  — Express API, Mongoose models, payment routes, `server.js` (run backend here)
  - frontend/ — Static frontend pages, `shared-shell.js` for shared UI and plan modal, and feature folders:
    - resume-analyzer/
    - resume-builder/
    - cover-letter/
    - interviewer/
    - job-listings/
    - profile/

Files of interest:
- `backend/config/paymentPlans.js` — plan metadata and prices
- `backend/config/planLimits.js` — usage limits per plan
- `backend/routes/payment.js` — Razorpay order + verification endpoints
- `frontend/shared-shell.js` — navbar, plan modal, payment client wiring
- `frontend/shared-shell.css` — modal and plan styles


## 🛠️ Technology Stack

### Frontend Technologies
* **Framework:** React.js
* **Styling:** Tailwind CSS
* Modern SaaS UI/UX Design Principles
* Responsive Design Architecture

### Backend Technologies
* **Runtime:** Node.js
* **Framework:** Express.js

### Database
* MongoDB

### Authentication & Authorization
* Clerk Authentication
* Google One-Click Sign-In
* Session-Based Token Management

### Cloud & Storage Services
* Cloudinary for Resume PDF Storage
* MongoDB Cloud Database

### AI & External Integrations
* Sarvam AI (Speech-to-Text and Text-to-Speech)
* AI Resume Analysis Engine
* AI Resume Generation Engine
* AI Cover Letter Generation System
* AI Mock Interview Engine

### Job Aggregation APIs
* Arjuna API
* JobSite API

### Payment Integration
* Razorpay Payment Gateway

---

## 🔐 User Authentication and Onboarding System

When users visit CareerForge, they are first required to either log in or create an account before accessing any feature of the platform.

Authentication is handled using Clerk Authentication, providing a secure and scalable authentication infrastructure.

Users can register using:
* Email and Password
* Google One-Click Sign-In

If users choose Google Authentication, they are automatically authenticated and then prompted to create a unique username for platform identification.

Once registration is completed:
* User data is stored in MongoDB
* Authentication tokens are managed securely through session storage
* Users are automatically assigned to the Free Subscription Tier

This onboarding process creates a smooth and frictionless user experience while ensuring secure access control across the platform.

---

## 📄 Resume Builder System

The Resume Builder is one of the core foundational modules of CareerForge.

### Previous Implementation
Initially, the platform contained a simple AI-assisted resume generator where users could enter unstructured raw text describing:
* skills
* projects
* education
* achievements
* internships
* experiences

The AI engine automatically transformed the raw textual information into a professionally structured ATS-friendly resume.

Unlike traditional resume builders that require users to manually fill long forms field by field, this system simplified the process significantly by allowing conversational-style input.

### Enhanced Resume Builder Features

#### 🎙️ Voice-Based Resume Creation
One of the major improvements introduced in CareerForge is the addition of voice-based resume generation.

Users can now:
* Speak naturally about their experiences
* Record project explanations verbally
* Describe achievements through voice input
* Use the platform similarly to conversational AI systems

The speech is automatically converted into structured resume data using AI processing systems.

This feature:
* Improves accessibility
* Reduces manual typing effort
* Makes resume creation significantly faster
* Creates a more natural user interaction experience

#### 🖨️ LaTeX-Based ATS Resume Templates
The older HTML/CSS templates were upgraded to LaTeX-generated templates.

This change greatly improved:
* ATS readability
* Professional formatting consistency
* Resume parsing accuracy
* Typography quality
* Global compatibility

LaTeX resumes provide a much more professional structure and are highly preferred for technical and corporate job applications.

Every resume generated by CareerForge is optimized for Applicant Tracking Systems used by recruiters worldwide.

---

## 🔍 Resume Analyzer System

The Resume Analyzer was one of the original features from the earlier version of the project and has now been significantly upgraded.

### Working Process
Users provide:
1. A Resume
2. Job Description
3. Job Title

The AI engine then analyzes:
* Skill alignment
* ATS optimization
* Missing technologies
* Experience relevance
* Keyword matching
* Resume strength

The system generates:
* A score out of 100
* Detailed analytics
* Missing skill recommendations
* Improvement suggestions
* Actionable feedback

This helps users understand how suitable their resume is for a specific job role.

### ⚡ One-Click Job Fit Resume Generation
A major enhancement added to the Resume Analyzer is the “Get Job Ready Resume” feature.

After the AI finishes analyzing the resume and displays feedback, users can simply click a button labeled: **“Generate Job Fit Resume”**

The platform then automatically:
* Rebuilds the resume
* Adds missing ATS keywords
* Optimizes the structure
* Enhances role relevance
* Generates a downloadable PDF

This allows users to instantly obtain a highly optimized resume tailored specifically for the provided job description without manually editing anything.

This feature dramatically reduces the time required to customize resumes for multiple job applications.

---

## ✉️ Cover Letter Generator System

CareerForge also includes an AI-powered Cover Letter Generation system.

Users simply provide:
* Resume
* Job Description

The AI automatically generates:
* Personalized cover letters
* Professionally formatted content
* Job-specific writing
* ATS-friendly formatting

The generated cover letter can:
* Be viewed in text format
* Be downloaded directly as a PDF

The feature removes the repetitive manual effort required for writing unique cover letters for different job applications.

---

## 🤖 AI Mock Interview Platform

One of the most advanced and innovative modules of CareerForge is the AI Mock Interview Platform.

This feature simulates real interview environments and provides users with personalized AI-driven interview preparation.

### ⚙️ Interview Setup Process
Users provide:
* Resume
* Job Description

Users can then configure:
* **Interview Type**
  * General HR
  * Technical Round
  * Behavioral Round
  * Case Study Round
* **Difficulty Level**
  * Entry Level
  * Mid Level
  * Senior Level
* **Number of Questions**

After configuration, users proceed to the interview environment.

### 📹 Real-Time AI Interview Experience
Before starting:
* Camera preview is checked
* Microphone preview is checked
* Similar to Google Meet setup systems

Once the interview starts:
* The AI greets the user
* Questions are asked verbally
* Voice communication happens in real time

Sarvam AI is used for:
* Speech-to-Text
* Text-to-Speech

This creates:
* Natural conversation flow
* Realistic voice interactions
* Human-like interview simulation

Users can:
* Speak answers verbally
* Type answers manually if preferred

The camera remains active during the interview to create a realistic interview atmosphere.

### 📊 AI Interview Evaluation System
After all questions are completed, the platform generates:
* Performance Score
* Detailed Feedback
* Communication Analysis
* Technical Evaluation
* Confidence Assessment
* Improvement Suggestions
* Estimated Job Readiness

The AI provides highly personalized feedback based on:
* Resume content
* User responses
* Job description requirements

### 🎓 Shadow Mode / Learner Mode
One of the most unique features of the Interview Platform is the Shadow Mode, also called Learner Mode.

In this mode:
* After every question
* Before moving to the next question

The AI speaks out an ideal answer specifically tailored to:
* The user’s resume
* Their projects
* Their skills
* The selected job role

Instead of generic interview answers found online, users receive personalized high-quality sample responses relevant to their actual profile.

This makes the platform useful not only for testing users but also for actively teaching them how to answer interview questions effectively.

---

## 💼 Intelligent Job Listing Platform

One of the biggest and most impactful features of CareerForge is the centralized AI-powered Job Listing Dashboard.

The platform aggregates jobs from multiple major platforms using:
* Arjuna API
* JobSite API

Jobs from platforms such as:
* LinkedIn
* Indeed
* Naukri
* Glassdoor

are combined into one unified dashboard.

### 🎛️ Advanced Job Filtering System
Users can filter jobs based on:
* Role
* Technology Stack
* Location
* Country
* Experience Level
* Job Type
* Remote/Onsite
* Internship/Full-Time
* Platform Preference
* Posting Date
* Number of Results

Examples include:
* Backend Developer
* Full Stack Developer
* DevOps Engineer
* Remote Jobs
* Entry Level Roles
* Internship Opportunities

This creates a highly customizable job discovery experience.

---

## 🔄 Unified Career Workflow Integration

The most innovative aspect of the Job Portal is that all career preparation tools are directly integrated into each job listing.

When a user opens a job posting, they see:
* Company Information
* Role Information
* Location
* Job Description
* Job Requirements

Below the job description, four powerful action buttons are provided:

### 1. Apply Button
Redirects users directly to the original platform where the job was posted so they can apply immediately.

### 2. Instant Cover Letter Button
With one click:
* The user’s saved resume is automatically used
* The job description is automatically processed
* A job-specific cover letter is instantly generated

No repeated uploading or copy-pasting is required.

### 3. Job Fit Resume Button
With one click:
* Resume analysis occurs automatically
* ATS optimization is applied
* Missing keywords are added
* Resume restructuring happens
* PDF generation is completed instantly

This entire workflow happens seamlessly without forcing users to navigate across multiple feature pages.

### 4. Interview Preparation Button
With one click:
* Resume gets auto-loaded
* Job description gets auto-imported
* User is redirected directly into Interview Preparation mode

This creates an end-to-end career preparation pipeline inside a single ecosystem.

---

## 💾 Resume Memory System

CareerForge also includes a Resume Memory feature inside the user profile system.

Users can:
* Upload multiple resumes
* Store resumes permanently
* Save resumes as PDFs in Cloudinary

Whenever users access any feature:
* Resume Analyzer
* Cover Letter Generator
* Mock Interviews

they can directly select resumes from their saved profile memory rather than uploading files repeatedly.

This improves user convenience and workflow efficiency significantly.

---

## 🏆 Leaderboard and Gamification System

CareerForge introduces a unique gamified career preparation system through AI-driven leaderboards.

### 📈 Resume Analyzer Leaderboards
Whenever a resume is analyzed:
* The AI categorizes the job description into domains such as:
  * MERN Stack
  * DevOps
  * Full Stack
  * Java Development
  * Backend Engineering

---


## 🛠 Troubleshooting

- If ports are in use, change `PORT` (backend) or the `serve` port (frontend). Use `Get-NetTCPConnection` on PowerShell to inspect ports on Windows.
- For payment testing, use Razorpay test keys and ensure `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are set in the backend environment.
- If authentication fails, confirm `CLERK_SECRET_KEY` is set and Clerk publishable key in `frontend/shared-shell.js` is correct for your Clerk project.

If you'd like, I can also add a small `.env.example` file and an npm `dev` script that runs both frontend and backend concurrently.

The user’s ATS score is then added to that domain’s leaderboard.

Users can view:
* Rankings
* Scores
* Usernames
* Dates
* Personal High Scores

Only the highest score achieved by a user is retained, encouraging continuous improvement.

### 🎙️ Interview Performance Leaderboards
Similarly, interview scores are also categorized into domain-specific leaderboards.

Users can compare:
* Interview performance
* Ranking among peers
* Preparation quality

This introduces:
* Motivation
* Competition
* Gamification
* Engagement

into the job preparation experience.

---

## 💳 SaaS Subscription System

CareerForge operates as a SaaS-based platform with multiple subscription tiers.

| Tier | Pricing | Features Included |
| :--- | :--- | :--- |
| **Free Tier** | Automatically assigned | <ul><li>5 Resume Analyses per 15 Days</li><li>5 Job Fit Resume Generations per 15 Days</li><li>1 Interview Preparation Session per 15 Days</li><li>3 Cover Letter Generations per 15 Days</li><li>Access to 10 Job Listings at a Time</li></ul> |
| **Pro Tier** | ₹99/month | <ul><li>50 Resume Analyses per Month</li><li>30 Job Fit Resume Generations</li><li>20 Interview Preparations</li><li>30 Cover Letter Generations</li><li>Access to 100 Job Listings</li></ul> |
| **Max Tier** | ₹299/month | <ul><li>100 Resume Analyses</li><li>100 Job Fit Resume Generations</li><li>35 Interview Preparations</li><li>60 Cover Letter Generations</li><li>Unlimited Job Listing Access</li></ul> |

This pricing structure makes the platform accessible to students while maintaining a scalable SaaS monetization model.

---

## 💰 Razorpay Payment Integration

CareerForge includes a fully integrated Razorpay Payment Gateway system.

Features include:
* Subscription Purchases
* Secure Payment Handling
* Plan Upgrades
* Real Transaction Support
* SaaS Billing Infrastructure

Although currently operating in test mode for demonstration purposes, the system is fully functional and capable of processing actual payments.

This transforms CareerForge from a simple academic prototype into a commercially deployable SaaS platform.

---

## 🎯 Conclusion

CareerForge is not just a resume builder or interview preparation tool. It is a complete AI-powered career development ecosystem designed to simplify and automate every major stage of the job preparation process.

By integrating:
* Resume Building
* ATS Optimization
* AI Cover Letters
* Mock Interviews
* Intelligent Job Discovery
* Gamified Leaderboards
* Subscription Systems
* Payment Infrastructure

into one seamless platform, CareerForge creates a unified and production-ready user experience.

The platform demonstrates:
* Full Stack Development Expertise
* AI Integration Capabilities
* SaaS Architecture Understanding
* Cloud Service Integration
* Real-Time Communication Systems
* Scalable Product Design
* Industry-Oriented Problem Solving

CareerForge represents the transition of a college project into a realistic startup-level software product capable of solving real-world career preparation challenges for students and professionals alike.