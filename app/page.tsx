'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { CockpitDeck } from '@/components/CockpitDeck';
import { Runway } from '@/components/Runway';
import { RoutinePlayerModal } from '@/components/RoutinePlayerModal';
import { InputStreamPanel } from '@/components/InputStreamPanel';
import { MissionsPanel } from '@/components/MissionsPanel';
import { ActivityLedgerPanel } from '@/components/ActivityLedgerPanel';
import { IntegrationsModal } from '@/components/IntegrationsModal';
import { MobileNavBar } from '@/components/MobileNavBar';
import {
  INITIAL_ACTION_CARDS,
  INITIAL_ROUTINES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_NORTH_STARS,
  INITIAL_MISSIONS,
} from '@/lib/mockData';
import { ActionCard, Routine, RoutineStep, RawInputItem, ActivityLedgerEntry } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';
import { storage, UserIntegrationsConfig } from '@/lib/storage';

export default function LifeOSApp() {
  const [currentView, setCurrentView] = useState<'cockpit' | 'input' | 'missions' | 'ledger'>('cockpit');
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);

  // Persistent States
  const [cards, setCards] = useState<ActionCard[]>(INITIAL_ACTION_CARDS);
  const [rawInputs, setRawInputs] = useState<RawInputItem[]>([]);
  const [routines, setRoutines] = useState<Routine[]>(INITIAL_ROUTINES);
  const [activityLedger, setActivityLedger] = useState<ActivityLedgerEntry[]>([]);
  const [config, setConfig] = useState<UserIntegrationsConfig>({
    googleConnected: false,
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappRecipientPhone: '',
    geminiApiKey: '',
  });

  const [calendarEvents] = useState(INITIAL_CALENDAR_EVENTS);
  const [northStars] = useState(INITIAL_NORTH_STARS);
  const [missions] = useState(INITIAL_MISSIONS);

  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load from Storage & handle Google OAuth URL redirects on mount
  useEffect(() => {
    setCards(storage.getCards());
    setRawInputs(storage.getInputs());
    setRoutines(storage.getRoutines());
    setActivityLedger(storage.getLedger());
    setEmergencyMode(storage.getEmergency());
    const storedConfig = storage.getConfig();

    // Check for Google OAuth callback params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('google_connected') === 'true') {
        const email = params.get('google_email') || 'Connected Account';
        const token = params.get('access_token') || '';
        const updated = {
          ...storedConfig,
          googleConnected: true,
          googleEmail: email,
          googleAccessToken: token,
        };
        storage.setConfig(updated);
        setConfig(updated);
        showToast(`Google Account Linked: ${email}`);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('google_error')) {
        showToast(`Google Auth Failed: ${params.get('google_error')}`);
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        setConfig(storedConfig);
      }
    }
  }, []);

  // Sync state mutations to storage
  const updateCards = (newCards: ActionCard[]) => {
    setCards(newCards);
    storage.setCards(newCards);
  };

  const updateInputs = (newInputs: RawInputItem[]) => {
    setRawInputs(newInputs);
    storage.setInputs(newInputs);
  };

  const updateRoutines = (newRoutines: Routine[]) => {
    setRoutines(newRoutines);
    storage.setRoutines(newRoutines);
  };

  const updateLedger = (newLedger: ActivityLedgerEntry[]) => {
    setActivityLedger(newLedger);
    storage.setLedger(newLedger);
  };

  // Toggle Emergency / Sick Mode
  const handleToggleEmergency = () => {
    const next = !emergencyMode;
    setEmergencyMode(next);
    storage.setEmergency(next);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: next ? 'SICK_SHIELD_ACTIVATED' : 'SICK_SHIELD_DEACTIVATED',
      cardTitle: next ? 'Emergency Sick Shield Active' : 'Shield Stood Down',
      categoryLabel: '🛡️ PROTOCOL',
      details: next
        ? 'Quarantined non-essential action cards. Streaks frozen with SICK_DAY_PAUSE.'
        : 'Restored all quarantined tasks to Cockpit deck with zero data loss.',
      actor: 'User (Principal)',
      streakStatus: next ? 'SICK_DAY_PAUSE' : 'COMPLETED',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast(next ? '🚨 Emergency Shield Active: Non-essentials quarantined.' : 'Shield Deactivated: All tasks restored.');
  };

  // 1. APPROVE & EXECUTE (Real API Dispatches)
  const handleApproveCard = async (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark card approved
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'approved' as const } : c));
    updateCards(updated);

    // If Google connected, dispatch real Google Task
    if (config.googleConnected && config.googleAccessToken) {
      try {
        await fetch('/api/integrations/google/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: card.headline,
            notes: card.synthesis,
            accessToken: config.googleAccessToken,
          }),
        });
      } catch (e) {
        console.warn('Google Task dispatch error', e);
      }
    }

    // If WhatsApp configured, dispatch real WhatsApp alert
    if (config.whatsappPhoneNumberId && config.whatsappAccessToken && config.whatsappRecipientPhone) {
      try {
        await fetch('/api/integrations/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumberId: config.whatsappPhoneNumberId,
            accessToken: config.whatsappAccessToken,
            recipientPhone: config.whatsappRecipientPhone,
            messageText: `🚀 LifeOS Approved: ${card.headline}`,
          }),
        });
      } catch (e) {
        console.warn('WhatsApp alert error', e);
      }
    }

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'EXECUTE',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Executed by Chief of Staff. Target: ${card.targetEntity || 'System'}.`,
      actor: 'Executive Chief of Staff',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast(`🚀 Dispatched: "${card.headline.slice(0, 36)}..."`);
  };

  // 2. SNOOZE / DEFER
  const handleSnoozeCard = (card: ActionCard, deferLabel: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'snoozed' as const, wakeAt: deferLabel } : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'SNOOZE',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Deferred to: ${deferLabel}. Removed from deck.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast(`🕒 Snoozed until ${deferLabel}`);
  };

  // 3. QUICK CRITIQUE RE-DRAFT
  const handleCritiqueUpdate = (updatedCard: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'CRITIQUE_REDRAFT',
      cardTitle: updatedCard.headline,
      categoryLabel: updatedCard.categoryLabel,
      details: `Re-drafted in place based on voice critique.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast('✨ Critique applied: Card re-drafted in place.');
  };

  // 4. SAVE TO DRAFTS
  const handleSaveToDrafts = (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'drafted' as const } : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'DRAFT_SAVED',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Saved to native drafts. Agent control released.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast('📥 Saved to Drafts.');
  };

  // 5. KILL MISSION
  const handleKillMission = (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'killed' as const } : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'KILLED',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Rejected permanently.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast('🗑️ Card Killed.');
  };

  // Routine Step Update
  const handleUpdateRoutineSteps = (routineId: string, steps: RoutineStep[]) => {
    const updated = routines.map((r) => (r.id === routineId ? { ...r, steps } : r));
    updateRoutines(updated);
  };

  // Ingestion from Voice / Dropzone / Scratchpad
  const handleAddNewInput = (input: RawInputItem, resultingCard?: ActionCard) => {
    const newInputs = [input, ...rawInputs];
    updateInputs(newInputs);

    if (resultingCard) {
      const newCards = [resultingCard, ...cards];
      updateCards(newCards);
      showToast(`🎯 Directive formulated into Cockpit card`);
    } else {
      showToast('📥 Directive logged into raw history feed.');
    }
  };

  const handleResetDemoCards = () => {
    updateCards(INITIAL_ACTION_CARDS);
    showToast('🔄 Demo cards restored.');
  };

  const pendingCards = cards.filter((c) => c.status === 'pending');
  const quarantinedCount = pendingCards.filter((c) => !c.isKeystone).length;
  const keystoneCount = pendingCards.filter((c) => c.isKeystone).length;
  const visibleCardCount = emergencyMode ? keystoneCount : pendingCards.length;

  const activeRoutine = routines.find((r) => r.isActiveNow) || routines[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white pb-20 md:pb-12">
      {/* Top Bar Header */}
      <TopBar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        emergencyMode={emergencyMode}
        onToggleEmergency={handleToggleEmergency}
        pendingCardCount={visibleCardCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isGoogleConnected={config.googleConnected}
      />

      {/* Emergency / Sick Shield Warning */}
      <EmergencyBanner
        active={emergencyMode}
        onStandDown={handleToggleEmergency}
        quarantinedCount={quarantinedCount}
        keystoneCount={keystoneCount}
      />

      {/* Main View Area (Mobile-First, Simplified) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5">
        {/* COCKPIT VIEW */}
        {currentView === 'cockpit' && (
          <div className="space-y-5 animate-fade-in">
            <CockpitDeck
              cards={cards}
              emergencyMode={emergencyMode}
              onApprove={handleApproveCard}
              onSnooze={handleSnoozeCard}
              onCritiqueUpdate={handleCritiqueUpdate}
              onSaveToDrafts={handleSaveToDrafts}
              onKillMission={handleKillMission}
              onResetDemoCards={handleResetDemoCards}
            />

            <Runway
              activeRoutine={activeRoutine}
              allRoutines={routines}
              calendarEvents={calendarEvents}
              northStars={northStars}
              emergencyMode={emergencyMode}
              onOpenRoutine={(routine) => setSelectedRoutine(routine)}
            />
          </div>
        )}

        {/* INPUT STREAM VIEW */}
        {currentView === 'input' && (
          <div className="animate-fade-in">
            <InputStreamPanel
              inputs={rawInputs}
              onAddNewInput={handleAddNewInput}
              onNavigateToCard={() => setCurrentView('cockpit')}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        )}

        {/* MISSIONS VIEW */}
        {currentView === 'missions' && (
          <div className="animate-fade-in">
            <MissionsPanel
              missions={missions}
              northStars={northStars}
              onNavigateToCockpit={() => setCurrentView('cockpit')}
            />
          </div>
        )}

        {/* LEDGER VIEW */}
        {currentView === 'ledger' && (
          <div className="animate-fade-in">
            <ActivityLedgerPanel
              entries={activityLedger}
              emergencyMode={emergencyMode}
            />
          </div>
        )}
      </main>

      {/* Sticky Bottom Navigation on Mobile */}
      <MobileNavBar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        pendingCount={visibleCardCount}
      />

      {/* Routine Player Modal */}
      <RoutinePlayerModal
        routine={selectedRoutine}
        isOpen={Boolean(selectedRoutine)}
        emergencyMode={emergencyMode}
        onClose={() => setSelectedRoutine(null)}
        onUpdateRoutineSteps={handleUpdateRoutineSteps}
      />

      {/* Connected Accounts Modal (Google OAuth, WhatsApp, Gemini Key) */}
      <IntegrationsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={(cfg) => setConfig(cfg)}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <aside aria-label="Notification" className="fixed bottom-16 md:bottom-6 right-4 md:right-6 z-50 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl text-xs font-semibold text-white flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </aside>
      )}
    </div>
  );
}
