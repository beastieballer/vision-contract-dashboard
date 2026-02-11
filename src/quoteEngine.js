function roundUp(value, increment) {
  if (!Number.isFinite(value)) return null;
  return Math.ceil(value / increment) * increment;
}

function money(n) {
  return Math.round(n * 100) / 100;
}

function coalesceNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function categoryToLaborBucket(filmCategory) {
  if (!filmCategory) return "solar";
  if (filmCategory.startsWith("decorative")) return "decorative";
  if (filmCategory.startsWith("safety")) return "safety";
  if (filmCategory.includes("graffiti")) return "anti_graffiti";
  return "solar";
}

export function computeQuote({
  settings,
  lead,
  measuredSqft,
  complexity = "simple",
  grossMarginTier = "better",
  includeRemoval = null
}) {
  const measured = coalesceNumber(measuredSqft ?? lead?.sqftEstimate, null);
  if (!measured || measured <= 0) {
    return { error: "missing_sqft" };
  }

  const waste = settings?.waste_factor?.[complexity] ?? settings?.waste_factor?.simple ?? 0.1;
  const billable = roundUp(measured * (1 + waste), 5);

  const filmType = lead?.filmCategory ?? "unsure";
  const materialPerSqft =
    settings?.material_per_sqft_by_type?.[filmType] ?? settings?.material_per_sqft_default ?? 1.1;

  const laborBucket = categoryToLaborBucket(filmType);
  const laborPerSqft = settings?.labor_per_sqft?.[laborBucket] ?? 5.0;

  const materialCost = billable * materialPerSqft;
  const laborCost = measured * laborPerSqft;

  const adders = [];
  if (lead?.jobType === "commercial" && settings?.adders?.coi_admin) {
    adders.push({ key: "coi_admin", label: "COI/Admin", amount: settings.adders.coi_admin });
  }

  const removalRequested =
    includeRemoval === null ? Boolean(lead?.removalNeeded) : Boolean(includeRemoval);
  if (removalRequested) {
    const removal = settings?.removal ?? {};
    const removalCalc = measured * (removal.per_sqft ?? 2.5);
    const removalAmount = Math.max(removal.minimum ?? 150, removalCalc);
    adders.push({ key: "removal", label: "Old film removal (est.)", amount: removalAmount });
  }

  const addersTotal = adders.reduce((sum, a) => sum + a.amount, 0);
  const subtotal = materialCost + laborCost + addersTotal;

  const targetGM = settings?.gross_margin_targets?.[grossMarginTier] ?? 0.5;
  const sellFromGM = subtotal / (1 - targetGM);

  const minJob =
    (lead?.jobType === "commercial"
      ? settings?.minimum_job?.commercial
      : settings?.minimum_job?.residential) ?? 0;

  const total = Math.max(minJob, sellFromGM);

  return {
    measuredSqft: money(measured),
    billableSqft: money(billable),
    wasteFactor: waste,
    filmType,
    laborBucket,
    rates: { materialPerSqft: money(materialPerSqft), laborPerSqft: money(laborPerSqft), targetGM },
    costs: {
      materialCost: money(materialCost),
      laborCost: money(laborCost),
      adders,
      subtotal: money(subtotal)
    },
    minimumJobApplied: total > sellFromGM ? money(minJob) : null,
    total: money(total)
  };
}

export function computeBallparkRange({ settings, lead, measuredSqft, complexity = "simple" }) {
  const low = computeQuote({
    settings,
    lead,
    measuredSqft,
    complexity,
    grossMarginTier: "good",
    includeRemoval: false
  });
  if (low.error) return low;

  const high = computeQuote({
    settings,
    lead,
    measuredSqft,
    complexity: complexity === "simple" ? "mixed" : "complex",
    grossMarginTier: "best",
    includeRemoval: lead?.removalNeeded ?? false
  });
  if (high.error) return high;

  const lowTotal = Math.min(low.total, high.total);
  const highTotal = Math.max(low.total, high.total);

  return {
    measuredSqft: low.measuredSqft,
    filmType: low.filmType,
    low: money(lowTotal),
    high: money(highTotal),
    assumptions: {
      complexity,
      removalIncludedInHigh: Boolean(lead?.removalNeeded),
      glassVerificationRequired: true
    }
  };
}

