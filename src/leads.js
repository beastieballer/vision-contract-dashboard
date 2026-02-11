import { Store } from "./store.js";
import { newId } from "./ids.js";
import { nowIso } from "./time.js";
import { scoreLead } from "./scoring.js";

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

function normalizeEmail(email) {
  if (!email) return null;
  const value = String(email).trim().toLowerCase();
  if (!value.includes("@")) return null;
  return value;
}

function normalizeLead(input) {
  const createdAt = nowIso();
  const contact = input.contact ?? {};

  const lead = {
    id: newId("lead"),
    createdAt,
    updatedAt: createdAt,
    status: input.status ?? "NEW",
    source: input.source ?? "unknown",
    contact: {
      name: contact.name ?? input.name ?? null,
      phone: normalizePhone(contact.phone ?? input.phone ?? null),
      email: normalizeEmail(contact.email ?? input.email ?? null)
    },
    location: {
      address: input.location?.address ?? input.address ?? null,
      city: input.location?.city ?? input.city ?? null,
      state: input.location?.state ?? input.state ?? null
    },
    jobType: input.jobType ?? "both",
    sqftEstimate: input.sqftEstimate ?? input.sqft ?? null,
    filmCategory: input.filmCategory ?? "unsure",
    goals: Array.isArray(input.goals) ? input.goals : [],
    glass: {
      dualPane: input.glass?.dualPane ?? null,
      lowE: input.glass?.lowE ?? null,
      notes: input.glass?.notes ?? null
    },
    removalNeeded: input.removalNeeded ?? null,
    access: input.access ?? null,
    notes: input.notes ?? null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    history: [
      {
        at: createdAt,
        type: "LEAD_CREATED",
        by: "system",
        detail: { source: input.source ?? "unknown" }
      }
    ]
  };

  const scored = scoreLead(lead);
  lead.score = scored.score;
  lead.scoreReasons = scored.reasons;
  lead.nextBestAction = scored.nextBestAction;
  return lead;
}

export function listLeads() {
  const db = Store.loadDb();
  return [...db.leads].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getLeadById(id) {
  const db = Store.loadDb();
  return db.leads.find((l) => l.id === id) ?? null;
}

export function createLead(input) {
  const db = Store.loadDb();
  const lead = normalizeLead(input);
  db.leads.push(lead);
  Store.saveDb(db);
  return lead;
}

export function patchLead(id, patch) {
  const db = Store.loadDb();
  const idx = db.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const existing = db.leads[idx];
  const next = {
    ...existing,
    ...patch,
    contact: { ...existing.contact, ...(patch.contact ?? {}) },
    location: { ...existing.location, ...(patch.location ?? {}) },
    glass: { ...existing.glass, ...(patch.glass ?? {}) },
    updatedAt: nowIso()
  };

  const scored = scoreLead(next);
  next.score = scored.score;
  next.scoreReasons = scored.reasons;
  next.nextBestAction = scored.nextBestAction;

  db.leads[idx] = next;
  Store.saveDb(db);
  return next;
}

