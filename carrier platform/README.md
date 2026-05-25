# Carrier Platform (Unified)

This folder contains the merged platform with one backend and one frontend.

## Structure

- `backend/` - Unified Node.js API for:
  - AI Interview
  - Resume Builder (`/generate-resume`)
  - Resume Analyzer (`/analyze-resume`)
- `frontend/` - Unified static frontend:
  - Landing page (`index.html`)
  - Resume Builder (`resume-builder/index.html`)
  - Resume Analyzer (`resume-analyzer/index.html`)
  - AI Interview (`interviewer/index.html`)

## Run

### 1) Start backend

```bash
cd backend
node server.js
```

### 2) Start frontend

```bash
cd ../frontend
npm start
```

Frontend runs at `http://localhost:3000` and backend runs at `http://localhost:5000`.
