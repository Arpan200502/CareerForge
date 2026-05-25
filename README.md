# Career Forge — AI-Powered Career Platform

An all-in-one career development suite powered by AI — resume building, resume analysis, AI mock interviews, cover letter generation, and job browsing — all in one unified platform.

## Features

| Feature | Description |
|---|---|
| **Resume Builder** | Build professional resumes with 3 templates (ATS, AltaCV, Academic). Generates LaTeX PDFs with voice input support and live preview. |
| **Resume Analyzer** | Upload a resume + job description to get an AI-powered ATS compatibility analysis, skill gap detection, and tailored suggestions. |
| **AI Mock Interview** | Realistic mock interviews with an AI avatar, text-to-speech questions, speech-to-text answers, shadow mode (ideal answer playback), and post-interview analysis with scores. |
| **Cover Letter Generator** | Generate tailored cover letters from your resume and a job description. |
| **Job Listings** | Browse, filter, and search jobs synced from the Adzuna API. Generate tailored resumes and cover letters directly from a job listing. |

## Tech Stack

### Backend (`carrier platform/backend/`)

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas) via Mongoose
- **AI:** Groq (LLaMA-3.3-70B) for resume/content generation & analysis
- **Speech:** Sarvam AI for Text-to-Speech & Speech-to-Text
- **PDF:** LaTeX compiled via ytotech.com API (3 templates)
- **Jobs:** Python + Adzuna API (cron-scheduled daily fetch)

### Frontend (`carrier platform/frontend/`)

- **Stack:** Vanilla HTML, CSS, JavaScript
- **Auth:** Clerk.js
- **PDF Parsing:** PDF.js
- **Serving:** `npx serve` (port 3000)

## Project Structure

```
carrier platform/
├── backend/
│   ├── server.js            # Express API server (all routes, AI logic, DB)
│   ├── package.json
│   ├── scrape_jobs.py       # Python job scraper (Adzuna API)
│   └── .env                 # API keys & MongoDB URI
├── frontend/
│   ├── index.html           # Landing page
│   ├── shared-shell.js      # Shared navbar & Clerk auth
│   ├── resume-builder/      # AI Resume Builder
│   ├── resume-analyzer/     # Resume Analyzer (Gap Hunter)
│   ├── interviewer/         # AI Mock Interview
│   ├── cover-letter/        # Cover Letter Generator
│   └── job-listings/        # Job Listings & Search
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB connection string (Atlas)
- Groq API key
- Sarvam AI API key
- Adzuna API credentials (for job scraping)
- Clerk publishable key (frontend auth)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/career-forge.git
cd career-forge

# 2. Install backend dependencies
cd "carrier platform/backend"
npm install

# 3. Configure environment
# Edit .env with your API keys and MongoDB URI

# 4. Start the backend
node server.js

# 5. Install frontend dependencies (Clerk)
cd "../frontend"
npm install

# 6. Start the frontend
npx serve . -p 3000
```

The frontend runs at `http://localhost:3000` and the backend at `http://localhost:5000`.

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/generate-resume` | Generate resume HTML |
| `POST` | `/generate-resume-latex` | Generate PDF resume (LaTeX) |
| `POST` | `/recompile-latex` | Recompile edited LaTeX source |
| `POST` | `/analyze-resume` | Analyze resume against job description |
| `POST` | `/generate-job-specific-resume` | Tailor resume to a job |
| `POST` | `/api/generate-questions` | Generate interview questions |
| `POST` | `/api/generate-audios` | Pre-generate TTS for questions |
| `POST` | `/api/generate-shadow-mode` | Generate ideal answers with audio |
| `POST` | `/api/text-to-speech` | Text-to-Speech |
| `POST` | `/api/speech-to-text` | Speech-to-Text |
| `POST` | `/api/analyze-interview` | Analyze completed interview |
| `POST` | `/api/fetch-jobs` | Fetch cached jobs |
| `POST` | `/api/match-jobs` | Filter/search jobs |
| `POST` | `/api/generate-cover-letter` | Generate cover letter |
| `GET` | `/api/jobs/detail/:id` | Job detail by ID |
| `GET` | `/api/jobs/filters` | Available filter options |

## License

MIT
