const crewSchedule = {
  2:{jobs:[{name:'Job #2840 — Shower Enclosure',crew:'Team Bravo',loc:'Pikesville, MD'}]},
  3:{jobs:[{name:'Job #2841 — Storefront Repair',crew:'Team Alpha',loc:'Federal Hill, Baltimore'},{name:'Job #2842 — Mirror Install',crew:'Team Delta',loc:'Towson, MD'}]},
  4:{jobs:[{name:'Job #2843 — Window Measure',crew:'Team Echo',loc:'Columbia, MD'}]},
  5:{jobs:[{name:'Job #2844 — Curtain Wall',crew:'Team Alpha',loc:'Inner Harbor, Baltimore'},{name:'Job #2845 — Glass Partition',crew:'Team Foxtrot',loc:'Owings Mills, MD'}]},
  6:{jobs:[{name:'Job #2846 — Railing Install',crew:'Team Golf',loc:'Canton, Baltimore'}]},
  7:{jobs:[{name:'Job #2847 — Storefront Install',crew:'Team Alpha',loc:'Fells Point, Baltimore'},{name:'Job #2851 — Window Replacement',crew:'Team Bravo',loc:'Towson, MD'}]},
  8:{jobs:[{name:'Job #2847 — Storefront (Day 2)',crew:'Team Alpha',loc:'Fells Point, Baltimore'}]},
  10:{jobs:[{name:'Job #2848 — Office Glass Wall',crew:'Team Charlie',loc:'Hunt Valley, MD'},{name:'Job #2849 — Curtain Wall Repair',crew:'Team Delta',loc:'Inner Harbor, Baltimore'}]},
  11:{jobs:[{name:'Job #2849 — Curtain Wall (Day 2)',crew:'Team Delta',loc:'Inner Harbor, Baltimore'}]},
  12:{jobs:[{name:'Job #2850 — Skylight Repair',crew:'Team Echo',loc:'Ellicott City, MD'}]},
  13:{jobs:[{name:'Job #2851 — Window Replace (Day 2)',crew:'Team Bravo',loc:'Towson, MD'},{name:'Job #2852 — Emergency Board-Up',crew:'Team Golf',loc:'Dundalk, MD'}]},
  14:{jobs:[{name:'Job #2853 — Glass Railing',crew:'Team Alpha',loc:'Canton, Baltimore'}]},
  17:{jobs:[{name:'Job #2854 — Storefront Install',crew:'Team Bravo',loc:'White Marsh, MD'},{name:'Job #2855 — Partition Wall',crew:'Team Charlie',loc:'Timonium, MD'}]},
  18:{jobs:[{name:'Job #2854 — Storefront (Day 2)',crew:'Team Bravo',loc:'White Marsh, MD'}]},
  19:{jobs:[{name:'Job #2856 — Window Install',crew:'Team Delta',loc:'Catonsville, MD'},{name:'Job #2857 — Mirror Wall',crew:'Team Foxtrot',loc:'Lutherville, MD'}]},
  20:{jobs:[{name:'Job #2858 — Curtain Wall',crew:'Team Alpha',loc:'Harbor East, Baltimore'}]},
  21:{jobs:[{name:'Job #2858 — Curtain Wall (Day 2)',crew:'Team Alpha',loc:'Harbor East, Baltimore'},{name:'Job #2859 — Shower Glass',crew:'Team Echo',loc:'Bel Air, MD'}]},
  24:{jobs:[{name:'Job #2860 — Commercial Glazing',crew:'Team Alpha',loc:'BWI Area, MD'},{name:'Job #2861 — Storefront',crew:'Team Charlie',loc:'Annapolis, MD'}]},
  25:{jobs:[{name:'Job #2860 — Glazing (Day 2)',crew:'Team Alpha',loc:'BWI Area, MD'}]},
  26:{jobs:[{name:'Job #2862 — Window Retrofit',crew:'Team Delta',loc:'Severna Park, MD'}]},
  27:{jobs:[{name:'Job #2863 — Glass Canopy',crew:'Team Bravo',loc:'Inner Harbor, Baltimore'},{name:'Job #2864 — Partition',crew:'Team Golf',loc:'Reisterstown, MD'}]},
  28:{jobs:[{name:'Job #2863 — Canopy (Day 2)',crew:'Team Bravo',loc:'Inner Harbor, Baltimore'}]}
};

