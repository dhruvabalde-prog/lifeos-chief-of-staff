import { ActionCard, Routine, CalendarEvent, NorthStarItem, Mission, RawInputItem, ActivityLedgerEntry } from '@/types/lifeos';
import { generateWaveformData } from './audio';

export const INITIAL_ACTION_CARDS: ActionCard[] = [
  {
    id: 'card-1',
    category: 'responses',
    categoryLabel: '📧 GMAIL RESPONSE',
    sourceContext: 'Synthesized from voice directive (09:12 AM) via WhatsApp Audio',
    headline: 'Send Term Sheet counter-proposal to Apex Capital ($18M cap valuation & pro-rata clause)',
    synthesis: 'Your directive asked to counter Mark\'s valuation. This email maintains an executive respectful posture, stands firm on an $18M post-money cap, preserves your 15% ESOP pool, and requests a 48-hour signature extension.',
    urgency: 'high',
    isKeystone: false,
    status: 'pending',
    createdAt: '2026-10-01T09:15:00Z',
    targetEntity: 'Mark Vance (Apex Capital)',
    previewType: 'email',
    previewData: {
      to: 'mark.vance@apexcap.vc',
      subject: 'Re: Series A Term Sheet Discussion - Next Steps & Counter Terms',
      body: `Hi Mark,

Thank you for sending over the revised draft yesterday. We're excited about the prospect of partnering with Apex.

Following our internal strategy review, here are our two key alignment points:
1. Valuation Cap: We are moving forward at an $18M post-money cap, which accurately reflects our 280% YoY enterprise ARR growth.
2. Governance & Pro-Rata: We will preserve the standard major investor pro-rata rights while keeping board seats at 3 (2 Founders, 1 Apex designee).

Please review the attached marked-up draft. Could we schedule a 15-minute alignment call tomorrow at 11:30 AM EST?

Best regards,
Chief Executive Office`,
    },
  },
  {
    id: 'card-2',
    category: 'protocols',
    categoryLabel: '🛡️ INSURANCE PROTOCOL',
    sourceContext: 'Extracted from uploaded Hospital Pre-Authorization Letter PDF (08:45 AM)',
    headline: 'Submit Expedited Appeal for Spinal MRI Pre-Authorization with Physician Peer-to-Peer Request',
    synthesis: 'BlueCross initially rejected CPT 72148 due to missing physical therapy history documentation. LifeOS extracted prior PT records from Google Drive health folder and drafted the formal appeal letter quoting clinical necessity guidelines.',
    urgency: 'critical',
    isKeystone: true, // KEYSTONE: Visible during Emergency Shield
    status: 'pending',
    createdAt: '2026-10-01T08:50:00Z',
    targetEntity: 'BlueCross Appeals Board',
    previewType: 'document',
    previewData: {
      docTitle: 'Expedited Medical Necessity Appeal - CPT 72148',
      sections: [
        {
          title: 'Case Background & Diagnosis',
          content: 'Patient presents with severe lumbar radiculopathy unresponsive to 8 weeks conservative therapy (Documentation attached: PT Clinic Session Logs May-July 2026).',
        },
        {
          title: 'Clinical Justification & Regulatory Code',
          content: 'Under CMS Guidelines and State Insurance Mandate §442-B, MRI verification is urgent prior to neurosurgical consultation. Delay imposes substantial risk of neurological deterioration.',
        },
        {
          title: 'Requested Executive Action',
          content: 'Immediate peer-to-peer consultation scheduled with Dr. Aris Thorne (MD, Attending). LifeOS will fax documents upon approval.',
        },
      ],
    },
  },
  {
    id: 'card-3',
    category: 'artifacts',
    categoryLabel: '📄 CONTRACT REVIEW',
    sourceContext: 'Auto-ingested from Google Drive SLA renewals folder (07:30 AM)',
    headline: 'Approve Cloudflare Enterprise SLA Renewal with negotiated 14% discount & 99.999% uptime guarantee',
    synthesis: 'Legal and finance requirements met. Monthly commitment lowered from $4,200 to $3,610/mo with custom DDoS tier included. Termination for convenience clause retained.',
    urgency: 'medium',
    isKeystone: false,
    status: 'pending',
    createdAt: '2026-10-01T07:35:00Z',
    targetEntity: 'Cloudflare Enterprise Accounts',
    previewType: 'document',
    previewData: {
      docTitle: 'Executive Agreement Summary: Cloudflare Enterprise Renewal',
      sections: [
        {
          title: 'Key Terms',
          content: 'Annual contract: $43,320 (paid quarterly). Net 30 payment terms. Includes Bot Management and Zero Trust Access for 250 seats.',
        },
        {
          title: 'Redline Review',
          content: 'Clause 7.2 (Liability Cap) capped at 2x annual contract value (industry benchmark standard). IP indemnity verified.',
        },
      ],
    },
  },
  {
    id: 'card-4',
    category: 'lifeops',
    categoryLabel: '⚡ LIFE OPS LEDGER',
    sourceContext: 'Auto-scraped from Municipal Utility Portal e-billing alert',
    headline: 'Execute Municipal Property Tax & Water Utility Disbursement ($842.10) Before Cutoff Today',
    synthesis: 'Semi-annual property utility assessment due by 5:00 PM local time to avoid 10% statutory late penalty ($84.21). Scheduled for payment from Primary Checking via Silicon Valley Bank ACH adapter.',
    urgency: 'critical',
    isKeystone: true, // KEYSTONE: Visible during Emergency Shield
    status: 'pending',
    createdAt: '2026-10-01T06:10:00Z',
    targetEntity: 'City Utility & Tax Revenue Dept',
    previewType: 'invoice',
    previewData: {
      vendor: 'City Municipal Revenue Service',
      invoiceNumber: 'TAX-2026-9812A',
      amount: '$842.10',
      dueDate: 'Today, 5:00 PM',
      lineItems: [
        { desc: 'Municipal Clean Water Utility (Q3)', amount: '$218.40' },
        { desc: 'Property Improvement Assessment', amount: '$542.20' },
        { desc: 'Environmental Reclamation Fee', amount: '$81.50' },
      ],
    },
  },
  {
    id: 'card-5',
    category: 'responses',
    categoryLabel: '💬 CALENDAR RESCHEDULE',
    sourceContext: 'Synthesized from flight delay SMS alert & calendar conflict monitor',
    headline: 'Reschedule Q4 Product Strategy Review with Lead Architect from 4 PM to Tomorrow 10 AM',
    synthesis: 'Your inbound flight UA 442 is delayed 55 minutes. LifeOS drafted a quick courteous Slack message and calendar invite move to safeguard your arrival buffer.',
    urgency: 'medium',
    isKeystone: false,
    status: 'pending',
    createdAt: '2026-10-01T10:05:00Z',
    targetEntity: 'Elena Rostova (VP Engineering)',
    previewType: 'email',
    previewData: {
      to: 'elena@enterprise.io',
      subject: 'Reschedule: Q4 Product Architecture Review',
      body: `Elena, flight delayed by ~1 hour on the tarmac in Denver. Moving our 4 PM deep dive to tomorrow 10:00 AM to make sure I'm fully present and unhurried. Calendar update sent. Thanks for the flexibility!`,
    },
  },
];

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'routine-morning',
    name: 'Morning Executive Protocol',
    window: '07:00 - 09:00',
    totalMinutes: 45,
    mode: 'Time-Windowed',
    isActiveNow: true,
    markdownSpec: `# ROUTINE SPEC
Window: 07:00 - 09:00 | Total: 45m | Mode: Time-Windowed
[ ] 01. Hydrate & Lemon Water (05m)
[ ] 02. Bathroom & Fresh Up (10m)
[ ] 03. Morning Medication (02m) *KEYSTONE*
[ ] 04. Shower & Dress (15m)
[ ] 05. High-Protein Breakfast (13m)`,
    steps: [
      { index: 1, title: 'Hydrate & Lemon Water + Electrolytes', durationMinutes: 5, isKeystone: false, completed: true },
      { index: 2, title: 'Bathroom & Fresh Up', durationMinutes: 10, isKeystone: false, completed: true },
      { index: 3, title: 'Morning Medication & Supplements', durationMinutes: 2, isKeystone: true, completed: false },
      { index: 4, title: 'Cold Shower & Dress in Focus Attire', durationMinutes: 15, isKeystone: false, completed: false },
      { index: 5, title: 'High-Protein Breakfast & Green Tea', durationMinutes: 13, isKeystone: false, completed: false },
    ],
  },
  {
    id: 'routine-deepwork',
    name: 'Deep Work Launchpad',
    window: '09:30 - 11:30',
    totalMinutes: 90,
    mode: 'Sequential',
    markdownSpec: `# ROUTINE SPEC
Window: 09:30 - 11:30 | Total: 90m | Mode: Sequential
[ ] 01. Noise-Canceling & Phone Lockbox (05m)
[ ] 02. Review 1 North Star Objective (05m) *KEYSTONE*
[ ] 03. Deep Execution Block 1 (45m)
[ ] 04. Micro-Walk & Visual Reset (05m)
[ ] 05. Deep Execution Block 2 (30m)`,
    steps: [
      { index: 1, title: 'Noise-Canceling & Phone Lockbox', durationMinutes: 5, isKeystone: false, completed: false },
      { index: 2, title: 'Review 1 North Star Objective', durationMinutes: 5, isKeystone: true, completed: false },
      { index: 3, title: 'Deep Execution Block 1 (Apex Term Sheet)', durationMinutes: 45, isKeystone: false, completed: false },
      { index: 4, title: 'Micro-Walk & Visual Distance Reset', durationMinutes: 5, isKeystone: false, completed: false },
      { index: 5, title: 'Deep Execution Block 2 (Architecture Specs)', durationMinutes: 30, isKeystone: false, completed: false },
    ],
  },
  {
    id: 'routine-evening',
    name: 'Evening Shutdown & Recovery',
    window: '21:00 - 22:00',
    totalMinutes: 25,
    mode: 'Time-Windowed',
    markdownSpec: `# ROUTINE SPEC
Window: 21:00 - 22:00 | Total: 25m | Mode: Time-Windowed
[ ] 01. Close Browser Tabs & Clear Inbox Zero (10m)
[ ] 02. Night Medication & Magnesium (02m) *KEYSTONE*
[ ] 03. Journal 3 Wins of the Day (05m)
[ ] 04. Red Light & 10m Reading (08m)`,
    steps: [
      { index: 1, title: 'Close Browser Tabs & Clear Inbox Zero', durationMinutes: 10, isKeystone: false, completed: false },
      { index: 2, title: 'Night Medication & Magnesium Glycinate', durationMinutes: 2, isKeystone: true, completed: false },
      { index: 3, title: 'Journal 3 Wins of the Day', durationMinutes: 5, isKeystone: false, completed: false },
      { index: 4, title: 'Red Light On & 10m Non-Fiction Reading', durationMinutes: 8, isKeystone: false, completed: false },
    ],
  },
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Series A Final Allocation & Term Sheet Review',
    timeRange: '11:30 AM - 12:00 PM',
    countdownMinutes: 48,
    location: 'Google Meet',
    meetLink: 'https://meet.google.com/xyz-life-os',
    attendees: ['Mark Vance (Apex)', 'CFO Sarah Wu'],
    isHighImpact: true,
  },
  {
    id: 'cal-2',
    title: 'Architecture Sync: Offline Local LLM Latency',
    timeRange: '02:00 PM - 02:45 PM',
    countdownMinutes: 198,
    location: 'Zoom Conf Room 4',
    meetLink: 'https://zoom.us/j/99812488',
    attendees: ['Elena Rostova', 'DevOps Team'],
    isHighImpact: false,
  },
];

