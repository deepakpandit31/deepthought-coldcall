
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./supabase");
const { generateCallAssistance } = require("./ai");
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

app.use(express.json());

// -------------------------------------
// HEALTH CHECK
// -------------------------------------

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CallPilot API is running",
  });
});

// -------------------------------------
// API WELCOME
// -------------------------------------

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to CallPilot API",
  });
});

// -------------------------------------
// 1. START A NEW CALL
// -------------------------------------

app.post("/api/calls", async (req, res) => {
  try {
    const { prospect_name, company_name, phone } = req.body;

    if (!prospect_name || !prospect_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prospect name is required",
      });
    }

    const { data, error } = await supabase
      .from("calls")
      .insert({
        prospect_name: prospect_name.trim(),
        company_name: company_name?.trim() || null,
        phone: phone?.trim() || null,
        status: "active",
        current_stage: 1,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Call started successfully",
      call: data,
    });
  } catch (error) {
    console.error("Start call error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not start call",
      error: error.message,
    });
  }
});

// -------------------------------------
// 2. SAVE A STAGE RESULT
// -------------------------------------

app.post("/api/calls/:callId/stages", async (req, res) => {
  try {
    const { callId } = req.params;

    const {
      stage_id,
      stage_outcome,
      prospect_words,
      notes,
    } = req.body;

    const stageNumber = Number(stage_id);

    if (
      !Number.isInteger(stageNumber) ||
      stageNumber < 1 ||
      stageNumber > 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid stage_id between 1 and 8 is required",
      });
    }

    if (!stage_outcome || !stage_outcome.trim()) {
      return res.status(400).json({
        success: false,
        message: "Stage outcome is required",
      });
    }

    // Check whether the call exists and is active
    const { data: call, error: callError } = await supabase
      .from("calls")
      .select("id, status")
      .eq("id", callId)
      .maybeSingle();

    if (callError) throw callError;

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    if (call.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Call is already closed",
      });
    }

    // Save or update the stage result
    const { data, error } = await supabase
      .from("call_stage_results")
      .upsert(
        {
          call_id: callId,
          stage_id: stageNumber,
          stage_outcome: stage_outcome.trim(),
          prospect_words: prospect_words?.trim() || null,
          notes: notes?.trim() || null,
          happened_at: new Date().toISOString(),
        },
        {
          onConflict: "call_id,stage_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    // Update the call's current stage
    const { error: updateError } = await supabase
      .from("calls")
      .update({
        current_stage: stageNumber,
      })
      .eq("id", callId)
      .eq("status", "active");

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: "Stage result saved successfully",
      stage_result: data,
    });
  } catch (error) {
    console.error("Save stage error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not save stage result",
      error: error.message,
    });
  }
});

// -------------------------------------
// 3. CLOSE A CALL
// -------------------------------------

app.patch("/api/calls/:callId/close", async (req, res) => {
  try {
    const { callId } = req.params;

    const {
      outcome,
      next_step,
      next_step_at,
      next_step_channel,
    } = req.body;

    console.log("Closing call:", callId);

    // Check that the call exists and is active
    const { data: existingCall, error: findError } = await supabase
      .from("calls")
      .select("id, status")
      .eq("id", callId)
      .maybeSingle();

    if (findError) throw findError;

    if (!existingCall) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    if (existingCall.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Call is already closed",
      });
    }

    // Update call status and final details
    const { data, error } = await supabase
      .from("calls")
      .update({
        status: "completed",
        outcome: outcome || null,
        next_step: next_step || null,
        next_step_at: next_step_at || null,
        next_step_channel: next_step_channel || null,
        ended_at: new Date().toISOString(),
      })
      .eq("id", callId)
      .eq("status", "active")
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(409).json({
        success: false,
        message: "Call could not be closed. Please refresh and try again.",
      });
    }

    console.log("Call closed successfully:", callId);

    return res.json({
      success: true,
      message: "Call closed successfully",
      call: data,
    });
  } catch (error) {
    console.error("Close call error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not close call",
      error: error.message,
    });
  }
});

// -------------------------------------
// 4. GET CALL HISTORY
// -------------------------------------

app.get("/api/calls", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("calls")
      .select("*, call_stage_results(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      count: data.length,
      calls: data,
    });
  } catch (error) {
    console.error("Fetch calls error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch calls",
      error: error.message,
    });
  }
});


// 5. START SERVER

const PORT = process.env.PORT || 5000;


// -------------------------------------
// 6. GEMINI AI CALL ASSISTANT
// -------------------------------------

app.post("/api/ai/assist", async (req, res) => {
  try {
    const {
      stage_id,
      stage_name,
      stage_purpose,
      prospect_words,
      conversation_context,
    } = req.body;

    const stageNumber = Number(stage_id);

    if (
      !Number.isInteger(stageNumber) ||
      stageNumber < 1 ||
      stageNumber > 8
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid stage_id between 1 and 8 is required.",
      });
    }

    if (!stage_name || !stage_purpose) {
      return res.status(400).json({
        success: false,
        message: "Stage name and purpose are required.",
      });
    }

    const assistance = await generateCallAssistance({
      stageName: stage_name,
      stagePurpose: stage_purpose,
      prospectWords: prospect_words,
      conversationContext: conversation_context,
    });

    return res.json({
      success: true,
      assistance,
    });
  } catch (error) {
    console.error("Gemini assistance error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not generate AI assistance.",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`CallPilot API running on port ${PORT}`);
});