const scripts = {
  kpiRevenueBreakdown: {
    title: 'Revenue (MTD) — Category Breakdown',
    detail: `Commercial installs: $51,300\nResidential installs: $28,600\nService calls: $12,850\nChange orders: $18,400\nRepairs: $7,600\nOther: $8,700\nTotal: $127,450`
  },
  kpiRevenueBoost: {
    title: 'Revenue Boost Plan — Close $22,550 Gap',
    detail: `1. Pull forward 2 pending CO approvals ($7,900)\n2. Offer 5% fast-close on 3 bids ($6,200)\n3. Add 2 service-call routes this week ($4,250)\n4. Upsell low-E upgrades on 6 open quotes ($4,200)`
  },
  kpiJobsViewAll: {
    title: 'Active Jobs — Full List',
    detail: `#2847 Storefront Install — On site ($12,400)\n#2851 Window Replacement — On site ($8,700)\n#2858 Curtain Wall — On site ($22,400)\n#2862 Window Retrofit — Fabrication ($6,200)`
  },
  kpiJobsPriority: {
    title: 'Priority Jobs — Attention Needed',
    detail: `#2849 Curtain Wall Repair — labor overrun risk\n#2851 Window Replacement — access delays\n#2854 Storefront — material ETA risk\n#2858 Curtain Wall — crane window tight`
  },
  kpiCOReviewAll: {
    title: 'Change Orders — All 5',
    detail: `CO-142 Fells Point variance — $850\nCO-143 Canton Lofts low-E — $3,200\nCO-144 Harbor East add-on — $2,150\nCO-145 Towson remeasure — $1,100\nCO-148 BWI sealant spec — $2,100`
  },
  kpiCOUrgent: {
    title: 'Change Orders — Urgent Top 3',
    detail: `CO-143 Canton Lofts low-E — $3,200 (approval needed)\nCO-144 Harbor East add-on — $2,150 (fabrication hold)\nCO-148 BWI sealant spec — $2,100 (schedule risk)`
  },
  kpiCrewStatus: {
    title: 'Crew Utilization — Full Breakdown',
    detail: `Team Alpha — Harbor East (Active)\nTeam Bravo — Towson (Active)\nTeam Charlie — Staging (Idle 4.8 hrs)\nTeam Delta — Inner Harbor (Active)\nTeam Echo — Bel Air (Active)`
  },
  kpiCrewOptimize: {
    title: 'Crew Optimization Actions',
    detail: `1. Reassign Team Charlie to Towson by 10:30 AM\n2. Shift Team Echo install window to 2–4 PM\n3. Stage Team Golf at Dundalk for PM call\n4. Pre-position Team Alpha for Day 2 canopy`
  },
  coFellsPoint: {
    title: 'Fells Point Storefront — Change Order',
    call: `Hi [Client Name], this is [Your Name] from VISION CONTRACT calling about the Fells Point storefront project.

Our team was on-site this morning for final measurements, and we discovered a variance from the original quote. The opening width measures 84.5 inches, which is 2.5 inches wider than the 82 inches we quoted.

To ensure a proper fit and maintain the structural integrity, we'll need to fabricate custom glass panels to the correct dimensions. This will result in a change order of $850 for materials and additional fabrication time.

I wanted to reach out immediately so we can keep the project on schedule. Can we get your approval on this change order today? I can email you the formal documentation right now.

[Pause for response]

Great, I'll send that over within the next 10 minutes. Do you have any questions about the variance or the pricing?`,
    email: {
      subject: 'Change Order Required — Fells Point Storefront (Job #2847)',
      body: `Dear [Client Name],

Following our site visit this morning, we've identified a field measurement variance that requires a change order to proceed.

ISSUE DETAILS:
• Location: Fells Point Storefront Opening
• Quoted dimension: 82" width
• Actual field measurement: 84.5" width
• Variance: +2.5 inches

CHANGE ORDER AMOUNT: $850
• Additional materials: $520
• Custom fabrication: $330

IMPACT:
With approval today, we can maintain the current schedule with no delays.

Please reply to approve this change order, or call me directly at [phone].

Best regards,
[Your Name]
VISION CONTRACT`
    }
  },
  coCantonLofts: {
    title: 'Canton Lofts — Glass Spec Upgrade',
    call: `Hi [Client Name], this is [Your Name] from VISION CONTRACT regarding the Canton Lofts project.

We received a spec change request from your architect yesterday requesting an upgrade from standard clear glass to low-E insulated units for 12 windows.

This is actually a great upgrade for energy efficiency, but it does impact the pricing. The change order would be $3,200 for the upgraded glass units.

I wanted to confirm this change with you directly before we proceed. Did you authorize this upgrade with the architect?

[Pause for response]

Perfect. I'll prepare the formal change order documentation and email it to you within the hour.`,
    email: {
      subject: 'Spec Change Request — Canton Lofts Low-E Upgrade',
      body: `Dear [Client Name],

We received a specification change request from [Architect Name] for the Canton Lofts project.

REQUESTED CHANGE:
• Original spec: Standard clear glass
• New spec: Low-E insulated glass units
• Quantity affected: 12 windows

CHANGE ORDER AMOUNT: $3,200
• Material upgrade: $2,400
• Additional fabrication: $800

TIMELINE:
• Lead time: 10 days from approval
• No impact to completion date if approved by Feb 6

Best regards,
[Your Name]
VISION CONTRACT`
    }
  },
  invoiceJohnsHopkins: {
    title: 'Johns Hopkins — Overdue Invoice Collection',
    call: `Hi, this is [Your Name] from VISION CONTRACT. I'm calling regarding invoice #2847 for $18,400 that's now 45 days past due.

We completed the work on December 22nd, and the invoice was due January 5th. I wanted to reach out personally to see if there's an issue with the invoice or if we can arrange payment.

[Pause for response]

I understand. What I need from you today is a commitment on when we can expect payment. Can we schedule payment for this week?

[If they push back]

I appreciate that, but we've been very patient. This is now significantly past due. If we can't arrange payment this week, I'll need to escalate this to our collections department.

What works better for you — payment by Friday, or should I start the formal collections process?`,
    email: {
      subject: 'FINAL NOTICE — Invoice #2847 Past Due ($18,400)',
      body: `Dear Accounts Payable,

This is a final notice regarding Invoice #2847 in the amount of $18,400.

INVOICE DETAILS:
• Invoice #: 2847
• Amount: $18,400
• Original due date: January 5, 2026
• Days past due: 45 days

NEXT STEPS IF PAYMENT NOT RECEIVED BY FEBRUARY 10, 2026:
1. Account will be sent to collections agency
2. Mechanics lien will be filed on the property
3. Legal action will be initiated

Please remit payment immediately.

[Your Name]
VISION CONTRACT`
    }
  },
  laborOverrun: {
    title: 'Federal Hill — Labor Overrun Investigation',
    call: `Hi [Foreman Name], this is [Your Name]. I need to talk to you about the Federal Hill job.

I'm looking at the numbers, and we're showing a significant labor overrun. We budgeted 20 hours at $1,515, but the actual came in at 57.5 hours for $4,365. That's 188% over estimate — a $2,850 loss.

Can you walk me through what happened on that job?

[Listen to response]

Here's what I need from you:
1. A detailed breakdown of where those extra hours went
2. What could have been done differently
3. A plan to prevent this on future jobs

Can you get me that information by end of day tomorrow?`,
    email: null
  },
  crewCharlie: {
    title: 'Team Charlie — Dead Time Escalation',
    call: `Hi [Foreman Name], this is [Your Name]. I'm looking at today's crew utilization, and Team Charlie is showing 4.8 hours of idle time. That's 60% of the day.

What's going on?

[Listen to response]

I understand, but 4.8 hours is unacceptable. That's costing us $850 in lost productivity today alone.

Here's what needs to happen:
1. Get Team Charlie reassigned to Job #2851 in Towson immediately
2. Call me back in 30 minutes to confirm they're on-site
3. We need a plan to prevent this from happening again

Can you make that happen right now?`,
    email: null
  },
  materialDelay: {
    title: 'Cardinal Glass IGU Delay — Client Notification',
    call: `Hi [Client Name], this is [Your Name] from VISION CONTRACT. I'm calling about the Canton Lofts project.

Our supplier, Cardinal Glass, is experiencing a production delay. The insulated glass units are now delayed by 5 days — from February 6th to February 11th.

I wanted to let you know immediately so we can discuss options.

[Pause for response]

Here's what I recommend: We can still proceed with the frame installation as scheduled, and then come back to install the glass units when they arrive. This way we minimize the impact to your overall timeline.

Which option works better for you?`,
    email: {
      subject: 'Material Delay Notice — Canton Lofts Project',
      body: `Dear [Client Name],

I'm writing to inform you of a material delay affecting the Canton Lofts project.

DELAY DETAILS:
• Material: Cardinal Glass Insulated Units
• Original ETA: February 6, 2026
• New ETA: February 11, 2026
• Delay: 5 days

PROPOSED SOLUTION:
Option 1: Proceed with frame installation as scheduled, return for glass on Feb 11
Option 2: Reschedule entire installation to Feb 11

Please let me know which option you prefer.

Best regards,
[Your Name]
VISION CONTRACT`
    }
  }
};