export const INITIAL_NORTH_STARS: NorthStarItem[] = [
  {
    id: 'ns-1',
    missionId: 'mission-1',
    title: 'Close $18M Val Series A Term Sheet with Apex Capital',
    targetMetric: 'Signed Term Sheet with ESOP 15%',
    currentProgress: 82,
    leverageScore: 'S-Tier',
  },
  {
    id: 'ns-2',
    missionId: 'mission-2',
    title: 'Maintain Deep Sleep > 1h 45m & Zero Missed Keystone Meds',
    targetMetric: '14-Day Perfect Keystone Streak',
    currentProgress: 94,
    leverageScore: 'S-Tier',
  },
  {
    id: 'ns-3',
    missionId: 'mission-3',
    title: 'Delegate 100% of Vendor Billing & Invoicing to LifeOS Staff',
    targetMetric: 'Zero Manual Bill Pay in 30 Days',
    currentProgress: 75,
    leverageScore: 'A-Tier',
  },
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'mission-1',
    title: 'Close Series A & Build 24-Month Operating Runway',
    category: 'Business',
    deadline: 'Oct 31, 2026',
    progressPercent: 78,
    status: 'active',
    northStars: ['Close $18M Val Series A Term Sheet with Apex Capital'],
    description: 'Secure premier venture backing, preserve founder control, and expand enterprise Chief of Staff software distribution.',
  },
  {
    id: 'mission-2',
    title: 'Executive Biology: Optimal HRV & Zero-Burnout Recovery',
    category: 'Health',
    deadline: 'Dec 31, 2026',
    progressPercent: 88,
    status: 'active',
    northStars: ['Maintain Deep Sleep > 1h 45m & Zero Missed Keystone Meds'],
    description: 'Ensure biological stamina outlasts professional demands. Keystone morning/evening routines and strict sleep shielding.',
  },
  {
    id: 'mission-3',
    title: 'Radical Delegation: Zero-Decision Personal Ops',
    category: 'Personal Ops',
    deadline: 'Nov 15, 2026',
    progressPercent: 70,
    status: 'active',
    northStars: ['Delegate 100% of Vendor Billing & Invoicing to LifeOS Staff'],
    description: 'Eliminate all administrative, home, and logistical friction. Executive focus dedicated entirely to high-leverage outcomes.',
  },
];

