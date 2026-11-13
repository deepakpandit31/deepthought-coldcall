# CallPilot - AI-Powered Cold Calling Workspace

CallPilot is a full-stack cold-calling workspace designed to help sales representatives manage conversations with prospects through a structured, stage-based workflow.

The application organizes cold calls into eight stages, helping representatives understand prospect responses, capture their exact words, record objections, and identify suitable next steps.

It also integrates Google Gemini AI to provide real-time conversation suggestions and coaching during calls.

## Features

### 1. Structured 8-Stage Calling Workflow

The application guides representatives through eight stages:

1. **Opening** - Introduce yourself and establish the conversation.
2. **Purpose** - Explain the reason for calling.
3. **Permission** - Ask for permission to continue.
4. **Their Business** - Understand the prospect's business.
5. **Their Need in Their Words** - Capture the prospect's requirements and challenges.
6. **Objection** - Understand and address objections.
7. **Next Step** - Identify and record the follow-up action.
8. **Close** - Complete the conversation and record its outcome.

Each stage provides:
- Stage purpose and guidance.
- Typical prospect responses.
- Available outcome options.
- A field to capture the prospect's exact words.
- Notes and stage progression.

### 2. AI-Powered Assistance

CallPilot integrates Google Gemini AI to assist representatives during conversations.

AI assistance provides:
- Suggested responses based on the current conversation.
- Relevant follow-up questions.
- Coaching tips for handling the conversation.

The AI uses the current stage, its purpose, and conversation context to generate relevant suggestions.

### 3. Call Management

- Start a new call.
- Record prospect and company information.
- Save stage outcomes and prospect responses.
- Track call progress.
- Record follow-up actions, dates, and channels.
- Close calls with an outcome.
- View previous call records.

### 4. Persistent Data Storage

Supabase is used as the database to store:
- Call information.
- Calling stage definitions.
- Stage outcomes.
- Prospect's exact words.
- Notes and follow-up information.
- Call status and timestamps.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| AI Integration | Google Gemini API |
| API Communication | REST API |

## Project Structure

```text
deepthought-coldcall/
│
├── backend/
│   ├── ai.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   │
│   │   └── lib/
│   │       ├── api.ts
│   │       └── stages.ts
│   │
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   └── schema.sql
│
├── .gitignore
└── README.md
```

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Node.js
- npm
- A Supabase account and project
- A Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/deepakpandit31/deepthought-coldcall.git

cd deepthought-coldcall
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GEMINI_API_KEY=your_gemini_api_key

FRONTEND_URL=http://localhost:3000
```

Replace the placeholder values with your own credentials.

Start the backend:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/health
```

### 3. Configure the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the application:

```text
http://localhost:3000
```

## Backend API Endpoints

Base URL:

```text
http://localhost:5000
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check backend health |
| GET | `/api` | Backend API information |
| POST | `/api/calls` | Start a new call |
| POST | `/api/calls/:callId/stages` | Save a stage result |
| PATCH | `/api/calls/:callId/close` | Close a call |
| GET | `/api/calls` | Retrieve call history |
| POST | `/api/ai/assist` | Get AI-powered assistance |

## Database Design

The application uses Supabase PostgreSQL with three main tables:

### 1. calls

Stores the main call information, including:
- Prospect name
- Company name
- Phone number
- Call status
- Current stage
- Call outcome
- Follow-up information
- Start and end timestamps

### 2. call_stages

Stores the eight predefined calling stages and their associated information.

### 3. call_stage_results

Stores the result of each completed stage, including:
- Call ID
- Stage ID
- Stage outcome
- Prospect's exact words
- Notes
- Timestamp

The database uses relationships between calls, stages, and stage results to maintain conversation history.

## AI Integration

**LLM Used:** Google Gemini

**Purpose:** Real-time assistance during cold-calling conversations.

The backend sends the current stage information and conversation context to the Gemini API.

The AI returns structured assistance containing:

- `suggested_response`
- `follow_up_question`
- `coaching_tip`

This helps representatives respond more effectively while keeping the actual conversation under their control.

## Security

- Environment variables are used for API keys and database credentials.
- Sensitive configuration files are excluded through `.gitignore`.
- Supabase service credentials are kept on the backend and are not exposed to the frontend.

Never commit your `.env` or `.env.local` files.

## Author

**Deepak Sikhwal**

GitHub: [@deepakpandit31](https://github.com/deepakpandit31)

## Project

CallPilot - AI-Powered Cold Calling Workspace

Built as a product assignment for DeepThought CultureTech.