const crewDetails = {
  alpha: {
    title: 'Team Alpha',
    status: 'Active',
    job: 'Job #2858 — Curtain Wall',
    location: 'Harbor East, Baltimore',
    members: ['Chris M. (Lead)', 'Dylan R.', 'Nate P.', 'Ava L.'],
    notes: 'On-site install. Glass delivery confirmed for 9:30 AM.'
  },
  bravo: {
    title: 'Team Bravo',
    status: 'Active',
    job: 'Job #2851 — Window Replacement',
    location: 'Towson, MD',
    members: ['Sam K. (Lead)', 'Priya S.', 'Marco T.'],
    notes: 'Second floor units complete. Waiting on client access for suite 210.'
  },
  charlie: {
    title: 'Team Charlie',
    status: 'Idle — 4.8 hrs',
    job: 'Reassignment Pending',
    location: 'Harbor East staging',
    members: ['Luis A. (Lead)', 'Jenna Q.', 'Ravi D.'],
    notes: 'Idle due to delayed site access. Reassign to Towson if no update by 10:30 AM.'
  },
  delta: {
    title: 'Team Delta',
    status: 'Active',
    job: 'Job #2849 — Curtain Wall Repair',
    location: 'Inner Harbor, Baltimore',
    members: ['Omar B. (Lead)', 'Kate W.', 'Paul N.'],
    notes: 'Day 2. Sealant cure time extended due to overnight cold.'
  },
  echo: {
    title: 'Team Echo',
    status: 'Active',
    job: 'Job #2859 — Shower Glass',
    location: 'Bel Air, MD',
    members: ['Noah J. (Lead)', 'Ella V.'],
    notes: 'Final measurements complete. Install window 2:00–4:00 PM.'
  },
  foxtrot: {
    title: 'Team Foxtrot',
    status: 'Active',
    job: 'Job #2857 — Mirror Wall',
    location: 'Lutherville, MD',
    members: ['Maya G. (Lead)', 'Ethan C.'],
    notes: 'Backing prep in progress. Adhesive ETA 11:00 AM.'
  },
  golf: {
    title: 'Team Golf',
    status: 'Active',
    job: 'Job #2852 — Emergency Board-Up',
    location: 'Dundalk, MD',
    members: ['Alex H. (Lead)', 'Tara F.'],
    notes: 'Urgent call. Expected completion by noon.'
  }
};