export const INITIAL_RAW_INPUTS: RawInputItem[] = [
  {
    id: 'raw-1',
    type: 'voice',
    title: 'Voice Directive: Apex Counter-Offer Terms',
    content: 'Tell Mark Vance at Apex we stand on eighteen million post money cap. Preserve pro-rata and fifteen percent option pool, request 48 hour extension for board sync.',
    timestamp: '09:12 AM',
    status: 'approval_pending',
    durationSeconds: 14,
    audioWaveformData: generateWaveformData(28),
    resultingCardId: 'card-1',
  },
  {
    id: 'raw-2',
    type: 'document',
    title: 'Hospital Pre-Authorization Denial Notice.pdf',
    content: 'Extracted PDF: BlueCross denial for CPT 72148 lumbar spine MRI. Generated expedited clinical appeal and scheduled doctor peer review.',
    timestamp: '08:45 AM',
    status: 'approval_pending',
    fileMeta: {
      name: 'Hospital_MRI_PreAuth_Denial_2026.pdf',
      size: '1.4 MB',
      mimeType: 'application/pdf',
    },
    resultingCardId: 'card-2',
  },
  {
    id: 'raw-3',
    type: 'whatsapp',
    title: 'WhatsApp Forward: Municipal Tax Assessment',
    content: 'Forwarded image of City Utility bill #TAX-2026-9812A. Amount $842.10 due today 5 PM to prevent 10% late fee penalty.',
    timestamp: '06:10 AM',
    status: 'approval_pending',
    fileMeta: {
      name: 'WhatsApp_Image_Tax_Bill.jpg',
      size: '640 KB',
      mimeType: 'image/jpeg',
    },
    resultingCardId: 'card-4',
  },
  {
    id: 'raw-4',
    type: 'scratchpad',
    title: 'Quick Scratchpad Note: Stripe vs Adyen Analysis',
    content: 'Review Stripe blended take rate (2.9% + 30c) vs Adyen interchange-plus pricing for our enterprise billing pilot.',
    timestamp: 'Yesterday 04:30 PM',
    status: 'processed',
  },
];

