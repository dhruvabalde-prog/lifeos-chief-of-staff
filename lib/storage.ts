import { ActionCard, Routine, RawInputItem, ActivityLedgerEntry } from '@/types/lifeos';
import {
  INITIAL_ACTION_CARDS,
  INITIAL_ROUTINES,
  INITIAL_RAW_INPUTS,
  INITIAL_ACTIVITY_LEDGER,
} from './mockData';

export interface UserIntegrationsConfig {
  googleConnected: boolean;
  googleEmail?: string;
  googleAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappRecipientPhone?: string;
  geminiApiKey?: string;
}

const STORAGE_KEYS = {
  CARDS: 'lifeos_cards_v1',
  ROUTINES: 'lifeos_routines_v1',
  INPUTS: 'lifeos_inputs_v1',
  LEDGER: 'lifeos_ledger_v1',
  CONFIG: 'lifeos_config_v1',
  EMERGENCY: 'lifeos_emergency_mode_v1',
};

export const storage = {
  getCards(): ActionCard[] {
    if (typeof window === 'undefined') return INITIAL_ACTION_CARDS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      return saved ? JSON.parse(saved) : INITIAL_ACTION_CARDS;
    } catch {
      return INITIAL_ACTION_CARDS;
    }
  },

  setCards(cards: ActionCard[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  },

  getRoutines(): Routine[] {
    if (typeof window === 'undefined') return INITIAL_ROUTINES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      return saved ? JSON.parse(saved) : INITIAL_ROUTINES;
    } catch {
      return INITIAL_ROUTINES;
    }
  },

  setRoutines(routines: Routine[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  },

  getInputs(): RawInputItem[] {
    if (typeof window === 'undefined') return INITIAL_RAW_INPUTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INPUTS);
      return saved ? JSON.parse(saved) : INITIAL_RAW_INPUTS;
    } catch {
      return INITIAL_RAW_INPUTS;
    }
  },

  setInputs(inputs: RawInputItem[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.INPUTS, JSON.stringify(inputs));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  },

  getLedger(): ActivityLedgerEntry[] {
    if (typeof window === 'undefined') return INITIAL_ACTIVITY_LEDGER;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LEDGER;
    } catch {
      return INITIAL_ACTIVITY_LEDGER;
    }
  },

  setLedger(ledger: ActivityLedgerEntry[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  },

  getConfig(): UserIntegrationsConfig {
    const defaults: UserIntegrationsConfig = {
      googleConnected: false,
      whatsappPhoneNumberId: '',
      whatsappAccessToken: '',
      whatsappRecipientPhone: '',
      geminiApiKey: '',
    };
    if (typeof window === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  },

  setConfig(config: UserIntegrationsConfig) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      if (config.geminiApiKey) {
        localStorage.setItem('GEMINI_API_KEY', config.geminiApiKey);
      }
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  },

  getEmergency(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.EMERGENCY) === 'true';
  },

  setEmergency(active: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, active ? 'true' : 'false');
  },
};
