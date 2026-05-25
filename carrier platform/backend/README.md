# Backend Server

Express.js backend server for AI Mock Interview application.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy or create `.env` file in this directory with:
     ```
     PORT=5000
     GROQ_API_KEY=your_groq_api_key
     SARVAM_API_KEY=your_sarvam_api_key
     FRONTEND_URL=http://localhost:3000
     ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:5000`

## API Endpoints

- **GET** `/api/health` - Server health check
- **POST** `/api/generate-questions` - Generate interview questions
- **POST** `/api/analyze-interview` - Analyze interview performance
- **POST** `/api/text-to-speech` - Convert text to speech (Sarvam AI)
- **POST** `/api/speech-to-text` - Convert speech to text (Sarvam AI)

## Technologies

- Node.js
- Express.js
- Groq API (LLM for question generation and analysis)
- Sarvam AI (Text-to-Speech and Speech-to-Text)
