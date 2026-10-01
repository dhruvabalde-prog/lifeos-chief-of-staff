'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { CockpitDeck } from '@/components/CockpitDeck';
import { Runway } from '@/components/Runway';
import { RoutinePlayerModal } from '@/components/RoutinePlayerModal';
import { InputStreamPanel } from '@/components/InputStreamPanel';
import { MissionsPanel } from '@/components/MissionsPanel';
import { ConnectModal } from '@/components/ConnectModal';
import { LedgerModal } from '@/components/LedgerModal';
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
  const [currentView, setCurrentView] = useState<'cockpit' | 'input' | 'missions'>('cockpit');
  const [cockpitSubTab, setCockpitSubTab] = useState<'approvals' | 'runway'>('approvals');
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

  // Modals
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load from Storage
  useEffect(() => {
    setCards(storage.getCards());
    setRawInputs(storage.getInputs());
    setRoutines(storage.getRoutines());
    setActivityLedger(storage.getLedger());
    setEmergencyMode(storage.getEmergency());
    setConfig(storage.getConfig());
  }, []);

  // Sync mutations
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
        ? 'Quarantined non-essential tasks. Streaks frozen with SICK_DAY_PAUSE.'
        : 'Restored all quarantined tasks to deck with zero data loss.',
      actor: 'User (Principal)',
      streakStatus: next ? 'SICK_DAY_PAUSE' : 'COMPLETED',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast(next ? '🚨 Emergency Shield Active' : 'Shield Deactivated');
  };

  // 1. APPROVE & EXECUTE
  const handleApproveCard = async (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'approved' as const } : c));
    updateCards(updated);

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
    showToast(`🚀 Dispatched: "${card.headline.slice(0, 32)}..."`);
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
      details: `Deferred to: ${deferLabel}.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast(`🕒 Snoozed: ${deferLabel}`);
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
      details: `Saved to native drafts.`,
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
      showToast(`🎯 Formulated Cockpit Card`);
    } else {
      showToast('📥 Logged into Ingestion Feed');
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
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white pb-24 md:pb-12">
      {/* Top Bar Header (Shield Icon only + Settings Dropdown) */}
      <TopBar
        emergencyMode={emergencyMode}
        onToggleEmergency={handleToggleEmergency}
        onOpenLedger={() => setIsLedgerOpen(true)}
        onOpenConnect={() => setIsConnectOpen(true)}
        onResetDemo={handleResetDemoCards}
        isWhatsAppConnected={Boolean(config.whatsappRecipientPhone)}
        isGoogleConnected={Boolean(config.googleConnected)}
      />

      {/* Emergency / Sick Shield Warning */}
      <EmergencyBanner
        active={emergencyMode}
        onStandDown={handleToggleEmergency}
        quarantinedCount={quarantinedCount}
        keystoneCount={keystoneCount}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 py-3 space-y-4">
        {/* VIEW 1: COCKPIT */}
        {currentView === 'cockpit' && (
          <div className="space-y-4 animate-fade-in">
            {/* Cockpit Sub-Tab Switcher */}
            <div className="flex items-center justify-center">
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold w-full max-w-xs justify-center">
                <button
                  onClick={() => { soundManager.playTap(); setCockpitSubTab('approvals'); }}
                  className={`flex-1 py-1.5 px-3 rounded-xl transition text-center ${
                    cockpitSubTab === 'approvals' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Approvals ({visibleCardCount})
                </button>
                <button
                  onClick={() => { soundManager.playTap(); setCockpitSubTab('runway'); }}
                  className={`flex-1 py-1.5 px-3 rounded-xl transition text-center ${
                    cockpitSubTab === 'runway' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 Runway
                </button>
              </div>
            </div>

            {/* Sub-Page A: Single-Card Deck */}
            {cockpitSubTab === 'approvals' && (
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
            )}

            {/* Sub-Page B: Today's Runway */}
            {cockpitSubTab === 'runway' && (
              <Runway
                activeRoutine={activeRoutine}
                allRoutines={routines}
                calendarEvents={calendarEvents}
                northStars={northStars}
                emergencyMode={emergencyMode}
                onOpenRoutine={(routine) => setSelectedRoutine(routine)}
              />
            )}
          </div>
        )}

        {/* VIEW 2: DIRECT / INPUT STREAM */}
        {currentView === 'input' && (
          <div className="animate-fade-in">
            <InputStreamPanel
              inputs={rawInputs}
              onAddNewInput={handleAddNewInput}
              onNavigateToCard={() => {
                setCurrentView('cockpit');
                setCockpitSubTab('approvals');
              }}
            />
          </div>
        )}

        {/* VIEW 3: MISSIONS */}
        {currentView === 'missions' && (
          <div className="animate-fade-in">
            <MissionsPanel
              missions={missions}
              northStars={northStars}
            />
          </div>
        )}
      </main>

      {/* Sticky Bottom Navigation on Mobile (Only 3 Tabs) */}
      <MobileNavBar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
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

      {/* Connect Modal (WhatsApp Number & Google Login, Zero API keys) */}
      <ConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        config={config}
        onUpdateConfig={(cfg) => setConfig(cfg)}
        onShowToast={showToast}
      />

      {/* Ledger Modal (Accessed from Top Right Settings Dropdown) */}
      <LedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        entries={activityLedger}
        emergencyMode={emergencyMode}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <aside aria-label="Notification" className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl text-xs font-semibold text-white flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </aside>
      )}
    </div>
  );
}