const WEATHER = {
  name: 'Baltimore, MD',
  latitude: 39.28944,
  longitude: -76.61528
};

const weatherCodeLabels = new Map([
  [0, 'Clear sky'],
  [1, 'Mainly clear'],
  [2, 'Partly cloudy'],
  [3, 'Overcast'],
  [45, 'Fog'],
  [48, 'Depositing rime fog'],
  [51, 'Light drizzle'],
  [53, 'Moderate drizzle'],
  [55, 'Dense drizzle'],
  [56, 'Light freezing drizzle'],
  [57, 'Dense freezing drizzle'],
  [61, 'Slight rain'],
  [63, 'Moderate rain'],
  [65, 'Heavy rain'],
  [66, 'Light freezing rain'],
  [67, 'Heavy freezing rain'],
  [71, 'Slight snow fall'],
  [73, 'Moderate snow fall'],
  [75, 'Heavy snow fall'],
  [77, 'Snow grains'],
  [80, 'Slight rain showers'],
  [81, 'Moderate rain showers'],
  [82, 'Violent rain showers'],
  [85, 'Slight snow showers'],
  [86, 'Heavy snow showers'],
  [95, 'Thunderstorm'],
  [96, 'Thunderstorm with slight hail'],
  [99, 'Thunderstorm with heavy hail']
]);

