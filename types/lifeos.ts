export type ActionCategory = 'responses' | 'artifacts' | 'protocols' | 'lifeops';

export type CardStatus = 'pending' | 'approved' | 'snoozed' | 'drafted' | 'killed';

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ActionCard {
  id: string;
  category: ActionCategory;
  categoryLabel: string; // e.g. "📧 GMAIL RESPONSE", "🛡️ INSURANCE PROTOCOL"
  sourceContext: string; // e.g. "Generated from morning voice memo (10:14 AM)"
  headline: string;
  synthesis: string;
  urgency: UrgencyLevel;
  isKeystone: boolean; // Immune to Emergency Shield quarantine
  status: CardStatus;
  createdAt: string;
  wakeAt?: string | null; // For snoozing
  targetEntity?: string; // e.g. "Acme Corp / Sarah Jenkins"
  previewType: 'email' | 'document' | 'invoice' | 'checklist' | 'data';
  previewData: {
    subject?: string;
    to?: string;
    body?: string;
    docTitle?: string;
    sections?: Array<{ title: string; content: string }>;
    invoiceNumber?: string;
    amount?: string;
    vendor?: string;
    dueDate?: string;
    lineItems?: Array<{ desc: string; amount: string }>;
    rawMarkdown?: string;
  };
  critiqueHistory?: Array<{ timestamp: string; critique: string; priorSynthesis: string }>;
}

export type RawInputType = 'voice' | 'document' | 'image' | 'scratchpad' | 'whatsapp';
export type RawInputStatus = 'processing' | 'processed' | 'approval_pending';

export interface RawInputItem {
  id: string;
  type: RawInputType;
  title: string;
  content: string; // Transcribed text or note
  timestamp: string;
  status: RawInputStatus;
  durationSeconds?: number;
  audioBlobUrl?: string;
  audioWaveformData?: number[];
  fileMeta?: {
    name: string;
    size: string;
    mimeType: string;
    thumbnailUrl?: string;
  };
  resultingCardId?: string;
}

export interface RoutineStep {
  index: number;
  title: string;
  durationMinutes: number;
  isKeystone: boolean;
  completed: boolean;
}

export interface Routine {
  id: string;
  name: string;
  window: string; // e.g. "07:00 - 09:00"
  totalMinutes: number;
  mode: 'Time-Windowed' | 'Sequential' | 'Freeform';
  markdownSpec: string;
  steps: RoutineStep[];
  isActiveNow?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  timeRange: string;
  countdownMinutes: number;
  location?: string;
  meetLink?: string;
  attendees?: string[];
  isHighImpact: boolean;
}

export interface NorthStarItem {
  id: string;
  missionId: string;
  title: string;
  targetMetric: string;
  currentProgress: number; // 0-100
  leverageScore: 'S-Tier' | 'A-Tier';
}

export interface Mission {
  id: string;
  title: string;
  category: 'Business' | 'Health' | 'Personal Ops' | 'Finances';
  deadline: string;
  progressPercent: number;
  status: 'active' | 'paused' | 'completed';
  northStars: string[];
  description: string;
}

export type HabitStreakStatus = 'COMPLETED' | 'PENDING' | 'SICK_DAY_PAUSE' | 'MISSED';

export interface ActivityLedgerEntry {
  id: string;
  timestamp: string;
  actionType: 'EXECUTE' | 'SNOOZE' | 'CRITIQUE_REDRAFT' | 'DRAFT_SAVED' | 'KILLED' | 'SICK_SHIELD_ACTIVATED' | 'SICK_SHIELD_DEACTIVATED' | 'ROUTINE_COMPLETED';
  cardTitle: string;
  categoryLabel?: string;
  details: string;
  actor: 'Executive Chief of Staff' | 'User (Principal)';
  streakStatus?: HabitStreakStatus;
}
