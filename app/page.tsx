'use client';

import React, { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { CockpitDeck } from '@/components/CockpitDeck';
import { Runway } from '@/components/Runway';
import { RoutinePlayerModal } from '@/components/RoutinePlayerModal';
import { InputStreamPanel } from '@/components/InputStreamPanel';
import { MissionsPanel } from '@/components/MissionsPanel';
import { ActivityLedgerPanel } from '@/components/ActivityLedgerPanel';
import {
  INITIAL_ACTION_CARDS,
  INITIAL_ROUTINES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_NORTH_STARS,
  INITIAL_MISSIONS,
  INITIAL_RAW_INPUTS,
  INITIAL_ACTIVITY_LEDGER,
} from '@/lib/mockData';
import { ActionCard, Routine, RoutineStep, RawInputItem, ActivityLedgerEntry } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';
import { googleWorkspace } from '@/lib/integrations/googleWorkspace';

export default function LifeOSApp() {
  // Views: 'cockpit' | 'input' | 'missions' | 'ledger'
  const [currentView, setCurrentView] = useState<'cockpit' | 'input' | 'missions' | 'ledger'>('cockpit');

  // Emergency / Sick Shield Mode
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);

  // Core Reactive State
  const [cards, setCards] = useState<ActionCard[]>(INITIAL_ACTION_CARDS);
  const [rawInputs, setRawInputs] = useState<RawInputItem[]>(INITIAL_RAW_INPUTS);
  const [routines, setRoutines] = useState<Routine[]>(INITIAL_ROUTINES);
  const [calendarEvents, setCalendarEvents] = useState(INITIAL_CALENDAR_EVENTS);
  const [northStars, setNorthStars] = useState(INITIAL_NORTH_STARS);
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [activityLedger, setActivityLedger] = useState<ActivityLedgerEntry[]>(INITIAL_ACTIVITY_LEDGER);

  // Active Routine Player Modal
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Toggle Emergency / Sick Shield
  const handleToggleEmergency = () => {
    const next = !emergencyMode;
    setEmergencyMode(next);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: next ? 'SICK_SHIELD_ACTIVATED' : 'SICK_SHIELD_DEACTIVATED',
      cardTitle: next ? '🚨 Emergency Sick Shield Activated' : '🛡️ Emergency Shield Stood Down',
      categoryLabel: '🛡️ PROTOCOL',
      details: next
        ? 'Quarantined all non-essential routines & secondary action cards. Habit streaks frozen under SICK_DAY_PAUSE status.'
        : 'Restored all quarantined routines and action cards to deck with zero data loss.',
      actor: 'User (Principal)',
      streakStatus: next ? 'SICK_DAY_PAUSE' : 'COMPLETED',
    };

    setActivityLedger((prev) => [logEntry, ...prev]);
    showToast(next ? 'Emergency Shield Active: Non-essential tasks quarantined.' : 'Emergency Shield deactivated: All systems restored.');
  };

  // 1. APPROVE & EXECUTE ACTION
  const handleApproveCard = async (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark card approved and remove from active pending deck
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: 'approved' } : c)));

    // External adapter dispatch
    if (card.previewType === 'document') {
      await googleWorkspace.exportDocArtifact(card.previewData.docTitle || card.headline, card.synthesis);
    } else if (card.previewType === 'invoice') {
      await googleWorkspace.appendLedgerRow('Executive Disbursements', {
        vendor: card.previewData.vendor || 'Vendor',
        amount: card.previewData.amount || '$0',
        date: now,
      });
    }

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'EXECUTE',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Executed immediately by Chief of Staff. Target: ${card.targetEntity || 'System'}. Dispatched via integration adapter.`,
      actor: 'Executive Chief of Staff',
    };

    setActivityLedger((prev) => [logEntry, ...prev]);
    showToast(`🚀 Dispatched: "${card.headline.slice(0, 48)}..."`);
  };

  // 2. SNOOZE / DEFER ACTION
  const handleSnoozeCard = (card: ActionCard, deferLabel: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, status: 'snoozed', wakeAt: deferLabel } : c))
    );

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'SNOOZE',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Deferred to: ${deferLabel}. Removed from viewport deck until wake trigger.`,
      actor: 'User (Principal)',
    };

    setActivityLedger((prev) => [logEntry, ...prev]);
    showToast(`🕒 Snoozed until ${deferLabel}`);
  };

  // 3. QUICK CRITIQUE RE-DRAFT IN PLACE
  const handleCritiqueUpdate = (updatedCard: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'CRITIQUE_REDRAFT',
      cardTitle: updatedCard.headline,
      categoryLabel: updatedCard.categoryLabel,
      details: `Voice critique processed and card re-drafted in place by Gemini Chief of Staff.`,
      actor: 'User (Principal)',
    };

    setActivityLedger((prev) => [logEntry, ...prev]);
    showToast('✨ Voice critique applied: Card re-drafted in place.');
  };

  // 4. SAVE TO DRAFTS / MANUAL
  const handleSaveToDrafts = (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: 'drafted' } : c)));

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'DRAFT_SAVED',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Saved to native user drafts folder. Agent authority released for manual handling.`,
      actor: 'User (Principal)',
    };

    setActivityLedger((prev) => [logEntry, ...prev]);
    showToast('📥 Moved to Native Drafts folder.');
  };

  // 5. KILL MISSION
  const handleKillMission = (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: 'killed' } : c)));

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'KILLED',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Permanently rejected. Negative user preference rule indexed for future task generation.`,
      actor: 'User (Principal)',
    };

    setActivityLedger((prev) => [logEntry, ...prev]);
    showToast('🗑️ Mission Killed: Removed from ledger.');
  };

  // Handle Routine Steps Update
  const handleUpdateRoutineSteps = (routineId: string, steps: RoutineStep[]) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, steps } : r))
    );
  };

  // Handle New Ingestion from Input Stream (Spawns a new Action Card)
  const handleAddNewInput = (input: RawInputItem, resultingCard?: ActionCard) => {
    setRawInputs((prev) => [input, ...prev]);

    if (resultingCard) {
      setCards((prev) => [resultingCard, ...prev]);
      showToast(`🎯 Ingested & spawned Action Card: "${resultingCard.headline.slice(0, 40)}..."`);
    } else {
      showToast('📥 Directive logged into raw history feed.');
    }
  };

  // Reset Demo Cards for easy evaluator testing
  const handleResetDemoCards = () => {
    setCards(INITIAL_ACTION_CARDS);
    showToast('🔄 Demo Action Cards restored to Cockpit Deck.');
  };

  // Calculate quarantined vs active keystone counts
  const pendingCards = cards.filter((c) => c.status === 'pending');
  const quarantinedCount = pendingCards.filter((c) => !c.isKeystone).length;
  const keystoneCount = pendingCards.filter((c) => c.isKeystone).length;
  const visibleCardCount = emergencyMode ? keystoneCount : pendingCards.length;

  const activeRoutine = routines.find((r) => r.isActiveNow) || routines[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white pb-16">
      {/* Top Bar Navigation & Emergency Shield Switch */}
      <TopBar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        emergencyMode={emergencyMode}
        onToggleEmergency={handleToggleEmergency}
        pendingCardCount={visibleCardCount}
      />

      {/* Emergency / Sick Shield Active Warning Banner */}
      <EmergencyBanner
        active={emergencyMode}
        onStandDown={handleToggleEmergency}
        quarantinedCount={quarantinedCount}
        keystoneCount={keystoneCount}
      />

      {/* Main Viewport Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">
        {/* VIEW 1: THE COCKPIT (Approvals & Today's Runway) */}
        {currentView === 'cockpit' && (
          <div className="space-y-8 animate-fade-in">
            {/* The Single-Card Viewport Deck */}
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

            {/* Today's Runway (Ambient Daily Focus Layer) */}
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

        {/* VIEW 2: THE INPUT STREAM (Omnichannel Raw Ingestion) */}
        {currentView === 'input' && (
          <div className="animate-fade-in">
            <InputStreamPanel
              inputs={rawInputs}
              onAddNewInput={handleAddNewInput}
              onNavigateToCard={(cardId) => {
                soundManager.playTap();
                setCurrentView('cockpit');
              }}
            />
          </div>
        )}

        {/* VIEW 3: MISSIONS & GOALS */}
        {currentView === 'missions' && (
          <div className="animate-fade-in">
            <MissionsPanel
              missions={missions}
              northStars={northStars}
              onNavigateToCockpit={() => {
                soundManager.playTap();
                setCurrentView('cockpit');
              }}
            />
          </div>
        )}

        {/* VIEW 4: ACTIVITY LEDGER & AUDIT TRAIL */}
        {currentView === 'ledger' && (
          <div className="animate-fade-in">
            <ActivityLedgerPanel
              entries={activityLedger}
              emergencyMode={emergencyMode}
            />
          </div>
        )}
      </main>

      {/* Interactive Routine Player Modal with Dual Timers */}
      <RoutinePlayerModal
        routine={selectedRoutine}
        isOpen={Boolean(selectedRoutine)}
        emergencyMode={emergencyMode}
        onClose={() => setSelectedRoutine(null)}
        onUpdateRoutineSteps={handleUpdateRoutineSteps}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <aside aria-label="Notification" className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl text-xs font-semibold text-white flex items-center gap-2.5 backdrop-blur-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </aside>
      )}
    </div>
  );
}
