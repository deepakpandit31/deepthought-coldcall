
export type CallStage = {
  id: number;
  name: string;
  purpose: string;
  responses: string[];
  outcomes: string[];
  nextLabel: string;
};

export const callStages: CallStage[] = [
  {
    id: 1,
    name: "Opening",
    purpose:
      "Reach the right person and say who you are. The prospect decides in the first ten seconds whether this call is worth a minute.",
    responses: [
      "An assistant or switchboard asks what the call is about.",
      "The person is driving, in a meeting or at lunch.",
      "The number belongs to somebody who left the company."
    ],
    outcomes: [
      "Right person reached",
      "Assistant answered",
      "Prospect unavailable",
      "Wrong person"
    ],
    nextLabel: "Purpose"
  },
  {
    id: 2,
    name: "Purpose",
    purpose:
      "Say in one or two sentences why you called, in words the prospect can repeat to a colleague.",
    responses: [
      "What does your company do?",
      "Where did you get my number?",
      "Is this a sales call?"
    ],
    outcomes: [
      "Asked what we do",
      "Asked source of number",
      "Identified it as a sales call",
      "Understood the purpose"
    ],
    nextLabel: "Permission"
  },
  {
    id: 3,
    name: "Permission",
    purpose:
      "Find out whether they are willing to talk now. A clear yes, a clear no, or a time to call back are all good outcomes.",
    responses: [
      "Call me after two.",
      "Call me tomorrow.",
      "Send it on WhatsApp first.",
      "Yes, go ahead."
    ],
    outcomes: [
      "Permission granted",
      "Asked to call later",
      "Asked for WhatsApp",
      "Declined to talk"
    ],
    nextLabel: "Their business"
  },
  {
    id: 4,
    name: "Their business",
    purpose:
      "Ask about their company and their work before saying anything about yours.",
    responses: [
      "They answer in one line and wait for the pitch.",
      "They correct your understanding of their company.",
      "They ask you to tell them about yourself first."
    ],
    outcomes: [
      "Described their business",
      "Corrected company information",
      "Asked about us",
      "Not the decision-maker"
    ],
    nextLabel: "Their need, in their words"
  },
  {
    id: 5,
    name: "Their need, in their words",
    purpose:
      "Hear what they are trying to do or struggling with, in their own words. Capture exactly what the prospect says.",
    responses: [
      "A goal: a new market or a new product line.",
      "A challenge: a plant running below capacity.",
      "Everything is fine; there is nothing they need.",
      "What can you do for a company like ours?"
    ],
    outcomes: [
      "Identified a growth goal",
      "Identified a business challenge",
      "No current need",
      "Asked about our solution"
    ],
    nextLabel: "Objection"
  },
  {
    id: 6,
    name: "Objection",
    purpose:
      "Hear the reason for a no and understand it. A reason you understand can be answered on this call or the next.",
    responses: [
      "We already have an agency or consultant.",
      "We have an in-house team.",
      "Speak to marketing or the owner.",
      "Send something in writing."
    ],
    outcomes: [
      "Existing agency or consultant",
      "Existing internal team",
      "Not the right person",
      "Requested information"
    ],
    nextLabel: "Next step"
  },
  {
    id: 7,
    name: "Next step",
    purpose:
      "Agree on one concrete thing: a document, a call at a named time, or a meeting.",
    responses: [
      "Yes, send me a document.",
      "Call me at a specific time.",
      "Speak to my colleague.",
      "Send it on WhatsApp or email."
    ],
    outcomes: [
      "Document requested",
      "Follow-up scheduled",
      "Meeting agreed",
      "Referral given"
    ],
    nextLabel: "Close"
  },
  {
    id: 8,
    name: "Close",
    purpose:
      "End the call clearly and record the outcome, the next step and the prospect's words from stage 5.",
    responses: [
      "A call ends mid-sentence or the line disconnects.",
      "A warm goodbye after a no is still a no.",
      "The caller records an outcome that may not match the conversation."
    ],
    outcomes: [
      "Next step confirmed",
      "Not interested",
      "Do not call",
      "Disconnected"
    ],
    nextLabel: "Finish call"
  }
];
