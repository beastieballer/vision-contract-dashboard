import { Store } from "./store.js";
import { newId } from "./ids.js";
import { nowIso } from "./time.js";
import { getLeadById } from "./leads.js";
import { generateBallparkQuoteForLead } from "./quotes.js";

export function listMessagesForLead(leadId) {
  const db = Store.loadDb();
  return db.messages
    .filter((m) => m.leadId === leadId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function pickChannel(lead) {
  if (lead.contact?.phone) return "sms";
  if (lead.contact?.email) return "email";
  return "note";
}

function draftSmsForLead({ lead, quoteText }) {
  const name = lead.contact?.name ? ` ${lead.contact.name.split(" ")[0]}` : "";
  const nextStep = lead.sqftEstimate
    ? "If that range works, I can recommend 2–3 film options and book a quick measure to confirm glass type."
    : "If you can send a quick video walkthrough (or window sizes), I can firm up pricing and recommend the right film.";

  return `Hi${name}—thanks for reaching out. ${quoteText}\n\n${nextStep}`;
}

function draftEmailForLead({ lead, quoteText }) {
  const subject = `Window Film Estimate — ${lead.location?.city ?? "Your Site"}`;
  const body =
    `Hi${lead.contact?.name ? ` ${lead.contact.name}` : ""},\n\n` +
    `${quoteText}\n\n` +
    `To firm this up, please reply with:\n` +
    `1) Confirmation if the glass is dual-pane / low‑e (if known)\n` +
    `2) A quick video walkthrough (or window sizes)\n` +
    `3) Any old film removal needed\n\n` +
    `Thanks,\n`;
  return { subject, body };
}

export function draftReplyForLead(leadId, input) {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  // If caller didn’t provide a quote text, generate a ballpark if possible.
  let quoteText = input?.quoteText ?? null;
  if (!quoteText && lead.sqftEstimate) {
    const quote = generateBallparkQuoteForLead(leadId, { measuredSqft: lead.sqftEstimate, complexity: "simple" });
    quoteText = quote?.outputs?.text ?? null;
  }
  quoteText ??= "I can get you a fast ballpark today—what’s the rough total sqft and is it residential or commercial?";

  const channel = input?.channel ?? pickChannel(lead);
  let message = { channel, body: "" };
  if (channel === "email") {
    const email = draftEmailForLead({ lead, quoteText });
    message = { channel, subject: email.subject, body: email.body };
  } else if (channel === "sms") {
    message = { channel, body: draftSmsForLead({ lead, quoteText }) };
  } else {
    message = { channel, body: quoteText };
  }

  const db = Store.loadDb();
  const record = {
    id: newId("msg"),
    leadId,
    createdAt: nowIso(),
    status: "DRAFT",
    to: channel === "sms" ? lead.contact?.phone : lead.contact?.email,
    ...message
  };
  db.messages.push(record);
  Store.saveDb(db);
  return record;
}

