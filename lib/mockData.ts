import { ActionCard, Routine, CalendarEvent, NorthStarItem, Mission, RawInputItem, ActivityLedgerEntry } from '@/types/lifeos';
import { generateWaveformData } from './audio';
import { LIFE_SKILLS_CATALOG } from './skillsCatalog';

export const INITIAL_ACTION_CARDS: ActionCard[] = [
  // 1. Family Emergency & SOS Sentinel (Pillar 1) - Keystone
  {
    id: 'card-1-emergency-sos',
    category: 'protocols',
    categoryLabel: '🛡️ EMERGENCY DOSSIER',
    sourceContext: 'Triggered by Family Emergency & SOS Sentinel Protocol',
    headline: 'Emergency Medical Dossier Ready for Rapid Cashless Admission',
    synthesis: 'Sum Insured: ₹25,00,000 (HDFC ERGO Optima Secure). TPA Desk Hotline: 1800-2666-400. Blood Groups: A+ (Self), B+ (Spouse), O+ (Father). Preferred Network Hospital: Apollo Hospital Jubilee Hills.',
    urgency: 'critical',
    isKeystone: true,
    status: 'pending',
    createdAt: '2026-10-01T08:15:00Z',
    targetEntity: 'Apollo Hospital TPA Desk / Emergency Network',
    targetArtifact: 'Google Drive (/LifeOS/Health/Emergency_Dossier.pdf) & Google Keep',
    googleService: 'Google Drive',
    pillarName: 'HEALTH, EMERGENCY & CLINICAL VAULT',
    skillId: 'skill-1-emergency-sos',
    previewType: 'document',
    previewData: {
      docTitle: 'Family Emergency & Cashless TPA Medical Dossier',
      sections: [
        { title: 'Primary Policy', content: 'HDFC ERGO Optima Secure #2819-8921-992. Sum Insured: ₹25 Lakhs + 100% Secure Bonus.' },
        { title: 'Preferred Network Hospitals', content: '1. Apollo Hospital (1.8 km) - Cashless Empanelled\n2. Manipal Hospital (4.2 km) - Cashless Empanelled' },
        { title: 'Emergency Contacts', content: 'Dr. R. K. Sharma (Family Physician): +91 98490 12345\nTPA 24x7 Cashless Desk: 1800-2666-400 (Member ID: HDF-99214)' },
        { title: 'Critical Patient Notes', content: 'Father: Allergic to Penicillin. Diabetic (Metformin 500mg).' },
      ],
    },
  },

  // 2. Family Clinical & Health Vault (Pillar 1) - Keystone
  {
    id: 'card-2-clinical-vault',
    category: 'protocols',
    categoryLabel: '🩺 CLINICAL VAULT',
    sourceContext: 'Extracted from Apollo Diagnostics Blood Report PDF (08:45 AM)',
    headline: 'Diagnostic Report Extracted: Comprehensive Lipid Profile & HbA1c',
    synthesis: 'Biomarkers parsed: Total Cholesterol: 195 mg/dL (Normal <200), LDL: 112 mg/dL (Optimal), HbA1c: 5.6% (Non-diabetic range). Filed under Father profile. Next retest scheduled in 6 months.',
    urgency: 'high',
    isKeystone: true,
    status: 'pending',
    createdAt: '2026-10-01T08:50:00Z',
    targetEntity: 'Father Health Profile (Google Sheets)',
    targetArtifact: 'Google Sheets (Health_Biomarkers_Ledger) + Google Drive',
    googleService: 'Google Sheets',
    pillarName: 'HEALTH, EMERGENCY & CLINICAL VAULT',
    skillId: 'skill-2-clinical-vault',
    previewType: 'document',
    previewData: {
      docTitle: 'Diagnostic Lab Extraction: Apollo Diagnostics',
      sections: [
        { title: 'Extracted Values', content: '• Total Cholesterol: 195 mg/dL (Normal)\n• HDL: 48 mg/dL (Optimal)\n• LDL: 112 mg/dL (Borderline Normal)\n• Triglycerides: 142 mg/dL (Normal <150)\n• HbA1c: 5.6% (Normal)' },
        { title: 'Clinical Recommendation', content: 'Values show 8% improvement in triglycerides compared to Q1 2026 ledger. Continue low-glycemic dietary regimen.' },
      ],
    },
  },

  // 3. Family Wealth, Budget & Tax Desk (Pillar 3)
  {
    id: 'card-7-wealth-tax',
    category: 'lifeops',
    categoryLabel: '💰 WEALTH & TAX DESK',
    sourceContext: 'Extracted from HDFC Life Insurance Premium Receipt PDF',
    headline: 'Term Life Premium Logged (₹12,500): Section 80C Deduction Updated',
    synthesis: '₹12,500 premium mapped to Section 80C deduction tracker. Cumulative 80C utilized: ₹1,12,500 / ₹1,50,000 max. Receipt backed up in Google Drive Tax Folder (/LifeOS/Taxes/FY2026-27/).',
    urgency: 'medium',
    isKeystone: false,
    status: 'pending',
    createdAt: '2026-10-01T09:00:00Z',
    targetEntity: 'Tax Deduction Ledger & Google Drive',
    targetArtifact: 'Google Sheets (Household_Cashflow_Master)',
    googleService: 'Google Sheets',
    pillarName: 'HOUSEHOLD WEALTH, TAXES & SMART SAVINGS',
    skillId: 'skill-7-wealth-tax',
    previewType: 'invoice',
    previewData: {
      vendor: 'HDFC Life Click 2 Protect 3D Plus',
      invoiceNumber: 'POL-882190-26',
      amount: '₹12,500.00',
      dueDate: 'Paid (Annual Mode)',
      lineItems: [
        { desc: 'Pure Term Life Sum Assured ₹2.5 Crore', amount: '₹10,593.22' },
        { desc: '18% GST (Tax Eligible)', amount: '₹1,906.78' },
      ],
    },
  },

  // 4. Domestic Staff & Home Ops Manager (Pillar 4) - Keystone
  {
    id: 'card-11-domestic-staff',
    category: 'lifeops',
    categoryLabel: '🧹 STAFF OPS LEDGER',
    sourceContext: 'Monthly Payroll Audit: Ramesh (Cook) & Kamla (Maid)',
    headline: 'Approve End-of-Month Staff Salary Settlement: Ramesh (₹6,000) & Kamla (₹4,500)',
    synthesis: 'Calculations: Ramesh (Cook): Base ₹8,000 - ₹2,000 Cash Advance (Logged Oct 14) = Net Payable ₹6,000. Kamla (Maid): Base ₹4,500 - 0 leaves = Net Payable ₹4,500. Ready for 1-tap UPI disbursement.',
    urgency: 'high',
    isKeystone: true,
    status: 'pending',
    createdAt: '2026-10-01T09:05:00Z',
    targetEntity: 'Domestic Staff Ledger & UPI Dispatch',
    targetArtifact: 'Google Sheets (Domestic_Staff_Ledger)',
    googleService: 'Google Sheets',
    pillarName: 'HOME OPS, DOMESTIC STAFF & MOBILITY',
    skillId: 'skill-11-domestic-staff',
    previewType: 'invoice',
    previewData: {
      vendor: 'Domestic Staff Payroll (October 2026)',
      invoiceNumber: 'STAFF-PAY-2026-10',
      amount: '₹10,500.00 Total',
      dueDate: 'Last day of month',
      lineItems: [
        { desc: 'Ramesh (Cook) Net Salary [₹8k base - ₹2k advance]', amount: '₹6,000.00' },
        { desc: 'Kamla (Maid) Net Salary [Full Attendance]', amount: '₹4,500.00' },
      ],
    },
  },

  // 5. Vehicle Care & Mobility Desk (Pillar 4) - Keystone
  {
    id: 'card-12-vehicle-mobility',
    category: 'protocols',
    categoryLabel: '🚗 MOBILITY DESK',
    sourceContext: 'Automated Compliance Monitor: PUC Certificate Expiry Alert',
    headline: 'Renew PUC Emission Certificate for Honda City (DL-10-XX-0000) Expiring in 8 Days',
    synthesis: 'Statutory PUC certificate expires on Oct 9. Failure to renew invites ₹10,000 penalty under MV Act §190(2). Nearest certified testing center is Indian Oil Station (800m away). Pre-blocked Saturday 10:00 AM on Google Calendar.',
    urgency: 'high',
    isKeystone: true,
    status: 'pending',
    createdAt: '2026-10-01T09:10:00Z',
    targetEntity: 'RTO Compliance / Vehicle Ledger',
    targetArtifact: 'Google Calendar (Renewal events) + Google Sheets',
    googleService: 'Google Calendar',
    pillarName: 'HOME OPS, DOMESTIC STAFF & MOBILITY',
    skillId: 'skill-12-vehicle-mobility',
    previewType: 'document',
    previewData: {
      docTitle: 'Vehicle Compliance Spec',
      sections: [
        { title: 'Vehicle Identification', content: 'Honda City ZX (DL-10-XX-0000). Chasis Ending: 9482.' },
        { title: 'Expiration Date', content: 'October 9, 2026 (8 days remaining).' },
        { title: 'Recommended Action', content: '10-minute drive-through test at IOCL Petrol Pump, Main Avenue. Saturday 10 AM hold added to calendar.' },
      ],
    },
  },

  // 6. Sovereign KYC & ID Vault (Pillar 5) - Keystone
  {
    id: 'card-14-kyc-id-vault',
    category: 'protocols',
    categoryLabel: '🪪 IDENTITY VAULT',
    sourceContext: 'Multimodal OCR from uploaded Indian Passport photo',
    headline: 'Passport Cataloged to Secure Vault: Expiry August 2031 (Valid 5 Years)',
    synthesis: 'Passport ending in 8492 successfully OCR-parsed and encrypted. Extracted: Name: Principal Executive, DOB: 14/08/1988, Place of Issue: New Delhi. Saved to encrypted folder in Google Drive. 6-month pre-expiry reminder scheduled.',
    urgency: 'medium',
    isKeystone: true,
    status: 'pending',
    createdAt: '2026-10-01T09:15:00Z',
    targetEntity: 'Encrypted Sovereign Identity Vault',
    targetArtifact: 'Google Drive (/LifeOS/Identity_Vault/)',
    googleService: 'Google Drive',
    pillarName: 'SOVEREIGN IDENTITY, DOCUMENTS & LEGAL ESTATE',
    skillId: 'skill-14-kyc-id-vault',
    previewType: 'document',
    previewData: {
      docTitle: 'Encrypted Identity Index: Passport',
      sections: [
        { title: 'Document Number', content: 'Z-••••-8492 (Valid through Aug 2031)' },
        { title: 'Biographical Accuracy', content: 'Name and DOB match connected PAN and Aadhaar records perfectly.' },
        { title: 'Storage Encryption', content: 'Stored in Google Drive /LifeOS/Identity_Vault/ with zero-knowledge metadata indexing.' },
      ],
    },
  },

  // 7. Single Daily North Star Filter (Pillar 6) - Keystone
  {
    id: 'card-16-daily-north-star',
    category: 'lifeops',
    categoryLabel: '🎯 NORTH STAR FILTER',
    sourceContext: 'Morning Cron (6:00 AM) Algorithm Evaluation',
    headline: 'Commit Today’s 2 High-Leverage North Stars to Daily Runway',
    synthesis: 'Backlog filtered from 24 items down to 2 essential needle-movers: 1. Finalize driving license test booking; 2. Settle quarterly advance tax. All secondary administrative noise quarantined.',
    urgency: 'high',
    isKeystone: true,
    status: 'pending',
    createdAt: '2026-10-01T06:00:00Z',
    targetEntity: 'Today’s Runway Execution Queue',
    targetArtifact: 'Google Tasks (Starred daily tasks)',
    googleService: 'Google Tasks',
    pillarName: 'FOCUS, ENERGY & DAILY CADENCE',
    skillId: 'skill-16-daily-north-star',
    previewType: 'document',
    previewData: {
      docTitle: 'Today’s Sovereign North Stars',
      sections: [
        { title: 'North Star #1 (S-Tier)', content: 'Finalize driving license test booking at RTO South (Unlocks personal mobility independence).' },
        { title: 'North Star #2 (A-Tier)', content: 'Settle Q3 advance tax installment before 5 PM statutory deadline to avoid interest penalties.' },
      ],
    },
  },

  // 8. Family Relationships & Social Calendar (Pillar 7)
  {
    id: 'card-20-social-calendar',
    category: 'responses',
    categoryLabel: '🎂 SOCIAL MILESTONE',
    sourceContext: 'Automated Family Milestone Monitor: 6 Days Remaining',
    headline: 'Mother’s 62nd Birthday in 6 Days (Oct 7): Dinner Reservation & Gift Plan',
    synthesis: 'Past preference notes indicate Mother appreciates handwoven silk stoles or dinner at ITC Gardenia. Suggested plan: Pre-reserve table for 4 at 7:30 PM and order Kashmiri Kani shawl from curated boutique.',
    urgency: 'high',
    isKeystone: false,
    status: 'pending',
    createdAt: '2026-10-01T09:20:00Z',
    targetEntity: 'Family Milestone Calendar',
    targetArtifact: 'Google Calendar (Annual recurring events)',
    googleService: 'Google Calendar',
    pillarName: 'FAMILY RELATIONSHIPS & SOCIAL MILESTONES',
    skillId: 'skill-20-social-calendar',
    previewType: 'document',
    previewData: {
      docTitle: 'Milestone Celebration Plan',
      sections: [
        { title: 'Event Details', content: 'Mother’s Birthday: October 7, 2026 (Annual recurring event).' },
        { title: 'Gift Notes', content: 'Past Favorites: Handwoven silk stoles, Ayurvedic wellness sets, hardbound historical fiction.' },
        { title: 'Calendar Hold', content: 'Block family dinner Wednesday Oct 7 at 7:30 PM.' },
      ],
    },
  },

  // 9. Gifts & Festive Sales Arbitrageur (Pillar 7)
  {
    id: 'card-21-festive-sales',
    category: 'lifeops',
    categoryLabel: '🪔 FESTIVE ARBITRAGE',
    sourceContext: 'Seasonal Festival Pre-Planning Cron (4 Weeks Before Diwali)',
    headline: 'Activate Festive Gifting Runway: 8 Family Gifts Mapped to Mega Sale Window',
    synthesis: 'Great Indian Festival & Big Billion Days active this week. Pre-mapped 8 family gifts (Dry fruit hampers, silver coins, electronics) to leverage 10% instant card discounts, saving estimated ₹14,200 on festive budget.',
    urgency: 'high',
    isKeystone: false,
    status: 'pending',
    createdAt: '2026-10-01T09:25:00Z',
    targetEntity: 'Festive Gifting Ledger',
    targetArtifact: 'Google Sheets (Festive_Gifting_Ledger)',
    googleService: 'Google Sheets',
    pillarName: 'FAMILY RELATIONSHIPS & SOCIAL MILESTONES',
    skillId: 'skill-21-festive-sales',
    previewType: 'invoice',
    previewData: {
      vendor: 'Festive Gifting Master Plan (Diwali 2026)',
      invoiceNumber: 'FESTIVE-GIFT-2026',
      amount: '₹38,500.00 Budget (Estimated Savings: ₹14,200)',
      dueDate: 'Optimal Order Window: Oct 3 - Oct 8',
      lineItems: [
        { desc: 'Artisanal Organic Dry Fruit Gift Boxes (x6)', amount: '₹14,400.00' },
        { desc: '999 Pure Silver Laxmi-Ganesh Coins (x2)', amount: '₹8,600.00' },
        { desc: 'Smart Tablet for Parents (With HDFC instant 10% off)', amount: '₹15,500.00' },
      ],
    },
  },

  // 10. Executive Strategy Directive
  {
    id: 'card-apex-counter',
    category: 'responses',
    categoryLabel: '📧 GMAIL RESPONSE',
    sourceContext: 'Synthesized from voice directive via WhatsApp Audio',
    headline: 'Send Term Sheet counter-proposal to Apex Capital ($18M cap valuation & pro-rata clause)',
    synthesis: 'Email maintains respectful executive posture, counters with $18M post-money valuation cap based on 280% YoY ARR growth, preserves 15% ESOP pool, and requests 48-hour extension.',
    urgency: 'high',
    isKeystone: false,
    status: 'pending',
    createdAt: '2026-10-01T09:30:00Z',
    targetEntity: 'Mark Vance (Apex Capital)',
    targetArtifact: 'Google Docs (Drafted Counter Term Sheet)',
    googleService: 'Google Docs',
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
    id: 'routine-friction-breaker',
    name: '10-Minute Friction Breaker Sprint',
    window: 'On-Demand Focus',
    totalMinutes: 10,
    mode: 'Sequential',
    markdownSpec: `# ROUTINE SPEC
Window: Any Time | Total: 10m | Mode: Sequential
[ ] 01. Define Singular Micro-Action (01m) *KEYSTONE*
[ ] 02. Put Smartphone in Another Room (01m)
[ ] 03. Uninterrupted 8-Minute Sprint (08m) *KEYSTONE*`,
    steps: [
      { index: 1, title: 'Define Singular Micro-Action', durationMinutes: 1, isKeystone: true, completed: false },
      { index: 2, title: 'Put Smartphone in Another Room', durationMinutes: 1, isKeystone: false, completed: false },
      { index: 3, title: 'Uninterrupted 8-Minute Sprint (Free to stop at bell)', durationMinutes: 8, isKeystone: true, completed: false },
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
      { index: 3, title: 'Deep Execution Block 1 (High Leverage)', durationMinutes: 45, isKeystone: false, completed: false },
      { index: 4, title: 'Micro-Walk & Visual Distance Reset', durationMinutes: 5, isKeystone: false, completed: false },
      { index: 5, title: 'Deep Execution Block 2 (Strategy Synthesis)', durationMinutes: 30, isKeystone: false, completed: false },
    ],
  },
  {
    id: 'routine-evening',
    name: 'Evening Shutdown & Digital Sunset',
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
      { index: 3, title: 'Journal 3 Wins & Clear Open Loops', durationMinutes: 5, isKeystone: false, completed: false },
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
    title: 'Annual Dental & Eye Screening Cadence',
    timeRange: 'Saturday, 11:00 AM - 12:30 PM',
    countdownMinutes: 2880,
    location: 'Smile Dental Clinic',
    isHighImpact: false,
  },
  {
    id: 'cal-3',
    title: 'PUC Emission Test Drive-Through',
    timeRange: 'Saturday, 10:00 AM - 10:30 AM',
    countdownMinutes: 2820,
    location: 'Indian Oil Center',
    isHighImpact: true,
  },
];