const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const modal = document.getElementById('scriptModal');
const modalBody = document.getElementById('modalBody');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const weatherModal = document.getElementById('weatherModal');
const weatherModalBody = document.getElementById('weatherModalBody');
const weatherModalTitle = document.getElementById('weatherModalTitle');
const closeWeatherModalBtn = document.getElementById('closeWeatherModalBtn');
const crewModal = document.getElementById('crewModal');
const crewModalBody = document.getElementById('crewModalBody');
const crewModalTitle = document.getElementById('crewModalTitle');
const closeCrewModalBtn = document.getElementById('closeCrewModalBtn');
let lastFocusedElement = null;
let weatherState = null;

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getTextByType(item, type) {
  if (!item) return '';
  if (type === 'call') return item.call || '';
  if (type === 'subject') return item.email?.subject || '';
  if (type === 'body') return item.email?.body || '';
  return '';
}

async function copyText(id, type, button) {
  const text = getTextByType(scripts[id], type);
  if (!text || !button) return;

  const original = button.textContent;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const fallback = document.createElement('textarea');
      fallback.value = text;
      fallback.setAttribute('readonly', '');
      fallback.style.position = 'absolute';
      fallback.style.left = '-9999px';
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand('copy');
      fallback.remove();
    }

    button.textContent = '✅ Copied!';
  } catch {
    button.textContent = '❌ Copy failed';
  }

  setTimeout(() => {
    button.textContent = original;
  }, 1500);
}

