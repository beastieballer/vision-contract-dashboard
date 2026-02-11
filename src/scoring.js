function hasAny(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

export function scoreLead(lead) {
  const reasons = [];
  let score = 0;

  if (hasAny(lead.contact?.phone) || hasAny(lead.contact?.email)) {
    score += 15;
    reasons.push("Contactable (phone/email).");
  } else {
    reasons.push("Missing contact details.");
  }

  if (hasAny(lead.location?.city) || hasAny(lead.location?.address)) {
    score += 10;
    reasons.push("Has location.");
  } else {
    reasons.push("Missing location (harder to schedule).");
  }

  const sqft = Number(lead.sqftEstimate);
  if (Number.isFinite(sqft) && sqft > 0) {
    score += Math.min(25, 5 + Math.log10(Math.max(10, sqft)) * 10);
    reasons.push("Has sqft estimate (can quote faster).");
  } else {
    reasons.push("No sqft estimate yet.");
  }

  const goalsCount = Array.isArray(lead.goals) ? lead.goals.length : 0;
  if (goalsCount >= 2) {
    score += 10;
    reasons.push("Clear goals.");
  } else if (goalsCount === 1) {
    score += 5;
    reasons.push("Some goals provided.");
  } else {
    reasons.push("Goals unknown.");
  }

  const glassKnown = lead.glass?.dualPane !== null || lead.glass?.lowE !== null;
  if (glassKnown) {
    score += 5;
    reasons.push("Some glass info provided.");
  } else {
    reasons.push("Glass type unknown (risk).");
  }

  const removal = lead.removalNeeded;
  if (removal === true) {
    score += 5;
    reasons.push("Removal needed (higher ticket).");
  }

  if (lead.jobType === "commercial") {
    score += 5;
    reasons.push("Commercial lead (typically larger value).");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const missingSqft = !(Number.isFinite(sqft) && sqft > 0);
  const nextBestAction = missingSqft
    ? "Schedule a quick measure (virtual or onsite) to lock scope."
    : "Send a ballpark quote + 2–3 film options, then book measure/installation.";

  return { score, reasons, nextBestAction };
}

