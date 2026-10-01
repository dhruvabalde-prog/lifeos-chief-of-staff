'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { ApprovalsViewportDeck } from '@/components/ApprovalsViewportDeck';
import { ChatboxHomepage } from '@/components/ChatboxHomepage';
import { OperationsView } from '@/components/OperationsView';
import { RoutinePlayerModal } from '@/components/RoutinePlayerModal';
import { ConnectModal } from '@/components/ConnectModal';
import { LedgerModal } from '@/components/LedgerModal';
import { MobileNavBar, MainViewTab } from '@/components/MobileNavBar';
import {
  INITIAL_ACTION_CARDS,
  INITIAL_ROUTINES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_NORTH_STARS,
  INITIAL_MISSIONS,
} from '@/lib/mockData';
import { ActionCard, Routine, RoutineStep, ActivityLedgerEntry } from '@/types/lifeos';
import { storage, UserIntegrationsConfig } from '@/lib/storage';

export default function LifeOSApp() {
  // Centre page is homepage, a chatbox
  const [currentView, setCurrentView] = useState<MainViewTab>('chat');
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);

  // Persistent States
  const [cards, setCards] = useState<ActionCard[]>(INITIAL_ACTION_CARDS);
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

  // Spawn Card from Chatbox or Voice Directive
  const handleSpawnCard = (newCard: ActionCard) => {
    const updated = [newCard, ...cards];
    updateCards(updated);
    showToast(`🎯 Formulated Cockpit Card: "${newCard.headline.slice(0, 24)}..."`);
  };

  const handleResetDemoCards = () => {
    updateCards(INITIAL_ACTION_CARDS);
    showToast('🔄 Demo cards restored.');
  };

  const pendingCards = cards.filter((c) => c.status === 'pending');
  const quarantinedCount = pendingCards.filter((c) => !c.isKeystone).length;
  const keystoneCount = pendingCards.filter((c) => c.isKeystone).length;
  const visibleCardCount = emergencyMode ? keystoneCount : pendingCards.length;

  return (
    <div className="h-dvh flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* 1. TOP BAR HEADER (Shield Icon Only + Settings Dropdown) */}
      <div className="shrink-0">
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
      </div>

      {/* 2. MAIN VIEW AREA (Fills exact viewport space above footer) */}
      <main className="flex-1 min-h-0 overflow-hidden px-3 sm:px-4 pt-2 pb-16">
        {/* VIEW 1: APPROVALS (Single card fits full viewport, zero scroll, auto swipe up) */}
        {currentView === 'approvals' && (
          <div className="h-full w-full animate-fade-in">
            <ApprovalsViewportDeck
              cards={cards}
              emergencyMode={emergencyMode}
              onApprove={handleApproveCard}
              onSnooze={handleSnoozeCard}
              onCritiqueUpdate={handleCritiqueUpdate}
              onSaveToDrafts={handleSaveToDrafts}
              onKillMission={handleKillMission}
              onResetDemoCards={handleResetDemoCards}
            />
          </div>
        )}

        {/* VIEW 2: STAFF / CHATBOX (Centre page is homepage, input bar locked above footer) */}
        {currentView === 'chat' && (
          <div className="h-full w-full animate-fade-in">
            <ChatboxHomepage
              onSpawnCard={handleSpawnCard}
              onNavigateToApprovals={() => setCurrentView('approvals')}
            />
          </div>
        )}

        {/* VIEW 3: OPERATIONS (Tasks, Routines, Calendar, North Stars, Goals with top scrollable pill filters) */}
        {currentView === 'operations' && (
          <div className="h-full w-full animate-fade-in">
            <OperationsView
              routines={routines}
              calendarEvents={calendarEvents}
              northStars={northStars}
              missions={missions}
              cards={cards}
              emergencyMode={emergencyMode}
              onOpenRoutine={(routine) => setSelectedRoutine(routine)}
              onApproveCard={handleApproveCard}
              onSpawnCard={handleSpawnCard}
              onNavigateToApprovals={() => setCurrentView('approvals')}
            />
          </div>
        )}
      </main>

      {/* 3. STICKY BOTTOM NAVIGATION (3 Tabs: Approvals, Staff/Home, Operations) */}
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
        <aside aria-label="Notification" className="fixed bottom-20 md:bottom-16 right-4 md:right-6 z-50 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl text-xs font-semibold text-white flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </aside>
      )}
    </div>
  );
}