export const INITIAL_NORTH_STARS: NorthStarItem[] = [
  {
    id: 'ns-1',
    missionId: 'mission-1',
    title: 'Finalize Driving License Test Booking & RTO Compliance',
    targetMetric: 'Slot Confirmed at RTO South',
    currentProgress: 85,
    leverageScore: 'S-Tier',
  },
  {
    id: 'ns-2',
    missionId: 'mission-2',
    title: 'Settle Advance Tax Installment & Section 80C Receipts',
    targetMetric: 'Zero Statutory Interest & 100% 80C Utilization',
    currentProgress: 90,
    leverageScore: 'S-Tier',
  },
  {
    id: 'ns-3',
    missionId: 'mission-3',
    title: 'Maintain Deep Sleep > 1h 45m & Zero Missed Keystone Meds',
    targetMetric: '14-Day Perfect Keystone Streak',
    currentProgress: 94,
    leverageScore: 'A-Tier',
  },
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'mission-1',
    title: 'Sovereign Operations: Zero Administrative Friction',
    category: 'Personal Ops',
    deadline: 'Oct 31, 2026',
    progressPercent: 82,
    status: 'active',
    northStars: ['Finalize Driving License Test Booking & RTO Compliance'],
    description: 'Automate household payroll, vehicle certificates, and identity document indexing via Google Workspace adapters.',
  },
  {
    id: 'mission-2',
    title: 'Executive Biology & Clinical Longevity',
    category: 'Health',
    deadline: 'Dec 31, 2026',
    progressPercent: 89,
    status: 'active',
    northStars: ['Maintain Deep Sleep > 1h 45m & Zero Missed Keystone Meds'],
    description: 'Ensure biological stamina outlasts professional demands. Keystone morning/evening routines and strict emergency dossiers.',
  },
  {
    id: 'mission-3',
    title: 'Family Wealth, Asset Allocation & Tax Fortress',
    category: 'Finances',
    deadline: 'March 31, 2027',
    progressPercent: 74,
    status: 'active',
    northStars: ['Settle Advance Tax Installment & Section 80C Receipts'],
    description: 'Max out Section 80C/80D tax deductions, automate SIP rebalancing, and arbitrate card perk discounts.',
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
    resultingCardId: 'card-apex-counter',
  },
  {
    id: 'raw-2',
    type: 'document',
    title: 'PDF Upload: Apollo Diagnostics Lipid Panel',
    content: 'Extracted Total Cholesterol 195 mg/dL, Triglycerides 142 mg/dL, HbA1c 5.6%. Filed under Father clinical profile.',
    timestamp: '08:45 AM',
    status: 'processed',
    fileMeta: {
      name: 'Apollo_Diagnostics_Blood_Panel_Oct2026.pdf',
      size: '1.4 MB',
      mimeType: 'application/pdf',
    },
    resultingCardId: 'card-2-clinical-vault',
  },
];

