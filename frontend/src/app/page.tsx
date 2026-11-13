"use client";

import { useEffect, useState } from "react";
import {
  Phone,
  History,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Building2,
  UserRound,
  MessageSquare,
  Clock3,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { callStages } from "@/lib/stages";
import {
  startCall,
  saveStage,
  closeCall,
  getCallHistory,
  getAIAssistance,
} from "@/lib/api";

type View = "active" | "history";

// Convert escaped newline text (\\n) into real line breaks.
function normalizeEscapedNewlines(value: string) {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");
}

type StageRecord = {
  outcome: string;
  notes: string;
};

type AIAssistance = {
  suggested_response: string;
  follow_up_question: string;
  coaching_tip: string;
};

type CallRecord = {
  id: string;
  prospect: string;
  company: string;
  lastStage: string;
  outcome: string;
  date: string;
  notes: string;
  status?: string;
  nextStep?: string;
  nextStepAt?: string;
  nextStepChannel?: string;
};

export default function Home() {
  const [view, setView] = useState<View>("active");
  const [stageIndex, setStageIndex] = useState(0);

  const [prospect, setProspect] = useState("");
  const [company, setCompany] = useState("");

  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [notes, setNotes] = useState("");

  // Structured follow-up details captured during Stage 7.
  const [nextStep, setNextStep] = useState("");
  const [nextStepAt, setNextStepAt] = useState("");
  const [nextStepChannel, setNextStepChannel] = useState("");

  const [stageRecords, setStageRecords] = useState<
    Record<number, StageRecord>
  >({});

  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [callId, setCallId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [apiError, setApiError] = useState("");

  const [aiAssistance, setAiAssistance] = useState<AIAssistance | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  const stage = callStages[stageIndex];
  const progress = ((stageIndex + 1) / callStages.length) * 100;

  async function refreshHistory() {
    setIsLoadingHistory(true);

    try {
      const response = await getCallHistory();

      const records: CallRecord[] = (response.calls || []).map(
        (call: any) => {
          const latestStageId =
            call.current_stage ??
            Math.max(
              0,
              ...(call.call_stage_results || []).map((item: any) =>
                Number(item.stage_id)
              )
            );

          const stageName =
            callStages.find((item) => item.id === latestStageId)?.name ||
            "Not started";

          const allNotes = (call.call_stage_results || [])
            .sort(
              (a: any, b: any) =>
                Number(a.stage_id) - Number(b.stage_id)
            )
            .map((item: any) => {
              const name =
                callStages.find((s) => s.id === item.stage_id)?.name ||
                `Stage ${item.stage_id}`;
              const words = item.prospect_words || "";
              const stageNotes = item.notes || "";

              return `${name}: ${words || stageNotes}`.trim();
            })
            .filter(Boolean)
            .join("\n");

          return {
            id: call.id,
            prospect: call.prospect_name || "Unknown prospect",
            company: call.company_name || "Unknown company",
            lastStage: stageName,
            outcome: call.outcome || call.status || "Unknown",
            date: call.created_at
              ? new Date(call.created_at).toLocaleString()
              : "",
            notes: allNotes,
            status: call.status,
            nextStep: call.next_step || "",
            nextStepAt: call.next_step_at || "",
            nextStepChannel: call.next_step_channel || "",
          };
        }
      );

      setCallHistory(records);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load call history.";
      setApiError(message);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  useEffect(() => {
    void refreshHistory();
  }, []);

  async function ensureCallStarted() {
    if (callId) return callId;

    if (!prospect.trim()) {
      throw new Error("Please enter the prospect's name first.");
    }

    const response = await startCall({
      prospect_name: prospect.trim(),
      company_name: company.trim() || undefined,
    });

    const newCallId = response.call?.id;

    if (!newCallId) {
      throw new Error("The server did not return a call ID.");
    }

    setCallId(newCallId);
    return newCallId;
  }

  async function finishCall(
    outcome: string,
    records: Record<number, StageRecord>,
    activeCallId: string
  ) {
    const response = await closeCall(activeCallId, {
      outcome,
      next_step: nextStep.trim() || undefined,
      next_step_at: nextStepAt
        ? new Date(nextStepAt).toISOString()
        : undefined,
      next_step_channel: nextStepChannel || undefined,
    });

    // Only show completion after the backend confirms the database update.
    if (!response?.success || response?.call?.status !== "completed") {
      throw new Error(
        response?.message || "The server did not confirm that the call was closed."
      );
    }

    setStageRecords(records);
    await refreshHistory();
    setView("history");
  }

  async function saveAndContinue() {
    if (!selectedOutcome) {
      alert("Please select what happened during this stage.");
      return;
    }

    setIsSaving(true);
    setApiError("");

    try {
      const activeCallId = await ensureCallStarted();

      const updatedRecords = {
        ...stageRecords,
        [stage.id]: {
          outcome: selectedOutcome,
          notes,
        },
      };

      await saveStage(activeCallId, {
        stage_id: stage.id,
        stage_outcome: selectedOutcome,
        prospect_words: notes,
        notes,
      });

      setStageRecords(updatedRecords);

      if (stage.id === 8) {
        await finishCall(
          selectedOutcome,
          updatedRecords,
          activeCallId
        );
        return;
      }

      setStageIndex((previous) => previous + 1);
      setSelectedOutcome("");
      setNotes("");
      setAiAssistance(null);
      setAiError("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not save this stage.";
      setApiError(message);
      alert(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function endCall() {
    setIsSaving(true);
    setApiError("");

    try {
      const activeCallId = await ensureCallStarted();
      const outcome = selectedOutcome || "Ended by caller";

      const updatedRecords = {
        ...stageRecords,
        [stage.id]: {
          outcome,
          notes,
        },
      };

      await saveStage(activeCallId, {
        stage_id: stage.id,
        stage_outcome: outcome,
        prospect_words: notes,
        notes,
      });

      await finishCall(outcome, updatedRecords, activeCallId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not end the call.";
      setApiError(message);
      alert(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGetAIAssistance() {
    setIsGeneratingAI(true);
    setAiError("");
    setAiAssistance(null);

    try {
      const conversationContext = Object.entries(stageRecords)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([stageId, record]) => {
          const stageName =
            callStages.find((item) => item.id === Number(stageId))?.name ||
            `Stage ${stageId}`;
          return `${stageName}: ${record.outcome}. Prospect words: ${record.notes || "Not recorded."}`;
        })
        .join("\\n");

      const response = await getAIAssistance({
        stage_id: stage.id,
        stage_name: stage.name,
        stage_purpose: stage.purpose,
        prospect_words: notes.trim(),
        conversation_context: conversationContext,
      });

      if (!response?.success || !response?.assistance) {
        throw new Error(response?.message || "AI assistance could not be generated.");
      }

      setAiAssistance(response.assistance);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating AI assistance."
      );
    } finally {
      setIsGeneratingAI(false);
    }
  }

  function startNewCall() {
    setStageIndex(0);
    setProspect("");
    setCompany("");
    setSelectedOutcome("");
    setNotes("");
    setNextStep("");
    setNextStepAt("");
    setNextStepChannel("");
    setAiAssistance(null);
    setAiError("");
    setStageRecords({});
    setCallId(null);
    setApiError("");
    setView("active");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-362.5 items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Phone size={20} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">CallPilot</h1>
              <p className="text-xs text-slate-500">
                Guided conversation workspace
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setView("active")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                view === "active"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Phone size={16} />
              Active call
            </button>

            <button
              onClick={() => {
                setView("history");
                void refreshHistory();
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                view === "history"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <History size={16} />
              Call history
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                {callHistory.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-362.5 px-5 py-8 lg:px-8">
        {apiError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {apiError}
            <button
              onClick={() => setApiError("")}
              className="ml-3 font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {view === "active" ? (
          <>
            {/* Page heading */}
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                  <span>Workspace</span>
                  <ChevronRight size={14} />
                  <span className="text-slate-900">Active call</span>
                </div>

                <h2 className="text-2xl font-bold tracking-tight">
                  Call workspace
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Follow the conversation and record what the prospect says.
                </p>
              </div>

              <button
                onClick={endCall}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={17} />
                {isSaving ? "Saving..." : "End call"}
              </button>
            </div>

            {/* Prospect information */}
            <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <UserRound size={15} />
                  Prospect name
                </label>
                <input
                  value={prospect}
                  onChange={(e) => setProspect(e.target.value)}
                  placeholder="Enter prospect's name"
                  disabled={Boolean(callId)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Building2 size={15} />
                  Company
                </label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter company name"
                  disabled={Boolean(callId)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>
            </section>

            {callId && (
              <p className="mb-5 text-xs text-emerald-700">
                Call saved to database. ID: {callId}
              </p>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              {/* Left stage navigation */}
              <aside className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Call progress</h3>
                  <span className="text-xs font-medium text-blue-600">
                    {stage.id}/8
                  </span>
                </div>

                <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {callStages.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                        index === stageIndex
                          ? "bg-blue-50 text-blue-700"
                          : index < stageIndex
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-400"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          index === stageIndex
                            ? "bg-blue-600 text-white"
                            : index < stageIndex
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index < stageIndex ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          item.id
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.name}
                        </p>
                        <p className="text-xs opacity-70">
                          Stage {item.id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Clock3 size={14} />
                    Conversation guide
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Most calls do not reach the final stage. Record what
                    actually happens.
                  </p>
                </div>
              </aside>

              {/* Main stage content */}
              <section className="min-w-0 space-y-5">
                {/* Stage purpose */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      STAGE {stage.id} OF 8
                    </span>

                    <span className="text-xs font-medium text-slate-400">
                      {Math.round(progress)}% progress
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {stage.name}
                  </h3>

                  <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-800">
                      <Sparkles size={17} />
                      Purpose
                    </div>

                    <p className="text-sm leading-7 text-slate-700">
                      {stage.purpose}
                    </p>
                  </div>
                </div>

                {/* Prospect responses */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" />
                    <h3 className="font-semibold">
                      What prospects tend to say
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {stage.responses.map((response, index) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-xl bg-slate-50 p-4"
                      >
                        <span className="mt-0.5 text-blue-600">•</span>
                        <p className="text-sm leading-relaxed text-slate-700">
                          {response}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outcome selection */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-2 font-semibold">
                    What happened at this stage?
                  </h3>

                  <p className="mb-5 text-xs text-slate-500">
                    Select the response that best describes the conversation.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {stage.outcomes.map((outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        disabled={isSaving}
                        onClick={() => setSelectedOutcome(outcome)}
                        className={`rounded-xl border p-4 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          selectedOutcome === outcome
                            ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100"
                            : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          {outcome}
                          {selectedOutcome === outcome && (
                            <CheckCircle2
                              size={18}
                              className="shrink-0 text-blue-600"
                            />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prospect's exact words */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      Prospect's exact words
                    </h3>
                    <span className="text-xs text-slate-400">Optional</span>
                  </div>

                  <p className="mb-4 text-xs leading-relaxed text-slate-500">
                    Capture what the prospect actually said. Avoid replacing
                    their words with your interpretation.
                  </p>

                  <textarea
                    value={normalizeEscapedNewlines(notes)}
                    onChange={(e) => setNotes(normalizeEscapedNewlines(e.target.value))}
                    rows={4}
                    placeholder="Type the prospect's words here..."
                    disabled={isSaving}
                    className="w-full resize-y rounded-xl border border-slate-200 p-4 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>

                {/* Gemini AI call assistant */}
                <div className="rounded-2xl border border-violet-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-violet-600" />
                        <h3 className="font-semibold">AI call assistant</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Get a stage-aware response and a useful question based on the prospect's words.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGetAIAssistance}
                      disabled={isGeneratingAI || isSaving}
                      className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGeneratingAI ? "Thinking..." : "Get AI suggestions"}
                    </button>
                  </div>

                  {!notes.trim() && (
                    <p className="mt-3 text-xs text-amber-700">
                      Tip: Add the prospect's latest words above for more relevant suggestions.
                    </p>
                  )}

                  {aiError && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {aiError}
                    </p>
                  )}

                  {isGeneratingAI && (
                    <div className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-violet-700">
                      Gemini is preparing suggestions for the {stage.name.toLowerCase()} stage...
                    </div>
                  )}

                  {aiAssistance && (
                    <div className="mt-5 space-y-3">
                      <div className="rounded-xl bg-violet-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
                          Suggested response
                        </p>
                        <p className="text-sm leading-relaxed text-slate-800">
                          {normalizeEscapedNewlines(aiAssistance.suggested_response)}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setNotes((current) =>
                              current
                                ? `${normalizeEscapedNewlines(current)}\n${normalizeEscapedNewlines(aiAssistance.suggested_response)}`
                                : aiAssistance.suggested_response
                            )
                          }
                          className="mt-3 text-xs font-semibold text-violet-700 underline"
                        >
                          Add to notes
                        </button>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Follow-up question
                        </p>
                        <p className="text-sm leading-relaxed text-slate-800">
                          {normalizeEscapedNewlines(aiAssistance.follow_up_question)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Coaching tip
                        </p>
                        <p className="text-sm leading-relaxed text-slate-800">
                          {normalizeEscapedNewlines(aiAssistance.coaching_tip)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Structured follow-up details for Stage 7 */}
                {stage.id === 7 && (
                  <div className="rounded-2xl border border-blue-100 bg-white p-6">
                    <h3 className="font-semibold">Follow-up details</h3>
                    <p className="mb-4 mt-1 text-xs text-slate-500">
                      Record the agreed action, date/time and channel so the follow-up is searchable in your call records.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Agreed next action
                        </label>
                        <input
                          value={nextStep}
                          onChange={(e) => setNextStep(e.target.value)}
                          disabled={isSaving}
                          placeholder="e.g. Send company overview and call back"
                          className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Follow-up date and time
                        </label>
                        <input
                          type="datetime-local"
                          value={nextStepAt}
                          onChange={(e) => setNextStepAt(e.target.value)}
                          disabled={isSaving}
                          className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Follow-up channel
                        </label>
                        <select
                          value={nextStepChannel}
                          onChange={(e) => setNextStepChannel(e.target.value)}
                          disabled={isSaving}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                        >
                          <option value="">Select a channel</option>
                          <option value="Email">Email</option>
                          <option value="Phone">Phone</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Referral">Referral</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs text-slate-500">
                    {stage.id === 8
                      ? "Save the final outcome and close this call."
                      : `Next: ${stage.nextLabel}`}
                  </p>

                  <button
                    onClick={saveAndContinue}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? "Saving..."
                      : stage.id === 8
                        ? "Finish call"
                        : "Save & continue"}
                    <ArrowRight size={17} />
                  </button>
                </div>
              </section>
            </div>
          </>
        ) : (
          /* Call history screen */
          <section>
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Past calls
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review calls saved in your CallPilot database.
                </p>
              </div>

              <button
                onClick={startNewCall}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Phone size={16} />
                Start new call
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {isLoadingHistory ? (
                <div className="px-6 py-20 text-center text-sm text-slate-500">
                  Loading call history...
                </div>
              ) : callHistory.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <History className="mx-auto mb-4 text-slate-300" size={40} />
                  <h3 className="font-semibold">No calls recorded yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Calls saved to the database will appear here.
                  </p>

                  <button
                    onClick={() => setView("active")}
                    className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Go to active call
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {callHistory.map((call) => (
                    <div
                      key={call.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Building2 size={19} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-semibold">{call.prospect}</h3>
                          <p className="text-sm text-slate-500">
                            {call.company}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {call.date}
                          </p>
                          {call.notes && (
                            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-xs text-slate-500">
                              {call.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                          {call.lastStage}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                            call.status === "active"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {call.outcome}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs text-slate-400">
        CallPilot · Guided cold-call workspace
      </footer>
    </main>
  );
}