export const INITIAL_ACTIVITY_LEDGER: ActivityLedgerEntry[] = [
  {
    id: 'act-1',
    timestamp: '09:16 AM',
    actionType: 'ROUTINE_COMPLETED',
    cardTitle: 'Morning Routine: Steps 1 & 2 Completed',
    categoryLabel: '🔄 ROUTINE',
    details: 'Hydrate & Lemon Water + Bathroom Fresh Up checked off. Step 3 (Medication) pending.',
    actor: 'User (Principal)',
    streakStatus: 'COMPLETED',
  },
  {
    id: 'act-2',
    timestamp: '07:45 AM',
    actionType: 'EXECUTE',
    cardTitle: 'Wire Transfer Confirmation: Office Lease Q4 Deposit',
    categoryLabel: '⚡ LIFE OPS',
    details: 'Dispatched $12,500 wire confirmation to Building Management via SVB API adapter.',
    actor: 'Executive Chief of Staff',
  },
  {
    id: 'act-3',
    timestamp: 'Yesterday 06:20 PM',
    actionType: 'SNOOZE',
    cardTitle: 'Audit Gym Membership Corporate Group Rate',
    categoryLabel: '⚡ LIFE OPS',
    details: 'Deferred to Next Month. Wake-up trigger scheduled for Nov 01, 2026.',
    actor: 'User (Principal)',
  },
];
