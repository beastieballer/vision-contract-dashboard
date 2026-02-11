import { Store } from "./store.js";
import { newId } from "./ids.js";
import { hoursFromNowIso, daysFromNowIso, nowIso } from "./time.js";
import { getLeadById } from "./leads.js";

export function listTasksForLead(leadId) {
  const db = Store.loadDb();
  return db.tasks
    .filter((t) => t.leadId === leadId)
    .sort((a, b) => (a.dueAt > b.dueAt ? 1 : -1));
}

export function createDefaultFollowUpsForLead(leadId) {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  const db = Store.loadDb();
  const existingTypes = new Set(db.tasks.filter((t) => t.leadId === leadId).map((t) => t.type));

  const now = nowIso();
  const tasks = [
    {
      type: "FOLLOWUP_1H",
      dueAt: hoursFromNowIso(1),
      title: "Send ballpark + film options",
      body: "Send a fast ballpark quote with assumptions + ask for glass type and a video walkthrough."
    },
    {
      type: "FOLLOWUP_24H",
      dueAt: hoursFromNowIso(24),
      title: "Follow up (24h)",
      body: "If no response, follow up with 2 time slots for a virtual/on-site measure."
    },
    {
      type: "FOLLOWUP_72H",
      dueAt: daysFromNowIso(3),
      title: "Last touch (72h)",
      body: "Final check-in. Offer a quick call + remind of minimum job pricing and warranty considerations."
    }
  ]
    .filter((t) => !existingTypes.has(t.type))
    .map((t) => ({
      id: newId("task"),
      leadId,
      createdAt: now,
      updatedAt: now,
      status: "OPEN",
      ...t
    }));

  if (!tasks.length) return { created: 0, tasks: [] };

  db.tasks.push(...tasks);
  Store.saveDb(db);
  return { created: tasks.length, tasks };
}

