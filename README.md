# CallPilot - AI-Powered Cold Calling Workspace

CallPilot is a full-stack cold-calling workspace designed to help sales
representatives manage prospect conversations through a structured,
eight-stage workflow.

The application helps representatives understand prospect responses,
capture their exact words, record objections, track call progress, and
identify suitable next steps. It also integrates Google Gemini to
provide contextual conversation suggestions and coaching.

## Live Demo

-   **Frontend:** <https://callpilot-roan.vercel.app/>
-   **Backend API:** <https://deepthought-coldcall.onrender.com>
-   **Backend health check:**
    <https://deepthought-coldcall.onrender.com/health>
-   **GitHub repository:**
    <https://github.com/deepakpandit31/deepthought-coldcall>

## Features

### 1. Structured Eight-Stage Calling Workflow

CallPilot guides representatives through these eight stages:

1.  **Opening:** Introduce yourself and establish the conversation.
2.  **Purpose:** Explain the reason for calling.
3.  **Permission:** Ask for permission to continue.
4.  **Their Business:** Understand the prospect's business.
5.  **Their Need in Their Words:** Capture the prospect's requirements
    and challenges.
6.  **Objection:** Understand and address objections.
7.  **Next Step:** Identify and record the follow-up action.
8.  **Close:** Complete the conversation and record its outcome.

Each stage includes: - Stage purpose and guidance. - Typical prospect
responses. - Available outcome options. - A field to capture the
prospect's exact words. - Notes and stage progression.

### 2. AI-Powered Assistance

CallPilot integrates Google Gemini to assist representatives during
conversations.

AI assistance provides: - Suggested responses based on the current
conversation. - Relevant follow-up questions. - Coaching tips for
handling the conversation.

The backend sends the current stage, its purpose, prospect words, and
available conversation context to Gemini to generate structured
suggestions. AI suggestions support the representative; they do not
replace the representative's judgment.

### 3. Call Management

-   Start a new call.
-   Record prospect and company information.
-   Save stage outcomes and prospect responses.
-   Track call progress.
-   Record follow-up actions, dates, times, and channels.
-   Close calls with an outcome.
-   View previous call records.

### 4. Persistent Data Storage

Supabase (PostgreSQL) stores: - Call information. - Calling stage
definitions. - Stage outcomes. - Prospect's exact words. - Notes and
follow-up information. - Call status and timestamps.

## Technology Stack

  Layer               Technologies
  ------------------- ----------------------------
  Frontend            Next.js, React, TypeScript
  Styling             Tailwind CSS
  Backend             Node.js, Express.js
  Database            Supabase (PostgreSQL)
  AI integration      Google Gemini API
  API communication   REST API
  Frontend hosting    Vercel
  Backend hosting     Render

## Project Structure

``` text
deepthought-coldcall/
├── backend/
│   ├── ai.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   └── lib/
│   │       ├── api.ts
│   │       └── stages.ts
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   └── schema.sql
├── .gitignore
└── README.md
```

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

-   Node.js and npm
-   A Supabase account and project
-   A Google Gemini API key

### 1. Clone the repository

``` bash
git clone https://github.com/deepakpandit31/deepthought-coldcall.git
cd deepthought-coldcall
```

### 2. Configure and run the backend

``` bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

``` env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

Replace the placeholder values with your own credentials. Keep this file
private and do not commit it.

Start the backend using the development script configured in
`backend/package.json`:

``` bash
npm run dev
```

The backend runs at:

``` text
http://localhost:5000
```

Health check:

``` text
http://localhost:5000/health
```

### 3. Configure and run the frontend

Open another terminal from the project root:

``` bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` directory:

``` env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

``` bash
npm run dev
```

Open the application at:

``` text
http://localhost:3000
```

## Backend API Endpoints

**Local base URL:** `http://localhost:5000`

**Production base URL:** `https://deepthought-coldcall.onrender.com`

  Method   Endpoint                      Description
  -------- ----------------------------- ---------------------------
  GET      `/health`                     Check backend health
  GET      `/api`                        Backend API information
  POST     `/api/calls`                  Start a new call
  POST     `/api/calls/:callId/stages`   Save a stage result
  PATCH    `/api/calls/:callId/close`    Close a call
  GET      `/api/calls`                  Retrieve call history
  POST     `/api/ai/assist`              Get AI-powered assistance

## Database Design

The application uses Supabase PostgreSQL with three main tables.

### 1. `calls`

Stores the main call information, including: - Prospect name. - Company
name. - Phone number. - Call status. - Current stage. - Call outcome. -
Follow-up information. - Start and end timestamps.

### 2. `call_stages`

Stores the eight predefined calling stages and their associated
information.

### 3. `call_stage_results`

Stores the result of each call stage, including: - Call ID. - Stage
ID. - Stage outcome. - Prospect's exact words. - Notes. - Timestamp.

Relationships between calls, stages, and stage results maintain the call
history.

## AI Integration

-   **LLM:** Google Gemini
-   **Purpose:** Contextual assistance during cold-calling
    conversations.

The backend sends the current stage information and conversation context
to the Gemini API. The AI returns structured assistance containing:

-   `suggested_response`
-   `follow_up_question`
-   `coaching_tip`

This helps representatives respond more effectively while keeping the
actual conversation under their control.

## Deployment Configuration

The deployed frontend and backend use the following environment
variables.

**Vercel frontend:**

``` env
NEXT_PUBLIC_API_URL=https://deepthought-coldcall.onrender.com
```

**Render backend:**

``` env
FRONTEND_URL=https://callpilot-roan.vercel.app
```

The backend also requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
and `GEMINI_API_KEY` to be configured in Render's environment settings.
Do not put secret values in this README or in frontend environment
variables.

## Security

-   Environment variables are used for API keys and database
    credentials.
-   Sensitive configuration files are excluded through `.gitignore`.
-   Supabase service credentials are kept on the backend and are not
    exposed to frontend code.
-   Never commit `.env` or `.env.local` files.

## Author

**Deepak Sikhwal**

GitHub: [@deepakpandit31](https://github.com/deepakpandit31)

## Project

**CallPilot - AI-Powered Cold Calling Workspace**

Built as a product assignment for DeepThought CultureTech.
