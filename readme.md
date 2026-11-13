# CallPilot

**A guided cold-calling workspace powered by AI**

CallPilot is a full-stack application designed to help sales representatives navigate structured cold calls, record prospect responses, track conversation outcomes, and manage follow-ups.

It provides an eight-stage calling workflow, persistent call history, and Gemini-powered AI assistance.

## Live Application

- **Frontend:** [Add your Vercel URL]
- **Backend:** [Add your Render URL]
- **Health Check:** [Add your Render health endpoint URL]

## Features

- Eight-stage guided cold-calling workflow:
  1. Opening
  2. Purpose
  3. Permission
  4. Their Business
  5. Their Need in Their Words
  6. Objection
  7. Next Step
  8. Close
- Stage-specific purpose and prospect response guidance.
- Record stage outcomes and prospect's exact words.
- Gemini AI call assistant that generates:
  - Suggested responses
  - Follow-up questions
  - Coaching tips
- Structured follow-up details including action, date, time, and channel.
- Call history with the last stage reached and call outcome.
- Supabase database persistence.
- REST API built with Express.js.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Supabase PostgreSQL |
| AI | Google Gemini API |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git and GitHub |

## Project Structure

```text
deepthought-coldcall/
├── frontend/
├── backend/
├── supabase/
│   └── schema.sql
├── .gitignore
└── README.md
```

## Local Setup

### Prerequisites

- Node.js and npm
- Git
- Supabase account
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/deepthought-coldcall.git
cd deepthought-coldcall
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

Run the backend:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`.

Health endpoint:

```text
http://localhost:5000/health
```

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env.local` inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

Open `http://localhost:3000`.

### 4. Configure Supabase

1. Create a Supabase project.
2. Open the SQL Editor.
3. Execute the SQL from `supabase/schema.sql`.
4. Add the project URL and service role key to the backend environment variables.

**Security:** Never commit `.env`, `.env.local`, service role keys, or Gemini API keys.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Backend health check |
| GET | `/api` | API information |
| POST | `/api/calls` | Start a call |
| POST | `/api/calls/:callId/stages` | Save a stage result |
| PATCH | `/api/calls/:callId/close` | Close a call |
| GET | `/api/calls` | Retrieve call history |
| POST | `/api/ai/assist` | Generate AI call assistance |

## AI Integration

CallPilot uses the Google Gemini API to provide contextual assistance during a call.

The AI assistant considers the current call stage, its purpose, the prospect's exact words, and previous conversation context.

It generates a suggested response, a relevant follow-up question, and a coaching tip.

AI suggestions are intended to assist the caller. The representative remains responsible for the actual conversation.

## Database

Supabase PostgreSQL stores:

- Calls and prospect details
- The eight call stages
- Stage outcomes
- Prospect's exact words
- Notes and call outcomes
- Follow-up actions and scheduling information

The database schema is provided in `supabase/schema.sql`.

## Deployment

### Frontend: Vercel

1. Import the GitHub repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Configure `NEXT_PUBLIC_API_URL` with the deployed Render backend URL.
4. Deploy the application.

### Backend: Render

1. Create a new Web Service using the GitHub repository.
2. Set the Root Directory to `backend`.
3. Set the build command to `npm install`.
4. Set the start command to `npm start`.
5. Configure the required environment variables.
6. Set `FRONTEND_URL` to the deployed Vercel URL.
7. Deploy and verify `/health`.

## LLM Details

- **LLM Provider:** Google
- **Model:** Gemini
- **Purpose:** Stage-aware call suggestions, follow-up questions, and real-time coaching assistance.

## Assignment

Built as a Forward Deployed Engineer practical assignment for DeepThought CultureTech.

