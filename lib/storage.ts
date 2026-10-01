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
  CARDS: 'lifeos_cards_v2',
  ROUTINES: 'lifeos_routines_v2',
  INPUTS: 'lifeos_inputs_v2',
  LEDGER: 'lifeos_ledger_v2',
  CONFIG: 'lifeos_config_v2',
  EMERGENCY: 'lifeos_emergency_mode_v2',
};

export const storage = {
  getCards(): ActionCard[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INPUTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