export const INITIAL_ACTIVITY_LEDGER: ActivityLedgerEntry[] = [
  {
    id: 'act-1',
    timestamp: '09:30 AM',
    actionType: 'EXECUTE',
    cardTitle: 'Family Emergency Dossier Verified',
    categoryLabel: '🛡️ PROTOCOL',
    details: 'Auto-indexed cashless TPA card with Apollo Hospital emergency desk.',
    actor: 'Executive Chief of Staff',
    streakStatus: 'COMPLETED',
  },
  {
    id: 'act-2',
    timestamp: '08:45 AM',
    actionType: 'EXECUTE',
    cardTitle: 'Clinical Biomarker Trending Logged',
    categoryLabel: '🩺 CLINICAL',
    details: 'Logged Total Cholesterol (195 mg/dL) & HbA1c (5.6%) in Health_Biomarkers_Ledger.',
    actor: 'Executive Chief of Staff',
    streakStatus: 'COMPLETED',
  },
  {
    id: 'act-3',
    timestamp: '07:30 AM',
    actionType: 'ROUTINE_COMPLETED',
    cardTitle: 'Morning Executive Protocol Finished',
    categoryLabel: '⚡ ROUTINE',
    details: 'Completed all keystone medication and focus hydration steps.',
    actor: 'User (Principal)',
    streakStatus: 'COMPLETED',
  },
];