function openModal(id) {
  const item = scripts[id];
  if (!item) return;

  lastFocusedElement = document.activeElement;
  modalTitle.textContent = item.title;

  let html = '';
  if (item.detail) {
    html += `<div class="script-section"><h3>Details</h3><div class="script-content">${escapeHtml(item.detail)}</div></div>`;
  }
  if (item.call) {
    html += `<div class="script-section"><h3>📞 Phone Call Script</h3><div class="script-content">${escapeHtml(item.call)}</div><button class="copy-btn" type="button" data-copy-id="${id}" data-copy-type="call">📋 Copy Call Script</button></div>`;
  }
  if (item.email) {
    html += `<div class="script-section"><h3>✉️ Email Template</h3><div style="margin-bottom:12px"><strong style="color:var(--text-secondary)">Subject:</strong><div class="script-content">${escapeHtml(item.email.subject)}</div><button class="copy-btn" type="button" data-copy-id="${id}" data-copy-type="subject">📋 Copy Subject</button></div><div><strong style="color:var(--text-secondary)">Body:</strong><div class="script-content">${escapeHtml(item.email.body)}</div><button class="copy-btn" type="button" data-copy-id="${id}" data-copy-type="body">📋 Copy Email Body</button></div></div>`;
  }

  modalBody.innerHTML = html;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeModalBtn.focus();
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function openCrewModal(crewId) {
  const crew = crewDetails[crewId];
  if (!crew) return;

  lastFocusedElement = document.activeElement;
  crewModalTitle.textContent = crew.title;

  const members = crew.members.map((member) => `<li>${escapeHtml(member)}</li>`).join('');
  crewModalBody.innerHTML = `
    <div class="script-section">
      <h3>Status</h3>
      <div class="script-content">${escapeHtml(crew.status)}\n${escapeHtml(crew.job)}\n${escapeHtml(crew.location)}</div>
    </div>
    <div class="script-section">
      <h3>Members</h3>
      <div class="script-content"><ul>${members}</ul></div>
    </div>
    <div class="script-section">
      <h3>Notes</h3>
      <div class="script-content">${escapeHtml(crew.notes)}</div>
    </div>
  `;

  crewModal.classList.add('open');
  crewModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeCrewModalBtn.focus();
}

function closeCrewModal() {
  crewModal.classList.remove('open');
  crewModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function openWeatherModal(index) {
  if (!weatherState) return;
  const day = weatherState.days[index];
  if (!day) return;

  lastFocusedElement = document.activeElement;
  weatherModalTitle.textContent = `Forecast — ${day.label}`;
  weatherModalBody.innerHTML = `
    <div class="weather-detail-grid">
      <div class="weather-detail-item">
        <div class="weather-detail-label">Condition</div>
        <div class="weather-detail-value">${escapeHtml(day.condition)}</div>
      </div>
      <div class="weather-detail-item">
        <div class="weather-detail-label">High / Low</div>
        <div class="weather-detail-value">${day.high}°F / ${day.low}°F</div>
      </div>
      <div class="weather-detail-item">
        <div class="weather-detail-label">Precip Chance</div>
        <div class="weather-detail-value">${day.precipProbability}%</div>
      </div>
      <div class="weather-detail-item">
        <div class="weather-detail-label">Precip Total</div>
        <div class="weather-detail-value">${day.precipTotal} in</div>
      </div>
      <div class="weather-detail-item">
        <div class="weather-detail-label">Max Wind</div>
        <div class="weather-detail-value">${day.windMax} mph</div>
      </div>
      <div class="weather-detail-item">
        <div class="weather-detail-label">Sunrise / Sunset</div>
        <div class="weather-detail-value">${day.sunrise} / ${day.sunset}</div>
      </div>
    </div>
  `;

  weatherModal.classList.add('open');
  weatherModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeWeatherModalBtn.focus();
}

function closeWeatherModal() {
  weatherModal.classList.remove('open');
  weatherModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function trapFocus(event) {
  const activeModal = modal.classList.contains('open') ? modal : weatherModal.classList.contains('open') ? weatherModal : crewModal.classList.contains('open') ? crewModal : null;
  if (!activeModal || event.key !== 'Tab') return;

  const focusables = activeModal.querySelectorAll(focusableSelector);
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function buildCalendar() {
  const grid = document.getElementById('calendarGrid');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const viewYear = 2026;
  const viewMonth = 1;
  const startDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  const now = new Date();
  const isCurrentViewMonth = now.getFullYear() === viewYear && now.getMonth() === viewMonth;
  const today = isCurrentViewMonth ? now.getDate() : -1;

  grid.innerHTML = '';
  days.forEach((day) => {
    const headerCell = document.createElement('div');
    headerCell.className = 'cal-day-header';
    headerCell.textContent = day;
    grid.appendChild(headerCell);
  });

  for (let i = 0; i < startDay; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dayCell = document.createElement('div');
    const hasJob = crewSchedule[day];
    dayCell.className = `cal-day${hasJob ? ' has-job' : ''}${day === today ? ' today' : ''}`;

    let inner = `<span>${day}</span>`;
    if (hasJob) {
      const jobs = hasJob.jobs;
      inner += '<div class="cal-dots">';
      if (jobs.length === 1) {
        inner += '<span class="cal-dot single"></span>';
      } else {
        jobs.forEach((_, index) => {
          inner += `<span class="cal-dot ${index === 0 ? 'multi' : 'multi2'}"></span>`;
        });
      }
      inner += '</div>';

      inner += `<div class="cal-tooltip"><div class="tt-title">${jobs.length} Job${jobs.length > 1 ? 's' : ''} — Feb ${day}</div>`;
      jobs.forEach((job) => {
        inner += `<div class="tt-job"><div class="tt-job-name">${escapeHtml(job.name)}</div><div class="tt-crew">👷 ${escapeHtml(job.crew)}</div><div class="tt-loc">📍 ${escapeHtml(job.loc)}</div></div>`;
      });
      inner += '</div>';
    }

    dayCell.innerHTML = inner;
    grid.appendChild(dayCell);
  }
}

function formatWeatherLabel(code) {
  if (typeof code !== 'number') return 'Unknown';
  return weatherCodeLabels.get(code) || 'Unknown';
}

function getDayLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatMaybeNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return '--';
  return digits > 0 ? value.toFixed(digits) : Math.round(value);
}

function setWeatherError(message) {
  const tempEl = document.getElementById('weatherTemp');
  const condEl = document.getElementById('weatherCond');
  const updatedEl = document.getElementById('weatherUpdated');
  const forecastEl = document.getElementById('weatherForecast');

  tempEl.textContent = '--';
  condEl.textContent = message;
  condEl.classList.add('weather-error');
  updatedEl.textContent = 'Weather unavailable';
  forecastEl.innerHTML = '';
}

async function loadWeather() {
  const tempEl = document.getElementById('weatherTemp');
  const condEl = document.getElementById('weatherCond');
  const updatedEl = document.getElementById('weatherUpdated');
  const forecastEl = document.getElementById('weatherForecast');

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', WEATHER.latitude);
    url.searchParams.set('longitude', WEATHER.longitude);
    url.searchParams.set('current', 'temperature_2m,weather_code');
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,sunrise,sunset');
    url.searchParams.set('temperature_unit', 'fahrenheit');
    url.searchParams.set('wind_speed_unit', 'mph');
    url.searchParams.set('precipitation_unit', 'inch');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Weather request failed');
    const data = await response.json();

    const current = data.current || {};
    const currentTemp = current.temperature_2m;
    const currentCode = current.weather_code ?? current.weathercode;
    const currentTime = current.time;

    tempEl.textContent = Number.isFinite(currentTemp) ? `${Math.round(currentTemp)}°F` : '--';
    condEl.textContent = formatWeatherLabel(currentCode);
    condEl.classList.remove('weather-error');
    updatedEl.textContent = currentTime ? `Updated ${new Date(currentTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Updated recently';

    const daily = data.daily || {};
    const times = daily.time || [];
    const highs = daily.temperature_2m_max || [];
    const lows = daily.temperature_2m_min || [];
    const codes = daily.weather_code || daily.weathercode || [];
    const precipProb = daily.precipitation_probability_max || [];
    const precipSum = daily.precipitation_sum || [];
    const windMax = daily.wind_speed_10m_max || [];
    const sunrises = daily.sunrise || [];
    const sunsets = daily.sunset || [];

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const visibleIndexes = times.map((time, index) => ({ time, index })).filter(({ time }) => {
      const date = new Date(time);
      return date >= startOfToday;
    });

    const rows = visibleIndexes.map(({ time, index }) => {
      const label = getDayLabel(time);
      const high = highs[index];
      const low = lows[index];
      const code = codes[index];
      const temps = `${formatMaybeNumber(high)}° / ${formatMaybeNumber(low)}°`;
      return `<div class="weather-day" tabindex="0" role="button" aria-label="View forecast for ${label}" data-weather-index="${index}"><div><div class="weather-day-name">${label}</div><div class="weather-day-cond">${formatWeatherLabel(code)}</div></div><div class="weather-day-temps">${temps}</div></div>`;
    });

    weatherState = {
      days: times.map((time, index) => ({
        label: getDayLabel(time),
        condition: formatWeatherLabel(codes[index]),
        high: formatMaybeNumber(highs[index]),
        low: formatMaybeNumber(lows[index]),
        precipProbability: formatMaybeNumber(precipProb[index]),
        precipTotal: formatMaybeNumber(precipSum[index], 2),
        windMax: formatMaybeNumber(windMax[index]),
        sunrise: sunrises[index] ? new Date(sunrises[index]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--',
        sunset: sunsets[index] ? new Date(sunsets[index]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--'
      }))
    };

    forecastEl.innerHTML = rows.join('');
  } catch (error) {
    setWeatherError('Unable to load weather');
  }
}

function updateTimestamp() {
  const el = document.getElementById('timestamp');
  el.textContent = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function refreshData() {
  updateTimestamp();
  const button = document.getElementById('syncNowBtn');
  button.textContent = '✅ Synced';
  button.style.borderColor = 'var(--green)';
  button.style.color = 'var(--green)';

  setTimeout(() => {
    button.textContent = '⟳ Sync Now';
    button.style.borderColor = '';
    button.style.color = '';
  }, 2000);
}

function animateForecastBars() {
  const card = document.querySelector('.forecast-card');
  if (!card) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.fb-bar').forEach((bar) => {
        const target = bar.getAttribute('data-target');
        setTimeout(() => {
          bar.style.width = target;
        }, 200);
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  observer.observe(card);
}

document.addEventListener('click', (event) => {
  const actionTrigger = event.target.closest('[data-action]');
  if (actionTrigger) {
    openModal(actionTrigger.getAttribute('data-action'));
    return;
  }

  const crewTrigger = event.target.closest('[data-crew]');
  if (crewTrigger) {
    openCrewModal(crewTrigger.getAttribute('data-crew'));
    return;
  }

  const weatherTrigger = event.target.closest('[data-weather-index]');
  if (weatherTrigger) {
    openWeatherModal(Number(weatherTrigger.getAttribute('data-weather-index')));
    return;
  }

  const copyTrigger = event.target.closest('[data-copy-id]');
  if (copyTrigger) {
    copyText(copyTrigger.getAttribute('data-copy-id'), copyTrigger.getAttribute('data-copy-type'), copyTrigger);
    return;
  }

  if (event.target === modal) {
    closeModal();
  }

  if (event.target === weatherModal) {
    closeWeatherModal();
  }

  if (event.target === crewModal) {
    closeCrewModal();
  }
});

document.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.classList.contains('alert-item')) {
    event.preventDefault();
    openModal(event.target.getAttribute('data-action'));
  }

  if ((event.key === 'Enter' || event.key === ' ') && event.target.classList.contains('weather-day')) {
    event.preventDefault();
    openWeatherModal(Number(event.target.getAttribute('data-weather-index')));
  }

  if (event.key === 'Escape') {
    if (modal.classList.contains('open')) closeModal();
    if (weatherModal.classList.contains('open')) closeWeatherModal();
    if (crewModal.classList.contains('open')) closeCrewModal();
  }

  trapFocus(event);
});

document.getElementById('syncNowBtn').addEventListener('click', refreshData);
closeModalBtn.addEventListener('click', closeModal);
closeWeatherModalBtn.addEventListener('click', closeWeatherModal);
closeCrewModalBtn.addEventListener('click', closeCrewModal);

buildCalendar();
animateForecastBars();
updateTimestamp();
loadWeather();
setInterval(loadWeather, 30 * 60 * 1000);
setInterval(updateTimestamp, 60000);
