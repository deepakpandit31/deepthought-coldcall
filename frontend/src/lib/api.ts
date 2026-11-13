
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Common API request handler
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Handle empty or non-JSON responses safely
  const responseText = await response.text();

  let data: any = {};

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error("Server returned an invalid response");
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// 1. Start a new call
export async function startCall(payload: {
  prospect_name: string;
  company_name?: string;
  phone?: string;
}) {
  return apiRequest("/api/calls", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 2. Save stage result
export async function saveStage(
  callId: string,
  payload: {
    stage_id: number;
    stage_outcome: string;
    prospect_words?: string;
    notes?: string;
  }
) {
  return apiRequest(`/api/calls/${callId}/stages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 3. Close a call
export async function closeCall(
  callId: string,
  payload: {
    outcome?: string;
    next_step?: string;
    next_step_at?: string;
    next_step_channel?: string;
  }
) {
  return apiRequest(`/api/calls/${callId}/close`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// 4. Fetch call history
export async function getCallHistory() {
  return apiRequest("/api/calls");
}

// 5. Get Gemini AI assistance
export async function getAIAssistance(payload: {
  stage_id: number;
  stage_name: string;
  stage_purpose: string;
  prospect_words?: string;
  conversation_context?: string;
}) {
  return apiRequest("/api/ai/assist", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
