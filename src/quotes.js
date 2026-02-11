import { Store } from "./store.js";
import { newId } from "./ids.js";
import { nowIso } from "./time.js";
import { getLeadById, patchLead } from "./leads.js";
import { getSettings } from "./settings.js";
import { computeBallparkRange, computeQuote } from "./quoteEngine.js";

function formatUsd(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function buildBallparkText({ lead, range }) {
  const city = lead.location?.city ? ` in ${lead.location.city}` : "";
  const sqft = range.measuredSqft ? `${range.measuredSqft} sqft` : "your windows";
  const goal = Array.isArray(lead.goals) && lead.goals.length ? ` (${lead.goals.join(", ")})` : "";
  return (
    `Ballpark for ${sqft}${city} is ${formatUsd(range.low)}–${formatUsd(range.high)} installed.` +
    ` Assumes standard access, interior install where appropriate, and glass-type verification.` +
    ` Next step: send a quick video walkthrough + confirm if the glass is dual-pane/low‑e.${goal}`
  );
}

function buildProposalHtml({ lead, quote }) {
  const contactLine = [lead.contact?.name, lead.contact?.email, lead.contact?.phone].filter(Boolean).join(" · ");
  const locationLine = [lead.location?.address, lead.location?.city, lead.location?.state].filter(Boolean).join(", ");
  const adders = quote.costs?.adders ?? [];
  const addersHtml = adders.length
    ? `<ul>${adders
        .map((a) => `<li>${a.label}: <strong>${formatUsd(a.amount)}</strong></li>`)
        .join("")}</ul>`
    : "<p>None</p>";

  const goalHtml = Array.isArray(lead.goals) && lead.goals.length ? `<p><strong>Goals:</strong> ${lead.goals.join(", ")}</p>` : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Window Film Proposal</title>
  <style>
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; margin:40px; color:#0b1220;}
    h1{margin:0 0 4px 0;}
    .muted{color:#556; font-size:14px;}
    .card{border:1px solid #dde; border-radius:12px; padding:16px; margin:14px 0;}
    table{width:100%; border-collapse:collapse;}
    td,th{padding:8px 10px; border-bottom:1px solid #eef;}
    .total{font-size:18px;}
  </style>
</head>
<body>
  <h1>Window Film Proposal</h1>
  <div class="muted">${nowIso().slice(0, 10)} · Lead ${lead.id}</div>

  <div class="card">
    <div class="muted">Customer</div>
    <div>${contactLine || "—"}</div>
    <div class="muted" style="margin-top:8px;">Site</div>
    <div>${locationLine || "—"}</div>
    ${goalHtml}
  </div>

  <div class="card">
    <div class="muted">Scope</div>
    <p>Supply and install ${quote.filmType} window film. Final film selection subject to glass-type verification (dual-pane/low‑e/tempered/laminated) and manufacturer compatibility.</p>
  </div>

  <div class="card">
    <div class="muted">Measurements</div>
    <table>
      <tr><th align="left">Measured</th><th align="left">Billable</th><th align="left">Waste</th></tr>
      <tr>
        <td>${quote.measuredSqft} sqft</td>
        <td>${quote.billableSqft} sqft</td>
        <td>${Math.round((quote.wasteFactor ?? 0) * 100)}%</td>
      </tr>
    </table>
  </div>

  <div class="card">
    <div class="muted">Pricing</div>
    <table>
      <tr><td>Material</td><td align="right"><strong>${formatUsd(quote.costs.materialCost)}</strong></td></tr>
      <tr><td>Labor</td><td align="right"><strong>${formatUsd(quote.costs.laborCost)}</strong></td></tr>
      <tr><td>Adders</td><td align="right"><strong>${formatUsd((quote.costs.adders ?? []).reduce((s,a)=>s+a.amount,0))}</strong></td></tr>
      <tr><td class="total"><strong>Total</strong></td><td class="total" align="right"><strong>${formatUsd(quote.total)}</strong></td></tr>
    </table>
    ${quote.minimumJobApplied ? `<p class="muted">Minimum job charge applied: ${formatUsd(quote.minimumJobApplied)}</p>` : ""}
  </div>

  <div class="card">
    <div class="muted">Adders detail</div>
    ${addersHtml}
  </div>

  <div class="card">
    <div class="muted">Assumptions & Exclusions</div>
    <ul>
      <li>Quote assumes standard access and prep. Surface condition may affect final price.</li>
      <li>Thermal-stress risk on unknown/low‑e/aged IGUs must be reviewed before install.</li>
      <li>Permit/engineering not included unless explicitly listed.</li>
    </ul>
  </div>
</body>
</html>`;
}

export function listQuotesForLead(leadId) {
  const db = Store.loadDb();
  return db.quotes.filter((q) => q.leadId === leadId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getQuoteById(id) {
  const db = Store.loadDb();
  return db.quotes.find((q) => q.id === id) ?? null;
}

export function generateBallparkQuoteForLead(leadId, input) {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  const settings = getSettings();
  const measuredSqft = input?.measuredSqft ?? lead.sqftEstimate ?? null;
  const complexity = input?.complexity ?? "simple";

  const range = computeBallparkRange({ settings, lead, measuredSqft, complexity });
  if (range.error) return { error: range.error };

  const quote = {
    id: newId("quote"),
    leadId,
    createdAt: nowIso(),
    kind: "ballpark",
    inputs: { measuredSqft, complexity },
    outputs: {
      range,
      text: buildBallparkText({ lead, range })
    }
  };

  const db = Store.loadDb();
  db.quotes.push(quote);
  Store.saveDb(db);

  patchLead(leadId, {
    status: lead.status === "NEW" ? "QUOTED" : lead.status,
    history: [
      ...(lead.history ?? []),
      { at: nowIso(), type: "QUOTE_CREATED", by: "system", detail: { kind: "ballpark", quoteId: quote.id } }
    ]
  });

  return quote;
}

export function generateProposalForLead(leadId, input) {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  const settings = getSettings();
  const measuredSqft = input?.measuredSqft ?? lead.sqftEstimate ?? null;
  const complexity = input?.complexity ?? "simple";
  const grossMarginTier = input?.grossMarginTier ?? "better";
  const includeRemoval = input?.includeRemoval ?? null;

  const computed = computeQuote({ settings, lead, measuredSqft, complexity, grossMarginTier, includeRemoval });
  if (computed.error) return { error: computed.error };

  const proposalHtml = buildProposalHtml({ lead, quote: computed });
  const quote = {
    id: newId("quote"),
    leadId,
    createdAt: nowIso(),
    kind: "proposal",
    inputs: { measuredSqft, complexity, grossMarginTier, includeRemoval },
    outputs: {
      computed,
      proposalHtml
    }
  };

  const db = Store.loadDb();
  db.quotes.push(quote);
  Store.saveDb(db);

  patchLead(leadId, {
    status: lead.status === "NEW" ? "QUOTED" : lead.status,
    history: [
      ...(lead.history ?? []),
      { at: nowIso(), type: "PROPOSAL_CREATED", by: "system", detail: { quoteId: quote.id } }
    ]
  });

  return quote;
}

